/**
 * Unauthorized Page
 * 
 * Displayed when a user tries to access a resource they don't have permission for.
 * 
 * @module app/unauthorized
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'غير مصرح | UniCore-OS',
  description: 'ليس لديك صلاحية للوصول إلى هذه الصفحة',
}

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md border-destructive/50">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4 mx-auto">
            <svg 
              className="w-8 h-8 text-destructive" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
          <CardTitle className="text-2xl text-destructive">غير مصرح</CardTitle>
          <CardDescription>
            ليس لديك الصلاحيات الكافية للوصول إلى هذه الصفحة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع مدير النظام.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/dashboard">
                العودة إلى لوحة التحكم
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/login">
                تسجيل الدخول بحساب آخر
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
