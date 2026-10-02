/**
 * Security Rules Verification Suite for CampusVault
 * Verifies that all "Dirty Dozen" adversarial payloads return PERMISSION_DENIED.
 */

export interface DirtyPayloadTestCase {
  id: number;
  name: string;
  collection: string;
  docId: string;
  operation: 'create' | 'update' | 'list' | 'get';
  auth: { uid: string; email_verified: boolean } | null;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: DirtyPayloadTestCase[] = [
  {
    id: 1,
    name: 'Unverified Email Spoof',
    collection: 'budgets',
    docId: 'student_01',
    operation: 'create',
    auth: { uid: 'student_01', email_verified: false },
    payload: { userId: 'student_01', monthlyAllowance: 1200 },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Cross-User Budget Hijack',
    collection: 'budgets',
    docId: 'student_02',
    operation: 'create',
    auth: { uid: 'student_01', email_verified: true },
    payload: { userId: 'student_02', monthlyAllowance: 1200 },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Shadow Field Injection (Budget)',
    collection: 'budgets',
    docId: 'student_01',
    operation: 'create',
    auth: { uid: 'student_01', email_verified: true },
    payload: { userId: 'student_01', isAdmin: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Negative Allowance Poisoning',
    collection: 'budgets',
    docId: 'student_01',
    operation: 'update',
    auth: { uid: 'student_01', email_verified: true },
    payload: { monthlyAllowance: -5000 },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Alert Threshold Out-of-Bounds',
    collection: 'budgets',
    docId: 'student_01',
    operation: 'update',
    auth: { uid: 'student_01', email_verified: true },
    payload: { alertThresholdPercent: 250 },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Expense Category Enum Bypass',
    collection: 'expenses',
    docId: 'exp_1',
    operation: 'create',
    auth: { uid: 'student_01', email_verified: true },
    payload: { category: 'Illegal Gambling' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Denial-of-Wallet Oversized Title',
    collection: 'expenses',
    docId: 'exp_2',
    operation: 'create',
    auth: { uid: 'student_01', email_verified: true },
    payload: { title: 'A'.repeat(5000) },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Malformed Date String Injection',
    collection: 'expenses',
    docId: 'exp_3',
    operation: 'create',
    auth: { uid: 'student_01', email_verified: true },
    payload: { dateStr: '02/10/2026' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Client Timestamp Forgery',
    collection: 'expenses',
    docId: 'exp_4',
    operation: 'create',
    auth: { uid: 'student_01', email_verified: true },
    payload: { createdAt: '1999-01-01T00:00:00Z' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Immutable Ownership Swap on Update',
    collection: 'investments',
    docId: 'inv_1',
    operation: 'update',
    auth: { uid: 'student_01', email_verified: true },
    payload: { userId: 'student_99' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Invalid Asset Class Allocation',
    collection: 'investments',
    docId: 'inv_2',
    operation: 'create',
    auth: { uid: 'student_01', email_verified: true },
    payload: { assetClass: 'Meme Penny Stocks' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Unfiltered Collection Scraping',
    collection: 'expenses',
    docId: '*',
    operation: 'list',
    auth: { uid: 'student_01', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
];
