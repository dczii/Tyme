# Security Specification for Tyme Workspace

This document defines the security invariants, malicious attack payloads, and test procedures for verifying high-stakes Firestore access control.

## 1. Data Invariants
- Each user profile `/users/{userId}` can only be read, created, or updated by the authenticated owner (`request.auth.uid == userId`).
- Sub-collections `{projects, tags, entries}` are sandboxed under `/users/{userId}` so that access is exclusively governed by parent-user membership (`request.auth.uid == userId`).
- Every document ID must match `isValidId()` pattern (`^[a-zA-Z0-9_\-]+$`) and must not exceed standard length bounds (up to 128 characters) to avoid ID poisoning.
- Custom workspace settings are restricted to approved ranges (e.g. `workdayTargetHours` must be between 1 and 24).
- Time entries must have a valid non-empty description, clean matching status, and positive bounded duration.
- Temporal timestamps, if any, are verified against the real server time `request.time`.

## 2. The "Dirty Dozen" Payloads (Vulnerability Attacks Rejected)

1. **Identity Spoofing - External Profile Read/Write**
   - Attack: Try to access or update user profile of `user_B` while signed in as `user_A`.
   - Expected: `PERMISSION_DENIED`

2. **Poison Document ID**
   - Attack: Create a project with an ID consisting of 1,000 characters or binary metadata.
   - Expected: `PERMISSION_DENIED`

3. **User Profile Attribute Overwrites - Forcing Admin Role**
   - Attack: Submit `"isAdmin": true` or `"role": "admin"` to self-profile.
   - Expected: `PERMISSION_DENIED` (Strict schema block / no additional keys)

4. **Orphan Writing - Writing sub-resource under un-authenticated parent path**
   - Attack: User `A` writes a project under `/users/user_B/projects/proj-1`.
   - Expected: `PERMISSION_DENIED`

5. **Blanket Query - Querying projects across different users**
   - Attack: Client requests standard collectionGroup or cross-user list without restricting `userId` filter.
   - Expected: `PERMISSION_DENIED`

6. **Target Hours Exploitation**
   - Attack: Update `workdayTargetHours` to `999` hours or `-5` hours.
   - Expected: `PERMISSION_DENIED`

7. **Injecting Extra Fields to TimeEntry**
   - Attack: Create a time entry with an arbitrary field `maliciousPayload: "x" * 100000` to trigger system-level exhaustion.
   - Expected: `PERMISSION_DENIED` (Strict affected keys filtering)

8. **Tampering with Tags on other workspaces**
   - Attack: Delete tag `/users/user_B/tags/tag-1` as `user_A`.
   - Expected: `PERMISSION_DENIED`

9. **Mismatched Time values**
   - Attack: Submit entry with decimal duration or negative duration.
   - Expected: `PERMISSION_DENIED`

10. **Immutability violation on creation timestamps**
    - Attack: Overwrite or change `createdAt` timestamp parameter during a profile save edit operation.
    - Expected: `PERMISSION_DENIED`

11. **Spoofed Email / Verification Hijack**
    - Attack: Authenticate with a fake verified token or non-verified standard email and read premium configuration logs.
    - Expected: `PERMISSION_DENIED` (Must check `email_verified == true`)

12. **Anonymous Access Breach**
    - Attack: Try to write project or time entry with anonymous credentials.
    - Expected: `PERMISSION_DENIED`
