"use client"

/**
 * Quiz Result Content
 * 
 * Displays quiz result with optional answer review.
 * 
 * @module features/quizzes/components/QuizResultContent
 */

import { useState } from "react"
import Link from "next/link"
import {
    Trophy,
    CheckCircle2,
    XCircle,
    HelpCircle,
    ArrowRight,
    ChevronDown,
    ChevronUp,
    Lightbulb,
} from "lucide-react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import type { QuizResult } from "@/features/quizzes/actions/attempts"

// ============================================
// TYPES
// ============================================

interface QuizResultContentProps {
    result: QuizResult
}

// ============================================
// HELPERS
// ============================================

function getScoreColor(percentage: number): string {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
}

function getScoreBg(percentage: number): string {
    if (percentage >= 80) return "bg-green-50 border-green-200"
    if (percentage >= 60) return "bg-yellow-50 border-yellow-200"
    return "bg-red-50 border-red-200"
}

function getScoreMessage(percentage: number): string {
    if (percentage >= 90) return "ممتاز! 🌟"
    if (percentage >= 80) return "جيد جداً! 👏"
    if (percentage >= 70) return "جيد 👍"
    if (percentage >= 60) return "مقبول ✓"
    return "يحتاج تحسين 📚"
}

// ============================================
// SCORE CARD
// ============================================

function ScoreCard({ result }: { result: QuizResult }) {
    const percentage = result.attempt.percentage

    return (
        <Card className={cn("border-2", getScoreBg(percentage))}>
            <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                    <div className="relative">
                        <Trophy className={cn("h-16 w-16", getScoreColor(percentage))} />
                    </div>

                    <div className="mt-4 space-y-1">
                        <p className="text-sm text-muted-foreground">درجتك</p>
                        <p className={cn("text-5xl font-bold", getScoreColor(percentage))}>
                            {percentage.toFixed(0)}%
                        </p>
                        <p className="text-lg font-medium">
                            {result.attempt.score} / {result.totalPoints} نقطة
                        </p>
                    </div>

                    <Badge
                        variant="secondary"
                        className={cn("mt-4 text-base px-4 py-1", getScoreColor(percentage))}
                    >
                        {getScoreMessage(percentage)}
                    </Badge>

                    <Progress value={percentage} className="h-3 mt-4 w-full max-w-xs" />
                </div>
            </CardContent>
        </Card>
    )
}

// ============================================
// QUESTION REVIEW
// ============================================

function QuestionReview({
    question,
    index,
}: {
    question: QuizResult["questions"][0]
    index: number
}) {
    const [isOpen, setIsOpen] = useState(false)

    const isCorrect = question.isCorrect === true
    const isWrong = question.isCorrect === false
    const isPending = question.isCorrect === null

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <Card className={cn(
                "border-r-4",
                isCorrect && "border-r-green-500",
                isWrong && "border-r-red-500",
                isPending && "border-r-yellow-500"
            )}>
                <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {isCorrect && (
                                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                                )}
                                {isWrong && (
                                    <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                                )}
                                {isPending && (
                                    <HelpCircle className="h-5 w-5 text-yellow-500 shrink-0" />
                                )}
                                <div>
                                    <CardTitle className="text-sm font-medium">
                                        السؤال {index + 1}
                                    </CardTitle>
                                    <CardDescription className="line-clamp-1 text-right">
                                        {question.text}
                                    </CardDescription>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Badge variant="outline">
                                    {question.pointsEarned} / {question.points}
                                </Badge>
                                {isOpen ? (
                                    <ChevronUp className="h-4 w-4" />
                                ) : (
                                    <ChevronDown className="h-4 w-4" />
                                )}
                            </div>
                        </div>
                    </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <CardContent className="space-y-4 pt-0">
                        {/* Question Text */}
                        <p className="text-base">{question.text}</p>

                        <Separator />

                        {/* Options */}
                        {question.options.length > 0 && (
                            <div className="space-y-2">
                                {question.options.map((option) => {
                                    const isSelected = option.id === question.selectedOptionId
                                    const isCorrectOption = option.isCorrect

                                    return (
                                        <div
                                            key={option.id}
                                            className={cn(
                                                "p-3 rounded-lg border",
                                                isCorrectOption && "bg-green-50 border-green-300",
                                                isSelected && !isCorrectOption && "bg-red-50 border-red-300",
                                                !isSelected && !isCorrectOption && "bg-muted/30"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                {isCorrectOption && (
                                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                )}
                                                {isSelected && !isCorrectOption && (
                                                    <XCircle className="h-4 w-4 text-red-600" />
                                                )}
                                                <span
                                                    className={cn(
                                                        "flex-1",
                                                        isSelected && "font-medium"
                                                    )}
                                                >
                                                    {option.text}
                                                </span>
                                                {isSelected && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        إجابتك
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Text Answer */}
                        {question.type === "SHORT_ANSWER" && question.textAnswer && (
                            <div className="bg-muted p-4 rounded-lg">
                                <p className="text-sm text-muted-foreground mb-1">إجابتك:</p>
                                <p>{question.textAnswer}</p>
                            </div>
                        )}

                        {/* Explanation */}
                        {question.explanation && (
                            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg flex gap-3">
                                <Lightbulb className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-blue-700 dark:text-blue-400 mb-1">
                                        الشرح
                                    </p>
                                    <p className="text-sm text-blue-600 dark:text-blue-300">
                                        {question.explanation}
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function QuizResultContent({ result }: QuizResultContentProps) {
    const correctCount = result.questions.filter((q) => q.isCorrect === true).length
    const wrongCount = result.questions.filter((q) => q.isCorrect === false).length
    const pendingCount = result.questions.filter((q) => q.isCorrect === null).length

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <Button variant="ghost" size="sm" asChild>
                <Link href="/quizzes/my">
                    <ArrowRight className="h-4 w-4 ml-1" />
                    العودة لكويزاتي
                </Link>
            </Button>

            {/* Score Card */}
            <ScoreCard result={result} />

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                            <div>
                                <p className="text-2xl font-bold">{correctCount}</p>
                                <p className="text-sm text-muted-foreground">إجابة صحيحة</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <XCircle className="h-8 w-8 text-red-500" />
                            <div>
                                <p className="text-2xl font-bold">{wrongCount}</p>
                                <p className="text-sm text-muted-foreground">إجابة خاطئة</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <HelpCircle className="h-8 w-8 text-yellow-500" />
                            <div>
                                <p className="text-2xl font-bold">{pendingCount}</p>
                                <p className="text-sm text-muted-foreground">بانتظار التصحيح</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Questions Review */}
            {result.questions.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">مراجعة الأسئلة</h2>
                    <div className="space-y-3">
                        {result.questions.map((question, index) => (
                            <QuestionReview
                                key={question.id}
                                question={question}
                                index={index}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
