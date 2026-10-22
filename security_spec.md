# Firestore Security Specification & Attack Vector Analysis

## 1. System Invariants
1. **User Isolation (Zero-Trust ABAC)**: All school data (students, curriculum subjects, marks, Patrak A/B results, and school settings) are scoped under `/users/{userId}/**`.
2. **Identity Non-Repudiation**: Only the authenticated user whose `request.auth.uid == userId` can access or modify their own subcollections.
3. **No Cross-User Leaks**: Blanket listing of `/users` is explicitly forbidden.
4. **Id Sanitization & Denial of Wallet**: All document IDs must satisfy `isValidId(id)` (`^[a-zA-Z0-9_\-]+$`, size <= 128) to prevent payload injection and resource poisoning.
5. **Structural Integrity**: Records written to `students`, `subjects`, and `results` must validate schema types and field size bounds defined in `firebase-blueprint.json`.

---

## 2. The "Dirty Dozen" Payloads (Adversarial Attack Vectors)

1. **Unauthenticated Read (`/users/{targetUid}/students`)**:
   - `Auth`: `null`
   - `Action`: `get /users/teacher1/students/s1`
   - `Expected`: `PERMISSION_DENIED`
2. **Cross-Tenant Impersonation Read (`/users/{victimUid}/results`)**:
   - `Auth`: `{ uid: "attacker_uid" }`
   - `Action`: `get /users/victim_uid/results/s1`
   - `Expected`: `PERMISSION_DENIED`
3. **Cross-Tenant Write Hijack (`/users/{victimUid}/students/{studentId}`)**:
   - `Auth`: `{ uid: "attacker_uid" }`
   - `Action`: `create /users/victim_uid/students/s99` with `{ name: "Hacked Student" }`
   - `Expected`: `PERMISSION_DENIED`
4. **Blanket Collection Traversal (`/users` list)**:
   - `Auth`: `{ uid: "teacher1" }`
   - `Action`: `list /users`
   - `Expected`: `PERMISSION_DENIED`
5. **ID Poisoning / Denial of Wallet Attack**:
   - `Auth`: `{ uid: "teacher1" }`
   - `Action`: `create /users/teacher1/students/` with 2000-character malicious path ID
   - `Expected`: `PERMISSION_DENIED` (fails `isValidId()`)
6. **Student Record Schema Corruption (String Injection into standard)**:
   - `Auth`: `{ uid: "teacher1" }`
   - `Action`: `create /users/teacher1/students/s1` with `{ standard: "not-a-number", name: "Ramesh" }`
   - `Expected`: `PERMISSION_DENIED` (fails type validation)
7. **Name Overflow Buffer Attack (Oversized string payload)**:
   - `Auth`: `{ uid: "teacher1" }`
   - `Action`: `create /users/teacher1/students/s1` with 50,000 char `name`
   - `Expected`: `PERMISSION_DENIED` (exceeds max length constraint)
8. **Result Record Tampering (Mismatched studentId)**:
   - `Auth`: `{ uid: "teacher1" }`
   - `Action`: `set /users/teacher1/results/s1` with `{ studentId: "s999" }`
   - `Expected`: `PERMISSION_DENIED` (path studentId must match document payload studentId)
9. **Global Collection Access Bypass**:
   - `Auth`: `{ uid: "teacher1" }`
   - `Action`: `get /random_collection/doc1`
   - `Expected`: `PERMISSION_DENIED` (default-deny catch-all)
10. **Victim Settings Overwrite**:
    - `Auth`: `{ uid: "attacker_uid" }`
    - `Action`: `set /users/victim_uid` with `{ schoolName: "Defaced School" }`
    - `Expected`: `PERMISSION_DENIED`
11. **Subject Definition Injection by Unauthenticated User**:
    - `Auth`: `null`
    - `Action`: `create /users/any_uid/subjects/sub1`
    - `Expected`: `PERMISSION_DENIED`
12. **Malicious Delete of Neighbor Teacher's Result**:
    - `Auth`: `{ uid: "attacker_uid" }`
    - `Action`: `delete /users/teacher_uid/results/s1`
    - `Expected`: `PERMISSION_DENIED`
