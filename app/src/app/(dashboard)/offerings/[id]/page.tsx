/**
 * Offering Details Page (Server Component)
 * 
 * Displays offering details with enrolled students tab.
 * 
 * @module app/(dashboard)/offerings/[id]/page
 */

import { Suspense } from "react"
import { redirect, notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { OfferingDetailsContent } from "@/features/enrollments/components/OfferingDetailsContent"
import { getOfferingById } from "@/features/offerings/actions"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

// ============================================
// LOADING COMPONENT
// ============================================

function DetailsLoading() {
    return (
        <Card>
            <CardContent className="py-12">
                <div className="flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="mr-2 text-muted-foreground">جارٍ تحميل تفاصيل الشعبة...</span>
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
    searchParams: Promise<{ tab?: string }>
}

export default async function OfferingDetailsPage({ params, searchParams }: PageProps) {
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

    const canManageOffering = isSystemRole || permissions.includes("offering.manage")
    const canManageEnrollment = isSystemRole || permissions.includes("enrollment.manage")
    const canUploadResource = isSystemRole || permissions.includes("file.upload") || permissions.includes("offering.manage")
    const canDeleteResource = isSystemRole || permissions.includes("file.delete") || permissions.includes("offering.manage")

    // Get offering ID
    const { id } = await params
    const { tab } = await searchParams

    // Fetch offering details
    const result = await getOfferingById(id)

    if (!result.success || !result.data) {
        notFound()
    }

    const offering = result.data

    return (
        <DashboardLayout
            title={`${offering.course.nameAr} - ${offering.section}`}
            subtitle={`${offering.course.code} | ${offering.semester.nameAr}`}
        >
            <Suspense fallback={<DetailsLoading />}>
                <OfferingDetailsContent
                    offering={offering}
                    defaultTab={tab ?? "info"}
                    canManageOffering={canManageOffering}
                    canManageEnrollment={canManageEnrollment}
                    canUploadResource={canUploadResource}
                    canDeleteResource={canDeleteResource}
                />
            </Suspense>
        </DashboardLayout>
    )
}
