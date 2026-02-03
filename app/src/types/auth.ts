/**
 * أنواع نظام المصادقة
 * @description تعريفات TypeScript لنظام المصادقة بمعايير MAX
 */

import type { DefaultSession } from "next-auth";

/**
 * حالات المستخدم المسموحة
 */
export type UserStatus = "PENDING" | "PENDING_ACTIVATION" | "ACTIVE" | "FROZEN";

/**
 * بيانات المستخدم الموسعة
 */
export interface ExtendedUser {
  id: string;
  email: string;
  name: string;
  academicId: string;
  status: UserStatus;
  permissions: string[];
  isSystemRole: boolean;
}

/**
 * توسيع الجلسة لتشمل البيانات الإضافية
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: ExtendedUser;
  }

  interface User extends ExtendedUser {}
}

/**
 * توسيع JWT لتشمل البيانات الإضافية
 */
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    academicId: string;
    status: UserStatus;
    permissions: string[];
    isSystemRole: boolean;
  }
}

/**
 * بيانات تسجيل الدخول
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * نتيجة محاولة تسجيل الدخول
 */
export interface LoginResult {
  success: boolean;
  error?: string;
}
