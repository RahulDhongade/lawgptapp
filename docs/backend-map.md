# Backend Analysis & Route Mapping

## Workspace Backend Status
- **Status:** `/backend` does **NOT** exist in the workspace root or local repository.
- **Resolution Strategy:** In accordance with **Phase 0 (Requirement 2)**, the mobile application will operate against a production-grade, typed API client with an intelligent Mock Layer when `EXPO_PUBLIC_API_MODE="mock"`. When switched to `EXPO_PUBLIC_API_MODE="live"`, it will communicate with the live LawGPT REST/SSE server endpoints documented below.
- **Audit Rule:** No invented endpoints will be marked as EXISTING. Every endpoint in the API contract is categorized as **MOCK** (active in the local mock service) or **TO-ADD** (required for future backend deployment).

---

## Required Mobile Backend Capabilities vs. Missing Features

Because no pre-existing backend code is present in the workspace, all mobile-specific features must be implemented in the mobile mock layer and documented for future backend implementation:

| Capability | Status | Implementation in App Architecture |
|---|---|---|
| **JWT Access + Refresh Tokens** | TO-ADD / MOCK | Tokens stored in `expo-secure-store` only. Auto-refresh on 401 response; token expiry handling with automatic graceful logout. |
| **Server-Side Guest Quota** | TO-ADD / MOCK | 3 free questions enforced via unique Device ID (`expo-application` / device UUID) + IP header. Backend tracks count in Redis/DB; returns remaining quota (`quota_remaining: 2, 1, 0`). App gates at 0 with "Sign up to continue" modal. |
| **Streamed Chat (SSE / Chunked)** | TO-ADD / MOCK | Real-time token streaming via `expo/fetch` or standard `EventSource`/SSE protocol. Streaming typing indicator, abort/cancel button, and non-streaming fallback. |
| **Structured AI Legal Output** | TO-ADD / MOCK | Chat API returns strict JSON adhering to Zod schema: `{ summary, relevant_law: [{ act, section, text, verified }], explanation_steps: [], what_you_can_do: [], important_note, citations: [], risk_level }`. If unparseable, falls back to sanitized plain-text card. |
| **Verified Badge Attribution** | TO-ADD / MOCK | `verified: true` is strictly reserved for citations verified against an authentic Indian gazette/bare act repository. In all other cases, marked `verified: false` and rendered as grey "AI explanation". |
| **Offline Legal Repository** | Bundled Local | Static, versioned JSON in `/src/data` for Emergency numbers, IPC→BNS mappings, fundamental rights, and legal glossary. No AI or network required for emergency features. |
| **Rate Limiting & Abuse Prevention** | TO-ADD / MOCK | Per-user rate limiting (e.g., 30 requests/min for authenticated users; 3 requests total for guests). |
| **Data Deletion & Privacy** | TO-ADD / MOCK | `DELETE /api/v1/user/account` endpoint to wipe user records from database and clear local encrypted storage. |
| **CORS & Mobile Network Handling** | TO-ADD / MOCK | Mobile clients do not enforce browser CORS, but SSL pinning / HTTPS and header validation (`X-Client-Platform: android | ios`, `X-App-Version`) will be enforced. |

---

## Detailed Endpoint Map

All endpoints below are typed in `/src/api/types.ts` and supported by the local mock engine `/src/api/mock/`:

### 1. Authentication & Session
- `POST /api/v1/auth/login` — [MOCK / TO-ADD] Authenticate with email/mobile + password. Returns `{ access_token, refresh_token, user }`.
- `POST /api/v1/auth/signup` — [MOCK / TO-ADD] Register new Citizen or Advocate account.
- `POST /api/v1/auth/otp/send` — [MOCK / TO-ADD] Request 6-digit SMS OTP for +91 mobile.
- `POST /api/v1/auth/otp/verify` — [MOCK / TO-ADD] Verify OTP and return session tokens.
- `POST /api/v1/auth/google` — [MOCK / TO-ADD] Google OAuth mobile ID token verification.
- `POST /api/v1/auth/refresh` — [MOCK / TO-ADD] Exchange refresh token for fresh access token.
- `POST /api/v1/auth/logout` — [MOCK / TO-ADD] Revoke active refresh token on server.
- `POST /api/v1/auth/forgot-password` — [MOCK / TO-ADD] Request password reset via email/SMS.

### 2. Guest Quota & App Config
- `GET /api/v1/guest/quota` — [MOCK / TO-ADD] Returns remaining free queries for current device ID: `{ remaining: number, total: 3, reset_at: string }`.
- `GET /api/v1/config` — [MOCK / TO-ADD] Remote config flags (e.g., `maintenance_mode`, `min_app_version`, `bns_act_version: "2023.1"`).

### 3. AI Legal Chat
- `POST /api/v1/chat/message` — [MOCK / TO-ADD] Standard non-streaming query. Returns validated structured JSON response.
- `GET /api/v1/chat/stream` — [MOCK / TO-ADD] SSE stream sending incremental markdown chunks and final structured JSON payload.
- `GET /api/v1/chat/conversations` — [MOCK / TO-ADD] Paginated list of user conversation sessions (`?page=1&limit=20`).
- `GET /api/v1/chat/conversations/:id` — [MOCK / TO-ADD] Retrieve full conversation history.
- `DELETE /api/v1/chat/conversations/:id` — [MOCK / TO-ADD] Delete a conversation session.

### 4. Legal Search & Bare Acts
- `GET /api/v1/legal/search` — [MOCK / TO-ADD] Search acts across BNS, BNSS, BSA, and Constitution (`?q=...&category=...`).
- `GET /api/v1/legal/converter/ipc-bns` — [MOCK / TO-ADD / BUNDLED] Section lookup between IPC and BNS.

### 5. Legal Documents & Analysis
- `GET /api/v1/documents/templates` — [MOCK / TO-ADD] List available legal document templates (RTI, Notices, Rent Agreement, Affidavits).
- `POST /api/v1/documents/generate` — [MOCK / TO-ADD] Generate draft PDF/DOCX from form parameters.
- `POST /api/v1/documents/analyze` — [MOCK / TO-ADD] AI clause analysis and red-flag identification for uploaded document/image.

### 6. Case Tracking (eCourts) & Bookmarks
- `GET /api/v1/cases` — [MOCK / TO-ADD] List user-tracked cases (manual entry or CNR query).
- `POST /api/v1/cases` — [MOCK / TO-ADD] Add case to track.
- `DELETE /api/v1/cases/:id` — [MOCK / TO-ADD] Remove case from tracker.
- `GET /api/v1/user/saved` — [MOCK / TO-ADD] User bookmarks and saved legal advice notes.
- `POST /api/v1/user/saved` — [MOCK / TO-ADD] Save or bookmark an item.
- `DELETE /api/v1/user/saved/:id` — [MOCK / TO-ADD] Remove bookmark.

### 7. User Profile & Data Protection
- `GET /api/v1/user/profile` — [MOCK / TO-ADD] Fetch current user profile.
- `PUT /api/v1/user/profile` — [MOCK / TO-ADD] Update profile (name, role, bar enrollment number).
- `DELETE /api/v1/user/account` — [MOCK / TO-ADD] Complete deletion of all user telemetry, conversations, and data per Privacy Rule.

### 8. Admin Portal (Role-Gated)
- `GET /api/v1/admin/metrics` — [MOCK / TO-ADD] Admin dashboard metrics (queries, moderation queue, system status). Gated strictly for `role === 'admin'`.
- `GET /api/v1/admin/moderation` — [MOCK / TO-ADD] Flagged query moderation queue.
- `POST /api/v1/admin/moderation/:id/review` — [MOCK / TO-ADD] Resolve moderation item.
