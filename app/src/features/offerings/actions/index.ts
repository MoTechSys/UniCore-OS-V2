"use server"

/**
 * Course Offerings Server Actions
 * 
 * Handles CRUD operations for CourseOfferings (الشُعب الدراسية).
 * Offerings link Courses with Semesters and have a max student capacity.
 * 
 * @module features/offerings/actions
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

export interface OfferingData {
    id: string
    code: string
    section: string
    maxStudents: number
    isActive: boolean
    courseId: string
    semesterId: string
    instructorId: string
    createdAt: Date
    updatedAt: Date
    course: {
        id: string
        code: string
        nameAr: string
        nameEn: string | null
        credits: number
        department: {
            id: string
            nameAr: string
            college: {
                id: string
                nameAr: string
            }
        }
    }
    semester: {
        id: string
        code: string
        nameAr: string
        isCurrent: boolean
    }
    _count: {
        enrollments: number
    }
}

export interface OfferingDetails extends OfferingData {
    enrollments: {
        id: string
        enrolledAt: Date
        droppedAt: Date | null
        student: {
            id: string
            name: string | null
            email: string
            profile: {
                studentId: string | null
            } | null
        }
    }[]
}

export interface OfferingStats {
    totalOfferings: number
    totalEnrollments: number
    openOfferings: number
    fullOfferings: number
}

// ============================================
// SCHEMAS
// ============================================

const createOfferingSchema = z.object({
    courseId: z.string().min(1, "يجب تحديد المقرر"),
    semesterId: z.string().min(1, "يجب تحديد الفصل الدراسي"),
    instructorId: z.string().min(1, "يجب تحديد المحاضر"),
    section: z.string().min(1, "اسم الشعبة مطلوب"),
    maxStudents: z.coerce.number().min(1, "سعة الشعبة يجب أن تكون 1 على الأقل"),
})

const updateOfferingSchema = createOfferingSchema.extend({
    id: z.string(),
    isActive: z.boolean().optional(),
})

export type CreateOfferingInput = z.infer<typeof createOfferingSchema>
export type UpdateOfferingInput = z.infer<typeof updateOfferingSchema>

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateOfferingCode(courseCode: string, semesterCode: string, section: string): string {
    return `${courseCode}-${semesterCode}-${section}`
}

// ============================================
// ACTIONS
// ============================================

/**
 * Get offerings with optional semester filter
 */
export async function getOfferings(
    semesterId?: string
): Promise<ActionResult<OfferingData[]>> {
    try {
        const where: Record<string, unknown> = { deletedAt: null }
        if (semesterId) {
            where.semesterId = semesterId
        }

        const offerings = await db.courseOffering.findMany({
            where,
            orderBy: [{ semester: { year: "desc" } }, { course: { code: "asc" } }],
            include: {
                course: {
                    select: {
                        id: true,
                        code: true,
                        nameAr: true,
                        nameEn: true,
                        credits: true,
                        department: {
                            select: {
                                id: true,
                                nameAr: true,
                                college: {
                                    select: {
                                        id: true,
                                        nameAr: true,
                                    },
                                },
                            },
                        },
                    },
                },
                semester: {
                    select: {
                        id: true,
                        code: true,
                        nameAr: true,
                        isCurrent: true,
                    },
                },
                _count: {
                    select: { enrollments: { where: { droppedAt: null } } },
                },
            },
        })

        return { success: true, data: offerings as OfferingData[] }
    } catch (error) {
        console.error("Error fetching offerings:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في جلب الشُعب",
        }
    }
}

/**
 * Get a single offering with full details including enrolled students
 */
export async function getOfferingById(id: string): Promise<ActionResult<OfferingDetails>> {
    try {
        const offering = await db.courseOffering.findUnique({
            where: { id, deletedAt: null },
            include: {
                course: {
                    select: {
                        id: true,
                        code: true,
                        nameAr: true,
                        nameEn: true,
                        credits: true,
                        department: {
                            select: {
                                id: true,
                                nameAr: true,
                                college: {
                                    select: {
                                        id: true,
                                        nameAr: true,
                                    },
                                },
                            },
                        },
                    },
                },
                semester: {
                    select: {
                        id: true,
                        code: true,
                        nameAr: true,
                        isCurrent: true,
                    },
                },
                _count: {
                    select: { enrollments: { where: { droppedAt: null } } },
                },
                enrollments: {
                    where: { droppedAt: null },
                    orderBy: { enrolledAt: "asc" },
                    include: {
                        student: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                profile: {
                                    select: {
                                        studentId: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        })

        if (!offering) {
            return { success: false, error: "الشعبة غير موجودة" }
        }

        return { success: true, data: offering as unknown as OfferingDetails }
    } catch (error) {
        console.error("Error fetching offering:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في جلب تفاصيل الشعبة",
        }
    }
}

/**
 * Get offerings statistics
 */
export async function getOfferingsStats(
    semesterId?: string
): Promise<ActionResult<OfferingStats>> {
    try {
        const where: Record<string, unknown> = { deletedAt: null }
        if (semesterId) {
            where.semesterId = semesterId
        }

        const offerings = await db.courseOffering.findMany({
            where,
            select: {
                id: true,
                maxStudents: true,
                _count: {
                    select: { enrollments: { where: { droppedAt: null } } },
                },
            },
        })

        const totalOfferings = offerings.length
        const totalEnrollments = offerings.reduce((sum: number, o: any) => sum + o._count.enrollments, 0)
        const openOfferings = offerings.filter((o: any) => o._count.enrollments < o.maxStudents).length
        const fullOfferings = offerings.filter((o: any) => o._count.enrollments >= o.maxStudents).length

        return {
            success: true,
            data: { totalOfferings, totalEnrollments, openOfferings, fullOfferings },
        }
    } catch (error) {
        console.error("Error fetching offerings stats:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في جلب الإحصائيات",
        }
    }
}

/**
 * Create a new course offering
 */
export async function createOffering(
    input: CreateOfferingInput
): Promise<ActionResult<{ id: string }>> {
    try {
        await requirePermission("offering.manage")

        const validated = createOfferingSchema.parse(input)

        // Check if course exists
        const course = await db.course.findUnique({
            where: { id: validated.courseId, deletedAt: null },
        })
        if (!course) {
            return { success: false, error: "المقرر غير موجود" }
        }

        // Check if semester exists
        const semester = await db.semester.findUnique({
            where: { id: validated.semesterId },
        })
        if (!semester) {
            return { success: false, error: "الفصل الدراسي غير موجود" }
        }

        // Check if instructor exists
        const instructor = await db.user.findUnique({
            where: { id: validated.instructorId, deletedAt: null },
        })
        if (!instructor) {
            return { success: false, error: "المحاضر غير موجود" }
        }

        // Check for duplicate offering (same course, semester, section)
        const existingOffering = await db.courseOffering.findFirst({
            where: {
                courseId: validated.courseId,
                semesterId: validated.semesterId,
                section: validated.section,
                deletedAt: null,
            },
        })
        if (existingOffering) {
            return { success: false, error: "هذه الشعبة موجودة بالفعل" }
        }

        // Generate unique code
        const code = generateOfferingCode(course.code, semester.code, validated.section)

        // Check if code already exists
        const existingCode = await db.courseOffering.findFirst({
            where: { code, deletedAt: null },
        })
        if (existingCode) {
            return { success: false, error: "كود الشعبة مستخدم بالفعل" }
        }

        const offering = await db.courseOffering.create({
            data: {
                code,
                courseId: validated.courseId,
                semesterId: validated.semesterId,
                instructorId: validated.instructorId,
                section: validated.section,
                maxStudents: validated.maxStudents,
            },
        })

        revalidatePath("/offerings")
        return { success: true, data: { id: offering.id } }
    } catch (error) {
        console.error("Error creating offering:", error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في إنشاء الشعبة",
        }
    }
}

/**
 * Update an existing offering
 */
export async function updateOffering(
    input: UpdateOfferingInput
): Promise<ActionResult> {
    try {
        await requirePermission("offering.manage")

        const validated = updateOfferingSchema.parse(input)

        // Check if offering exists
        const existing = await db.courseOffering.findUnique({
            where: { id: validated.id, deletedAt: null },
            include: {
                course: true,
                semester: true,
                _count: { select: { enrollments: { where: { droppedAt: null } } } },
            },
        })
        if (!existing) {
            return { success: false, error: "الشعبة غير موجودة" }
        }

        // Validate maxStudents is not less than current enrollments
        if (validated.maxStudents < existing._count.enrollments) {
            return {
                success: false,
                error: `لا يمكن تقليل السعة إلى أقل من عدد الطلاب المسجلين (${existing._count.enrollments})`,
            }
        }

        // If course or semester changed, regenerate code
        let newCode = existing.code
        if (
            validated.courseId !== existing.courseId ||
            validated.semesterId !== existing.semesterId ||
            validated.section !== existing.section
        ) {
            const course = await db.course.findUnique({ where: { id: validated.courseId } })
            const semester = await db.semester.findUnique({ where: { id: validated.semesterId } })
            if (course && semester) {
                newCode = generateOfferingCode(course.code, semester.code, validated.section)
            }
        }

        await db.courseOffering.update({
            where: { id: validated.id },
            data: {
                code: newCode,
                courseId: validated.courseId,
                semesterId: validated.semesterId,
                instructorId: validated.instructorId,
                section: validated.section,
                maxStudents: validated.maxStudents,
                isActive: validated.isActive,
            },
        })

        revalidatePath("/offerings")
        revalidatePath(`/offerings/${validated.id}`)
        return { success: true }
    } catch (error) {
        console.error("Error updating offering:", error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في تحديث الشعبة",
        }
    }
}

/**
 * Delete an offering (soft delete)
 * Cannot delete if it has active enrollments
 */
export async function deleteOffering(id: string): Promise<ActionResult> {
    try {
        await requirePermission("offering.manage")

        const offering = await db.courseOffering.findUnique({
            where: { id, deletedAt: null },
            include: {
                _count: {
                    select: { enrollments: { where: { droppedAt: null } } },
                },
            },
        })

        if (!offering) {
            return { success: false, error: "الشعبة غير موجودة" }
        }

        if (offering._count.enrollments > 0) {
            return {
                success: false,
                error: "لا يمكن حذف الشعبة لأنها تحتوي على طلاب مسجلين",
            }
        }

        // Soft delete
        await db.courseOffering.update({
            where: { id },
            data: { deletedAt: new Date() },
        })

        revalidatePath("/offerings")
        return { success: true }
    } catch (error) {
        console.error("Error deleting offering:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في حذف الشعبة",
        }
    }
}

/**
 * Get available courses for creating an offering
 */
export async function getCoursesForOffering(): Promise<
    ActionResult<{ id: string; code: string; nameAr: string; department: string }[]>
> {
    try {
        const courses = await db.course.findMany({
            where: { deletedAt: null, isActive: true },
            orderBy: { code: "asc" },
            select: {
                id: true,
                code: true,
                nameAr: true,
                department: {
                    select: { nameAr: true },
                },
            },
        })

        return {
            success: true,
            data: courses.map((c: any) => ({
                id: c.id,
                code: c.code,
                nameAr: c.nameAr,
                department: c.department.nameAr,
            })),
        }
    } catch (error) {
        console.error("Error fetching courses:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في جلب المقررات",
        }
    }
}

/**
 * Get instructors (users with instructor role) for assignment
 */
export async function getInstructorsForOffering(): Promise<
    ActionResult<{ id: string; name: string; email: string }[]>
> {
    try {
        // Get users with instructor or admin roles
        const instructors = await db.user.findMany({
            where: {
                deletedAt: null,
                status: "ACTIVE",
                role: {
                    name: { in: ["instructor", "System Admin", "admin"] },
                },
            },
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                email: true,
            },
        })

        return {
            success: true,
            data: instructors.map((i: any) => ({
                id: i.id,
                name: i.name ?? i.email,
                email: i.email,
            })),
        }
    } catch (error) {
        console.error("Error fetching instructors:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في جلب المحاضرين",
        }
    }
}
