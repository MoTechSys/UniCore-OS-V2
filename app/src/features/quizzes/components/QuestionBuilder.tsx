"use client"

/**
 * Question Builder (Dynamic Form)
 * 
 * Uses useFieldArray for dynamic question management.
 * Supports: MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER
 * 
 * @module features/quizzes/components/QuestionBuilder
 */

import { useState, useEffect, useTransition } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
    Plus,
    Trash2,
    GripVertical,
    Save,
    Loader2,
    ListChecks,
    ToggleLeft,
    MessageSquare,
    AlertCircle,
    Sparkles,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { saveAllQuestions } from "@/features/quizzes/actions/questions"
import { OptionsEditor } from "./OptionsEditor"
import { AIQuestionGenerator } from "./AIQuestionGenerator"
import type { GeneratedQuestion } from "@/features/ai/actions"

// ============================================
// TYPES & SCHEMA
// ============================================

const optionSchema = z.object({
    id: z.string().optional(),
    text: z.string().min(1, "نص الخيار مطلوب"),
    isCorrect: z.boolean(),
    order: z.number(),
})

const questionSchema = z.object({
    id: z.string().optional(),
    type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"]),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
    text: z.string().min(3, "نص السؤال يجب أن يكون 3 أحرف على الأقل"),
    explanation: z.string().optional(),
    points: z.coerce.number().min(0.5),
    order: z.number(),
    options: z.array(optionSchema),
})

const formSchema = z.object({
    questions: z.array(questionSchema),
})

type FormValues = z.infer<typeof formSchema>
type QuestionData = z.infer<typeof questionSchema>

interface QuestionBuilderProps {
    quizId: string
    initialQuestions: QuestionData[]
    isReadOnly: boolean
    onSaved: () => void
    onDirtyChange: (isDirty: boolean) => void
}

// ============================================
// QUESTION TYPE CONFIG
// ============================================

const questionTypeConfig = {
    MULTIPLE_CHOICE: {
        label: "اختيار من متعدد",
        icon: ListChecks,
        color: "text-blue-500",
        defaultOptions: [
            { text: "", isCorrect: true, order: 0 },
            { text: "", isCorrect: false, order: 1 },
            { text: "", isCorrect: false, order: 2 },
            { text: "", isCorrect: false, order: 3 },
        ],
    },
    TRUE_FALSE: {
        label: "صح / خطأ",
        icon: ToggleLeft,
        color: "text-green-500",
        defaultOptions: [
            { text: "صح", isCorrect: true, order: 0 },
            { text: "خطأ", isCorrect: false, order: 1 },
        ],
    },
    SHORT_ANSWER: {
        label: "إجابة قصيرة",
        icon: MessageSquare,
        color: "text-purple-500",
        defaultOptions: [],
    },
}

const difficultyConfig = {
    EASY: { label: "سهل", color: "bg-green-100 text-green-800" },
    MEDIUM: { label: "متوسط", color: "bg-yellow-100 text-yellow-800" },
    HARD: { label: "صعب", color: "bg-red-100 text-red-800" },
}

// ============================================
// COMPONENT
// ============================================

export function QuestionBuilder({
    quizId,
    initialQuestions,
    isReadOnly,
    onSaved,
    onDirtyChange,
}: QuestionBuilderProps) {
    const [isPending, startTransition] = useTransition()
    const [showAIGenerator, setShowAIGenerator] = useState(false)

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            questions: initialQuestions.length > 0 ? initialQuestions : [],
        },
    })

    const { fields, append, remove, move } = useFieldArray({
        control: form.control,
        name: "questions",
    })

    // Watch for dirty state
    useEffect(() => {
        const subscription = form.watch(() => {
            onDirtyChange(form.formState.isDirty)
        })
        return () => subscription.unsubscribe()
    }, [form, onDirtyChange])

    const addQuestion = (type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER") => {
        const config = questionTypeConfig[type]
        append({
            type,
            difficulty: "MEDIUM",
            text: "",
            explanation: "",
            points: 1,
            order: fields.length,
            options: config.defaultOptions.map((o, i) => ({ ...o, order: i })),
        })
    }

    // Handle AI generated questions
    const handleAIQuestions = (questions: GeneratedQuestion[]) => {
        questions.forEach((q) => {
            append({
                type: q.type,
                difficulty: q.difficulty,
                text: q.text,
                explanation: q.explanation ?? "",
                points: q.points,
                order: fields.length,
                options: q.options.map((o, i) => ({ text: o.text, isCorrect: o.isCorrect, order: i })),
            })
        })
    }

    const onSubmit = (values: FormValues) => {
        // Validate MCQ has correct answer
        for (const q of values.questions) {
            if (q.type === "MULTIPLE_CHOICE") {
                if (q.options.length < 2) {
                    toast.error(`السؤال "${q.text.substring(0, 30)}..." يجب أن يحتوي على خيارين على الأقل`)
                    return
                }
                if (!q.options.some((o) => o.isCorrect)) {
                    toast.error(`السؤال "${q.text.substring(0, 30)}..." يجب أن يحتوي على إجابة صحيحة`)
                    return
                }
            }
        }

        startTransition(async () => {
            const result = await saveAllQuestions({
                quizId,
                questions: values.questions.map((q, i) => ({ ...q, order: i })),
            })

            if (result.success) {
                form.reset(values) // Reset dirty state
                onSaved()
            } else {
                toast.error(result.error ?? "فشل في حفظ الأسئلة")
            }
        })
    }

    const moveQuestion = (from: number, to: number) => {
        if (to >= 0 && to < fields.length) {
            move(from, to)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Add Question Buttons */}
                {!isReadOnly && (
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => addQuestion("MULTIPLE_CHOICE")}
                        >
                            <ListChecks className="h-4 w-4 ml-2" />
                            اختيار من متعدد
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => addQuestion("TRUE_FALSE")}
                        >
                            <ToggleLeft className="h-4 w-4 ml-2" />
                            صح / خطأ
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => addQuestion("SHORT_ANSWER")}
                        >
                            <MessageSquare className="h-4 w-4 ml-2" />
                            إجابة قصيرة
                        </Button>

                        {/* AI Generator Button */}
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setShowAIGenerator(true)}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                        >
                            <Sparkles className="h-4 w-4 ml-2" />
                            توليد بالذكاء الاصطناعي
                        </Button>
                    </div>
                )}

                {/* Questions List */}
                {fields.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <AlertCircle className="h-12 w-12 text-muted-foreground/50" />
                            <h3 className="mt-4 text-lg font-medium">لا توجد أسئلة</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                أضف سؤالاً باستخدام الأزرار أعلاه
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <Accordion type="multiple" className="space-y-4">
                        {fields.map((field, index) => {
                            const typeConfig = questionTypeConfig[field.type as keyof typeof questionTypeConfig]
                            const TypeIcon = typeConfig?.icon ?? ListChecks

                            return (
                                <AccordionItem
                                    key={field.id}
                                    value={field.id}
                                    className="border rounded-lg"
                                >
                                    <AccordionTrigger className="px-4 hover:no-underline">
                                        <div className="flex items-center gap-3 flex-1">
                                            {!isReadOnly && (
                                                <div className="flex gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            moveQuestion(index, index - 1)
                                                        }}
                                                        disabled={index === 0}
                                                    >
                                                        ↑
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            moveQuestion(index, index + 1)
                                                        }}
                                                        disabled={index === fields.length - 1}
                                                    >
                                                        ↓
                                                    </Button>
                                                </div>
                                            )}
                                            <Badge variant="outline" className="font-mono">
                                                {index + 1}
                                            </Badge>
                                            <TypeIcon className={`h-4 w-4 ${typeConfig?.color}`} />
                                            <span className="text-sm truncate max-w-[300px]">
                                                {form.watch(`questions.${index}.text`) || "سؤال جديد"}
                                            </span>
                                            <Badge variant="secondary" className="text-xs">
                                                {form.watch(`questions.${index}.points`)} نقطة
                                            </Badge>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-4 pb-4">
                                        <div className="space-y-4">
                                            {/* Question Type & Difficulty */}
                                            <div className="grid gap-4 sm:grid-cols-3">
                                                <FormField
                                                    control={form.control}
                                                    name={`questions.${index}.type`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>نوع السؤال</FormLabel>
                                                            <Select
                                                                value={field.value}
                                                                onValueChange={(value) => {
                                                                    field.onChange(value)
                                                                    // Update options when type changes
                                                                    const config = questionTypeConfig[value as keyof typeof questionTypeConfig]
                                                                    form.setValue(
                                                                        `questions.${index}.options`,
                                                                        config.defaultOptions
                                                                    )
                                                                }}
                                                                disabled={isReadOnly}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="MULTIPLE_CHOICE">
                                                                        اختيار من متعدد
                                                                    </SelectItem>
                                                                    <SelectItem value="TRUE_FALSE">
                                                                        صح / خطأ
                                                                    </SelectItem>
                                                                    <SelectItem value="SHORT_ANSWER">
                                                                        إجابة قصيرة
                                                                    </SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name={`questions.${index}.difficulty`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>الصعوبة</FormLabel>
                                                            <Select
                                                                value={field.value}
                                                                onValueChange={field.onChange}
                                                                disabled={isReadOnly}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="EASY">سهل</SelectItem>
                                                                    <SelectItem value="MEDIUM">متوسط</SelectItem>
                                                                    <SelectItem value="HARD">صعب</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name={`questions.${index}.points`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>النقاط</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    step={0.5}
                                                                    min={0.5}
                                                                    {...field}
                                                                    disabled={isReadOnly}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            {/* Question Text */}
                                            <FormField
                                                control={form.control}
                                                name={`questions.${index}.text`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>نص السؤال *</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                {...field}
                                                                rows={2}
                                                                placeholder="اكتب نص السؤال هنا..."
                                                                disabled={isReadOnly}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Options (for MCQ and TF) */}
                                            {(form.watch(`questions.${index}.type`) === "MULTIPLE_CHOICE" ||
                                                form.watch(`questions.${index}.type`) === "TRUE_FALSE") && (
                                                    <OptionsEditor
                                                        questionIndex={index}
                                                        form={form}
                                                        isReadOnly={isReadOnly}
                                                        questionType={form.watch(`questions.${index}.type`)}
                                                    />
                                                )}

                                            {/* Short Answer Note */}
                                            {form.watch(`questions.${index}.type`) === "SHORT_ANSWER" && (
                                                <Alert>
                                                    <AlertCircle className="h-4 w-4" />
                                                    <AlertDescription>
                                                        الإجابات القصيرة تتطلب تصحيحاً يدوياً من المدرس
                                                    </AlertDescription>
                                                </Alert>
                                            )}

                                            {/* Explanation */}
                                            <FormField
                                                control={form.control}
                                                name={`questions.${index}.explanation`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>شرح الإجابة (اختياري)</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                {...field}
                                                                rows={2}
                                                                placeholder="شرح يظهر للطالب بعد التسليم..."
                                                                disabled={isReadOnly}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Delete Button */}
                                            {!isReadOnly && (
                                                <div className="flex justify-end">
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => remove(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4 ml-1" />
                                                        حذف السؤال
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            )
                        })}
                    </Accordion>
                )}

                {/* Save Button */}
                {!isReadOnly && fields.length > 0 && (
                    <div className="flex justify-end sticky bottom-4">
                        <Button
                            type="submit"
                            size="lg"
                            disabled={isPending || !form.formState.isDirty}
                            className="shadow-lg"
                        >
                            {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                            <Save className="h-4 w-4 ml-2" />
                            حفظ جميع الأسئلة
                        </Button>
                    </div>
                )}

                {/* AI Generator Modal */}
                <AIQuestionGenerator
                    open={showAIGenerator}
                    onOpenChange={setShowAIGenerator}
                    onQuestionsGenerated={handleAIQuestions}
                />
            </form>
        </Form>
    )
}
