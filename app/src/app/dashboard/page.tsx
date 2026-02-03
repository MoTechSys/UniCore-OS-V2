/**
 * صفحة لوحة التحكم الرئيسية - UniCore-OS
 * Server Component with Real Data
 */

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  GraduationCap, 
  UserCog,
  Shield,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity
} from "lucide-react"

// ============================================
// DATA FETCHING
// ============================================

async function getDashboardStats() {
  // إحصائيات المستخدمين
  const totalUsers = await prisma.user.count({
    where: { deletedAt: null }
  })

  const activeUsers = await prisma.user.count({
    where: { status: "ACTIVE", deletedAt: null }
  })

  // إحصائيات حسب الدور
  const studentsCount = await prisma.userRole.count({
    where: {
      role: { code: "STUDENT" },
      user: { deletedAt: null }
    }
  })

  const instructorsCount = await prisma.userRole.count({
    where: {
      role: { code: "INSTRUCTOR" },
      user: { deletedAt: null }
    }
  })

  // إحصائيات الأدوار
  const totalRoles = await prisma.role.count()

  // آخر المستخدمين المسجلين
  const recentUsers = await prisma.user.findMany({
    where: { deletedAt: null },
    include: {
      profile: true,
      roles: {
        include: { role: true }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 5
  })

  return {
    totalUsers,
    activeUsers,
    studentsCount,
    instructorsCount,
    totalRoles,
    recentUsers
  }
}

// ============================================
// STATS CARD COMPONENT
// ============================================

interface StatCardProps {
  title: string
  value: number | string
  description: string
  icon: React.ElementType
  trend?: string
  trendType?: "positive" | "negative" | "neutral"
}

function StatCard({ title, value, description, icon: Icon, trend, trendType = "neutral" }: StatCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {description}
        </p>
        {trend && (
          <p className={`text-xs mt-2 flex items-center gap-1 ${
            trendType === "positive" ? "text-green-600" : 
            trendType === "negative" ? "text-red-600" : "text-muted-foreground"
          }`}>
            <TrendingUp className="h-3 w-3" />
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================
// RECENT USERS TABLE
// ============================================

interface RecentUser {
  id: string
  email: string | null
  status: string
  createdAt: Date
  profile: {
    firstNameAr: string
    lastNameAr: string
  } | null
  roles: {
    role: {
      nameAr: string
      code: string
    }
  }[]
}

function RecentUsersTable({ users }: { users: RecentUser[] }) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">نشط</Badge>
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">في الانتظار</Badge>
      case "FROZEN":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">مجمد</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(date))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              آخر المستخدمين المسجلين
            </CardTitle>
            <CardDescription>أحدث الحسابات في النظام</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Mobile-friendly scrollable table */}
        <div className="overflow-x-auto -mx-6 px-6">
          <div className="min-w-[600px]">
            <div className="space-y-3">
              {users.map((user) => (
                <div 
                  key={user.id} 
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="p-2 rounded-full bg-primary/10">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.profile ? `${user.profile.firstNameAr} ${user.profile.lastNameAr}` : "بدون اسم"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="hidden sm:block">
                    {user.roles[0] && (
                      <Badge variant="outline">{user.roles[0].role.nameAr}</Badge>
                    )}
                  </div>
                  <div className="hidden md:block">
                    {getStatusBadge(user.status)}
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(user.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// QUICK ACTIONS
// ============================================

function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          إجراءات سريعة
        </CardTitle>
        <CardDescription>الوصول السريع للمهام الشائعة</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <a 
            href="/users" 
            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
          >
            <Users className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">إدارة المستخدمين</span>
          </a>
          <a 
            href="/roles" 
            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
          >
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">إدارة الأدوار</span>
          </a>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// SYSTEM STATUS
// ============================================

function SystemStatus() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          حالة النظام
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">قاعدة البيانات</span>
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">متصل</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">المصادقة</span>
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">نشط</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">الإصدار</span>
            <Badge variant="outline">v1.0.0-beta</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// PAGE EXPORT
// ============================================

export default async function DashboardPage() {
  // التحقق من المصادقة
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard")
  }

  // جلب البيانات
  const stats = await getDashboardStats()

  return (
    <DashboardLayout title="لوحة التحكم" subtitle="نظرة عامة على النظام">
      <div className="space-y-6">
        {/* رسالة الترحيب */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold">
            مرحباً، {session.user.name || "مدير النظام"} 👋
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            هذه نظرة عامة على حالة النظام والإحصائيات.
          </p>
        </div>

        {/* بطاقات الإحصائيات - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="إجمالي المستخدمين"
            value={stats.totalUsers}
            description={`${stats.activeUsers} نشط`}
            icon={Users}
            trend="من قاعدة البيانات"
            trendType="neutral"
          />
          <StatCard
            title="الطلاب"
            value={stats.studentsCount}
            description="طالب مسجل"
            icon={GraduationCap}
          />
          <StatCard
            title="أعضاء هيئة التدريس"
            value={stats.instructorsCount}
            description="عضو هيئة تدريس"
            icon={UserCog}
          />
          <StatCard
            title="الأدوار"
            value={stats.totalRoles}
            description="دور في النظام"
            icon={Shield}
          />
        </div>

        {/* الصف الثاني - Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* آخر المستخدمين - يأخذ عمودين */}
          <div className="lg:col-span-2">
            <RecentUsersTable users={stats.recentUsers} />
          </div>
          
          {/* الجانب - إجراءات سريعة وحالة النظام */}
          <div className="space-y-6">
            <QuickActions />
            <SystemStatus />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
