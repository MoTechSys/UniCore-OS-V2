/**
 * Quiz Result Page (Server Component)
 * 
 * Shows quiz result and optionally allows review.
 * 
 * @module app/(dashboard)/quizzes/[id]/result/page
 */

import { Suspense } from "react"
import { redirect, notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { QuizResultContent } from "@/features/quizzes/components/QuizResultContent"
import { getQuizResult } from "@/features/quizzes/actions/attempts"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

// ============================================
// LOADING COMPONENT
// ============================================

function ResultLoading() {
    return (
        <Card>
            <CardContent className="py-12">
                <div className="flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="mr-2 text-muted-foreground">جارٍ تحميل النتيجة...</span>
                </div>
            </CardContent>
        </Card>
    )
}

// ============================================
// PAGE COMPONENT
// ============================================

interface PageProps {
    params: Promise<{ id: string }>
    searchParams: Promise<{ attempt?: string }>
}

export default async function QuizResultPage({ params, searchParams }: PageProps) {
    // Check authentication
    const session = await auth()

    if (!session?.user) {
        redirect("/login?callbackUrl=/quizzes/my")
    }

    const { id } = await params
    const { attempt: attemptId } = await searchParams

    if (!attemptId) {
        redirect(`/quizzes/my`)
    }

    // Fetch result
    const result = await getQuizResult(attemptId)

    if (!result.success || !result.data) {
        // Handle case where results are not available
        notFound()
    }

    return (
        <DashboardLayout title="نتيجة الكويز" subtitle={result.data.title}>
            <Suspense fallback={<ResultLoading />}>
                <QuizResultContent result={result.data} />
            </Suspense>
        </DashboardLayout>
    )
}
