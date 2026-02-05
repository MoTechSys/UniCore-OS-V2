"use client"

/**
 * Semesters Page Content (Client Component)
 * 
 * Main content for semesters management.
 * 
 * @module features/semesters/components/SemestersPageContent
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    Calendar,
    CalendarCheck,
    CalendarClock,
    Archive,
    Plus,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/ui/stat-card"
import { SemesterCard } from "./SemesterCard"
import { CreateSemesterModal } from "./CreateSemesterModal"
import type { SemesterData, SemesterStats } from "@/features/semesters/actions"

// ============================================
// TYPES
// ============================================

interface SemestersPageContentProps {
    initialSemesters: SemesterData[]
    stats: SemesterStats | null
    canManage: boolean
}

// ============================================
// COMPONENT
// ============================================

export function SemestersPageContent({
    initialSemesters,
    stats,
    canManage,
}: SemestersPageContentProps) {
    const router = useRouter()
    const [semesters] = useState(initialSemesters)
    const [isCreateOpen, setIsCreateOpen] = useState(false)

    const handleSuccess = () => {
        router.refresh()
    }

    // Separate current semester from others
    const currentSemester = semesters.find((s) => s.isCurrent)
    const otherSemesters = semesters.filter((s) => !s.isCurrent)

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            {stats && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="إجمالي الفصول"
                        value={stats.total}
                        icon={Calendar}
                        variant="primary"
                    />
                    <StatCard
                        title="الفصل النشط"
                        value={stats.active}
                        icon={CalendarCheck}
                        variant="success"
                    />
                    <StatCard
                        title="فصول قادمة"
                        value={stats.upcoming}
                        icon={CalendarClock}
                        variant="warning"
                    />
                    <StatCard
                        title="فصول مؤرشفة"
                        value={stats.archived}
                        icon={Archive}
                        variant="info"
                    />
                </div>
            )}

            {/* Current Semester Highlight */}
            {currentSemester && (
                <Card className="border-primary bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <CalendarCheck className="h-5 w-5 text-primary" />
                            الفصل الدراسي الحالي
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SemesterCard
                            semester={currentSemester}
                            canManage={canManage}
                            onSuccess={handleSuccess}
                            isHighlighted
                        />
                    </CardContent>
                </Card>
            )}

            {/* All Semesters */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">جميع الفصول الدراسية</CardTitle>
                    {canManage && (
                        <Button onClick={() => setIsCreateOpen(true)} size="sm">
                            <Plus className="ml-2 h-4 w-4" />
                            إضافة فصل جديد
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {semesters.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Calendar className="h-12 w-12 text-muted-foreground/50" />
                            <h3 className="mt-4 text-lg font-medium">لا توجد فصول دراسية</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                ابدأ بإضافة فصل دراسي جديد
                            </p>
                            {canManage && (
                                <Button onClick={() => setIsCreateOpen(true)} className="mt-4">
                                    <Plus className="ml-2 h-4 w-4" />
                                    إضافة فصل دراسي
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {otherSemesters.map((semester) => (
                                <SemesterCard
                                    key={semester.id}
                                    semester={semester}
                                    canManage={canManage}
                                    onSuccess={handleSuccess}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Modal */}
            <CreateSemesterModal
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onSuccess={handleSuccess}
            />
        </div>
    )
}
