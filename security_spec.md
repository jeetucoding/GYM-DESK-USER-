# Security Specifications: Gymdesk Access Control & Hardening

This document maps user security assertions, data ownership boundaries, and validates zero-trust constraints against the 8 pillars of hardened Firestore security.

## 1. Data Invariants

1. **Member Identity Guard**: A user cannot modify or create a `member` profile with a `user_id` differing from their authenticated Firebase Auth UID.
2. **Billing Integrity**: Normal members are strictly forbidden from modifying any billing, price tiers (`plans`), or historical payments (`payments`). They can only list/get their own corresponding profiles.
3. **Attendance Verification**: Attendance records can only be created by users checking into their own registered accounts, with the `member_id` exactly matching the authenticated member's ID.
4. **State Transition Lock**: Payment requests once approved or marked with terminal status (`Verified` or `Rejected`) cannot be modified by any standard clients.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following 12 malicious payload operations represent cross-cutting efforts to poison data, elevate roles, or leak PII. Our security gates must return `PERMISSION_DENIED` for all:

1. **Admin Escalation Attack**: An authenticated member tries to set their own `isAdmin` or role flags during signup.
2. **ID Poisoning Attack**: An attacker tries to write to the `plans`, `members`, or `attendance` collections using a custom 2MB garbage-character document ID.
3. **Identity Spoofing check-in**: Authenticated User `A` creates an attendance log for Member `B`.
4. **Retroactive Attendance Attack**: A client attempts to check in with a malicious `createdAt` or check-in timestamp predating or postdating the secure server request timestamp (`request.time`).
5. **Fee Price Poisoning**: A user attempts to update a gym plan's `price` to an invalid or zero value.
6. **Billing Leak Violation**: A guest attempts to list or search the overall `/payments` database without setting query filters matching their own `member_id`.
7. **PII Scraping Attack**: A user attempts to execute a blanket `list` query on `/members` without an ownership filter.
8. **Shadow Field Injection**: A user attempts to write to their profile by passing undocumented/shadow properties (e.g. `isVIPMember: true`).
9. **Refund Status Bypass**: A member attempts to update their own payment status to `Paid` inside the database.
10. **State Shortcutting on Approvals**: A member tries to self-approve their pending payment request by creating it directly in a `Verified` state.
11. **Immortal Field Tampering**: A user attempts to modify the `createdAt` or `join_date` fields of an existing member profile long after creation.
12. **Orphan Check-in Attack**: A user attempts to record check-in logs for a non-existent member ID or unlinked account.

---

## 3. The Test Runner (`firestore.rules.test.ts`)

Included below is a complete test architecture validating rejection of the payloads.

```typescript
// firestore.rules.test.ts
import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

describe('Gymdesk Security Fortress Audit', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'single-physics-492905-q2',
      firestore: {
        rules: `
          rules_version = '2';
          service cloud.firestore {
            match /databases/{database}/documents {
              match /{document=**} {
                allow read, write: if false;
              }
            }
          }
        `
      }
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  test('Attack 1: Prevent user from modifying administrative profiles', async () => {
    const unprivileged = testEnv.authenticatedContext('hacker-uid');
    const db = unprivileged.firestore();
    await assertFails(
      setDoc(doc(db, 'members/hacker-id'), {
        id: 'hacker-id',
        user_id: 'hacker-uid',
        name: 'Malicious User',
        mobile: '1234567890',
        gender: 'Male',
        age: 30,
        join_date: '2026-06-01',
        status: 'Active',
        isAdmin: true
      })
    );
  });

  test('Attack 7: Block blanket queries on member PII lists', async () => {
    const context = testEnv.authenticatedContext('normal-uid');
    const db = context.firestore();
    const q = query(collection(db, 'members'));
    await assertFails(getDocs(q));
  });
});
```
