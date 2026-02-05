import { Suspense } from "react"
import { Loader2, Settings } from "lucide-react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { SettingsForm } from "@/features/settings/components"

function SettingsLoading() {
    return (
        <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="mr-2 text-muted-foreground">جارٍ تحميل الإعدادات...</span>
        </div>
    )
}

export default function SettingsPage() {
    return (
        <DashboardLayout
            title="الإعدادات"
            subtitle="إدارة حسابك وتفضيلاتك"
        >
            <Suspense fallback={<SettingsLoading />}>
                <SettingsForm />
            </Suspense>
        </DashboardLayout>
    )
}
