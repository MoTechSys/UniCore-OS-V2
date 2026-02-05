"use client"

/**
 * Enrolled Students Tab Component
 * 
 * Displays enrolled students and allows enrollment management.
 * 
 * @module features/enrollments/components/EnrolledStudentsTab
 */

import { useState, useTransition } from "react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import {
    Users,
    UserPlus,
    UserMinus,
    Search,
    Mail,
    Hash,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
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
import { dropStudent } from "@/features/enrollments/actions"
import { EnrollStudentModal } from "./EnrollStudentModal"

// ============================================
// TYPES
// ============================================

interface Enrollment {
    id: string
    enrolledAt: Date
    droppedAt: Date | null
    student: {
        id: string
        name: string | null
        email: string
        profile: {
            studentId: string | null
        } | null
    }
}

interface EnrolledStudentsTabProps {
    offeringId: string
    enrollments: Enrollment[]
    maxStudents: number
    canManage: boolean
    onSuccess: () => void
}

// ============================================
// COMPONENT
// ============================================

export function EnrolledStudentsTab({
    offeringId,
    enrollments,
    maxStudents,
    canManage,
    onSuccess,
}: EnrolledStudentsTabProps) {
    const [isPending, startTransition] = useTransition()
    const [isEnrollOpen, setIsEnrollOpen] = useState(false)
    const [dropDialogOpen, setDropDialogOpen] = useState(false)
    const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null)

    const isFull = enrollments.length >= maxStudents

    const handleDrop = () => {
        if (!selectedEnrollment) return

        startTransition(async () => {
            const result = await dropStudent(selectedEnrollment.id)
            if (result.success) {
                toast.success("تم إسقاط الطالب من الشعبة")
                onSuccess()
            } else {
                toast.error(result.error ?? "فشل في إسقاط الطالب")
            }
            setDropDialogOpen(false)
            setSelectedEnrollment(null)
        })
    }

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Users className="h-4 w-4" />
                        الطلاب المسجلين
                        <Badge variant="secondary">{enrollments.length}</Badge>
                    </CardTitle>
                    {canManage && (
                        <Button
                            onClick={() => setIsEnrollOpen(true)}
                            size="sm"
                            disabled={isFull}
                        >
                            <UserPlus className="ml-2 h-4 w-4" />
                            تسجيل طالب
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {enrollments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Users className="h-12 w-12 text-muted-foreground/50" />
                            <h3 className="mt-4 text-lg font-medium">لا يوجد طلاب مسجلين</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                ابدأ بتسجيل الطلاب في هذه الشعبة
                            </p>
                            {canManage && (
                                <Button onClick={() => setIsEnrollOpen(true)} className="mt-4">
                                    <UserPlus className="ml-2 h-4 w-4" />
                                    تسجيل طالب
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">#</TableHead>
                                    <TableHead>الرقم الجامعي</TableHead>
                                    <TableHead>الاسم</TableHead>
                                    <TableHead>البريد الإلكتروني</TableHead>
                                    <TableHead>تاريخ التسجيل</TableHead>
                                    {canManage && <TableHead className="w-[100px]">الإجراءات</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {enrollments.map((enrollment, index) => (
                                    <TableRow key={enrollment.id}>
                                        <TableCell className="text-muted-foreground">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Hash className="h-3 w-3 text-muted-foreground" />
                                                <span className="font-mono">
                                                    {enrollment.student.profile?.studentId ?? "-"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {enrollment.student.name ?? "—"}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <Mail className="h-3 w-3" />
                                                <span className="text-sm">{enrollment.student.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {format(new Date(enrollment.enrolledAt), "d MMM yyyy", {
                                                locale: ar,
                                            })}
                                        </TableCell>
                                        {canManage && (
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => {
                                                        setSelectedEnrollment(enrollment)
                                                        setDropDialogOpen(true)
                                                    }}
                                                >
                                                    <UserMinus className="ml-1 h-4 w-4" />
                                                    إسقاط
                                                </Button>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Enroll Student Modal */}
            <EnrollStudentModal
                open={isEnrollOpen}
                onOpenChange={setIsEnrollOpen}
                offeringId={offeringId}
                onSuccess={() => {
                    setIsEnrollOpen(false)
                    onSuccess()
                }}
            />

            {/* Drop Confirmation Dialog */}
            <AlertDialog open={dropDialogOpen} onOpenChange={setDropDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>إسقاط الطالب</AlertDialogTitle>
                        <AlertDialogDescription>
                            هل أنت متأكد من إسقاط الطالب "
                            {selectedEnrollment?.student.name ?? selectedEnrollment?.student.email}"
                            من هذه الشعبة؟
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDrop}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isPending}
                        >
                            {isPending ? "جارٍ الإسقاط..." : "إسقاط"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
