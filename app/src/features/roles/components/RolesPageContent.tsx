"use client"

/**
 * Roles Page Content Component
 * 
 * Client component that displays the roles management interface.
 * Handles role CRUD operations and permission matrix.
 * 
 * @module features/roles/components/RolesPageContent
 */

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { 
  Shield, 
  Plus, 
  Users, 
  Key, 
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  Lock,
  RefreshCw
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

import { deleteRole, duplicateRole } from "../actions"
import { CreateRoleModal } from "./CreateRoleModal"
import { EditRoleModal } from "./EditRoleModal"

// ============================================
// TYPES
// ============================================

interface RoleData {
  id: string
  code: string
  nameAr: string
  nameEn: string | null
  description: string | null
  isSystem: boolean
  createdAt: Date
  _count: {
    users: number
    permissions: number
  }
}

interface PermissionCategory {
  category: string
  categoryNameAr: string
  permissions: {
    id: string
    code: string
    nameAr: string
    nameEn: string
    description: string | null
  }[]
}

interface RolesPageContentProps {
  roles: RoleData[]
  permissionCategories: PermissionCategory[]
  userPermissions: string[]
  isSystemRole: boolean
}

// ============================================
// COMPONENT
// ============================================

export function RolesPageContent({
  roles,
  permissionCategories,
  userPermissions,
  isSystemRole,
}: RolesPageContentProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<RoleData | null>(null)

  // Permission checks
  const canCreate = isSystemRole || userPermissions.includes("role.create")
  const canUpdate = isSystemRole || userPermissions.includes("role.update")
  const canDelete = isSystemRole || userPermissions.includes("role.delete")

  // Stats
  const totalRoles = roles.length
  const systemRoles = roles.filter(r => r.isSystem).length
  const customRoles = roles.filter(r => !r.isSystem).length
  const totalPermissions = permissionCategories.reduce(
    (acc, cat) => acc + cat.permissions.length, 
    0
  )

  // Handlers
  const handleRefresh = () => {
    startTransition(() => {
      router.refresh()
    })
  }

  const handleEdit = (role: RoleData) => {
    setSelectedRole(role)
    setEditModalOpen(true)
  }

  const handleDeleteClick = (role: RoleData) => {
    setSelectedRole(role)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedRole) return

    startTransition(async () => {
      const result = await deleteRole(selectedRole.id)
      if (result.success) {
        toast.success("تم حذف الدور بنجاح")
        setDeleteDialogOpen(false)
        setSelectedRole(null)
        router.refresh()
      } else {
        toast.error(result.error ?? "فشل في حذف الدور")
      }
    })
  }

  const handleDuplicate = async (role: RoleData) => {
    startTransition(async () => {
      const result = await duplicateRole(role.id)
      if (result.success) {
        toast.success("تم نسخ الدور بنجاح")
        router.refresh()
      } else {
        toast.error(result.error ?? "فشل في نسخ الدور")
      }
    })
  }

  const handleSuccess = () => {
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            إدارة الأدوار
          </h1>
          <p className="text-muted-foreground">
            إدارة الأدوار والصلاحيات في النظام
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isPending}
          >
            <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
          </Button>
          {canCreate && (
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة دور
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأدوار</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRoles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الأدوار الأساسية</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemRoles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الأدوار المخصصة</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customRoles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الصلاحيات</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPermissions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الأدوار</CardTitle>
          <CardDescription>
            جميع الأدوار المتاحة في النظام مع عدد المستخدمين والصلاحيات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الدور</TableHead>
                <TableHead>الكود</TableHead>
                <TableHead className="text-center">المستخدمين</TableHead>
                <TableHead className="text-center">الصلاحيات</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead className="w-[70px]">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {role.isSystem ? (
                        <Lock className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Shield className="h-4 w-4 text-primary" />
                      )}
                      <div>
                        <div className="font-medium">{role.nameAr}</div>
                        {role.description && (
                          <div className="text-xs text-muted-foreground">
                            {role.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {role.code}
                    </code>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{role._count.users}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <span>{role._count.permissions}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {role.isSystem ? (
                      <Badge variant="secondary" className="bg-amber-500/10 text-amber-500">
                        أساسي
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        مخصص
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canUpdate && !role.isSystem && (
                          <DropdownMenuItem onClick={() => handleEdit(role)}>
                            <Pencil className="h-4 w-4 ml-2" />
                            تعديل
                          </DropdownMenuItem>
                        )}
                        {canCreate && (
                          <DropdownMenuItem onClick={() => handleDuplicate(role)}>
                            <Copy className="h-4 w-4 ml-2" />
                            نسخ
                          </DropdownMenuItem>
                        )}
                        {canDelete && !role.isSystem && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteClick(role)}
                              disabled={role._count.users > 0}
                            >
                              <Trash2 className="h-4 w-4 ml-2" />
                              حذف
                            </DropdownMenuItem>
                          </>
                        )}
                        {role.isSystem && (
                          <DropdownMenuItem disabled>
                            <Lock className="h-4 w-4 ml-2" />
                            محمي من التعديل
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Role Modal */}
      <CreateRoleModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        permissionCategories={permissionCategories}
        onSuccess={handleSuccess}
      />

      {/* Edit Role Modal */}
      {selectedRole && (
        <EditRoleModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          role={selectedRole}
          permissionCategories={permissionCategories}
          onSuccess={handleSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذا الدور؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف الدور "{selectedRole?.nameAr}" نهائياً. هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
