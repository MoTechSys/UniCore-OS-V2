import { Suspense } from "react"
import { Loader2, GraduationCap } from "lucide-react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { TranscriptView } from "@/features/reports/components"

function TranscriptLoading() {
    return (
        <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="mr-2 text-muted-foreground">جارٍ تحميل الدرجات...</span>
        </div>
    )
}

export default function GradesPage() {
    return (
        <DashboardLayout
            title="كشف الدرجات"
            subtitle="درجاتك في جميع المواد"
        >
            <Suspense fallback={<TranscriptLoading />}>
                <TranscriptView />
            </Suspense>
        </DashboardLayout>
    )
}
