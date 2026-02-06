"use server"

/**
 * Question Server Actions
 * 
 * Handles CRUD operations for Questions within a Quiz.
 * Supports: MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER
 * 
 * @module features/quizzes/actions/questions
 */

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { requirePermission } from "@/lib/auth/permissions"
import { recalculateTotalPoints, type ActionResult } from "./index"
import { type OptionInput } from "./utils"

// ============================================
// TYPES
// ============================================

export type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER"
export type Difficulty = "EASY" | "MEDIUM" | "HARD"

export interface QuestionInput {
    id?: string
    type: QuestionType
    difficulty: Difficulty
    text: string
    explanation?: string
    points: number
    order: number
    options: OptionInput[]
}

// ============================================
// SCHEMAS
// ============================================

const optionSchema = z.object({
    id: z.string().optional(),
    text: z.string().min(1, "نص الخيار مطلوب"),
    isCorrect: z.boolean(),
    order: z.number(),
})

const questionSchema = z.object({
    id: z.string().optional(),
    type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"]),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
    text: z.string().min(3, "نص السؤال يجب أن يكون 3 أحرف على الأقل"),
    explanation: z.string().optional(),
    points: z.coerce.number().min(0.5, "النقاط يجب أن تكون 0.5 على الأقل").default(1),
    order: z.number().default(0),
    options: z.array(optionSchema).default([]),
})

const addQuestionSchema = z.object({
    quizId: z.string(),
    question: questionSchema,
})

const updateQuestionSchema = z.object({
    id: z.string(),
    question: questionSchema,
})

const reorderSchema = z.object({
    quizId: z.string(),
    questionIds: z.array(z.string()),
})

const bulkSaveSchema = z.object({
    quizId: z.string(),
    questions: z.array(questionSchema),
})

// ============================================
// VALIDATION HELPERS
// ============================================

function validateQuestion(question: QuestionInput): string | null {
    // MCQ must have at least 2 options with 1 correct
    if (question.type === "MULTIPLE_CHOICE") {
        if (question.options.length < 2) {
            return "سؤال الاختيار المتعدد يجب أن يحتوي على خيارين على الأقل"
        }
        const hasCorrect = question.options.some((o) => o.isCorrect)
        if (!hasCorrect) {
            return "يجب تحديد إجابة صحيحة واحدة على الأقل"
        }
    }

    // TRUE_FALSE must have exactly 2 options
    if (question.type === "TRUE_FALSE") {
        if (question.options.length !== 2) {
            return "سؤال صح/خطأ يجب أن يحتوي على خيارين فقط"
        }
        const hasCorrect = question.options.some((o) => o.isCorrect)
        if (!hasCorrect) {
            return "يجب تحديد الإجابة الصحيحة"
        }
    }

    return null
}

// ============================================
// ACTIONS
// ============================================

/**
 * Add a new question to a quiz
 */
export async function addQuestion(
    input: z.infer<typeof addQuestionSchema>
): Promise<ActionResult<{ id: string }>> {
    try {
        await requirePermission("quiz.edit")

        const validated = addQuestionSchema.parse(input)

        // Check if quiz exists and is editable
        const quiz = await db.quiz.findUnique({
            where: { id: validated.quizId, deletedAt: null },
        })

        if (!quiz) {
            return { success: false, error: "الكويز غير موجود" }
        }

        if (quiz.status !== "DRAFT") {
            return { success: false, error: "لا يمكن تعديل كويز منشور أو مغلق" }
        }

        // Validate question based on type
        const validationError = validateQuestion(validated.question)
        if (validationError) {
            return { success: false, error: validationError }
        }

        // Get max order
        const maxOrder = await db.question.findFirst({
            where: { quizId: validated.quizId },
            orderBy: { order: "desc" },
            select: { order: true },
        })

        const newOrder = (maxOrder?.order ?? -1) + 1

        // Create question with options
        const question = await db.question.create({
            data: {
                quizId: validated.quizId,
                type: validated.question.type,
                difficulty: validated.question.difficulty,
                text: validated.question.text,
                explanation: validated.question.explanation,
                points: validated.question.points,
                order: newOrder,
                options: {
                    create: validated.question.options.map((o, idx) => ({
                        text: o.text,
                        isCorrect: o.isCorrect,
                        order: idx,
                    })),
                },
            },
        })

        // Recalculate total points
        await recalculateTotalPoints(validated.quizId)

        revalidatePath(`/quizzes/${validated.quizId}/edit`)
        return { success: true, data: { id: question.id } }
    } catch (error) {
        console.error("Error adding question:", error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في إضافة السؤال",
        }
    }
}

/**
 * Update an existing question
 */
export async function updateQuestion(
    input: z.infer<typeof updateQuestionSchema>
): Promise<ActionResult> {
    try {
        await requirePermission("quiz.edit")

        const validated = updateQuestionSchema.parse(input)

        // Check if question exists
        const existing = await db.question.findUnique({
            where: { id: validated.id },
            include: { quiz: true },
        })

        if (!existing) {
            return { success: false, error: "السؤال غير موجود" }
        }

        if (existing.quiz.status !== "DRAFT") {
            return { success: false, error: "لا يمكن تعديل أسئلة كويز منشور أو مغلق" }
        }

        // Validate question based on type
        const validationError = validateQuestion(validated.question)
        if (validationError) {
            return { success: false, error: validationError }
        }

        // Delete old options and create new ones
        await db.$transaction(async (tx) => {
            // Delete old options
            await tx.option.deleteMany({
                where: { questionId: validated.id },
            })

            // Update question and create new options
            await tx.question.update({
                where: { id: validated.id },
                data: {
                    type: validated.question.type,
                    difficulty: validated.question.difficulty,
                    text: validated.question.text,
                    explanation: validated.question.explanation,
                    points: validated.question.points,
                    options: {
                        create: validated.question.options.map((o, idx) => ({
                            text: o.text,
                            isCorrect: o.isCorrect,
                            order: idx,
                        })),
                    },
                },
            })
        })

        // Recalculate total points
        await recalculateTotalPoints(existing.quizId)

        revalidatePath(`/quizzes/${existing.quizId}/edit`)
        return { success: true }
    } catch (error) {
        console.error("Error updating question:", error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في تحديث السؤال",
        }
    }
}

/**
 * Delete a question
 */
export async function deleteQuestion(id: string): Promise<ActionResult> {
    try {
        await requirePermission("quiz.edit")

        const question = await db.question.findUnique({
            where: { id },
            include: { quiz: true },
        })

        if (!question) {
            return { success: false, error: "السؤال غير موجود" }
        }

        if (question.quiz.status !== "DRAFT") {
            return { success: false, error: "لا يمكن حذف أسئلة كويز منشور أو مغلق" }
        }

        // Delete question (options will cascade)
        await db.question.delete({
            where: { id },
        })

        // Recalculate total points
        await recalculateTotalPoints(question.quizId)

        revalidatePath(`/quizzes/${question.quizId}/edit`)
        return { success: true }
    } catch (error) {
        console.error("Error deleting question:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في حذف السؤال",
        }
    }
}

/**
 * Reorder questions in a quiz
 */
export async function reorderQuestions(
    input: z.infer<typeof reorderSchema>
): Promise<ActionResult> {
    try {
        await requirePermission("quiz.edit")

        const validated = reorderSchema.parse(input)

        // Check if quiz exists and is editable
        const quiz = await db.quiz.findUnique({
            where: { id: validated.quizId, deletedAt: null },
        })

        if (!quiz) {
            return { success: false, error: "الكويز غير موجود" }
        }

        if (quiz.status !== "DRAFT") {
            return { success: false, error: "لا يمكن إعادة ترتيب أسئلة كويز منشور أو مغلق" }
        }

        // Update order for each question
        await db.$transaction(
            validated.questionIds.map((id, index) =>
                db.question.update({
                    where: { id },
                    data: { order: index },
                })
            )
        )

        revalidatePath(`/quizzes/${validated.quizId}/edit`)
        return { success: true }
    } catch (error) {
        console.error("Error reordering questions:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في إعادة الترتيب",
        }
    }
}

/**
 * Bulk save all questions (replace all)
 * Used when saving the entire quiz builder form
 */
export async function saveAllQuestions(
    input: z.infer<typeof bulkSaveSchema>
): Promise<ActionResult> {
    try {
        await requirePermission("quiz.edit")

        const validated = bulkSaveSchema.parse(input)

        // Check if quiz exists and is editable
        const quiz = await db.quiz.findUnique({
            where: { id: validated.quizId, deletedAt: null },
            include: {
                questions: {
                    select: { id: true },
                },
            },
        })

        if (!quiz) {
            return { success: false, error: "الكويز غير موجود" }
        }

        if (quiz.status !== "DRAFT") {
            return { success: false, error: "لا يمكن تعديل كويز منشور أو مغلق" }
        }

        // Validate all questions
        for (const question of validated.questions) {
            const validationError = validateQuestion(question)
            if (validationError) {
                return { success: false, error: `السؤال "${question.text.substring(0, 30)}...": ${validationError}` }
            }
        }

        // Get existing question IDs
        const existingIds = new Set(quiz.questions.map((q) => q.id))
        const newQuestionIds = new Set(validated.questions.filter((q) => q.id).map((q) => q.id))

        // IDs to delete (exist in DB but not in new list)
        const toDelete = [...existingIds].filter((id) => !newQuestionIds.has(id))

        await db.$transaction(async (tx) => {
            // Delete removed questions
            if (toDelete.length > 0) {
                await tx.question.deleteMany({
                    where: { id: { in: toDelete } },
                })
            }

            // Update or create questions
            for (let i = 0; i < validated.questions.length; i++) {
                const q = validated.questions[i]

                if (q.id && existingIds.has(q.id)) {
                    // Update existing question
                    await tx.option.deleteMany({
                        where: { questionId: q.id },
                    })

                    await tx.question.update({
                        where: { id: q.id },
                        data: {
                            type: q.type,
                            difficulty: q.difficulty,
                            text: q.text,
                            explanation: q.explanation,
                            points: q.points,
                            order: i,
                            options: {
                                create: q.options.map((o, idx) => ({
                                    text: o.text,
                                    isCorrect: o.isCorrect,
                                    order: idx,
                                })),
                            },
                        },
                    })
                } else {
                    // Create new question
                    await tx.question.create({
                        data: {
                            quizId: validated.quizId,
                            type: q.type,
                            difficulty: q.difficulty,
                            text: q.text,
                            explanation: q.explanation,
                            points: q.points,
                            order: i,
                            options: {
                                create: q.options.map((o, idx) => ({
                                    text: o.text,
                                    isCorrect: o.isCorrect,
                                    order: idx,
                                })),
                            },
                        },
                    })
                }
            }
        })

        // Recalculate total points
        await recalculateTotalPoints(validated.quizId)

        revalidatePath(`/quizzes/${validated.quizId}/edit`)
        return { success: true }
    } catch (error) {
        console.error("Error bulk saving questions:", error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في حفظ الأسئلة",
        }
    }
}

