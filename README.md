# 🎓 UniCore-OS

> **نظام تشغيل جامعي متكامل (University Operating System)**

---

## 🎯 الرؤية

بناء نظام إدارة أكاديمي ذكي يعتمد على:
- **المركزية الصارمة:** الأدمن هو المالك الوحيد للحقيقة
- **الأمان المتسامح:** Soft Delete + Transactions
- **الذكاء المساعد:** AI كمساعد للدكتور، وليس بديلاً

---

## 🛠️ التقنيات

| الطبقة | التقنية |
|--------|---------|
| **Frontend** | Next.js 16, React 19, TypeScript, TailwindCSS 4 |
| **UI Library** | shadcn/ui, Radix UI, Lucide Icons |
| **State** | Zustand |
| **Validation** | Zod |
| **Database** | PostgreSQL + Prisma ORM |
| **Auth** | JWT + bcrypt |

---

## 📁 هيكل المشروع

```
UniCore-OS/
├── app/                    # تطبيق Next.js
│   ├── prisma/            # Prisma Schema
│   └── src/
│       ├── app/           # App Router (Pages)
│       ├── components/    # UI Components
│       ├── features/      # Feature-Based Modules
│       ├── lib/           # Utilities & Prisma Client
│       ├── server/        # Server Actions & DAL
│       └── types/         # TypeScript Types
└── docs/                   # Documentation
    ├── MASTER_BLUEPRINT.md # المخطط الأزرق الرئيسي
    └── MIGRATION_STRATEGY.md # استراتيجية نقل التصميم
```

---

## 📚 التوثيق

- **[MASTER_BLUEPRINT.md](./docs/MASTER_BLUEPRINT.md)** - المخطط الأزرق الرئيسي (الفلسفة، الهيكلية، الصلاحيات)
- **[MIGRATION_STRATEGY.md](./docs/MIGRATION_STRATEGY.md)** - استراتيجية نقل التصميم من المشروع القديم

---

## 🚀 البدء السريع

```bash
# 1. استنساخ المستودع
git clone https://github.com/MoTechSys/UniCore-OS.git
cd UniCore-OS/app

# 2. تثبيت المكتبات
pnpm install

# 3. إعداد قاعدة البيانات
cp .env.example .env
# عدّل DATABASE_URL في .env
npx prisma db push

# 4. تشغيل التطبيق
pnpm dev
```

---

## 📄 الترخيص

MIT License

---

**صنع بـ ❤️ بواسطة MoTechSys | MAX EVOLVED**
