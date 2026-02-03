"use client";

/**
 * مكون نموذج تسجيل الدخول
 * @description نموذج تسجيل الدخول بمعايير MAX مع shadcn/ui
 */

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, AlertCircle } from "lucide-react";
import { loginAction, type LoginActionResult } from "@/server/actions/auth";

/**
 * الحالة الابتدائية للنموذج
 */
const initialState: LoginActionResult = {
  success: false,
};

export function LoginForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  // التوجيه عند نجاح تسجيل الدخول
  useEffect(() => {
    if (state.success) {
      router.push("/dashboard");
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-6">
      {/* رسالة الخطأ العامة */}
      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* حقل البريد الإلكتروني */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          البريد الإلكتروني
        </Label>
        <div className="relative">
          <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="admin@unicore.edu.sa"
            className="pr-10"
            disabled={isPending}
            autoComplete="email"
            dir="ltr"
          />
        </div>
        {state.fieldErrors?.email && (
          <p className="text-sm text-destructive">{state.fieldErrors.email[0]}</p>
        )}
      </div>

      {/* حقل كلمة المرور */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">
          كلمة المرور
        </Label>
        <div className="relative">
          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            className="pr-10"
            disabled={isPending}
            autoComplete="current-password"
            dir="ltr"
          />
        </div>
        {state.fieldErrors?.password && (
          <p className="text-sm text-destructive">{state.fieldErrors.password[0]}</p>
        )}
      </div>

      {/* زر تسجيل الدخول */}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            جاري تسجيل الدخول...
          </>
        ) : (
          "تسجيل الدخول"
        )}
      </Button>
    </form>
  );
}
