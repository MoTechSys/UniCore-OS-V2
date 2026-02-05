"use client"

/**
 * Resource Uploader Component
 * 
 * Drag & Drop file upload zone with progress indicator.
 * Only visible to users with upload permission.
 * 
 * @module features/resources/components/ResourceUploader
 */

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, Loader2, FileIcon, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { uploadResource } from "../actions"
import { cn } from "@/lib/utils"

// ============================================
// TYPES
// ============================================

interface ResourceUploaderProps {
    offeringId: string
    onSuccess?: () => void
}

// ============================================
// CONSTANTS
// ============================================

const ACCEPTED_TYPES = {
    "application/pdf": [".pdf"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    "application/vnd.ms-powerpoint": [".ppt"],
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
    "application/zip": [".zip"],
    "application/x-zip-compressed": [".zip"],
    "image/png": [".png"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/gif": [".gif"],
    "image/webp": [".webp"],
}

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

// ============================================
// COMPONENT
// ============================================

export function ResourceUploader({ offeringId, onSuccess }: ResourceUploaderProps) {
    const { toast } = useToast()
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (file) {
            setSelectedFile(file)
        }
    }, [])

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        accept: ACCEPTED_TYPES,
        maxSize: MAX_SIZE,
        multiple: false,
        onDropRejected: (rejectedFiles) => {
            const error = rejectedFiles[0]?.errors[0]
            if (error?.code === "file-too-large") {
                toast({
                    title: "خطأ في الرفع",
                    description: "حجم الملف كبير جداً (الحد الأقصى 10MB)",
                    variant: "destructive",
                })
            } else if (error?.code === "file-invalid-type") {
                toast({
                    title: "خطأ في الرفع",
                    description: "نوع الملف غير مسموح به",
                    variant: "destructive",
                })
            }
        },
    })

    const handleUpload = async () => {
        if (!selectedFile) return

        setIsUploading(true)
        setUploadProgress(10)

        try {
            const formData = new FormData()
            formData.append("file", selectedFile)
            formData.append("offeringId", offeringId)

            setUploadProgress(30)

            const result = await uploadResource(formData)

            setUploadProgress(100)

            if (result.success) {
                toast({
                    title: "تم الرفع",
                    description: "تم رفع الملف بنجاح",
                })
                setSelectedFile(null)
                onSuccess?.()
            } else {
                toast({
                    title: "فشل الرفع",
                    description: result.error || "حدث خطأ أثناء رفع الملف",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Upload error:", error)
            toast({
                title: "فشل الرفع",
                description: "حدث خطأ غير متوقع",
                variant: "destructive",
            })
        } finally {
            setIsUploading(false)
            setUploadProgress(0)
        }
    }

    const handleClear = () => {
        setSelectedFile(null)
    }

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`
    }

    return (
        <Card>
            <CardContent className="p-6">
                {/* Dropzone */}
                <div
                    {...getRootProps()}
                    className={cn(
                        "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer",
                        isDragActive && !isDragReject && "border-primary bg-primary/5",
                        isDragReject && "border-destructive bg-destructive/5",
                        !isDragActive && "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                    )}
                >
                    <input {...getInputProps()} />

                    {isUploading ? (
                        <div className="text-center space-y-4 w-full max-w-xs">
                            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">جارٍ رفع الملف...</p>
                                <Progress value={uploadProgress} className="h-2" />
                            </div>
                        </div>
                    ) : selectedFile ? (
                        <div className="text-center space-y-4">
                            <div className="flex items-center justify-center gap-2">
                                <FileIcon className="h-10 w-10 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium">{selectedFile.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {formatFileSize(selectedFile.size)}
                                </p>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <Button onClick={handleUpload} size="sm">
                                    <Upload className="ml-2 h-4 w-4" />
                                    رفع الملف
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleClear()
                                    }}
                                >
                                    <X className="ml-2 h-4 w-4" />
                                    إلغاء
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-2">
                            <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                            <div>
                                <p className="font-medium">
                                    {isDragActive ? "أفلت الملف هنا" : "اسحب وأفلت ملفاً هنا"}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    أو اضغط لاختيار ملف
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    PDF, Word, PowerPoint, Images, ZIP (الحد الأقصى 10MB)
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
