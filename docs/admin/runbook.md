# LawGPT Enterprise Administration — Operational Runbook

This runbook documents step-by-step Standard Operating Procedures (SOPs) for site reliability engineers, security officers, and administrators maintaining the LawGPT platform.

---

## 📋 Table of Contents
1. [Admin Account Enrollment & 2FA Setup](#1-admin-account-enrollment--2fa-setup)
2. [Handling DPDP Act 2023 Data Erasure Requests](#2-handling-dpdp-act-2023-data-erasure-requests)
3. [Four-Eyes Content Publishing Workflow](#3-four-eyes-content-publishing-workflow)
4. [Emergency Lockdown & Maintenance Mode](#4-emergency-lockdown--maintenance-mode)
5. [Database Backups & Disaster Recovery](#5-database-backups--disaster-recovery)
6. [Telemetry Purge & Retention Enforcement](#6-telemetry-purge--retention-enforcement)
7. [Account Lockout Remediation](#7-account-lockout-remediation)

---

## 1. Admin Account Enrollment & 2FA Setup

### Enrolling an Officer via CLI
Run the secure creation script from `backend/`:
```bash
npm run seed:admin -- --email advocate.sharma@lawgpt.in --name "Adv. Sunita Sharma" --role reviewer --password "<TemporaryStrongPassword>"
```

### Initial Sign-In & TOTP 2FA Provisioning
1. The officer navigates to `http://localhost:5173/login`.
2. Enters their email and temporary password.
3. System responds with `2FA Setup Required` and renders an authenticator QR code.
4. Officer scans the QR code in Google Authenticator or Microsoft Authenticator.
5. Enters the 6-digit TOTP code to confirm enrollment.
6. The session is issued with HttpOnly SameSite=Strict cookies.

---

## 2. Handling DPDP Act 2023 Data Erasure Requests

Under Section 12 of the Digital Personal Data Protection Act (2023), data principals have the right to erasure of personal data within a **30-day statutory SLA**.

### Procedure
1. Navigate to **System Config & DPDP** (`/config`) ➔ Select the **DPDP Act 2023 Erasure Queue** tab.
2. Review pending requests. Verify the days remaining against the statutory 30-day clock.
3. Click **Fulfill Erasure**:
   - The platform replaces the user's name with `DELETED_PRINCIPAL`.
   - The email is replaced with an irreversible hash (`deleted_<hash>@erased.internal`).
   - The mobile number is anonymized (`DEL_<hash>`).
   - All active device refresh tokens and sessions are immediately revoked.
   - The action is recorded in the append-only audit trail with the officer's ID.
4. If an active legal retention exception applies (e.g. pending court summons or fraud investigation), click **Reject** and enter the statutory justification.

---

## 3. Four-Eyes Content Publishing Workflow

To prevent unilateral modification of statutory provisions, no single administrator can publish a legal content revision they drafted.

### Lifecycle Procedure
1. **Drafting (First Eye):**
   - Drafting officer navigates to **Statutory Content** (`/content`).
   - Selects content type (e.g. `ipc_bns_mapping`, `rights`).
   - Authors or modifies the legal provision.
   - Clicks **Submit for Review**. Status changes to `in_review`.
2. **Peer Review:**
   - Reviewing officer inspects the draft against official gazette notifications (Acts 45 & 46 of 2023).
   - Clicks **Verify & Mark Reviewed** and enters statutory cross-check notes. Status changes to `reviewed`.
3. **Publication (Second Eye):**
   - A supervising officer (different from the drafting officer) clicks **Publish**.
   - If the drafting officer attempts to click Publish, the server rejects the request with HTTP 403 `FOUR_EYES_VIOLATION`.
   - Upon successful publication, the content is served to all mobile applications via `GET /api/content/:type` with ETag caching.

---

## 4. Emergency Lockdown & Maintenance Mode

If an upstream LLM hallucination or statutory discrepancy requires immediate mobile traffic suspension:

### Procedure
1. Navigate to **System Config** (`/config`) ➔ **Remote App Config & Feature Flags**.
2. Locate `maintenance_mode`.
3. Click **Edit**, toggle value to `true`, and enter an advisory message (e.g., *"LawGPT is currently updating statutory indexes. Please check back shortly."*).
4. Save the parameter.
5. Mobile apps polling `GET /api/config` will display the maintenance screen and pause AI queries.

---

## 5. Database Backups & Disaster Recovery

The LawGPT database uses SQLite in WAL (Write-Ahead Logging) mode.

### Online Backup Command
```bash
# Safely snapshot live database without locking writes
sqlite3 backend/lawgpt_admin.db ".backup 'backend/backups/lawgpt_admin_$(date +%Y%m%d_%H%M%S).db'"
```

### Append-Only Audit Integrity Check
Verify that triggers are enforcing audit immutability:
```sql
-- This query MUST fail with "Audit log entries are strictly append-only"
UPDATE audit_logs SET action = 'tampered' WHERE id = 'some-id';
```

---

## 6. Telemetry Purge & Retention Enforcement

To comply with data minimization principles:
1. Navigate to **AI Observability** (`/ai-queue`) ➔ **Model & Prompt Settings**.
2. In the **Telemetry Retention Period** card, enter the retention threshold in days (default: `90`).
3. Click **Purge Now**.
4. The system deletes all chat records older than the cutoff and records the purged count in the audit log.

---

## 7. Account Lockout Remediation

If an administrative officer triggers 5 consecutive failed login attempts, their account is locked for 15 minutes.

### Manual Unlock Procedure (via SQLite CLI)
```sql
UPDATE admin_users 
SET failed_login_attempts = 0, locked_until = NULL 
WHERE email = 'officer@lawgpt.in';
```
The unlock is effective immediately.
