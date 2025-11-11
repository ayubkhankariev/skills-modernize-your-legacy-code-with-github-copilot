const path = require('path');
const fsp = require('fs').promises;
const app = require('../index');

const DATA_FILE = path.resolve(__dirname, '..', 'data.json');
const LOG_DIR = path.resolve(__dirname, '..', 'logs');

async function writeData(arr) {
  await fsp.writeFile(DATA_FILE, JSON.stringify(arr, null, 2), 'utf8');
}

describe('Accounting app unit tests (mirror TESTPLAN)', () => {
  beforeEach(async () => {
    // prepare initial data
    const oldDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();
    const initial = [
      { studentId: 'S100', name: 'Dup Tester', balance: 0, lastPayment: new Date().toISOString(), status: 'ACTIVE' },
      { studentId: 'S300', name: 'Partial Payer', balance: 1000, lastPayment: new Date().toISOString(), status: 'ACTIVE' },
      { studentId: 'S310', name: 'Full Payer', balance: 500, lastPayment: new Date().toISOString(), status: 'ACTIVE' },
      { studentId: 'S320', name: 'Over Payer', balance: 200, lastPayment: new Date().toISOString(), status: 'ACTIVE' },
      { studentId: 'S330', name: 'Overdue User', balance: 0, lastPayment: oldDate, status: 'ACTIVE' },
      { studentId: 'S340', name: 'To Close', balance: 50, lastPayment: new Date().toISOString(), status: 'ACTIVE' }
    ];
    await writeData(initial);
    // ensure logs dir exists and clear log file
    try {
      await fsp.mkdir(LOG_DIR, { recursive: true });
      await fsp.writeFile(path.join(LOG_DIR, 'app.log'), '', 'utf8');
    } catch (e) {
      // ignore
    }
  });

  test('TC-001 duplicate student-id is rejected', async () => {
    const res = await app.createAccount({ studentId: 'S100', name: 'X', balance: 0 });
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/Duplicate/);
  });

  test('TC-002 create account with required fields', async () => {
    const res = await app.createAccount({ studentId: 'S200', name: 'New User', balance: 0 });
    expect(res.success).toBe(true);
    const data = await app.loadData();
    const found = data.find(d => d.studentId === 'S200');
    expect(found).toBeTruthy();
    expect(found.name).toBe('New User');
  });

  test('TC-003 validation - missing name', async () => {
    const res = await app.createAccount({ studentId: 'S201', name: '', balance: 0 });
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/name is required/);
  });

  test('TC-004 apply partial payment reduces balance', async () => {
    const res = await app.applyPayment('S300', 400);
    expect(res.success).toBe(true);
    expect(Number(res.record.balance)).toBe(600);
  });

  test('TC-005 apply full payment sets balance to zero', async () => {
    const res = await app.applyPayment('S310', 500);
    expect(res.success).toBe(true);
    expect(Number(res.record.balance)).toBe(0);
  });

  test('TC-006 overpayment results in negative balance (credit)', async () => {
    const res = await app.applyPayment('S320', 300);
    expect(res.success).toBe(true);
    expect(Number(res.record.balance)).toBe(-100);
  });

  test('TC-007 charge fees for overdue accounts', async () => {
    const before = (await app.loadData()).find(r => r.studentId === 'S330');
    expect(before).toBeTruthy();
    const res = await app.chargeFeesAll();
    expect(res.changed).toBeGreaterThanOrEqual(1);
    const after = (await app.loadData()).find(r => r.studentId === 'S330');
    expect(Number(after.balance)).toBeGreaterThan(Number(before.balance));
  });

  test('TC-010 cannot close account with positive balance', async () => {
    const res = await app.closeAccount('S340');
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/cannot close account/);
  });

  test('listAccounts returns all records', async () => {
    const all = await app.listAccounts();
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBeGreaterThanOrEqual(6);
  });
});
