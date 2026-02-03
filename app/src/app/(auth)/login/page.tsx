/**
 * صفحة تسجيل الدخول
 * @description صفحة تسجيل الدخول بتصميم نظيف ومعايير MAX
 */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata = {
  title: "تسجيل الدخول | UniCore-OS",
  description: "صفحة تسجيل الدخول لنظام UniCore-OS",
};

export default async function LoginPage() {
  // التحقق من وجود جلسة نشطة
  const session = await auth();
  
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        {/* الشعار والعنوان */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">UniCore-OS</h1>
          <p className="text-muted-foreground mt-1">نظام التشغيل الجامعي المتكامل</p>
        </div>

        {/* بطاقة تسجيل الدخول */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-xl">تسجيل الدخول</CardTitle>
            <CardDescription>
              أدخل بيانات حسابك للوصول إلى النظام
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>

        {/* نص تذييلي */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          © {new Date().getFullYear()} UniCore-OS. جميع الحقوق محفوظة.
        </p>
      </div>
    </div>
  );
}
