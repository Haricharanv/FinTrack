# FinTrack REST API

Base: `/api/v1`. JSON requests and responses. Authentication uses the `ft_session` HttpOnly cookie; browser requests send credentials automatically. No caller-supplied user IDs are accepted.

Success: `{ "success": true, "data": ... }`.

Error: `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "fields": [{ "field": "amount", "message": "..." }] } }`. `fields` is present on validation errors only.

All amounts are **integer minor units**: ₹120.50 is `12050`. Calendar dates use `YYYY-MM-DD`; month keys use `YYYY-MM`. Dates are interpreted in the authenticated user’s timezone. Expense dates cannot be in the future. Unsupported fields are rejected.

## Authentication

| Method | Path                    | Request / result                                                         |
| ------ | ----------------------- | ------------------------------------------------------------------------ |
| POST   | `/auth/register`        | `{name, email, password, timezone?}` → `{user}`; creates eleven defaults |
| POST   | `/auth/login`           | `{email, password}` → `{user}`                                           |
| POST   | `/auth/logout`          | Revokes the user’s sessions and clears the cookie                        |
| GET    | `/auth/me`              | `{user}`; no hashes or session version exposed                           |
| PATCH  | `/auth/profile`         | Optional `{name, currency, timezone}` → `{user}`                         |
| PATCH  | `/auth/change-password` | `{currentPassword, newPassword}`; rotates the current session            |
| GET    | `/auth/config`          | `{demoEnabled}`                                                          |
| POST   | `/auth/demo`            | Creates an isolated sample workspace when enabled                        |

Passwords: 10–72 characters and no more than 72 UTF-8 bytes. Currencies: INR, USD, EUR, GBP. Timezones must be valid IANA names. Authentication requests are rate limited.

## Buckets and monthly budgets

| Method | Path                                          | Request / result                                                                        |
| ------ | --------------------------------------------- | --------------------------------------------------------------------------------------- |
| GET    | `/buckets?month=2026-11&includeArchived=true` | Bucket views with budget, spending, remaining, utilization and status                   |
| POST   | `/buckets`                                    | `{name, icon, color, monthKey, budget}` → `{id}`                                        |
| GET    | `/buckets/:id?month=2026-11`                  | One owned bucket view                                                                   |
| PATCH  | `/buckets/:id`                                | Any of `{name, icon, color, isArchived, monthKey, budget}`; budget requires monthKey    |
| DELETE | `/buckets/:id`                                | Archives the bucket; preserves history                                                  |
| GET    | `/budgets?month=2026-11`                      | All monthly assignments                                                                 |
| GET    | `/budgets/:bucketId?month=2026-11`            | Assignment, or zero for an unassigned month                                             |
| PUT    | `/budgets`                                    | `{monthKey, items: [{bucketId, amount}]}` → `{monthKey, updated}`; saves a monthly plan |
| PUT    | `/budgets/:bucketId`                          | `{monthKey, amount}`; creates or replaces only that month                               |

Active bucket names are unique per user, case-insensitively. Restoring an archived bucket with a conflicting active name returns 409. Colors must be six-digit hex values. Supported icon keys are listed in `backend/src/validators/index.ts`.

The batch planner accepts 1–200 unique bucket IDs and amounts from 0 to 1,000,000,000 minor units. Every bucket must be owned by the caller and active; all are checked before writing. Only submitted assignments in the selected month are changed. The upserts are retry-safe. Multi-document rollback on a database outage is not provided on standalone MongoDB; see [Architecture](ARCHITECTURE.md).

## Transactions

| Method | Path                | Request / result                                                          |
| ------ | ------------------- | ------------------------------------------------------------------------- |
| GET    | `/transactions`     | `{items, total, page, pages}`                                             |
| POST   | `/transactions`     | `{description, amount, bucketId, date, notes?, requestId?}` → transaction |
| GET    | `/transactions/:id` | One owned transaction                                                     |
| PATCH  | `/transactions/:id` | Any expense fields; refreshes derived totals automatically                |
| DELETE | `/transactions/:id` | Permanently removes one owned transaction                                 |

List query: `month`, `bucketId`, `search`, `from`, `to`, `sort`, `page`, `limit`. `sort` accepts `date-desc`, `date-asc`, `amount-desc`, `amount-asc`. Page size defaults to 12 and is capped at 100. Date ranges are inclusive local calendar days and intersect the month when both are supplied. Searches match literal text, not regular expression syntax.

`requestId` is a UUID. Retrying a creation with the same user and request ID returns the previously created transaction and prevents duplicate expenses, including concurrent requests. A retry must retain the original payload; conflicting amounts, buckets, dates, descriptions or notes return 409 `IDEMPOTENCY_CONFLICT`. New expenses and moves into archived buckets are rejected; corrections to existing archived records are allowed.

## Analytics

| Method | Path                                           | Result                                                                                      |
| ------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------- |
| GET    | `/dashboard/overview?month=2026-11`            | Combined summary, bucket views, six monthly totals, daily totals and five recent expenses   |
| GET    | `/dashboard/summary?month=2026-11`             | Budget, spent, remaining, utilization, status, count, previous-month total, daily allowance |
| GET    | `/dashboard/bucket-breakdown?month=2026-11`    | Bucket views                                                                                |
| GET    | `/dashboard/monthly-trends?month=2026-11`      | Six months ending with the selected month                                                   |
| GET    | `/dashboard/recent-transactions?month=2026-11` | Five recent expenses                                                                        |
| GET    | `/reports/monthly?month=2026-11`               | Full monthly overview                                                                       |
| GET    | `/reports/annual?year=2026`                    | Twelve monthly totals and annual budget/spend totals                                        |

Status: below 80% `normal`, from 80% to below 100% `warning`, exactly 100% `reached`, above 100% `overspending`. A zero budget is `unbudgeted`, with finite zero utilization and the real remaining amount. Budget warnings are generated from these states, not stored as fake notifications.

Overview and monthly reports also include `pace`: `period` (`past`, `current`, `future`), `elapsedDays`, `remainingDays`, `totalDays`, `spendingDays`, `averageDailySpent` and `projectedSpent`. These use the account timezone. The projection is a simple average extrapolation for the current month only; other months return `null`.

`GET /api/health` is public and returns 200 only when MongoDB is connected. API responses are marked `Cache-Control: no-store`.
