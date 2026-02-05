"use client"

/**
 * Create College Modal
 * 
 * Modal for creating a new college.
 * 
 * @module features/academic/components/CreateCollegeModal
 */

import { useState, useTransition } from "react"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { createCollege } from "@/features/academic/actions"

// ============================================
// SCHEMA
// ============================================

const formSchema = z.object({
    code: z
        .string()
        .min(2, "الكود يجب أن يكون حرفين على الأقل")
        .max(10, "الكود يجب ألا يتجاوز 10 أحرف"),
    nameAr: z.string().min(2, "الاسم العربي يجب أن يكون حرفين على الأقل"),
    nameEn: z.string().optional(),
    description: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

// ============================================
// TYPES
// ============================================

interface CreateCollegeModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

// ============================================
// COMPONENT
// ============================================

export function CreateCollegeModal({
    open,
    onOpenChange,
    onSuccess,
}: CreateCollegeModalProps) {
    const [isPending, startTransition] = useTransition()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            code: "",
            nameAr: "",
            nameEn: "",
            description: "",
        },
    })

    const onSubmit = (values: FormValues) => {
        startTransition(async () => {
            const result = await createCollege(values)

            if (result.success) {
                toast.success("تم إنشاء الكلية بنجاح")
                form.reset()
                onOpenChange(false)
                onSuccess()
            } else {
                toast.error(result.error ?? "فشل في إنشاء الكلية")
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>إضافة كلية جديدة</DialogTitle>
                    <DialogDescription>
                        أدخل بيانات الكلية الجديدة
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>كود الكلية *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="مثال: ENG" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="nameAr"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>الاسم بالعربية *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="مثال: كلية الهندسة" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="nameEn"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>الاسم بالإنجليزية</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="مثال: College of Engineering"
                                            {...field}
                                        />
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
                                            placeholder="وصف مختصر للكلية"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
                                إنشاء الكلية
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
