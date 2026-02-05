/**
 * Quiz Taking Page (Server Component)
 * 
 * Interface for students to take a quiz.
 * 
 * @module app/(dashboard)/quizzes/[id]/take/page
 */

import { Suspense } from "react"
import { redirect, notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { QuizTakingContent } from "@/features/quizzes/components/QuizTakingContent"
import { getQuizForTaking } from "@/features/quizzes/actions/attempts"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

// ============================================
// LOADING COMPONENT
// ============================================

function TakingLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <Card className="w-full max-w-md">
                <CardContent className="py-12">
                    <div className="flex flex-col items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="mt-4 text-muted-foreground">جارٍ تحميل الكويز...</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// ============================================
// PAGE COMPONENT
// ============================================

interface PageProps {
    params: Promise<{ id: string }>
    searchParams: Promise<{ attempt?: string }>
}

export default async function QuizTakingPage({ params, searchParams }: PageProps) {
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

    // Fetch quiz data (sanitized - no correct answers)
    const result = await getQuizForTaking(attemptId)

    if (!result.success || !result.data) {
        // If time expired or other error
        if (result.error?.includes("انتهى") || result.error?.includes("منتهية")) {
            redirect(`/quizzes/${id}/result?attempt=${attemptId}`)
        }
        notFound()
    }

    return (
        <Suspense fallback={<TakingLoading />}>
            <QuizTakingContent quiz={result.data} />
        </Suspense>
    )
}
