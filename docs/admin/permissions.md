# LawGPT Role-Based Access Control (RBAC) Specification & Capability Matrix

This document defines the statutory authorization architecture for the LawGPT Enterprise Platform. All authorization checks are enforced server-side via the `requirePermission` middleware. Client-side checks in the Web UI are strictly cosmetic to avoid rendering unauthorized buttons or navigation menus.

---

## 🛡️ Administrative Role Definitions

| Role Tier | Purpose | Typical Assigned Personnel |
| :--- | :--- | :--- |
| **`user`** | Mobile application consumer. Zero administrative authority. | Citizens, Advocates using mobile app |
| **`support`** | Operational support and user assistance. Read-only access to citizen dossiers and session activity. | Customer Support Officers, Helpdesk |
| **`reviewer`** | Legal content verification, peer review, and AI response quality assessment. | Legal Interns, Paralegals, QA Advocates |
| **`subadmin`** | Operational moderation, session revocation, content publishing (under Four-Eyes rule), and AI prompt updates. | Senior Advocates, Content Operations Leads |
| **`admin`** | Superuser authority. Superusers possess full administrative control, team invitations, and role management. | Chief Legal Officer, Lead Security Architect |

---

## 📊 Role × Capability Permission Matrix

| Permission Capability | Description | `support` | `reviewer` | `subadmin` | `admin` |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `users.read` | View mobile user directory, dossier, and quota usage | ✅ | ✅ | ✅ | ✅ |
| `users.suspend` | Suspend or unsuspend citizen accounts with formal reason | ❌ | ❌ | ✅ | ✅ |
| `users.reset_quota` | Reset monthly/daily AI query quota | ❌ | ❌ | ✅ | ✅ |
| `sessions.read` | Inspect active web console sessions and mobile devices | ✅ | ❌ | ✅ | ✅ |
| `sessions.revoke` | Remotely terminate active user or administrative sessions | ❌ | ❌ | ✅ | ✅ |
| `guest_quota.read` | Audit anonymous / guest IP query thresholds | ✅ | ❌ | ✅ | ✅ |
| `content.read` | View legal content catalog and revision history | ❌ | ✅ | ✅ | ✅ |
| `content.edit_draft` | Author new legal content drafts and submit for review | ❌ | ✅ | ✅ | ✅ |
| `content.review` | Perform peer review and sign off on drafts | ❌ | ✅ | ✅ | ✅ |
| `content.publish` | Publish verified content to mobile live app *(Subject to Four-Eyes Rule)* | ❌ | ❌ | ✅ | ✅ |
| `ai.review_queue` | Triage flagged AI chat logs, correct answers, block topics | ❌ | ✅ | ✅ | ✅ |
| `ai.qa_test` | Run automated QA evaluation suites and log human verdicts | ❌ | ✅ | ✅ | ✅ |
| `ai.prompt_edit` | Modify active inference model and system prompt directives | ❌ | ❌ | ✅ | ✅ |
| `feedback.read` | Read user bug reports, corrections, and satisfaction logs | ❌ | ✅ | ✅ | ✅ |
| `feedback.respond` | Respond to citizen feedback tickets | ❌ | ✅ | ✅ | ✅ |
| `feedback.manage` | Escalate or reassign citizen feedback | ❌ | ❌ | ✅ | ✅ |
| `directory.manage` | Add, modify, or deactivate emergency helpline entries | ❌ | ❌ | ✅ | ✅ |
| `config.read` | View remote application parameters and system flags | ✅ | ✅ | ✅ | ✅ |
| `audit.view` | Inspect append-only audit trail and export compliance CSV | ❌ | ❌ | ❌ | ✅ |
| `*` (Superuser) | Unrestricted wildcard capability bypass | ❌ | ❌ | ❌ | ✅ |

---

## 🔒 Critical Server-Side Security Constraints

### 1. Four-Eyes Principle on Statutory Content (`content.publish`)
- **Rule:** A content version cannot be published by the administrative user who drafted or edited it.
- **Server Enforcement:**
  ```typescript
  if (version.created_by === req.adminUser.id) {
    return res.status(403).json({
      error: 'FOUR_EYES_VIOLATION',
      message: 'Four-Eyes Governance: The author of a content revision cannot publish it.'
    });
  }
  ```
- **Rationale:** Prevents rogue or erroneous statutory modifications (such as altering punishment ranges or citing incorrect gazettes) without secondary advocate verification.

### 2. Last Admin Protection Constraint
- **Rule:** The system prevents deleting or demoting the last remaining active administrator in the team roster.
- **Server Enforcement:**
  ```typescript
  const adminCount = db.prepare(
    "SELECT COUNT(*) as count FROM admin_users WHERE role = 'admin' AND id != ?"
  ).get(targetId).count;
  if (adminCount === 0) {
    return res.status(400).json({
      error: 'LAST_ADMIN_PROTECTED',
      message: 'Cannot demote the last remaining administrator.'
    });
  }
  ```
- **Rationale:** Prevents accidental operational lockout of the administrative platform.

---

## ⚙️ Adding or Updating Permissions

All permissions are declared in [`backend/src/security/permissions.ts`](file:///c:/Users/Asus%20Tuf/OneDrive/Desktop/lawgptapp/backend/src/security/permissions.ts).
1. Add the capability identifier to the appropriate array in `ROLE_PERMISSIONS`.
2. Apply `requirePermission('<new.permission>')` to the Express route handler.
3. The Admin UI automatically reflects new permissions in the **Dynamic Permission Matrix** screen.
