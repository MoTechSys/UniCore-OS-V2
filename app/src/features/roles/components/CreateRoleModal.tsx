"use client"

/**
 * Create Role Modal Component
 * 
 * Modal dialog for creating new roles with permission matrix.
 * Permissions are grouped by category with "Select All" functionality.
 * 
 * @module features/roles/components/CreateRoleModal
 */

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Shield, Loader2, ChevronDown, ChevronRight, Check } from "lucide-react"
import { toast } from "sonner"

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
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

import { createRole } from "../actions"

// ============================================
// TYPES
// ============================================

interface PermissionCategory {
  category: string
  categoryNameAr: string
  permissions: {
    id: string
    code: string
    nameAr: string
    nameEn: string
    description: string | null
  }[]
}

interface CreateRoleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  permissionCategories: PermissionCategory[]
  onSuccess: () => void
}

// ============================================
// VALIDATION SCHEMA
// ============================================

const createRoleSchema = z.object({
  code: z
    .string()
    .min(2, "الكود يجب أن يكون حرفين على الأقل")
    .max(50, "الكود يجب أن يكون أقل من 50 حرف")
    .regex(/^[A-Z_]+$/, "الكود يجب أن يكون بأحرف كبيرة وشرطات سفلية فقط"),
  nameAr: z.string().min(2, "الاسم العربي مطلوب"),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  permissionIds: z.array(z.string()),
})

type CreateRoleFormData = z.infer<typeof createRoleSchema>

// ============================================
// COMPONENT
// ============================================

export function CreateRoleModal({
  open,
  onOpenChange,
  permissionCategories,
  onSuccess,
}: CreateRoleModalProps) {
  const [isPending, startTransition] = useTransition()
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())

  const form = useForm<CreateRoleFormData>({
    resolver: zodResolver(createRoleSchema) as any,
    defaultValues: {
      code: "",
      nameAr: "",
      nameEn: "",
      description: "",
      permissionIds: [],
    },
  })

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  // Toggle single permission
  const togglePermission = (permissionId: string) => {
    const newSelected = new Set(selectedPermissions)
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId)
    } else {
      newSelected.add(permissionId)
    }
    setSelectedPermissions(newSelected)
    form.setValue("permissionIds", Array.from(newSelected))
  }

  // Toggle all permissions in a category
  const toggleCategoryAll = (category: PermissionCategory) => {
    const categoryPermissionIds = category.permissions.map(p => p.id)
    const allSelected = categoryPermissionIds.every(id => selectedPermissions.has(id))

    const newSelected = new Set(selectedPermissions)
    if (allSelected) {
      // Deselect all in category
      categoryPermissionIds.forEach(id => newSelected.delete(id))
    } else {
      // Select all in category
      categoryPermissionIds.forEach(id => newSelected.add(id))
    }
    setSelectedPermissions(newSelected)
    form.setValue("permissionIds", Array.from(newSelected))
  }

  // Check if all permissions in category are selected
  const isCategoryFullySelected = (category: PermissionCategory) => {
    return category.permissions.every(p => selectedPermissions.has(p.id))
  }

  // Check if some permissions in category are selected
  const isCategoryPartiallySelected = (category: PermissionCategory) => {
    const selected = category.permissions.filter(p => selectedPermissions.has(p.id))
    return selected.length > 0 && selected.length < category.permissions.length
  }

  // Get count of selected permissions in category
  const getCategorySelectedCount = (category: PermissionCategory) => {
    return category.permissions.filter(p => selectedPermissions.has(p.id)).length
  }

  const onSubmit = (data: CreateRoleFormData) => {
    startTransition(async () => {
      try {
        const result = await createRole({
          ...data,
          permissionIds: Array.from(selectedPermissions),
        })
        if (result.success) {
          toast.success("تم إنشاء الدور بنجاح")
          form.reset()
          setSelectedPermissions(new Set())
          setExpandedCategories(new Set())
          onOpenChange(false)
          onSuccess()
        } else {
          toast.error(result.error ?? "فشل في إنشاء الدور")
        }
      } catch {
        toast.error("حدث خطأ غير متوقع")
      }
    })
  }

  const handleClose = () => {
    if (!isPending) {
      form.reset()
      setSelectedPermissions(new Set())
      setExpandedCategories(new Set())
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            إضافة دور جديد
          </DialogTitle>
          <DialogDescription>
            أدخل بيانات الدور واختر الصلاحيات المطلوبة
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-6 px-1">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
                  المعلومات الأساسية
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كود الدور *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="MANAGER"
                            dir="ltr"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
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
                        <FormLabel>الاسم العربي *</FormLabel>
                        <FormControl>
                          <Input placeholder="مدير" {...field} />
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
                        <FormLabel>الاسم الإنجليزي</FormLabel>
                        <FormControl>
                          <Input placeholder="Manager" dir="ltr" {...field} />
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
                          <Input placeholder="وصف مختصر للدور" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Permission Matrix */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    مصفوفة الصلاحيات
                  </h3>
                  <Badge variant="secondary">
                    {selectedPermissions.size} صلاحية محددة
                  </Badge>
                </div>

                <ScrollArea className="h-[350px] pr-4">
                  <div className="space-y-3">
                    {permissionCategories.map((category) => (
                      <Card key={category.category} className="overflow-hidden">
                        <Collapsible
                          open={expandedCategories.has(category.category)}
                          onOpenChange={() => toggleCategory(category.category)}
                        >
                          <CardHeader className="p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6">
                                    {expandedCategories.has(category.category) ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </Button>
                                </CollapsibleTrigger>
                                <CardTitle className="text-sm font-medium">
                                  {category.categoryNameAr}
                                </CardTitle>
                                <Badge variant="outline" className="text-xs">
                                  {getCategorySelectedCount(category)} / {category.permissions.length}
                                </Badge>
                              </div>
                              <Button
                                type="button"
                                variant={isCategoryFullySelected(category) ? "default" : "outline"}
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleCategoryAll(category)
                                }}
                                className="h-7 text-xs"
                              >
                                {isCategoryFullySelected(category) ? (
                                  <>
                                    <Check className="h-3 w-3 ml-1" />
                                    تم التحديد
                                  </>
                                ) : (
                                  "تحديد الكل"
                                )}
                              </Button>
                            </div>
                          </CardHeader>
                          <CollapsibleContent>
                            <CardContent className="p-3 pt-0">
                              <div className="grid grid-cols-2 gap-2">
                                {category.permissions.map((permission) => (
                                  <div
                                    key={permission.id}
                                    className={`flex items-start gap-2 p-2 rounded-md border cursor-pointer transition-colors ${selectedPermissions.has(permission.id)
                                        ? "bg-primary/10 border-primary"
                                        : "hover:bg-muted/50"
                                      }`}
                                    onClick={() => togglePermission(permission.id)}
                                  >
                                    <Checkbox
                                      checked={selectedPermissions.has(permission.id)}
                                      onCheckedChange={() => togglePermission(permission.id)}
                                      className="mt-0.5"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium truncate">
                                        {permission.nameAr}
                                      </div>
                                      <div className="text-xs text-muted-foreground truncate">
                                        {permission.code}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </CollapsibleContent>
                        </Collapsible>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>

            <DialogFooter className="mt-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جارٍ الإنشاء...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 ml-2" />
                    إنشاء الدور
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
