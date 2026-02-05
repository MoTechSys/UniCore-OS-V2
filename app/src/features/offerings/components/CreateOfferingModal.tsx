"use client"

/**
 * Create Offering Modal
 * 
 * Modal for creating a new course offering (section).
 * 
 * @module features/offerings/components/CreateOfferingModal
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
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { createOffering } from "@/features/offerings/actions"
import type { SemesterData } from "@/features/semesters/actions"

// ============================================
// SCHEMA
// ============================================

const formSchema = z.object({
    courseId: z.string().min(1, "يجب اختيار المقرر"),
    semesterId: z.string().min(1, "يجب اختيار الفصل الدراسي"),
    instructorId: z.string().min(1, "يجب اختيار المحاضر"),
    section: z.string().min(1, "اسم الشعبة مطلوب"),
    maxStudents: z.coerce.number().min(1, "السعة يجب أن تكون 1 على الأقل"),
})

type FormValues = z.infer<typeof formSchema>

// ============================================
// TYPES
// ============================================

interface CreateOfferingModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    semesters: SemesterData[]
    courses: { id: string; code: string; nameAr: string; department: string }[]
    instructors: { id: string; name: string; email: string }[]
    defaultSemesterId?: string
    onSuccess: () => void
}

// ============================================
// COMPONENT
// ============================================

export function CreateOfferingModal({
    open,
    onOpenChange,
    semesters,
    courses,
    instructors,
    defaultSemesterId,
    onSuccess,
}: CreateOfferingModalProps) {
    const [isPending, startTransition] = useTransition()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            courseId: "",
            semesterId: defaultSemesterId ?? "",
            instructorId: "",
            section: "A1",
            maxStudents: 50,
        },
    })

    // Update semesterId when defaultSemesterId changes
    useEffect(() => {
        if (defaultSemesterId) {
            form.setValue("semesterId", defaultSemesterId)
        }
    }, [defaultSemesterId, form])

    const onSubmit = (values: FormValues) => {
        startTransition(async () => {
            const result = await createOffering(values)

            if (result.success) {
                toast.success("تم إنشاء الشعبة بنجاح")
                form.reset()
                onOpenChange(false)
                onSuccess()
            } else {
                toast.error(result.error ?? "فشل في إنشاء الشعبة")
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>إضافة شعبة جديدة</DialogTitle>
                    <DialogDescription>
                        اختر المقرر والفصل الدراسي وأدخل بيانات الشعبة
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="semesterId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>الفصل الدراسي *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="اختر الفصل" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {semesters.map((semester) => (
                                                <SelectItem key={semester.id} value={semester.id}>
                                                    {semester.nameAr}
                                                    {semester.isCurrent && " (حالي)"}
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
                            name="courseId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>المقرر *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="اختر المقرر" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {courses.map((course) => (
                                                <SelectItem key={course.id} value={course.id}>
                                                    {course.code} - {course.nameAr}
                                                    <span className="text-muted-foreground text-xs mr-2">
                                                        ({course.department})
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
                            name="instructorId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>المحاضر *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="اختر المحاضر" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {instructors.map((instructor) => (
                                                <SelectItem key={instructor.id} value={instructor.id}>
                                                    {instructor.name}
                                                    <span className="text-muted-foreground text-xs mr-2">
                                                        ({instructor.email})
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="section"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>اسم الشعبة *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="مثال: A1" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="maxStudents"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>السعة القصوى *</FormLabel>
                                        <FormControl>
                                            <Input type="number" min={1} {...field} />
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
                                إنشاء الشعبة
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
