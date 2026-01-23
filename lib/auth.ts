/**
 * Admin authentication utility
 * Admin is determined by IsRockstar = true in localStorage (client-side)
 */

/**
 * Check if user is admin (client-side)
 * Reads from localStorage
 */
export function checkAdminStatus(): boolean {
  if (typeof window === 'undefined') return false
  const isRockstar = localStorage.getItem('IsRockstar')
  return isRockstar === 'true' || isRockstar === 'True' || isRockstar === 'TRUE'
}

/**
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

/**
 * Check admin status from request header (server-side)
 */
export function isAdminFromHeader(request: Request): boolean {
  const isRockstar = request.headers.get('x-is-rockstar')
  return isRockstar === 'true' || isRockstar === 'True' || isRockstar === 'TRUE'
}

