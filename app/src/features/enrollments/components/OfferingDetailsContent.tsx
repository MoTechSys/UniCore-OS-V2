"use client"

/**
 * Offering Details Content (Client Component)
 * 
 * Main content for offering details page with tabs.
 * 
 * @module features/enrollments/components/OfferingDetailsContent
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    BookOpen,
    Users,
    FileText,
    ClipboardList,
    Calendar,
    User,
    Hash,
    Building2,
} from "lucide-react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EnrolledStudentsTab } from "./EnrolledStudentsTab"
import { ResourcesTab } from "@/features/resources/components"
import type { OfferingDetails } from "@/features/offerings/actions"

// ============================================
// TYPES
// ============================================

interface OfferingDetailsContentProps {
    offering: OfferingDetails
    defaultTab: string
    canManageOffering: boolean
    canManageEnrollment: boolean
    canUploadResource: boolean
    canDeleteResource: boolean
}

// ============================================
// SUB-COMPONENTS
// ============================================

function InfoItem({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: React.ReactNode
}) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-medium">{value}</p>
            </div>
        </div>
    )
}

function CapacityCard({ enrolled, max }: { enrolled: number; max: number }) {
    const percentage = (enrolled / max) * 100
    const isFull = enrolled >= max

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    السعة
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-3xl font-bold">
                            {enrolled}
                            <span className="text-lg text-muted-foreground font-normal">
                                {" "}
                                / {max}
                            </span>
                        </span>
                        {isFull ? (
                            <Badge variant="destructive">مكتملة</Badge>
                        ) : (
                            <Badge variant="success">مفتوحة</Badge>
                        )}
                    </div>
                    <Progress value={percentage} className="h-3" />
                    <p className="text-sm text-muted-foreground">
                        {max - enrolled} مقعد متاح
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}

// ============================================
// COMPONENT
// ============================================

export function OfferingDetailsContent({
    offering,
    defaultTab,
    canManageOffering,
    canManageEnrollment,
    canUploadResource,
    canDeleteResource,
}: OfferingDetailsContentProps) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState(defaultTab)

    const handleTabChange = (value: string) => {
        setActiveTab(value)
        router.push(`/offerings/${offering.id}?tab=${value}`, { scroll: false })
    }

    const handleSuccess = () => {
        router.refresh()
    }

    return (
        <div className="space-y-6">
            {/* Header Info */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            معلومات الشعبة
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <InfoItem
                                icon={Hash}
                                label="كود الشعبة"
                                value={offering.code}
                            />
                            <InfoItem
                                icon={BookOpen}
                                label="المقرر"
                                value={
                                    <span>
                                        {offering.course.nameAr}
                                        <span className="text-muted-foreground text-sm mr-1">
                                            ({offering.course.code})
                                        </span>
                                    </span>
                                }
                            />
                            <InfoItem
                                icon={Building2}
                                label="القسم / الكلية"
                                value={`${offering.course.department.nameAr} / ${offering.course.department.college.nameAr}`}
                            />
                            <InfoItem
                                icon={User}
                                label="الساعات المعتمدة"
                                value={`${offering.course.credits} ساعات`}
                            />
                            <InfoItem
                                icon={Calendar}
                                label="الفصل الدراسي"
                                value={
                                    <span className="flex items-center gap-1">
                                        {offering.semester.nameAr}
                                        {offering.semester.isCurrent && (
                                            <Badge variant="success" className="text-xs">
                                                حالي
                                            </Badge>
                                        )}
                                    </span>
                                }
                            />
                            <InfoItem
                                icon={Hash}
                                label="رقم الشعبة"
                                value={offering.section}
                            />
                        </div>
                    </CardContent>
                </Card>

                <CapacityCard
                    enrolled={offering._count.enrollments}
                    max={offering.maxStudents}
                />
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="info" className="gap-2">
                        <BookOpen className="h-4 w-4" />
                        التفاصيل
                    </TabsTrigger>
                    <TabsTrigger value="students" className="gap-2">
                        <Users className="h-4 w-4" />
                        الطلاب ({offering._count.enrollments})
                    </TabsTrigger>
                    <TabsTrigger value="quizzes" className="gap-2" disabled>
                        <ClipboardList className="h-4 w-4" />
                        الاختبارات
                    </TabsTrigger>
                    <TabsTrigger value="resources" className="gap-2">
                        <FileText className="h-4 w-4" />
                        الملفات
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">تفاصيل إضافية</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <p className="text-sm text-muted-foreground">تاريخ الإنشاء</p>
                                        <p className="font-medium">
                                            {format(new Date(offering.createdAt), "d MMMM yyyy", {
                                                locale: ar,
                                            })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">آخر تحديث</p>
                                        <p className="font-medium">
                                            {format(new Date(offering.updatedAt), "d MMMM yyyy", {
                                                locale: ar,
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">الحالة</p>
                                    <Badge variant={offering.isActive ? "success" : "secondary"}>
                                        {offering.isActive ? "نشطة" : "غير نشطة"}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="students" className="mt-4">
                    <EnrolledStudentsTab
                        offeringId={offering.id}
                        enrollments={offering.enrollments}
                        maxStudents={offering.maxStudents}
                        canManage={canManageEnrollment}
                        onSuccess={handleSuccess}
                    />
                </TabsContent>

                <TabsContent value="quizzes" className="mt-4">
                    <Card>
                        <CardContent className="py-12 text-center">
                            <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/50" />
                            <h3 className="mt-4 text-lg font-medium">قريباً</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                سيتم إضافة إدارة الاختبارات في الإصدار القادم
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="resources" className="mt-4">
                    <ResourcesTab
                        offeringId={offering.id}
                        canUpload={canUploadResource}
                        canDelete={canDeleteResource}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
