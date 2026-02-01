/**
 * Client-side authentication utilities
 * These functions can be safely used in client components
 */

/**
 * @deprecated Use NextAuth useSession hook instead
 * Check if user is admin (client-side)
 * Reads from localStorage
 */
export function checkAdminStatus(): boolean {
  if (typeof window === 'undefined') return false
  const isRockstar = localStorage.getItem('IsRockstar')
  return isRockstar === 'true' || isRockstar === 'True' || isRockstar === 'TRUE'
}

/**
 * @deprecated Use NextAuth useSession hook instead
 * Set admin status in localStorage
 */
export function setAdminStatus(isAdmin: boolean): void {
  if (typeof window === 'undefined') return
  if (isAdmin) {
    localStorage.setItem('IsRockstar', 'true')
  } else {
    localStorage.removeItem('IsRockstar')
  }
}

