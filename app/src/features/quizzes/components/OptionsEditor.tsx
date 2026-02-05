"use client"

/**
 * Options Editor Component
 * 
 * Edits options for MCQ and True/False questions.
 * 
 * @module features/quizzes/components/OptionsEditor
 */

import { useFieldArray, UseFormReturn } from "react-hook-form"
import { Plus, Trash2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

// ============================================
// TYPES
// ============================================

interface OptionsEditorProps {
    questionIndex: number
    form: UseFormReturn<any>
    isReadOnly: boolean
    questionType: "MULTIPLE_CHOICE" | "TRUE_FALSE"
}

// ============================================
// COMPONENT
// ============================================

export function OptionsEditor({
    questionIndex,
    form,
    isReadOnly,
    questionType,
}: OptionsEditorProps) {
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: `questions.${questionIndex}.options`,
    })

    const setCorrectAnswer = (optionIndex: number) => {
        // Set the selected option as correct, others as incorrect
        fields.forEach((_, idx) => {
            form.setValue(
                `questions.${questionIndex}.options.${idx}.isCorrect`,
                idx === optionIndex
            )
        })
    }

    const addOption = () => {
        append({
            text: "",
            isCorrect: false,
            order: fields.length,
        })
    }

    const isTrueFalse = questionType === "TRUE_FALSE"

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <FormLabel>الخيارات</FormLabel>
                {!isReadOnly && !isTrueFalse && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addOption}
                    >
                        <Plus className="h-4 w-4 ml-1" />
                        إضافة خيار
                    </Button>
                )}
            </div>

            <div className="space-y-2">
                {fields.map((field, optionIndex) => {
                    const isCorrect = form.watch(
                        `questions.${questionIndex}.options.${optionIndex}.isCorrect`
                    )

                    return (
                        <div
                            key={field.id}
                            className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                                isCorrect
                                    ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                                    : "border-border"
                            )}
                        >
                            {/* Correct Answer Indicator */}
                            <button
                                type="button"
                                onClick={() => !isReadOnly && setCorrectAnswer(optionIndex)}
                                className={cn(
                                    "flex items-center justify-center h-6 w-6 rounded-full border-2 transition-colors",
                                    isCorrect
                                        ? "border-green-500 bg-green-500 text-white"
                                        : "border-gray-300 hover:border-green-400"
                                )}
                                disabled={isReadOnly}
                                title={isCorrect ? "الإجابة الصحيحة" : "تحديد كإجابة صحيحة"}
                            >
                                {isCorrect && <CheckCircle2 className="h-4 w-4" />}
                            </button>

                            {/* Option Text */}
                            <div className="flex-1">
                                <FormField
                                    control={form.control}
                                    name={`questions.${questionIndex}.options.${optionIndex}.text`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder={`الخيار ${optionIndex + 1}`}
                                                    disabled={isReadOnly || isTrueFalse}
                                                    className={cn(
                                                        "border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
                                                        isTrueFalse && "font-medium"
                                                    )}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Delete Button (not for True/False) */}
                            {!isReadOnly && !isTrueFalse && fields.length > 2 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => remove(optionIndex)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}

                            {/* Correct Label */}
                            {isCorrect && (
                                <span className="text-xs text-green-600 font-medium">
                                    صحيح
                                </span>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Help Text */}
            <p className="text-xs text-muted-foreground">
                اضغط على الدائرة لتحديد الإجابة الصحيحة
            </p>
        </div>
    )
}
