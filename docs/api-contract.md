# LawGPT API Contract & Schemas

## Environment Configuration
- `EXPO_PUBLIC_API_MODE`: `"mock"` | `"live"`
- `EXPO_PUBLIC_API_URL`: Base URL (default `https://api.lawgpt.in/v1`)
- `EXPO_PUBLIC_REQUEST_TIMEOUT_MS`: `15000`

---

## 1. Authentication & Session Schemas

### `POST /api/v1/auth/login` — `[HYBRID]`
- **Mode:** Switches dynamically based on `EXPO_PUBLIC_API_MODE`. In mock mode, validates advocate / citizen test fixtures with local token generation. In live mode, authenticates against Supabase/Node backend over HTTPS.
- **Request Body:**
  ```json
  {
    "identifier": "advocate@chambers.in", // Email or 10-digit mobile (+91)
    "password": "SecurePassword123!",
    "rememberMe": true
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "user": {
      "id": "usr_94821",
      "fullName": "Adv. Rajesh Kumar",
      "email": "advocate@chambers.in",
      "mobile": "9876543210",
      "role": "advocate", // "citizen" | "advocate" | "admin"
      "barCouncilNumber": "MAH/1482/2019"
    }
  }
  ```

### `POST /api/v1/auth/signup` — `[HYBRID]`
- **Mode:** Hybrid: Offline seed state with hardware token persistence; live PostgreSQL user upsert in live mode.
- **Request Body:**
  ```json
  {
    "fullName": "Priya Sharma",
    "email": "priya@example.com",
    "mobile": "9876543211",
    "password": "Password123!",
    "role": "citizen", // "citizen" | "advocate"
    "barCouncilNumber": null,
    "agreedToTerms": true
  }
  ```

### `POST /api/v1/auth/otp/send` — `[MOCK]` (Real SMS Gateway scheduled Q1 2027)
- **Request Body:** `{ "mobile": "9876543210" }`
- **Response (200 OK):** `{ "success": true, "message": "OTP sent successfully" }`

### `POST /api/v1/auth/otp/verify` — `[MOCK]` (Default dev code: 582914)
- **Request Body:** `{ "mobile": "9876543210", "otp": "582914" }`
- **Response (200 OK):** Returns `{ accessToken, refreshToken, user }`

### `POST /api/v1/auth/refresh` — `[HYBRID]`
- **Request Body:** `{ "refreshToken": "eyJhbGciOi..." }`
- **Response (200 OK):** `{ "accessToken": "eyJhbGciOi..." }`

---

## 2. Guest Mode Quota Contract

### `GET /api/v1/guest/quota` — `[REAL / CLIENT-ENFORCED]`
- **Mode:** Hardware UUID device quota tracked in `AsyncStorage` + server sync header.
- **Headers:** `X-Device-Id: <uuid>`
- **Response (200 OK):**
  ```json
  {
    "remainingQueries": 3, // 3, 2, 1, or 0
    "maxQueries": 3,
    "isLimitReached": false,
    "deviceId": "550e8400-e29b-41d4-a716-446655440000"
  }
  ```

---

## 3. Structured AI Chat & Streaming Endpoints

### `POST /api/v1/chat/message` — `[HYBRID]`
- **Mode:** Uses local fallback statutory intelligence offline; connects to streaming Gemini/OpenAI backend when live.

### `GET /api/v1/chat/stream` — `[HYBRID]`
- **Mode:** Server-Sent Events (SSE) / WebSocket chunk streaming. Fallback simulated chunk emitter in offline/mock mode.

```typescript
export interface RelevantLawItem {
  act: string;         // e.g., "Bharatiya Nagarik Suraksha Sanhita, 2023"
  section: string;     // e.g., "Section 47 & 50"
  text: string;        // Brief summary or quote
  verified: boolean;   // CRITICAL: True ONLY if matched to authentic legal corpus
}

export interface ExplanationStep {
  step: number;        // 1, 2, 3...
  title: string;       // e.g., "Right to Know Grounds of Arrest"
  description: string; // Detail explanation
}

export interface CitationItem {
  caseTitle: string;   // e.g., "D.K. Basu v. State of West Bengal"
  citation: string;    // e.g., "AIR 1997 SC 610"
  snippet: string;     // Contextual excerpt
}

export interface StructuredAIChatResponse {
  summary: string;
  relevantLaw: RelevantLawItem[];
  explanationSteps: ExplanationStep[];
  whatYouCanDo: string[];
  crucialDirective: string;
  citations: CitationItem[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  disclaimer: string;
}
```

### Zod Validation Schema:
```typescript
import { z } from 'zod';

export const RelevantLawItemSchema = z.object({
  act: z.string().min(1),
  section: z.string().min(1),
  text: z.string().min(1),
  verified: z.boolean().default(false), // Never default to true!
});

export const ExplanationStepSchema = z.object({
  step: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
});

export const CitationItemSchema = z.object({
  caseTitle: z.string().min(1),
  citation: z.string().min(1),
  snippet: z.string().min(1),
});

export const StructuredAIChatResponseSchema = z.object({
  summary: z.string().min(1),
  relevantLaw: z.array(RelevantLawItemSchema).min(1),
  explanationSteps: z.array(ExplanationStepSchema).min(1),
  whatYouCanDo: z.array(z.string()).min(1),
  crucialDirective: z.string().min(1),
  citations: z.array(CitationItemSchema).default([]),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY']).default('LOW'),
  disclaimer: z.string().default(
    'LawGPT provides general legal information. It is not a substitute for advice from a qualified legal professional.'
  ),
});
```

---

## 4. Legal Tools & Data Models

### IPC to BNS Mapping — `[REAL / EMBEDDED OFFLINE]`
- **Mode:** Bundled in app binary via `src/data/ipc_to_bns.json`. Zero network required.

### FIR Step-by-Step Guide — `[REAL / EMBEDDED OFFLINE]`
- **Mode:** Bundled in app binary via `src/data/fir_guide.json`.

### Emergency Contacts — `[REAL / EMBEDDED OFFLINE]`
- **Mode:** Bundled in `src/constants/emergency.ts` with audited verification dates.

### Legal Templates & Form Builder — `[REAL / EMBEDDED OFFLINE]`
- **Mode:** Bundled schemas in `src/data/templates/` with client-side PDF rendering via `expo-print`.

### Document Clause Analysis `POST /api/v1/tools/analyze-document` — `[HYBRID]`
- **Mode:** Client performs 10 MB limit & format check; mock/live API performs clause extraction and returns validated `AnalyzedDocument`.

### Admin Metrics `GET /api/v1/admin/metrics` — `[HYBRID]`
- **Mode:** Role-gated. Returns local moderation stats in mock mode; live Supabase telemetry in production.

