# FinTrack architecture

FinTrack is a React/Vite/TypeScript application and an Express/TypeScript API backed by MongoDB. The browser calls `/api/v1` through Vite's proxy in development; Express serves the production frontend under the same origin. A local MongoDB installation is sufficient for development; no cloud account is required.

## Boundaries

- `frontend/src/pages`: route composition and page interactions.
- `frontend/src/components`: shared accessible controls, navigation, charts, forms and the optional 3D scene.
- `frontend/src/lib`: typed API client, auth, query cache, currency and dates.
- `backend/src/models`: Mongoose schemas and indexes.
- `backend/src/services`: business rules, aggregates and user ownership.
- `backend/src/routes`: validated HTTP entry points.
- `backend/src/middleware`: authentication, origin checks and error handling.
- `backend/tests`: database-backed API and business-rule regression tests.

## Records and invariants

User has many Buckets, BucketBudgets and Transactions. A bucket budget is unique per user, bucket and month. All money is integer minor units. Transactions use UTC instants with calendar dates interpreted in the account timezone. Month boundaries and aggregation grouping use that same timezone. Totals are derived from MongoDB transactions, never cached in bucket documents. Archived buckets remain visible in history. No client-supplied owner ID is accepted.

JWT sessions use HttpOnly, SameSite=Lax cookies, Secure in production, with a server-side session version for logout/password-change revocation. Mutating browser requests must come from the configured origin. Password hashes are excluded from queries and responses. Zod validates all incoming data. Authentication is rate limited, and Helmet supplies security headers.

The monthly planner submits a validated batch of owned, active bucket assignments. All ownership checks finish before the first write. Each upsert targets a single user, bucket and month; other months remain untouched. Standalone MongoDB does not make this multi-document batch transactional: a database failure during the write can leave partial progress. Repeating the same plan safely converges to the intended amounts.

TanStack Query invalidates finance queries after successful mutations, so the dashboard, bucket views and reports derive fresh totals from the same records. Expense creation supports a per-user idempotency key: identical retries return the original record, while conflicting payloads return 409. An application error boundary provides a recoverable screen for unexpected rendering errors.

## Preview and production

An optional demo login creates a separate database-backed sample workspace. It is visibly labeled and never populates a real registration. Demo access defaults off in production. Production requires a MongoDB connection string, a strong JWT secret and a configured origin. The requested Express/MongoDB stack is prepared for a Node host rather than being replaced with a Cloudflare-only storage stack.

## Implementation sequence

1. Setup and design system.
2. Frontend shell, route pages and reusable interactions.
3. Database, validation and REST API.
4. Auth, expenses, buckets and monthly budgets integrated through TanStack Query.
5. Live analytics, reports and data-derived notifications.
6. Regression tests, responsive browser checks and refinement.
7. Production build, setup/API/deployment documentation and screenshots.
