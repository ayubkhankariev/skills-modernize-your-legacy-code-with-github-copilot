# Test Plan — COBOL Account Management App

Этот тест-план покрывает всю текущую бизнес-логику COBOL-приложения (см. `src/cobol/main.cob`, `src/cobol/operations.cob`, `src/cobol/data.cob`). Таблица подготовлена для согласования с бизнес-стейкхолдерами и последующей автоматизации тестов при миграции на Node.js.

| Test Case ID | Test Case Description | Pre-conditions | Test Steps | Expected Result | Actual Result | Status (Pass/Fail) | Comments |
|---|---|---|---|---|---|---|---|
| TC-001 | View current balance | App compiled and running; `STORAGE-BALANCE` = 1000.00 (default) | 1) Start app 2) Choose menu option `1` | App calls `DataProgram` with `READ` and displays `Current balance: 1000.00` |  |  | Confirms read-path and initial balance |
| TC-002 | Credit account (normal) | `STORAGE-BALANCE` = 1000.00 | 1) Start app 2) Choose `2` (Credit) 3) Enter `250.50` | App reads balance, adds 250.50, writes new balance (1250.50) and displays it |  |  | Verifies credit path and write to storage |
| TC-003 | Debit account (sufficient funds) | `STORAGE-BALANCE` = 1250.50 | 1) Start app 2) Choose `3` (Debit) 3) Enter `200.00` | App reads balance, verifies 1250.50 >= 200.00, subtracts and writes new balance (1050.50) and displays it |  |  | Verifies debit success path and write to storage |
| TC-004 | Debit account (insufficient funds) | `STORAGE-BALANCE` = 100.00 | 1) Start app 2) Choose `3` (Debit) 3) Enter `200.00` | App reads balance, sees 100.00 < 200.00, displays `Insufficient funds for this debit.` and does NOT change storage balance |  |  | Verifies debit rejection logic |
| TC-005 | Menu: Exit option | App running | 1) Start app 2) Choose `4` | App sets continue flag to 'NO', displays exit message `Exiting the program. Goodbye!` and terminates |  |  | Confirms graceful exit behavior |
| TC-006 | Invalid menu choice | App running | 1) Start app 2) Enter `9` (or other invalid) | App displays `Invalid choice, please select 1-4.` and re-displays menu (no crash) |  |  | Confirms input handling for menu selection |
| TC-007 | Non-numeric or malformed amount input | App running; choose Credit or Debit | 1) Choose `2` or `3` 2) Enter `abc` or `-100` or `1e3` | Desired: app validates and rejects bad input with friendly message. Current app: no explicit validation — behavior may be undefined or cause runtime error. Record actual behavior. |  |  | Stakeholder decision: accept current behavior or require validation |
| TC-008 | Amount exceeding PIC limits (overflow) | App running; `STORAGE-BALANCE` near max | 1) Choose `2` (Credit) 2) Enter `1000000.00` (1,000,000.00) | Desired: validation prevents amounts > 999999.99. Current app: no check; may overflow or truncate. Record actual behavior. |  |  | PIC `9(6)V99` max = 999999.99 |
| TC-009 | Persistence across restarts | App: apply credit, then restart program | 1) Start app 2) Credit `100.00` 3) Exit 4) Restart app 5) View balance | Desired (for production): new balance persists. Current app: `STORAGE-BALANCE` initialized to 1000.00 on each run — no persistence. |  |  | Accept or require file/DB persistence as enhancement |
| TC-010 | Concurrency / multi-instance updates | Two instances of app running simultaneously | 1) Start two instances A and B 2) In A credit `100.00` 3) In B credit `50.00` (timing may vary) 4) Read final balances in both instances | Desired: serializable updates with persistent storage. Current: no concurrency control; race conditions possible. Record actual observed outcome. |  |  | For stakeholders: define concurrency expectations |
| TC-011 | Boundary: zero amount credit/debit | App running | 1) Choose `2` or `3` 2) Enter `0.00` | Desired: system either treats as no-op or rejects zero-amount operations. Current behavior: unspecified. Record actual behavior. |  |  | Clarify acceptable business rule for zero transactions |

Notes for stakeholders:

- Initial balance is in-memory only and set to `1000.00` by default in `data.cob` (`STORAGE-BALANCE`).
- Monetary fields use `PIC 9(6)V99` (max `999999.99`).
- The app currently lacks input validation (non-numeric, negative, out-of-range values) and persistence; those are recommended items to accept or to change before production use.
- For each test case, fill `Actual Result` and `Status` during validation sessions. Use `Comments` to capture follow-up actions or required behavior changes.

Если хотите, могу:
- запустить ряд автоматизированных сценариев сейчас (интерактивно или с `printf`), записать фактические результаты и заполнить столбцы `Actual Result` и `Status`, или
- подготовить набор unit/integration тестов в Node.js на основе этой таблицы.

***Конец тест-плана***
