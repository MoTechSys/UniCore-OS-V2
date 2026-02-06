"use server"

/**
 * AI Server Actions
 * 
 * Server actions for AI-powered features:
 * - Question generation from topics
 * - Essay grading for SHORT_ANSWER questions
 * 
 * @module features/ai/actions
 */

import { z } from "zod"
import { generateStructured, isAIConfigured } from "@/lib/ai"
import { requirePermission } from "@/lib/auth/permissions"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { createNotification } from "@/features/notifications/actions"

// ============================================
// TYPES
// ============================================

type Difficulty = "EASY" | "MEDIUM" | "HARD"

export interface GeneratedQuestion {
    type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER"
    text: string
    difficulty: Difficulty
    points: number
    explanation: string
    options: {
        text: string
        isCorrect: boolean
    }[]
}

export interface ActionResult<T = void> {
    success: boolean
    data?: T
    error?: string
}

// ============================================
// SCHEMAS
// ============================================

const generateQuestionsInputSchema = z.object({
    topic: z.string().min(10, "الموضوع يجب أن يكون 10 أحرف على الأقل"),
    count: z.number().min(1).max(20),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
    questionTypes: z.array(z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"])).min(1),
    language: z.enum(["ar", "en"]).default("ar"),
})

// Schema for AI response validation
const generatedQuestionsSchema = z.object({
    questions: z.array(
        z.object({
            type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"]),
            text: z.string().min(5),
            difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
            points: z.number().min(1).max(10),
            explanation: z.string(),
            options: z.array(
                z.object({
                    text: z.string(),
                    isCorrect: z.boolean(),
                })
            ),
        })
    ),
})

const gradeEssayInputSchema = z.object({
    questionText: z.string(),
    studentAnswer: z.string(),
    modelAnswer: z.string().optional(),
    maxPoints: z.number().min(1),
})

// Schema for AI grading response
const essayGradeSchema = z.object({
    score: z.number().min(0).max(100),
    feedback: z.string(),
    strengths: z.array(z.string()),
    improvements: z.array(z.string()),
})

// ============================================
// PROMPTS
// ============================================

function getQuestionGenerationPrompt(
    topic: string,
    count: number,
    difficulty: Difficulty,
    questionTypes: string[],
    language: string
): { system: string; user: string } {
    const difficultyMap = {
        EASY: language === "ar" ? "سهل" : "easy",
        MEDIUM: language === "ar" ? "متوسط" : "medium",
        HARD: language === "ar" ? "صعب" : "hard",
    }

    const typeDescriptions =
        language === "ar"
            ? {
                MULTIPLE_CHOICE: "اختيار من متعدد (4 خيارات، إجابة صحيحة واحدة)",
                TRUE_FALSE: "صح أو خطأ",
                SHORT_ANSWER: "إجابة قصيرة (بدون خيارات)",
            }
            : {
                MULTIPLE_CHOICE: "Multiple choice (4 options, one correct answer)",
                TRUE_FALSE: "True or False",
                SHORT_ANSWER: "Short answer (no options)",
            }

    const typesText = questionTypes.map((t) => typeDescriptions[t as keyof typeof typeDescriptions]).join(", ")

    const systemPrompt =
        language === "ar"
            ? `أنت مساعد تعليمي متخصص في إنشاء أسئلة اختبارات عالية الجودة.
يجب عليك إنشاء أسئلة متنوعة ودقيقة علمياً.

قواعد مهمة:
- لأسئلة الاختيار من متعدد: أنشئ 4 خيارات بالضبط، مع إجابة صحيحة واحدة فقط
- لأسئلة صح/خطأ: أنشئ خيارين فقط (صح، خطأ)
- لأسئلة الإجابة القصيرة: لا تنشئ خيارات (مصفوفة فارغة)
- اجعل الشرح واضحاً ومفيداً
- النقاط: سهل=1، متوسط=2، صعب=3

أرجع JSON فقط بالتنسيق المطلوب.`
            : `You are an educational assistant specialized in creating high-quality exam questions.
You must create diverse and scientifically accurate questions.

Important rules:
- For MULTIPLE_CHOICE: Create exactly 4 options, with only one correct answer
- For TRUE_FALSE: Create exactly 2 options (True, False)
- For SHORT_ANSWER: Create no options (empty array)
- Make explanations clear and educational
- Points: EASY=1, MEDIUM=2, HARD=3

Return JSON only in the required format.`

    const userPrompt =
        language === "ar"
            ? `أنشئ ${count} سؤال عن الموضوع التالي:

**الموضوع:** ${topic}

**مستوى الصعوبة:** ${difficultyMap[difficulty]}

**أنواع الأسئلة المطلوبة:** ${typesText}

أرجع الأسئلة بتنسيق JSON التالي:
{
  "questions": [
    {
      "type": "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER",
      "text": "نص السؤال",
      "difficulty": "${difficulty}",
      "points": 1-3,
      "explanation": "شرح الإجابة الصحيحة",
      "options": [
        { "text": "نص الخيار", "isCorrect": true/false }
      ]
    }
  ]
}`
            : `Create ${count} questions about the following topic:

**Topic:** ${topic}

**Difficulty:** ${difficultyMap[difficulty]}

**Question types:** ${typesText}

Return questions in the following JSON format:
{
  "questions": [
    {
      "type": "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER",
      "text": "Question text",
      "difficulty": "${difficulty}",
      "points": 1-3,
      "explanation": "Explanation of the correct answer",
      "options": [
        { "text": "Option text", "isCorrect": true/false }
      ]
    }
  ]
}`

    return { system: systemPrompt, user: userPrompt }
}

function getEssayGradingPrompt(
    questionText: string,
    studentAnswer: string,
    modelAnswer?: string
): { system: string; user: string } {
    const systemPrompt = `أنت مصحح امتحانات محترف ودقيق.
مهمتك تقييم إجابة الطالب وإعطاء درجة من 0 إلى 100 مع ملاحظات بناءة.

قواعد التقييم:
- كن عادلاً ولكن صارماً في التقييم
- ركّز على الفهم والدقة العلمية
- اذكر نقاط القوة ونقاط التحسين بوضوح
- الملاحظات يجب أن تكون مفيدة وتعليمية

أرجع JSON فقط بالتنسيق المطلوب.`

    let userPrompt = `قيّم إجابة الطالب التالية:

**السؤال:**
${questionText}

**إجابة الطالب:**
${studentAnswer}
`

    if (modelAnswer) {
        userPrompt += `
**الإجابة النموذجية:**
${modelAnswer}
`
    }

    userPrompt += `
أرجع التقييم بتنسيق JSON التالي:
{
  "score": 0-100,
  "feedback": "ملاحظات عامة على الإجابة",
  "strengths": ["نقطة قوة 1", "نقطة قوة 2"],
  "improvements": ["نقطة تحسين 1", "نقطة تحسين 2"]
}`

    return { system: systemPrompt, user: userPrompt }
}

// ============================================
// ACTIONS
// ============================================

/**
 * Generate quiz questions using AI
 */
export async function generateQuestions(
    input: z.infer<typeof generateQuestionsInputSchema>
): Promise<ActionResult<GeneratedQuestion[]>> {
    try {
        // Permission check
        await requirePermission("quiz.create")

        // Check AI configuration
        if (!isAIConfigured()) {
            return {
                success: false,
                error: "خدمة الذكاء الاصطناعي غير مُعدّة. يرجى إضافة مفتاح API.",
            }
        }

        // Validate input
        const validated = generateQuestionsInputSchema.parse(input)

        // Generate prompt
        const { system, user } = getQuestionGenerationPrompt(
            validated.topic,
            validated.count,
            validated.difficulty,
            validated.questionTypes,
            validated.language
        )

        // Call AI service
        const result = await generateStructured(user, system, generatedQuestionsSchema, {
            temperature: 0.8, // Slightly higher for creativity
        })

        if (!result.success || !result.data) {
            return {
                success: false,
                error: result.error ?? "فشل في توليد الأسئلة",
            }
        }

        // Post-process and validate questions
        const questions = result.data.questions.map((q) => {
            // Ensure correct structure based on type
            if (q.type === "SHORT_ANSWER") {
                return { ...q, options: [] }
            }

            if (q.type === "TRUE_FALSE" && q.options.length !== 2) {
                // Fix true/false to have exactly 2 options
                const isTrue = q.options.some((o) => o.isCorrect && o.text.includes("صح"))
                return {
                    ...q,
                    options: [
                        { text: "صح", isCorrect: isTrue },
                        { text: "خطأ", isCorrect: !isTrue },
                    ],
                }
            }

            if (q.type === "MULTIPLE_CHOICE") {
                // Ensure exactly one correct answer
                const correctCount = q.options.filter((o) => o.isCorrect).length
                if (correctCount !== 1) {
                    // Make first correct, others false
                    return {
                        ...q,
                        options: q.options.map((o, i) => ({
                            ...o,
                            isCorrect: i === 0,
                        })),
                    }
                }
            }

            return q
        })

        return { success: true, data: questions }
    } catch (error) {
        console.error("Error generating questions:", error)

        if (error instanceof z.ZodError) {
            return { success: false, error: "بيانات غير صالحة" }
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في توليد الأسئلة",
        }
    }
}

/**
 * Grade an essay answer using AI
 */
export async function gradeEssayAnswer(
    input: z.infer<typeof gradeEssayInputSchema>
): Promise<ActionResult<{ score: number; percentage: number; feedback: string; strengths: string[]; improvements: string[] }>> {
    try {
        // Permission check (instructor or admin)
        await requirePermission("quiz.grade")

        // Check AI configuration
        if (!isAIConfigured()) {
            return {
                success: false,
                error: "خدمة الذكاء الاصطناعي غير مُعدّة.",
            }
        }

        // Validate input
        const validated = gradeEssayInputSchema.parse(input)

        // Generate prompt
        const { system, user } = getEssayGradingPrompt(
            validated.questionText,
            validated.studentAnswer,
            validated.modelAnswer
        )

        // Call AI service
        const result = await generateStructured(user, system, essayGradeSchema, {
            temperature: 0.3, // Lower for consistency
        })

        if (!result.success || !result.data) {
            return {
                success: false,
                error: result.error ?? "فشل في تصحيح الإجابة",
            }
        }

        // Calculate actual points
        const percentage = result.data.score
        const score = (percentage / 100) * validated.maxPoints

        return {
            success: true,
            data: {
                score,
                percentage,
                feedback: result.data.feedback,
                strengths: result.data.strengths,
                improvements: result.data.improvements,
            },
        }
    } catch (error) {
        console.error("Error grading essay:", error)

        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في تصحيح الإجابة",
        }
    }
}

/**
 * Bulk grade all essay answers for a quiz attempt
 */
export async function gradeAttemptEssays(
    attemptId: string
): Promise<ActionResult<{ gradedCount: number }>> {
    try {
        await requirePermission("quiz.grade")

        if (!isAIConfigured()) {
            return { success: false, error: "خدمة الذكاء الاصطناعي غير مُعدّة." }
        }

        // Get attempt with answers
        const attempt = await db.quizAttempt.findUnique({
            where: { id: attemptId },
            include: {
                student: { select: { id: true } },
                quiz: { select: { title: true, id: true } },
                answers: {
                    include: {
                        question: true,
                    },
                    where: {
                        question: { type: "SHORT_ANSWER" },
                        aiScore: null, // Only ungraded
                        textAnswer: { not: null },
                    },
                },
            },
        })

        if (!attempt) {
            return { success: false, error: "المحاولة غير موجودة" }
        }

        let gradedCount = 0

        // Grade each essay answer
        for (const answer of attempt.answers) {
            if (!answer.textAnswer) continue

            const gradeResult = await gradeEssayAnswer({
                questionText: answer.question.text,
                studentAnswer: answer.textAnswer,
                modelAnswer: answer.question.explanation ?? undefined,
                maxPoints: answer.question.points,
            })

            if (gradeResult.success && gradeResult.data) {
                await db.answer.update({
                    where: { id: answer.id },
                    data: {
                        aiScore: gradeResult.data.percentage,
                        aiFeedback: gradeResult.data.feedback,
                        aiGradedAt: new Date(),
                        // Optionally auto-apply AI score
                        // pointsEarned: gradeResult.data.score,
                        // isCorrect: gradeResult.data.percentage >= 50,
                    },
                })
                gradedCount++
            }
        }

        // Notify student
        if (gradedCount > 0) {
            await createNotification({
                userIds: [attempt.student.id],
                title: "تصحيح الإجابات",
                body: `تم تصحيح ${gradedCount} إجابة في كويز "${attempt.quiz.title}"`,
                type: "SUCCESS",
                link: `/quizzes/${attempt.quiz.id}/results`,
            })
        }

        revalidatePath(`/quizzes`)
        return { success: true, data: { gradedCount } }
    } catch (error) {
        console.error("Error grading attempt essays:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في تصحيح الإجابات",
        }
    }
}

/**
 * Check if AI service is available
 */
export async function checkAIStatus(): Promise<ActionResult<{ configured: boolean; provider: string }>> {
    const configured = isAIConfigured()
    const provider = process.env.AI_PROVIDER || "gemini"

    return {
        success: true,
        data: { configured, provider },
    }
}
