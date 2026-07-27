# Security Specification - Namma-Kelsa

This document outlines the security properties, data invariants, and access control policies for Namma-Kelsa.

## 1. Data Invariants

1. **Worker Profile Ownership**: A worker profile's document ID (`workerId`) must strictly match the Firebase Auth `uid` of the authenticated worker (`request.auth.uid`). No worker can create or modify another worker's profile.
2. **Identity Integrity**: The `uid` field inside the worker's document must strictly equal the worker's authenticated `uid`.
3. **Availability State**: The `isAvailable` field must be a boolean value.
4. **Recent Work Gallery**: The `gallery` field must be a list containing at most 3 images (URL or Base64 string pointers).
5. **Rating Constraint**: Worker reviews must have a numerical rating strictly between 1 and 5 (inclusive).
6. **Immutable Fields**: `createdAt` and `uid` are immutable once the profile is created.
7. **Timestamps**: `createdAt` must match `request.time` during creation; `updatedAt` must match `request.time` on updates.

## 2. Threat Vector Checklist (The Dirty Dozen Payloads)

Here are 12 malicious payloads that our security rules strictly defend against:

| Id | Target Collection | Payload Description | Exploitation Threat | Expected Result |
|----|-------------------|---------------------|---------------------|-----------------|
| D1 | `/workers` | Add profile with `uid` mismatching auth `uid` | Identity Spoofing | `PERMISSION_DENIED` |
| D2 | `/workers` | Update someone else's worker profile | Unauthorized Modification | `PERMISSION_DENIED` |
| D3 | `/workers` | Inject massive 1MB junk string as `phone` | Resource Exhaustion | `PERMISSION_DENIED` |
| D4 | `/workers` | Set `dailyRate` to block out users or negative rates | Business Logic Bypass | `PERMISSION_DENIED` |
| D5 | `/workers` | Update `createdAt` or `uid` field | History Tampering | `PERMISSION_DENIED` |
| D6 | `/workers` | Set `gallery` to containing 10 items | Memory/Wallet Denial | `PERMISSION_DENIED` |
| D7 | `/workers` | Client-provided future/past timestamp for `updatedAt` | Timing Manipulation | `PERMISSION_DENIED` |
| D8 | `/workers/reviews` | Create review for a worker as an unauthenticated user | Anonymous Spam | `PERMISSION_DENIED` |
| D9 | `/workers/reviews` | Create review with `rating` = 10 or 0 | Stat Manipulation | `PERMISSION_DENIED` |
| D10| `/workers/reviews` | Write review with `authorId` pointing to another user | Review Impersonation | `PERMISSION_DENIED` |
| D11| `/workers` | Blanket query `/workers` bypassing rule-level checks | List Scraping | `PERMISSION_DENIED` if read rule was unsecured |
| D12| `/workers` | Put non-string elements in the `skills` chip group list | Type Poisoning | `PERMISSION_DENIED` |

## 3. Zero-Trust Access Rules Specification

`firestore.rules` will implement:
- Default-deny catch-all rule block.
- Schema verification macros `isValidWorker` and `isValidReview`.
- Specific action checks for toggling availability (`isToggleAvailableAction`) with strict `affectedKeys().hasOnly(['isAvailable', 'updatedAt'])`.
