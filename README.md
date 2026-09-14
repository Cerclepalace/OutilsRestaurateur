# 🛡️ Recovery Engine

> Production-grade data restoration, recovery orchestration and integrity verification for Supabase/PostgreSQL applications.

## 🎯 Mission

Build a recovery system that is **safe, deterministic, auditable and verifiable**.

A restore is not simply a database command. It may involve:

- PostgreSQL
- Supabase Storage
- schema and migrations
- RLS and permissions
- backups / PITR
- external services
- application dependencies
- recovery-point validation
- post-restore verification

> **Never declare a recovery successful without evidence.**

---

## 🧠 Architecture

```text
┌──────────────────────────────────────────────┐
│                 CONTROL PLANE                │
│  Users / Permissions                         │
│  Restore Requests / Jobs / Audit Logs        │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│                RECOVERY ENGINE               │
│  Validation / Idempotency / State Machine    │
│  Orchestration / Verification / Reconcile   │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│                  DATA PLANE                  │
│  PostgreSQL / Storage / Backups / Services   │
└──────────────────────────────────────────────┘
```

The database stores **state, metadata, versions, logs and guardrails**. Sensitive recovery operations are executed by a secure backend / Edge Function.

---

## 🔄 Restore Lifecycle

```text
pending
   ↓
validating
   ↓
approved
   ↓
running
   ↓
verifying
   ↓
completed
```

Failure states:

```text
validating → failed
running    → failed
verifying  → failed
```

Invalid transitions such as:

```text
completed → running
```

must be rejected.

The frontend must never control the state machine directly.

---

## 🗄️ Core Tables

### `restore_requests`

Represents the human/business request:

- requester
- reason
- source
- target timestamp
- scope
- environment
- validation
- result

### `restore_jobs`

Represents technical execution:

```text
id
requested_by
target_project_id
restore_type
source_backup_id
target_timestamp
status
progress
started_at
completed_at
error_code
error_message
created_at
updated_at
idempotency_key
```

### `backup_records`

Stores backup metadata only.

> A metadata row is never proof that the physical backup exists.

### `restore_checkpoints`

Records critical execution steps so interrupted operations can be diagnosed and, where possible, resumed safely.

### `restore_audit_logs`

Immutable audit trail for events such as:

```text
RESTORE_REQUESTED
BACKUP_SELECTED
BACKUP_VERIFIED
RESTORE_STARTED
RESTORE_STEP_COMPLETED
RESTORE_VERIFICATION_STARTED
RESTORE_VERIFICATION_FAILED
RESTORE_COMPLETED
RESTORE_FAILED
RESTORE_CANCELLED
```

### `restore_verifications`

Stores post-restore checks:

```text
restore_job_id
check_name
status
expected
actual
error
created_at
```

---

## 🔐 Security

The system follows a **Zero Trust** model.

Never trust critical values supplied by the frontend. Revalidate:

- user identity
- restore job
- backup
- timestamp
- environment
- ownership
- permissions
- restore parameters
- current state

### RLS

Every exposed table requires an explicit RLS strategy defining:

```text
SELECT
INSERT
UPDATE
DELETE
```

The system must remain secure even when a user directly manipulates the API.

### Secrets

Never:

- expose service-role keys
- expose secret keys
- hardcode credentials
- store secrets in public tables
- send privileged credentials to the frontend

---

## ♻️ Idempotency

Critical operations use an `idempotency_key`.

If the same request arrives twice:

```text
Request A
Request A
```

the system must recognize the duplicate and **must not launch two restores**.

---

## 🔒 Concurrency

Incompatible restores must not run simultaneously.

```text
RESTORE A → running
RESTORE B → requested
```

Restore B must be blocked, queued or rejected according to business rules.

Use appropriate PostgreSQL mechanisms such as:

- transactions
- constraints
- locks
- advisory locks

Frontend-only checks are insufficient.

---

## 🧪 Dry Run

Where supported:

```text
dry_run = true
```

A dry run must analyze and validate without modifying data.

Example:

```text
DRY RUN

✓ Backup found
✓ Timestamp valid
✓ Permissions valid
✓ No concurrent restore
✓ Schema compatible
⚠ Storage requires separate verification
✓ Ready for execution
```

---

## ✅ Post-Restore Verification

A responsive PostgreSQL database does **not** prove recovery success.

Verify, where applicable:

- database connectivity
- critical tables
- constraints
- foreign keys
- functions
- extensions
- critical row counts
- relational consistency
- migrations
- RLS
- Storage metadata
- dependent services

Only then may the state become:

```text
completed
```

Otherwise use an explicit state such as:

```text
verifying
reconciliation_required
failed
```

---

## 📦 Supabase Storage

Treat database restoration and Storage restoration as separate concerns:

```text
DATABASE RESTORE
        +
STORAGE RESTORE
        +
CONFIGURATION / DEPENDENCY VERIFICATION
```

Check:

- buckets
- objects
- references
- URLs
- missing files
- metadata consistency

Never report a complete application restore while critical Storage objects are missing.

---

## 🌐 External APIs

External recovery operations follow:

```text
Request
  ↓
External Operation ID
  ↓
Polling / Webhook
  ↓
Verification
  ↓
Completed
```

An HTTP `200` response is **not** sufficient proof of completion.

---

## 🚨 Failure-First Engineering

For every critical operation ask:

> **What happens if the process dies exactly here?**

Test:

```text
restore succeeds
restore fails
restore partially fails
worker crashes
network disappears
external API times out
database connection disappears
duplicate request arrives
```

The system must always be able to determine its real state.

---

## 🔄 Reconciliation

Detect contradictions such as:

```text
DATABASE
status = completed

EXTERNAL SYSTEM
status = failed
```

or:

```text
DATABASE
status = completed

STORAGE
critical object missing
```

Correct state:

```text
reconciliation_required
```

Never hide the inconsistency behind `completed`.

---

## 🕐 Time

Use:

```sql
timestamptz
```

Keep UTC, local time and displayed timezone explicit.

For point-in-time recovery preserve:

- original timestamp
- displayed timezone
- actual UTC timestamp used

---

## 📊 Observability

Track:

- structured logs
- metrics
- operation duration
- failure count
- restore success rate
- verification failures
- database performance

Errors should contain:

```text
code
message
context
restore_job_id
timestamp
```

Never expose secrets or sensitive internal details to users.

---

## 🧯 Error Taxonomy

Recommended codes:

```text
BACKUP_NOT_FOUND
BACKUP_NOT_ACCESSIBLE
INVALID_TIMESTAMP
UNAUTHORIZED
RESTORE_ALREADY_RUNNING
SCHEMA_INCOMPATIBLE
STORAGE_INCONSISTENT
VERIFICATION_FAILED
DATABASE_UNAVAILABLE
EXTERNAL_SERVICE_ERROR
UNKNOWN_ERROR
```

---

## 🧪 Testing

### Authentication

Test:

- unauthenticated user
- standard user
- administrator
- unauthorized user

### RLS

Test:

- own-data access
- another user's data
- forbidden UPDATE
- forbidden DELETE

### Restore

Test:

- missing backup
- valid backup
- invalid timestamp
- concurrent restore
- duplicate request
- external failure
- interruption
- resume
- verification failure

---

## 🌍 Environments

Preferred lifecycle:

```text
LOCAL
  ↓
STAGING
  ↓
PRODUCTION
```

Never test destructive migrations directly on production.

All schema changes must be versioned, reproducible and tested.

---

## 🛠️ Implementation Workflow

```text
PHASE 0 — AUDIT
        ↓
PHASE 1 — DESIGN
        ↓
PHASE 2 — GAP ANALYSIS
        ↓
PHASE 3 — MIGRATIONS
        ↓
PHASE 4 — TEST
        ↓
PHASE 5 — SECURITY
        ↓
PHASE 6 — PERFORMANCE
        ↓
PHASE 7 — STAGING
        ↓
PHASE 8 — VALIDATION
        ↓
PHASE 9 — PRODUCTION
```

### Phase 0 — Audit

No modifications. Inspect the existing system first.

### Phase 1 — Design

Define:

- schema
- relationships
- RLS
- state machine
- functions
- Edge Functions
- indexes
- audit
- recovery workflow

### Phase 2 — Gap Analysis

Compare:

```text
EXISTING SYSTEM
       vs
TARGET ARCHITECTURE
```

Classify findings:

```text
CRITICAL
HIGH
MEDIUM
LOW
```

---

## 📚 Documentation

The project should maintain:

### `ROLE.md`

Engineering rules and operating instructions for the recovery agent.

### `ARCHITECTURE.md`

Architecture, tables, relationships, RLS, Edge Functions, recovery flow, security and dependencies.

### `RESTORE_RUNBOOK.md`

Human recovery procedure:

```text
1. Identify incident
2. Stop writes if necessary
3. Identify recovery point
4. Verify backup
5. Run dry-run
6. Obtain approval
7. Execute restore
8. Verify database
9. Verify Storage
10. Verify application
11. Verify users
12. Verify logs
13. Declare recovery complete
```

---

## 📐 Recovery Objectives

Document:

| Objective | Meaning |
|---|---|
| **RPO** | Maximum acceptable data-loss window |
| **RTO** | Maximum acceptable recovery time |
| Backup frequency | Frequency of recovery points |
| Retention | Recovery-point retention period |
| Verification | How recovery integrity is proven |
| Rollback | Handling of unsuccessful operations |
| Incident procedure | Human response process |

> Never claim a precise RPO/RTO without technical evidence.

---

## ⛔ Non-Negotiable Rules

Never:

- expose a service-role key
- expose secret keys
- disable RLS to make the app work
- remove policies without analysis
- modify production blindly
- delete data to solve an error
- treat HTTP 200 as proof of success
- treat metadata as proof of backup availability
- assume PostgreSQL restoration restores Storage objects
- hide errors
- bypass migrations
- introduce unnecessary circular dependencies
- perform destructive migrations without justification
- declare recovery complete without verification

---

## 📡 Communication Protocol

Every implementation step must report:

```text
STATUS
WHAT WAS CHECKED
WHAT WAS CHANGED
WHAT WAS NOT CHANGED
RISKS
TEST RESULTS
NEXT STEP
```

Use only explicit statuses:

```text
VERIFIED
NOT VERIFIED
FAILED
BLOCKED
REQUIRES HUMAN APPROVAL
```

Never claim success without evidence.

---

## 🏗️ Recommended Structure

```text
.
├── README.md
├── ROLE.md
├── ARCHITECTURE.md
├── RESTORE_RUNBOOK.md
│
├── supabase/
│   ├── migrations/
│   ├── functions/
│   │   └── restore/
│   └── tests/
│
├── docs/
│   ├── security/
│   ├── recovery/
│   └── incidents/
│
└── tests/
    ├── auth/
    ├── rls/
    ├── restore/
    └── recovery/
```

---

## ⚠️ Project Status

This README describes the **target architecture and engineering standard**.

It does not claim that every component already exists.

Each component must be explicitly classified:

```text
VERIFIED
NOT VERIFIED
FAILED
BLOCKED
REQUIRES HUMAN APPROVAL
```

---

## 🧭 Core Principle

```text
DATA INTEGRITY
      >
SECURITY
      >
RECOVERABILITY
      >
AUDITABILITY
      >
CORRECTNESS
      >
PERFORMANCE
      >
IMPLEMENTATION SPEED
```

When uncertainty exists:

```text
STOP
  ↓
ANALYZE
  ↓
EXPLAIN
  ↓
VALIDATE
  ↓
EXECUTE
```

> **Do not build a system that merely performs restores. Build a system that can prove whether a restore actually succeeded.**
