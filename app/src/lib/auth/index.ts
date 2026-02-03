/**
 * Auth Module Exports
 * 
 * Central export point for all authentication-related utilities.
 * 
 * @module lib/auth
 */

// Re-export from main auth config (at parent level)
export { 
  auth, 
  signIn, 
  signOut, 
  handlers,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from '../auth'

// Re-export permission utilities
export {
  getPermissions,
  requirePermission,
  requireAllPermissions,
  requireAnyPermission,
  requireAuth,
} from './permissions'

export type { Permission } from './permissions'
