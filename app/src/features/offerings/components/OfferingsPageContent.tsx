"use client"

/**
 * Offerings Page Content (Client Component)
 * 
 * Main content for course offerings management.
 * 
 * @module features/offerings/components/OfferingsPageContent
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    BookOpen,
    Users,
    DoorOpen,
    Ban,
    Plus,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { StatCard } from "@/components/ui/stat-card"
import { OfferingsTable } from "./OfferingsTable"
import { CreateOfferingModal } from "./CreateOfferingModal"
import type { OfferingData, OfferingStats } from "@/features/offerings/actions"
import type { SemesterData } from "@/features/semesters/actions"

// ============================================
// TYPES
// ============================================

interface OfferingsPageContentProps {
    initialOfferings: OfferingData[]
    stats: OfferingStats | null
    semesters: SemesterData[]
    selectedSemesterId: string | undefined
    courses: { id: string; code: string; nameAr: string; department: string }[]
    instructors: { id: string; name: string; email: string }[]
    canManage: boolean
}

// ============================================
// COMPONENT
// ============================================

export function OfferingsPageContent({
    initialOfferings,
    stats,
    semesters,
    selectedSemesterId,
    courses,
    instructors,
    canManage,
}: OfferingsPageContentProps) {
    const router = useRouter()
    const [offerings] = useState(initialOfferings)
    const [isCreateOpen, setIsCreateOpen] = useState(false)

    const handleSemesterChange = (value: string) => {
        if (value === "all") {
            router.push("/offerings")
        } else {
            router.push(`/offerings?semester=${value}`)
        }
    }

    const handleSuccess = () => {
        router.refresh()
    }

    const currentSemester = semesters.find((s) => s.id === selectedSemesterId)

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            {stats && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="إجمالي الشُعب"
                        value={stats.totalOfferings}
                        icon={BookOpen}
                        variant="primary"
                    />
                    <StatCard
                        title="الطلاب المسجلين"
                        value={stats.totalEnrollments}
                        icon={Users}
                        variant="info"
                    />
                    <StatCard
                        title="شُعب مفتوحة"
                        value={stats.openOfferings}
                        icon={DoorOpen}
                        variant="success"
                    />
                    <StatCard
                        title="شُعب مكتملة"
                        value={stats.fullOfferings}
                        icon={Ban}
                        variant="warning"
                    />
                </div>
            )}

            {/* Filter and Actions */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <CardTitle className="text-lg">الشُعب الدراسية</CardTitle>
                        <Select
                            value={selectedSemesterId ?? "all"}
                            onValueChange={handleSemesterChange}
                        >
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="اختر الفصل" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">جميع الفصول</SelectItem>
                                {semesters.map((semester) => (
                                    <SelectItem key={semester.id} value={semester.id}>
                                        {semester.nameAr}
                                        {semester.isCurrent && " (حالي)"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {canManage && (
                        <Button onClick={() => setIsCreateOpen(true)} size="sm">
                            <Plus className="ml-2 h-4 w-4" />
                            إضافة شعبة
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {offerings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                            <h3 className="mt-4 text-lg font-medium">
                                {currentSemester
                                    ? `لا توجد شعب في ${currentSemester.nameAr}`
                                    : "لا توجد شعب دراسية"}
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                ابدأ بإضافة شعبة جديدة
                            </p>
                            {canManage && (
                                <Button onClick={() => setIsCreateOpen(true)} className="mt-4">
                                    <Plus className="ml-2 h-4 w-4" />
                                    إضافة شعبة
                                </Button>
                            )}
                        </div>
                    ) : (
                        <OfferingsTable
                            offerings={offerings}
                            canManage={canManage}
                            onSuccess={handleSuccess}
                        />
                    )}
                </CardContent>
            </Card>

            {/* Create Modal */}
            <CreateOfferingModal
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                semesters={semesters}
                courses={courses}
                instructors={instructors}
                defaultSemesterId={selectedSemesterId}
                onSuccess={handleSuccess}
            />
        </div>
    )
}
