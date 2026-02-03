/**
 * Roles Management Page
 * 
 * Server Component for managing roles and permissions.
 * Displays all roles with user counts and permission counts.
 * 
 * @module app/(dashboard)/roles/page
 */

import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getRoles, getPermissionsByCategory } from "@/features/roles/actions"
import { RolesPageContent } from "@/features/roles/components/RolesPageContent"
import { db } from "@/lib/db"

export const metadata: Metadata = {
  title: "إدارة الأدوار | UniCore-OS",
  description: "إدارة الأدوار والصلاحيات في النظام",
}

export default async function RolesPage() {
  // Check authentication
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  // Check permission (server-side)
  const hasPermission = 
    session.user.isSystemRole || 
    session.user.permissions?.includes("role.view")

  if (!hasPermission) {
    redirect("/unauthorized")
  }

  // Fetch data
  const [roles, permissionCategories] = await Promise.all([
    getRoles(),
    getPermissionsByCategory(),
  ])

  // Get user permissions for UI controls
  const userPermissions = session.user.permissions ?? []
  const isSystemRole = session.user.isSystemRole ?? false

  return (
    <RolesPageContent
      roles={roles}
      permissionCategories={permissionCategories}
      userPermissions={userPermissions}
      isSystemRole={isSystemRole}
    />
  )
}
