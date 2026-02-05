"use server"

/**
 * Notification Server Actions
 * 
 * Handles notification CRUD operations.
 * 
 * @module features/notifications/actions
 */

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

// ============================================
// TYPES
// ============================================

export interface ActionResult<T = void> {
    success: boolean
    data?: T
    error?: string
}

export type NotificationType = "INFO" | "WARNING" | "SUCCESS" | "ERROR"

export interface NotificationData {
    id: string
    title: string
    body: string
    type: string
    link: string | null
    isRead: boolean
    createdAt: Date
}

export interface CreateNotificationInput {
    userIds: string[]
    title: string
    body: string
    type: NotificationType
    link?: string
    data?: Record<string, unknown>
}

// ============================================
// ACTIONS
// ============================================

/**
 * Get notifications for the current user
 */
export async function getNotifications(
    limit: number = 10
): Promise<ActionResult<NotificationData[]>> {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return { success: false, error: "غير مصرح" }
        }

        const notifications = await db.notification.findMany({
            where: {
                userId: session.user.id,
                deletedAt: null,
            },
            select: {
                id: true,
                title: true,
                body: true,
                type: true,
                link: true,
                isRead: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: limit,
        })

        return { success: true, data: notifications }
    } catch (error) {
        console.error("Get notifications error:", error)
        return { success: false, error: "فشل في جلب الإشعارات" }
    }
}

/**
 * Get unread notification count for the current user
 */
export async function getUnreadCount(): Promise<ActionResult<number>> {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return { success: false, error: "غير مصرح" }
        }

        const count = await db.notification.count({
            where: {
                userId: session.user.id,
                isRead: false,
                deletedAt: null,
            },
        })

        return { success: true, data: count }
    } catch (error) {
        console.error("Get unread count error:", error)
        return { success: false, error: "فشل في جلب عدد الإشعارات" }
    }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(
    notificationId: string
): Promise<ActionResult> {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return { success: false, error: "غير مصرح" }
        }

        // Verify ownership
        const notification = await db.notification.findFirst({
            where: {
                id: notificationId,
                userId: session.user.id,
                deletedAt: null,
            },
        })

        if (!notification) {
            return { success: false, error: "الإشعار غير موجود" }
        }

        await db.notification.update({
            where: { id: notificationId },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        })

        return { success: true }
    } catch (error) {
        console.error("Mark as read error:", error)
        return { success: false, error: "فشل في تحديث الإشعار" }
    }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<ActionResult> {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return { success: false, error: "غير مصرح" }
        }

        await db.notification.updateMany({
            where: {
                userId: session.user.id,
                isRead: false,
                deletedAt: null,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        })

        revalidatePath("/notifications")
        return { success: true }
    } catch (error) {
        console.error("Mark all as read error:", error)
        return { success: false, error: "فشل في تحديث الإشعارات" }
    }
}

/**
 * Delete a notification (soft delete)
 */
export async function deleteNotification(
    notificationId: string
): Promise<ActionResult> {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return { success: false, error: "غير مصرح" }
        }

        // Verify ownership
        const notification = await db.notification.findFirst({
            where: {
                id: notificationId,
                userId: session.user.id,
                deletedAt: null,
            },
        })

        if (!notification) {
            return { success: false, error: "الإشعار غير موجود" }
        }

        await db.notification.update({
            where: { id: notificationId },
            data: { deletedAt: new Date() },
        })

        revalidatePath("/notifications")
        return { success: true }
    } catch (error) {
        console.error("Delete notification error:", error)
        return { success: false, error: "فشل في حذف الإشعار" }
    }
}

// ============================================
// INTERNAL HELPER (Used by other actions)
// ============================================

/**
 * Create notifications for multiple users
 * This is an internal function used by other Server Actions
 */
export async function createNotification(
    input: CreateNotificationInput
): Promise<ActionResult<{ count: number }>> {
    try {
        const { userIds, title, body, type, link, data } = input

        if (userIds.length === 0) {
            return { success: true, data: { count: 0 } }
        }

        // Create notifications for all users
        const notifications = userIds.map((userId) => ({
            userId,
            title,
            body,
            type,
            link: link ?? null,
            data: data ? JSON.stringify(data) : null,
        }))

        await db.notification.createMany({
            data: notifications,
        })

        return { success: true, data: { count: userIds.length } }
    } catch (error) {
        console.error("Create notification error:", error)
        return { success: false, error: "فشل في إنشاء الإشعارات" }
    }
}
