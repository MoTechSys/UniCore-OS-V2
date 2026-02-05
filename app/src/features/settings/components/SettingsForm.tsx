"use client"

/**
 * Settings Form Component
 * 
 * Profile update and password change forms
 * 
 * @module features/settings/components/SettingsForm
 */

import { useEffect, useState, useTransition } from "react"
import { User, Lock, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
    getCurrentProfile,
    updateProfile,
    changePassword,
    UserProfile
} from "../actions"

// ============================================
// COMPONENT
// ============================================

export function SettingsForm() {
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isPending, startTransition] = useTransition()

    // Profile form
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

    // Password form
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

    useEffect(() => {
        async function fetchProfile() {
            const result = await getCurrentProfile()
            if (result.success && result.data) {
                setProfile(result.data)
                setFirstName(result.data.firstNameAr ?? "")
                setLastName(result.data.lastNameAr ?? "")
            }
            setIsLoading(false)
        }
        fetchProfile()
    }, [])

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setProfileMessage(null)

        startTransition(async () => {
            const result = await updateProfile({
                firstNameAr: firstName,
                lastNameAr: lastName,
            })

            if (result.success) {
                setProfileMessage({ type: "success", text: "تم حفظ التغييرات بنجاح" })
            } else {
                setProfileMessage({ type: "error", text: result.error ?? "حدث خطأ" })
            }
        })
    }

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setPasswordMessage(null)

        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: "error", text: "كلمات المرور غير متطابقة" })
            return
        }

        startTransition(async () => {
            const result = await changePassword({
                currentPassword,
                newPassword,
                confirmPassword,
            })

            if (result.success) {
                setPasswordMessage({ type: "success", text: "تم تغيير كلمة المرور بنجاح" })
                setCurrentPassword("")
                setNewPassword("")
                setConfirmPassword("")
            } else {
                setPasswordMessage({ type: "error", text: result.error ?? "حدث خطأ" })
            }
        })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Profile Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        الملف الشخصي
                    </CardTitle>
                    <CardDescription>
                        تعديل معلوماتك الشخصية
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">الاسم الأول</Label>
                                <Input
                                    id="firstName"
                                    value={firstName}
                                    onChange={e => setFirstName(e.target.value)}
                                    placeholder="أدخل الاسم الأول"
                                    disabled={isPending}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">اسم العائلة</Label>
                                <Input
                                    id="lastName"
                                    value={lastName}
                                    onChange={e => setLastName(e.target.value)}
                                    placeholder="أدخل اسم العائلة"
                                    disabled={isPending}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>البريد الإلكتروني</Label>
                            <Input
                                value={profile?.email ?? ""}
                                disabled
                                className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">
                                لا يمكن تغيير البريد الإلكتروني
                            </p>
                        </div>

                        {profileMessage && (
                            <div className={`flex items-center gap-2 text-sm ${profileMessage.type === "success" ? "text-green-600" : "text-destructive"
                                }`}>
                                {profileMessage.type === "success" ? (
                                    <CheckCircle className="h-4 w-4" />
                                ) : (
                                    <AlertCircle className="h-4 w-4" />
                                )}
                                {profileMessage.text}
                            </div>
                        )}

                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                            حفظ التغييرات
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Password Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        تغيير كلمة المرور
                    </CardTitle>
                    <CardDescription>
                        تأكد من استخدام كلمة مرور قوية
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
                            <Input
                                id="currentPassword"
                                type="password"
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                placeholder="أدخل كلمة المرور الحالية"
                                disabled={isPending}
                            />
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="أدخل كلمة المرور الجديدة"
                                disabled={isPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="أعد إدخال كلمة المرور الجديدة"
                                disabled={isPending}
                            />
                        </div>

                        {passwordMessage && (
                            <div className={`flex items-center gap-2 text-sm ${passwordMessage.type === "success" ? "text-green-600" : "text-destructive"
                                }`}>
                                {passwordMessage.type === "success" ? (
                                    <CheckCircle className="h-4 w-4" />
                                ) : (
                                    <AlertCircle className="h-4 w-4" />
                                )}
                                {passwordMessage.text}
                            </div>
                        )}

                        <Button type="submit" variant="secondary" disabled={isPending}>
                            {isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                            تغيير كلمة المرور
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
