"use server"

/**
 * Reports Server Actions
 * 
 * Provides data insights for students and instructors:
 * - Student transcript (grades by semester)
 * - Instructor gradebook (student × quiz matrix)
 * - Offering statistics (avg, min, max)
 * - CSV export
 * 
 * @module features/reports/actions
 */

import { auth } from "@/lib/auth"
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

export interface TranscriptSemester {
    id: string
    name: string
    isCurrent: boolean
    offerings: TranscriptOffering[]
}

export interface TranscriptOffering {
    id: string
    code: string
    courseName: string
    quizzes: TranscriptQuiz[]
    totalScore: number
    maxScore: number
    percentage: number
}

export interface TranscriptQuiz {
    id: string
    title: string
    score: number | null
    maxScore: number
    percentage: number | null
    status: "NOT_ATTEMPTED" | "IN_PROGRESS" | "SUBMITTED" | "GRADED"
}

export interface GradebookStudent {
    id: string
    name: string
    quizScores: Record<string, number | null> // quizId -> score
    totalScore: number
    maxPossible: number
    percentage: number
}

export interface GradebookData {
    quizzes: { id: string; title: string; maxScore: number }[]
    students: GradebookStudent[]
}

export interface OfferingStats {
    studentCount: number
    quizCount: number
    avgScore: number
    minScore: number
    maxScore: number
    distribution: {
        label: string
        count: number
        percentage: number
    }[]
}

// ============================================
// STUDENT TRANSCRIPT
// ============================================

/**
 * Get student's transcript - grades grouped by semester
 */
export async function getStudentTranscript(): Promise<ActionResult<TranscriptSemester[]>> {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return { success: false, error: "غير مصرح" }
        }

        const studentId = session.user.id

        // Get all enrollments with nested data
        const enrollments = await db.enrollment.findMany({
            where: {
                studentId,
                status: "ACTIVE",
            },
            include: {
                offering: {
                    include: {
                        course: { select: { nameAr: true } },
                        semester: { select: { id: true, nameAr: true, isCurrent: true } },
                        quizzes: {
                            where: { deletedAt: null, status: "PUBLISHED" },
                            select: {
                                id: true,
                                title: true,
                                totalPoints: true,
                                attempts: {
                                    where: { studentId },
                                    select: {
                                        status: true,
                                        score: true,
                                        percentage: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        })

        // Group by semester
        const semesterMap = new Map<string, TranscriptSemester>()

        for (const enrollment of enrollments) {
            const semester = enrollment.offering.semester

            if (!semesterMap.has(semester.id)) {
                semesterMap.set(semester.id, {
                    id: semester.id,
                    name: semester.nameAr,
                    isCurrent: semester.isCurrent,
                    offerings: [],
                })
            }

            const quizzes: TranscriptQuiz[] = enrollment.offering.quizzes.map((quiz: any) => {
                const attempt = quiz.attempts[0]
                return {
                    id: quiz.id,
                    title: quiz.title,
                    score: attempt?.score ?? null,
                    maxScore: quiz.totalPoints,
                    percentage: attempt?.percentage ?? null,
                    status: attempt?.status as TranscriptQuiz["status"] ?? "NOT_ATTEMPTED",
                }
            })

            const totalScore = quizzes.reduce((sum: number, q: any) => sum + (q.score ?? 0), 0)
            const maxScore = quizzes.reduce((sum: number, q: any) => sum + q.maxScore, 0)

            semesterMap.get(semester.id)!.offerings.push({
                id: enrollment.offering.id,
                code: enrollment.offering.code,
                courseName: enrollment.offering.course.nameAr,
                quizzes,
                totalScore,
                maxScore,
                percentage: maxScore > 0 ? (totalScore / maxScore) * 100 : 0,
            })
        }

        // Sort: current semester first
        const semesters = Array.from(semesterMap.values()).sort((a, b) => {
            if (a.isCurrent && !b.isCurrent) return -1
            if (!a.isCurrent && b.isCurrent) return 1
            return 0
        })

        return { success: true, data: semesters }
    } catch (error) {
        console.error("Get transcript error:", error)
        return { success: false, error: "فشل في جلب كشف الدرجات" }
    }
}

// ============================================
// INSTRUCTOR GRADEBOOK
// ============================================

/**
 * Get gradebook for an offering (instructor only)
 */
export async function getOfferingGradebook(
    offeringId: string
): Promise<ActionResult<GradebookData>> {
    try {
        await requirePermission("quiz.view")

        const session = await auth()
        if (!session?.user?.id) {
            return { success: false, error: "غير مصرح" }
        }

        // Verify offering exists and user has access
        const offering = await db.courseOffering.findUnique({
            where: { id: offeringId, deletedAt: null },
            include: {
                instructors: { select: { id: true } },
                quizzes: {
                    where: { deletedAt: null },
                    select: { id: true, title: true, totalPoints: true },
                    orderBy: { createdAt: "asc" },
                },
                enrollments: {
                    where: { status: "ACTIVE" },
                    include: {
                        student: {
                            select: {
                                id: true,
                                profile: {
                                    select: { firstNameAr: true, lastNameAr: true },
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

        // Check if user is instructor of this offering (or system role)
        const isInstructor = offering.instructors.some((i: any) => i.id === session.user.id)
        const isSystemRole = session.user.isSystemRole
        if (!isInstructor && !isSystemRole) {
            return { success: false, error: "غير مصرح بالوصول لهذه الشعبة" }
        }

        // Get all attempts for this offering's quizzes
        const quizIds = offering.quizzes.map((q: any) => q.id)
        const attempts = await db.quizAttempt.findMany({
            where: { quizId: { in: quizIds } },
            select: {
                studentId: true,
                quizId: true,
                score: true,
            },
        })

        // Build attempt lookup
        const attemptMap = new Map<string, number | null>()
        for (const attempt of attempts) {
            attemptMap.set(`${attempt.studentId}-${attempt.quizId}`, attempt.score)
        }

        // Calculate total possible points
        const maxPossible = offering.quizzes.reduce((sum: number, q: any) => sum + q.totalPoints, 0)

        // Build student rows
        const students: GradebookStudent[] = offering.enrollments.map((enrollment: any) => {
            const student = enrollment.student
            const name = student.profile
                ? `${student.profile.firstNameAr} ${student.profile.lastNameAr}`
                : "غير معروف"

            const quizScores: Record<string, number | null> = {}
            let totalScore = 0

            for (const quiz of offering.quizzes) {
                const score = attemptMap.get(`${student.id}-${quiz.id}`) ?? null
                quizScores[quiz.id] = score
                totalScore += score ?? 0
            }

            return {
                id: student.id,
                name,
                quizScores,
                totalScore,
                maxPossible,
                percentage: maxPossible > 0 ? (totalScore / maxPossible) * 100 : 0,
            }
        })

        // Sort by name
        students.sort((a, b) => a.name.localeCompare(b.name, "ar"))

        return {
            success: true,
            data: {
                quizzes: offering.quizzes.map((q: any) => ({
                    id: q.id,
                    title: q.title,
                    maxScore: q.totalPoints,
                })),
                students,
            },
        }
    } catch (error) {
        console.error("Get gradebook error:", error)
        return { success: false, error: "فشل في جلب سجل الدرجات" }
    }
}

// ============================================
// OFFERING STATISTICS
// ============================================

/**
 * Get offering statistics
 */
export async function getOfferingStats(
    offeringId: string
): Promise<ActionResult<OfferingStats>> {
    try {
        await requirePermission("quiz.view")

        const session = await auth()
        if (!session?.user?.id) {
            return { success: false, error: "غير مصرح" }
        }

        // Get offering data
        const offering = await db.courseOffering.findUnique({
            where: { id: offeringId, deletedAt: null },
            include: {
                instructors: { select: { id: true } },
                _count: {
                    select: {
                        enrollments: { where: { status: "ACTIVE" } },
                        quizzes: { where: { deletedAt: null } },
                    },
                },
            },
        })

        if (!offering) {
            return { success: false, error: "الشعبة غير موجودة" }
        }

        // Check access
        const isInstructor = offering.instructors.some(i => i.id === session.user.id)
        const isSystemRole = session.user.isSystemRole
        if (!isInstructor && !isSystemRole) {
            return { success: false, error: "غير مصرح" }
        }

        // Get quiz attempts for this offering
        const quizzes = await db.quiz.findMany({
            where: { offeringId, deletedAt: null },
            select: { id: true },
        })
        const quizIds = quizzes.map(q => q.id)

        // Calculate aggregate stats
        const aggregation = await db.quizAttempt.aggregate({
            where: { quizId: { in: quizIds }, status: "GRADED" },
            _avg: { percentage: true },
            _min: { percentage: true },
            _max: { percentage: true },
        })

        // Get all percentages for distribution
        const attempts = await db.quizAttempt.findMany({
            where: { quizId: { in: quizIds }, status: "GRADED" },
            select: { percentage: true },
        })

        // Calculate distribution
        const buckets = [
            { label: "ممتاز (90-100)", min: 90, max: 100, count: 0 },
            { label: "جيد جداً (80-89)", min: 80, max: 89, count: 0 },
            { label: "جيد (70-79)", min: 70, max: 79, count: 0 },
            { label: "مقبول (60-69)", min: 60, max: 69, count: 0 },
            { label: "راسب (0-59)", min: 0, max: 59, count: 0 },
        ]

        for (const attempt of attempts) {
            if (attempt.percentage === null) continue
            for (const bucket of buckets) {
                if (attempt.percentage >= bucket.min && attempt.percentage <= bucket.max) {
                    bucket.count++
                    break
                }
            }
        }

        const totalAttempts = attempts.length

        return {
            success: true,
            data: {
                studentCount: offering._count.enrollments,
                quizCount: offering._count.quizzes,
                avgScore: aggregation._avg.percentage ?? 0,
                minScore: aggregation._min.percentage ?? 0,
                maxScore: aggregation._max.percentage ?? 0,
                distribution: buckets.map(b => ({
                    label: b.label,
                    count: b.count,
                    percentage: totalAttempts > 0 ? (b.count / totalAttempts) * 100 : 0,
                })),
            },
        }
    } catch (error) {
        console.error("Get stats error:", error)
        return { success: false, error: "فشل في جلب الإحصائيات" }
    }
}

// ============================================
// CSV EXPORT
// ============================================

/**
 * Export gradebook as CSV
 */
export async function exportGradebookCSV(
    offeringId: string
): Promise<ActionResult<{ csv: string; filename: string }>> {
    try {
        const result = await getOfferingGradebook(offeringId)
        if (!result.success || !result.data) {
            return { success: false, error: result.error }
        }

        const { quizzes, students } = result.data

        // Build CSV header
        const headers = ["الطالب", ...quizzes.map(q => q.title), "المجموع", "النسبة"]

        // Build CSV rows
        const rows = students.map(student => {
            const quizScores = quizzes.map(q => student.quizScores[q.id] ?? "-")
            return [
                student.name,
                ...quizScores,
                student.totalScore,
                `${student.percentage.toFixed(1)}%`,
            ]
        })

        // Convert to CSV string with BOM for Arabic support
        const BOM = "\uFEFF"
        const csv = BOM + [headers, ...rows].map(row => row.join(",")).join("\n")

        // Get offering code for filename
        const offering = await db.courseOffering.findUnique({
            where: { id: offeringId },
            select: { code: true },
        })

        const filename = `gradebook-${offering?.code ?? offeringId}.csv`

        return { success: true, data: { csv, filename } }
    } catch (error) {
        console.error("Export CSV error:", error)
        return { success: false, error: "فشل في تصدير الملف" }
    }
}
