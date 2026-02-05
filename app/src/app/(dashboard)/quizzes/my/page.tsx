/**
 * My Quizzes Page (Student View)
 * 
 * Shows quizzes available for the logged-in student.
 * 
 * @module app/(dashboard)/quizzes/my/page
 */

import { Suspense } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { StudentQuizzesContent } from "@/features/quizzes/components/StudentQuizzesContent"
import { getStudentQuizzes } from "@/features/quizzes/actions/attempts"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

// ============================================
// LOADING COMPONENT
// ============================================

function QuizzesLoading() {
    return (
        <Card>
            <CardContent className="py-12">
                <div className="flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="mr-2 text-muted-foreground">جارٍ تحميل الكويزات...</span>
                </div>
            </CardContent>
        </Card>
    )
}

// ============================================
// PAGE COMPONENT
// ============================================

export default async function MyQuizzesPage() {
    // Check authentication
    const session = await auth()

    if (!session?.user) {
        redirect("/login?callbackUrl=/quizzes/my")
    }

    // Fetch quizzes available for this student
    const result = await getStudentQuizzes()
    const quizzes = result.success ? result.data ?? [] : []

    return (
        <DashboardLayout title="كويزاتي" subtitle="الاختبارات المتاحة لك">
            <Suspense fallback={<QuizzesLoading />}>
                <StudentQuizzesContent quizzes={quizzes} />
            </Suspense>
        </DashboardLayout>
    )
}
