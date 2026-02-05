"use server"

/**
 * Resource Server Actions
 * 
 * Handles file upload/download/delete operations for CourseOffering resources.
 * Files are stored with UUID names for security.
 * 
 * @module features/resources/actions
 */

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { requirePermission } from "@/lib/auth/permissions"
import { auth } from "@/lib/auth"
import {
    storage,
    validateFile,
    getExtensionFromMime,
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE
} from "@/lib/storage"
import path from "path"
import { createNotification } from "@/features/notifications/actions"

// ============================================
// TYPES
// ============================================

export interface ActionResult<T = void> {
    success: boolean
    data?: T
    error?: string
}

export interface ResourceData {
    id: string
    name: string
    originalName: string
    key: string
    mimeType: string
    size: number
    url: string | null
    createdAt: Date
    uploader: {
        id: string
        name: string | null
    }
}

// ============================================
// SCHEMAS
// ============================================

const uploadResourceSchema = z.object({
    offeringId: z.string().min(1, "معرف الشعبة مطلوب"),
})

// ============================================
// ACTIONS
// ============================================

/**
 * Get all resources for an offering
 */
export async function getResources(
    offeringId: string
): Promise<ActionResult<ResourceData[]>> {
    try {
        // Check permission
        await requirePermission("file.view")

        const resources = await db.file.findMany({
            where: {
                offeringId,
                deletedAt: null,
            },
            select: {
                id: true,
                name: true,
                originalName: true,
                key: true,
                mimeType: true,
                size: true,
                url: true,
                createdAt: true,
                uploader: {
                    select: {
                        id: true,
                        profile: {
                            select: {
                                firstNameAr: true,
                                lastNameAr: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        })

        const formattedResources: ResourceData[] = resources.map(r => ({
            id: r.id,
            name: r.name,
            originalName: r.originalName,
            key: r.key,
            mimeType: r.mimeType,
            size: r.size,
            url: r.url,
            createdAt: r.createdAt,
            uploader: {
                id: r.uploader.id,
                name: r.uploader.profile
                    ? `${r.uploader.profile.firstNameAr} ${r.uploader.profile.lastNameAr}`
                    : null,
            },
        }))

        return { success: true, data: formattedResources }
    } catch (error) {
        console.error("Get resources error:", error)
        return { success: false, error: "فشل في جلب الملفات" }
    }
}

/**
 * Upload a new resource
 */
export async function uploadResource(
    formData: FormData
): Promise<ActionResult<{ id: string }>> {
    try {
        // Check permission
        await requirePermission("file.upload")

        // Get session for uploader ID
        const session = await auth()
        if (!session?.user?.id) {
            return { success: false, error: "غير مصرح" }
        }

        // Get form data
        const file = formData.get("file") as File | null
        const offeringId = formData.get("offeringId") as string | null

        if (!file) {
            return { success: false, error: "الملف مطلوب" }
        }

        if (!offeringId) {
            return { success: false, error: "معرف الشعبة مطلوب" }
        }

        // Validate file
        const validation = validateFile(file)
        if (!validation.valid) {
            return { success: false, error: validation.error }
        }

        // Server-side MIME type validation (don't trust client)
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return { success: false, error: "نوع الملف غير مسموح به" }
        }

        if (file.size > MAX_FILE_SIZE) {
            return { success: false, error: "حجم الملف كبير جداً (الحد الأقصى 10MB)" }
        }

        // Verify offering exists
        const offering = await db.courseOffering.findUnique({
            where: { id: offeringId, deletedAt: null },
            select: { id: true },
        })

        if (!offering) {
            return { success: false, error: "الشعبة غير موجودة" }
        }

        // Read file buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Get extension from original filename
        const extension = path.extname(file.name).toLowerCase()

        // Upload file to storage
        const uploadResult = await storage.upload(buffer, extension)

        // Create database record
        const resource = await db.file.create({
            data: {
                name: file.name,
                originalName: file.name,
                key: uploadResult.key,
                mimeType: file.type,
                size: file.size,
                path: uploadResult.path,
                url: uploadResult.url,
                offeringId,
                uploaderId: session.user.id,
            },
        })

        // Notify all enrolled students
        const offeringWithCourse = await db.courseOffering.findUnique({
            where: { id: offeringId },
            select: {
                course: { select: { nameAr: true } },
            },
        })

        const enrollments = await db.enrollment.findMany({
            where: { offeringId, status: "ACTIVE" },
            select: { studentId: true },
        })

        if (enrollments.length > 0 && offeringWithCourse) {
            await createNotification({
                userIds: enrollments.map(e => e.studentId),
                title: "ملف جديد",
                body: `تم رفع ملف "${file.name}" في مادة ${offeringWithCourse.course.nameAr}`,
                type: "INFO",
                link: `/offerings/${offeringId}?tab=resources`,
            })
        }

        revalidatePath(`/offerings/${offeringId}`)
        return { success: true, data: { id: resource.id } }
    } catch (error) {
        console.error("Upload resource error:", error)
        return { success: false, error: "فشل في رفع الملف" }
    }
}

/**
 * Delete a resource (soft delete)
 */
export async function deleteResource(
    resourceId: string
): Promise<ActionResult> {
    try {
        // Check permission
        await requirePermission("file.delete")

        // Find resource
        const resource = await db.file.findUnique({
            where: { id: resourceId, deletedAt: null },
            select: { id: true, offeringId: true },
        })

        if (!resource) {
            return { success: false, error: "الملف غير موجود" }
        }

        // Soft delete
        await db.file.update({
            where: { id: resourceId },
            data: { deletedAt: new Date() },
        })

        // Note: We don't delete the physical file - it remains in storage
        // This allows recovery if needed

        if (resource.offeringId) {
            revalidatePath(`/offerings/${resource.offeringId}`)
        }

        return { success: true }
    } catch (error) {
        console.error("Delete resource error:", error)
        return { success: false, error: "فشل في حذف الملف" }
    }
}

/**
 * Get resource count for an offering
 */
export async function getResourceCount(
    offeringId: string
): Promise<ActionResult<number>> {
    try {
        const count = await db.file.count({
            where: {
                offeringId,
                deletedAt: null,
            },
        })

        return { success: true, data: count }
    } catch (error) {
        console.error("Get resource count error:", error)
        return { success: false, error: "فشل في جلب عدد الملفات" }
    }
}
