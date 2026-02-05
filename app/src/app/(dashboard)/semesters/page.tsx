/**
 * Semesters Management Page (Server Component)
 * 
 * Displays semesters with CRUD operations.
 * Only one semester can be active (current) at a time.
 * 
 * @module app/(dashboard)/semesters/page
 */

import { Suspense } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { SemestersPageContent } from "@/features/semesters/components/SemestersPageContent"
import { getSemesters, getSemesterStats } from "@/features/semesters/actions"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

// ============================================
// LOADING COMPONENT
// ============================================

function SemestersLoading() {
    return (
        <Card>
            <CardContent className="py-12">
                <div className="flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="mr-2 text-muted-foreground">جارٍ تحميل الفصول الدراسية...</span>
                </div>
            </CardContent>
        </Card>
    )
}

// ============================================
// PAGE COMPONENT
// ============================================

export default async function SemestersPage() {
    // Check authentication
    const session = await auth()

    if (!session?.user) {
        redirect("/login?callbackUrl=/semesters")
    }

    // Check permission
    const isSystemRole = session.user.isSystemRole ?? false
    const permissions = session.user.permissions ?? []

    const hasViewPermission = isSystemRole ||
        permissions.includes("semester.view") ||
        permissions.includes("semester.manage")

    if (!hasViewPermission) {
        redirect("/unauthorized")
    }

    const canManage = isSystemRole || permissions.includes("semester.manage")

    // Fetch data
    const [semestersResult, statsResult] = await Promise.all([
        getSemesters(),
        getSemesterStats(),
    ])

    const semesters = semestersResult.success ? semestersResult.data ?? [] : []
    const stats = statsResult.success ? statsResult.data : null

    return (
        <DashboardLayout title="الفصول الدراسية" subtitle="إدارة الفصول الدراسية وتفعيلها">
            <Suspense fallback={<SemestersLoading />}>
                <SemestersPageContent
                    initialSemesters={semesters}
                    stats={stats}
                    canManage={canManage}
                />
            </Suspense>
        </DashboardLayout>
    )
}
