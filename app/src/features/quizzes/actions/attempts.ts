"use server"

/**
 * Quiz Attempt Server Actions (Student Side)
 * 
 * Handles quiz taking, answer submission, and auto-grading.
 * IMPORTANT: Never expose isCorrect to the client during quiz taking!
 * 
 * @module features/quizzes/actions/attempts
 */

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import type { ActionResult } from "./index"

// ============================================
// TYPES
// ============================================

export interface StudentQuizData {
    id: string
    title: string
    description: string | null
    duration: number
    totalPoints: number
    questionsCount: number
    status: string
    offering: {
        id: string
        code: string
        course: {
            nameAr: string
        }
    }
    attempt: {
        id: string
        status: string
        startedAt: Date
        submittedAt: Date | null
        score: number | null
        percentage: number | null
    } | null
}

export interface QuizForTaking {
    id: string
    title: string
    duration: number
    totalPoints: number
    shuffleQuestions: boolean
    shuffleOptions: boolean
    attempt: {
        id: string
        startedAt: Date
    }
    questions: {
        id: string
        type: string
        text: string
        points: number
        order: number
        options: {
            id: string
            text: string
            order: number
            // NOTE: isCorrect is NEVER included here!
        }[]
        savedAnswer?: {
            selectedOptionId: string | null
            textAnswer: string | null
        }
    }[]
}

export interface QuizResult {
    id: string
    title: string
    totalPoints: number
    attempt: {
        id: string
        score: number
        percentage: number
        submittedAt: Date
        status: string
    }
    questions: {
        id: string
        text: string
        type: string
        points: number
        pointsEarned: number
        isCorrect: boolean | null
        explanation: string | null
        selectedOptionId: string | null
        textAnswer: string | null
        correctOptionId: string | null
        options: {
            id: string
            text: string
            isCorrect: boolean
        }[]
    }[]
}

// ============================================
// SCHEMAS
// ============================================

const saveAnswerSchema = z.object({
    attemptId: z.string(),
    questionId: z.string(),
    selectedOptionId: z.string().nullable().optional(),
    textAnswer: z.string().nullable().optional(),
})

const submitQuizSchema = z.object({
    attemptId: z.string(),
    answers: z.array(z.object({
        questionId: z.string(),
        selectedOptionId: z.string().nullable().optional(),
        textAnswer: z.string().nullable().optional(),
    })),
})

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Shuffle an array (Fisher-Yates algorithm)
 */
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
            ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
}

/**
 * Check if student is enrolled in the offering
 */
async function isStudentEnrolled(
    studentId: string,
    offeringId: string
): Promise<boolean> {
    const enrollment = await db.enrollment.findFirst({
        where: {
            studentId,
            offeringId,
            droppedAt: null,
        },
    })
    return !!enrollment
}

// ============================================
// ACTIONS
// ============================================

/**
 * Get quizzes available for a student (enrolled in their offerings)
 */
export async function getStudentQuizzes(): Promise<ActionResult<StudentQuizData[]>> {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return { success: false, error: "غير مصرح" }
        }

        const studentId = session.user.id

        // Get enrollments for this student
        const enrollments = await db.enrollment.findMany({
            where: { studentId, droppedAt: null },
            select: { offeringId: true },
        })

        const offeringIds = enrollments.map((e: { offeringId: string }) => e.offeringId)

        if (offeringIds.length === 0) {
            return { success: true, data: [] }
        }

        // Get published quizzes for enrolled offerings
        const quizzes = await db.quiz.findMany({
            where: {
                offeringId: { in: offeringIds },
                status: "PUBLISHED",
                deletedAt: null,
            },
            orderBy: { createdAt: "desc" },
            include: {
                offering: {
                    select: {
                        id: true,
                        code: true,
                        course: {
                            select: { nameAr: true },
                        },
                    },
                },
                _count: {
                    select: { questions: true },
                },
                attempts: {
                    where: { studentId },
                    take: 1,
                    select: {
                        id: true,
                        status: true,
                        startedAt: true,
                        submittedAt: true,
                        score: true,
                        percentage: true,
                    },
                },
            },
        })

        const result: StudentQuizData[] = quizzes.map((quiz: any) => ({
            id: quiz.id,
            title: quiz.title,
            description: quiz.description,
            duration: quiz.duration,
            totalPoints: quiz.totalPoints,
            questionsCount: quiz._count.questions,
            status: quiz.status,
            offering: quiz.offering,
            attempt: quiz.attempts[0] ?? null,
        }))

        return { success: true, data: result }
    } catch (error) {
        console.error("Error fetching student quizzes:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في جلب الكويزات",
        }
    }
}

/**
 * Start a quiz attempt
 */
export async function startAttempt(
    quizId: string
): Promise<ActionResult<{ attemptId: string }>> {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return { success: false, error: "غير مصرح" }
        }

        const studentId = session.user.id

        // Get quiz
        const quiz = await db.quiz.findUnique({
            where: { id: quizId, deletedAt: null },
            include: {
                offering: true,
            },
        })

        if (!quiz) {
            return { success: false, error: "الكويز غير موجود" }
        }

        // Check if quiz is published
        if (quiz.status !== "PUBLISHED") {
            return { success: false, error: "الكويز غير متاح حالياً" }
        }

        // Check if student is enrolled
        const enrolled = await isStudentEnrolled(studentId, quiz.offeringId)
        if (!enrolled) {
            return { success: false, error: "أنت غير مسجل في هذه الشعبة" }
        }

        // Check for existing attempt
        const existingAttempt = await db.quizAttempt.findUnique({
            where: {
                quizId_studentId: {
                    quizId,
                    studentId,
                },
            },
        })

        if (existingAttempt) {
            if (existingAttempt.status === "SUBMITTED" || existingAttempt.status === "GRADED") {
                return { success: false, error: "لديك محاولة سابقة مكتملة" }
            }
            // Return existing in-progress attempt
            return { success: true, data: { attemptId: existingAttempt.id } }
        }

        // Check time constraints
        const now = new Date()
        if (quiz.startTime && now < quiz.startTime) {
            return { success: false, error: "الكويز لم يبدأ بعد" }
        }
        if (quiz.endTime && now > quiz.endTime) {
            return { success: false, error: "انتهى وقت الكويز" }
        }

        // Create new attempt
        const attempt = await db.quizAttempt.create({
            data: {
                quizId,
                studentId,
                status: "IN_PROGRESS",
                startedAt: now,
            },
        })

        return { success: true, data: { attemptId: attempt.id } }
    } catch (error) {
        console.error("Error starting attempt:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في بدء الكويز",
        }
    }
}

/**
 * Get quiz for taking (sanitized - no correct answers)
 */
export async function getQuizForTaking(
    attemptId: string
): Promise<ActionResult<QuizForTaking>> {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return { success: false, error: "غير مصرح" }
        }

        const studentId = session.user.id

        // Get attempt
        const attempt = await db.quizAttempt.findUnique({
            where: { id: attemptId },
            include: {
                quiz: {
                    include: {
                        questions: {
                            orderBy: { order: "asc" },
                            include: {
                                options: {
                                    orderBy: { order: "asc" },
                                    select: {
                                        id: true,
                                        text: true,
                                        order: true,
                                        // SECURITY: isCorrect is NOT selected!
                                    },
                                },
                            },
                        },
                    },
                },
                answers: {
                    select: {
                        questionId: true,
                        selectedOptionId: true,
                        textAnswer: true,
                    },
                },
            },
        })

        if (!attempt) {
            return { success: false, error: "المحاولة غير موجودة" }
        }

        if (attempt.studentId !== studentId) {
            return { success: false, error: "غير مصرح بالوصول لهذه المحاولة" }
        }

        if (attempt.status !== "IN_PROGRESS") {
            return { success: false, error: "هذه المحاولة منتهية" }
        }

        // Check if time expired
        const elapsed = (Date.now() - attempt.startedAt.getTime()) / 1000 / 60
        if (elapsed > attempt.quiz.duration) {
            // Auto-submit if time expired
            await forceSubmitAttempt(attemptId)
            return { success: false, error: "انتهى وقت الكويز" }
        }

        const quiz = attempt.quiz

        // Build answers map
        const answersMap = new Map(
            attempt.answers.map((a: any) => [a.questionId, a])
        )

        // Prepare questions (shuffle if needed)
        let questions = quiz.questions.map((q: any) => ({
            id: q.id,
            type: q.type,
            text: q.text,
            points: q.points,
            order: q.order,
            options: quiz.shuffleOptions ? shuffleArray(q.options) : q.options,
            savedAnswer: answersMap.get(q.id),
        }))

        if (quiz.shuffleQuestions) {
            questions = shuffleArray(questions)
        }

        return {
            success: true,
            data: {
                id: quiz.id,
                title: quiz.title,
                duration: quiz.duration,
                totalPoints: quiz.totalPoints,
                shuffleQuestions: quiz.shuffleQuestions,
                shuffleOptions: quiz.shuffleOptions,
                attempt: {
                    id: attempt.id,
                    startedAt: attempt.startedAt,
                },
                questions,
            },
        }
    } catch (error) {
        console.error("Error getting quiz for taking:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في جلب الكويز",
        }
    }
}

/**
 * Save a single answer (auto-save)
 */
export async function saveAnswer(
    input: z.infer<typeof saveAnswerSchema>
): Promise<ActionResult> {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return { success: false, error: "غير مصرح" }
        }

        const validated = saveAnswerSchema.parse(input)

        // Verify attempt belongs to student
        const attempt = await db.quizAttempt.findUnique({
            where: { id: validated.attemptId },
        })

        if (!attempt || attempt.studentId !== session.user.id) {
            return { success: false, error: "غير مصرح" }
        }

        if (attempt.status !== "IN_PROGRESS") {
            return { success: false, error: "المحاولة منتهية" }
        }

        // Upsert answer
        await db.answer.upsert({
            where: {
                attemptId_questionId: {
                    attemptId: validated.attemptId,
                    questionId: validated.questionId,
                },
            },
            create: {
                attemptId: validated.attemptId,
                questionId: validated.questionId,
                selectedOptionId: validated.selectedOptionId ?? null,
                textAnswer: validated.textAnswer ?? null,
            },
            update: {
                selectedOptionId: validated.selectedOptionId ?? null,
                textAnswer: validated.textAnswer ?? null,
                answeredAt: new Date(),
            },
        })

        return { success: true }
    } catch (error) {
        console.error("Error saving answer:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في حفظ الإجابة",
        }
    }
}

/**
 * Submit quiz and auto-grade
 */
export async function submitQuiz(
    input: z.infer<typeof submitQuizSchema>
): Promise<ActionResult<{ score: number; percentage: number }>> {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return { success: false, error: "غير مصرح" }
        }

        const validated = submitQuizSchema.parse(input)

        // Verify attempt belongs to student
        const attempt = await db.quizAttempt.findUnique({
            where: { id: validated.attemptId },
            include: {
                quiz: {
                    include: {
                        questions: {
                            include: {
                                options: true,
                            },
                        },
                    },
                },
            },
        })

        if (!attempt || attempt.studentId !== session.user.id) {
            return { success: false, error: "غير مصرح" }
        }

        if (attempt.status !== "IN_PROGRESS") {
            return { success: false, error: "المحاولة منتهية بالفعل" }
        }

        // Save all answers first
        for (const answer of validated.answers) {
            await db.answer.upsert({
                where: {
                    attemptId_questionId: {
                        attemptId: validated.attemptId,
                        questionId: answer.questionId,
                    },
                },
                create: {
                    attemptId: validated.attemptId,
                    questionId: answer.questionId,
                    selectedOptionId: answer.selectedOptionId ?? null,
                    textAnswer: answer.textAnswer ?? null,
                },
                update: {
                    selectedOptionId: answer.selectedOptionId ?? null,
                    textAnswer: answer.textAnswer ?? null,
                    answeredAt: new Date(),
                },
            })
        }

        // Grade the quiz
        let totalScore = 0
        const questionMap = new Map(attempt.quiz.questions.map((q: any) => [q.id, q]))

        for (const answer of validated.answers) {
            const question = questionMap.get(answer.questionId) as any
            if (!question) continue

            let isCorrect: boolean | null = null
            let pointsEarned = 0

            if (question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE") {
                // Auto-grade: check if selected option is correct
                if (answer.selectedOptionId) {
                    const selectedOption = question.options.find(
                        (o: any) => o.id === answer.selectedOptionId
                    )
                    isCorrect = selectedOption?.isCorrect ?? false
                    pointsEarned = isCorrect ? question.points : 0
                } else {
                    isCorrect = false
                    pointsEarned = 0
                }
                totalScore += pointsEarned
            } else if (question.type === "SHORT_ANSWER") {
                // Manual grading needed - leave null
                isCorrect = null
                pointsEarned = 0
            }

            // Update answer with grading result
            await db.answer.update({
                where: {
                    attemptId_questionId: {
                        attemptId: validated.attemptId,
                        questionId: answer.questionId,
                    },
                },
                data: {
                    isCorrect,
                    pointsEarned,
                },
            })
        }

        // Calculate percentage
        const percentage = attempt.quiz.totalPoints > 0
            ? (totalScore / attempt.quiz.totalPoints) * 100
            : 0

        // Update attempt
        await db.quizAttempt.update({
            where: { id: validated.attemptId },
            data: {
                status: "SUBMITTED",
                submittedAt: new Date(),
                score: totalScore,
                percentage,
            },
        })

        revalidatePath("/quizzes")
        return { success: true, data: { score: totalScore, percentage } }
    } catch (error) {
        console.error("Error submitting quiz:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في تسليم الكويز",
        }
    }
}

/**
 * Force submit attempt (when time expires)
 */
async function forceSubmitAttempt(attemptId: string): Promise<void> {
    const attempt = await db.quizAttempt.findUnique({
        where: { id: attemptId },
        include: {
            quiz: {
                include: {
                    questions: {
                        include: { options: true },
                    },
                },
            },
            answers: true,
        },
    })

    if (!attempt || attempt.status !== "IN_PROGRESS") return

    // Grade existing answers
    let totalScore = 0
    const questionMap = new Map(attempt.quiz.questions.map((q: any) => [q.id, q]))

    for (const answer of attempt.answers) {
        const question = questionMap.get(answer.questionId) as any
        if (!question) continue

        let isCorrect: boolean | null = null
        let pointsEarned = 0

        if (question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE") {
            if (answer.selectedOptionId) {
                const selectedOption = question.options.find(
                    (o: any) => o.id === answer.selectedOptionId
                )
                isCorrect = selectedOption?.isCorrect ?? false
                pointsEarned = isCorrect ? question.points : 0
            } else {
                isCorrect = false
            }
            totalScore += pointsEarned
        }

        await db.answer.update({
            where: { id: answer.id },
            data: { isCorrect, pointsEarned },
        })
    }

    const percentage = attempt.quiz.totalPoints > 0
        ? (totalScore / attempt.quiz.totalPoints) * 100
        : 0

    await db.quizAttempt.update({
        where: { id: attemptId },
        data: {
            status: "SUBMITTED",
            submittedAt: new Date(),
            score: totalScore,
            percentage,
        },
    })
}

/**
 * Get quiz result
 */
export async function getQuizResult(
    attemptId: string
): Promise<ActionResult<QuizResult>> {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return { success: false, error: "غير مصرح" }
        }

        const attempt = await db.quizAttempt.findUnique({
            where: { id: attemptId },
            include: {
                quiz: {
                    include: {
                        questions: {
                            orderBy: { order: "asc" },
                            include: {
                                options: {
                                    orderBy: { order: "asc" },
                                },
                            },
                        },
                    },
                },
                answers: true,
            },
        })

        if (!attempt) {
            return { success: false, error: "المحاولة غير موجودة" }
        }

        if (attempt.studentId !== session.user.id) {
            return { success: false, error: "غير مصرح" }
        }

        if (attempt.status === "IN_PROGRESS") {
            return { success: false, error: "المحاولة لم تُسلَّم بعد" }
        }

        // Check if quiz allows review
        if (!attempt.quiz.showResults) {
            return { success: false, error: "نتائج هذا الكويز غير متاحة للعرض" }
        }

        const answersMap = new Map(
            attempt.answers.map((a: any) => [a.questionId, a])
        )

        const questions = attempt.quiz.questions.map((q: any) => {
            const answer = answersMap.get(q.id)
            const correctOption = q.options.find((o: any) => o.isCorrect)

            return {
                id: q.id,
                text: q.text,
                type: q.type,
                points: q.points,
                pointsEarned: answer?.pointsEarned ?? 0,
                isCorrect: answer?.isCorrect ?? null,
                explanation: attempt.quiz.allowReview ? q.explanation : null,
                selectedOptionId: answer?.selectedOptionId ?? null,
                textAnswer: answer?.textAnswer ?? null,
                correctOptionId: attempt.quiz.allowReview ? (correctOption?.id ?? null) : null,
                options: attempt.quiz.allowReview
                    ? q.options
                    : q.options.map((o: any) => ({ ...o, isCorrect: false })),
            }
        })

        return {
            success: true,
            data: {
                id: attempt.quiz.id,
                title: attempt.quiz.title,
                totalPoints: attempt.quiz.totalPoints,
                attempt: {
                    id: attempt.id,
                    score: attempt.score ?? 0,
                    percentage: attempt.percentage ?? 0,
                    submittedAt: attempt.submittedAt!,
                    status: attempt.status,
                },
                questions,
            },
        }
    } catch (error) {
        console.error("Error getting quiz result:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في جلب النتيجة",
        }
    }
}

/**
 * Check remaining time for an attempt
 */
export async function getRemainingTime(
    attemptId: string
): Promise<ActionResult<{ remainingSeconds: number; isExpired: boolean }>> {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return { success: false, error: "غير مصرح" }
        }

        const attempt = await db.quizAttempt.findUnique({
            where: { id: attemptId },
            include: { quiz: { select: { duration: true } } },
        })

        if (!attempt || attempt.studentId !== session.user.id) {
            return { success: false, error: "غير مصرح" }
        }

        const elapsedMs = Date.now() - attempt.startedAt.getTime()
        const totalMs = attempt.quiz.duration * 60 * 1000
        const remainingMs = Math.max(0, totalMs - elapsedMs)
        const remainingSeconds = Math.floor(remainingMs / 1000)

        return {
            success: true,
            data: {
                remainingSeconds,
                isExpired: remainingSeconds <= 0,
            },
        }
    } catch (error) {
        console.error("Error getting remaining time:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في جلب الوقت المتبقي",
        }
    }
}
