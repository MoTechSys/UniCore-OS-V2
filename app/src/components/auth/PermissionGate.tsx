/**
 * PermissionGate Component
 * 
 * Client component that conditionally renders children based on user permissions.
 * Useful for hiding UI elements that require specific permissions.
 * 
 * @module components/auth/PermissionGate
 */

'use client'

import { usePermissions } from '@/hooks/use-permissions'
import type { ReactNode } from 'react'

interface PermissionGateProps {
  /** Single permission required */
  permission?: string
  /** Multiple permissions - user needs ALL of them */
  permissions?: string[]
  /** Multiple permissions - user needs ANY of them */
  anyOf?: string[]
  /** Content to show if user has permission */
  children: ReactNode
  /** Content to show if user doesn't have permission (optional) */
  fallback?: ReactNode
}

/**
 * Conditionally render content based on user permissions
 * 
 * @example
 * ```tsx
 * // Single permission
 * <PermissionGate permission="user.create">
 *   <CreateUserButton />
 * </PermissionGate>
 * 
 * // All permissions required
 * <PermissionGate permissions={['course.edit', 'course.delete']}>
 *   <CourseManagement />
 * </PermissionGate>
 * 
 * // Any permission
 * <PermissionGate anyOf={['quiz.create', 'quiz.edit']}>
 *   <QuizEditor />
 * </PermissionGate>
 * 
 * // With fallback
 * <PermissionGate permission="admin.access" fallback={<AccessDenied />}>
 *   <AdminPanel />
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  permission,
  permissions,
  anyOf,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission, hasAllPermissions, hasAnyPermission, isLoading } = usePermissions()
  
  // Don't render anything while loading
  if (isLoading) {
    return null
  }
  
  let hasAccess = false
  
  if (permission) {
    hasAccess = hasPermission(permission)
  } else if (permissions && permissions.length > 0) {
    hasAccess = hasAllPermissions(permissions)
  } else if (anyOf && anyOf.length > 0) {
    hasAccess = hasAnyPermission(anyOf)
  } else {
    // No permission specified, allow access
    hasAccess = true
  }
  
  return hasAccess ? <>{children}</> : <>{fallback}</>
}
