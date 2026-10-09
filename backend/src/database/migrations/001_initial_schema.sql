-- LawGPT Initial Schema Migration 001
-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- 1. Administrative Users Table
CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'reviewer', -- 'support' | 'reviewer' | 'subadmin' | 'admin'
    totp_secret TEXT,
    totp_enabled INTEGER NOT NULL DEFAULT 0,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 2. Admin Web Sessions Table
CREATE TABLE IF NOT EXISTS admin_sessions (
    id TEXT PRIMARY KEY,
    admin_user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    refresh_token_hash TEXT NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    expires_at TEXT NOT NULL,
    revoked_at TEXT,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user ON admin_sessions(admin_user_id);

-- 3. Append-Only Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    actor_id TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    object_type TEXT NOT NULL,
    object_id TEXT NOT NULL,
    before_state TEXT,
    after_state TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Trigger to enforce append-only immutability on audit_logs
CREATE TRIGGER IF NOT EXISTS prevent_audit_logs_update
BEFORE UPDATE ON audit_logs
BEGIN
    SELECT RAISE(ABORT, 'Audit log entries are strictly append-only and cannot be updated');
END;

CREATE TRIGGER IF NOT EXISTS prevent_audit_logs_delete
BEFORE DELETE ON audit_logs
BEGIN
    SELECT RAISE(ABORT, 'Audit log entries are strictly append-only and cannot be deleted');
END;

-- 4. Mobile Application Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    mobile TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'citizen', -- 'citizen' | 'advocate'
    bar_council_number TEXT,
    free_quota_used INTEGER DEFAULT 0,
    is_suspended INTEGER DEFAULT 0,
    is_blocked INTEGER DEFAULT 0,
    suspension_reason TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);

-- 5. Mobile User Sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    device_name TEXT,
    refresh_token_hash TEXT NOT NULL,
    ip_address TEXT,
    last_active_at TEXT NOT NULL,
    revoked_at TEXT,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);

-- 6. Content Items (Statutory Head Records)
CREATE TABLE IF NOT EXISTS content_item (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    key TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'en',
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'in_review' | 'reviewed' | 'published' | 'archived'
    current_version_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(type, key, language)
);
CREATE INDEX IF NOT EXISTS idx_content_item_type_status ON content_item(type, status);

-- 7. Content Versions (Immutable revisions)
CREATE TABLE IF NOT EXISTS content_version (
    id TEXT PRIMARY KEY,
    content_item_id TEXT NOT NULL REFERENCES content_item(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    body_json TEXT NOT NULL,
    source TEXT,
    section_reference TEXT,
    created_by TEXT NOT NULL REFERENCES admin_users(id),
    review_status TEXT NOT NULL DEFAULT 'draft',
    reviewed_by TEXT REFERENCES admin_users(id),
    review_notes TEXT,
    reviewed_at TEXT,
    created_at TEXT NOT NULL,
    UNIQUE(content_item_id, version_number)
);
CREATE INDEX IF NOT EXISTS idx_content_version_item ON content_version(content_item_id);

-- 8. AI Chat Logs (Privacy-preserving telemetry)
CREATE TABLE IF NOT EXISTS chat_logs (
    id TEXT PRIMARY KEY,
    user_id_hash TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    citations_json TEXT NOT NULL,
    verified_flags INTEGER NOT NULL DEFAULT 0,
    model TEXT NOT NULL,
    prompt_version TEXT NOT NULL,
    latency_ms INTEGER NOT NULL,
    risk_level TEXT NOT NULL DEFAULT 'LOW',
    flags_json TEXT,
    review_status TEXT DEFAULT 'pending',
    reviewer_notes TEXT,
    reviewed_by TEXT REFERENCES admin_users(id),
    reviewed_at TEXT,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_chat_logs_review_status ON chat_logs(review_status);
CREATE INDEX IF NOT EXISTS idx_chat_logs_created_at ON chat_logs(created_at);

-- 9. QA Benchmark Test Cases
CREATE TABLE IF NOT EXISTS qa_test_cases (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    question TEXT NOT NULL,
    expected_statute TEXT NOT NULL,
    critical_directive TEXT NOT NULL,
    risk_level TEXT NOT NULL DEFAULT 'LOW',
    last_run_answer TEXT,
    last_run_latency_ms INTEGER,
    last_run_citations TEXT,
    reviewer_verdict TEXT,
    reviewer_notes TEXT,
    score REAL,
    updated_at TEXT NOT NULL
);

-- 10. Dynamic App Configuration Store
CREATE TABLE IF NOT EXISTS app_config (
    key TEXT PRIMARY KEY,
    value_json TEXT NOT NULL,
    value_type TEXT NOT NULL, -- 'boolean' | 'string' | 'number' | 'object'
    description TEXT,
    is_public INTEGER NOT NULL DEFAULT 0,
    updated_by TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 11. Emergency & Legal Aid Directory
CREATE TABLE IF NOT EXISTS emergency_directory (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    number TEXT NOT NULL,
    category TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'National',
    source_url TEXT NOT NULL,
    verified_on TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 12. DPDP Act Data Deletion Requests
CREATE TABLE IF NOT EXISTS data_deletion_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_identifier TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    sla_due_date TEXT NOT NULL,
    completed_at TEXT,
    completed_by TEXT,
    rejection_reason TEXT,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON data_deletion_requests(status);
