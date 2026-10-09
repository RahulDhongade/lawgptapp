# Placeholder & Mock Value Audit

In compliance with **Critical Rule 1 (NO FAKE DATA PRESENTED AS REAL)**, every metric, claim, status indicator, and placeholder string present in the approved Stitch UI designs has been audited below, with its mitigation and runtime handling strategy defined.

---

## Audit Matrix

| Design Location | Original Placeholder / Mock Claim | Issue / Weakness | Code Mitigation Strategy |
|---|---|---|---|
| **Splash Screen** | `"Statutory Engine v2.4"` & `"indexing 68%"` | Fake progress and artificial version claims. | **Replaced with REAL startup task tracker**: reflects actual asset loading (Inter fonts, Noto Sans Devanagari), `expo-secure-store` token verification, and remote config fetch (0% → 100%). |
| **Splash Screen** | `"CERTIFIED REPOSITORY"` | Implies official government certification that does not exist. | **Neutralized**: Removed or replaced with `"Digital Legal Reference"` / `"Indian Bare Act Database"`. |
| **Splash Screen** | `"Bharatiya Nyaya Sanhita 2023 - 511/511 mapped"` | Unverified complete mapping claim. | **Neutralized**: Stated as `"BNS • BNSS • Constitutional References"` without claiming complete authoritative mapping unless backed by verified DB. |
| **Login Screen** | `"256-Bit SSL Encrypted Indian Sovereign Cloud"` | Marketing buzzword; unverifiable sovereign hosting claim. | **Neutralized**: Display `"Encrypted Connection • Client Data Protected"` with clear statutory disclaimer that outputs do not constitute formal legal counsel. |
| **Login / Sign Up** | `"Ask 3 free questions without account"` | Must not be purely cosmetic. | **Enforced**: Server/Mock layer stores guest device UUID and decrements quota `[3, 2, 1, 0]`. When quota reaches 0, prompts user to Sign Up. |
| **Home Dashboard** | `"BNS 2023 Live"` pill | Hard-coded live status. | **Dynamic Binding**: Bound to config endpoint `config.bns_status || 'Bare Acts 2023'`. Shows connection status based on active network state. |
| **Home Dashboard** | `"Section 105 BNS - Right of private defence..."` | Hard-coded text in HTML. | **Sourced from Versioned JSON**: Seeded in `/src/data/lawOfTheDay.json` with `source: "Ministry of Law & Justice, Gazette of India"`, `lastUpdated: "2024-07-01"`, and lawyer review flag. |
| **Home Dashboard** | `"Police verification guidelines • Yesterday"` | Hard-coded recent chats in HTML. | **Dynamic Storage**: Loaded dynamically from local SQLite/AsyncStorage or backend chat history. Displays empty state if user has no prior chats. |
| **AI Legal Chat** | `"BNSS & Constitutional Core v4.2"` | Arbitrary version string. | **Replaced**: Displays `"AI Legal Assistant"` with active legal model name from config. |
| **AI Legal Chat** | `"Verified Source"` badge | Blanket assumption of accuracy. | **Rule 2 Enforced**: Rendered **ONLY** when `item.verified === true` in the API payload. If `verified === false` or unverified, displays grey `"AI Explanation"` badge. |
| **AI Legal Chat** | `"1.2s latency"` | Artificial latency brag. | **Neutralized**: Removed from citizen-facing UI; real request duration only logged in dev debug telemetry. |
| **Legal Tools Hub** | `"3,000+ terms"` (Glossary card) | Unverifiable claim. | **Neutralized**: Replaced badge with `"A–Z Terms"` or exact count of local bundled definitions (`${glossaryData.length} terms`). |
| **Legal Tools Hub** | `"50+ Formats"` (Legal Documents) | Unverifiable format count. | **Neutralized**: Replaced badge with `"Curated Drafts"` or exact count of available templates in JSON (`${templates.length} Formats`). |
| **Legal Tools Hub** | `"eCourts"` (Case Tracker) | Implies live automated sync with official eCourts API. | **Neutralized**: Labeled as `"Manual Tracker"` / `"Docket Reminders"` unless a live eCourts CNR API integration is verified. Banner clearly states: `"Manual diary with court hearing reminders"`. |
| **Admin Portal** | `"99.4% Statutory Accuracy"` | Fabricated benchmark metric. | **Neutralized**: Admin screen is strictly role-gated. Metrics are fetched dynamically from `/api/v1/admin/metrics` or marked as `[Simulation/Benchmark]` in mock mode. |
| **Admin Portal** | `"42,850 Daily Legal Queries"` | Hard-coded analytics number. | **Dynamic**: Bound to real/mock metrics provider. Never hard-coded as real production traffic. |
| **Emergency / SOS** | Emergency helpline numbers | Risk of incorrect numbers. | **Strictly Bundled & Commented**: Sourced from `/src/constants/emergency.ts` with `"VERIFY BEFORE RELEASE"` comment and `lastVerified` timestamp (112, 1930, 1091, 181, 1098, NALSA 15100). |
| **Document Analysis** | `"AI Verified Scan"` | Blanket claim of document verification. | **Neutralized**: Output marked with prominent banner `"This is an explanation, not legal verification."` and labeled as `"Sample Analysis"`. |
| **Legal Aid Directory** | Contact directory numbers | Stale government phone numbers. | **Audited with 90-day expiry**: Any contact unverified for >90 days displays amber badge `"Contact unverified – confirm before visiting"`. |
| **Legal Documents** | Generated legal petitions | Risk of user filing unreviewed drafts in court. | **Mitigated**: Diagonal `"DRAFT"` watermark on PDF export, persistent banner `"Draft – review before use"`, and State Stamp Duty variation notes on Rental Agreement and Affidavit. |

---

## Target Dates & Owners for Future Live Integrations

| Feature / Mock Item | Current Implementation | Target Production Integration | Target Date | Owner |
|---|---|---|---|---|
| **SMS OTP Verification** | Fixed mock OTP `582914` | Twilio / Gupshup Gov-approved SMS Gateway | 2027-02-15 | Backend Security Team |
| **Live eCourts CNR Sync** | Local Manual Diary with notification alerts | National Judicial Data Grid (NJDG) / eCourts API | 2027-03-30 | Integrations Lead |
| **Live Lawyer Consult Matching** | Static SLSA / DLSA / NALSA directory | State Bar Council registered advocate network | 2027-04-15 | Operations & Legal Counsel |
| **High Court Precedent Vector Search** | Bundled landmark citations | Pinecone / pgvector with 100k+ Supreme Court & High Court judgments | 2027-05-01 | AI Infrastructure Team |
| **Live Stamp Duty Calculator** | State variation warning badge | State Revenue Department automated stamp duty table | 2027-06-15 | Compliance Team |

