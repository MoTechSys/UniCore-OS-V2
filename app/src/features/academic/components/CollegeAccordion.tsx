"use client"

/**
 * College Accordion Component
 * 
 * Displays a single college with its departments, majors, and courses.
 * Uses nested accordion for hierarchical view.
 * 
 * @module features/academic/components/CollegeAccordion
 */

import { useState, useTransition } from "react"
import {
    Building2,
    Layers,
    GraduationCap,
    BookOpen,
    Plus,
    Pencil,
    Trash2,
    MoreHorizontal,
    ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    AccordionContent,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
    deleteCollege,
    deleteDepartment,
    deleteMajor,
    deleteCourse,
    type CollegeWithDetails,
    type DepartmentWithDetails,
    type MajorData,
    type CourseData,
} from "@/features/academic/actions"

// ============================================
// TYPES
// ============================================

interface CollegeAccordionProps {
    college: CollegeWithDetails
    permissions: {
        canManageColleges: boolean
        canManageDepartments: boolean
        canManageMajors: boolean
        canViewCourses: boolean
        canCreateCourses: boolean
        canEditCourses: boolean
        canDeleteCourses: boolean
    }
    onAddDepartment: (collegeId: string) => void
    onAddMajor: (departmentId: string) => void
    onAddCourse: (departmentId: string) => void
    onSuccess: () => void
}

// ============================================
// SUB-COMPONENTS
// ============================================

function MajorCard({
    major,
    canManage,
    onDelete,
}: {
    major: MajorData
    canManage: boolean
    onDelete: () => void
}) {
    return (
        <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50">
            <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                    <GraduationCap className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                    <p className="font-medium">{major.nameAr}</p>
                    <p className="text-xs text-muted-foreground">
                        {major.code} • {major.totalCredits} ساعة
                    </p>
                </div>
            </div>
            {canManage && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                            <Pencil className="ml-2 h-4 w-4" />
                            تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="text-destructive"
                            onClick={onDelete}
                        >
                            <Trash2 className="ml-2 h-4 w-4" />
                            حذف
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    )
}

function CourseCard({
    course,
    canEdit,
    canDelete,
    onDelete,
}: {
    course: CourseData
    canEdit: boolean
    canDelete: boolean
    onDelete: () => void
}) {
    return (
        <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50">
            <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                    <p className="font-medium">{course.nameAr}</p>
                    <p className="text-xs text-muted-foreground">
                        {course.code} • {course.credits} ساعات
                    </p>
                </div>
            </div>
            {(canEdit || canDelete) && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {canEdit && (
                            <DropdownMenuItem>
                                <Pencil className="ml-2 h-4 w-4" />
                                تعديل
                            </DropdownMenuItem>
                        )}
                        {canDelete && (
                            <DropdownMenuItem
                                className="text-destructive"
                                onClick={onDelete}
                            >
                                <Trash2 className="ml-2 h-4 w-4" />
                                حذف
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    )
}

function DepartmentSection({
    department,
    permissions,
    onAddMajor,
    onAddCourse,
    onDeleteMajor,
    onDeleteCourse,
    onDeleteDepartment,
}: {
    department: DepartmentWithDetails
    permissions: CollegeAccordionProps["permissions"]
    onAddMajor: () => void
    onAddCourse: () => void
    onDeleteMajor: (id: string) => void
    onDeleteCourse: (id: string) => void
    onDeleteDepartment: () => void
}) {
    return (
        <div className="rounded-lg border bg-muted/30 p-4">
            {/* Department Header */}
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                        <Layers className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold">{department.nameAr}</h4>
                        <p className="text-sm text-muted-foreground">
                            {department.code} • {department._count.majors} تخصص •{" "}
                            {department._count.courses} مقرر
                        </p>
                    </div>
                </div>
                {permissions.canManageDepartments && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                                <Pencil className="ml-2 h-4 w-4" />
                                تعديل القسم
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-destructive"
                                onClick={onDeleteDepartment}
                            >
                                <Trash2 className="ml-2 h-4 w-4" />
                                حذف القسم
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            {/* Tabs for Majors and Courses */}
            <Tabs defaultValue="majors" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="majors" className="gap-2">
                        <GraduationCap className="h-4 w-4" />
                        التخصصات ({department.majors.length})
                    </TabsTrigger>
                    <TabsTrigger value="courses" className="gap-2">
                        <BookOpen className="h-4 w-4" />
                        المقررات ({department.courses.length})
                    </TabsTrigger>
                </TabsList>

                {/* Majors Tab */}
                <TabsContent value="majors" className="mt-4 space-y-2">
                    {department.majors.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            لا توجد تخصصات في هذا القسم
                        </div>
                    ) : (
                        department.majors.map((major) => (
                            <MajorCard
                                key={major.id}
                                major={major}
                                canManage={permissions.canManageMajors}
                                onDelete={() => onDeleteMajor(major.id)}
                            />
                        ))
                    )}
                    {permissions.canManageMajors && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            onClick={onAddMajor}
                        >
                            <Plus className="ml-2 h-4 w-4" />
                            إضافة تخصص
                        </Button>
                    )}
                </TabsContent>

                {/* Courses Tab */}
                <TabsContent value="courses" className="mt-4 space-y-2">
                    {department.courses.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            لا توجد مقررات في هذا القسم
                        </div>
                    ) : (
                        department.courses.map((course) => (
                            <CourseCard
                                key={course.id}
                                course={course}
                                canEdit={permissions.canEditCourses}
                                canDelete={permissions.canDeleteCourses}
                                onDelete={() => onDeleteCourse(course.id)}
                            />
                        ))
                    )}
                    {permissions.canCreateCourses && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            onClick={onAddCourse}
                        >
                            <Plus className="ml-2 h-4 w-4" />
                            إضافة مقرر
                        </Button>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CollegeAccordion({
    college,
    permissions,
    onAddDepartment,
    onAddMajor,
    onAddCourse,
    onSuccess,
}: CollegeAccordionProps) {
    const [isPending, startTransition] = useTransition()
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<{
        type: "college" | "department" | "major" | "course"
        id: string
        name: string
    } | null>(null)

    const handleDelete = async () => {
        if (!deleteTarget) return

        startTransition(async () => {
            let result
            switch (deleteTarget.type) {
                case "college":
                    result = await deleteCollege(deleteTarget.id)
                    break
                case "department":
                    result = await deleteDepartment(deleteTarget.id)
                    break
                case "major":
                    result = await deleteMajor(deleteTarget.id)
                    break
                case "course":
                    result = await deleteCourse(deleteTarget.id)
                    break
            }

            if (result.success) {
                toast.success("تم الحذف بنجاح")
                onSuccess()
            } else {
                toast.error(result.error ?? "فشل في الحذف")
            }
            setDeleteDialogOpen(false)
            setDeleteTarget(null)
        })
    }

    const openDeleteDialog = (
        type: "college" | "department" | "major" | "course",
        id: string,
        name: string
    ) => {
        setDeleteTarget({ type, id, name })
        setDeleteDialogOpen(true)
    }

    return (
        <>
            <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-right">
                        <p className="font-semibold">{college.nameAr}</p>
                        <p className="text-sm text-muted-foreground">
                            {college.code} • {college._count.departments} قسم
                        </p>
                    </div>
                    {!college.isActive && (
                        <Badge variant="secondary" className="mr-2">
                            غير نشط
                        </Badge>
                    )}
                </div>
            </AccordionTrigger>

            <AccordionContent className="pt-4">
                {/* College Actions */}
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex gap-2">
                        {permissions.canManageDepartments && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onAddDepartment(college.id)}
                            >
                                <Plus className="ml-2 h-4 w-4" />
                                إضافة قسم
                            </Button>
                        )}
                    </div>
                    {permissions.canManageColleges && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                    <Pencil className="ml-2 h-4 w-4" />
                                    تعديل الكلية
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() =>
                                        openDeleteDialog("college", college.id, college.nameAr)
                                    }
                                >
                                    <Trash2 className="ml-2 h-4 w-4" />
                                    حذف الكلية
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {/* Departments */}
                {college.departments.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                        لا توجد أقسام في هذه الكلية
                    </div>
                ) : (
                    <div className="space-y-4">
                        {college.departments.map((department) => (
                            <DepartmentSection
                                key={department.id}
                                department={department}
                                permissions={permissions}
                                onAddMajor={() => onAddMajor(department.id)}
                                onAddCourse={() => onAddCourse(department.id)}
                                onDeleteMajor={(id) =>
                                    openDeleteDialog(
                                        "major",
                                        id,
                                        department.majors.find((m) => m.id === id)?.nameAr ?? ""
                                    )
                                }
                                onDeleteCourse={(id) =>
                                    openDeleteDialog(
                                        "course",
                                        id,
                                        department.courses.find((c) => c.id === id)?.nameAr ?? ""
                                    )
                                }
                                onDeleteDepartment={() =>
                                    openDeleteDialog("department", department.id, department.nameAr)
                                }
                            />
                        ))}
                    </div>
                )}
            </AccordionContent>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                        <AlertDialogDescription>
                            هل أنت متأكد من حذف "{deleteTarget?.name}"؟ لا يمكن التراجع عن هذا
                            الإجراء.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isPending}
                        >
                            {isPending ? "جارٍ الحذف..." : "حذف"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
