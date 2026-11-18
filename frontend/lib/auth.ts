import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

const SESSION_SECRET = process.env.SESSION_SECRET || 'examforge-secure-secret-key-992019283-sha512'

// Inactivity timeout: 20 minutes in milliseconds
export const INACTIVITY_TIMEOUT_MS = 20 * 60 * 1000

// Max failed attempts before lockout: 5 attempts
export const MAX_FAILED_LOGIN_ATTEMPTS = 5
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes

export interface SessionUser {
  id: number
  username: string
  fullName: string
  email: string
  role: 'admin' | 'student'
  lastActivity?: number
  sessionToken?: string
}

// In-memory rate limiting map for login attempts: ip -> { count, resetAt }
const loginRateLimitMap = new Map<string, { count: number; resetAt: number }>()

export function checkLoginRateLimit(ip: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now()
  const record = loginRateLimitMap.get(ip)

  if (!record || now > record.resetAt) {
    loginRateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 1000 })
    return { allowed: true }
  }

  if (record.count >= 15) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000)
    return { allowed: false, retryAfterSeconds: retryAfter }
  }

  record.count += 1
  return { allowed: true }
}

/**
 * Generates PBKDF2 hash and salt for secure password storage
 */
export function hashPassword(password: string, saltInput?: string): { hash: string; salt: string } {
  const salt = saltInput || crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
  return { hash, salt }
}

/**
 * Verifies password against PBKDF2 hash with constant-time comparison
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  if (!password || !hash || !salt) return false
  try {
    // Primary: 10,000 iterations
    const computed10k = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
    const bufHash = Buffer.from(hash)
    const buf10k = Buffer.from(computed10k)
    if (bufHash.length === buf10k.length && crypto.timingSafeEqual(bufHash, buf10k)) {
      return true
    }

    // Fallback: 1,000 iterations (for older seed compatibility)
    const computed1k = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
    const buf1k = Buffer.from(computed1k)
    if (bufHash.length === buf1k.length && crypto.timingSafeEqual(bufHash, buf1k)) {
      return true
    }

    return false
  } catch {
    return false
  }
}

/**
 * Creates a server-side session in auth_sessions table
 */
export async function createDatabaseSession(
  userId: number,
  role: 'admin' | 'student',
  ipAddress?: string,
  userAgent?: string
): Promise<{ sessionToken: string; expiresAt: Date }> {
  const sessionToken = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  await db.query(
    `INSERT INTO auth_sessions (user_id, role, session_token, ip_address, user_agent, expires_at, last_activity_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [userId, role, sessionToken, ipAddress || null, userAgent ? userAgent.slice(0, 500) : null, expiresAt]
  )

  return { sessionToken, expiresAt }
}

/**
 * Signs a session payload using HMAC-SHA256 with rolling activity timestamp
 */
export function signSession(user: SessionUser, sessionToken?: string): string {
  const now = Date.now()
  const payload = {
    ...user,
    sessionToken: sessionToken || user.sessionToken,
    lastActivity: now,
    exp: now + 7 * 24 * 60 * 60 * 1000, // 7 days max lifetime
    iat: now,
  }
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadStr)
    .digest('base64url')
  return `${payloadStr}.${signature}`
}

/**
 * Decodes and verifies token HMAC signature (stateless fast-path)
 */
export function verifySession(token?: string | null): SessionUser | null {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 2) return null

  const [payloadStr, signature] = parts
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadStr)
    .digest('base64url')

  if (signature.length !== expectedSig.length) return null
  const sigBuffer = Buffer.from(signature)
  const expBuffer = Buffer.from(expectedSig)
  if (!crypto.timingSafeEqual(sigBuffer, expBuffer)) return null

  try {
    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'))
    const now = Date.now()

    if (!payload.exp || now > payload.exp) return null
    if (payload.lastActivity && now - payload.lastActivity > INACTIVITY_TIMEOUT_MS) {
      return null
    }

    return {
      id: Number(payload.id),
      username: payload.username,
      fullName: payload.fullName || payload.username,
      email: payload.email,
      role: payload.role || 'student',
      lastActivity: payload.lastActivity || now,
      sessionToken: payload.sessionToken,
    }
  } catch {
    return null
  }
}

/**
 * Deep server-side session validation:
 * 1. Verifies HMAC & structure
 * 2. Verifies session exists in auth_sessions and is NOT revoked
 * 3. Verifies user account is active and NOT deleted
 */
export async function validateSessionWithDatabase(token?: string | null): Promise<SessionUser | null> {
  const sessionUser = verifySession(token)
  if (!sessionUser) return null

  try {
    // If sessionToken is present, check auth_sessions table
    if (sessionUser.sessionToken) {
      const [sessRows]: any = await db.query(
        `SELECT id, user_id, role, revoked_at, expires_at, last_activity_at 
         FROM auth_sessions 
         WHERE session_token = ? 
         LIMIT 1`,
        [sessionUser.sessionToken]
      )

      if (!sessRows || sessRows.length === 0) {
        return null // Session does not exist in DB
      }

      const sess = sessRows[0]
      if (sess.revoked_at) {
        return null // Revoked!
      }

      if (new Date(sess.expires_at).getTime() < Date.now()) {
        return null // Expired!
      }

      // Update last activity periodically (e.g. every 60 seconds)
      const lastAct = new Date(sess.last_activity_at).getTime()
      if (Date.now() - lastAct > 60000) {
        await db.query(
          `UPDATE auth_sessions SET last_activity_at = NOW() WHERE id = ?`,
          [sess.id]
        )
      }
    }

    // Verify account status in corresponding table
    const statusCheck = await checkAccountStatus(sessionUser.id, sessionUser.role)
    if (!statusCheck.active) {
      return null
    }

    return sessionUser
  } catch (error) {
    console.error('Error validating session with database:', error)
    return null
  }
}

/**
 * Checks if a user's account is active and not deleted or suspended
 */
export async function checkAccountStatus(
  userId: number,
  role: 'admin' | 'student'
): Promise<{ active: boolean; reason?: string }> {
  try {
    if (role === 'admin') {
      const [rows]: any = await db.query(
        `SELECT id, status, deleted_at, locked_until 
         FROM admin_users 
         WHERE id = ? 
         LIMIT 1`,
        [userId]
      )
      if (!rows || rows.length === 0) return { active: false, reason: 'Admin account not found' }
      const admin = rows[0]
      if (admin.deleted_at) return { active: false, reason: 'Account deleted' }
      if (admin.status !== 'active') return { active: false, reason: 'Account inactive' }
      if (admin.locked_until && new Date(admin.locked_until).getTime() > Date.now()) {
        return { active: false, reason: 'Account locked due to failed login attempts' }
      }
      return { active: true }
    } else {
      const [rows]: any = await db.query(
        `SELECT id, account_status, deleted_at, locked_until 
         FROM students 
         WHERE id = ? 
         LIMIT 1`,
        [userId]
      )
      if (!rows || rows.length === 0) return { active: false, reason: 'Student account not found' }
      const student = rows[0]
      if (student.deleted_at || student.account_status === 'deleted') {
        return { active: false, reason: 'Account deleted' }
      }
      if (student.account_status !== 'active') {
        return { active: false, reason: `Account status is ${student.account_status}` }
      }
      if (student.locked_until && new Date(student.locked_until).getTime() > Date.now()) {
        return { active: false, reason: 'Account temporarily locked' }
      }
      return { active: true }
    }
  } catch (err: any) {
    console.error('Error checking account status:', err)
    return { active: false, reason: err.message }
  }
}

/**
 * Checks whether a student has an active mock test assignment
 */
export async function checkMockTestAssignment(
  studentId: number,
  mockTestId: number
): Promise<{ assigned: boolean; status?: string }> {
  try {
    const [rows]: any = await db.query(
      `SELECT id, assignment_status, revoked_at 
       FROM mock_test_assignments 
       WHERE student_id = ? AND mock_test_id = ? 
       LIMIT 1`,
      [studentId, mockTestId]
    )

    if (!rows || rows.length === 0) {
      return { assigned: false, status: 'not_assigned' }
    }

    const assignment = rows[0]
    if (assignment.assignment_status === 'assigned' && !assignment.revoked_at) {
      return { assigned: true, status: 'assigned' }
    }

    return { assigned: false, status: assignment.assignment_status }
  } catch (error: any) {
    console.error('Error checking mock test assignment:', error)
    return { assigned: false, status: 'error' }
  }
}

/**
 * Revokes all sessions for a user (used on logout or student deletion)
 */
export async function revokeAllUserSessions(userId: number, role: 'admin' | 'student'): Promise<void> {
  try {
    await db.query(
      `UPDATE auth_sessions 
       SET revoked_at = NOW() 
       WHERE user_id = ? AND role = ? AND revoked_at IS NULL`,
      [userId, role]
    )
  } catch (error) {
    console.error('Error revoking user sessions:', error)
  }
}

/**
 * Revokes a single session by session_token
 */
export async function revokeSessionByToken(sessionToken?: string): Promise<void> {
  if (!sessionToken) return
  try {
    await db.query(
      `UPDATE auth_sessions 
       SET revoked_at = NOW() 
       WHERE session_token = ? AND revoked_at IS NULL`,
      [sessionToken]
    )
  } catch (error) {
    console.error('Error revoking session token:', error)
  }
}

/**
 * Logs an action to the audit_logs table
 */
export async function logAudit({
  actorId,
  actorRole,
  action,
  affectedStudentId,
  targetId,
  targetType,
  details,
  ipAddress,
  userAgent,
}: {
  actorId?: number | null
  actorRole?: string | null
  action: string
  affectedStudentId?: number | null
  targetId?: number | null
  targetType?: string | null
  details?: any
  ipAddress?: string | null
  userAgent?: string | null
}): Promise<void> {
  try {
    const detailsStr = typeof details === 'object' ? JSON.stringify(details) : details || null
    await db.query(
      `INSERT INTO audit_logs (actor_id, actor_role, action, affected_student_id, target_id, target_type, details, ip_address, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        actorId || null,
        actorRole || null,
        action,
        affectedStudentId || null,
        targetId || null,
        targetType || null,
        detailsStr,
        ipAddress || null,
        userAgent ? userAgent.slice(0, 500) : null,
      ]
    )
  } catch (error) {
    console.error('Failed to write audit log:', error)
  }
}

/**
 * Verifies username and password against database, with lockout protection
 */
export async function authenticateCredentials(
  usernameInput: string,
  passwordInput: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ user: SessionUser | null; error?: string; sessionToken?: string }> {
  const cleanUsername = (usernameInput || '').trim().toLowerCase()
  const cleanPassword = (passwordInput || '').trim()

  if (!cleanUsername || !cleanPassword) {
    return { user: null, error: 'Username and password are required' }
  }

  // Rate limit by IP
  if (ipAddress) {
    const rateCheck = checkLoginRateLimit(ipAddress)
    if (!rateCheck.allowed) {
      return { user: null, error: `Too many requests. Please wait ${rateCheck.retryAfterSeconds} seconds.` }
    }
  }

  try {
    // 1. Check in admin_users table first
    const [adminRows]: any = await db.query(
      `SELECT id, full_name, username, email, password_hash, password_salt, status, deleted_at, failed_login_attempts, locked_until 
       FROM admin_users 
       WHERE (LOWER(username) = ? OR LOWER(email) = ?) 
       LIMIT 1`,
      [cleanUsername, cleanUsername]
    )

    if (adminRows && adminRows.length > 0) {
      const admin = adminRows[0]

      if (admin.deleted_at) {
        return { user: null, error: 'Account has been deleted' }
      }
      if (admin.status !== 'active') {
        return { user: null, error: 'Admin account is inactive' }
      }
      if (admin.locked_until && new Date(admin.locked_until).getTime() > Date.now()) {
        return { user: null, error: 'Account locked due to excessive failed attempts. Please try again later.' }
      }

      const isValid = verifyPassword(cleanPassword, admin.password_hash, admin.password_salt)

      if (isValid) {
        // Reset failed attempts & update last login
        await db.query(
          `UPDATE admin_users 
           SET failed_login_attempts = 0, locked_until = NULL, last_login_at = NOW(), updated_at = NOW() 
           WHERE id = ?`,
          [admin.id]
        )

        const { sessionToken } = await createDatabaseSession(admin.id, 'admin', ipAddress, userAgent)

        const user: SessionUser = {
          id: admin.id,
          username: admin.username || cleanUsername,
          fullName: admin.full_name,
          email: admin.email,
          role: 'admin',
          sessionToken,
        }

        await logAudit({
          actorId: admin.id,
          actorRole: 'admin',
          action: 'LOGIN_SUCCESS',
          targetId: admin.id,
          targetType: 'admin_user',
          ipAddress,
          userAgent,
        })

        return { user, sessionToken }
      } else {
        // Failed password
        const attempts = (admin.failed_login_attempts || 0) + 1
        const shouldLock = attempts >= MAX_FAILED_LOGIN_ATTEMPTS
        const lockUntil = shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null

        await db.query(
          `UPDATE admin_users 
           SET failed_login_attempts = ?, locked_until = ?, updated_at = NOW() 
           WHERE id = ?`,
          [attempts, lockUntil, admin.id]
        )

        await logAudit({
          action: 'LOGIN_FAILED',
          targetId: admin.id,
          targetType: 'admin_user',
          details: { reason: 'Invalid password', attempts },
          ipAddress,
          userAgent,
        })

        return { user: null, error: shouldLock ? 'Account locked due to too many failed attempts' : 'Invalid credentials' }
      }
    }

    // 2. Check in students table
    const [studentRows]: any = await db.query(
      `SELECT id, full_name, username, email, password_hash, password_salt, account_status, deleted_at, failed_login_attempts, locked_until 
       FROM students 
       WHERE (LOWER(username) = ? OR LOWER(email) = ?) 
       LIMIT 1`,
      [cleanUsername, cleanUsername]
    )

    if (studentRows && studentRows.length > 0) {
      const student = studentRows[0]

      if (student.deleted_at || student.account_status === 'deleted') {
        return { user: null, error: 'Account has been deleted or deactivated' }
      }
      if (student.account_status !== 'active') {
        return { user: null, error: `Student account is ${student.account_status}` }
      }
      if (student.locked_until && new Date(student.locked_until).getTime() > Date.now()) {
        return { user: null, error: 'Account locked due to excessive failed attempts' }
      }

      let isValid = false
      if (student.password_hash && student.password_salt) {
        isValid = verifyPassword(cleanPassword, student.password_hash, student.password_salt)
      }

      if (isValid) {
        await db.query(
          `UPDATE students 
           SET failed_login_attempts = 0, locked_until = NULL, last_login_at = NOW(), updated_at = NOW() 
           WHERE id = ?`,
          [student.id]
        )

        const { sessionToken } = await createDatabaseSession(student.id, 'student', ipAddress, userAgent)

        const user: SessionUser = {
          id: student.id,
          username: student.username || cleanUsername,
          fullName: student.full_name,
          email: student.email,
          role: 'student',
          sessionToken,
        }

        await logAudit({
          actorId: student.id,
          actorRole: 'student',
          action: 'LOGIN_SUCCESS',
          affectedStudentId: student.id,
          targetId: student.id,
          targetType: 'student',
          ipAddress,
          userAgent,
        })

        return { user, sessionToken }
      } else {
        const attempts = (student.failed_login_attempts || 0) + 1
        const shouldLock = attempts >= MAX_FAILED_LOGIN_ATTEMPTS
        const lockUntil = shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null

        await db.query(
          `UPDATE students 
           SET failed_login_attempts = ?, locked_until = ?, updated_at = NOW() 
           WHERE id = ?`,
          [attempts, lockUntil, student.id]
        )

        await logAudit({
          action: 'LOGIN_FAILED',
          affectedStudentId: student.id,
          targetId: student.id,
          targetType: 'student',
          details: { reason: 'Invalid student password', attempts },
          ipAddress,
          userAgent,
        })

        return { user: null, error: shouldLock ? 'Account locked due to excessive failed attempts' : 'Invalid credentials' }
      }
    }

    return { user: null, error: 'User account not found' }
  } catch (err: any) {
    console.error('Error in authenticateCredentials:', err)
    return { user: null, error: 'Authentication service error' }
  }
}

/**
 * Extract and validate user from request cookie (checks DB)
 */
export async function authenticateUser(req: NextRequest): Promise<SessionUser | null> {
  const token = req.cookies.get('examforge_session')?.value
  return validateSessionWithDatabase(token)
}

/**
 * Middleware helper for API route handlers: Requires authenticated Admin
 * Returns { user } on success, or { response } containing HTTP 401/403 NextResponse on failure
 */
export async function requireAdmin(
  req: NextRequest
): Promise<{ user: SessionUser; response?: never } | { user?: never; response: NextResponse }> {
  const token = req.cookies.get('examforge_session')?.value
  const user = await validateSessionWithDatabase(token)

  if (!user) {
    return {
      response: NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required', code: 'UNAUTHENTICATED' },
        { status: 401 }
      ),
    }
  }

  if (user.role !== 'admin') {
    // Log unauthorized admin access attempt
    await logAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      targetType: 'admin_route',
      details: { url: req.nextUrl.pathname, role: user.role },
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
      userAgent: req.headers.get('user-agent') || null,
    })

    return {
      response: NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      ),
    }
  }

  return { user }
}

/**
 * Middleware helper for API route handlers: Requires authenticated Student (or Admin acting on student behalf)
 */
export async function requireStudent(
  req: NextRequest
): Promise<{ user: SessionUser; response?: never } | { user?: never; response: NextResponse }> {
  const token = req.cookies.get('examforge_session')?.value
  const user = await validateSessionWithDatabase(token)

  if (!user) {
    return {
      response: NextResponse.json(
        { success: false, error: 'Unauthorized: Student authentication required', code: 'UNAUTHENTICATED' },
        { status: 401 }
      ),
    }
  }

  return { user }
}
