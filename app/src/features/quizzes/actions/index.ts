"use server"

/**
 * Quiz Server Actions
 * 
 * Handles CRUD operations for Quizzes.
 * Quizzes are linked to CourseOfferings.
 * 
 * @module features/quizzes/actions
 */

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { requirePermission } from "@/lib/auth/permissions"
import { auth } from "@/lib/auth"
import { createNotification } from "@/features/notifications/actions"

// ============================================
// TYPES
// ============================================

export interface ActionResult<T = void> {
    success: boolean
    data?: T
    error?: string
}

export type QuizStatus = "DRAFT" | "PUBLISHED" | "CLOSED"

export interface QuizData {
    id: string
    title: string
    description: string | null
    status: string
    duration: number
    totalPoints: number
    passingScore: number
    shuffleQuestions: boolean
    shuffleOptions: boolean
    showResults: boolean
    allowReview: boolean
    startTime: Date | null
    endTime: Date | null
    offeringId: string
    creatorId: string
    createdAt: Date
    updatedAt: Date
    offering: {
        id: string
        code: string
        section: string
        course: {
            id: string
            code: string
            nameAr: string
        }
        semester: {
            id: string
            nameAr: string
            isCurrent: boolean
        }
    }
    creator: {
        id: string
        name: string | null
        email: string
    }
    _count: {
        questions: number
        attempts: number
    }
}

export interface QuizDetails extends QuizData {
    questions: {
        id: string
        type: string
        difficulty: string
        text: string
        explanation: string | null
        points: number
        order: number
        isAiGenerated: boolean
        options: {
            id: string
            text: string
            isCorrect: boolean
            order: number
        }[]
    }[]
}

export interface QuizStats {
    total: number
    draft: number
    published: number
    closed: number
}

// ============================================
// SCHEMAS
// ============================================

const createQuizSchema = z.object({
    title: z.string().min(3, "العنوان يجب أن يكون 3 أحرف على الأقل"),
    description: z.string().optional(),
    offeringId: z.string().min(1, "يجب تحديد الشعبة"),
    duration: z.coerce.number().min(5, "المدة يجب أن تكون 5 دقائق على الأقل").default(30),
    passingScore: z.coerce.number().min(0).max(100).default(60),
})

const updateQuizSchema = z.object({
    id: z.string(),
    title: z.string().min(3, "العنوان يجب أن يكون 3 أحرف على الأقل"),
    description: z.string().optional(),
    duration: z.coerce.number().min(5, "المدة يجب أن تكون 5 دقائق على الأقل"),
    passingScore: z.coerce.number().min(0).max(100),
    shuffleQuestions: z.boolean().optional(),
    shuffleOptions: z.boolean().optional(),
    showResults: z.boolean().optional(),
    allowReview: z.boolean().optional(),
    startTime: z.coerce.date().nullable().optional(),
    endTime: z.coerce.date().nullable().optional(),
})

export type CreateQuizInput = z.infer<typeof createQuizSchema>
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>

// ============================================
// ACTIONS
// ============================================

/**
 * Get quizzes with optional offering filter
 */
export async function getQuizzes(
    offeringId?: string
): Promise<ActionResult<QuizData[]>> {
    try {
        const where: Record<string, unknown> = { deletedAt: null }
        if (offeringId) {
            where.offeringId = offeringId
        }

        const quizzes = await db.quiz.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: {
                offering: {
                    select: {
                        id: true,
                        code: true,
                        section: true,
                        course: {
                            select: {
                                id: true,
                                code: true,
                                nameAr: true,
                            },
                        },
                        semester: {
                            select: {
                                id: true,
                                nameAr: true,
                                isCurrent: true,
                            },
                        },
                    },
                },
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        questions: true,
                        attempts: true,
                    },
                },
            },
        })

        return { success: true, data: quizzes as QuizData[] }
    } catch (error) {
        console.error("Error fetching quizzes:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في جلب الكويزات",
        }
    }
}

/**
 * Get a single quiz with all questions and options
 */
export async function getQuizById(id: string): Promise<ActionResult<QuizDetails>> {
    try {
        const quiz = await db.quiz.findUnique({
            where: { id, deletedAt: null },
            include: {
                offering: {
                    select: {
                        id: true,
                        code: true,
                        section: true,
                        course: {
                            select: {
                                id: true,
                                code: true,
                                nameAr: true,
                            },
                        },
                        semester: {
                            select: {
                                id: true,
                                nameAr: true,
                                isCurrent: true,
                            },
                        },
                    },
                },
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        questions: true,
                        attempts: true,
                    },
                },
                questions: {
                    orderBy: { order: "asc" },
                    include: {
                        options: {
                            orderBy: { order: "asc" },
                        },
                    },
                },
            },
        })

        if (!quiz) {
            return { success: false, error: "الكويز غير موجود" }
        }

        return { success: true, data: quiz as unknown as QuizDetails }
    } catch (error) {
        console.error("Error fetching quiz:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في جلب الكويز",
        }
    }
}

/**
 * Get quiz statistics
 */
export async function getQuizStats(
    offeringId?: string
): Promise<ActionResult<QuizStats>> {
    try {
        const where: Record<string, unknown> = { deletedAt: null }
        if (offeringId) {
            where.offeringId = offeringId
        }

        const [total, draft, published, closed] = await Promise.all([
            db.quiz.count({ where }),
            db.quiz.count({ where: { ...where, status: "DRAFT" } }),
            db.quiz.count({ where: { ...where, status: "PUBLISHED" } }),
            db.quiz.count({ where: { ...where, status: "CLOSED" } }),
        ])

        return {
            success: true,
            data: { total, draft, published, closed },
        }
    } catch (error) {
        console.error("Error fetching quiz stats:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في جلب الإحصائيات",
        }
    }
}

/**
 * Create a new quiz
 */
export async function createQuiz(
    input: CreateQuizInput
): Promise<ActionResult<{ id: string }>> {
    try {
        await requirePermission("quiz.create")

        const session = await auth()
        if (!session?.user?.id) {
            return { success: false, error: "غير مصرح" }
        }

        const validated = createQuizSchema.parse(input)

        // Check if offering exists
        const offering = await db.courseOffering.findUnique({
            where: { id: validated.offeringId, deletedAt: null },
        })
        if (!offering) {
            return { success: false, error: "الشعبة غير موجودة" }
        }

        const quiz = await db.quiz.create({
            data: {
                title: validated.title,
                description: validated.description,
                offeringId: validated.offeringId,
                creatorId: session.user.id,
                duration: validated.duration,
                passingScore: validated.passingScore,
                status: "DRAFT",
            },
        })

        revalidatePath("/quizzes")
        return { success: true, data: { id: quiz.id } }
    } catch (error) {
        console.error("Error creating quiz:", error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في إنشاء الكويز",
        }
    }
}

/**
 * Update quiz settings
 */
export async function updateQuiz(
    input: UpdateQuizInput
): Promise<ActionResult> {
    try {
        await requirePermission("quiz.edit")

        const validated = updateQuizSchema.parse(input)

        // Check if quiz exists
        const existing = await db.quiz.findUnique({
            where: { id: validated.id, deletedAt: null },
        })
        if (!existing) {
            return { success: false, error: "الكويز غير موجود" }
        }

        // Cannot edit published/closed quiz settings (except some)
        if (existing.status !== "DRAFT") {
            // Only allow updating certain fields for non-draft quizzes
            await db.quiz.update({
                where: { id: validated.id },
                data: {
                    startTime: validated.startTime,
                    endTime: validated.endTime,
                },
            })
        } else {
            await db.quiz.update({
                where: { id: validated.id },
                data: {
                    title: validated.title,
                    description: validated.description,
                    duration: validated.duration,
                    passingScore: validated.passingScore,
                    shuffleQuestions: validated.shuffleQuestions,
                    shuffleOptions: validated.shuffleOptions,
                    showResults: validated.showResults,
                    allowReview: validated.allowReview,
                    startTime: validated.startTime,
                    endTime: validated.endTime,
                },
            })
        }

        revalidatePath("/quizzes")
        revalidatePath(`/quizzes/${validated.id}/edit`)
        return { success: true }
    } catch (error) {
        console.error("Error updating quiz:", error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في تحديث الكويز",
        }
    }
}

/**
 * Delete a quiz (soft delete)
 */
export async function deleteQuiz(id: string): Promise<ActionResult> {
    try {
        await requirePermission("quiz.delete")

        const quiz = await db.quiz.findUnique({
            where: { id, deletedAt: null },
            include: {
                _count: {
                    select: { attempts: true },
                },
            },
        })

        if (!quiz) {
            return { success: false, error: "الكويز غير موجود" }
        }

        if (quiz._count.attempts > 0) {
            return {
                success: false,
                error: "لا يمكن حذف الكويز لأنه يحتوي على محاولات طلاب",
            }
        }

        // Soft delete
        await db.quiz.update({
            where: { id },
            data: { deletedAt: new Date() },
        })

        revalidatePath("/quizzes")
        return { success: true }
    } catch (error) {
        console.error("Error deleting quiz:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في حذف الكويز",
        }
    }
}

/**
 * Publish a quiz (change status to PUBLISHED)
 */
export async function publishQuiz(id: string): Promise<ActionResult> {
    try {
        await requirePermission("quiz.manage")

        const quiz = await db.quiz.findUnique({
            where: { id, deletedAt: null },
            include: {
                _count: {
                    select: { questions: true },
                },
                offering: {
                    select: {
                        course: { select: { nameAr: true } }
                    }
                }
            },
        })

        if (!quiz) {
            return { success: false, error: "الكويز غير موجود" }
        }

        if (quiz.status !== "DRAFT") {
            return { success: false, error: "يمكن نشر الكويزات المسودة فقط" }
        }

        if (quiz._count.questions === 0) {
            return { success: false, error: "لا يمكن نشر كويز بدون أسئلة" }
        }

        await db.quiz.update({
            where: { id },
            data: { status: "PUBLISHED" },
        })

        // Notify all enrolled students
        const enrollments = await db.enrollment.findMany({
            where: { offeringId: quiz.offeringId, status: "ACTIVE" },
            select: { studentId: true },
        })

        if (enrollments.length > 0) {
            await createNotification({
                userIds: enrollments.map((e: { studentId: string }) => e.studentId),
                title: "كويز جديد",
                body: `تم نشر كويز "${quiz.title}" في مادة ${quiz.offering.course.nameAr}`,
                type: "INFO",
                link: `/quizzes/${quiz.id}/take`,
            })
        }

        revalidatePath("/quizzes")
        revalidatePath(`/quizzes/${id}/edit`)
        return { success: true }
    } catch (error) {
        console.error("Error publishing quiz:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في نشر الكويز",
        }
    }
}

/**
 * Close a quiz (change status to CLOSED)
 */
export async function closeQuiz(id: string): Promise<ActionResult> {
    try {
        await requirePermission("quiz.manage")

        const quiz = await db.quiz.findUnique({
            where: { id, deletedAt: null },
        })

        if (!quiz) {
            return { success: false, error: "الكويز غير موجود" }
        }

        if (quiz.status !== "PUBLISHED") {
            return { success: false, error: "يمكن إغلاق الكويزات المنشورة فقط" }
        }

        await db.quiz.update({
            where: { id },
            data: { status: "CLOSED" },
        })

        revalidatePath("/quizzes")
        revalidatePath(`/quizzes/${id}/edit`)
        return { success: true }
    } catch (error) {
        console.error("Error closing quiz:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في إغلاق الكويز",
        }
    }
}

/**
 * Reopen a closed quiz (change status back to PUBLISHED)
 */
export async function reopenQuiz(id: string): Promise<ActionResult> {
    try {
        await requirePermission("quiz.manage")

        const quiz = await db.quiz.findUnique({
            where: { id, deletedAt: null },
        })

        if (!quiz) {
            return { success: false, error: "الكويز غير موجود" }
        }

        if (quiz.status !== "CLOSED") {
            return { success: false, error: "يمكن إعادة فتح الكويزات المغلقة فقط" }
        }

        await db.quiz.update({
            where: { id },
            data: { status: "PUBLISHED" },
        })

        revalidatePath("/quizzes")
        revalidatePath(`/quizzes/${id}/edit`)
        return { success: true }
    } catch (error) {
        console.error("Error reopening quiz:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في إعادة فتح الكويز",
        }
    }
}

/**
 * Duplicate a quiz
 */
export async function duplicateQuiz(id: string): Promise<ActionResult<{ id: string }>> {
    try {
        await requirePermission("quiz.create")

        const session = await auth()
        if (!session?.user?.id) {
            return { success: false, error: "غير مصرح" }
        }

        const original = await db.quiz.findUnique({
            where: { id, deletedAt: null },
            include: {
                questions: {
                    include: {
                        options: true,
                    },
                },
            },
        })

        if (!original) {
            return { success: false, error: "الكويز غير موجود" }
        }

        // Create new quiz with questions and options
        const newQuiz = await db.quiz.create({
            data: {
                title: `${original.title} (نسخة)`,
                description: original.description,
                offeringId: original.offeringId,
                creatorId: session.user.id,
                duration: original.duration,
                passingScore: original.passingScore,
                totalPoints: original.totalPoints,
                shuffleQuestions: original.shuffleQuestions,
                shuffleOptions: original.shuffleOptions,
                showResults: original.showResults,
                allowReview: original.allowReview,
                status: "DRAFT",
                questions: {
                    create: original.questions.map((q) => ({
                        type: q.type,
                        difficulty: q.difficulty,
                        text: q.text,
                        explanation: q.explanation,
                        points: q.points,
                        order: q.order,
                        isAiGenerated: false,
                        options: {
                            create: q.options.map((o) => ({
                                text: o.text,
                                isCorrect: o.isCorrect,
                                order: o.order,
                            })),
                        },
                    })),
                },
            },
        })

        revalidatePath("/quizzes")
        return { success: true, data: { id: newQuiz.id } }
    } catch (error) {
        console.error("Error duplicating quiz:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في نسخ الكويز",
        }
    }
}

/**
 * Get offerings for quiz creation dropdown
 */
export async function getOfferingsForQuiz(): Promise<
    ActionResult<{ id: string; code: string; courseName: string; semester: string }[]>
> {
    try {
        const offerings = await db.courseOffering.findMany({
            where: { deletedAt: null, isActive: true },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                code: true,
                course: {
                    select: { nameAr: true },
                },
                semester: {
                    select: { nameAr: true, isCurrent: true },
                },
            },
        })

        return {
            success: true,
            data: offerings.map((o) => ({
                id: o.id,
                code: o.code,
                courseName: o.course.nameAr,
                semester: o.semester.nameAr + (o.semester.isCurrent ? " (حالي)" : ""),
            })),
        }
    } catch (error) {
        console.error("Error fetching offerings:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في جلب الشُعب",
        }
    }
}

/**
 * Recalculate total points for a quiz
 */
export async function recalculateTotalPoints(quizId: string): Promise<ActionResult> {
    try {
        const questions = await db.question.findMany({
            where: { quizId },
            select: { points: true },
        })

        const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)

        await db.quiz.update({
            where: { id: quizId },
            data: { totalPoints },
        })

        return { success: true }
    } catch (error) {
        console.error("Error recalculating points:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في حساب النقاط",
        }
    }
}
