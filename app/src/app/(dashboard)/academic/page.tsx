/**
 * Academic Structure Page (Server Component)
 * 
 * Displays colleges, departments, majors, and courses in a hierarchical view.
 * Permission check happens on the server before rendering.
 * 
 * @module app/(dashboard)/academic/page
 */

import { Suspense } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { AcademicPageContent } from "@/features/academic/components/AcademicPageContent"
import { getColleges, getAcademicStats } from "@/features/academic/actions"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

// ============================================
// LOADING COMPONENT
// ============================================

function AcademicLoading() {
    return (
        <Card>
            <CardContent className="py-12">
                <div className="flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="mr-2 text-muted-foreground">جارٍ تحميل البيانات الأكاديمية...</span>
                </div>
            </CardContent>
        </Card>
    )
}

// ============================================
// PAGE COMPONENT
// ============================================

export default async function AcademicPage() {
    // Check authentication and authorization on server
    const session = await auth()

    if (!session?.user) {
        redirect("/login?callbackUrl=/academic")
    }

    // Check permission - system admin bypasses all checks
    const isSystemRole = session.user.isSystemRole ?? false
    const permissions = session.user.permissions ?? []

    // User needs at least one of these permissions to view the page
    const hasViewPermission = isSystemRole ||
        permissions.includes("college.manage") ||
        permissions.includes("department.manage") ||
        permissions.includes("major.manage") ||
        permissions.includes("course.view")

    if (!hasViewPermission) {
        redirect("/unauthorized")
    }

    // Check specific permissions for UI
    const canManageColleges = isSystemRole || permissions.includes("college.manage")
    const canManageDepartments = isSystemRole || permissions.includes("department.manage")
    const canManageMajors = isSystemRole || permissions.includes("major.manage")
    const canViewCourses = isSystemRole || permissions.includes("course.view")
    const canCreateCourses = isSystemRole || permissions.includes("course.create")
    const canEditCourses = isSystemRole || permissions.includes("course.edit")
    const canDeleteCourses = isSystemRole || permissions.includes("course.delete")

    // Fetch data
    const [collegesResult, statsResult] = await Promise.all([
        getColleges(),
        getAcademicStats(),
    ])

    const colleges = collegesResult.success ? collegesResult.data ?? [] : []
    const stats = statsResult.success ? (statsResult.data ?? null) : null

    return (
        <DashboardLayout title="الهيكل الأكاديمي" subtitle="إدارة الكليات والأقسام والتخصصات والمقررات">
            <Suspense fallback={<AcademicLoading />}>
                <AcademicPageContent
                    initialColleges={colleges}
                    stats={stats}
                    permissions={{
                        canManageColleges,
                        canManageDepartments,
                        canManageMajors,
                        canViewCourses,
                        canCreateCourses,
                        canEditCourses,
                        canDeleteCourses,
                    }}
                />
            </Suspense>
        </DashboardLayout>
    )
}
