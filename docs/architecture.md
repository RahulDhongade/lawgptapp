# LawGPT Mobile App Architecture Document
**Target Platform:** Android-first (API 26+), iOS-compatible  
**Tech Stack:** React Native (Expo SDK 52+), TypeScript (Strict), Zustand, TanStack Query, React Navigation / Expo Router  

---

## 1. High-Level System Architecture

```mermaid
flowchart TD
    subgraph UI_Layer [UI Layer & Navigation]
        SPLASH[Splash Screen]
        ONBOARD[Onboarding 3 Slides]
        AUTH[Auth Stack: Login / SignUp / Forgot / Guest]
        TABS[Bottom Tabs: Home / Chat / Tools / History / Profile]
        MODALS[Native Stack: SOS Sheet / Rights Detail / Doc Builder / Admin]
    end

    subgraph State_Management [State Management Layer]
        ZUST_AUTH[Zustand: Auth & Session Store]
        ZUST_UI[Zustand: Language & UI Settings]
        ZUST_GUEST[Zustand: Guest Quota Tracker]
        QUERY_CACHE[TanStack Query: Server Cache + Persister]
    end

    subgraph API_Layer [API & Network Engine]
        API_CLIENT[Typed API Client + Interceptors]
        MOCK_ENGINE[In-Memory Mock Engine]
        SSE_CLIENT[Streaming SSE / Chunked Reader]
        OFFLINE_MGR[NetInfo + Offline Queue Manager]
    end

    subgraph Storage_Security [Local Storage & Security]
        SECURE_STORE[expo-secure-store: Tokens Only]
        ASYNC_STORAGE[AsyncStorage: Cached Data & History]
        BUNDLED_DATA[/src/data: Static Versioned Legal JSON]
    end

    UI_Layer --> State_Management
    State_Management --> API_Layer
    State_Management --> Storage_Security
    API_Layer --> Storage_Security
```

---

## 2. Directory Structure

```
lawgptapp/
├── assets/                  # Icons, splash, fonts (Inter, NotoSansDevanagari)
├── docs/                    # Technical architecture, backend map, audits, QA scripts
│   ├── architecture.md
│   ├── backend-map.md
│   ├── placeholder-audit.md
│   └── qa-questions.json
├── src/
│   ├── api/                 # Typed API client, mock layer, and interceptors
│   │   ├── client.ts        # Axios/fetch instance with auth & refresh
│   │   ├── types.ts         # Request/response interfaces & Zod schemas
│   │   ├── endpoints.ts     # Endpoint URI constants
│   │   ├── errors.ts        # User-friendly error message mapping
│   │   └── mock/            # Mock fixtures and fake network delay handler
│   ├── components/
│   │   ├── ui/              # Reusable atomic UI components from DESIGN.md
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Chip.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── VerifiedBadge.tsx
│   │   │   ├── CitationBadge.tsx
│   │   │   ├── AppHeader.tsx
│   │   │   ├── BottomSheet.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ErrorState.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── OfflineBanner.tsx
│   │   │   ├── LanguageSwitcher.tsx
│   │   │   └── TabBar.tsx
│   │   ├── chat/            # Chat-specific domain components
│   │   │   ├── StructuredAnswerCard.tsx
│   │   │   ├── CitationsAccordion.tsx
│   │   │   ├── ChatBubble.tsx
│   │   │   ├── SuggestedPromptChips.tsx
│   │   │   └── ChatInputBar.tsx
│   │   └── legal/           # Specialized legal widgets
│   │       ├── EmergencySheet.tsx
│   │       ├── QuickRightsModal.tsx
│   │       └── StatutoryDisclaimer.tsx
│   ├── constants/           # Static constants & vetted emergency numbers
│   │   ├── emergency.ts     # National helplines (112, 1930, etc.) with audit stamps
│   │   └── config.ts        # App configuration & build flags
│   ├── data/                # Versioned, lawyer-vetted offline legal datasets
│   │   ├── ipcBnsMapping.json
│   │   ├── legalGlossary.json
│   │   ├── fundamentalRights.json
│   │   └── lawOfTheDay.json
│   ├── hooks/               # Custom React hooks (network, audio, speech, biometrics)
│   ├── i18n/                # i18next configuration and language definitions
│   │   ├── index.ts
│   │   └── locales/
│   │       ├── en.json
│   │       ├── hi.json
│   │       └── mr.json
│   ├── navigation/          # React Navigation / Expo Router configurations
│   ├── screens/             # Screen implementations
│   │   ├── splash/
│   │   ├── onboarding/
│   │   ├── auth/            # Login, SignUp, ForgotPassword, GuestModal
│   │   ├── home/            # Home Dashboard
│   │   ├── chat/            # AI Legal Chat
│   │   ├── tools/           # Legal Tools Hub & tool sub-screens
│   │   ├── history/         # Chat and Case History
│   │   ├── profile/         # Settings, App Lock, Language, Data Purge
│   │   ├── admin/           # Role-gated Admin Portal
│   │   └── dev/             # Component Gallery (development only)
│   ├── store/               # Zustand state stores
│   │   ├── authStore.ts
│   │   ├── settingsStore.ts
│   │   └── guestStore.ts
│   ├── theme/               # Design tokens (Colors, Typography, Spacing, Radii)
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── index.ts
│   └── utils/               # Sanitization, formatters, audio/speech helpers
```

---

## 3. Navigation Hierarchy

```mermaid
flowchart TD
    ROOT[Root Navigator] --> SPLASH[Splash Screen]
    ROOT --> ONBOARDING[Onboarding Stack (First Launch)]
    ROOT --> AUTH[Auth Stack]
    ROOT --> APP[Main App Tabs]
    ROOT --> MODAL[Modal Stack]

    AUTH --> LOGIN[Login Screen]
    AUTH --> SIGNUP[Sign Up Screen]
    AUTH --> FORGOT[Forgot Password Screen]

    APP --> TAB_HOME[Home Dashboard]
    APP --> TAB_CHAT[AI Legal Chat]
    APP --> TAB_TOOLS[Legal Tools Hub]
    APP --> TAB_HIST[Chat History]
    APP --> TAB_PROF[Profile & Settings]

    TAB_TOOLS --> TOOL_IPCBNS[IPC to BNS Converter]
    TAB_TOOLS --> TOOL_FIR[FIR Step-by-Step Guide]
    TAB_TOOLS --> TOOL_RIGHTS[Know Your Rights]
    TAB_TOOLS --> TOOL_DOCS[Legal Document Formats]
    TAB_TOOLS --> TOOL_CYBER[Cyber Fraud 1930 Guide]
    TAB_TOOLS --> TOOL_SCENARIO[Scenario Guides]
    TAB_TOOLS --> TOOL_SEARCH[Bare Act Legal Search]
    TAB_TOOLS --> TOOL_GLOSSARY[Legal Glossary]
    TAB_TOOLS --> TOOL_CASES[Case Tracker / Diary]
    TAB_TOOLS --> TOOL_NALSA[Free Legal Aid Finder]
    TAB_TOOLS --> TOOL_DOCSCAN[Document AI Analysis]
    TAB_TOOLS --> TOOL_SAVED[Saved Library]

    MODAL --> SOS_SHEET[Emergency SOS Action Sheet]
    MODAL --> QUICK_RIGHTS[Police Stop Quick Rights Card]
    MODAL --> ADMIN_PORTAL[Admin Ops (Role Gated)]
```

---

## 4. State Management & Storage Separation

1. **Zustand (`/src/store`)**:
   - `authStore`: User profile, authentication state (`isAuthenticated`, `isGuest`), role (`citizen`, `advocate`, `admin`).
   - `guestStore`: Remaining free guest questions (`quota: 3`), decrement counter, session persistence.
   - `settingsStore`: App language (`en`, `hi`, `mr`), biometric app lock enabled, offline toggle simulation.
2. **TanStack Query (`@tanstack/react-query`)**:
   - Handles all remote API caching, query invalidation, and background refetching.
   - Configured with `persistQueryClient` backed by `AsyncStorage` to enable offline inspection of recent chat history and bookmarks.
3. **Storage Security Boundaries**:
   - `expo-secure-store`: Reserved strictly for sensitive auth credentials (`access_token`, `refresh_token`, biometric token). Never stores unencrypted profile data or logs.
   - `AsyncStorage`: Non-sensitive caching (chat history, user preferences, downloaded offline legal guides).
   - Zero hard-coded API secrets or private tokens in the application bundle.

---

## 5. API Layer & Mock Strategy

- Controlled by environment flag: `EXPO_PUBLIC_API_MODE="mock" | "live"`.
- When set to `mock`, all requests route to `/src/api/mock/fixtures` with synthetic network delays (200ms–800ms) simulating real-world Indian 4G/5G mobile conditions.
- **Interceptors**:
  - Request: Attaches `Authorization: Bearer <token>` from `expo-secure-store`. Attaches device identification headers for guest quota enforcement (`X-Device-Id`).
  - Response: Catches `401 Unauthorized`. Attempts silent token refresh via `POST /api/v1/auth/refresh`. If refresh fails, triggers automatic session cleanup and redirects to Login.
  - Error Mapper: Converts network timeouts, offline states, and server error codes into citizen-friendly localized strings (e.g., *"LawGPT is temporarily unavailable. Please check your internet connection and try again."*).

---

## 6. Offline & Low-Bandwidth Strategy

1. **Static Legal Datasets**:
   - Crucial citizen-survival information is bundled into the application binary in `/src/data/`:
     - Emergency helpline directory (`/src/constants/emergency.ts`)
     - DK Basu police guidelines & arrest rights
     - Common IPC to BNS section converter index
     - High-frequency legal glossary definitions
2. **NetInfo & Offline Banner**:
   - The app listens to network state via `@react-native-community/netinfo`.
   - When offline, a non-intrusive `OfflineBanner` alerts the user.
   - AI Chat clearly notifies: *"AI reasoning requires internet access. Offline rights handbook and emergency numbers remain fully operational."*
3. **Low-End Android Optimization (2–3 GB RAM Targets)**:
   - React Native **Hermes** engine strictly enabled.
   - `FlatList` with `initialNumToRender={8}`, `maxToRenderPerBatch={8}`, `windowSize={5}`, and `removeClippedSubviews={true}`.
   - Elimination of heavy run-time blur effects and complex physics animations; light use of `react-native-reanimated`.
   - SVG vector assets used for crisp, zero-memory-leak iconography.

---

## 7. Security, Privacy & Compliance

1. **Statutory Legal Disclaimers**:
   - Prominently rendered on Splash, Home, AI Chat output cards, and generated legal drafts:
     > *"LawGPT provides general statutory information and AI-generated guidance. It is not a substitute for advice from a qualified legal professional under the Advocates Act, 1961."*
2. **Quick Exit Feature**:
   - Prominent single-tap "Quick Exit" button in the AI chat that immediately redirects to an innocuous system state and clears sensitive text fields from the screen.
3. **Data Purge**:
   - A dedicated *"Delete All My Data"* option in Profile & Settings triggers `DELETE /api/v1/user/account` and flushes all local secure storage, cache, and chat records.
4. **Biometric Security**:
   - Optional local app lock utilizing `expo-local-authentication` (Fingerprint / Face ID / PIN) to protect confidential legal queries.
