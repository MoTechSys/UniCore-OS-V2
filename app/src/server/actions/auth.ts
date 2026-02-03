"use server";

/**
 * Server Actions للمصادقة
 * @description إجراءات الخادم لتسجيل الدخول والخروج بمعايير MAX
 */

import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";
import { z } from "zod";

/**
 * مخطط التحقق من بيانات تسجيل الدخول
 */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "البريد الإلكتروني مطلوب")
    .email("البريد الإلكتروني غير صالح"),
  password: z
    .string()
    .min(1, "كلمة المرور مطلوبة")
    .min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

/**
 * نتيجة إجراء تسجيل الدخول
 */
export interface LoginActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: {
    email?: string[];
    password?: string[];
  };
}

/**
 * إجراء تسجيل الدخول
 */
export async function loginAction(
  _prevState: LoginActionResult | null,
  formData: FormData
): Promise<LoginActionResult> {
  // استخراج البيانات
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  // التحقق من صحة البيانات
  const validatedFields = loginSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      success: false,
      fieldErrors: validatedFields.error.flatten().fieldErrors as {
        email?: string[];
        password?: string[];
      },
    };
  }

  const { email, password } = validatedFields.data;

  try {
    // محاولة تسجيل الدخول
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    // معالجة أخطاء المصادقة
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            success: false,
            error: error.message || "البريد الإلكتروني أو كلمة المرور غير صحيحة",
          };
        default:
          return {
            success: false,
            error: "حدث خطأ أثناء تسجيل الدخول",
          };
      }
    }

    // خطأ غير معروف
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "حدث خطأ غير متوقع",
    };
  }
}

/**
 * إجراء تسجيل الخروج
 */
export async function logoutAction(): Promise<void> {
  await signOut({ redirect: false });
}
