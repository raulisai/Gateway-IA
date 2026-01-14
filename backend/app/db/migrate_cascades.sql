-- Migration: Add CASCADE DELETE to foreign keys
-- Date: 2026-01-14
-- Description: Ensures that deleting gateway keys also deletes associated request logs

-- SQLite doesn't support ALTER CONSTRAINT, so we need to recreate the table

-- Step 1: Create a backup of request_logs
CREATE TABLE IF NOT EXISTS request_logs_backup AS SELECT * FROM request_logs;

-- Step 2: Drop the old table
DROP TABLE IF EXISTS request_logs;

-- Step 3: Recreate with CASCADE DELETE
CREATE TABLE request_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    gateway_key_id TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    complexity TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    prompt_tokens INTEGER NOT NULL,
    completion_tokens INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,
    cost_usd REAL NOT NULL,
    latency_ms INTEGER NOT NULL,
    cache_hit INTEGER NOT NULL DEFAULT 0,
    status_code INTEGER NOT NULL,
    error_message TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (gateway_key_id) REFERENCES gateway_keys (id) ON DELETE CASCADE
);

-- Step 4: Restore data
INSERT INTO request_logs SELECT * FROM request_logs_backup;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_request_logs_user_created ON request_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_request_logs_model ON request_logs(model);
CREATE INDEX IF NOT EXISTS idx_request_logs_complexity ON request_logs(complexity);
CREATE INDEX IF NOT EXISTS idx_request_logs_created ON request_logs(created_at DESC);

-- Step 6: Drop backup table
DROP TABLE IF EXISTS request_logs_backup;
