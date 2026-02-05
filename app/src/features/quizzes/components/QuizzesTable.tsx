"use client"

/**
 * Quizzes Table Component
 * 
 * Displays quizzes in a table with actions.
 * 
 * @module features/quizzes/components/QuizzesTable
 */

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import {
    FileEdit,
    Eye,
    Trash2,
    Copy,
    MoreVertical,
    Rocket,
    Ban,
    RotateCcw,
    ClipboardList,
} from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import {
    deleteQuiz,
    publishQuiz,
    closeQuiz,
    reopenQuiz,
    duplicateQuiz,
    type QuizData,
} from "@/features/quizzes/actions"

// ============================================
// TYPES
// ============================================

interface QuizzesTableProps {
    quizzes: QuizData[]
    permissions: {
        canCreate: boolean
        canManage: boolean
        canEdit: boolean
        canDelete: boolean
    }
    onSuccess: () => void
}

// ============================================
// STATUS BADGE
// ============================================

function QuizStatusBadge({ status }: { status: string }) {
    const variants: Record<string, { label: string; variant: "default" | "success" | "secondary" | "destructive" }> = {
        DRAFT: { label: "مسودة", variant: "secondary" },
        PUBLISHED: { label: "منشور", variant: "success" },
        CLOSED: { label: "مغلق", variant: "destructive" },
    }

    const config = variants[status] ?? { label: status, variant: "default" }

    return <Badge variant={config.variant}>{config.label}</Badge>
}

// ============================================
// COMPONENT
// ============================================

export function QuizzesTable({ quizzes, permissions, onSuccess }: QuizzesTableProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [actionDialogOpen, setActionDialogOpen] = useState(false)
    const [selectedQuiz, setSelectedQuiz] = useState<QuizData | null>(null)
    const [actionType, setActionType] = useState<"publish" | "close" | "reopen" | null>(null)

    const handleAction = (quiz: QuizData, action: "publish" | "close" | "reopen") => {
        setSelectedQuiz(quiz)
        setActionType(action)
        setActionDialogOpen(true)
    }

    const confirmAction = () => {
        if (!selectedQuiz || !actionType) return

        startTransition(async () => {
            let result
            switch (actionType) {
                case "publish":
                    result = await publishQuiz(selectedQuiz.id)
                    break
                case "close":
                    result = await closeQuiz(selectedQuiz.id)
                    break
                case "reopen":
                    result = await reopenQuiz(selectedQuiz.id)
                    break
            }

            if (result.success) {
                const messages = {
                    publish: "تم نشر الكويز بنجاح",
                    close: "تم إغلاق الكويز",
                    reopen: "تم إعادة فتح الكويز",
                }
                toast.success(messages[actionType])
                onSuccess()
            } else {
                toast.error(result.error ?? "فشل في تنفيذ العملية")
            }

            setActionDialogOpen(false)
            setSelectedQuiz(null)
            setActionType(null)
        })
    }

    const handleDelete = () => {
        if (!selectedQuiz) return

        startTransition(async () => {
            const result = await deleteQuiz(selectedQuiz.id)
            if (result.success) {
                toast.success("تم حذف الكويز بنجاح")
                onSuccess()
            } else {
                toast.error(result.error ?? "فشل في حذف الكويز")
            }
            setDeleteDialogOpen(false)
            setSelectedQuiz(null)
        })
    }

    const handleDuplicate = (quiz: QuizData) => {
        startTransition(async () => {
            const result = await duplicateQuiz(quiz.id)
            if (result.success) {
                toast.success("تم نسخ الكويز بنجاح")
                onSuccess()
            } else {
                toast.error(result.error ?? "فشل في نسخ الكويز")
            }
        })
    }

    if (quizzes.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <ClipboardList className="h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-medium">لا توجد كويزات</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        ابدأ بإنشاء كويز جديد
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>العنوان</TableHead>
                            <TableHead>الشعبة</TableHead>
                            <TableHead>الأسئلة</TableHead>
                            <TableHead>المدة</TableHead>
                            <TableHead>الحالة</TableHead>
                            <TableHead>المنشئ</TableHead>
                            <TableHead>تاريخ الإنشاء</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {quizzes.map((quiz) => (
                            <TableRow key={quiz.id}>
                                <TableCell className="font-medium">{quiz.title}</TableCell>
                                <TableCell>
                                    <div className="text-sm">
                                        <p>{quiz.offering.course.nameAr}</p>
                                        <p className="text-muted-foreground text-xs">
                                            {quiz.offering.code}
                                        </p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{quiz._count.questions} سؤال</Badge>
                                </TableCell>
                                <TableCell>{quiz.duration} دقيقة</TableCell>
                                <TableCell>
                                    <QuizStatusBadge status={quiz.status} />
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {quiz.creator.name ?? quiz.creator.email}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {format(new Date(quiz.createdAt), "d MMM yyyy", { locale: ar })}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={() => router.push(`/quizzes/${quiz.id}/edit`)}
                                            >
                                                <FileEdit className="ml-2 h-4 w-4" />
                                                {quiz.status === "DRAFT" ? "تعديل" : "عرض"}
                                            </DropdownMenuItem>

                                            {permissions.canManage && quiz.status === "DRAFT" && (
                                                <DropdownMenuItem
                                                    onClick={() => handleAction(quiz, "publish")}
                                                    className="text-green-600"
                                                >
                                                    <Rocket className="ml-2 h-4 w-4" />
                                                    نشر
                                                </DropdownMenuItem>
                                            )}

                                            {permissions.canManage && quiz.status === "PUBLISHED" && (
                                                <DropdownMenuItem
                                                    onClick={() => handleAction(quiz, "close")}
                                                    className="text-orange-600"
                                                >
                                                    <Ban className="ml-2 h-4 w-4" />
                                                    إغلاق
                                                </DropdownMenuItem>
                                            )}

                                            {permissions.canManage && quiz.status === "CLOSED" && (
                                                <DropdownMenuItem
                                                    onClick={() => handleAction(quiz, "reopen")}
                                                    className="text-blue-600"
                                                >
                                                    <RotateCcw className="ml-2 h-4 w-4" />
                                                    إعادة فتح
                                                </DropdownMenuItem>
                                            )}

                                            {permissions.canCreate && (
                                                <DropdownMenuItem onClick={() => handleDuplicate(quiz)}>
                                                    <Copy className="ml-2 h-4 w-4" />
                                                    نسخ
                                                </DropdownMenuItem>
                                            )}

                                            {permissions.canDelete && quiz._count.attempts === 0 && (
                                                <>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedQuiz(quiz)
                                                            setDeleteDialogOpen(true)
                                                        }}
                                                        className="text-destructive"
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
            </Card>

            {/* Delete Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>حذف الكويز</AlertDialogTitle>
                        <AlertDialogDescription>
                            هل أنت متأكد من حذف الكويز "{selectedQuiz?.title}"؟ هذا الإجراء لا يمكن التراجع عنه.
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

            {/* Action Confirmation Dialog */}
            <AlertDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {actionType === "publish" && "نشر الكويز"}
                            {actionType === "close" && "إغلاق الكويز"}
                            {actionType === "reopen" && "إعادة فتح الكويز"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {actionType === "publish" &&
                                "عند نشر الكويز سيتمكن الطلاب من تقديمه. لن تتمكن من تعديل الأسئلة بعد النشر."}
                            {actionType === "close" &&
                                "عند إغلاق الكويز لن يتمكن الطلاب من تقديمه."}
                            {actionType === "reopen" &&
                                "سيتمكن الطلاب من تقديم الكويز مرة أخرى."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmAction} disabled={isPending}>
                            {isPending ? "جارٍ التنفيذ..." : "تأكيد"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
