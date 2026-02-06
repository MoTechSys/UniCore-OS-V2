/**
 * Quizzes Management Page (Server Component)
 * 
 * Displays quizzes with offering filter.
 * 
 * @module app/(dashboard)/quizzes/page
 */

import { Suspense } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { QuizzesPageContent } from "@/features/quizzes/components/QuizzesPageContent"
import { getQuizzes, getQuizStats, getOfferingsForQuiz } from "@/features/quizzes/actions"
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

interface PageProps {
    searchParams: Promise<{ offering?: string }>
}

export default async function QuizzesPage({ searchParams }: PageProps) {
    // Check authentication
    const session = await auth()

    if (!session?.user) {
        redirect("/login?callbackUrl=/quizzes")
    }

    // Check permission
    const isSystemRole = session.user.isSystemRole ?? false
    const permissions = session.user.permissions ?? []

    const hasViewPermission = isSystemRole ||
        permissions.includes("quiz.view") ||
        permissions.includes("quiz.manage") ||
        permissions.includes("quiz.create")

    if (!hasViewPermission) {
        redirect("/unauthorized")
    }

    const canCreate = isSystemRole || permissions.includes("quiz.create")
    const canManage = isSystemRole || permissions.includes("quiz.manage")
    const canEdit = isSystemRole || permissions.includes("quiz.edit")
    const canDelete = isSystemRole || permissions.includes("quiz.delete")

    // Get offering filter from search params
    const params = await searchParams
    const offeringId = params.offering

    // Fetch data
    const [quizzesResult, statsResult, offeringsResult] = await Promise.all([
        getQuizzes(offeringId),
        getQuizStats(offeringId),
        getOfferingsForQuiz(),
    ])

    const quizzes = quizzesResult.success ? quizzesResult.data ?? [] : []
    const stats = statsResult.success ? (statsResult.data ?? null) : null
    const offerings = offeringsResult.success ? offeringsResult.data ?? [] : []

    return (
        <DashboardLayout title="إدارة الكويزات" subtitle="إنشاء وإدارة الاختبارات">
            <Suspense fallback={<QuizzesLoading />}>
                <QuizzesPageContent
                    initialQuizzes={quizzes}
                    stats={stats}
                    offerings={offerings}
                    selectedOfferingId={offeringId}
                    permissions={{ canCreate, canManage, canEdit, canDelete }}
                />
            </Suspense>
        </DashboardLayout>
    )
}
