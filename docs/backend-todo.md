# LawGPT – Backend Engineering Handoff & Implementation Specification

**Audience:** Backend Engineers / System Architects  
**Objective:** Complete implementation blueprint to replace the client mock layer with a high-concurrency production backend.  
**Reference API Contract:** [`/docs/api-contract.md`](file:///docs/api-contract.md)  
**Database Architecture:** PostgreSQL 16+ with `pgvector` & Supabase / Node.js Express/Fastify.

---

## 1. Database Schema (PostgreSQL DDL)

```sql
-- Enable UUID and vector extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Enum types
CREATE TYPE user_role AS ENUM ('citizen', 'advocate', 'admin');
CREATE TYPE risk_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY');

-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile VARCHAR(15) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'citizen',
    bar_council_number VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Guest Quota Table (Device-bound)
CREATE TABLE guest_quotas (
    device_id VARCHAR(128) PRIMARY KEY,
    remaining_queries INT DEFAULT 3,
    max_queries INT DEFAULT 3,
    last_reset_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Legal Statutory Corpus & Vector Embeddings
CREATE TABLE legal_corpus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    act_title VARCHAR(255) NOT NULL,       -- e.g., 'Bharatiya Nagarik Suraksha Sanhita, 2023'
    section_number VARCHAR(100) NOT NULL,  -- e.g., 'Section 47'
    section_title VARCHAR(255) NOT NULL,
    raw_text TEXT NOT NULL,
    plain_summary TEXT NOT NULL,
    embedding vector(1536),                -- OpenAI text-embedding-3-small or Gemini text-embedding-004
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX legal_corpus_embedding_idx ON legal_corpus USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 4. Chat Consultations
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL,            -- 'user' | 'assistant'
    query_text TEXT,
    response_payload JSONB,                 -- Must strictly conform to StructuredAIChatResponse schema
    risk_level risk_level DEFAULT 'LOW',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 2. API Endpoints Implementation Checklist

### Authentication & Sessions
- [ ] `POST /api/v1/auth/signup`
  - Validates `email`, `mobile` (+91 standard), hashes password with `bcrypt` (work factor 12).
  - Emits JWT access token (15m expiry) and refresh token (30d expiry).
- [ ] `POST /api/v1/auth/login`
  - Allows login via email or 10-digit mobile number.
- [ ] `POST /api/v1/auth/otp/send` & `/verify`
  - Integrate with TRAI DLT approved SMS Gateway (Gupshup / Exotel).
  - Store temporary 6-digit OTP in Redis with 300-second TTL.
- [ ] `POST /api/v1/auth/refresh`
  - Refresh token rotation with blacklisting of revoked tokens.

### Guest Device Quota
- [ ] `GET /api/v1/guest/quota`
  - Reads `X-Device-Id` header; upserts row with 3 free queries.
- [ ] `POST /api/v1/guest/consume`
  - Atomic decrement (`UPDATE guest_quotas SET remaining_queries = remaining_queries - 1 WHERE device_id = $1 AND remaining_queries > 0 RETURNING remaining_queries`).

### AI Legal Engine
- [ ] `POST /api/v1/chat/message`
  - Synchronous query endpoint.
- [ ] `GET /api/v1/chat/stream`
  - Server-Sent Events (SSE) streaming endpoint.
  - Headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`.

---

## 3. Recommended LLM System Prompt & Guardrails

```text
You are LawGPT, an authoritative AI legal assistant grounded in the sovereign laws of the Republic of India.
CRITICAL CONSTITUTIONAL & STATUTORY RULES:
1. Always base criminal law explanations on the 2023–2024 statutes:
   - Bharatiya Nyaya Sanhita, 2023 (BNS) replacing IPC
   - Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS) replacing CrPC
   - Bharatiya Sakshya Adhiniyam, 2023 (BSA) replacing IEA
2. Always indicate old corresponding sections (e.g., Section 318(4) BNS replaces Section 420 IPC).
3. If the user asks for illegal advice (bribery, evidence fabrication, tax evasion), REFUSE IMMEDIATELY, cite the relevant penal section, and explain legitimate lawful alternatives.
4. Output MUST parse into valid JSON strictly conforming to StructuredAIChatResponseSchema:
   {
     "summary": string,
     "relevantLaw": [{ "act": string, "section": string, "text": string, "verified": boolean }],
     "explanationSteps": [{ "step": number, "title": string, "description": string }],
     "whatYouCanDo": [string],
     "crucialDirective": string,
     "citations": [{ "caseTitle": string, "citation": string, "snippet": string }],
     "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY",
     "disclaimer": string
   }
5. Set "verified": true ONLY for statutes directly retrieved from the authenticated gazette corpus.
```

---

## 4. Rate Limiting & Abuse Prevention

- **Redis Token Bucket:**
  - Guest device: Max 3 queries lifetime without authentication.
  - Authenticated Citizen: 30 queries / minute; burst capacity 50.
  - Advocate: 120 queries / minute.
- **WAF Guardrails:** Cloudflare API Shield with SSL pinning, DDoS mitigation, and OWASP Top 10 blocking.

---

## 5. Observability, Logging & DPDP Act Compliance

- **Zero PII Logging:** User queries must NOT be logged in plaintext server logs.
- **Data Subject Rights:** Support automated hard-deletion trigger for DPDP Act 2023 right to erasure (`DELETE FROM users WHERE id = $1` cascading to all conversations and messages).
- **Audit Trails:** Record token refresh events and moderation interventions in tamper-evident audit logs.
