"use client"

/**
 * GradeDistribution Component
 * 
 * CSS-only bar chart showing grade distribution
 * 
 * @module features/reports/components/GradeDistribution
 */

import { useEffect, useState } from "react"
import { Loader2, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getOfferingStats, OfferingStats } from "../actions"

// ============================================
// HELPER FUNCTIONS
// ============================================

const BAR_COLORS = [
    "bg-green-500",   // 90-100
    "bg-blue-500",    // 80-89
    "bg-yellow-500",  // 70-79
    "bg-orange-500",  // 60-69
    "bg-red-500",     // 0-59
]

// ============================================
// COMPONENT
// ============================================

interface GradeDistributionProps {
    offeringId: string
}

export function GradeDistribution({ offeringId }: GradeDistributionProps) {
    const [stats, setStats] = useState<OfferingStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchStats() {
            const result = await getOfferingStats(offeringId)
            if (result.success && result.data) {
                setStats(result.data)
            }
            setIsLoading(false)
        }
        fetchStats()
    }, [offeringId])

    if (isLoading) {
        return (
            <Card>
                <CardContent className="py-8 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    if (!stats) {
        return null
    }

    const maxCount = Math.max(...stats.distribution.map(d => d.count), 1)

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="py-4 text-center">
                        <p className="text-2xl font-bold text-primary">{stats.studentCount}</p>
                        <p className="text-sm text-muted-foreground">عدد الطلاب</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-4 text-center">
                        <p className="text-2xl font-bold text-primary">{stats.quizCount}</p>
                        <p className="text-sm text-muted-foreground">عدد الكويزات</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-4 text-center">
                        <p className="text-2xl font-bold text-green-600">{stats.avgScore.toFixed(1)}%</p>
                        <p className="text-sm text-muted-foreground">متوسط الدرجات</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-sm text-red-600">{stats.minScore.toFixed(0)}%</span>
                            <span className="text-muted-foreground">-</span>
                            <span className="text-sm text-green-600">{stats.maxScore.toFixed(0)}%</span>
                        </div>
                        <p className="text-sm text-muted-foreground">النطاق (أدنى - أعلى)</p>
                    </CardContent>
                </Card>
            </div>

            {/* Distribution Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        توزيع الدرجات
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {stats.distribution.map((bucket, index) => (
                            <div key={bucket.label} className="flex items-center gap-4">
                                <div className="w-32 text-sm text-right">{bucket.label}</div>
                                <div className="flex-1 h-8 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${BAR_COLORS[index]} transition-all duration-500 rounded-full flex items-center justify-end px-2`}
                                        style={{ width: `${(bucket.count / maxCount) * 100}%` }}
                                    >
                                        {bucket.count > 0 && (
                                            <span className="text-xs text-white font-medium">
                                                {bucket.count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <Badge variant="outline" className="w-16 justify-center">
                                    {bucket.percentage.toFixed(0)}%
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
