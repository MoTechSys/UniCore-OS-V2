"use client"

/**
 * Quiz Editor Content (Client Component)
 * 
 * Full quiz editor with tabs for settings and questions.
 * 
 * @module features/quizzes/components/QuizEditorContent
 */

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
    Settings,
    ListOrdered,
    ArrowRight,
    Save,
    Rocket,
    AlertCircle,
    CheckCircle2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { publishQuiz, type QuizDetails } from "@/features/quizzes/actions"
import { QuizSettingsForm } from "./QuizSettingsForm"
import { QuestionBuilder } from "./QuestionBuilder"

// ============================================
// TYPES
// ============================================

interface QuizEditorContentProps {
    quiz: QuizDetails
    isReadOnly: boolean
    canManage: boolean
}

// ============================================
// STATUS BADGE
// ============================================

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { label: string; variant: "default" | "success" | "secondary" | "destructive"; icon: typeof CheckCircle2 }> = {
        DRAFT: { label: "مسودة", variant: "secondary", icon: Settings },
        PUBLISHED: { label: "منشور", variant: "success", icon: CheckCircle2 },
        CLOSED: { label: "مغلق", variant: "destructive", icon: AlertCircle },
    }

    const { label, variant, icon: Icon } = config[status] ?? config.DRAFT

    return (
        <Badge variant={variant} className="text-sm px-3 py-1">
            <Icon className="h-3 w-3 ml-1" />
            {label}
        </Badge>
    )
}

// ============================================
// COMPONENT
// ============================================

export function QuizEditorContent({
    quiz,
    isReadOnly,
    canManage,
}: QuizEditorContentProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [activeTab, setActiveTab] = useState("questions")
    const [publishDialogOpen, setPublishDialogOpen] = useState(false)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

    const handlePublish = () => {
        startTransition(async () => {
            const result = await publishQuiz(quiz.id)
            if (result.success) {
                toast.success("تم نشر الكويز بنجاح! 🎉")
                router.refresh()
            } else {
                toast.error(result.error ?? "فشل في نشر الكويز")
            }
            setPublishDialogOpen(false)
        })
    }

    const handleSettingsSaved = () => {
        router.refresh()
        toast.success("تم حفظ الإعدادات")
    }

    const handleQuestionsSaved = () => {
        router.refresh()
        setHasUnsavedChanges(false)
        toast.success("تم حفظ الأسئلة")
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/quizzes">
                            <ArrowRight className="h-4 w-4 ml-1" />
                            العودة للكويزات
                        </Link>
                    </Button>
                    <StatusBadge status={quiz.status} />
                </div>

                <div className="flex items-center gap-2">
                    {quiz.status === "DRAFT" && canManage && (
                        <Button
                            onClick={() => setPublishDialogOpen(true)}
                            disabled={quiz.questions.length === 0}
                        >
                            <Rocket className="h-4 w-4 ml-2" />
                            نشر الكويز
                        </Button>
                    )}
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{quiz._count.questions}</div>
                        <p className="text-sm text-muted-foreground">سؤال</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{quiz.totalPoints}</div>
                        <p className="text-sm text-muted-foreground">نقطة</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{quiz.duration}</div>
                        <p className="text-sm text-muted-foreground">دقيقة</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{quiz._count.attempts}</div>
                        <p className="text-sm text-muted-foreground">محاولة</p>
                    </CardContent>
                </Card>
            </div>

            {/* Read Only Warning */}
            {isReadOnly && (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        هذا الكويز {quiz.status === "PUBLISHED" ? "منشور" : "مغلق"} ولا يمكن تعديل الأسئلة.
                    </AlertDescription>
                </Alert>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="questions" className="gap-2">
                        <ListOrdered className="h-4 w-4" />
                        الأسئلة ({quiz.questions.length})
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="gap-2">
                        <Settings className="h-4 w-4" />
                        الإعدادات
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="questions" className="mt-4">
                    <QuestionBuilder
                        quizId={quiz.id}
                        initialQuestions={quiz.questions}
                        isReadOnly={isReadOnly}
                        onSaved={handleQuestionsSaved}
                        onDirtyChange={setHasUnsavedChanges}
                    />
                </TabsContent>

                <TabsContent value="settings" className="mt-4">
                    <QuizSettingsForm
                        quiz={quiz}
                        isReadOnly={isReadOnly}
                        onSaved={handleSettingsSaved}
                    />
                </TabsContent>
            </Tabs>

            {/* Publish Dialog */}
            <AlertDialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>نشر الكويز</AlertDialogTitle>
                        <AlertDialogDescription>
                            عند نشر الكويز سيتمكن الطلاب من تقديمه.
                            <strong className="block mt-2">
                                تحذير: لن تتمكن من تعديل الأسئلة بعد النشر.
                            </strong>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={handlePublish} disabled={isPending}>
                            {isPending ? "جارٍ النشر..." : "نشر الكويز"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
