/**
 * Notifications Page
 * 
 * Full archive of all notifications with read/unread filtering.
 * 
 * @module app/(dashboard)/notifications
 */

import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { NotificationsContent } from "@/features/notifications/components/NotificationsContent"

// ============================================
// LOADING COMPONENT
// ============================================

function NotificationsLoading() {
    return (
        <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    )
}

// ============================================
// PAGE
// ============================================

export default function NotificationsPage() {
    return (
        <DashboardLayout title="الإشعارات" subtitle="جميع إشعاراتك">
            <Suspense fallback={<NotificationsLoading />}>
                <NotificationsContent />
            </Suspense>
        </DashboardLayout>
    )
}
