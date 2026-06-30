CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    password_updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE users
SET password_updated_at = COALESCE(password_updated_at, created_at, CURRENT_TIMESTAMP);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE users
SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS locked BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(128);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS two_factor_enabled_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS role_definitions (
    name VARCHAR(50) PRIMARY KEY,
    description VARCHAR(500) NOT NULL,
    permissions TEXT NOT NULL,
    system_role BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_password_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_password_history_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_password_history_user_created
    ON user_password_history (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS user_sync_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL UNIQUE,
    user_id UUID NOT NULL,
    username VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'RETRYING', 'SYNCED', 'FAILED')),
    retry_count INT NOT NULL DEFAULT 0,
    max_retries INT NOT NULL DEFAULT 5,
    next_retry_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_sync_outbox_polling
    ON user_sync_outbox (status, next_retry_at, created_at);

CREATE INDEX IF NOT EXISTS idx_user_sync_outbox_user_created
    ON user_sync_outbox (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS user_sync_dlq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    user_id UUID NOT NULL,
    username VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    retry_count INT NOT NULL,
    failure_reason TEXT,
    payload_json TEXT,
    failed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_sync_dlq_user_failed
    ON user_sync_dlq (user_id, failed_at DESC);
