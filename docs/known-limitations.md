# LawGPT Mobile – Known Limitations & Platform Differences

**Document Version:** 1.0.0  
**Last Updated:** 2026-10-03  
**Review Status:** ACTIVE AUDIT

---

## 1. Mock Mode vs. Real Production Backend

When `EXPO_PUBLIC_API_MODE=mock`:

| Feature Area | Current Mock Behavior | Production Live Behavior (Target) |
|---|---|---|
| **User Authentication** | Fixed mock accounts (`citizen`, `advocate`, `admin`) with simulated tokens. | Live Supabase/PostgreSQL JWT authentication with refresh token rotation and bcrypt hashing. |
| **Mobile OTP** | Simulated 400ms dispatch with fixed dev code `582914`. | Real SMS delivery via TRAI-compliant Indian DLT SMS Gateway (Gupshup / Twilio India). |
| **AI Legal Advisory** | Deterministic categorized response mapper (`qaEngine.ts`) validated against Zod schemas. | Live streaming LLM (Gemini 1.5 Pro / GPT-4o) with RAG vector search over 100k+ Supreme Court judgments and state high court precedents. |
| **CNR Case Tracking** | Local manual case diary with 24-hour court hearing notifications via `expo-notifications`. | Automated scraping / official API integration with the National Judicial Data Grid (NJDG) / eCourts Services. |
| **Document OCR Analysis** | Pre-parsed contract fixture with multi-clause risk scoring and 10 MB client limit. | Cloud Vision OCR / PyMuPDF pipeline for full multi-page document scanning and clause extraction. |
| **Bar Council Verification** | Instant approval upon entering Bar Council enrollment format (e.g. `MAH/1482/2019`). | Real-time verification with State Bar Council registers. |

---

## 2. Platform Differences (Android vs. iOS vs. Web)

| Platform | Behavioral Differences & Specifics |
|---|---|
| **Android (Target Tier 1)** | - Hardware back button integrates seamlessly with React Navigation stack.<br/>- `android:usesCleartextTraffic="false"` strictly enforced in `AndroidManifest.xml`.<br/>- `expo-notifications` requires Android 13+ `POST_NOTIFICATIONS` runtime permission.<br/>- High-performance JavaScript execution via Hermes engine. |
| **iOS (Target Tier 2)** | - Hardware back button does not exist; relies on interactive swipe gestures and top header back icons.<br/>- Biometric authentication uses Face ID / Touch ID via `expo-local-authentication`.<br/>- Secure storage uses iOS Keychain services rather than Android Keystore. |
| **Web Preview** | - `expo-secure-store` falls back gracefully to `window.localStorage` when native keystore is absent.<br/>- Native document pickers and image camera invoke browser file selection dialogs.<br/>- Native notifications fallback to simulated toasts. |

---

## 3. Untested Edge Cases & Known Boundaries

1. **Large Document Uploads (> 10 MB):**
   - The app explicitly blocks uploads larger than 10 MB on the client side with a friendly alert. Very high-resolution multi-page PDF rendering on low-RAM (<2 GB) devices has not undergone long-term memory heap profiling.
2. **Deep Devanagari Ligatures on Ultra-Old Android (API < 26):**
   - Noto Sans Devanagari is bundled in the app, but older rendering engines on Android 7.0 (API 24) may occasionally display complex Sanskrit conjuncts with minor spacing variance.
3. **Flaky Network Reconnect Timing:**
   - Queued offline questions auto-retry once NetInfo reports active internet. If a captive Wi-Fi portal intercepts traffic without resolving DNS, the query will display a timeout error after 15 seconds rather than retrying indefinitely.

---

## 4. Planned Future Roadmap

- [ ] **Voice-First Vernacular Q&A:** Integrate Bhashini API (Ministry of Electronics and IT) for spoken regional inputs in Tamil, Telugu, Bengali, and Gujarati.
- [ ] **e-Challan & Traffic Court Integration:** Direct query of Parivahan e-Challan database for traffic fines and Lok Adalat settlement dates.
- [ ] **Automated Court Causelist Sync:** Daily automated scraping of High Court causelists for advocate users.
- [ ] **Geo-Location Legal Aid Routing:** Real-time GPS-based turn-by-turn directions to the closest District Legal Services Authority (DLSA) office.
