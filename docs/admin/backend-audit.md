# LawGPT Backend & System Audit for Admin Panel

**Author:** Senior Full-Stack & Security Engineer  
**Date:** 2026-10-09  
**Status:** Complete Analysis (Phase 0)  
**Target:** LawGPT Production Backend & Web Admin Console (`admin ui`)

---

## 1. Executive Summary

This audit assesses the current state of the LawGPT codebase to establish the foundation for the **LawGPT Web Admin Panel** and supporting backend services. 

Currently, the mobile client (`lawgpt-mobile`) is an Expo / React Native application configured with:
1. A rich offline and mock data architecture (`src/api/mock/mockClient.ts` and `src/data/*.json`).
2. A direct client-side Google Gemini 1.5 Flash client (`src/api/geminiClient.ts`) secured via hardware Keystore (`expo-secure-store`).
3. Client-side state engines for guest quota (`src/store/guestStore.ts`), cases (`src/store/caseStore.ts`), and chats (`src/store/chatStore.ts`).
4. An optional Firebase / Firestore synchronization service (`src/services/firestoreSync.ts`).

As documented in [`/docs/backend-map.md`](file:///docs/backend-map.md), **no standalone Node.js/Express `/backend` server repository exists yet in the workspace**. The mobile application has functioned using a hybrid mock/client-side client pending production backend implementation.

To support the Admin Panel requirements safely without introducing technical debt or inventing false endpoints, we must:
- Implement a dedicated Node.js/Express + TypeScript backend under `/backend` with standard migrations, Zod validation, and structured `/api/admin/*` and public `/api/config` routes.
- Build the web Admin UI inside `/admin ui` using React + Vite + TypeScript + TanStack Query + Tailwind CSS adhering to LawGPT design tokens.
- Maintain strict separation of concerns, zero hardcoded credentials, and a server-enforced security model.

---

## 2. Current Implementation Audit

| Domain | Current Implementation in Mobile/Repo | Status | Security / Architectural Risk |
| :--- | :--- | :--- | :--- |
| **Authentication** | Hybrid mock JWT generation in `src/api/mock/mockClient.ts`. Mobile app stores tokens in `expo-secure-store`. Mock tokens are static base64-encoded payloads with 1-hour expiry. | **Mock / Incomplete** | No server-side signature verification; no refresh token rotation or revocation; no TOTP 2FA. |
| **User Model & Roles** | Roles defined as `citizen`, `advocate`, `admin` in `src/api/types.ts`. User records stored in local mock state and memory. | **Client-only** | No database backing; no fine-grained role permissions; client-side role checks are cosmetic. |
| **Database** | Offline static JSON datasets in `src/data/` (`ipcBnsMapping.json`, `firGuide.json`, `knowYourRights.json`, `legalGlossary.json`, etc.) + Firestore sync utility. | **Static / Client-bound** | No relational backend database; no schema versioning; no concurrency control or row-level security. |
| **AI Integration** | Direct client-to-Gemini via `src/api/geminiClient.ts` with API key stored in `SecureStore`. Strict Zod validation on `StructuredAIChatResponse`. | **Client-to-API** | Exposes AI traffic and usage to client devices; cannot log, moderate, rate-limit, or cache centrally. |
| **Rate Limiting** | Client-enforced guest quota: 3 lifetime free queries tracked via device UUID in `AsyncStorage` (`src/store/guestStore.ts`). | **Client-only** | Easily bypassed by reinstalling the app or clearing local storage; no IP or token bucket rate limiting. |
| **Logging & Telemetry** | Redacted console logs on mobile. No central logging, tracing, or audit trail. | **Missing** | Zero visibility into system abuse, failed logins, or content modifications. |

---

## 3. What is Missing for the LawGPT Admin Panel

To fulfill the requirements of the LawGPT Admin Panel, the following core backend capabilities must be constructed:

### 3.1. Security & RBAC Infrastructure (Phase 1)
- **Separate Admin Authentication:** Admin login must be completely isolated from regular mobile user authentication.
- **Granular Role Hierarchy:**
  - `user`: Mobile app user (citizen / advocate).
  - `support`: Read-only access to user profiles, guest quotas, and public config.
  - `reviewer`: Reviewer of content drafts, chat flags, and AI quality evaluation queue.
  - `subadmin`: User account moderation (suspend/unsuspend), session revocation, and non-critical content edits.
  - `admin`: Superuser with full system authority, permission configuration, emergency number management, and audit export. Cannot demote the last remaining admin.
- **Permission Matrix Middleware (`requirePermission`):** Server-side enforcement of granular capabilities (e.g., `content.edit`, `content.publish`, `users.suspend`, `audit.view`, `config.manage`, `ai.configure`).
- **MFA / TOTP 2FA:** Mandatory RFC 6238 TOTP (Google Authenticator / Authy) for all admin roles before access tokens are granted.
- **Brute-Force Protection:** Rate limiting (e.g., max 5 failed attempts per 15 min), exponential backoff, and temporary account lockout.
- **Tamper-Evident Audit Logging:** Append-only table recording every administrative mutation with actor ID, role, action, object type, before/after JSON snapshots, client IP, and timestamp. No `UPDATE` or `DELETE` API routes allowed.

### 3.2. User & Session Management (Phase 2)
- Server-side user directory with search (by email, mobile, name), filters (role, status), and pagination.
- Account control endpoints: `suspend`, `unsuspend`, `block`, `reset-quota`, `force-logout`.
- Session tracking: Active device/browser tokens per user with remote revocation capability.
- Team invitation & admin management with safety locks preventing self-demotion or removal of the last admin.

### 3.3. Content Management & Four-Eyes Review (Phase 3)
- Versioned content database schema for all legal statutory corpora:
  - `rights`, `glossary`, `ipc_bns_mapping`, `document_template`, `law_of_the_day`, `fir_guide`, `cyber_fraud_guide`, `legal_aid_entry`.
- Workflow lifecycle state machine:
  `draft` ➔ `in_review` ➔ `reviewed` ➔ `published`.
- **Enforced Four-Eyes Principle:** The admin or reviewer who edited/created a version cannot be the one who approves/publishes it. Enforced strictly on the server.
- Mobile distribution endpoint: `GET /api/content/:type` serving only reviewed, published records with HTTP `ETag` and version headers for offline caching.

### 3.4. AI Quality, Safety & Review Queue (Phase 4)
- Centralized server-side AI chat router routing to Gemini 1.5 Flash via server environment variables.
- Hashed user ID chat logger storing question, answer, retrieved citations, latency, risk rating, and verification state.
- Automated safety flagger (detecting unverified citations, high-risk topics like domestic violence or suicide, low-confidence answers).
- Human review queue with actions: `Approve`, `Correct`, `Block Topic`, `Add to Test Set`.
- Automated test runner executing the 20 benchmark questions from `/docs/qa-questions.json` with historical version tracking and reviewer scoring.

### 3.5. Configuration, Remote Toggles & DPDP Compliance (Phase 5)
- Dynamic key-value configuration engine with strict Zod types:
  - `ai_enabled`, `streaming_enabled`, `guest_question_limit`, `maintenance_mode`, `feature_toggles`, `emergency_contacts`.
- Public cached endpoint `GET /api/config` for mobile app runtime checks (version gating, maintenance banner).
- Legal Aid Directory CRUD with verified-on dates and source URLs.
- India DPDP Act 2023 compliance: Data erasure queue with SLA countdowns, cascading hard-delete or anonymization of conversations and drafts.
- Real dashboard analytics driven strictly by database aggregations (zero fabricated metrics).

---

## 4. Technology Stack & Directory Strategy

1. **Backend Service (`/backend`):**
   - Node.js 20+ with Express & TypeScript.
   - Database: SQLite with WAL mode for local deterministic development and zero-dependency testing, fully architected with SQL DDL migrations portable to PostgreSQL 16+.
   - Zod for request/response contract validation.
   - Helmet for secure HTTP headers, CORS whitelisting restricted to the Admin UI origin.
   - `speakeasy` + `qrcode` for TOTP two-factor authentication.
   - `bcryptjs` for salted password hashing.

2. **Admin UI (`/admin ui`):**
   - React 18 + Vite + TypeScript.
   - React Router v6.
   - TanStack React Query v5 for server state caching.
   - Tailwind CSS configured with the Sovereign Legal Interface tokens:
     - Primary Navy: `#1A237E` / `#0e1323`
     - Sovereign Gold: `#F9A825` / `#ffc454`
     - Secondary Teal: `#00897B` / `#68dbad`
     - Background: `#0e1323` (Dark Mode default per Stitch design) / `#F5F7FF`
     - Typography: Inter body, serif accents.
   - Lucide React icons matching mobile iconography.

---

## 5. Audit Conclusion

The mobile application's frontend is mature, secure, and zero-lag. The missing piece is the centralized management and control layer. The recommended plan starts with Phase 0 architectural alignment, followed by Phase 1 security foundation, and progressive implementation of all admin modules with strict verification.
