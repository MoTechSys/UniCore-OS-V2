"use client"

/**
 * Quiz Taking Content (Client Component)
 * 
 * Full quiz taking interface with timer, questions, and auto-save.
 * 
 * @module features/quizzes/components/QuizTakingContent
 */

import { useState, useEffect, useCallback, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import {
    Clock,
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    Send,
    AlertTriangle,
    Save,
    Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
    saveAnswer,
    submitQuiz,
    type QuizForTaking,
} from "@/features/quizzes/actions/attempts"

// ============================================
// TYPES
// ============================================

interface QuizTakingContentProps {
    quiz: QuizForTaking
}

interface AnswerState {
    [questionId: string]: {
        selectedOptionId: string | null
        textAnswer: string | null
        saved: boolean
    }
}

// ============================================
// TIMER HOOK
// ============================================

function useTimer(startTime: Date, duration: number, onExpire: () => void) {
    const [remainingSeconds, setRemainingSeconds] = useState(() => {
        const elapsed = (Date.now() - startTime.getTime()) / 1000
        return Math.max(0, duration * 60 - elapsed)
    })

    useEffect(() => {
        const interval = setInterval(() => {
            setRemainingSeconds((prev) => {
                const next = prev - 1
                if (next <= 0) {
                    clearInterval(interval)
                    onExpire()
                    return 0
                }
                return next
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [onExpire])

    const minutes = Math.floor(remainingSeconds / 60)
    const seconds = Math.floor(remainingSeconds % 60)

    return {
        minutes,
        seconds,
        remainingSeconds,
        isUrgent: remainingSeconds < 300, // Less than 5 minutes
        isCritical: remainingSeconds < 60, // Less than 1 minute
    }
}

// ============================================
// TIMER COMPONENT
// ============================================

function QuizTimer({
    startTime,
    duration,
    onExpire,
}: {
    startTime: Date
    duration: number
    onExpire: () => void
}) {
    const { minutes, seconds, isUrgent, isCritical } = useTimer(
        startTime,
        duration,
        onExpire
    )

    return (
        <div
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg",
                isCritical
                    ? "bg-red-100 text-red-700 animate-pulse"
                    : isUrgent
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-muted"
            )}
        >
            <Clock className="h-5 w-5" />
            <span>
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
        </div>
    )
}

// ============================================
// QUESTION NAVIGATOR
// ============================================

function QuestionNavigator({
    questions,
    currentIndex,
    answers,
    onNavigate,
}: {
    questions: QuizForTaking["questions"]
    currentIndex: number
    answers: AnswerState
    onNavigate: (index: number) => void
}) {
    return (
        <div className="flex flex-wrap gap-2">
            {questions.map((q, idx) => {
                const isAnswered = answers[q.id]?.selectedOptionId || answers[q.id]?.textAnswer
                const isCurrent = idx === currentIndex

                return (
                    <button
                        key={q.id}
                        onClick={() => onNavigate(idx)}
                        className={cn(
                            "w-10 h-10 rounded-lg font-medium text-sm transition-all",
                            "border hover:border-primary",
                            isCurrent && "ring-2 ring-primary ring-offset-2",
                            isAnswered
                                ? "bg-green-100 border-green-300 text-green-700"
                                : "bg-muted border-border"
                        )}
                    >
                        {idx + 1}
                    </button>
                )
            })}
        </div>
    )
}

// ============================================
// QUESTION DISPLAY
// ============================================

function QuestionDisplay({
    question,
    questionNumber,
    totalQuestions,
    answer,
    onAnswerChange,
    isSubmitting,
}: {
    question: QuizForTaking["questions"][0]
    questionNumber: number
    totalQuestions: number
    answer: AnswerState[string] | undefined
    onAnswerChange: (selectedOptionId: string | null, textAnswer: string | null) => void
    isSubmitting: boolean
}) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                        السؤال {questionNumber} من {totalQuestions}
                    </CardTitle>
                    <Badge variant="outline">{question.points} نقطة</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Question Text */}
                <p className="text-lg leading-relaxed">{question.text}</p>

                {/* Options (for MCQ and T/F) */}
                {(question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE") && (
                    <RadioGroup
                        value={answer?.selectedOptionId ?? ""}
                        onValueChange={(value) => onAnswerChange(value, null)}
                        disabled={isSubmitting}
                    >
                        <div className="space-y-3">
                            {question.options.map((option) => (
                                <div
                                    key={option.id}
                                    className={cn(
                                        "flex items-center space-x-3 space-x-reverse p-4 rounded-lg border transition-colors cursor-pointer",
                                        answer?.selectedOptionId === option.id
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/50"
                                    )}
                                    onClick={() => !isSubmitting && onAnswerChange(option.id, null)}
                                >
                                    <RadioGroupItem value={option.id} id={option.id} />
                                    <Label
                                        htmlFor={option.id}
                                        className="flex-1 cursor-pointer text-base"
                                    >
                                        {option.text}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </RadioGroup>
                )}

                {/* Text Answer (for SHORT_ANSWER) */}
                {question.type === "SHORT_ANSWER" && (
                    <Textarea
                        value={answer?.textAnswer ?? ""}
                        onChange={(e) => onAnswerChange(null, e.target.value)}
                        placeholder="اكتب إجابتك هنا..."
                        rows={4}
                        disabled={isSubmitting}
                    />
                )}
            </CardContent>
        </Card>
    )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function QuizTakingContent({ quiz }: QuizTakingContentProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<AnswerState>(() => {
        // Initialize from saved answers
        const initial: AnswerState = {}
        quiz.questions.forEach((q) => {
            initial[q.id] = {
                selectedOptionId: q.savedAnswer?.selectedOptionId ?? null,
                textAnswer: q.savedAnswer?.textAnswer ?? null,
                saved: !!q.savedAnswer,
            }
        })
        return initial
    })
    const [submitDialogOpen, setSubmitDialogOpen] = useState(false)
    const [timeExpiredDialogOpen, setTimeExpiredDialogOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Ref to track unsaved changes
    const unsavedRef = useRef<Set<string>>(new Set())

    const currentQuestion = quiz.questions[currentQuestionIndex]

    // Auto-save on answer change (debounced)
    const saveAnswerDebounced = useCallback(
        async (questionId: string) => {
            if (!unsavedRef.current.has(questionId)) return

            setIsSaving(true)
            const answer = answers[questionId]
            const result = await saveAnswer({
                attemptId: quiz.attempt.id,
                questionId,
                selectedOptionId: answer?.selectedOptionId,
                textAnswer: answer?.textAnswer,
            })

            if (result.success) {
                unsavedRef.current.delete(questionId)
                setAnswers((prev) => ({
                    ...prev,
                    [questionId]: { ...prev[questionId], saved: true },
                }))
            }
            setIsSaving(false)
        },
        [answers, quiz.attempt.id]
    )

    // Save on navigation or after typing stops
    useEffect(() => {
        const timer = setTimeout(() => {
            unsavedRef.current.forEach((qId) => {
                saveAnswerDebounced(qId)
            })
        }, 1500)

        return () => clearTimeout(timer)
    }, [answers, saveAnswerDebounced])

    // Handle answer change
    const handleAnswerChange = (
        selectedOptionId: string | null,
        textAnswer: string | null
    ) => {
        const questionId = currentQuestion.id
        unsavedRef.current.add(questionId)

        setAnswers((prev) => ({
            ...prev,
            [questionId]: {
                selectedOptionId: selectedOptionId ?? prev[questionId]?.selectedOptionId,
                textAnswer: textAnswer ?? prev[questionId]?.textAnswer,
                saved: false,
            },
        }))
    }

    // Handle navigation
    const goToQuestion = (index: number) => {
        // Save current answer before navigating
        if (unsavedRef.current.has(currentQuestion.id)) {
            saveAnswerDebounced(currentQuestion.id)
        }
        setCurrentQuestionIndex(index)
    }

    const goNext = () => {
        if (currentQuestionIndex < quiz.questions.length - 1) {
            goToQuestion(currentQuestionIndex + 1)
        }
    }

    const goPrev = () => {
        if (currentQuestionIndex > 0) {
            goToQuestion(currentQuestionIndex - 1)
        }
    }

    // Handle time expiry
    const handleTimeExpired = useCallback(() => {
        setTimeExpiredDialogOpen(true)
        // Force submit
        startTransition(async () => {
            const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
                questionId,
                selectedOptionId: answer.selectedOptionId,
                textAnswer: answer.textAnswer,
            }))

            await submitQuiz({
                attemptId: quiz.attempt.id,
                answers: answersArray,
            })
        })
    }, [answers, quiz.attempt.id])

    // Handle submit
    const handleSubmit = () => {
        startTransition(async () => {
            const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
                questionId,
                selectedOptionId: answer.selectedOptionId,
                textAnswer: answer.textAnswer,
            }))

            const result = await submitQuiz({
                attemptId: quiz.attempt.id,
                answers: answersArray,
            })

            if (result.success) {
                toast.success("تم تسليم الكويز بنجاح! 🎉")
                router.push(`/quizzes/${quiz.id}/result?attempt=${quiz.attempt.id}`)
            } else {
                toast.error(result.error ?? "فشل في تسليم الكويز")
                setSubmitDialogOpen(false)
            }
        })
    }

    // Calculate progress
    const answeredCount = Object.values(answers).filter(
        (a) => a.selectedOptionId || a.textAnswer
    ).length
    const progressPercentage = (answeredCount / quiz.questions.length) * 100

    return (
        <div className="min-h-screen flex flex-col bg-muted/30">
            {/* Sticky Header with Timer */}
            <header className="sticky top-0 z-50 bg-background border-b shadow-sm">
                <div className="container py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="font-semibold">{quiz.title}</h1>
                            <p className="text-sm text-muted-foreground">
                                {answeredCount} / {quiz.questions.length} إجابات
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            {isSaving && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    جارٍ الحفظ...
                                </div>
                            )}
                            <QuizTimer
                                startTime={new Date(quiz.attempt.startedAt)}
                                duration={quiz.duration}
                                onExpire={handleTimeExpired}
                            />
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <Progress value={progressPercentage} className="h-1 mt-3" />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container py-6">
                <div className="grid gap-6 lg:grid-cols-4">
                    {/* Question Navigator (Sidebar) */}
                    <aside className="lg:col-span-1">
                        <Card className="sticky top-24">
                            <CardHeader>
                                <CardTitle className="text-base">التنقل بين الأسئلة</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <QuestionNavigator
                                    questions={quiz.questions}
                                    currentIndex={currentQuestionIndex}
                                    answers={answers}
                                    onNavigate={goToQuestion}
                                />
                            </CardContent>
                        </Card>
                    </aside>

                    {/* Question Display */}
                    <div className="lg:col-span-3 space-y-4">
                        <QuestionDisplay
                            question={currentQuestion}
                            questionNumber={currentQuestionIndex + 1}
                            totalQuestions={quiz.questions.length}
                            answer={answers[currentQuestion.id]}
                            onAnswerChange={handleAnswerChange}
                            isSubmitting={isPending}
                        />

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between">
                            <Button
                                variant="outline"
                                onClick={goPrev}
                                disabled={currentQuestionIndex === 0}
                            >
                                <ChevronRight className="h-4 w-4 ml-1" />
                                السابق
                            </Button>

                            <div className="flex gap-2">
                                {currentQuestionIndex === quiz.questions.length - 1 ? (
                                    <Button
                                        onClick={() => setSubmitDialogOpen(true)}
                                        disabled={isPending}
                                    >
                                        <Send className="h-4 w-4 ml-2" />
                                        تسليم الكويز
                                    </Button>
                                ) : (
                                    <Button onClick={goNext}>
                                        التالي
                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Submit Confirmation Dialog */}
            <AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>تسليم الكويز</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4">
                            <p>هل أنت متأكد من تسليم الكويز؟</p>

                            <div className="bg-muted p-4 rounded-lg space-y-2">
                                <div className="flex justify-between">
                                    <span>الإجابات المكتملة:</span>
                                    <span className="font-medium">
                                        {answeredCount} / {quiz.questions.length}
                                    </span>
                                </div>
                            </div>

                            {answeredCount < quiz.questions.length && (
                                <div className="flex items-start gap-2 text-yellow-600">
                                    <AlertTriangle className="h-4 w-4 mt-0.5" />
                                    <span className="text-sm">
                                        لديك أسئلة غير مُجابة. هل تريد المتابعة؟
                                    </span>
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSubmit} disabled={isPending}>
                            {isPending ? "جارٍ التسليم..." : "تسليم نهائي"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Time Expired Dialog */}
            <AlertDialog open={timeExpiredDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-600">
                            انتهى الوقت! ⏰
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            انتهى وقت الكويز. تم تسليم إجاباتك تلقائياً.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction
                            onClick={() =>
                                router.push(`/quizzes/${quiz.id}/result?attempt=${quiz.attempt.id}`)
                            }
                        >
                            عرض النتيجة
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
