const path = require('path');

beforeEach(() => {
  // reload fresh module to reset in-memory storageBalance
  jest.resetModules();
});

test('TC-001 View current balance (default 1000.00)', () => {
  const app = require('../index');
  expect(app.readBalance()).toBeCloseTo(1000.00, 2);
});

test('TC-002 Credit account (normal)', () => {
  const app = require('../index');
  const res = app.credit(250.50);
  expect(res.ok).toBe(true);
  expect(res.newBalance).toBeCloseTo(1250.50, 2);
  expect(app.readBalance()).toBeCloseTo(1250.50, 2);
});

test('TC-003 Debit account (sufficient funds)', () => {
  const app = require('../index');
  // set balance to 1250.50
  app.writeBalance(1250.50);
  const res = app.debit(200.00);
  expect(res.ok).toBe(true);
  expect(res.newBalance).toBeCloseTo(1050.50, 2);
  expect(app.readBalance()).toBeCloseTo(1050.50, 2);
});

test('TC-004 Debit account (insufficient funds)', () => {
  const app = require('../index');
  app.writeBalance(100.00);
  const res = app.debit(200.00);
  expect(res.ok).toBe(false);
  expect(res.reason).toBe('insufficient-funds');
  // balance unchanged
  expect(app.readBalance()).toBeCloseTo(100.00, 2);
});

test('TC-007 Non-numeric or malformed amount input', () => {
  const app = require('../index');
  const a = app.parseAmountInput('abc');
  expect(a.ok).toBe(false);
  expect(a.reason).toBe('non-numeric');

  const b = app.parseAmountInput('-100');
  expect(b.ok).toBe(true);
  expect(b.value).toBeCloseTo(-100.00, 2);

  const c = app.parseAmountInput('1e3');
  expect(c.ok).toBe(true);
  expect(c.value).toBeCloseTo(1000.00, 2);
});

test('TC-008 Amount exceeding PIC limits (overflow)', () => {
  const app = require('../index');
  const res = app.parseAmountInput('1000000.00');
  expect(res.ok).toBe(false);
  expect(res.reason).toBe('overflow');
});

test('TC-009 Persistence across restarts (no persistence)', () => {
  // simulate credit, then restart module
  let app = require('../index');
  const r = app.credit(100.00);
  expect(r.ok).toBe(true);
  expect(app.readBalance()).toBeCloseTo(1100.00, 2);

  // simulate restart by resetting modules and re-requiring
  jest.resetModules();
  app = require('../index');
  // storageBalance should be reset to default 1000.00
  expect(app.readBalance()).toBeCloseTo(1000.00, 2);
});

test('TC-011 Boundary: zero amount credit/debit', () => {
  const app = require('../index');
  app.writeBalance(500.00);
  const c = app.credit(0.00);
  // current implementation treats as no-op but successful
  expect(c.ok).toBe(true);
  expect(c.newBalance).toBeCloseTo(500.00, 2);

  const d = app.debit(0.00);
  expect(d.ok).toBe(true);
  expect(d.newBalance).toBeCloseTo(500.00, 2);
});

// TC-005 (Exit), TC-006 (Invalid menu choice), TC-010 (Concurrency) are UI/manual or multi-process
// tests and are marked as TODO for integration/acceptance testing.

test.todo('TC-005 Menu: Exit option (manual/interactive)');
test.todo('TC-006 Invalid menu choice (manual/interactive)');
test.todo('TC-010 Concurrency / multi-instance updates (integration)');
