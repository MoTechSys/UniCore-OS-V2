"use client"

/**
 * AI Question Generator Modal
 * 
 * Modal for generating quiz questions using AI.
 * 
 * @module features/quizzes/components/AIQuestionGenerator
 */

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { safeZodResolver } from "@/lib/form-resolver"
import { z } from "zod"
import {
    Sparkles,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Wand2,
    ListChecks,
    ToggleLeft,
    MessageSquare,
} from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import { generateQuestions, type GeneratedQuestion } from "@/features/ai/actions"

// ============================================
// TYPES
// ============================================

interface AIQuestionGeneratorProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onQuestionsGenerated: (questions: GeneratedQuestion[]) => void
}

// ============================================
// FORM SCHEMA
// ============================================

const formSchema = z.object({
    topic: z.string().min(10, "الموضوع يجب أن يكون 10 أحرف على الأقل"),
    count: z.number().min(1).max(20),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
    questionTypes: z.array(z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"])).min(1),
    language: z.enum(["ar", "en"]),
})

type FormValues = z.infer<typeof formSchema>

// ============================================
// QUESTION TYPE CONFIG
// ============================================

const questionTypeOptions = [
    {
        value: "MULTIPLE_CHOICE" as const,
        label: "اختيار من متعدد",
        description: "4 خيارات مع إجابة صحيحة واحدة",
        icon: ListChecks,
    },
    {
        value: "TRUE_FALSE" as const,
        label: "صح / خطأ",
        description: "إجابة بنعم أو لا",
        icon: ToggleLeft,
    },
    {
        value: "SHORT_ANSWER" as const,
        label: "إجابة قصيرة",
        description: "إجابة نصية مكتوبة",
        icon: MessageSquare,
    },
]

const difficultyOptions = [
    { value: "EASY", label: "سهل", color: "bg-green-100 text-green-700" },
    { value: "MEDIUM", label: "متوسط", color: "bg-yellow-100 text-yellow-700" },
    { value: "HARD", label: "صعب", color: "bg-red-100 text-red-700" },
]

// ============================================
// COMPONENT
// ============================================

export function AIQuestionGenerator({
    open,
    onOpenChange,
    onQuestionsGenerated,
}: AIQuestionGeneratorProps) {
    const [isPending, startTransition] = useTransition()
    const [result, setResult] = useState<{
        status: "idle" | "success" | "error"
        message?: string
        count?: number
    }>({ status: "idle" })

    const form = useForm<FormValues>({
        resolver: safeZodResolver<FormValues>(formSchema),
        defaultValues: {
            topic: "",
            count: 5,
            difficulty: "MEDIUM",
            questionTypes: ["MULTIPLE_CHOICE"],
            language: "ar",
        },
    })

    const watchedTypes = form.watch("questionTypes")

    const handleSubmit = (values: FormValues) => {
        setResult({ status: "idle" })

        startTransition(async () => {
            const response = await generateQuestions(values)

            if (response.success && response.data) {
                setResult({
                    status: "success",
                    message: `تم توليد ${response.data.length} سؤال بنجاح!`,
                    count: response.data.length,
                })

                // Pass questions to parent
                onQuestionsGenerated(response.data)

                // Close after short delay
                setTimeout(() => {
                    onOpenChange(false)
                    setResult({ status: "idle" })
                    form.reset()
                }, 1500)
            } else {
                setResult({
                    status: "error",
                    message: response.error ?? "فشل في توليد الأسئلة",
                })
            }
        })
    }

    const toggleQuestionType = (type: FormValues["questionTypes"][number]) => {
        const current = form.getValues("questionTypes")
        if (current.includes(type)) {
            if (current.length > 1) {
                form.setValue(
                    "questionTypes",
                    current.filter((t) => t !== type)
                )
            }
        } else {
            form.setValue("questionTypes", [...current, type])
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-500" />
                        توليد أسئلة بالذكاء الاصطناعي
                    </DialogTitle>
                    <DialogDescription>
                        أدخل موضوع الأسئلة وحدد الإعدادات، وسيقوم الذكاء الاصطناعي بتوليد
                        الأسئلة تلقائياً.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                        {/* Topic */}
                        <FormField
                            control={form.control}
                            name="topic"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>موضوع الأسئلة</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="مثال: الفصل الثالث من مقرر قواعد البيانات - النماذج العلائقية ومفاتيح الجداول..."
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        كلما كان الوصف أكثر تفصيلاً، كانت الأسئلة أدق.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Count */}
                        <FormField
                            control={form.control}
                            name="count"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>عدد الأسئلة: {field.value}</FormLabel>
                                    <FormControl>
                                        <Slider
                                            min={1}
                                            max={20}
                                            step={1}
                                            value={[field.value]}
                                            onValueChange={([value]) => field.onChange(value)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Difficulty */}
                        <FormField
                            control={form.control}
                            name="difficulty"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>مستوى الصعوبة</FormLabel>
                                    <div className="flex gap-2">
                                        {difficultyOptions.map((option) => (
                                            <Badge
                                                key={option.value}
                                                variant="outline"
                                                className={`cursor-pointer px-4 py-2 text-sm transition-all ${field.value === option.value
                                                    ? option.color
                                                    : "hover:bg-muted"
                                                    }`}
                                                onClick={() => field.onChange(option.value)}
                                            >
                                                {option.label}
                                            </Badge>
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Question Types */}
                        <FormField
                            control={form.control}
                            name="questionTypes"
                            render={() => (
                                <FormItem>
                                    <FormLabel>أنواع الأسئلة</FormLabel>
                                    <div className="grid gap-2">
                                        {questionTypeOptions.map((option) => {
                                            const Icon = option.icon
                                            const isSelected = watchedTypes.includes(option.value)

                                            return (
                                                <div
                                                    key={option.value}
                                                    onClick={() => toggleQuestionType(option.value)}
                                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isSelected
                                                        ? "border-primary bg-primary/5"
                                                        : "border-border hover:border-primary/50"
                                                        }`}
                                                >
                                                    <Checkbox checked={isSelected} />
                                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                                    <div className="flex-1">
                                                        <p className="font-medium text-sm">{option.label}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {option.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Language */}
                        <FormField
                            control={form.control}
                            name="language"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>لغة الأسئلة</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="ar">العربية</SelectItem>
                                            <SelectItem value="en">English</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Result Alert */}
                        {result.status === "success" && (
                            <Alert className="border-green-200 bg-green-50">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <AlertTitle className="text-green-700">نجح!</AlertTitle>
                                <AlertDescription className="text-green-600">
                                    {result.message}
                                </AlertDescription>
                            </Alert>
                        )}

                        {result.status === "error" && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>فشل</AlertTitle>
                                <AlertDescription>{result.message}</AlertDescription>
                            </Alert>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isPending}
                            >
                                إلغاء
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                                        جارٍ التوليد...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="h-4 w-4 ml-2" />
                                        توليد الأسئلة
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
