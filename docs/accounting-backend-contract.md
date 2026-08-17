# Artemis Accounting & Tax backend contract

The `/accounting` interface is the first Ridge Four Ledger slice inside Artemis.
Its current device-local storage is a temporary frontend bridge. Production data
must move to the authenticated FastAPI/PostgreSQL backend before real books are
entered.

## Access

- Require the existing JWT on every route.
- Initial access: `ExecutiveAdmin` and `SuperAdmin` only.
- Scope every record to `firm_id`; never accept a client-supplied firm without
  verifying that the logged-in user may access it.
- Record created/updated timestamps and user IDs for the audit trail.

## Tables

### accounting_entries

- `id` bigint primary key
- `firm_id` foreign key, indexed
- `entry_type`: income, expense, invoice, bill, contractor, shareholder
- `entry_date` date
- `name` text
- `category` text
- `amount_cents` bigint
- `status` text
- `memo` text
- `created_by_user_id` foreign key
- `created_at`, `updated_at`

### contractors

- legal/business name, address, email
- tax classification
- encrypted TIN reference (do not expose full TIN in list responses)
- W-9 status/date
- year-to-date reportable payments

### tax_deadlines

- jurisdiction, form name, period, due date, filed/paid status
- confirmation reference and non-sensitive attachment metadata

### shareholder_activity

- shareholder user ID
- activity type: contribution, distribution, loan, repayment, payroll,
  accountable-plan reimbursement
- amount/date/memo and supporting entry ID

## API

- `GET /accounting/summary?firm_id=`
- `GET /accounting/entries?firm_id=&type=&status=&from=&to=`
- `POST /accounting/entries`
- `PATCH /accounting/entries/{id}`
- `GET /accounting/contractors?firm_id=&tax_year=`
- `POST /accounting/contractors`
- `GET /accounting/tax-calendar?firm_id=&tax_year=`
- `PATCH /accounting/tax-calendar/{id}`
- `GET /accounting/reports/profit-loss?firm_id=&from=&to=`
- `GET /accounting/reports/export?firm_id=&tax_year=`

## Next implementation order

1. Alembic migration and SQLAlchemy models.
2. Firm-scoped entry CRUD and summary endpoint.
3. Replace device-local storage in `/accounting` with authenticated API calls.
4. Contractor/W-9 tracking and 1099-NEC export.
5. Shareholder basis/distribution ledger.
6. Receipt uploads, bank imports, reconciliation, and accountant exports.

Artemis should prepare schedules and exports; payroll and tax-return transmission
should remain with the payroll provider and tax professional until separately
validated and authorized.
