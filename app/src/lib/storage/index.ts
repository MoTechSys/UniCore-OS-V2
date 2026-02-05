/**
 * Storage Service - Adapter Pattern
 * 
 * Provides a unified interface for file storage.
 * Currently uses LocalAdapter (public/uploads/resources).
 * Can be switched to S3Adapter in production.
 * 
 * @module lib/storage
 */

import { writeFile, unlink, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { v4 as uuid } from "uuid"

// ============================================
// TYPES
// ============================================

export interface UploadResult {
    key: string
    path: string
    url: string
}

export interface StorageAdapter {
    upload(file: Buffer, extension: string): Promise<UploadResult>
    delete(key: string): Promise<void>
    getUrl(key: string): string
}

// ============================================
// CONFIGURATION
// ============================================

const UPLOAD_DIR = "public/uploads/resources"
const PUBLIC_URL_PREFIX = "/uploads/resources"

// ============================================
// LOCAL ADAPTER (Development)
// ============================================

class LocalStorageAdapter implements StorageAdapter {
    private uploadDir: string
    private urlPrefix: string

    constructor(uploadDir: string = UPLOAD_DIR, urlPrefix: string = PUBLIC_URL_PREFIX) {
        this.uploadDir = uploadDir
        this.urlPrefix = urlPrefix
    }

    async upload(file: Buffer, extension: string): Promise<UploadResult> {
        // Ensure upload directory exists
        const absoluteDir = path.join(process.cwd(), this.uploadDir)
        if (!existsSync(absoluteDir)) {
            await mkdir(absoluteDir, { recursive: true })
        }

        // Generate unique key (UUID)
        const key = uuid()
        const filename = `${key}${extension}`
        const filePath = path.join(absoluteDir, filename)
        const url = `${this.urlPrefix}/${filename}`

        // Write file to disk
        await writeFile(filePath, file)

        return {
            key,
            path: filePath,
            url,
        }
    }

    async delete(key: string): Promise<void> {
        // Find file with this key (any extension)
        const absoluteDir = path.join(process.cwd(), this.uploadDir)
        const files = existsSync(absoluteDir) ? await import("fs").then(fs => fs.readdirSync(absoluteDir)) : []
        const file = files.find(f => f.startsWith(key))

        if (file) {
            const filePath = path.join(absoluteDir, file)
            await unlink(filePath)
        }
    }

    getUrl(key: string): string {
        return `${this.urlPrefix}/${key}`
    }
}

// ============================================
// S3 ADAPTER (Production - Placeholder)
// ============================================

// class S3StorageAdapter implements StorageAdapter {
//     // TODO: Implement S3 storage for production
//     async upload(file: Buffer, extension: string): Promise<UploadResult> { ... }
//     async delete(key: string): Promise<void> { ... }
//     getUrl(key: string): string { ... }
// }

// ============================================
// EXPORT
// ============================================

// Use Local adapter for now (switch to S3 in production)
export const storage: StorageAdapter = new LocalStorageAdapter()

// Allowed MIME types for upload
export const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/zip",
    "application/x-zip-compressed",
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
]

export const ALLOWED_EXTENSIONS = [
    ".pdf",
    ".doc",
    ".docx",
    ".ppt",
    ".pptx",
    ".zip",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
]

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMime(mimeType: string): string {
    const map: Record<string, string> = {
        "application/pdf": ".pdf",
        "application/msword": ".doc",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
        "application/vnd.ms-powerpoint": ".ppt",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
        "application/zip": ".zip",
        "application/x-zip-compressed": ".zip",
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/gif": ".gif",
        "image/webp": ".webp",
    }
    return map[mimeType] || ""
}

/**
 * Validate file for upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
    // Check size
    if (file.size > MAX_FILE_SIZE) {
        return { valid: false, error: `حجم الملف يجب أن يكون أقل من ${MAX_FILE_SIZE / 1024 / 1024}MB` }
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return { valid: false, error: "نوع الملف غير مسموح به" }
    }

    // Check extension
    const ext = path.extname(file.name).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return { valid: false, error: "امتداد الملف غير مسموح به" }
    }

    return { valid: true }
}
