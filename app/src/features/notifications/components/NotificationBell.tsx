"use client"

/**
 * Notification Bell Component
 * 
 * Bell icon with badge showing unread count.
 * Dropdown with recent notifications and quick actions.
 * 
 * @module features/notifications/components/NotificationBell
 */

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
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
    ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    type NotificationData,
} from "../actions"
import { cn } from "@/lib/utils"

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
            return "text-green-500"
        case "WARNING":
            return "text-yellow-500"
        case "ERROR":
            return "text-red-500"
        default:
            return "text-blue-500"
    }
}

function formatTimeAgo(date: Date): string {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "الآن"
    if (minutes < 60) return `منذ ${minutes} دقيقة`
    if (hours < 24) return `منذ ${hours} ساعة`
    if (days < 7) return `منذ ${days} يوم`
    return format(date, "d MMM", { locale: ar })
}

// ============================================
// COMPONENT
// ============================================

export function NotificationBell() {
    const router = useRouter()
    const [notifications, setNotifications] = useState<NotificationData[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [isPending, startTransition] = useTransition()
    const [open, setOpen] = useState(false)

    // Fetch notifications
    const fetchData = async () => {
        const [notifResult, countResult] = await Promise.all([
            getNotifications(5),
            getUnreadCount(),
        ])

        if (notifResult.success && notifResult.data) {
            setNotifications(notifResult.data)
        }
        if (countResult.success && countResult.data !== undefined) {
            setUnreadCount(countResult.data)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchData()

        // Poll every 30 seconds for new notifications
        const interval = setInterval(fetchData, 30000)
        return () => clearInterval(interval)
    }, [])

    // Refresh on open
    useEffect(() => {
        if (open) {
            fetchData()
        }
    }, [open])

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

    const handleNotificationClick = async (notification: NotificationData) => {
        if (!notification.isRead) {
            await markAsRead(notification.id)
        }
        if (notification.link) {
            router.push(notification.link)
        }
        setOpen(false)
    }

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 min-w-5 p-0 flex items-center justify-center text-xs">
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b">
                    <span className="font-semibold">الإشعارات</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={handleMarkAllAsRead}
                            disabled={isPending}
                        >
                            {isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin ml-1" />
                            ) : (
                                <CheckCheck className="h-3 w-3 ml-1" />
                            )}
                            تعليم الكل كمقروء
                        </Button>
                    )}
                </div>

                {/* Notifications List */}
                <ScrollArea className="max-h-80">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">لا توجد إشعارات</p>
                        </div>
                    ) : (
                        <div className="py-1">
                            {notifications.map((notification) => {
                                const Icon = getTypeIcon(notification.type)
                                const colorClass = getTypeColor(notification.type)

                                return (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "flex gap-3 px-3 py-2 cursor-pointer transition-colors hover:bg-muted",
                                            !notification.isRead && "bg-primary/5"
                                        )}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className={cn("mt-0.5", colorClass)}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={cn(
                                                    "text-sm truncate",
                                                    !notification.isRead && "font-medium"
                                                )}>
                                                    {notification.title}
                                                </p>
                                                {!notification.isRead && (
                                                    <div className="h-2 w-2 mt-1.5 rounded-full bg-primary shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {notification.body}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground mt-1">
                                                {formatTimeAgo(new Date(notification.createdAt))}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="justify-center text-primary"
                    onClick={() => {
                        router.push("/notifications")
                        setOpen(false)
                    }}
                >
                    <ExternalLink className="h-4 w-4 ml-1" />
                    عرض جميع الإشعارات
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
