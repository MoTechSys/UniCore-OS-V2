"use server"

/**
 * Enrollments Server Actions
 * 
 * Handles student enrollment in course offerings.
 * Business Rules:
 * - Check if offering is not full (maxStudents)
 * - Check if student is not already enrolled
 * - Check if student exists and is active
 * 
 * @module features/enrollments/actions
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

export interface EnrollmentData {
    id: string
    enrolledAt: Date
    droppedAt: Date | null
    studentId: string
    offeringId: string
    student: {
        id: string
        name: string | null
        email: string
        profile: {
            studentId: string | null
        } | null
    }
}

export interface StudentSearchResult {
    id: string
    name: string | null
    email: string
    studentId: string | null
}

// ============================================
// SCHEMAS
// ============================================

const enrollStudentSchema = z.object({
    offeringId: z.string().min(1, "يجب تحديد الشعبة"),
    studentId: z.string().min(1, "يجب تحديد الطالب"),
})

export type EnrollStudentInput = z.infer<typeof enrollStudentSchema>

// ============================================
// ACTIONS
// ============================================

/**
 * Get all enrollments for an offering
 */
export async function getEnrollments(
    offeringId: string
): Promise<ActionResult<EnrollmentData[]>> {
    try {
        const enrollments = await db.enrollment.findMany({
            where: { offeringId, droppedAt: null },
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
        })

        return { success: true, data: enrollments as EnrollmentData[] }
    } catch (error) {
        console.error("Error fetching enrollments:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في جلب المسجلين",
        }
    }
}

/**
 * Search for students to enroll
 * Searches by name, email, or studentId
 */
export async function searchStudents(
    query: string,
    offeringId: string
): Promise<ActionResult<StudentSearchResult[]>> {
    try {
        if (!query || query.length < 2) {
            return { success: true, data: [] }
        }

        // Get already enrolled students for this offering
        const enrolledStudentIds = await db.enrollment.findMany({
            where: { offeringId, droppedAt: null },
            select: { studentId: true },
        })
        const enrolledIds = enrolledStudentIds.map((e) => e.studentId)

        // Search for students (with student role) not already enrolled
        const students = await db.user.findMany({
            where: {
                deletedAt: null,
                status: "ACTIVE",
                id: { notIn: enrolledIds },
                role: {
                    name: "student",
                },
                OR: [
                    { name: { contains: query } },
                    { email: { contains: query } },
                    { profile: { studentId: { contains: query } } },
                ],
            },
            take: 10,
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                email: true,
                profile: {
                    select: { studentId: true },
                },
            },
        })

        return {
            success: true,
            data: students.map((s) => ({
                id: s.id,
                name: s.name,
                email: s.email,
                studentId: s.profile?.studentId ?? null,
            })),
        }
    } catch (error) {
        console.error("Error searching students:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في البحث",
        }
    }
}

/**
 * Enroll a student in an offering
 * Business Rules:
 * - Offering must not be full
 * - Student must not be already enrolled
 * - Student must exist and be active
 */
export async function enrollStudent(
    input: EnrollStudentInput
): Promise<ActionResult<{ id: string }>> {
    try {
        await requirePermission("enrollment.manage")

        const validated = enrollStudentSchema.parse(input)

        // Get offering with current enrollment count
        const offering = await db.courseOffering.findUnique({
            where: { id: validated.offeringId, deletedAt: null },
            include: {
                _count: {
                    select: { enrollments: { where: { droppedAt: null } } },
                },
            },
        })

        if (!offering) {
            return { success: false, error: "الشعبة غير موجودة" }
        }

        // Check capacity
        if (offering._count.enrollments >= offering.maxStudents) {
            return {
                success: false,
                error: `الشعبة ممتلئة (${offering._count.enrollments}/${offering.maxStudents})`,
            }
        }

        // Check if student exists
        const student = await db.user.findUnique({
            where: { id: validated.studentId, deletedAt: null, status: "ACTIVE" },
        })

        if (!student) {
            return { success: false, error: "الطالب غير موجود أو غير نشط" }
        }

        // Check if already enrolled
        const existingEnrollment = await db.enrollment.findFirst({
            where: {
                studentId: validated.studentId,
                offeringId: validated.offeringId,
                droppedAt: null,
            },
        })

        if (existingEnrollment) {
            return { success: false, error: "الطالب مسجل بالفعل في هذه الشعبة" }
        }

        // Create enrollment
        const enrollment = await db.enrollment.create({
            data: {
                studentId: validated.studentId,
                offeringId: validated.offeringId,
            },
        })

        revalidatePath(`/offerings/${validated.offeringId}`)
        revalidatePath("/offerings")
        return { success: true, data: { id: enrollment.id } }
    } catch (error) {
        console.error("Error enrolling student:", error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في تسجيل الطالب",
        }
    }
}

/**
 * Drop a student from an offering (soft delete by setting droppedAt)
 */
export async function dropStudent(enrollmentId: string): Promise<ActionResult> {
    try {
        await requirePermission("enrollment.manage")

        const enrollment = await db.enrollment.findUnique({
            where: { id: enrollmentId },
        })

        if (!enrollment) {
            return { success: false, error: "التسجيل غير موجود" }
        }

        if (enrollment.droppedAt) {
            return { success: false, error: "الطالب تم إسقاطه مسبقاً" }
        }

        await db.enrollment.update({
            where: { id: enrollmentId },
            data: { droppedAt: new Date() },
        })

        revalidatePath(`/offerings/${enrollment.offeringId}`)
        revalidatePath("/offerings")
        return { success: true }
    } catch (error) {
        console.error("Error dropping student:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في إسقاط الطالب",
        }
    }
}

/**
 * Bulk enroll students
 */
export async function bulkEnrollStudents(
    offeringId: string,
    studentIds: string[]
): Promise<ActionResult<{ enrolled: number; failed: number }>> {
    try {
        await requirePermission("enrollment.manage")

        // Get offering with current count
        const offering = await db.courseOffering.findUnique({
            where: { id: offeringId, deletedAt: null },
            include: {
                _count: {
                    select: { enrollments: { where: { droppedAt: null } } },
                },
            },
        })

        if (!offering) {
            return { success: false, error: "الشعبة غير موجودة" }
        }

        const availableSlots = offering.maxStudents - offering._count.enrollments
        if (availableSlots <= 0) {
            return { success: false, error: "الشعبة ممتلئة" }
        }

        // Get already enrolled students
        const existingEnrollments = await db.enrollment.findMany({
            where: { offeringId, studentId: { in: studentIds }, droppedAt: null },
            select: { studentId: true },
        })
        const enrolledIds = new Set(existingEnrollments.map((e) => e.studentId))

        // Filter out already enrolled
        const toEnroll = studentIds.filter((id) => !enrolledIds.has(id))

        // Limit to available slots
        const studentsToEnroll = toEnroll.slice(0, availableSlots)

        if (studentsToEnroll.length === 0) {
            return {
                success: false,
                error: "جميع الطلاب المحددين مسجلون بالفعل",
            }
        }

        // Create enrollments
        await db.enrollment.createMany({
            data: studentsToEnroll.map((studentId) => ({
                studentId,
                offeringId,
            })),
        })

        revalidatePath(`/offerings/${offeringId}`)
        revalidatePath("/offerings")

        return {
            success: true,
            data: {
                enrolled: studentsToEnroll.length,
                failed: toEnroll.length - studentsToEnroll.length,
            },
        }
    } catch (error) {
        console.error("Error bulk enrolling:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في التسجيل الجماعي",
        }
    }
}
