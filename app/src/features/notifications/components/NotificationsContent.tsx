"use client"

/**
 * Notifications Content Component
 * 
 * Full list of notifications with actions.
 * 
 * @module features/notifications/components/NotificationsContent
 */

import { useState, useEffect, useTransition } from "react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import {
    Bell,
    Check,
    CheckCheck,
    Info,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Loader2,
    Trash2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    type NotificationData,
} from "../actions"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

// ============================================
// HELPERS
// ============================================

function getTypeIcon(type: string) {
    switch (type) {
        case "SUCCESS":
            return CheckCircle
        case "WARNING":
            return AlertTriangle
        case "ERROR":
            return XCircle
        default:
            return Info
    }
}

function getTypeColor(type: string) {
    switch (type) {
        case "SUCCESS":
            return "text-green-500 bg-green-500/10"
        case "WARNING":
            return "text-yellow-500 bg-yellow-500/10"
        case "ERROR":
            return "text-red-500 bg-red-500/10"
        default:
            return "text-blue-500 bg-blue-500/10"
    }
}

// ============================================
// COMPONENT
// ============================================

export function NotificationsContent() {
    const router = useRouter()
    const [notifications, setNotifications] = useState<NotificationData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isPending, startTransition] = useTransition()

    const fetchData = async () => {
        const result = await getNotifications(50)
        if (result.success && result.data) {
            setNotifications(result.data)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleMarkAsRead = async (id: string) => {
        startTransition(async () => {
            await markAsRead(id)
            await fetchData()
        })
    }

    const handleMarkAllAsRead = async () => {
        startTransition(async () => {
            await markAllAsRead()
            await fetchData()
        })
    }

    const handleDelete = async (id: string) => {
        startTransition(async () => {
            await deleteNotification(id)
            await fetchData()
        })
    }

    const handleClick = async (notification: NotificationData) => {
        if (!notification.isRead) {
            await markAsRead(notification.id)
        }
        if (notification.link) {
            router.push(notification.link)
        }
    }

    const unreadCount = notifications.filter((n) => !n.isRead).length

    if (isLoading) {
        return (
            <Card>
                <CardContent className="py-12">
                    <div className="flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <span className="mr-2 text-muted-foreground">جارٍ تحميل الإشعارات...</span>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    الإشعارات
                    {unreadCount > 0 && (
                        <Badge variant="secondary">{unreadCount} غير مقروء</Badge>
                    )}
                </CardTitle>
                {unreadCount > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMarkAllAsRead}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin ml-2" />
                        ) : (
                            <CheckCheck className="h-4 w-4 ml-2" />
                        )}
                        تعليم الكل كمقروء
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {notifications.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                        <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium">لا توجد إشعارات</h3>
                        <p className="mt-2 text-sm">ستظهر هنا إشعاراتك عند وصولها</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {notifications.map((notification) => {
                            const Icon = getTypeIcon(notification.type)
                            const colorClass = getTypeColor(notification.type)

                            return (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "flex gap-4 p-4 rounded-lg border transition-colors cursor-pointer",
                                        !notification.isRead && "bg-primary/5 border-primary/20",
                                        notification.isRead && "hover:bg-muted/50"
                                    )}
                                    onClick={() => handleClick(notification)}
                                >
                                    <div className={cn("p-2 rounded-lg shrink-0", colorClass)}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className={cn(
                                                    "text-sm",
                                                    !notification.isRead && "font-semibold"
                                                )}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {notification.body}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    {format(new Date(notification.createdAt), "d MMMM yyyy - h:mm a", {
                                                        locale: ar,
                                                    })}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                {!notification.isRead && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleMarkAsRead(notification.id)
                                                        }}
                                                        title="تعليم كمقروء"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDelete(notification.id)
                                                    }}
                                                    title="حذف"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
