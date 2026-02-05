"use client"

/**
 * TranscriptView Component
 * 
 * Displays student's grades grouped by semester → offering → quizzes
 * 
 * @module features/reports/components/TranscriptView
 */

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import {
    ChevronDown,
    ChevronUp,
    GraduationCap,
    BookOpen,
    FileQuestion,
    Loader2,
    AlertCircle,
    CheckCircle,
    Clock,
    XCircle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { getStudentTranscript, TranscriptSemester, TranscriptQuiz } from "../actions"

// ============================================
// HELPER FUNCTIONS
// ============================================

function getGradeColor(percentage: number | null): string {
    if (percentage === null) return "text-muted-foreground"
    if (percentage >= 90) return "text-green-600"
    if (percentage >= 80) return "text-blue-600"
    if (percentage >= 70) return "text-yellow-600"
    if (percentage >= 60) return "text-orange-600"
    return "text-red-600"
}

function getStatusIcon(status: TranscriptQuiz["status"]) {
    switch (status) {
        case "GRADED":
            return <CheckCircle className="h-4 w-4 text-green-500" />
        case "SUBMITTED":
            return <Clock className="h-4 w-4 text-blue-500" />
        case "IN_PROGRESS":
            return <Clock className="h-4 w-4 text-yellow-500" />
        case "NOT_ATTEMPTED":
        default:
            return <XCircle className="h-4 w-4 text-muted-foreground" />
    }
}

function getStatusLabel(status: TranscriptQuiz["status"]): string {
    switch (status) {
        case "GRADED": return "مصحح"
        case "SUBMITTED": return "مُرسل"
        case "IN_PROGRESS": return "قيد التقديم"
        case "NOT_ATTEMPTED": return "لم يُقدم"
        default: return "غير معروف"
    }
}

// ============================================
// COMPONENT
// ============================================

export function TranscriptView() {
    const [semesters, setSemesters] = useState<TranscriptSemester[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [openSemesters, setOpenSemesters] = useState<Set<string>>(new Set())

    useEffect(() => {
        async function fetchTranscript() {
            const result = await getStudentTranscript()
            if (result.success && result.data) {
                setSemesters(result.data)
                // Auto-open current semester
                const current = result.data.find(s => s.isCurrent)
                if (current) {
                    setOpenSemesters(new Set([current.id]))
                }
            } else {
                setError(result.error ?? "حدث خطأ")
            }
            setIsLoading(false)
        }
        fetchTranscript()
    }, [])

    const toggleSemester = (id: string) => {
        setOpenSemesters(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="mr-2 text-muted-foreground">جارٍ تحميل كشف الدرجات...</span>
            </div>
        )
    }

    if (error) {
        return (
            <Card className="border-destructive/50">
                <CardContent className="py-8 text-center">
                    <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                    <p className="text-destructive">{error}</p>
                </CardContent>
            </Card>
        )
    }

    if (semesters.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">لا توجد درجات</h3>
                    <p className="text-muted-foreground">
                        لم يتم تسجيلك في أي مقرر بعد
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {semesters.map(semester => (
                <Collapsible
                    key={semester.id}
                    open={openSemesters.has(semester.id)}
                    onOpenChange={() => toggleSemester(semester.id)}
                >
                    <Card>
                        <CollapsibleTrigger asChild>
                            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <GraduationCap className="h-5 w-5 text-primary" />
                                        <CardTitle className="text-lg">
                                            {semester.name}
                                        </CardTitle>
                                        {semester.isCurrent && (
                                            <Badge variant="secondary">الفصل الحالي</Badge>
                                        )}
                                    </div>
                                    <Button variant="ghost" size="icon">
                                        {openSemesters.has(semester.id) ? (
                                            <ChevronUp className="h-4 w-4" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </CardHeader>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                            <CardContent className="space-y-4">
                                {semester.offerings.map(offering => (
                                    <div
                                        key={offering.id}
                                        className="border rounded-lg p-4 space-y-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">
                                                    {offering.courseName}
                                                </span>
                                                <Badge variant="outline" className="text-xs">
                                                    {offering.code}
                                                </Badge>
                                            </div>
                                            <div className="text-sm">
                                                <span className={getGradeColor(offering.percentage)}>
                                                    {offering.percentage.toFixed(1)}%
                                                </span>
                                                <span className="text-muted-foreground mr-2">
                                                    ({offering.totalScore}/{offering.maxScore})
                                                </span>
                                            </div>
                                        </div>

                                        <Progress value={offering.percentage} className="h-2" />

                                        {/* Quiz list */}
                                        <div className="space-y-2">
                                            {offering.quizzes.length === 0 ? (
                                                <p className="text-sm text-muted-foreground text-center py-2">
                                                    لا توجد كويزات
                                                </p>
                                            ) : (
                                                offering.quizzes.map(quiz => (
                                                    <div
                                                        key={quiz.id}
                                                        className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {getStatusIcon(quiz.status)}
                                                            <FileQuestion className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-sm">{quiz.title}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs text-muted-foreground">
                                                                {getStatusLabel(quiz.status)}
                                                            </span>
                                                            {quiz.score !== null ? (
                                                                <span className={`text-sm font-medium ${getGradeColor(quiz.percentage)}`}>
                                                                    {quiz.score}/{quiz.maxScore}
                                                                </span>
                                                            ) : (
                                                                <span className="text-sm text-muted-foreground">
                                                                    -/{quiz.maxScore}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </CollapsibleContent>
                    </Card>
                </Collapsible>
            ))}
        </div>
    )
}
