/**
 * Course Offerings Page (Server Component)
 * 
 * Displays course offerings (sections) with semester filter.
 * 
 * @module app/(dashboard)/offerings/page
 */

import { Suspense } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { OfferingsPageContent } from "@/features/offerings/components/OfferingsPageContent"
import { getOfferings, getOfferingsStats, getCoursesForOffering, getInstructorsForOffering } from "@/features/offerings/actions"
import { getSemesters, getCurrentSemester } from "@/features/semesters/actions"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

// ============================================
// LOADING COMPONENT
// ============================================

function OfferingsLoading() {
    return (
        <Card>
            <CardContent className="py-12">
                <div className="flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="mr-2 text-muted-foreground">جارٍ تحميل الشُعب الدراسية...</span>
                </div>
            </CardContent>
        </Card>
    )
}

// ============================================
// PAGE COMPONENT
// ============================================

interface PageProps {
    searchParams: Promise<{ semester?: string }>
}

export default async function OfferingsPage({ searchParams }: PageProps) {
    // Check authentication
    const session = await auth()

    if (!session?.user) {
        redirect("/login?callbackUrl=/offerings")
    }

    // Check permission
    const isSystemRole = session.user.isSystemRole ?? false
    const permissions = session.user.permissions ?? []

    const hasViewPermission = isSystemRole ||
        permissions.includes("offering.view") ||
        permissions.includes("offering.manage")

    if (!hasViewPermission) {
        redirect("/unauthorized")
    }

    const canManage = isSystemRole || permissions.includes("offering.manage")

    // Get semester filter from search params
    const params = await searchParams
    let semesterId = params.semester

    // If no semester specified, try to get current semester
    if (!semesterId) {
        const currentResult = await getCurrentSemester()
        if (currentResult.success && currentResult.data) {
            semesterId = currentResult.data.id
        }
    }

    // Fetch data
    const [offeringsResult, statsResult, semestersResult, coursesResult, instructorsResult] = await Promise.all([
        getOfferings(semesterId),
        getOfferingsStats(semesterId),
        getSemesters(),
        getCoursesForOffering(),
        getInstructorsForOffering(),
    ])

    const offerings = offeringsResult.success ? offeringsResult.data ?? [] : []
    const stats = statsResult.success ? (statsResult.data ?? null) : null
    const semesters = semestersResult.success ? semestersResult.data ?? [] : []
    const courses = coursesResult.success ? coursesResult.data ?? [] : []
    const instructors = instructorsResult.success ? instructorsResult.data ?? [] : []

    return (
        <DashboardLayout title="الشُعب الدراسية" subtitle="إدارة الشُعب وتسجيل الطلاب">
            <Suspense fallback={<OfferingsLoading />}>
                <OfferingsPageContent
                    initialOfferings={offerings}
                    stats={stats}
                    semesters={semesters}
                    selectedSemesterId={semesterId}
                    courses={courses}
                    instructors={instructors}
                    canManage={canManage}
                />
            </Suspense>
        </DashboardLayout>
    )
}
