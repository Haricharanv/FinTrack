# Database design

## Collections

**User**: name, unique lowercased email, passwordHash (bcrypt, excluded by default), currency, IANA timezone, sessionVersion (excluded by default), isDemo, createdAt, updatedAt.

**Bucket**: userId, name, normalized nameKey, icon, color, isDefault, isArchived, sortOrder, timestamps. Every registration owns its own defaults. The `userId + nameKey` unique index applies only while `isArchived=false`.

**BucketBudget**: userId, bucketId, monthKey, amount in minor units, timestamps. Unique compound index on `userId + bucketId + monthKey`. Zero is allowed. Budget updates never overwrite a different month.

**Transaction**: userId, bucketId, type (`expense`), description, positive integer amount, transactionDate (UTC), optional notes, optional UUID requestId, timestamps. Indexes: `userId + transactionDate`, `userId + bucketId + transactionDate`, and a partial unique `userId + requestId` index for idempotency.

## Aggregation and ownership

Every query includes the authenticated user’s MongoDB ID. Cross-account lookups return 404. Bucket existence and ownership are validated before creating or moving an expense or assigning a budget. No totals are stored on buckets. Spending is derived with `$match` and `$group` pipelines scoped by user, bucket and timezone-aware month boundaries.

Daily and monthly groupings use `$dateToString` with the user’s IANA timezone. Date-only entries are stored at local noon to avoid accidental boundary shifts during normal entry. Historical records are retained when a bucket is archived. Archived buckets with existing spending or budgets remain in reports.

## Local vs hosted

Local development uses `fintrack` on `127.0.0.1:27017`. API tests use and remove only their own unique `fintrack_test_*` database. Production points to MongoDB Atlas or another MongoDB deployment through `MONGODB_URI`.

Each write to a single transaction or monthly budget is atomic in MongoDB. Creating a user/default buckets or a custom bucket/initial budget spans collections; the local standalone-compatible implementation includes cleanup on creation failure. Deployments requiring atomic multi-collection administrative workflows can extend this with MongoDB replica-set transactions.
