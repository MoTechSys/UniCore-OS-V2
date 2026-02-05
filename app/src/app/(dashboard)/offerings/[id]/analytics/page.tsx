import { Suspense } from "react"
import { Loader2, BarChart3 } from "lucide-react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Gradebook, GradeDistribution } from "@/features/reports/components"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"

function AnalyticsLoading() {
    return (
        <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="mr-2 text-muted-foreground">جارٍ تحميل التحليلات...</span>
        </div>
    )
}

interface AnalyticsPageProps {
    params: { id: string }
}

export default async function OfferingAnalyticsPage({ params }: AnalyticsPageProps) {
    // Fetch offering info for title
    const offering = await db.courseOffering.findUnique({
        where: { id: params.id, deletedAt: null },
        include: {
            course: { select: { nameAr: true } },
        },
    })

    if (!offering) {
        notFound()
    }

    return (
        <DashboardLayout
            title={`تحليلات: ${offering.course.nameAr}`}
            subtitle={`الشعبة: ${offering.code}`}
        >
            <Tabs defaultValue="gradebook" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="gradebook">سجل الدرجات</TabsTrigger>
                    <TabsTrigger value="stats">الإحصائيات</TabsTrigger>
                </TabsList>

                <TabsContent value="gradebook">
                    <Suspense fallback={<AnalyticsLoading />}>
                        <Gradebook offeringId={params.id} />
                    </Suspense>
                </TabsContent>

                <TabsContent value="stats">
                    <Suspense fallback={<AnalyticsLoading />}>
                        <GradeDistribution offeringId={params.id} />
                    </Suspense>
                </TabsContent>
            </Tabs>
        </DashboardLayout>
    )
}
