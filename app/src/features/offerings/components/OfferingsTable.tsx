"use client"

/**
 * Offerings Table Component
 * 
 * Table displaying course offerings with status and capacity.
 * 
 * @module features/offerings/components/OfferingsTable
 */

import { useState, useTransition } from "react"
import Link from "next/link"
import {
    MoreHorizontal,
    Eye,
    Pencil,
    Trash2,
    Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
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
import { deleteOffering, type OfferingData } from "@/features/offerings/actions"

// ============================================
// TYPES
// ============================================

interface OfferingsTableProps {
    offerings: OfferingData[]
    canManage: boolean
    onSuccess: () => void
}

// ============================================
// SUB-COMPONENTS
// ============================================

function CapacityCell({ enrolled, max }: { enrolled: number; max: number }) {
    const percentage = (enrolled / max) * 100
    const isFull = enrolled >= max

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
                <span className={isFull ? "text-destructive font-medium" : ""}>
                    {enrolled} / {max}
                </span>
                <span className="text-muted-foreground text-xs">
                    {percentage.toFixed(0)}%
                </span>
            </div>
            <Progress
                value={percentage}
                className="h-2"
            />
        </div>
    )
}

function StatusBadge({ enrolled, max }: { enrolled: number; max: number }) {
    if (enrolled >= max) {
        return <Badge variant="destructive">مكتملة</Badge>
    }
    if (enrolled >= max * 0.8) {
        return <Badge variant="warning">شبه مكتملة</Badge>
    }
    return <Badge variant="success">مفتوحة</Badge>
}

// ============================================
// COMPONENT
// ============================================

export function OfferingsTable({
    offerings,
    canManage,
    onSuccess,
}: OfferingsTableProps) {
    const [isPending, startTransition] = useTransition()
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [selectedOffering, setSelectedOffering] = useState<OfferingData | null>(null)

    const handleDelete = () => {
        if (!selectedOffering) return

        startTransition(async () => {
            const result = await deleteOffering(selectedOffering.id)
            if (result.success) {
                toast.success("تم حذف الشعبة")
                onSuccess()
            } else {
                toast.error(result.error ?? "فشل في حذف الشعبة")
            }
            setDeleteDialogOpen(false)
            setSelectedOffering(null)
        })
    }

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>كود الشعبة</TableHead>
                        <TableHead>المقرر</TableHead>
                        <TableHead>القسم / الكلية</TableHead>
                        <TableHead>الشعبة</TableHead>
                        <TableHead>الفصل</TableHead>
                        <TableHead className="w-[150px]">السعة</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {offerings.map((offering) => (
                        <TableRow key={offering.id}>
                            <TableCell className="font-mono text-sm">
                                {offering.code}
                            </TableCell>
                            <TableCell>
                                <div>
                                    <p className="font-medium">{offering.course.nameAr}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {offering.course.code}
                                    </p>
                                </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                                {offering.course.department.nameAr} / {offering.course.department.college.nameAr}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline">{offering.section}</Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1">
                                    {offering.semester.isCurrent && (
                                        <span className="h-2 w-2 rounded-full bg-success" />
                                    )}
                                    <span className="text-sm">{offering.semester.nameAr}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <CapacityCell
                                    enrolled={offering._count.enrollments}
                                    max={offering.maxStudents}
                                />
                            </TableCell>
                            <TableCell>
                                <StatusBadge
                                    enrolled={offering._count.enrollments}
                                    max={offering.maxStudents}
                                />
                            </TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild>
                                            <Link href={`/offerings/${offering.id}`}>
                                                <Eye className="ml-2 h-4 w-4" />
                                                عرض التفاصيل
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href={`/offerings/${offering.id}?tab=students`}>
                                                <Users className="ml-2 h-4 w-4" />
                                                الطلاب المسجلين
                                            </Link>
                                        </DropdownMenuItem>
                                        {canManage && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem>
                                                    <Pencil className="ml-2 h-4 w-4" />
                                                    تعديل
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => {
                                                        setSelectedOffering(offering)
                                                        setDeleteDialogOpen(true)
                                                    }}
                                                >
                                                    <Trash2 className="ml-2 h-4 w-4" />
                                                    حذف
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>حذف الشعبة</AlertDialogTitle>
                        <AlertDialogDescription>
                            هل أنت متأكد من حذف الشعبة "{selectedOffering?.code}"؟
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
