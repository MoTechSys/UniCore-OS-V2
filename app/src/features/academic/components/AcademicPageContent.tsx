"use client"

/**
 * Academic Page Content (Client Component)
 * 
 * Main content for the academic structure page.
 * Displays colleges in an accordion with nested departments, majors, and courses.
 * 
 * @module features/academic/components/AcademicPageContent
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    Building2,
    BookOpen,
    GraduationCap,
    Layers,
    Plus,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/ui/stat-card"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { CollegeAccordion } from "./CollegeAccordion"
import { CreateCollegeModal } from "./CreateCollegeModal"
import { CreateDepartmentModal } from "./CreateDepartmentModal"
import { CreateMajorModal } from "./CreateMajorModal"
import { CreateCourseModal } from "./CreateCourseModal"
import type {
    CollegeWithDetails,
    AcademicStats,
} from "@/features/academic/actions"

// ============================================
// TYPES
// ============================================

interface AcademicPageContentProps {
    initialColleges: CollegeWithDetails[]
    stats: AcademicStats | null
    permissions: {
        canManageColleges: boolean
        canManageDepartments: boolean
        canManageMajors: boolean
        canViewCourses: boolean
        canCreateCourses: boolean
        canEditCourses: boolean
        canDeleteCourses: boolean
    }
}

// ============================================
// COMPONENT
// ============================================

export function AcademicPageContent({
    initialColleges,
    stats,
    permissions,
}: AcademicPageContentProps) {
    const router = useRouter()
    const [colleges] = useState(initialColleges)

    // Modal states
    const [isCreateCollegeOpen, setIsCreateCollegeOpen] = useState(false)
    const [isCreateDepartmentOpen, setIsCreateDepartmentOpen] = useState(false)
    const [isCreateMajorOpen, setIsCreateMajorOpen] = useState(false)
    const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false)

    // Selected parent for creating child entities
    const [selectedCollegeId, setSelectedCollegeId] = useState<string | null>(null)
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null)

    // Get college options for department creation
    const collegeOptions = colleges.map((c) => ({
        id: c.id,
        nameAr: c.nameAr,
    }))

    // Get department options for major/course creation
    const departmentOptions = colleges.flatMap((c) =>
        c.departments.map((d) => ({
            id: d.id,
            nameAr: `${c.nameAr} - ${d.nameAr}`,
        }))
    )

    // Handlers for opening modals with pre-selected parent
    const handleAddDepartment = (collegeId: string) => {
        setSelectedCollegeId(collegeId)
        setIsCreateDepartmentOpen(true)
    }

    const handleAddMajor = (departmentId: string) => {
        setSelectedDepartmentId(departmentId)
        setIsCreateMajorOpen(true)
    }

    const handleAddCourse = (departmentId: string) => {
        setSelectedDepartmentId(departmentId)
        setIsCreateCourseOpen(true)
    }

    const handleSuccess = () => {
        router.refresh()
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            {stats && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="الكليات"
                        value={stats.totalColleges}
                        description={`${stats.activeColleges} نشطة`}
                        icon={Building2}
                        variant="primary"
                    />
                    <StatCard
                        title="الأقسام"
                        value={stats.totalDepartments}
                        description={`${stats.activeDepartments} نشط`}
                        icon={Layers}
                        variant="success"
                    />
                    <StatCard
                        title="التخصصات"
                        value={stats.totalMajors}
                        icon={GraduationCap}
                        variant="warning"
                    />
                    <StatCard
                        title="المقررات"
                        value={stats.totalCourses}
                        icon={BookOpen}
                        variant="info"
                    />
                </div>
            )}

            {/* Main Content Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">الكليات والأقسام</CardTitle>
                    {permissions.canManageColleges && (
                        <Button
                            onClick={() => setIsCreateCollegeOpen(true)}
                            size="sm"
                        >
                            <Plus className="ml-2 h-4 w-4" />
                            إضافة كلية
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {colleges.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Building2 className="h-12 w-12 text-muted-foreground/50" />
                            <h3 className="mt-4 text-lg font-medium">لا توجد كليات</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                ابدأ بإضافة كلية جديدة لبناء الهيكل الأكاديمي
                            </p>
                            {permissions.canManageColleges && (
                                <Button
                                    onClick={() => setIsCreateCollegeOpen(true)}
                                    className="mt-4"
                                >
                                    <Plus className="ml-2 h-4 w-4" />
                                    إضافة أول كلية
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Accordion type="multiple" className="w-full">
                            {colleges.map((college) => (
                                <AccordionItem key={college.id} value={college.id}>
                                    <CollegeAccordion
                                        college={college}
                                        permissions={permissions}
                                        onAddDepartment={handleAddDepartment}
                                        onAddMajor={handleAddMajor}
                                        onAddCourse={handleAddCourse}
                                        onSuccess={handleSuccess}
                                    />
                                </AccordionItem>
                            ))}
                        </Accordion>
                    )}
                </CardContent>
            </Card>

            {/* Modals */}
            <CreateCollegeModal
                open={isCreateCollegeOpen}
                onOpenChange={setIsCreateCollegeOpen}
                onSuccess={handleSuccess}
            />

            <CreateDepartmentModal
                open={isCreateDepartmentOpen}
                onOpenChange={setIsCreateDepartmentOpen}
                colleges={collegeOptions}
                defaultCollegeId={selectedCollegeId}
                onSuccess={handleSuccess}
            />

            <CreateMajorModal
                open={isCreateMajorOpen}
                onOpenChange={setIsCreateMajorOpen}
                departments={departmentOptions}
                defaultDepartmentId={selectedDepartmentId}
                onSuccess={handleSuccess}
            />

            <CreateCourseModal
                open={isCreateCourseOpen}
                onOpenChange={setIsCreateCourseOpen}
                departments={departmentOptions}
                defaultDepartmentId={selectedDepartmentId}
                onSuccess={handleSuccess}
            />
        </div>
    )
}
