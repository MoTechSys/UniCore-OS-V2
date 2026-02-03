# 🚀 وثيقة التسليم والانتقال الشاملة - UniCore-OS

**إلى الذكاء الاصطناعي القادم،**

أنا MAX، الذكاء الاصطناعي الذي بنى أساس هذا المشروع. مهمتي انتهت هنا، ومهمتك تبدأ الآن. هذه الوثيقة هي **"مفتاح التشغيل"** الخاص بك. اقرأها بدقة، فهي تحتوي على **كل ما تحتاجه** لإكمال المشروع بنفس الجودة والمعايير.

---

## 📋 جدول المحتويات

1. [ملخص الحالة التقنية](#1-ملخص-الحالة-التقنية)
2. [هيكل المشروع](#2-هيكل-المشروع)
3. [دستور العمل (MAX Standards)](#3-دستور-العمل-max-standards)
4. [أمثلة كود حقيقية من المشروع](#4-أمثلة-كود-حقيقية-من-المشروع)
5. [هيكل قاعدة البيانات](#5-هيكل-قاعدة-البيانات)
6. [خارطة الطريق المتبقية بالتفصيل](#6-خارطة-الطريق-المتبقية-بالتفصيل)
7. [رسالة التشغيل](#7-رسالة-التشغيل)

---

## 1. ملخص الحالة التقنية

| العنصر | التفاصيل |
|---|---|
| **المستودع** | `https://github.com/MoTechSys/UniCore-OS` |
| **Framework** | `Next.js 15+` (App Router) |
| **Auth** | `NextAuth v5` (Beta) - Credentials Provider |
| **ORM** | `Prisma 5` |
| **Database** | `SQLite` (للتطوير) - قابل للتحويل إلى PostgreSQL |
| **UI** | `shadcn/ui` + `TailwindCSS` |
| **Validation** | `Zod` |
| **الإنجاز** | **35%** |

### الحزم المكتملة:
- ✅ **المصادقة (Auth)**: NextAuth v5 مع Credentials Provider
- ✅ **إدارة المستخدمين (User Management)**: CRUD كامل مع Server Components
- ✅ **إدارة الأدوار (Role Management)**: مصفوفة صلاحيات ديناميكية (52 صلاحية)

---

## 2. هيكل المشروع

```
UniCore-OS/
├── app/                          # مجلد التطبيق الرئيسي
│   ├── prisma/
│   │   ├── schema.prisma         # هيكل قاعدة البيانات (20 جدول)
│   │   └── seed.ts               # البيانات الأولية
│   └── src/
│       ├── app/                  # App Router Pages
│       │   ├── (auth)/           # صفحات المصادقة (login)
│       │   ├── (dashboard)/      # صفحات لوحة التحكم
│       │   │   ├── users/        # إدارة المستخدمين
│       │   │   └── roles/        # إدارة الأدوار
│       │   └── layout.tsx        # Layout الرئيسي
│       ├── components/
│       │   ├── ui/               # shadcn/ui components
│       │   ├── layout/           # DashboardLayout, Sidebar
│       │   └── auth/             # PermissionGate
│       ├── features/             # ⭐ الميزات (الأهم)
│       │   ├── users/
│       │   │   ├── actions/      # Server Actions
│       │   │   └── components/   # Client Components
│       │   └── roles/
│       │       ├── actions/      # Server Actions
│       │       └── components/   # Client Components
│       ├── lib/
│       │   ├── auth.ts           # NextAuth configuration
│       │   ├── prisma.ts         # Prisma client
│       │   └── db.ts             # Prisma alias
│       ├── config/
│       │   └── navigation.ts     # Sidebar items with permissions
│       └── hooks/
│           └── use-permissions.ts # Permission hooks
└── docs/                         # التوثيق
    ├── MASTER_BLUEPRINT.md       # المخطط الرئيسي
    ├── PROJECT_STATUS.md         # حالة المشروع
    └── ROADMAP.md                # خارطة الطريق
```

---

## 3. دستور العمل (MAX Standards)

### ⚠️ هذه القواعد صارمة ولا يجوز كسرها:

### 3.1. No `any` Types
```typescript
// ❌ ممنوع
const data: any = await fetch(...)

// ✅ صحيح
interface UserData {
  id: string
  email: string
  // ...
}
const data: UserData = await fetch(...)
```

### 3.2. Server Actions فقط للعمليات
```typescript
// ❌ ممنوع - API Routes
// app/api/users/route.ts

// ✅ صحيح - Server Actions
// features/users/actions/index.ts
"use server"

export async function createUser(input: CreateUserInput): Promise<ActionResult> {
  // ...
}
```

### 3.3. التحقق من الصلاحيات أولاً
```typescript
export async function createUser(input: CreateUserInput) {
  // ✅ أول سطر دائماً
  await requirePermission("user.create")
  
  // ... باقي الكود
}
```

### 3.4. Zod للتحقق من المدخلات
```typescript
const createUserSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  firstNameAr: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  // ...
})

export async function createUser(input: CreateUserInput) {
  await requirePermission("user.create")
  
  // ✅ التحقق من المدخلات
  const validated = createUserSchema.parse(input)
  
  // ... باقي الكود
}
```

### 3.5. Clean Architecture
```
الصفحة (Server Component) → المحتوى (Client Component) → Server Actions
        ↓                           ↓                         ↓
   app/(dashboard)/users/page.tsx   UsersPageContent.tsx    features/users/actions/
```

---

## 4. أمثلة كود حقيقية من المشروع

### 4.1. Server Component (صفحة)

**الملف:** `app/(dashboard)/users/page.tsx`

```typescript
/**
 * Users Management Page (Server Component)
 */

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { UsersPageContent } from "@/features/users/components/UsersPageContent"

export default async function UsersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  // 1. التحقق من المصادقة والصلاحيات على السيرفر
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login?callbackUrl=/users")
  }

  // 2. التحقق من الصلاحية
  const isSystemRole = session.user.isSystemRole ?? false
  const permissions = session.user.permissions ?? []
  const hasViewPermission = isSystemRole || permissions.includes("user.view")

  if (!hasViewPermission) {
    redirect("/unauthorized")
  }

  // 3. تحديد الصلاحيات للواجهة
  const canCreate = isSystemRole || permissions.includes("user.create")
  const canEdit = isSystemRole || permissions.includes("user.edit")
  const canDelete = isSystemRole || permissions.includes("user.delete")
  const canFreeze = isSystemRole || permissions.includes("user.freeze")

  // 4. جلب البيانات
  const params = await searchParams
  const data = await getUsersData(params)

  // 5. تمرير البيانات إلى Client Component
  return (
    <DashboardLayout title="إدارة المستخدمين">
      <UsersPageContent
        initialData={data}
        permissions={{ canCreate, canEdit, canDelete, canFreeze }}
        searchParams={params}
      />
    </DashboardLayout>
  )
}
```

### 4.2. Client Component (محتوى الصفحة)

**الملف:** `features/users/components/UsersPageContent.tsx`

```typescript
"use client"

/**
 * Users Page Content (Client Component)
 */

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

interface UsersPageContentProps {
  initialData: {
    users: UserData[]
    total: number
    page: number
    pageSize: number
    totalPages: number
    roles: RoleData[]
  }
  permissions: {
    canCreate: boolean
    canEdit: boolean
    canDelete: boolean
    canFreeze: boolean
  }
  searchParams: { page?: string; search?: string; status?: string }
}

export function UsersPageContent({ initialData, permissions, searchParams }: UsersPageContentProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // ... باقي الكود

  return (
    <div className="space-y-6">
      {/* Stats */}
      <UsersStats users={initialData.users} total={initialData.total} />

      {/* Filters */}
      <Card>
        {/* ... */}
        {permissions.canCreate && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            إضافة مستخدم
          </Button>
        )}
      </Card>

      {/* Table */}
      <UsersTable users={initialData.users} permissions={permissions} />

      {/* Modal */}
      <CreateUserModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        roles={initialData.roles}
        onSuccess={() => router.refresh()}
      />
    </div>
  )
}
```

### 4.3. Server Action

**الملف:** `features/users/actions/index.ts`

```typescript
"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { requirePermission } from "@/lib/auth/permissions"
import { hashPassword } from "@/lib/auth"

// 1. تعريف Schema
const createUserSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  firstNameAr: z.string().min(2, "الاسم الأول يجب أن يكون حرفين على الأقل"),
  lastNameAr: z.string().min(2, "الاسم الأخير يجب أن يكون حرفين على الأقل"),
  academicId: z.string().min(1, "الرقم الأكاديمي مطلوب"),
  nationalId: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  roleIds: z.array(z.string()).min(1, "يجب تحديد دور واحد على الأقل"),
})

// 2. تعريف Types
export type CreateUserInput = z.infer<typeof createUserSchema>

export interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

// 3. Server Action
export async function createUser(input: CreateUserInput): Promise<ActionResult<{ id: string }>> {
  try {
    // أ. التحقق من الصلاحية
    await requirePermission("user.create")

    // ب. التحقق من المدخلات
    const validated = createUserSchema.parse(input)

    // ج. التحقق من عدم تكرار البريد
    const existingEmail = await db.user.findFirst({
      where: { email: validated.email, deletedAt: null },
    })
    if (existingEmail) {
      return { success: false, error: "البريد الإلكتروني مستخدم بالفعل" }
    }

    // د. تشفير كلمة المرور
    const hashedPassword = await hashPassword(validated.password)

    // هـ. إنشاء المستخدم
    const user = await db.user.create({
      data: {
        email: validated.email,
        academicId: validated.academicId,
        nationalId: validated.nationalId,
        passwordHash: hashedPassword,
        status: "ACTIVE",
        profile: {
          create: {
            firstNameAr: validated.firstNameAr,
            lastNameAr: validated.lastNameAr,
            phone: validated.phone,
          },
        },
        roles: {
          create: validated.roleIds.map((roleId) => ({
            role: { connect: { id: roleId } },
          })),
        },
      },
    })

    // و. تحديث الصفحة
    revalidatePath("/users")
    return { success: true, data: { id: user.id } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    return { success: false, error: "فشل في إنشاء المستخدم" }
  }
}
```

---

## 5. هيكل قاعدة البيانات

### الجداول الرئيسية (20 جدول):

| الجدول | الوصف | العلاقات |
|--------|-------|----------|
| `User` | المستخدمين | → UserProfile, UserRole, Enrollment, QuizAttempt |
| `UserProfile` | بيانات المستخدم الشخصية | → User, Major |
| `Role` | الأدوار | → RolePermission, UserRole |
| `Permission` | الصلاحيات (52 صلاحية) | → RolePermission |
| `RolePermission` | ربط الأدوار بالصلاحيات | → Role, Permission |
| `UserRole` | ربط المستخدمين بالأدوار | → User, Role |
| `College` | الكليات | → Department |
| `Department` | الأقسام | → College, Major, Course |
| `Major` | التخصصات | → Department, UserProfile |
| `Course` | المقررات | → Department, CourseOffering |
| `Semester` | الفصول الدراسية | → CourseOffering |
| `CourseOffering` | الشُعب | → Course, Semester, Enrollment, Quiz |
| `Enrollment` | تسجيل الطلاب | → User, CourseOffering |
| `Quiz` | الكويزات | → CourseOffering, Question, QuizAttempt |
| `Question` | الأسئلة | → Quiz, Option, Answer |
| `Option` | خيارات الأسئلة | → Question, Answer |
| `QuizAttempt` | محاولات الكويز | → Quiz, User, Answer |
| `Answer` | إجابات الطلاب | → QuizAttempt, Question, Option |
| `File` | الملفات | → CourseOffering, User |
| `Notification` | الإشعارات | → User |
| `AuditLog` | سجل التدقيق | → User |

---

## 6. خارطة الطريق المتبقية بالتفصيل

### ⏳ الحزمة 4: الهيكل الأكاديمي (Academic Structure)

**الهدف:** إدارة الكليات، الأقسام، التخصصات، والمقررات.

**الملفات المطلوب إنشاؤها:**

```
src/
├── app/(dashboard)/academic/page.tsx          # Server Component
├── features/academic/
│   ├── actions/
│   │   └── index.ts                           # Server Actions
│   └── components/
│       ├── AcademicPageContent.tsx            # Client Component
│       ├── CollegeTree.tsx                    # عرض شجري للكليات
│       ├── CreateCollegeModal.tsx             # Modal إنشاء كلية
│       ├── CreateDepartmentModal.tsx          # Modal إنشاء قسم
│       ├── CreateMajorModal.tsx               # Modal إنشاء تخصص
│       └── index.ts
```

**Server Actions المطلوبة:**

```typescript
// features/academic/actions/index.ts
"use server"

// الكليات
export async function getColleges(): Promise<ActionResult<College[]>>
export async function createCollege(input: CreateCollegeInput): Promise<ActionResult>
export async function updateCollege(input: UpdateCollegeInput): Promise<ActionResult>
export async function deleteCollege(id: string): Promise<ActionResult>

// الأقسام
export async function getDepartments(collegeId: string): Promise<ActionResult<Department[]>>
export async function createDepartment(input: CreateDepartmentInput): Promise<ActionResult>
export async function updateDepartment(input: UpdateDepartmentInput): Promise<ActionResult>
export async function deleteDepartment(id: string): Promise<ActionResult>

// التخصصات
export async function getMajors(departmentId: string): Promise<ActionResult<Major[]>>
export async function createMajor(input: CreateMajorInput): Promise<ActionResult>
export async function updateMajor(input: UpdateMajorInput): Promise<ActionResult>
export async function deleteMajor(id: string): Promise<ActionResult>
```

**الصلاحيات المطلوبة:**
- `college.manage` - إدارة الكليات
- `department.manage` - إدارة الأقسام
- `major.manage` - إدارة التخصصات

**فكرة التصميم:**
- استخدم **Accordion متداخل** أو **Tree View**
- المستوى الأول: الكليات
- المستوى الثاني: الأقسام (عند فتح كلية)
- المستوى الثالث: التخصصات (عند فتح قسم)

---

### ⏳ الحزمة 5: إدارة الفصول والشُعب (Class Management)

**الهدف:** إدارة الفصول الدراسية، الشُعب، وتسجيل الطلاب.

**الملفات المطلوب إنشاؤها:**

```
src/
├── app/(dashboard)/
│   ├── semesters/page.tsx                     # إدارة الفصول
│   ├── courses/page.tsx                       # إدارة المقررات
│   └── offerings/[id]/page.tsx                # تفاصيل الشعبة
├── features/
│   ├── semesters/
│   │   ├── actions/index.ts
│   │   └── components/
│   ├── courses/
│   │   ├── actions/index.ts
│   │   └── components/
│   └── offerings/
│       ├── actions/index.ts
│       └── components/
│           ├── OfferingDetails.tsx
│           ├── EnrollStudentModal.tsx         # تسجيل طالب
│           └── StudentsList.tsx               # قائمة الطلاب المسجلين
```

**Server Actions المطلوبة:**

```typescript
// features/offerings/actions/index.ts
"use server"

// تسجيل الطلاب
export async function enrollStudent(input: {
  offeringId: string
  studentId: string
}): Promise<ActionResult>

export async function unenrollStudent(input: {
  offeringId: string
  studentId: string
}): Promise<ActionResult>

export async function getEnrolledStudents(offeringId: string): Promise<ActionResult<Student[]>>

export async function searchStudents(query: string): Promise<ActionResult<Student[]>>
```

**الصلاحيات المطلوبة:**
- `semester.view`, `semester.manage`
- `course.view`, `course.create`, `course.edit`, `course.delete`
- `offering.manage`, `offering.enroll`

---

### ⏳ الحزمة 6: محرك الكويزات (Quiz Engine) - **الأكثر تعقيداً**

**الهدف:** بناء نظام كويزات متكامل.

**الملفات المطلوب إنشاؤها:**

```
src/
├── app/(dashboard)/
│   ├── quizzes/page.tsx                       # قائمة الكويزات
│   ├── quizzes/create/page.tsx                # إنشاء كويز
│   ├── quizzes/[id]/page.tsx                  # تفاصيل الكويز
│   ├── quizzes/[id]/edit/page.tsx             # تعديل الكويز
│   └── quizzes/[id]/take/page.tsx             # تقديم الكويز (للطالب)
├── features/quizzes/
│   ├── actions/
│   │   └── index.ts
│   └── components/
│       ├── QuizzesPageContent.tsx
│       ├── QuizWizard.tsx                     # معالج إنشاء الكويز
│       ├── QuestionEditor.tsx                 # محرر الأسئلة
│       ├── QuestionTypes/
│       │   ├── MultipleChoice.tsx
│       │   ├── TrueFalse.tsx
│       │   └── ShortAnswer.tsx
│       ├── QuizTaker.tsx                      # واجهة تقديم الكويز
│       ├── QuizTimer.tsx                      # عداد الوقت
│       └── QuizResults.tsx                    # نتائج الكويز
```

**Server Actions المطلوبة:**

```typescript
// features/quizzes/actions/index.ts
"use server"

// إدارة الكويزات
export async function createQuiz(input: CreateQuizInput): Promise<ActionResult<{ id: string }>>
export async function updateQuiz(input: UpdateQuizInput): Promise<ActionResult>
export async function deleteQuiz(id: string): Promise<ActionResult>
export async function publishQuiz(id: string): Promise<ActionResult>
export async function closeQuiz(id: string): Promise<ActionResult>

// إدارة الأسئلة
export async function addQuestion(input: AddQuestionInput): Promise<ActionResult>
export async function updateQuestion(input: UpdateQuestionInput): Promise<ActionResult>
export async function deleteQuestion(id: string): Promise<ActionResult>
export async function reorderQuestions(quizId: string, questionIds: string[]): Promise<ActionResult>

// تقديم الكويز
export async function startQuizAttempt(quizId: string): Promise<ActionResult<{ attemptId: string }>>
export async function submitAnswer(input: SubmitAnswerInput): Promise<ActionResult>
export async function submitQuiz(attemptId: string): Promise<ActionResult>

// التصحيح
export async function gradeEssayAnswer(input: GradeEssayInput): Promise<ActionResult>
```

**أنواع الأسئلة:**

```typescript
type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER"

interface Question {
  id: string
  quizId: string
  type: QuestionType
  text: string
  points: number
  order: number
  options?: Option[]  // للأسئلة الاختيارية
}

interface Option {
  id: string
  questionId: string
  text: string
  isCorrect: boolean
  order: number
}
```

**الصلاحيات المطلوبة:**
- `quiz.view`, `quiz.create`, `quiz.edit`, `quiz.delete`, `quiz.publish`
- `quiz.grade` - تصحيح الأسئلة المقالية
- `quiz.take` - تقديم الكويز (للطلاب)

---

### ⏳ الحزمة 7: تكامل الذكاء الاصطناعي (AI Integration)

**الهدف:** استخدام AI لإنشاء الأسئلة وتقييم الإجابات.

**الملفات المطلوب إنشاؤها:**

```
src/
├── features/ai/
│   ├── actions/
│   │   └── index.ts
│   └── components/
│       ├── AIQuestionGenerator.tsx            # توليد أسئلة من محتوى
│       └── AIEssayGrader.tsx                  # تقييم الإجابات المقالية
├── lib/
│   └── ai.ts                                  # OpenAI client
```

**Server Actions المطلوبة:**

```typescript
// features/ai/actions/index.ts
"use server"

export async function generateQuestions(input: {
  content: string
  count: number
  type: QuestionType
  difficulty: "EASY" | "MEDIUM" | "HARD"
}): Promise<ActionResult<Question[]>>

export async function gradeEssay(input: {
  question: string
  answer: string
  rubric?: string
}): Promise<ActionResult<{ score: number; feedback: string }>>
```

**الصلاحيات المطلوبة:**
- `ai.generate_quiz`
- `ai.summarize`
- `ai.chat`

---

### ⏳ الحزمة 8: إدارة الملفات (File Management)

**الملفات المطلوب إنشاؤها:**

```
src/
├── app/(dashboard)/files/page.tsx
├── features/files/
│   ├── actions/index.ts
│   └── components/
│       ├── FileUploader.tsx
│       ├── FilesList.tsx
│       └── FilePreview.tsx
```

**الصلاحيات المطلوبة:**
- `file.view`, `file.upload`, `file.delete`

---

### ⏳ الحزمة 9: الإشعارات (Notifications)

**الملفات المطلوب إنشاؤها:**

```
src/
├── app/(dashboard)/notifications/page.tsx
├── features/notifications/
│   ├── actions/index.ts
│   └── components/
│       ├── NotificationsList.tsx
│       └── NotificationBell.tsx               # في Header
```

---

### ⏳ الحزمة 10: التقارير والإعدادات (Reports & Settings)

**الملفات المطلوب إنشاؤها:**

```
src/
├── app/(dashboard)/
│   ├── reports/page.tsx
│   └── settings/page.tsx
├── features/
│   ├── reports/
│   └── settings/
```

---

## 9. رسالة التسليم النهائية (The Ultimate Handover Prompt)

**انسخ هذه الرسالة وألصقها في حسابك الجديد لبدء العمل فوراً:**

```
مرحباً، أنا الذكاء الاصطناعي الجديد المكلف بإكمال مشروع UniCore-OS.

## ما أعرفه:
1. **المستودع:** https://github.com/MoTechSys/UniCore-OS
2. **التقنيات:** Next.js 15+ (App Router), NextAuth v5, Prisma 5, SQLite, shadcn/ui
3. **الإنجاز الحالي:** ~40% (Auth + Users + Roles + Dashboard)
4. **آخر تحديث:** الصفحة الرئيسية للداشبورد جاهزة ومتجاوبة مع بطاقات إحصائيات حقيقية.
5. **المتبقي:** 6 حزم (Academic, Classes, Quizzes, AI, Files, Notifications, Reports)

## معايير MAX التي سألتزم بها:
- ❌ No `any` types
- ✅ Server Actions فقط للعمليات
- ✅ التحقق من الصلاحيات أولاً (`requirePermission`)
- ✅ Zod للتحقق من المدخلات
- ✅ Clean Architecture (Server Component → Client Component → Server Actions)
- ✅ التجاوب مع الشاشات الصغيرة (Mobile First)

## مهمتي الحالية:
البدء في تنفيذ **الحزمة 4: الهيكل الأكاديمي** وفق الخطة التالية:

1. **إنشاء الصفحة:** `app/(dashboard)/academic/page.tsx` (Server Component)
2. **إنشاء Server Actions:** `features/academic/actions/index.ts` (CRUD للكليات، الأقسام، التخصصات)
3. **إنشاء المكونات:** `features/academic/components/` (Accordion متداخل لعرض الكليات ← الأقسام ← التخصصات)
4. **التحقق من الصلاحيات:** `college.manage`, `department.manage`, `major.manage`

## أول خطوة:
سأقوم بـ:
1. استنساخ المستودع
2. قراءة `prisma/schema.prisma` و `docs/MIGRATION_GUIDE_DETAILED.md`
3. البدء في كتابة Server Actions للكليات

**لا داعي لتكرار التعليمات. كل شيء واضح. سأبدأ الآن.**
```

---

## 📎 ملاحظات إضافية

### كيفية تشغيل المشروع:
```bash
# 1. استنساخ المستودع
gh repo clone MoTechSys/UniCore-OS

# 2. الدخول لمجلد التطبيق
cd UniCore-OS/app

# 3. تثبيت الحزم
pnpm install

# 4. إنشاء قاعدة البيانات
pnpm prisma db push
pnpm prisma db seed

# 5. تشغيل التطبيق
pnpm dev
```

### بيانات تسجيل الدخول:
- **البريد:** `admin@unicore.edu.sa`
- **كلمة المرور:** `Admin@123456`

---

**مهمتك واضحة. أكمل المسيرة بنفس الجودة. بالتوفيق.**

**- MAX 🔥**


---

## 8. Project Structure & Links

### 8.1. GitHub Repository

**الرابط:** `https://github.com/MoTechSys/UniCore-OS`

### 8.2. Critical Paths Map

| الوصف | المسار |
|---|---|
| **منطق المصادقة** | `src/lib/auth.ts` |
| **هيكل قاعدة البيانات** | `prisma/schema.prisma` |
| **مكونات الواجهة (shadcn)** | `src/components/ui/` |
| **Layout لوحة التحكم** | `src/app/(dashboard)/layout.tsx` |
| **الـ Sidebar** | `src/components/layout/Sidebar.tsx` |
| **عناصر القائمة** | `src/config/navigation.ts` |
| **Server Actions** | `src/features/[feature]/actions/` |
| **Client Components** | `src/features/[feature]/components/` |
|`
