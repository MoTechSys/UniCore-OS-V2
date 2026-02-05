"use client"

/**
 * Resource List Component
 * 
 * Displays list of uploaded resources with download/delete actions.
 * 
 * @module features/resources/components/ResourceList
 */

import { useState } from "react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import {
    FileText,
    FileImage,
    FileArchive,
    File as FileIcon,
    Download,
    Trash2,
    Loader2,
    FolderOpen,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { deleteResource, type ResourceData } from "../actions"

// ============================================
// TYPES
// ============================================

interface ResourceListProps {
    resources: ResourceData[]
    canDelete: boolean
    onSuccess?: () => void
}

// ============================================
// HELPERS
// ============================================

function getFileIcon(mimeType: string) {
    if (mimeType.startsWith("image/")) {
        return FileImage
    }
    if (mimeType.includes("pdf")) {
        return FileText
    }
    if (mimeType.includes("zip") || mimeType.includes("compressed")) {
        return FileArchive
    }
    return FileIcon
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function getFileTypeLabel(mimeType: string): string {
    if (mimeType.includes("pdf")) return "PDF"
    if (mimeType.includes("word") || mimeType.includes("document")) return "Word"
    if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) return "PowerPoint"
    if (mimeType.includes("zip") || mimeType.includes("compressed")) return "ZIP"
    if (mimeType.startsWith("image/")) return "صورة"
    return "ملف"
}

// ============================================
// COMPONENT
// ============================================

export function ResourceList({ resources, canDelete, onSuccess }: ResourceListProps) {
    const { toast } = useToast()
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        if (!deletingId) return

        setIsDeleting(true)

        try {
            const result = await deleteResource(deletingId)

            if (result.success) {
                toast({
                    title: "تم الحذف",
                    description: "تم حذف الملف بنجاح",
                })
                onSuccess?.()
            } else {
                toast({
                    title: "فشل الحذف",
                    description: result.error || "حدث خطأ أثناء حذف الملف",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Delete error:", error)
            toast({
                title: "فشل الحذف",
                description: "حدث خطأ غير متوقع",
                variant: "destructive",
            })
        } finally {
            setIsDeleting(false)
            setDeletingId(null)
        }
    }

    if (resources.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-medium">لا توجد ملفات</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        لم يتم رفع أي ملفات لهذه الشعبة بعد
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        الملفات المرفوعة ({resources.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="divide-y">
                        {resources.map((resource) => {
                            const Icon = getFileIcon(resource.mimeType)

                            return (
                                <div
                                    key={resource.id}
                                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                                            <Icon className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium truncate" title={resource.name}>
                                                {resource.name}
                                            </p>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Badge variant="secondary" className="text-xs">
                                                    {getFileTypeLabel(resource.mimeType)}
                                                </Badge>
                                                <span>{formatFileSize(resource.size)}</span>
                                                <span>•</span>
                                                <span>
                                                    {format(new Date(resource.createdAt), "d MMM yyyy", {
                                                        locale: ar,
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0 mr-2">
                                        {resource.url && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                asChild
                                            >
                                                <a
                                                    href={resource.url}
                                                    download={resource.originalName}
                                                    title="تحميل"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        )}
                                        {canDelete && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => setDeletingId(resource.id)}
                                                title="حذف"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                        <AlertDialogDescription>
                            سيتم حذف هذا الملف. لن يتمكن الطلاب من الوصول إليه بعد الحذف.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                    جارٍ الحذف...
                                </>
                            ) : (
                                "حذف"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
