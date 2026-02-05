"use client"

/**
 * Create Course Modal
 * 
 * Modal for creating a new course under a department.
 * 
 * @module features/academic/components/CreateCourseModal
 */

import { useEffect, useTransition } from "react"
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
import { createCourse } from "@/features/academic/actions"

// ============================================
// SCHEMA
// ============================================

const formSchema = z.object({
    departmentId: z.string().min(1, "يجب تحديد القسم"),
    code: z
        .string()
        .min(2, "الكود يجب أن يكون حرفين على الأقل")
        .max(10, "الكود يجب ألا يتجاوز 10 أحرف"),
    nameAr: z.string().min(2, "الاسم العربي يجب أن يكون حرفين على الأقل"),
    nameEn: z.string().optional(),
    description: z.string().optional(),
    credits: z.coerce
        .number()
        .min(1, "الساعات يجب أن تكون 1 على الأقل")
        .max(6, "الساعات يجب ألا تتجاوز 6"),
})

type FormValues = z.infer<typeof formSchema>

// ============================================
// TYPES
// ============================================

interface CreateCourseModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    departments: { id: string; nameAr: string }[]
    defaultDepartmentId: string | null
    onSuccess: () => void
}

// ============================================
// COMPONENT
// ============================================

export function CreateCourseModal({
    open,
    onOpenChange,
    departments,
    defaultDepartmentId,
    onSuccess,
}: CreateCourseModalProps) {
    const [isPending, startTransition] = useTransition()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            departmentId: defaultDepartmentId ?? "",
            code: "",
            nameAr: "",
            nameEn: "",
            description: "",
            credits: 3,
        },
    })

    // Update departmentId when defaultDepartmentId changes
    useEffect(() => {
        if (defaultDepartmentId) {
            form.setValue("departmentId", defaultDepartmentId)
        }
    }, [defaultDepartmentId, form])

    const onSubmit = (values: FormValues) => {
        startTransition(async () => {
            const result = await createCourse(values)

            if (result.success) {
                toast.success("تم إنشاء المقرر بنجاح")
                form.reset()
                onOpenChange(false)
                onSuccess()
            } else {
                toast.error(result.error ?? "فشل في إنشاء المقرر")
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>إضافة مقرر جديد</DialogTitle>
                    <DialogDescription>
                        أدخل بيانات المقرر الجديد
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="departmentId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>القسم *</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="اختر القسم" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {departments.map((dept) => (
                                                <SelectItem key={dept.id} value={dept.id}>
                                                    {dept.nameAr}
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
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>كود المقرر *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="مثال: CS101" {...field} />
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
                                        <Input placeholder="مثال: مقدمة في البرمجة" {...field} />
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
                                            placeholder="مثال: Introduction to Programming"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="credits"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>الساعات المعتمدة *</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={6}
                                            placeholder="3"
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
                                            placeholder="وصف مختصر للمقرر"
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
                                إنشاء المقرر
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
