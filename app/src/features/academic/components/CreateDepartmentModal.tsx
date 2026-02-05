"use client"

/**
 * Create Department Modal
 * 
 * Modal for creating a new department under a college.
 * 
 * @module features/academic/components/CreateDepartmentModal
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
import { createDepartment } from "@/features/academic/actions"

// ============================================
// SCHEMA
// ============================================

const formSchema = z.object({
    collegeId: z.string().min(1, "يجب تحديد الكلية"),
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

interface CreateDepartmentModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    colleges: { id: string; nameAr: string }[]
    defaultCollegeId: string | null
    onSuccess: () => void
}

// ============================================
// COMPONENT
// ============================================

export function CreateDepartmentModal({
    open,
    onOpenChange,
    colleges,
    defaultCollegeId,
    onSuccess,
}: CreateDepartmentModalProps) {
    const [isPending, startTransition] = useTransition()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            collegeId: defaultCollegeId ?? "",
            code: "",
            nameAr: "",
            nameEn: "",
            description: "",
        },
    })

    // Update collegeId when defaultCollegeId changes
    useEffect(() => {
        if (defaultCollegeId) {
            form.setValue("collegeId", defaultCollegeId)
        }
    }, [defaultCollegeId, form])

    const onSubmit = (values: FormValues) => {
        startTransition(async () => {
            const result = await createDepartment(values)

            if (result.success) {
                toast.success("تم إنشاء القسم بنجاح")
                form.reset()
                onOpenChange(false)
                onSuccess()
            } else {
                toast.error(result.error ?? "فشل في إنشاء القسم")
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>إضافة قسم جديد</DialogTitle>
                    <DialogDescription>
                        أدخل بيانات القسم الجديد
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="collegeId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>الكلية *</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="اختر الكلية" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {colleges.map((college) => (
                                                <SelectItem key={college.id} value={college.id}>
                                                    {college.nameAr}
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
                                    <FormLabel>كود القسم *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="مثال: CS" {...field} />
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
                                        <Input placeholder="مثال: قسم علوم الحاسب" {...field} />
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
                                            placeholder="مثال: Computer Science Department"
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
                                            placeholder="وصف مختصر للقسم"
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
                                إنشاء القسم
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
