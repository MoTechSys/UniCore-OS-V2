"use server"

/**
 * Settings Server Actions
 * 
 * Handles user profile and password management
 * 
 * @module features/settings/actions
 */

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

// ============================================
// TYPES
// ============================================

export interface ActionResult<T = void> {
    success: boolean
    data?: T
    error?: string
}

export interface UserProfile {
    id: string
    name: string | null
    email: string
    firstNameAr: string | null
    lastNameAr: string | null
}

// ============================================
// SCHEMAS
// ============================================

const updateProfileSchema = z.object({
    firstNameAr: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
    lastNameAr: z.string().min(2, "اسم العائلة يجب أن يكون حرفين على الأقل"),
})

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
    newPassword: z.string().min(6, "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل"),
    confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "كلمات المرور غير متطابقة",
    path: ["confirmPassword"],
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

// ============================================
// ACTIONS
// ============================================

/**
 * Get current user's profile
 */
export async function getCurrentProfile(): Promise<ActionResult<UserProfile>> {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return { success: false, error: "غير مصرح" }
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            include: {
                profile: {
                    select: {
                        firstNameAr: true,
                        lastNameAr: true,
                    },
                },
            },
        })

        if (!user) {
            return { success: false, error: "المستخدم غير موجود" }
        }

        return {
            success: true,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                firstNameAr: user.profile?.firstNameAr ?? null,
                lastNameAr: user.profile?.lastNameAr ?? null,
            },
        }
    } catch (error) {
        console.error("Get profile error:", error)
        return { success: false, error: "فشل في جلب البيانات" }
    }
}

/**
 * Update user profile
 */
export async function updateProfile(
    input: UpdateProfileInput
): Promise<ActionResult> {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return { success: false, error: "غير مصرح" }
        }

        const validated = updateProfileSchema.parse(input)

        // Update user name
        const fullName = `${validated.firstNameAr} ${validated.lastNameAr}`

        await db.user.update({
            where: { id: session.user.id },
            data: { name: fullName },
        })

        // Update or create profile
        await db.userProfile.upsert({
            where: { userId: session.user.id },
            update: {
                firstNameAr: validated.firstNameAr,
                lastNameAr: validated.lastNameAr,
            },
            create: {
                userId: session.user.id,
                firstNameAr: validated.firstNameAr,
                lastNameAr: validated.lastNameAr,
            },
        })

        revalidatePath("/settings")
        revalidatePath("/dashboard")
        return { success: true }
    } catch (error) {
        console.error("Update profile error:", error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        return { success: false, error: "فشل في تحديث البيانات" }
    }
}

/**
 * Change password
 */
export async function changePassword(
    input: ChangePasswordInput
): Promise<ActionResult> {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return { success: false, error: "غير مصرح" }
        }

        const validated = changePasswordSchema.parse(input)

        // Get current user with password
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { password: true },
        })

        if (!user?.password) {
            return { success: false, error: "لا يمكن تغيير كلمة المرور لهذا الحساب" }
        }

        // Verify current password
        const isValid = await bcrypt.compare(validated.currentPassword, user.password)
        if (!isValid) {
            return { success: false, error: "كلمة المرور الحالية غير صحيحة" }
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(validated.newPassword, 10)

        // Update password
        await db.user.update({
            where: { id: session.user.id },
            data: { password: hashedPassword },
        })

        return { success: true }
    } catch (error) {
        console.error("Change password error:", error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        return { success: false, error: "فشل في تغيير كلمة المرور" }
    }
}
