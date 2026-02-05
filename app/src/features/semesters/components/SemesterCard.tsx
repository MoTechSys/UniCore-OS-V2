"use client"

/**
 * Semester Card Component
 * 
 * Displays a single semester with actions.
 * 
 * @module features/semesters/components/SemesterCard
 */

import { useState, useTransition } from "react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import {
    Calendar,
    CalendarCheck,
    CalendarX,
    MoreHorizontal,
    Pencil,
    Trash2,
    Power,
    PowerOff,
    BookOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
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
import { toast } from "sonner"
import {
    deleteSemester,
    activateSemester,
    deactivateSemester,
    type SemesterData,
} from "@/features/semesters/actions"

// ============================================
// TYPES
// ============================================

interface SemesterCardProps {
    semester: SemesterData
    canManage: boolean
    onSuccess: () => void
    isHighlighted?: boolean
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getSemesterTypeLabel(type: string): string {
    switch (type) {
        case "FIRST":
            return "الفصل الأول"
        case "SECOND":
            return "الفصل الثاني"
        case "SUMMER":
            return "الفصل الصيفي"
        default:
            return type
    }
}

function getSemesterStatus(semester: SemesterData): {
    label: string
    variant: "default" | "success" | "warning" | "destructive" | "secondary"
} {
    const now = new Date()
    if (semester.isCurrent) {
        return { label: "نشط", variant: "success" }
    }
    if (semester.startDate > now) {
        return { label: "قادم", variant: "warning" }
    }
    if (semester.endDate < now) {
        return { label: "مؤرشف", variant: "secondary" }
    }
    return { label: "غير نشط", variant: "default" }
}

// ============================================
// COMPONENT
// ============================================

export function SemesterCard({
    semester,
    canManage,
    onSuccess,
    isHighlighted = false,
}: SemesterCardProps) {
    const [isPending, startTransition] = useTransition()
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [activateDialogOpen, setActivateDialogOpen] = useState(false)

    const status = getSemesterStatus(semester)

    const handleActivate = () => {
        startTransition(async () => {
            const result = await activateSemester(semester.id)
            if (result.success) {
                toast.success("تم تفعيل الفصل الدراسي")
                onSuccess()
            } else {
                toast.error(result.error ?? "فشل في تفعيل الفصل")
            }
            setActivateDialogOpen(false)
        })
    }

    const handleDeactivate = () => {
        startTransition(async () => {
            const result = await deactivateSemester(semester.id)
            if (result.success) {
                toast.success("تم إلغاء تفعيل الفصل الدراسي")
                onSuccess()
            } else {
                toast.error(result.error ?? "فشل في إلغاء تفعيل الفصل")
            }
        })
    }

    const handleDelete = () => {
        startTransition(async () => {
            const result = await deleteSemester(semester.id)
            if (result.success) {
                toast.success("تم حذف الفصل الدراسي")
                onSuccess()
            } else {
                toast.error(result.error ?? "فشل في حذف الفصل")
            }
            setDeleteDialogOpen(false)
        })
    }

    return (
        <>
            <Card className={isHighlighted ? "border-0 shadow-none" : ""}>
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                            {semester.isCurrent ? (
                                <CalendarCheck className="h-5 w-5 text-success" />
                            ) : (
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div>
                                <CardTitle className="text-base">{semester.nameAr}</CardTitle>
                                <CardDescription>{semester.code}</CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant={status.variant}>{status.label}</Badge>
                            {canManage && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {!semester.isCurrent && (
                                            <DropdownMenuItem onClick={() => setActivateDialogOpen(true)}>
                                                <Power className="ml-2 h-4 w-4" />
                                                تفعيل الفصل
                                            </DropdownMenuItem>
                                        )}
                                        {semester.isCurrent && (
                                            <DropdownMenuItem onClick={handleDeactivate}>
                                                <PowerOff className="ml-2 h-4 w-4" />
                                                إلغاء التفعيل
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem>
                                            <Pencil className="ml-2 h-4 w-4" />
                                            تعديل
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-destructive"
                                            onClick={() => setDeleteDialogOpen(true)}
                                        >
                                            <Trash2 className="ml-2 h-4 w-4" />
                                            حذف
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span>النوع:</span>
                            <span className="font-medium text-foreground">
                                {getSemesterTypeLabel(semester.type)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span>السنة:</span>
                            <span className="font-medium text-foreground">{semester.year}</span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span>البداية:</span>
                            <span className="font-medium text-foreground">
                                {format(new Date(semester.startDate), "d MMMM yyyy", { locale: ar })}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span>النهاية:</span>
                            <span className="font-medium text-foreground">
                                {format(new Date(semester.endDate), "d MMMM yyyy", { locale: ar })}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span>الشُعب:</span>
                            <div className="flex items-center gap-1 font-medium text-foreground">
                                <BookOpen className="h-4 w-4" />
                                {semester._count.offerings}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Activate Confirmation Dialog */}
            <AlertDialog open={activateDialogOpen} onOpenChange={setActivateDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>تفعيل الفصل الدراسي</AlertDialogTitle>
                        <AlertDialogDescription>
                            سيتم إلغاء تفعيل الفصل الحالي وتفعيل "{semester.nameAr}" بدلاً منه.
                            هل أنت متأكد؟
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={handleActivate} disabled={isPending}>
                            {isPending ? "جارٍ التفعيل..." : "تفعيل"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>حذف الفصل الدراسي</AlertDialogTitle>
                        <AlertDialogDescription>
                            هل أنت متأكد من حذف "{semester.nameAr}"؟ لا يمكن التراجع عن هذا الإجراء.
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
