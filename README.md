# 🎓 UniCore-OS

> **نظام إدارة جامعي ذكي متكامل**  
> University Management System with AI-Powered Features

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748?logo=prisma)](https://www.prisma.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

**[العربية](#-الميزات-الرئيسية) | [English](#-key-features)**

</div>

---

## ✨ الميزات الرئيسية

| الميزة | الوصف |
|--------|-------|
| 🔐 **نظام صلاحيات متقدم** | 52 صلاحية + أدوار مخصصة + Super Admin |
| 🏛️ **الهيكل الأكاديمي** | كليات → أقسام → تخصصات → مقررات → شُعب |
| ✍️ **محرك الكويزات** | MCQ + True/False + Short Answer + مؤقت |
| 🧠 **ذكاء اصطناعي** | توليد أسئلة + تصحيح المقالي (OpenAI/Gemini) |
| 📁 **إدارة الملفات** | رفع/تحميل + Drag & Drop + UUID Storage |
| 🔔 **الإشعارات** | نشر كويز + رفع ملف + تصحيح إجابات |
| 📊 **التقارير** | كشف درجات + Gradebook + CSV Export |
| ⚙️ **الإعدادات** | تعديل الملف الشخصي + تغيير كلمة المرور |

---

## 🛠️ التقنيات المستخدمة

```
Frontend:     Next.js 15 + React 19 + TypeScript 5
Styling:      TailwindCSS 4 + shadcn/ui + Radix UI
Database:     SQLite (Dev) / PostgreSQL (Prod) + Prisma 5
Auth:         NextAuth v5 + bcryptjs + JWT Sessions
AI:           OpenAI GPT-4 / Google Gemini (Structured Output)
Validation:   Zod + Server Actions
Icons:        Lucide React
```

---

## 🚀 التثبيت السريع

### المتطلبات
- Node.js 18+
- pnpm (موصى به) أو npm

### الخطوات

```bash
# 1. استنساخ المستودع
git clone https://github.com/MoTechSys/UniCore-OS.git
cd UniCore-OS/app

# 2. تثبيت المكتبات
pnpm install

# 3. إعداد البيئة
cp .env.example .env
# عدّل الملف وأضف:
# DATABASE_URL="file:./dev.db"
# AUTH_SECRET="your-secret-key-here"
# OPENAI_API_KEY="sk-..." (اختياري للـ AI)

# 4. إعداد قاعدة البيانات
npx prisma db push
npx prisma db seed

# 5. تشغيل التطبيق
pnpm dev
```

افتح المتصفح على: **http://localhost:3000**

---

## 🔑 بيانات الدخول الافتراضية

| الدور | البريد الإلكتروني | كلمة المرور |
|-------|------------------|-------------|
| **Super Admin** | `admin@unicore.edu.sa` | `Admin@123456` |
| **مدرس** | `dr.ahmad@unicore.edu.sa` | `Doctor@123456` |
| **طالب** | `student1@unicore.edu.sa` | `Student@123456` |

---

## 📁 هيكل المشروع

```
UniCore-OS/
├── app/                          # تطبيق Next.js
│   ├── prisma/
│   │   ├── schema.prisma        # 20 جدول
│   │   └── seed.ts              # بيانات أولية
│   └── src/
│       ├── app/                 # App Router
│       │   ├── (auth)/          # صفحات تسجيل الدخول
│       │   └── (dashboard)/     # الصفحات المحمية
│       ├── components/          # UI Components
│       ├── features/            # Feature Modules
│       │   ├── auth/           # المصادقة
│       │   ├── users/          # إدارة المستخدمين
│       │   ├── roles/          # الأدوار والصلاحيات
│       │   ├── quizzes/        # محرك الكويزات
│       │   ├── ai/             # خدمات الذكاء الاصطناعي
│       │   ├── resources/      # إدارة الملفات
│       │   ├── notifications/  # الإشعارات
│       │   ├── reports/        # التقارير
│       │   └── settings/       # الإعدادات
│       ├── lib/                 # Utilities
│       │   ├── auth/           # NextAuth Config
│       │   ├── db.ts           # Prisma Client
│       │   └── storage/        # File Storage
│       └── config/             # Navigation & Settings
└── docs/                        # التوثيق
    ├── MASTER_BLUEPRINT.md     # الفلسفة والمتطلبات
    ├── PROJECT_STATUS.md       # حالة المشروع (100%)
    └── AUTH_SYSTEM_REPORT.md   # تقرير نظام المصادقة
```

---

## 📸 لقطات الشاشة

<!-- أضف لقطات الشاشة هنا -->
| لوحة التحكم | محرر الكويزات |
|-------------|---------------|
| ![Dashboard](./docs/screenshots/dashboard.png) | ![Quiz Editor](./docs/screenshots/quiz-editor.png) |

| سجل الدرجات | الإعدادات |
|-------------|-----------|
| ![Gradebook](./docs/screenshots/gradebook.png) | ![Settings](./docs/screenshots/settings.png) |

---

## 🔒 الأمان

- ✅ **Server Actions**: جميع العمليات الحساسة على الخادم
- ✅ **RBAC**: نظام صلاحيات دقيق (52 صلاحية)
- ✅ **Soft Delete**: لا يتم حذف أي بيانات نهائياً
- ✅ **Password Hashing**: bcrypt مع salt rounds
- ✅ **Session Validation**: التحقق في كل طلب
- ✅ **Input Validation**: Zod schemas

---

## 🌐 النشر (Deployment)

### Vercel (موصى به)
```bash
# 1. ربط المشروع
vercel link

# 2. إضافة متغيرات البيئة في Vercel Dashboard
# - DATABASE_URL (Neon/Supabase PostgreSQL)
# - AUTH_SECRET
# - OPENAI_API_KEY

# 3. النشر
vercel --prod
```

### Docker
```dockerfile
# قريباً...
```

---

## 📚 التوثيق الإضافي

| الملف | الوصف |
|-------|-------|
| [MASTER_BLUEPRINT.md](./docs/MASTER_BLUEPRINT.md) | الفلسفة الكاملة والمتطلبات التفصيلية |
| [PROJECT_STATUS.md](./docs/PROJECT_STATUS.md) | خارطة طريق المشروع (100% مكتملة) |
| [AUTH_SYSTEM_REPORT.md](./docs/AUTH_SYSTEM_REPORT.md) | تقرير فني عن نظام المصادقة |

---

## 🤝 المساهمة

المساهمات مرحب بها! يرجى قراءة [دليل المساهمة](./CONTRIBUTING.md) أولاً.

---

## 📄 الترخيص

MIT License - راجع ملف [LICENSE](./LICENSE)

---

<div align="center">

**صُنع بـ ❤️ وذكاء اصطناعي بواسطة MoTechSys**

**Powered by MAX EVOLVED | 2026**

</div>
