"use client"

/**
 * Quizzes Page Content (Client Component)
 * 
 * Main content with stats, filter, and quizzes table.
 * 
 * @module features/quizzes/components/QuizzesPageContent
 */

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
    ClipboardList,
    FileEdit,
    CheckCircle2,
    XCircle,
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
import { QuizzesTable } from "./QuizzesTable"
import { CreateQuizModal } from "./CreateQuizModal"
import type { QuizData, QuizStats } from "@/features/quizzes/actions"

// ============================================
// TYPES
// ============================================

interface QuizzesPageContentProps {
    initialQuizzes: QuizData[]
    stats: QuizStats | null
    offerings: { id: string; code: string; courseName: string; semester: string }[]
    selectedOfferingId?: string
    permissions: {
        canCreate: boolean
        canManage: boolean
        canEdit: boolean
        canDelete: boolean
    }
}

// ============================================
// STAT CARDS
// ============================================

function StatCards({ stats }: { stats: QuizStats | null }) {
    if (!stats) return null

    const cards = [
        {
            title: "إجمالي الكويزات",
            value: stats.total,
            icon: ClipboardList,
            color: "text-blue-500",
        },
        {
            title: "مسودة",
            value: stats.draft,
            icon: FileEdit,
            color: "text-yellow-500",
        },
        {
            title: "منشور",
            value: stats.published,
            icon: CheckCircle2,
            color: "text-green-500",
        },
        {
            title: "مغلق",
            value: stats.closed,
            icon: XCircle,
            color: "text-gray-500",
        },
    ]

    return (
        <div className="grid gap-4 md:grid-cols-4">
            {cards.map((card) => (
                <Card key={card.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {card.title}
                        </CardTitle>
                        <card.icon className={`h-4 w-4 ${card.color}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{card.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

// ============================================
// COMPONENT
// ============================================

export function QuizzesPageContent({
    initialQuizzes,
    stats,
    offerings,
    selectedOfferingId,
    permissions,
}: QuizzesPageContentProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isCreateOpen, setIsCreateOpen] = useState(false)

    const handleOfferingChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value === "all") {
            params.delete("offering")
        } else {
            params.set("offering", value)
        }
        router.push(`?${params.toString()}`)
    }

    const handleSuccess = () => {
        router.refresh()
    }

    return (
        <div className="space-y-6">
            {/* Stats */}
            <StatCards stats={stats} />

            {/* Toolbar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <Select
                        value={selectedOfferingId ?? "all"}
                        onValueChange={handleOfferingChange}
                    >
                        <SelectTrigger className="w-[300px]">
                            <SelectValue placeholder="كل الشُعب" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">كل الشُعب</SelectItem>
                            {offerings.map((offering) => (
                                <SelectItem key={offering.id} value={offering.id}>
                                    {offering.courseName} ({offering.code})
                                    <span className="text-muted-foreground text-xs mr-1">
                                        - {offering.semester}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {permissions.canCreate && (
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="ml-2 h-4 w-4" />
                        كويز جديد
                    </Button>
                )}
            </div>

            {/* Quizzes Table */}
            <QuizzesTable
                quizzes={initialQuizzes}
                permissions={permissions}
                onSuccess={handleSuccess}
            />

            {/* Create Modal */}
            <CreateQuizModal
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                offerings={offerings}
                onSuccess={handleSuccess}
            />
        </div>
    )
}
