"use server"

/**
 * Role Management Server Actions
 * 
 * Server-side actions for managing roles and permissions.
 * All actions require proper authentication and authorization.
 * 
 * @module features/roles/actions
 */

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

// ============================================
// TYPES
// ============================================

interface ActionResult {
  success: boolean
  error?: string
  data?: unknown
}

interface RoleWithDetails {
  id: string
  code: string
  nameAr: string
  nameEn: string | null
  description: string | null
  isSystem: boolean
  createdAt: Date
  _count: {
    users: number
    permissions: number
  }
}

interface PermissionCategory {
  category: string
  categoryNameAr: string
  permissions: {
    id: string
    code: string
    nameAr: string
    nameEn: string
    description: string | null
  }[]
}

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createRoleSchema = z.object({
  code: z
    .string()
    .min(2, "الكود يجب أن يكون حرفين على الأقل")
    .max(50, "الكود يجب أن يكون أقل من 50 حرف")
    .regex(/^[A-Z_]+$/, "الكود يجب أن يكون بأحرف كبيرة وشرطات سفلية فقط"),
  nameAr: z.string().min(2, "الاسم العربي مطلوب"),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  permissionIds: z.array(z.string()),
})

const updateRoleSchema = z.object({
  id: z.string(),
  nameAr: z.string().min(2, "الاسم العربي مطلوب"),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  permissionIds: z.array(z.string()),
})

// ============================================
// CATEGORY NAMES (Arabic)
// ============================================

const categoryNames: Record<string, string> = {
  users: "إدارة المستخدمين",
  roles: "إدارة الأدوار",
  colleges: "إدارة الكليات",
  departments: "إدارة الأقسام",
  majors: "إدارة التخصصات",
  courses: "إدارة المقررات",
  semesters: "إدارة الفصول",
  sections: "إدارة الشُعب",
  enrollments: "إدارة التسجيل",
  quizzes: "إدارة الاختبارات",
  questions: "إدارة الأسئلة",
  attempts: "إدارة المحاولات",
  files: "إدارة الملفات",
  notifications: "إدارة الإشعارات",
  reports: "إدارة التقارير",
  settings: "إدارة الإعدادات",
  audit: "سجل المراجعة",
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function checkPermission(requiredPermission: string): Promise<boolean> {
  const session = await auth()
  if (!session?.user) return false
  
  // System roles have all permissions
  if (session.user.isSystemRole) return true
  
  return session.user.permissions?.includes(requiredPermission) ?? false
}

// ============================================
// READ ACTIONS
// ============================================

/**
 * Get all roles with user and permission counts
 */
export async function getRoles(): Promise<RoleWithDetails[]> {
  const hasPermission = await checkPermission("role.view")
  if (!hasPermission) {
    redirect("/unauthorized")
  }

  const roles = await db.role.findMany({
    where: {
      deletedAt: null,
    },
    include: {
      _count: {
        select: {
          users: true,
          permissions: true,
        },
      },
    },
    orderBy: [
      { isSystem: "desc" },
      { createdAt: "asc" },
    ],
  })

  return roles
}

/**
 * Get a single role with its permissions
 */
export async function getRole(id: string) {
  const hasPermission = await checkPermission("role.view")
  if (!hasPermission) {
    redirect("/unauthorized")
  }

  const role = await db.role.findUnique({
    where: { id },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
      _count: {
        select: {
          users: true,
        },
      },
    },
  })

  return role
}

/**
 * Get all permissions grouped by category
 */
export async function getPermissionsByCategory(): Promise<PermissionCategory[]> {
  const permissions = await db.permission.findMany({
    orderBy: [
      { category: "asc" },
      { code: "asc" },
    ],
  })

  // Group by category
  const grouped = permissions.reduce<Record<string, PermissionCategory["permissions"]>>(
    (acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = []
      }
      acc[permission.category].push({
        id: permission.id,
        code: permission.code,
        nameAr: permission.nameAr,
        nameEn: permission.nameEn,
        description: permission.description,
      })
      return acc
    },
    {}
  )

  // Convert to array with category names
  return Object.entries(grouped).map(([category, perms]) => ({
    category,
    categoryNameAr: categoryNames[category] ?? category,
    permissions: perms,
  }))
}

// ============================================
// WRITE ACTIONS
// ============================================

/**
 * Create a new role with permissions
 */
export async function createRole(
  data: z.infer<typeof createRoleSchema>
): Promise<ActionResult> {
  try {
    const hasPermission = await checkPermission("role.create")
    if (!hasPermission) {
      return { success: false, error: "ليس لديك صلاحية لإنشاء الأدوار" }
    }

    const validated = createRoleSchema.parse(data)

    // Check if code already exists
    const existing = await db.role.findUnique({
      where: { code: validated.code },
    })

    if (existing) {
      return { success: false, error: "كود الدور موجود مسبقاً" }
    }

    // Create role with permissions
    const role = await db.role.create({
      data: {
        code: validated.code,
        nameAr: validated.nameAr,
        nameEn: validated.nameEn ?? null,
        description: validated.description ?? null,
        isSystem: false,
        permissions: {
          create: validated.permissionIds.map((permissionId) => ({
            permissionId,
          })),
        },
      },
    })

    revalidatePath("/roles")
    return { success: true, data: role }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError
      return { success: false, error: zodError.issues[0]?.message ?? "بيانات غير صالحة" }
    }
    console.error("Error creating role:", error)
    return { success: false, error: "فشل في إنشاء الدور" }
  }
}

/**
 * Update an existing role
 */
export async function updateRole(
  data: z.infer<typeof updateRoleSchema>
): Promise<ActionResult> {
  try {
    const hasPermission = await checkPermission("role.update")
    if (!hasPermission) {
      return { success: false, error: "ليس لديك صلاحية لتعديل الأدوار" }
    }

    const validated = updateRoleSchema.parse(data)

    // Check if role exists and is not system
    const existing = await db.role.findUnique({
      where: { id: validated.id },
    })

    if (!existing) {
      return { success: false, error: "الدور غير موجود" }
    }

    if (existing.isSystem) {
      return { success: false, error: "لا يمكن تعديل الأدوار الأساسية" }
    }

    // Update role and replace permissions
    await db.$transaction(async (tx) => {
      // Delete existing permissions
      await tx.rolePermission.deleteMany({
        where: { roleId: validated.id },
      })

      // Update role and add new permissions
      await tx.role.update({
        where: { id: validated.id },
        data: {
          nameAr: validated.nameAr,
          nameEn: validated.nameEn ?? null,
          description: validated.description ?? null,
          permissions: {
            create: validated.permissionIds.map((permissionId) => ({
              permissionId,
            })),
          },
        },
      })
    })

    revalidatePath("/roles")
    revalidatePath(`/roles/${validated.id}`)
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError
      return { success: false, error: zodError.issues[0]?.message ?? "بيانات غير صالحة" }
    }
    console.error("Error updating role:", error)
    return { success: false, error: "فشل في تعديل الدور" }
  }
}

/**
 * Delete a role (soft delete)
 */
export async function deleteRole(id: string): Promise<ActionResult> {
  try {
    const hasPermission = await checkPermission("role.delete")
    if (!hasPermission) {
      return { success: false, error: "ليس لديك صلاحية لحذف الأدوار" }
    }

    // Check if role exists and is not system
    const existing = await db.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    })

    if (!existing) {
      return { success: false, error: "الدور غير موجود" }
    }

    if (existing.isSystem) {
      return { success: false, error: "لا يمكن حذف الأدوار الأساسية" }
    }

    if (existing._count.users > 0) {
      return { 
        success: false, 
        error: `لا يمكن حذف الدور لأنه مرتبط بـ ${existing._count.users} مستخدم` 
      }
    }

    // Soft delete
    await db.role.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    revalidatePath("/roles")
    return { success: true }
  } catch (error) {
    console.error("Error deleting role:", error)
    return { success: false, error: "فشل في حذف الدور" }
  }
}

/**
 * Duplicate a role with its permissions
 */
export async function duplicateRole(id: string): Promise<ActionResult> {
  try {
    const hasPermission = await checkPermission("role.create")
    if (!hasPermission) {
      return { success: false, error: "ليس لديك صلاحية لإنشاء الأدوار" }
    }

    // Get existing role with permissions
    const existing = await db.role.findUnique({
      where: { id },
      include: {
        permissions: true,
      },
    })

    if (!existing) {
      return { success: false, error: "الدور غير موجود" }
    }

    // Generate unique code
    let newCode = `${existing.code}_COPY`
    let counter = 1
    while (await db.role.findUnique({ where: { code: newCode } })) {
      newCode = `${existing.code}_COPY_${counter}`
      counter++
    }

    // Create new role
    const newRole = await db.role.create({
      data: {
        code: newCode,
        nameAr: `${existing.nameAr} (نسخة)`,
        nameEn: existing.nameEn ? `${existing.nameEn} (Copy)` : null,
        description: existing.description,
        isSystem: false,
        permissions: {
          create: existing.permissions.map((rp) => ({
            permissionId: rp.permissionId,
          })),
        },
      },
    })

    revalidatePath("/roles")
    return { success: true, data: newRole }
  } catch (error) {
    console.error("Error duplicating role:", error)
    return { success: false, error: "فشل في نسخ الدور" }
  }
}
