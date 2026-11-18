-- Migration 004: Role-Based Authentication, Session Management, Mock Test Assignments, and Audit Logs

-- 1. Ensure students table has required columns for password hashing, soft delete, and account lock
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_salt VARCHAR(100),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP NULL;

-- 2. Ensure admin_users table has deleted_at and lock columns
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP NULL;

-- 3. Create auth_sessions table for server-side token & session tracking and immediate invalidation
CREATE TABLE IF NOT EXISTS auth_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'admin' or 'student'
    session_token VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(500) NULL,
    expires_at TIMESTAMP NOT NULL,
    last_activity_at TIMESTAMP NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id, role, revoked_at);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(session_token);

-- 4. Create mock_test_assignments table
CREATE TABLE IF NOT EXISTS mock_test_assignments (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    mock_test_id BIGINT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    assigned_by BIGINT NULL REFERENCES admin_users(id) ON DELETE SET NULL,
    assignment_status VARCHAR(50) NOT NULL DEFAULT 'assigned', -- 'assigned', 'revoked', 'completed'
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_student_mock_test UNIQUE (student_id, mock_test_id)
);

CREATE INDEX IF NOT EXISTS idx_mta_student ON mock_test_assignments(student_id, assignment_status);
CREATE INDEX IF NOT EXISTS idx_mta_test ON mock_test_assignments(mock_test_id, assignment_status);

-- 5. Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id BIGINT NULL,
    actor_role VARCHAR(50) NULL,
    action VARCHAR(100) NOT NULL,
    affected_student_id BIGINT NULL,
    target_id BIGINT NULL,
    target_type VARCHAR(50) NULL,
    details TEXT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_student ON audit_logs(affected_student_id);
