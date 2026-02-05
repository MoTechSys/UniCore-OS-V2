"use server"

/**
 * Semesters Server Actions
 * 
 * Handles CRUD operations for Semesters (الفصول الدراسية).
 * Business Rule: Only ONE semester can be active (isCurrent) at a time.
 * 
 * @module features/semesters/actions
 */

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { requirePermission } from "@/lib/auth/permissions"

// ============================================
// TYPES
// ============================================

export interface ActionResult<T = void> {
    success: boolean
    data?: T
    error?: string
}

export interface SemesterData {
    id: string
    code: string
    nameAr: string
    nameEn: string | null
    type: string
    year: number
    startDate: Date
    endDate: Date
    isActive: boolean
    isCurrent: boolean
    createdAt: Date
    updatedAt: Date
    _count: {
        offerings: number
    }
}

export interface SemesterStats {
    total: number
    active: number
    upcoming: number
    archived: number
}

// ============================================
// SCHEMAS
// ============================================

const createSemesterSchema = z.object({
    code: z.string().min(3, "الكود يجب أن يكون 3 أحرف على الأقل"),
    nameAr: z.string().min(2, "الاسم العربي مطلوب"),
    nameEn: z.string().optional(),
    type: z.enum(["FIRST", "SECOND", "SUMMER"], {
        errorMap: () => ({ message: "نوع الفصل غير صحيح" }),
    }),
    year: z.coerce.number().min(2020, "السنة غير صحيحة").max(2100, "السنة غير صحيحة"),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
})

const updateSemesterSchema = createSemesterSchema.extend({
    id: z.string(),
    isActive: z.boolean().optional(),
})

export type CreateSemesterInput = z.infer<typeof createSemesterSchema>
export type UpdateSemesterInput = z.infer<typeof updateSemesterSchema>

// ============================================
// HELPER FUNCTIONS
// ============================================

function getSemesterStatus(semester: { startDate: Date; endDate: Date; isCurrent: boolean }): string {
    const now = new Date()
    if (semester.isCurrent) return "ACTIVE"
    if (semester.startDate > now) return "UPCOMING"
    if (semester.endDate < now) return "ARCHIVED"
    return "INACTIVE"
}

// ============================================
// ACTIONS
// ============================================

/**
 * Get all semesters with offering counts
 */
export async function getSemesters(): Promise<ActionResult<SemesterData[]>> {
    try {
        const semesters = await db.semester.findMany({
            orderBy: [{ year: "desc" }, { type: "asc" }],
            include: {
                _count: {
                    select: { offerings: { where: { deletedAt: null } } },
                },
            },
        })

        return { success: true, data: semesters as SemesterData[] }
    } catch (error) {
        console.error("Error fetching semesters:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في جلب الفصول الدراسية",
        }
    }
}

/**
 * Get a single semester by ID
 */
export async function getSemesterById(id: string): Promise<ActionResult<SemesterData>> {
    try {
        const semester = await db.semester.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { offerings: { where: { deletedAt: null } } },
                },
            },
        })

        if (!semester) {
            return { success: false, error: "الفصل الدراسي غير موجود" }
        }

        return { success: true, data: semester as SemesterData }
    } catch (error) {
        console.error("Error fetching semester:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في جلب الفصل الدراسي",
        }
    }
}

/**
 * Get semester statistics
 */
export async function getSemesterStats(): Promise<ActionResult<SemesterStats>> {
    try {
        const now = new Date()

        const [total, active, upcoming] = await Promise.all([
            db.semester.count(),
            db.semester.count({ where: { isCurrent: true } }),
            db.semester.count({ where: { startDate: { gt: now } } }),
        ])

        const archived = await db.semester.count({
            where: { endDate: { lt: now }, isCurrent: false },
        })

        return {
            success: true,
            data: { total, active, upcoming, archived },
        }
    } catch (error) {
        console.error("Error fetching semester stats:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في جلب الإحصائيات",
        }
    }
}

/**
 * Create a new semester
 */
export async function createSemester(
    input: CreateSemesterInput
): Promise<ActionResult<{ id: string }>> {
    try {
        await requirePermission("semester.manage")

        const validated = createSemesterSchema.parse(input)

        // Validate dates
        if (validated.endDate <= validated.startDate) {
            return { success: false, error: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية" }
        }

        // Check if code already exists
        const existingCode = await db.semester.findFirst({
            where: { code: validated.code },
        })
        if (existingCode) {
            return { success: false, error: "كود الفصل مستخدم بالفعل" }
        }

        const semester = await db.semester.create({
            data: {
                code: validated.code,
                nameAr: validated.nameAr,
                nameEn: validated.nameEn,
                type: validated.type,
                year: validated.year,
                startDate: validated.startDate,
                endDate: validated.endDate,
                isActive: false,
                isCurrent: false,
            },
        })

        revalidatePath("/semesters")
        return { success: true, data: { id: semester.id } }
    } catch (error) {
        console.error("Error creating semester:", error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في إنشاء الفصل الدراسي",
        }
    }
}

/**
 * Update an existing semester
 */
export async function updateSemester(
    input: UpdateSemesterInput
): Promise<ActionResult> {
    try {
        await requirePermission("semester.manage")

        const validated = updateSemesterSchema.parse(input)

        // Check if semester exists
        const existing = await db.semester.findUnique({
            where: { id: validated.id },
        })
        if (!existing) {
            return { success: false, error: "الفصل الدراسي غير موجود" }
        }

        // Validate dates
        if (validated.endDate <= validated.startDate) {
            return { success: false, error: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية" }
        }

        // Check if code is taken by another semester
        if (validated.code !== existing.code) {
            const codeTaken = await db.semester.findFirst({
                where: { code: validated.code, id: { not: validated.id } },
            })
            if (codeTaken) {
                return { success: false, error: "كود الفصل مستخدم بالفعل" }
            }
        }

        await db.semester.update({
            where: { id: validated.id },
            data: {
                code: validated.code,
                nameAr: validated.nameAr,
                nameEn: validated.nameEn,
                type: validated.type,
                year: validated.year,
                startDate: validated.startDate,
                endDate: validated.endDate,
                isActive: validated.isActive,
            },
        })

        revalidatePath("/semesters")
        return { success: true }
    } catch (error) {
        console.error("Error updating semester:", error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في تحديث الفصل الدراسي",
        }
    }
}

/**
 * Delete a semester
 * Cannot delete if it has offerings
 */
export async function deleteSemester(id: string): Promise<ActionResult> {
    try {
        await requirePermission("semester.manage")

        const semester = await db.semester.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { offerings: { where: { deletedAt: null } } },
                },
            },
        })

        if (!semester) {
            return { success: false, error: "الفصل الدراسي غير موجود" }
        }

        if (semester._count.offerings > 0) {
            return {
                success: false,
                error: "لا يمكن حذف الفصل لأنه يحتوي على شُعب دراسية",
            }
        }

        if (semester.isCurrent) {
            return {
                success: false,
                error: "لا يمكن حذف الفصل النشط الحالي",
            }
        }

        await db.semester.delete({ where: { id } })

        revalidatePath("/semesters")
        return { success: true }
    } catch (error) {
        console.error("Error deleting semester:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في حذف الفصل الدراسي",
        }
    }
}

/**
 * Activate a semester (make it current)
 * BUSINESS RULE: Only ONE semester can be current at a time
 */
export async function activateSemester(id: string): Promise<ActionResult> {
    try {
        await requirePermission("semester.manage")

        const semester = await db.semester.findUnique({ where: { id } })

        if (!semester) {
            return { success: false, error: "الفصل الدراسي غير موجود" }
        }

        // Use transaction to ensure atomicity
        await db.$transaction(async (tx) => {
            // Deactivate all semesters
            await tx.semester.updateMany({
                where: { isCurrent: true },
                data: { isCurrent: false },
            })

            // Activate the selected semester
            await tx.semester.update({
                where: { id },
                data: { isCurrent: true, isActive: true },
            })
        })

        revalidatePath("/semesters")
        revalidatePath("/offerings")
        return { success: true }
    } catch (error) {
        console.error("Error activating semester:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في تفعيل الفصل الدراسي",
        }
    }
}

/**
 * Deactivate the current semester
 */
export async function deactivateSemester(id: string): Promise<ActionResult> {
    try {
        await requirePermission("semester.manage")

        const semester = await db.semester.findUnique({ where: { id } })

        if (!semester) {
            return { success: false, error: "الفصل الدراسي غير موجود" }
        }

        await db.semester.update({
            where: { id },
            data: { isCurrent: false },
        })

        revalidatePath("/semesters")
        return { success: true }
    } catch (error) {
        console.error("Error deactivating semester:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في إلغاء تفعيل الفصل",
        }
    }
}

/**
 * Get the current active semester
 */
export async function getCurrentSemester(): Promise<ActionResult<SemesterData>> {
    try {
        const semester = await db.semester.findFirst({
            where: { isCurrent: true },
            include: {
                _count: {
                    select: { offerings: { where: { deletedAt: null } } },
                },
            },
        })

        if (!semester) {
            return { success: false, error: "لا يوجد فصل دراسي نشط" }
        }

        return { success: true, data: semester as SemesterData }
    } catch (error) {
        console.error("Error fetching current semester:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في جلب الفصل الحالي",
        }
    }
}
