#!/usr/bin/env node
// Simple Node.js port of the COBOL Account Management System
// Preserves original menu and business logic (in-memory balance, default 1000.00, no persistence)

const readline = require('readline-sync');

// Storage (in-memory) - corresponds to STORAGE-BALANCE in data.cob
let storageBalance = 1000.00;
const MAX_AMOUNT = 999999.99; // corresponds to PIC 9(6)V99

function displayMenu() {
  console.log('--------------------------------');
  console.log('Account Management System');
  console.log('1. View Balance');
  console.log('2. Credit Account');
  console.log('3. Debit Account');
  console.log('4. Exit');
  console.log('--------------------------------');
}

function readBalance() {
  // Simulates CALL 'DataProgram' USING 'READ'
  return storageBalance;
}

function writeBalance(newBalance) {
  // Simulates CALL 'DataProgram' USING 'WRITE'
  storageBalance = newBalance;
}

function formatAmount(a) {
  return a.toFixed(2);
}

function parseAmountInput(input) {
  // parse string input similar to original promptAmount but separated for testing
  const parsed = parseFloat(input);
  if (Number.isNaN(parsed)) {
    return { ok: false, reason: 'non-numeric', value: null };
  }
  const rounded = Math.round(parsed * 100) / 100;
  if (Math.abs(rounded) > MAX_AMOUNT) {
    return { ok: false, reason: 'overflow', value: rounded };
  }
  return { ok: true, reason: null, value: rounded };
}

function promptAmount(promptText) {
  const input = readline.question(promptText);
  return parseAmountInput(input);
}

function credit(amount) {
  // amount: number
  if (typeof amount !== 'number' || Number.isNaN(amount)) return { ok: false, reason: 'non-numeric' };
  if (Math.abs(amount) > MAX_AMOUNT) return { ok: false, reason: 'overflow' };
  const bal = readBalance();
  const newBal = Math.round((bal + amount) * 100) / 100;
  writeBalance(newBal);
  return { ok: true, newBalance: newBal };
}

function debit(amount) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return { ok: false, reason: 'non-numeric' };
  if (Math.abs(amount) > MAX_AMOUNT) return { ok: false, reason: 'overflow' };
  const bal = readBalance();
  if (bal >= amount) {
    const newBal = Math.round((bal - amount) * 100) / 100;
    writeBalance(newBal);
    return { ok: true, newBalance: newBal };
  }
  return { ok: false, reason: 'insufficient-funds' };
}

function run() {
  let continueFlag = true;
  while (continueFlag) {
    displayMenu();
    const choice = readline.question('Enter your choice (1-4): ');
    switch (choice.trim()) {
      case '1': {
        // TOTAL
        const bal = readBalance();
        console.log('Current balance: ' + formatAmount(bal));
        break;
      }
      case '2': {
        // CREDIT
        const r = promptAmount('Enter credit amount: ');
        if (!r.ok) {
          console.log('Invalid amount: ' + r.reason);
          break;
        }
        const amount = r.value;
        const bal = readBalance();
        const newBal = Math.round((bal + amount) * 100) / 100;
        writeBalance(newBal);
        console.log('Amount credited. New balance: ' + formatAmount(newBal));
        break;
      }
      case '3': {
        // DEBIT
        const r = promptAmount('Enter debit amount: ');
        if (!r.ok) {
          console.log('Invalid amount: ' + r.reason);
          break;
        }
        const amount = r.value;
        const bal = readBalance();
        if (bal >= amount) {
          const newBal = Math.round((bal - amount) * 100) / 100;
          writeBalance(newBal);
          console.log('Amount debited. New balance: ' + formatAmount(newBal));
        } else {
          console.log('Insufficient funds for this debit.');
        }
        break;
      }
      case '4': {
        continueFlag = false;
        break;
      }
      default: {
        console.log('Invalid choice, please select 1-4.');
      }
    }
  }
  console.log('Exiting the program. Goodbye!');
}

if (require.main === module) {
  run();
}

module.exports = { readBalance, writeBalance, promptAmount, parseAmountInput, credit, debit, MAX_AMOUNT };
#!/usr/bin/env node
// Simple Node.js port of the COBOL Account Management System
// Preserves original menu and business logic (in-memory balance, default 1000.00, no persistence)

const readline = require('readline-sync');

// Storage (in-memory) - corresponds to STORAGE-BALANCE in data.cob
let storageBalance = 1000.00;
const MAX_AMOUNT = 999999.99; // corresponds to PIC 9(6)V99

function displayMenu() {
  console.log('--------------------------------');
  console.log('Account Management System');
  console.log('1. View Balance');
  console.log('2. Credit Account');
  console.log('3. Debit Account');
  console.log('4. Exit');
  console.log('--------------------------------');
}

function readBalance() {
  // Simulates CALL 'DataProgram' USING 'READ'
  return storageBalance;
}

function writeBalance(newBalance) {
  // Simulates CALL 'DataProgram' USING 'WRITE'
  storageBalance = newBalance;
}

function formatAmount(a) {
  return a.toFixed(2);
}

function parseAmountInput(input) {
  // parse string input similar to original promptAmount but separated for testing
  const parsed = parseFloat(input);
  if (Number.isNaN(parsed)) {
    return { ok: false, reason: 'non-numeric', value: null };
  }
  const rounded = Math.round(parsed * 100) / 100;
  if (Math.abs(rounded) > MAX_AMOUNT) {
    return { ok: false, reason: 'overflow', value: rounded };
  }
  return { ok: true, reason: null, value: rounded };
}

function promptAmount(promptText) {
  const input = readline.question(promptText);
  return parseAmountInput(input);
}

function credit(amount) {
  // amount: number
  if (typeof amount !== 'number' || Number.isNaN(amount)) return { ok: false, reason: 'non-numeric' };
  if (Math.abs(amount) > MAX_AMOUNT) return { ok: false, reason: 'overflow' };
  const bal = readBalance();
  const newBal = Math.round((bal + amount) * 100) / 100;
  writeBalance(newBal);
  return { ok: true, newBalance: newBal };
}

function debit(amount) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return { ok: false, reason: 'non-numeric' };
  if (Math.abs(amount) > MAX_AMOUNT) return { ok: false, reason: 'overflow' };
  const bal = readBalance();
  if (bal >= amount) {
    const newBal = Math.round((bal - amount) * 100) / 100;
    writeBalance(newBal);
    return { ok: true, newBalance: newBal };
  }
  return { ok: false, reason: 'insufficient-funds' };
}

function run() {
  let continueFlag = true;
  while (continueFlag) {
    displayMenu();
    const choice = readline.question('Enter your choice (1-4): ');
    switch (choice.trim()) {
      case '1': {
        // TOTAL
        const bal = readBalance();
        console.log('Current balance: ' + formatAmount(bal));
        break;
      }
      case '2': {
        // CREDIT
        const r = promptAmount('Enter credit amount: ');
        if (!r.ok) {
          console.log('Invalid amount: ' + r.reason);
          break;
        }
        const amount = r.value;
        const bal = readBalance();
        const newBal = Math.round((bal + amount) * 100) / 100;
        writeBalance(newBal);
        console.log('Amount credited. New balance: ' + formatAmount(newBal));
        break;
      }
      case '3': {
        // DEBIT
        const r = promptAmount('Enter debit amount: ');
        if (!r.ok) {
          console.log('Invalid amount: ' + r.reason);
          break;
        }
        const amount = r.value;
        const bal = readBalance();
        if (bal >= amount) {
          const newBal = Math.round((bal - amount) * 100) / 100;
          writeBalance(newBal);
          console.log('Amount debited. New balance: ' + formatAmount(newBal));
        } else {
          console.log('Insufficient funds for this debit.');
        }
        break;
      }
      case '4': {
        continueFlag = false;
        break;
      }
      default: {
        console.log('Invalid choice, please select 1-4.');
      }
    }
  }
  console.log('Exiting the program. Goodbye!');
}

if (require.main === module) {
  run();
}

module.exports = { readBalance, writeBalance, promptAmount, parseAmountInput, credit, debit, MAX_AMOUNT };
