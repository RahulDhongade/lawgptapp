# LawGPT Sovereign Legal Intelligence — Enterprise Administration Console

The LawGPT Web Administration Console is the mission-critical management, security, and statutory oversight platform for the LawGPT Indian Legal Assistant mobile application. Built for legal researchers, supervising advocates, and system administrators, it enforces strict statutory compliance under the **Bharatiya Nyaya Sanhita (BNS 2023)**, **Bharatiya Nagarik Suraksha Sanhita (BNSS 2023)**, and the **Digital Personal Data Protection Act (DPDP Act 2023)**.

---

## 🏛️ System Architecture Overview

```
                      ┌───────────────────────────────────────────────┐
                      │    LawGPT Admin Web Console (React / Vite)    │
                      │  Port 5173  │  Tailwind tokens  │  RBAC Shell │
                      └───────────────────────┬───────────────────────┘
                                              │  HttpOnly Session + CSRF
                                              ▼
                      ┌───────────────────────────────────────────────┐
                      │    LawGPT Enterprise Gateway (Node.js/Express)│
                      │  Port 4000  │  Strict CORS  │  Helmet Headers │
                      └───────┬───────────────────────────────┬───────┘
                              │                               │
            ┌─────────────────▼─────────────┐   ┌─────────────▼─────────────────┐
            │   SQLite Enterprise Engine    │   │  AI Safety & Evaluator Engine │
            │  WAL Mode  │  FK Constraints  │   │  Gemini 1.5 Pro / Flash       │
            │  Append-Only Audit Triggers   │   │  Statutory Citation Checks    │
            └───────────────────────────────┘   └───────────────────────────────┘
```

### Key Technical Attributes
- **Zero-Trust Role-Based Access Control (RBAC):** Five distinct hierarchical tiers (`user`, `support`, `reviewer`, `subadmin`, `admin`). Permissions enforced via `requirePermission` middleware on every administrative endpoint.
- **Strict Four-Eyes Content Governance:** Draft authors cannot self-publish legal revisions. A secondary supervising officer must review and publish to the live mobile registry.
- **Append-Only Immutability:** SQLite database triggers enforce hardware-like append-only security on `audit_logs`. `UPDATE` and `DELETE` operations are physically rejected by the SQLite engine (`RAISE(ABORT)`).
- **DPDP Act (2023) Compliance:** Automated 30-day statutory SLA tracking and cryptographic anonymization for data principal erasure requests.
- **Dual-Factor Authentication (TOTP):** Mandatory RFC 6238 time-based one-time password enforcement for all administrative officers.

---

## 🚀 Quickstart & Deployment

### 1. Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **Operating System:** Windows, Linux, or macOS

### 2. Environment Configuration
Create or verify `.env` in `backend/`:
```env
PORT=4000
NODE_ENV=development
JWT_SECRET=lawgpt_super_secure_enterprise_secret_min_32_bytes_length_ok
ADMIN_CORS_ORIGIN=http://localhost:5173
DATABASE_PATH=lawgpt_admin.db
```

### 3. Installation & Database Setup
```bash
# Install backend dependencies
cd backend
npm install

# Run database migrations and seed initial administrative officer
npm run seed:admin -- --email admin@lawgpt.in --name "Chief Legal Administrator" --role admin --password "LawGPTAdmin2024!"

# Seed statutory legal content drafts (IPC/BNS mappings, fundamental rights, legal aid)
npm run seed:content

# Install Admin Web UI dependencies
cd ../admin\ ui
npm install
```

### 4. Running the Development Stack
```bash
# Terminal 1: Launch Backend Gateway (Port 4000)
cd backend
npm run dev

# Terminal 2: Launch Admin Web Console (Port 5173)
cd "admin ui"
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🧪 Automated Security & Regression Suite

The system includes comprehensive automated tests covering the permission matrix, 5-attempt account lockout, TOTP challenges, Four-Eyes publication enforcement, QA benchmark evaluation, and DPDP anonymization.

```bash
cd backend
npm test
```

### Test Coverage Summary:
- `security.test.ts`: RBAC permission matrix (13 tests), brute-force lockout, TOTP 2FA, CSRF headers, public `/api/config`.
- `users_and_team.test.ts`: User moderation, last-admin demotion prevention, session revocation.
- `content_four_eyes.test.ts`: Author publication block, supervisor publish, ETag 304 distribution.
- `ai_review_and_qa.test.ts`: Missing citation routing, high-risk triggers, QA benchmark execution.
- `config_directory_dpdp.test.ts`: Remote config, helpline registry, DPDP Act 30-day SLA erasure.

**Status: 5 Test Suites, 39 Tests Passing (100% Pass Rate).**

---

## 📁 Repository Directory Structure

```
lawgptapp/
├── admin ui/                       # React + Vite + TypeScript Web Console
│   ├── src/
│   │   ├── api/client.ts           # Typed API Client with CSRF & Credentials
│   │   ├── context/AuthContext.tsx # Authentication & Session Provider
│   │   ├── components/layout/      # Admin Layout & Top Application Bar
│   │   ├── pages/                  # Operations, Users, Roles, Audit, Sessions,
│   │   │                           # Content Manager, AI Queue & QA, System Config
│   │   └── index.css               # LawGPT Sovereign Dark Theme Tokens
│   └── package.json
├── backend/                        # Node.js + Express + TypeScript Gateway
│   ├── src/
│   │   ├── database/               # SQLite db.ts and migrations/
│   │   ├── middleware/             # Auth, requirePermission, CSRF, RateLimiter
│   │   ├── routes/                 # Admin routes and public distribution APIs
│   │   ├── security/permissions.ts # Single source of truth for RBAC capabilities
│   │   ├── services/auditService.ts# Append-only audit logger
│   │   └── scripts/                # CLI createAdmin and seedContent utilities
│   └── __tests__/                  # Comprehensive Jest test suite
└── docs/admin/                     # Architecture, Permissions, Runbook & Audit
```
