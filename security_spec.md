# CampusVault Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Identity Ownership Invariant**: Every document in `/budgets/{budgetId}`, `/expenses/{expenseId}`, and `/investments/{investmentId}` must belong exclusively to the authenticated, email-verified user (`userId == request.auth.uid && request.auth.token.email_verified == true`). For `/budgets/{budgetId}`, `budgetId` must strictly equal `request.auth.uid`.
2. **Schema & Key Strictness Invariant**: Every create and update operation must pass a dedicated `isValid[Entity](incoming())` helper enforcing exact required and allowed keys (`keys().hasAll(...) && keys().hasOnly(...)`), strict data types, string length bounds, regex patterns, numeric boundaries, and enum memberships.
3. **Temporal & Immutable Field Invariant**: `createdAt` must equal `request.time` on creation and remain immutable on update (`incoming().createdAt == existing().createdAt`). `updatedAt` must equal `request.time` on creation and update. `userId` is strictly immutable after creation.
4. **Query Enforcer Invariant**: `allow list` rules on `/expenses` and `/investments` must never rely on client filtering; they must explicitly check `resource.data.userId == request.auth.uid`.

## 2. The "Dirty Dozen" Payloads
1. **Unverified Email Spoof**: Authenticated user with `email_verified: false` attempting to create a `/budgets/{uid}` document.
2. **Cross-User Budget Hijack**: Authenticated user `uid_A` attempting to create `/budgets/uid_B` or set `userId: "uid_B"`.
3. **Shadow Field Injection (Budget)**: Creating `/budgets/{uid}` with an undeclared field `"isAdmin": true`.
4. **Negative Allowance Poisoning**: Updating `/budgets/{uid}` with `monthlyAllowance: -5000`.
5. **Alert Threshold Out-of-Bounds**: Updating `/budgets/{uid}` with `alertThresholdPercent: 250` (must be between 50 and 100).
6. **Expense Category Enum Bypass**: Creating `/expenses/exp_1` with `category: "Illegal Gambling"` (not in allowed enum).
7. **Denial-of-Wallet Oversized Title**: Creating `/expenses/exp_2` with a 5,000-character `title` string (exceeds `maxLength: 120`).
8. **Malformed Date String Injection**: Creating `/expenses/exp_3` with `dateStr: "02/10/2026"` instead of `YYYY-MM-DD`.
9. **Client Timestamp Forgery**: Creating `/expenses/exp_4` with a forged past timestamp `createdAt != request.time`.
10. **Immutable Ownership Swap on Update**: Updating `/investments/inv_1` where `incoming().userId != existing().userId`.
11. **Invalid Asset Class Allocation**: Creating `/investments/inv_2` with `assetClass: "Meme Penny Stocks"` (outside the 5 supported asset classes).
12. **Unfiltered Collection Scraping**: Executing a `list` query on `/expenses` without `where('userId', '==', request.auth.uid)` or attempting to read another student's expenses.
