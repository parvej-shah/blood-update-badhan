import 'server-only'

import bcrypt from 'bcryptjs'
import { auth } from './auth-instance'

// Server-side only - do not import in client components

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

/**
 * Compare a plain password with a hashed password
 */
export async function comparePassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword)
}

/**
 * Get the current session (server-side)
 */
export async function getSession() {
  return auth()
}

/**
 * Get the current user from session (server-side)
 */
export async function getCurrentUser() {
  const session = await getSession()
  return session?.user || null
}

/**
 * Check if user has a specific role
 */
export async function hasRole(roleName: string): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user || !user.roles) return false
  return user.roles.includes(roleName)
}

/**
 * Check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole('admin')
}

/**
 * Check if user is moderator
 */
export async function isModerator(): Promise<boolean> {
  return hasRole('moderator')
}

/**
 * Check if user is admin or moderator
 */
export async function isAdminOrModerator(): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user || !user.roles) return false
  return user.roles.includes('admin') || user.roles.includes('moderator')
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized: Authentication required')
  }
  return user
}

/**
 * Require admin role - throws error if not admin
 */
export async function requireAdmin() {
  const user = await requireAuth()
  if (!user.roles || !user.roles.includes('admin')) {
    throw new Error('Forbidden: Admin access required')
  }
  return user
}

/**
 * Require moderator or admin role - throws error if not moderator/admin
 */
export async function requireModerator() {
  const user = await requireAuth()
  if (!user.roles || (!user.roles.includes('moderator') && !user.roles.includes('admin'))) {
    throw new Error('Forbidden: Moderator or admin access required')
  }
  return user
}

// Legacy function for backward compatibility (deprecated)
/**
 * @deprecated Use getCurrentUser() and check roles instead
 */
export function isAdminFromHeader(request: Request): boolean {
  const isRockstar = request.headers.get('x-is-rockstar')
  return isRockstar === 'true' || isRockstar === 'True' || isRockstar === 'TRUE'
}
