"use client"

/**
 * Gradebook Component
 * 
 * Displays student × quiz matrix with scores for instructors
 * 
 * @module features/reports/components/Gradebook
 */

import { useEffect, useState } from "react"
import { Loader2, AlertCircle, Users, Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { getOfferingGradebook, exportGradebookCSV, GradebookData } from "../actions"

// ============================================
// HELPER FUNCTIONS
// ============================================

function getGradeColor(percentage: number): string {
    if (percentage >= 90) return "bg-green-100 text-green-800"
    if (percentage >= 80) return "bg-blue-100 text-blue-800"
    if (percentage >= 70) return "bg-yellow-100 text-yellow-800"
    if (percentage >= 60) return "bg-orange-100 text-orange-800"
    return "bg-red-100 text-red-800"
}

// ============================================
// COMPONENT
// ============================================

interface GradebookProps {
    offeringId: string
}

export function Gradebook({ offeringId }: GradebookProps) {
    const [data, setData] = useState<GradebookData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isExporting, setIsExporting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchGradebook() {
            const result = await getOfferingGradebook(offeringId)
            if (result.success && result.data) {
                setData(result.data)
            } else {
                setError(result.error ?? "حدث خطأ")
            }
            setIsLoading(false)
        }
        fetchGradebook()
    }, [offeringId])

    const handleExport = async () => {
        setIsExporting(true)
        const result = await exportGradebookCSV(offeringId)
        if (result.success && result.data) {
            // Create download
            const blob = new Blob([result.data.csv], { type: "text/csv;charset=utf-8" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = result.data.filename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        }
        setIsExporting(false)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="mr-2 text-muted-foreground">جارٍ تحميل سجل الدرجات...</span>
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

    if (!data || data.students.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">لا يوجد طلاب</h3>
                    <p className="text-muted-foreground">
                        لم يتم تسجيل أي طالب في هذه الشعبة
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    سجل الدرجات
                    <Badge variant="secondary">{data.students.length} طالب</Badge>
                </CardTitle>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    disabled={isExporting}
                >
                    {isExporting ? (
                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    ) : (
                        <Download className="h-4 w-4 ml-2" />
                    )}
                    تصدير CSV
                </Button>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="sticky right-0 bg-background">الطالب</TableHead>
                                {data.quizzes.map(quiz => (
                                    <TableHead key={quiz.id} className="text-center min-w-[100px]">
                                        <div className="flex flex-col">
                                            <span className="truncate max-w-[100px]">{quiz.title}</span>
                                            <span className="text-xs text-muted-foreground">
                                                ({quiz.maxScore})
                                            </span>
                                        </div>
                                    </TableHead>
                                ))}
                                <TableHead className="text-center">المجموع</TableHead>
                                <TableHead className="text-center">النسبة</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.students.map(student => (
                                <TableRow key={student.id}>
                                    <TableCell className="sticky right-0 bg-background font-medium">
                                        {student.name}
                                    </TableCell>
                                    {data.quizzes.map(quiz => (
                                        <TableCell key={quiz.id} className="text-center">
                                            {student.quizScores[quiz.id] !== null ? (
                                                <span className="font-medium">
                                                    {student.quizScores[quiz.id]}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                    ))}
                                    <TableCell className="text-center font-bold">
                                        {student.totalScore}/{student.maxPossible}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge className={getGradeColor(student.percentage)}>
                                            {student.percentage.toFixed(1)}%
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
