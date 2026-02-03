/**
 * UniCore-OS Database Seed
 * =========================
 * 
 * هذا الملف يقوم بزراعة البيانات الأساسية للنظام.
 * 
 * @author MAX EVOLVED
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// إنشاء Prisma Client (Prisma 5 - Standard)
const prisma = new PrismaClient();

// ============================================
// الصلاحيات الذرية (52 صلاحية)
// ============================================

const PERMISSIONS = [
  // ========== المستخدمين (7) ==========
  { code: 'user.view', nameAr: 'عرض المستخدمين', nameEn: 'View Users', category: 'users', description: 'عرض قائمة المستخدمين وتفاصيلهم' },
  { code: 'user.create', nameAr: 'إنشاء مستخدم', nameEn: 'Create User', category: 'users', description: 'إنشاء مستخدم جديد يدوياً' },
  { code: 'user.edit', nameAr: 'تعديل مستخدم', nameEn: 'Edit User', category: 'users', description: 'تعديل بيانات المستخدمين' },
  { code: 'user.delete', nameAr: 'حذف مستخدم', nameEn: 'Delete User', category: 'users', description: 'حذف مستخدم (Soft Delete)' },
  { code: 'user.freeze', nameAr: 'تجميد مستخدم', nameEn: 'Freeze User', category: 'users', description: 'تجميد/إلغاء تجميد حساب مستخدم' },
  { code: 'user.import', nameAr: 'استيراد مستخدمين', nameEn: 'Import Users', category: 'users', description: 'استيراد مستخدمين من ملف Excel' },
  { code: 'user.export', nameAr: 'تصدير مستخدمين', nameEn: 'Export Users', category: 'users', description: 'تصدير بيانات المستخدمين إلى Excel' },

  // ========== الأدوار (5) ==========
  { code: 'role.view', nameAr: 'عرض الأدوار', nameEn: 'View Roles', category: 'roles', description: 'عرض قائمة الأدوار والصلاحيات' },
  { code: 'role.create', nameAr: 'إنشاء دور', nameEn: 'Create Role', category: 'roles', description: 'إنشاء دور جديد' },
  { code: 'role.edit', nameAr: 'تعديل دور', nameEn: 'Edit Role', category: 'roles', description: 'تعديل دور وصلاحياته' },
  { code: 'role.delete', nameAr: 'حذف دور', nameEn: 'Delete Role', category: 'roles', description: 'حذف دور (Soft Delete)' },
  { code: 'role.assign', nameAr: 'تعيين دور', nameEn: 'Assign Role', category: 'roles', description: 'تعيين/إلغاء تعيين دور لمستخدم' },

  // ========== الهيكل الأكاديمي (6) ==========
  { code: 'college.manage', nameAr: 'إدارة الكليات', nameEn: 'Manage Colleges', category: 'academic', description: 'إنشاء وتعديل وحذف الكليات' },
  { code: 'department.manage', nameAr: 'إدارة الأقسام', nameEn: 'Manage Departments', category: 'academic', description: 'إنشاء وتعديل وحذف الأقسام' },
  { code: 'major.manage', nameAr: 'إدارة التخصصات', nameEn: 'Manage Majors', category: 'academic', description: 'إنشاء وتعديل وحذف التخصصات' },
  { code: 'semester.view', nameAr: 'عرض الفصول', nameEn: 'View Semesters', category: 'academic', description: 'عرض الفصول الدراسية' },
  { code: 'semester.manage', nameAr: 'إدارة الفصول', nameEn: 'Manage Semesters', category: 'academic', description: 'إنشاء وتعديل الفصول الدراسية' },
  { code: 'semester.set_current', nameAr: 'تعيين الفصل الحالي', nameEn: 'Set Current Semester', category: 'academic', description: 'تعيين الفصل الدراسي الحالي' },

  // ========== المقررات (4) ==========
  { code: 'course.view', nameAr: 'عرض المقررات', nameEn: 'View Courses', category: 'courses', description: 'عرض قائمة المقررات' },
  { code: 'course.create', nameAr: 'إنشاء مقرر', nameEn: 'Create Course', category: 'courses', description: 'إنشاء مقرر جديد' },
  { code: 'course.edit', nameAr: 'تعديل مقرر', nameEn: 'Edit Course', category: 'courses', description: 'تعديل بيانات المقرر' },
  { code: 'course.delete', nameAr: 'حذف مقرر', nameEn: 'Delete Course', category: 'courses', description: 'حذف مقرر (Soft Delete)' },

  // ========== الشعب (6) ==========
  { code: 'offering.view', nameAr: 'عرض الشعب', nameEn: 'View Offerings', category: 'offerings', description: 'عرض الشعب الدراسية' },
  { code: 'offering.create', nameAr: 'إنشاء شعبة', nameEn: 'Create Offering', category: 'offerings', description: 'إنشاء شعبة دراسية جديدة' },
  { code: 'offering.edit', nameAr: 'تعديل شعبة', nameEn: 'Edit Offering', category: 'offerings', description: 'تعديل بيانات الشعبة' },
  { code: 'offering.delete', nameAr: 'حذف شعبة', nameEn: 'Delete Offering', category: 'offerings', description: 'حذف شعبة (Soft Delete)' },
  { code: 'offering.assign_instructor', nameAr: 'تعيين مدرس', nameEn: 'Assign Instructor', category: 'offerings', description: 'تعيين مدرس للشعبة' },
  { code: 'offering.enroll_students', nameAr: 'تسجيل طلاب', nameEn: 'Enroll Students', category: 'offerings', description: 'تسجيل طلاب في الشعبة' },

  // ========== الملفات (5) ==========
  { code: 'file.view', nameAr: 'عرض الملفات', nameEn: 'View Files', category: 'files', description: 'عرض الملفات المتاحة' },
  { code: 'file.upload', nameAr: 'رفع ملف', nameEn: 'Upload File', category: 'files', description: 'رفع ملفات جديدة' },
  { code: 'file.download', nameAr: 'تحميل ملف', nameEn: 'Download File', category: 'files', description: 'تحميل الملفات' },
  { code: 'file.delete', nameAr: 'حذف ملف', nameEn: 'Delete File', category: 'files', description: 'حذف ملف (Soft Delete)' },
  { code: 'file.manage_all', nameAr: 'إدارة جميع الملفات', nameEn: 'Manage All Files', category: 'files', description: 'إدارة ملفات جميع المستخدمين' },

  // ========== الاختبارات (7) ==========
  { code: 'quiz.view', nameAr: 'عرض الاختبارات', nameEn: 'View Quizzes', category: 'quizzes', description: 'عرض قائمة الاختبارات' },
  { code: 'quiz.create', nameAr: 'إنشاء اختبار', nameEn: 'Create Quiz', category: 'quizzes', description: 'إنشاء اختبار جديد' },
  { code: 'quiz.edit', nameAr: 'تعديل اختبار', nameEn: 'Edit Quiz', category: 'quizzes', description: 'تعديل بيانات الاختبار' },
  { code: 'quiz.delete', nameAr: 'حذف اختبار', nameEn: 'Delete Quiz', category: 'quizzes', description: 'حذف اختبار (Soft Delete)' },
  { code: 'quiz.publish', nameAr: 'نشر اختبار', nameEn: 'Publish Quiz', category: 'quizzes', description: 'نشر الاختبار للطلاب' },
  { code: 'quiz.grade', nameAr: 'تصحيح اختبار', nameEn: 'Grade Quiz', category: 'quizzes', description: 'تصحيح إجابات الطلاب' },
  { code: 'quiz.take', nameAr: 'أداء اختبار', nameEn: 'Take Quiz', category: 'quizzes', description: 'أداء الاختبار كطالب' },

  // ========== الإشعارات (3) ==========
  { code: 'notification.view', nameAr: 'عرض الإشعارات', nameEn: 'View Notifications', category: 'notifications', description: 'عرض الإشعارات' },
  { code: 'notification.send', nameAr: 'إرسال إشعار', nameEn: 'Send Notification', category: 'notifications', description: 'إرسال إشعارات للمستخدمين' },
  { code: 'notification.manage', nameAr: 'إدارة الإشعارات', nameEn: 'Manage Notifications', category: 'notifications', description: 'إدارة جميع الإشعارات' },

  // ========== الذكاء الاصطناعي (3) ==========
  { code: 'ai.generate_quiz', nameAr: 'توليد اختبار AI', nameEn: 'Generate AI Quiz', category: 'ai', description: 'توليد اختبارات باستخدام AI' },
  { code: 'ai.summarize', nameAr: 'تلخيص AI', nameEn: 'AI Summarize', category: 'ai', description: 'تلخيص المحتوى باستخدام AI' },
  { code: 'ai.chat', nameAr: 'محادثة AI', nameEn: 'AI Chat', category: 'ai', description: 'المحادثة مع مساعد AI' },

  // ========== النظام (6) ==========
  { code: 'system.settings', nameAr: 'إعدادات النظام', nameEn: 'System Settings', category: 'system', description: 'تعديل إعدادات النظام' },
  { code: 'system.audit_log', nameAr: 'سجل التدقيق', nameEn: 'Audit Log', category: 'system', description: 'عرض سجلات التدقيق' },
  { code: 'system.trash', nameAr: 'سلة المحذوفات', nameEn: 'Trash', category: 'system', description: 'عرض العناصر المحذوفة' },
  { code: 'system.trash_restore', nameAr: 'استعادة المحذوفات', nameEn: 'Restore Trash', category: 'system', description: 'استعادة العناصر المحذوفة' },
  { code: 'system.reports', nameAr: 'التقارير', nameEn: 'Reports', category: 'system', description: 'عرض وتصدير التقارير' },
  { code: 'system.backup', nameAr: 'النسخ الاحتياطي', nameEn: 'Backup', category: 'system', description: 'إدارة النسخ الاحتياطية' },
];

// ============================================
// إعدادات النظام الافتراضية
// ============================================

const SYSTEM_SETTINGS = [
  { key: 'system.name', value: 'UniCore-OS', description: 'اسم النظام' },
  { key: 'system.name_en', value: 'UniCore-OS', description: 'System Name (English)' },
  { key: 'system.logo', value: '/logo.png', description: 'شعار النظام' },
  { key: 'system.timezone', value: 'Asia/Riyadh', description: 'المنطقة الزمنية' },
  { key: 'system.language', value: 'ar', description: 'اللغة الافتراضية' },
  { key: 'system.rtl', value: 'true', description: 'اتجاه الواجهة' },
  { key: 'ai.enabled', value: 'true', description: 'تفعيل الذكاء الاصطناعي' },
  { key: 'ai.model', value: 'gpt-4.1-mini', description: 'نموذج AI المستخدم' },
  { key: 'ai.max_questions', value: '50', description: 'الحد الأقصى للأسئلة المولدة' },
  { key: 'quiz.default_duration', value: '30', description: 'مدة الاختبار الافتراضية (دقائق)' },
  { key: 'quiz.shuffle_questions', value: 'true', description: 'خلط الأسئلة افتراضياً' },
  { key: 'quiz.shuffle_options', value: 'true', description: 'خلط الخيارات افتراضياً' },
  { key: 'quiz.show_results', value: 'true', description: 'عرض النتائج بعد الاختبار' },
  { key: 'import.batch_size', value: '100', description: 'حجم الدفعة عند الاستيراد' },
  { key: 'import.max_file_size', value: '10485760', description: 'الحد الأقصى لحجم الملف (bytes)' },
];

// ============================================
// دوال الزراعة
// ============================================

async function seedPermissions() {
  console.log('🔐 زراعة الصلاحيات...');
  
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {
        nameAr: permission.nameAr,
        nameEn: permission.nameEn,
        category: permission.category,
        description: permission.description,
      },
      create: permission,
    });
  }
  
  console.log(`   ✅ تم إنشاء ${PERMISSIONS.length} صلاحية`);
}

async function seedSystemSettings() {
  console.log('⚙️ زراعة إعدادات النظام...');
  
  for (const setting of SYSTEM_SETTINGS) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, description: setting.description },
      create: setting,
    });
  }
  
  console.log(`   ✅ تم إنشاء ${SYSTEM_SETTINGS.length} إعداد`);
}

async function seedDefaultSemester() {
  console.log('📅 زراعة الفصل الدراسي الافتراضي...');
  
  const semester = await prisma.semester.upsert({
    where: { code: '2025-1' },
    update: {},
    create: {
      code: '2025-1',
      nameAr: 'الفصل الدراسي الأول 2025-2026',
      nameEn: 'First Semester 2025-2026',
      type: 'FIRST',
      year: 2025,
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-01-15'),
      isActive: true,
      isCurrent: true,
    },
  });
  
  console.log(`   ✅ تم إنشاء الفصل: ${semester.nameAr}`);
  return semester;
}

async function seedSuperAdminRole() {
  console.log('👑 زراعة دور السوبر أدمن...');
  
  const allPermissions = await prisma.permission.findMany();
  
  const superAdminRole = await prisma.role.upsert({
    where: { code: 'SUPER_ADMIN' },
    update: {
      nameAr: 'سوبر أدمن',
      nameEn: 'Super Admin',
      description: 'المدير الأعلى للنظام - يتجاوز جميع الصلاحيات',
      isSystem: true,
    },
    create: {
      code: 'SUPER_ADMIN',
      nameAr: 'سوبر أدمن',
      nameEn: 'Super Admin',
      description: 'المدير الأعلى للنظام - يتجاوز جميع الصلاحيات',
      isSystem: true,
    },
  });
  
  // ربط جميع الصلاحيات بدور السوبر أدمن
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: permission.id,
      },
    });
  }
  
  console.log(`   ✅ تم إنشاء دور السوبر أدمن مع ${allPermissions.length} صلاحية`);
  return superAdminRole;
}

async function seedSuperAdminUser(roleId: string) {
  console.log('👤 زراعة مستخدم السوبر أدمن...');
  
  const passwordHash = await bcrypt.hash('Admin@123456', 12);
  
  const superAdmin = await prisma.user.upsert({
    where: { academicId: 'ADMIN001' },
    update: {},
    create: {
      academicId: 'ADMIN001',
      nationalId: '0000000000',
      email: 'admin@unicore.edu.sa',
      passwordHash,
      status: 'ACTIVE',
      profile: {
        create: {
          firstNameAr: 'مدير',
          lastNameAr: 'النظام',
          firstNameEn: 'System',
          lastNameEn: 'Administrator',
        },
      },
    },
  });
  
  // ربط السوبر أدمن بالدور
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: superAdmin.id,
        roleId: roleId,
      },
    },
    update: {},
    create: {
      userId: superAdmin.id,
      roleId: roleId,
    },
  });
  
  console.log(`   ✅ تم إنشاء السوبر أدمن: ${superAdmin.email}`);
  console.log('   ⚠️  كلمة المرور الافتراضية: Admin@123456');
  
  return superAdmin;
}

async function seedDemoData() {
  console.log('🧪 زراعة البيانات التجريبية...');
  
  // إنشاء كلية تجريبية
  const college = await prisma.college.upsert({
    where: { code: 'CS' },
    update: {},
    create: {
      code: 'CS',
      nameAr: 'كلية الحاسب الآلي وتقنية المعلومات',
      nameEn: 'College of Computer Science and IT',
      description: 'كلية تجريبية للتطوير',
    },
  });
  
  // إنشاء قسم تجريبي
  const department = await prisma.department.upsert({
    where: { code: 'CS-SE' },
    update: {},
    create: {
      code: 'CS-SE',
      nameAr: 'قسم هندسة البرمجيات',
      nameEn: 'Software Engineering Department',
      collegeId: college.id,
    },
  });
  
  // إنشاء تخصص تجريبي
  const major = await prisma.major.upsert({
    where: { code: 'CS-SE-AI' },
    update: {},
    create: {
      code: 'CS-SE-AI',
      nameAr: 'الذكاء الاصطناعي',
      nameEn: 'Artificial Intelligence',
      departmentId: department.id,
      totalCredits: 140,
    },
  });
  
  // إنشاء مقرر تجريبي
  const course = await prisma.course.upsert({
    where: { code: 'CS101' },
    update: {},
    create: {
      code: 'CS101',
      nameAr: 'مقدمة في البرمجة',
      nameEn: 'Introduction to Programming',
      departmentId: department.id,
      credits: 3,
    },
  });
  
  // إنشاء أدوار تجريبية
  const instructorRole = await prisma.role.upsert({
    where: { code: 'INSTRUCTOR' },
    update: {},
    create: {
      code: 'INSTRUCTOR',
      nameAr: 'عضو هيئة تدريس',
      nameEn: 'Instructor',
      description: 'دور تجريبي لأعضاء هيئة التدريس',
    },
  });
  
  const studentRole = await prisma.role.upsert({
    where: { code: 'STUDENT' },
    update: {},
    create: {
      code: 'STUDENT',
      nameAr: 'طالب',
      nameEn: 'Student',
      description: 'دور تجريبي للطلاب',
    },
  });
  
  // ربط الصلاحيات بالأدوار التجريبية
  const instructorPermissions = [
    'course.view', 'offering.view', 'quiz.view', 'quiz.create', 
    'quiz.edit', 'quiz.publish', 'quiz.grade', 'file.view', 
    'file.upload', 'ai.generate_quiz', 'ai.summarize',
  ];
  
  const studentPermissions = [
    'course.view', 'offering.view', 'quiz.view', 'quiz.take',
    'file.view', 'file.download', 'notification.view',
  ];
  
  for (const code of instructorPermissions) {
    const permission = await prisma.permission.findUnique({ where: { code } });
    if (permission) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: instructorRole.id, permissionId: permission.id } },
        update: {},
        create: { roleId: instructorRole.id, permissionId: permission.id },
      });
    }
  }
  
  for (const code of studentPermissions) {
    const permission = await prisma.permission.findUnique({ where: { code } });
    if (permission) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: studentRole.id, permissionId: permission.id } },
        update: {},
        create: { roleId: studentRole.id, permissionId: permission.id },
      });
    }
  }
  
  console.log('   ✅ تم إنشاء البيانات التجريبية');
  console.log(`      - كلية: ${college.nameAr}`);
  console.log(`      - قسم: ${department.nameAr}`);
  console.log(`      - تخصص: ${major.nameAr}`);
  console.log(`      - مقرر: ${course.nameAr}`);
  console.log(`      - دور المدرس: ${instructorRole.nameAr} (${instructorPermissions.length} صلاحية)`);
  console.log(`      - دور الطالب: ${studentRole.nameAr} (${studentPermissions.length} صلاحية)`);
}

// ============================================
// الدالة الرئيسية
// ============================================

async function main() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                    UniCore-OS Seeder                       ║');
  console.log('║                     زراعة البيانات                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  
  try {
    await seedPermissions();
    await seedSystemSettings();
    await seedDefaultSemester();
    const superAdminRole = await seedSuperAdminRole();
    await seedSuperAdminUser(superAdminRole.id);
    await seedDemoData();
    
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║              ✅ SYSTEM READY - النظام جاهز!                ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('📊 ملخص الزراعة:');
    console.log('   • 52 صلاحية');
    console.log('   • 15 إعداد نظام');
    console.log('   • 1 فصل دراسي');
    console.log('   • 3 أدوار (Super Admin + Instructor + Student)');
    console.log('   • 1 مستخدم (Super Admin)');
    console.log('   • 1 كلية + 1 قسم + 1 تخصص + 1 مقرر');
    console.log('');
    console.log('🔑 بيانات الدخول:');
    console.log('   البريد: admin@unicore.edu.sa');
    console.log('   كلمة المرور: Admin@123456');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('╔════════════════════════════════════════════════════════════╗');
    console.error('║              ❌ فشلت عملية الزراعة!                        ║');
    console.error('╚════════════════════════════════════════════════════════════╝');
    console.error('');
    console.error(error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
