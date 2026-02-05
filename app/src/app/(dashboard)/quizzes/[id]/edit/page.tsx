/**
 * Quiz Editor Page (Server Component)
 * 
 * Full quiz editor with settings and question builder.
 * 
 * @module app/(dashboard)/quizzes/[id]/edit/page
 */

import { Suspense } from "react"
import { redirect, notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { QuizEditorContent } from "@/features/quizzes/components/QuizEditorContent"
import { getQuizById } from "@/features/quizzes/actions"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

// ============================================
// LOADING COMPONENT
// ============================================

function EditorLoading() {
    return (
        <Card>
            <CardContent className="py-12">
                <div className="flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="mr-2 text-muted-foreground">جارٍ تحميل محرر الكويز...</span>
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
}

export default async function QuizEditorPage({ params }: PageProps) {
    // Check authentication
    const session = await auth()

    if (!session?.user) {
        redirect("/login?callbackUrl=/quizzes")
    }

    // Check permission
    const isSystemRole = session.user.isSystemRole ?? false
    const permissions = session.user.permissions ?? []

    const hasEditPermission = isSystemRole ||
        permissions.includes("quiz.edit") ||
        permissions.includes("quiz.manage")

    if (!hasEditPermission) {
        redirect("/unauthorized")
    }

    const canManage = isSystemRole || permissions.includes("quiz.manage")

    // Get quiz ID
    const { id } = await params

    // Fetch quiz with questions
    const result = await getQuizById(id)

    if (!result.success || !result.data) {
        notFound()
    }

    const quiz = result.data
    const isReadOnly = quiz.status !== "DRAFT"

    return (
        <DashboardLayout
            title={isReadOnly ? `عرض: ${quiz.title}` : `تعديل: ${quiz.title}`}
            subtitle={`${quiz.offering.course.nameAr} - ${quiz.offering.code}`}
        >
            <Suspense fallback={<EditorLoading />}>
                <QuizEditorContent
                    quiz={quiz}
                    isReadOnly={isReadOnly}
                    canManage={canManage}
                />
            </Suspense>
        </DashboardLayout>
    )
}
