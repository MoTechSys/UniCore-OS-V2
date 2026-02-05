"use client"

/**
 * Create Quiz Modal
 * 
 * Quick modal to create a new quiz.
 * 
 * @module features/quizzes/components/CreateQuizModal
 */

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { createQuiz } from "@/features/quizzes/actions"

// ============================================
// SCHEMA
// ============================================

const formSchema = z.object({
    title: z.string().min(3, "العنوان يجب أن يكون 3 أحرف على الأقل"),
    description: z.string().optional(),
    offeringId: z.string().min(1, "يجب اختيار الشعبة"),
    duration: z.coerce.number().min(5, "المدة يجب أن تكون 5 دقائق على الأقل"),
    passingScore: z.coerce.number().min(0).max(100),
})

type FormValues = z.infer<typeof formSchema>

// ============================================
// TYPES
// ============================================

interface CreateQuizModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    offerings: { id: string; code: string; courseName: string; semester: string }[]
    onSuccess: () => void
}

// ============================================
// COMPONENT
// ============================================

export function CreateQuizModal({
    open,
    onOpenChange,
    offerings,
    onSuccess,
}: CreateQuizModalProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            title: "",
            description: "",
            offeringId: "",
            duration: 30,
            passingScore: 60,
        },
    })

    const onSubmit = (values: FormValues) => {
        startTransition(async () => {
            const result = await createQuiz(values)

            if (result.success && result.data) {
                toast.success("تم إنشاء الكويز بنجاح")
                form.reset()
                onOpenChange(false)
                onSuccess()
                // Navigate to edit page
                router.push(`/quizzes/${result.data.id}/edit`)
            } else {
                toast.error(result.error ?? "فشل في إنشاء الكويز")
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>إنشاء كويز جديد</DialogTitle>
                    <DialogDescription>
                        اختر الشعبة وأدخل المعلومات الأساسية للكويز
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="offeringId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>الشعبة *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="اختر الشعبة" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
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
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>عنوان الكويز *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="مثال: الاختبار الأول" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>الوصف (اختياري)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="وصف مختصر للكويز..."
                                            {...field}
                                            rows={2}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="duration"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>المدة (بالدقائق) *</FormLabel>
                                        <FormControl>
                                            <Input type="number" min={5} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="passingScore"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>درجة النجاح (%) *</FormLabel>
                                        <FormControl>
                                            <Input type="number" min={0} max={100} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                إلغاء
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                إنشاء وتعديل الأسئلة
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
