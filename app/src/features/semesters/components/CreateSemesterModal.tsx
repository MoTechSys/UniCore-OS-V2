"use client"

/**
 * Create Semester Modal
 * 
 * Modal for creating a new semester.
 * 
 * @module features/semesters/components/CreateSemesterModal
 */

import { useTransition } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { createSemester } from "@/features/semesters/actions"

// ============================================
// SCHEMA
// ============================================

const formSchema = z.object({
    code: z.string().min(3, "الكود يجب أن يكون 3 أحرف على الأقل"),
    nameAr: z.string().min(2, "الاسم العربي مطلوب"),
    nameEn: z.string().optional(),
    type: z.enum(["FIRST", "SECOND", "SUMMER"]),
    year: z.coerce.number().min(2020).max(2100),
    startDate: z.date(),
    endDate: z.date(),
})

type FormValues = z.infer<typeof formSchema>

// ============================================
// TYPES
// ============================================

interface CreateSemesterModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

// ============================================
// COMPONENT
// ============================================

export function CreateSemesterModal({
    open,
    onOpenChange,
    onSuccess,
}: CreateSemesterModalProps) {
    const [isPending, startTransition] = useTransition()

    const currentYear = new Date().getFullYear()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            code: "",
            nameAr: "",
            nameEn: "",
            type: "FIRST",
            year: currentYear,
            startDate: new Date(),
            endDate: new Date(),
        },
    })

    const onSubmit = (values: FormValues) => {
        startTransition(async () => {
            const result = await createSemester(values)

            if (result.success) {
                toast.success("تم إنشاء الفصل الدراسي بنجاح")
                form.reset()
                onOpenChange(false)
                onSuccess()
            } else {
                toast.error(result.error ?? "فشل في إنشاء الفصل")
            }
        })
    }

    // Auto-generate code based on year and type
    const watchType = form.watch("type")
    const watchYear = form.watch("year")

    const handleAutoGenerateCode = () => {
        const typeNum = watchType === "FIRST" ? "1" : watchType === "SECOND" ? "2" : "3"
        form.setValue("code", `${watchYear}-${typeNum}`)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>إضافة فصل دراسي جديد</DialogTitle>
                    <DialogDescription>
                        أدخل بيانات الفصل الدراسي الجديد
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="year"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>السنة *</FormLabel>
                                        <FormControl>
                                            <Input type="number" min={2020} max={2100} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>النوع *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="اختر النوع" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="FIRST">الفصل الأول</SelectItem>
                                                <SelectItem value="SECOND">الفصل الثاني</SelectItem>
                                                <SelectItem value="SUMMER">الفصل الصيفي</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex gap-2">
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel>الكود *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="مثال: 2025-1" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                className="mt-8"
                                onClick={handleAutoGenerateCode}
                            >
                                توليد
                            </Button>
                        </div>

                        <FormField
                            control={form.control}
                            name="nameAr"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>الاسم بالعربية *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="مثال: الفصل الأول 2025" {...field} />
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
                                        <Input placeholder="مثال: First Semester 2025" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>تاريخ البداية *</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full pl-3 text-right font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "yyyy-MM-dd")
                                                        ) : (
                                                            <span>اختر التاريخ</span>
                                                        )}
                                                        <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>تاريخ النهاية *</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full pl-3 text-right font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "yyyy-MM-dd")
                                                        ) : (
                                                            <span>اختر التاريخ</span>
                                                        )}
                                                        <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
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
                                إنشاء الفصل
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
