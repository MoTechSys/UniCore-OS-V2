"use client"

/**
 * Create Major Modal
 * 
 * Modal for creating a new major under a department.
 * 
 * @module features/academic/components/CreateMajorModal
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
import { createMajor } from "@/features/academic/actions"

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
    totalCredits: z.coerce.number().min(0, "الساعات يجب أن تكون 0 أو أكثر"),
})

type FormValues = z.infer<typeof formSchema>

// ============================================
// TYPES
// ============================================

interface CreateMajorModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    departments: { id: string; nameAr: string }[]
    defaultDepartmentId: string | null
    onSuccess: () => void
}

// ============================================
// COMPONENT
// ============================================

export function CreateMajorModal({
    open,
    onOpenChange,
    departments,
    defaultDepartmentId,
    onSuccess,
}: CreateMajorModalProps) {
    const [isPending, startTransition] = useTransition()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            departmentId: defaultDepartmentId ?? "",
            code: "",
            nameAr: "",
            nameEn: "",
            description: "",
            totalCredits: 0,
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
            const result = await createMajor(values)

            if (result.success) {
                toast.success("تم إنشاء التخصص بنجاح")
                form.reset()
                onOpenChange(false)
                onSuccess()
            } else {
                toast.error(result.error ?? "فشل في إنشاء التخصص")
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>إضافة تخصص جديد</DialogTitle>
                    <DialogDescription>
                        أدخل بيانات التخصص الجديد
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
                                    <FormLabel>كود التخصص *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="مثال: CS-AI" {...field} />
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
                                        <Input placeholder="مثال: الذكاء الاصطناعي" {...field} />
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
                                            placeholder="مثال: Artificial Intelligence"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="totalCredits"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>إجمالي الساعات المعتمدة</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={0}
                                            placeholder="مثال: 136"
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
                                            placeholder="وصف مختصر للتخصص"
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
                                إنشاء التخصص
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
