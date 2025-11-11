#!/usr/bin/env node
const inquirer = require('inquirer');
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');

const DATA_FILE = path.resolve(__dirname, 'data.json');
const LOG_DIR = path.resolve(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');

const FEE_DAYS_THRESHOLD = 30; // N days after last payment to charge fee
const FEE_AMOUNT = 25; // fixed fee for overdue accounts (adjustable)

async function ensureDataFile() {
  try {
    await fsp.access(DATA_FILE);
  } catch (e) {
    await saveData([]);
  }
}

async function loadData() {
  await ensureDataFile();
  const raw = await fsp.readFile(DATA_FILE, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    await log('ERROR', `Failed to parse data.json: ${err.message}`);
    return [];
  }
}

async function saveData(data) {
  // write-then-rename to preserve integrity
  const tmp = DATA_FILE + '.tmp';
  const json = JSON.stringify(data, null, 2);
  await fsp.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fsp.writeFile(tmp, json, 'utf8');
  await fsp.rename(tmp, DATA_FILE);
}

async function log(level, msg) {
  await fsp.mkdir(LOG_DIR, { recursive: true });
  const line = `${new Date().toISOString()} [${level}] ${msg}\n`;
  await fsp.appendFile(LOG_FILE, line, 'utf8');
}

function validateRecord(rec) {
  if (!rec.studentId || String(rec.studentId).trim() === '') return 'student-id is required';
  if (!rec.name || String(rec.name).trim() === '') return 'name is required';
  if (rec.balance === undefined || rec.balance === null || Number.isNaN(Number(rec.balance))) return 'balance is required and must be a number';
  return null;
}

async function createAccount(answers) {
  const data = await loadData();
  if (data.find(r => r.studentId === answers.studentId)) {
    await log('ERROR', `Duplicate student-id: ${answers.studentId}`);
    return { success: false, message: 'Duplicate student-id' };
  }

  const rec = {
    studentId: answers.studentId,
    name: answers.name,
    balance: Number(answers.balance),
    lastPayment: answers.lastPayment || null,
    status: answers.status || 'ACTIVE'
  };

  const v = validateRecord(rec);
  if (v) {
    await log('ERROR', `Validation failed for ${rec.studentId}: ${v}`);
    return { success: false, message: v };
  }

  data.push(rec);
  await saveData(data);
  await log('INFO', `Created account ${rec.studentId}`);
  return { success: true };
}

async function applyPayment(studentId, amount) {
  const data = await loadData();
  const rec = data.find(r => r.studentId === studentId);
  if (!rec) {
    await log('ERROR', `APPLY-PAYMENT: record not found ${studentId}`);
    return { success: false, message: 'record not found' };
  }
  const prev = rec.balance;
  rec.balance = Number(rec.balance) - Number(amount);
  rec.lastPayment = new Date().toISOString();
  await saveData(data);
  await log('INFO', `APPLY-PAYMENT: ${studentId} amount=${amount} prev=${prev} now=${rec.balance}`);
  return { success: true, record: rec };
}

async function chargeFeeIfOverdue(rec) {
  if (!rec.lastPayment) return false;
  const last = new Date(rec.lastPayment);
  const now = new Date();
  const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
  if (diffDays > FEE_DAYS_THRESHOLD) {
    const prev = rec.balance;
    rec.balance = Number(rec.balance) + FEE_AMOUNT;
    await log('INFO', `CHARGE-FEE: ${rec.studentId} +${FEE_AMOUNT} prev=${prev} now=${rec.balance}`);
    return true;
  }
  return false;
}

async function chargeFeesAll() {
  const data = await loadData();
  let changed = 0;
  for (const rec of data) {
    const applied = await chargeFeeIfOverdue(rec);
    if (applied) changed++;
  }
  if (changed > 0) await saveData(data);
  return { changed };
}

async function listAccounts() {
  const data = await loadData();
  return data;
}

async function closeAccount(studentId) {
  const data = await loadData();
  const rec = data.find(r => r.studentId === studentId);
  if (!rec) return { success: false, message: 'not found' };
  if (Number(rec.balance) > 0) {
    return { success: false, message: 'cannot close account with outstanding balance' };
  }
  rec.status = 'CLOSED';
  await saveData(data);
  await log('INFO', `CLOSE-ACCOUNT: ${studentId}`);
  return { success: true };
}

async function mainMenu() {
  while (true) {
    const { action } = await inquirer.prompt([{
      type: 'list', name: 'action', message: 'Choose action', choices: [
        { name: 'List accounts', value: 'list' },
        { name: 'Create account', value: 'create' },
        { name: 'Apply payment', value: 'pay' },
        { name: 'Charge overdue fees', value: 'charge' },
        { name: 'Close account', value: 'close' },
        { name: 'Exit', value: 'exit' }
      ]
    }]);

    if (action === 'exit') {
      console.log('Goodbye');
      break;
    }

    try {
      if (action === 'list') {
        const rows = await listAccounts();
        console.table(rows.map(r => ({ studentId: r.studentId, name: r.name, balance: r.balance, status: r.status })));
      } else if (action === 'create') {
        const answers = await inquirer.prompt([
          { name: 'studentId', message: 'student-id' },
          { name: 'name', message: 'name' },
          { name: 'balance', message: 'initial balance', default: '0' },
          { name: 'lastPayment', message: 'last payment date (ISO) optional', default: '' },
        ]);
        const res = await createAccount(answers);
        console.log(res.success ? 'Created' : `Failed: ${res.message}`);
      } else if (action === 'pay') {
        const answers = await inquirer.prompt([
          { name: 'studentId', message: 'student-id' },
          { name: 'amount', message: 'payment amount' },
        ]);
        const res = await applyPayment(answers.studentId, answers.amount);
        console.log(res.success ? 'Payment applied' : `Failed: ${res.message}`);
      } else if (action === 'charge') {
        const res = await chargeFeesAll();
        console.log(`Fees applied to ${res.changed} accounts`);
      } else if (action === 'close') {
        const { studentId } = await inquirer.prompt([{ name: 'studentId', message: 'student-id' }]);
        const res = await closeAccount(studentId);
        console.log(res.success ? 'Closed' : `Failed: ${res.message}`);
      }
    } catch (err) {
      console.error('Error:', err.message);
      await log('ERROR', `Unhandled error in menu: ${err.stack || err.message}`);
    }
  }
}

if (require.main === module) {
  (async () => {
    await ensureDataFile();
    console.log('Student Accounts — Node.js port (interactive)');
    await mainMenu();
  })();
}

module.exports = {
  loadData,
  saveData,
  createAccount,
  applyPayment,
  chargeFeesAll,
  listAccounts,
  closeAccount,
  validateRecord,
};
