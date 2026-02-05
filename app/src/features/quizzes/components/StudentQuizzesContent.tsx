"use client"

/**
 * Student Quizzes Content
 * 
 * Displays quizzes available to the student with status indicators.
 * 
 * @module features/quizzes/components/StudentQuizzesContent
 */

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import {
    ClipboardList,
    Clock,
    Play,
    CheckCircle2,
    Trophy,
    BookOpen,
    AlertCircle,
} from "lucide-react"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
import { startAttempt, type StudentQuizData } from "@/features/quizzes/actions/attempts"

// ============================================
// TYPES
// ============================================

interface StudentQuizzesContentProps {
    quizzes: StudentQuizData[]
}

// ============================================
// STATUS HELPERS
// ============================================

function getQuizStatus(quiz: StudentQuizData): {
    label: string
    color: string
    icon: typeof ClipboardList
} {
    if (!quiz.attempt) {
        return { label: "جديد", color: "bg-blue-500", icon: Play }
    }

    switch (quiz.attempt.status) {
        case "IN_PROGRESS":
            return { label: "قيد التقديم", color: "bg-yellow-500", icon: Clock }
        case "SUBMITTED":
            return { label: "مُسلَّم", color: "bg-green-500", icon: CheckCircle2 }
        case "GRADED":
            return { label: "مُصحَّح", color: "bg-purple-500", icon: Trophy }
        default:
            return { label: "غير معروف", color: "bg-gray-500", icon: ClipboardList }
    }
}

function getScoreColor(percentage: number): string {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
}

// ============================================
// QUIZ CARD
// ============================================

function QuizCard({
    quiz,
    onStart,
    isPending,
}: {
    quiz: StudentQuizData
    onStart: () => void
    isPending: boolean
}) {
    const router = useRouter()
    const status = getQuizStatus(quiz)
    const StatusIcon = status.icon

    const handleContinue = () => {
        if (quiz.attempt) {
            router.push(`/quizzes/${quiz.id}/take?attempt=${quiz.attempt.id}`)
        }
    }

    const handleViewResult = () => {
        if (quiz.attempt) {
            router.push(`/quizzes/${quiz.id}/result?attempt=${quiz.attempt.id}`)
        }
    }

    return (
        <Card className="relative overflow-hidden">
            {/* Status Badge */}
            <div className="absolute top-4 left-4">
                <Badge className={`${status.color} text-white`}>
                    <StatusIcon className="h-3 w-3 ml-1" />
                    {status.label}
                </Badge>
            </div>

            <CardHeader className="pt-12">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <BookOpen className="h-4 w-4" />
                    {quiz.offering.course.nameAr}
                </div>
                <CardTitle className="text-lg">{quiz.title}</CardTitle>
                {quiz.description && (
                    <CardDescription className="line-clamp-2">
                        {quiz.description}
                    </CardDescription>
                )}
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Quiz Info */}
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-muted-foreground" />
                        <span>{quiz.questionsCount} سؤال</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{quiz.duration} دقيقة</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                        <span>{quiz.totalPoints} نقطة</span>
                    </div>
                </div>

                {/* Score (if submitted) */}
                {quiz.attempt?.submittedAt && quiz.attempt.percentage !== null && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">النتيجة</span>
                            <span className={`font-bold ${getScoreColor(quiz.attempt.percentage)}`}>
                                {quiz.attempt.percentage.toFixed(0)}%
                            </span>
                        </div>
                        <Progress value={quiz.attempt.percentage} className="h-2" />
                        <p className="text-xs text-muted-foreground text-center">
                            {quiz.attempt.score} / {quiz.totalPoints} نقطة
                        </p>
                    </div>
                )}
            </CardContent>

            <CardFooter className="border-t pt-4">
                {!quiz.attempt ? (
                    <Button
                        className="w-full"
                        onClick={onStart}
                        disabled={isPending}
                    >
                        {isPending ? (
                            "جارٍ البدء..."
                        ) : (
                            <>
                                <Play className="h-4 w-4 ml-2" />
                                ابدأ الكويز
                            </>
                        )}
                    </Button>
                ) : quiz.attempt.status === "IN_PROGRESS" ? (
                    <Button className="w-full" variant="secondary" onClick={handleContinue}>
                        <Clock className="h-4 w-4 ml-2" />
                        متابعة
                    </Button>
                ) : (
                    <Button className="w-full" variant="outline" onClick={handleViewResult}>
                        <Trophy className="h-4 w-4 ml-2" />
                        عرض النتيجة
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function StudentQuizzesContent({ quizzes }: StudentQuizzesContentProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [selectedQuiz, setSelectedQuiz] = useState<StudentQuizData | null>(null)
    const [startDialogOpen, setStartDialogOpen] = useState(false)

    const handleStartClick = (quiz: StudentQuizData) => {
        setSelectedQuiz(quiz)
        setStartDialogOpen(true)
    }

    const confirmStart = () => {
        if (!selectedQuiz) return

        startTransition(async () => {
            const result = await startAttempt(selectedQuiz.id)
            if (result.success && result.data) {
                toast.success("تم بدء الكويز! حظاً موفقاً 🍀")
                router.push(`/quizzes/${selectedQuiz.id}/take?attempt=${result.data.attemptId}`)
            } else {
                toast.error(result.error ?? "فشل في بدء الكويز")
            }
            setStartDialogOpen(false)
        })
    }

    if (quizzes.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <ClipboardList className="h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-medium">لا توجد كويزات متاحة</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        سيتم عرض الكويزات المتاحة لك هنا
                    </p>
                </CardContent>
            </Card>
        )
    }

    // Group by status
    const newQuizzes = quizzes.filter((q) => !q.attempt)
    const inProgress = quizzes.filter((q) => q.attempt?.status === "IN_PROGRESS")
    const completed = quizzes.filter(
        (q) => q.attempt?.status === "SUBMITTED" || q.attempt?.status === "GRADED"
    )

    return (
        <>
            <div className="space-y-8">
                {/* In Progress */}
                {inProgress.length > 0 && (
                    <section>
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-yellow-500" />
                            قيد التقديم ({inProgress.length})
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {inProgress.map((quiz) => (
                                <QuizCard
                                    key={quiz.id}
                                    quiz={quiz}
                                    onStart={() => handleStartClick(quiz)}
                                    isPending={isPending}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* New Quizzes */}
                {newQuizzes.length > 0 && (
                    <section>
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Play className="h-5 w-5 text-blue-500" />
                            كويزات جديدة ({newQuizzes.length})
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {newQuizzes.map((quiz) => (
                                <QuizCard
                                    key={quiz.id}
                                    quiz={quiz}
                                    onStart={() => handleStartClick(quiz)}
                                    isPending={isPending}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Completed */}
                {completed.length > 0 && (
                    <section>
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            مكتمل ({completed.length})
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {completed.map((quiz) => (
                                <QuizCard
                                    key={quiz.id}
                                    quiz={quiz}
                                    onStart={() => handleStartClick(quiz)}
                                    isPending={isPending}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* Start Confirmation Dialog */}
            <AlertDialog open={startDialogOpen} onOpenChange={setStartDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>بدء الكويز</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4">
                            <p>أنت على وشك بدء "{selectedQuiz?.title}"</p>

                            <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>عدد الأسئلة:</span>
                                    <span className="font-medium">{selectedQuiz?.questionsCount} سؤال</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>المدة:</span>
                                    <span className="font-medium">{selectedQuiz?.duration} دقيقة</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>إجمالي النقاط:</span>
                                    <span className="font-medium">{selectedQuiz?.totalPoints} نقطة</span>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 text-yellow-600">
                                <AlertCircle className="h-4 w-4 mt-0.5" />
                                <span className="text-sm">
                                    سيبدأ العد التنازلي فوراً عند بدء الكويز. تأكد من جاهزيتك!
                                </span>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmStart} disabled={isPending}>
                            {isPending ? "جارٍ البدء..." : "ابدأ الآن"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
