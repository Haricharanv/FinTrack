# Verification

## Automated checks

Run `npm run typecheck`, `npm test`, and `npm run build` from the repository root.

The integration suite in `backend/tests/finance.test.ts` uses real MongoDB and Express with Supertest. It covers:

1. Registration, eleven private defaults, empty initial data and password-hash exclusion.
2. Authentication failures and duplicate email handling.
3. HttpOnly/SameSite session cookies.
4. ₹5,000 budget minus ₹1,000 expense = ₹4,000 remaining.
5. Adding ₹500 → ₹1,500 spent.
6. Editing ₹500 to ₹700 → ₹1,700 spent.
7. Moving an expense updates both buckets.
8. Deleting the second expense → ₹1,000 spent.
9. December budget changes preserve November.
10. Safe zero-budget and exact warning thresholds.
11. API status transitions at 80%, 100% and over budget.
12. Cross-user bucket/budget ownership checks.
13. Cross-user transaction read/edit/delete isolation.
14. Input validation, forged ownership, invalid IDs/dates, noninteger minor units and future dates.
15. Case-insensitive duplicate active bucket names.
16. Custom bucket and initial monthly budget creation.
17. Concurrent duplicate submission protection.
18. Archive, correction, history and restore behavior.
19. Search, pagination, sort, date-range filtering and literal regex characters.
20. Changing transaction dates recalculates monthly totals.
21. IANA timezone and DST month boundaries.
22. Monthly/annual report reconciliation.
23. Origin and cross-site request rejection.
24. Profile validation, password rotation and old-session revocation.
25. Logout rejects replay of the old session cookie.
26. Batch monthly planning updates multiple buckets without changing historical months.
27. A foreign bucket rejects the entire submitted plan before any assignment is written.
28. Planner validation rejects duplicate buckets, fractional minor units, malformed months, forged ownership and empty plans.
29. Archived buckets cannot receive a new plan assignment.
30. Zero budgets and repeated plan submissions remain valid and deterministic.
31. Spending pace uses correct historical and current calendar periods.
32. Reusing an expense request ID with a different payload returns a conflict.

Each run creates a unique test database and removes only that database after completion. The local development database is never reset by tests.

## Browser checklist

- [x] Demo login opens an isolated, labeled MongoDB workspace.
- [x] Add an expense with decimal paise and no optional notes; the form clears and the bucket balance updates.
- [x] Saved expense appears in transaction history.
- [x] Edit a transaction amount; the row and bucket total update.
- [x] Create a custom bucket with an icon and monthly limit.
- [x] Switch months and inspect historical reports.
- [x] Download CSV from the selected month; October's 24 rows and totals match the report.
- [x] Check desktop and mobile layouts and navigation at 375, 768, 1024 and 1440 pixels; no document overflow.
- [x] Check browser error logs after core workflows; no warnings or errors captured.
- [x] Capture final desktop dashboard, mobile dashboard and mobile expense screenshots.
- [x] Open the compiled frontend through Express on port 4000; authenticated data, charts and 3D load with no browser warnings or errors under the configured CSP.
- [x] Reject an invalid planner amount with more than two decimal places and display a useful error.
- [x] Copy November's plan into December, adjust Food from ₹8,500 to ₹9,000, and save the ₹60,500 total. Reload and confirm the December plan persists while November remains ₹60,000 with its original Food limit.
- [x] Show guided first steps for a month with no budget or expenses.
- [x] Show a field-level error for a one-character profile name without saving it.
- [x] Inspect the refreshed dashboard and planner at 375, 768, 1024 and 1440 pixels; fix hero clipping after modal focus restoration and confirm no document overflow.

## Verified result

On November 10, 2026, all 32 MongoDB integration tests passed. Both workspaces passed TypeScript checks and the production build. The build reports non-fatal dependency annotation and chunk-size notices; charts and the 3D renderer are split into separate chunks, with the renderer loaded on demand. GitHub Actions is configured to repeat these checks with Node 22 and a MongoDB 8 service.

Screenshots use a clearly labeled demo account with sample data, including records created during browser testing:

- [Desktop dashboard](screenshots/dashboard-desktop.jpg)
- [Mobile dashboard](screenshots/dashboard-mobile.jpg)
- [Mobile expense entry](screenshots/expense-mobile.jpg)
- [Monthly budget planner](screenshots/budget-planner.jpg)

The UI uses Radix Dialog for focus trapping, Escape dismissal and focus restoration. Motion respects the operating system’s reduced-motion preference; the 3D canvas has a non-WebGL fallback and stops animating when offscreen. Manual browser inspection is documented rather than presented as a formal accessibility certification.
