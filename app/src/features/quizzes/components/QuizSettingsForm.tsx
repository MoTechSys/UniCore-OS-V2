"use client"

/**
 * Quiz Settings Form
 * 
 * Form to edit quiz settings (title, duration, etc.)
 * 
 * @module features/quizzes/components/QuizSettingsForm
 */

import { useTransition } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Save } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { updateQuiz, type QuizDetails } from "@/features/quizzes/actions"

// ============================================
// SCHEMA
// ============================================

const formSchema = z.object({
    title: z.string().min(3, "العنوان يجب أن يكون 3 أحرف على الأقل"),
    description: z.string().optional(),
    duration: z.coerce.number().min(5, "المدة يجب أن تكون 5 دقائق على الأقل"),
    passingScore: z.coerce.number().min(0).max(100),
    shuffleQuestions: z.boolean(),
    shuffleOptions: z.boolean(),
    showResults: z.boolean(),
    allowReview: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

// ============================================
// TYPES
// ============================================

interface QuizSettingsFormProps {
    quiz: QuizDetails
    isReadOnly: boolean
    onSaved: () => void
}

// ============================================
// COMPONENT
// ============================================

export function QuizSettingsForm({
    quiz,
    isReadOnly,
    onSaved,
}: QuizSettingsFormProps) {
    const [isPending, startTransition] = useTransition()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            title: quiz.title,
            description: quiz.description ?? "",
            duration: quiz.duration,
            passingScore: quiz.passingScore,
            shuffleQuestions: quiz.shuffleQuestions,
            shuffleOptions: quiz.shuffleOptions,
            showResults: quiz.showResults,
            allowReview: quiz.allowReview,
        },
    })

    const onSubmit = (values: FormValues) => {
        startTransition(async () => {
            const result = await updateQuiz({
                id: quiz.id,
                ...values,
            })

            if (result.success) {
                onSaved()
            } else {
                toast.error(result.error ?? "فشل في حفظ الإعدادات")
            }
        })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">المعلومات الأساسية</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>عنوان الكويز *</FormLabel>
                                    <FormControl>
                                        <Input {...field} disabled={isReadOnly} />
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
                                    <FormLabel>الوصف</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            rows={3}
                                            placeholder="وصف مختصر للكويز..."
                                            disabled={isReadOnly}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Quiz Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">إعدادات الكويز</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="duration"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>المدة (بالدقائق) *</FormLabel>
                                        <FormControl>
                                            <Input type="number" min={5} {...field} disabled={isReadOnly} />
                                        </FormControl>
                                        <FormDescription>
                                            الوقت المحدد لإكمال الكويز
                                        </FormDescription>
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
                                            <Input
                                                type="number"
                                                min={0}
                                                max={100}
                                                {...field}
                                                disabled={isReadOnly}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            النسبة المئوية المطلوبة للنجاح
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Behavior Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">خيارات السلوك</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="shuffleQuestions"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">خلط الأسئلة</FormLabel>
                                        <FormDescription>
                                            عرض الأسئلة بترتيب عشوائي لكل طالب
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={isReadOnly}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="shuffleOptions"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">خلط الخيارات</FormLabel>
                                        <FormDescription>
                                            عرض خيارات الإجابة بترتيب عشوائي
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={isReadOnly}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="showResults"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">عرض النتيجة</FormLabel>
                                        <FormDescription>
                                            عرض النتيجة للطالب بعد التسليم
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={isReadOnly}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="allowReview"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">السماح بالمراجعة</FormLabel>
                                        <FormDescription>
                                            السماح للطالب بمراجعة إجاباته بعد التسليم
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={isReadOnly}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Submit */}
                {!isReadOnly && (
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                            <Save className="h-4 w-4 ml-2" />
                            حفظ الإعدادات
                        </Button>
                    </div>
                )}
            </form>
        </Form>
    )
}
