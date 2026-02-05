"use server"

/**
 * Academic Structure Server Actions
 * 
 * Handles CRUD operations for Colleges, Departments, Majors, and Courses.
 * Follows MAX Standards: requirePermission first, Zod validation, no `any` types.
 * 
 * @module features/academic/actions
 */

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { requirePermission } from "@/lib/auth/permissions"

// ============================================
// TYPES
// ============================================

export interface ActionResult<T = void> {
    success: boolean
    data?: T
    error?: string
}

// College Types
export interface CollegeWithDetails {
    id: string
    code: string
    nameAr: string
    nameEn: string | null
    description: string | null
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    _count: {
        departments: number
    }
    departments: DepartmentWithDetails[]
}

// Department Types
export interface DepartmentWithDetails {
    id: string
    code: string
    nameAr: string
    nameEn: string | null
    description: string | null
    isActive: boolean
    collegeId: string
    createdAt: Date
    updatedAt: Date
    _count: {
        majors: number
        courses: number
    }
    majors: MajorData[]
    courses: CourseData[]
}

// Major Types
export interface MajorData {
    id: string
    code: string
    nameAr: string
    nameEn: string | null
    description: string | null
    isActive: boolean
    totalCredits: number
    departmentId: string
    createdAt: Date
    updatedAt: Date
}

// Course Types
export interface CourseData {
    id: string
    code: string
    nameAr: string
    nameEn: string | null
    description: string | null
    credits: number
    isActive: boolean
    departmentId: string
    createdAt: Date
    updatedAt: Date
}

// ============================================
// SCHEMAS
// ============================================

// College Schemas
const createCollegeSchema = z.object({
    code: z.string().min(2, "الكود يجب أن يكون حرفين على الأقل").max(10, "الكود يجب ألا يتجاوز 10 أحرف"),
    nameAr: z.string().min(2, "الاسم العربي يجب أن يكون حرفين على الأقل"),
    nameEn: z.string().optional(),
    description: z.string().optional(),
})

const updateCollegeSchema = createCollegeSchema.extend({
    id: z.string(),
    isActive: z.boolean().optional(),
})

// Department Schemas
const createDepartmentSchema = z.object({
    collegeId: z.string().min(1, "يجب تحديد الكلية"),
    code: z.string().min(2, "الكود يجب أن يكون حرفين على الأقل").max(10, "الكود يجب ألا يتجاوز 10 أحرف"),
    nameAr: z.string().min(2, "الاسم العربي يجب أن يكون حرفين على الأقل"),
    nameEn: z.string().optional(),
    description: z.string().optional(),
})

const updateDepartmentSchema = createDepartmentSchema.extend({
    id: z.string(),
    isActive: z.boolean().optional(),
})

// Major Schemas
const createMajorSchema = z.object({
    departmentId: z.string().min(1, "يجب تحديد القسم"),
    code: z.string().min(2, "الكود يجب أن يكون حرفين على الأقل").max(10, "الكود يجب ألا يتجاوز 10 أحرف"),
    nameAr: z.string().min(2, "الاسم العربي يجب أن يكون حرفين على الأقل"),
    nameEn: z.string().optional(),
    description: z.string().optional(),
    totalCredits: z.number().min(0, "الساعات يجب أن تكون 0 أو أكثر").default(0),
})

const updateMajorSchema = createMajorSchema.extend({
    id: z.string(),
    isActive: z.boolean().optional(),
})

// Course Schemas
const createCourseSchema = z.object({
    departmentId: z.string().min(1, "يجب تحديد القسم"),
    code: z.string().min(2, "الكود يجب أن يكون حرفين على الأقل").max(10, "الكود يجب ألا يتجاوز 10 أحرف"),
    nameAr: z.string().min(2, "الاسم العربي يجب أن يكون حرفين على الأقل"),
    nameEn: z.string().optional(),
    description: z.string().optional(),
    credits: z.number().min(1, "الساعات يجب أن تكون 1 على الأقل").max(6, "الساعات يجب ألا تتجاوز 6").default(3),
})

const updateCourseSchema = createCourseSchema.extend({
    id: z.string(),
    isActive: z.boolean().optional(),
})

// Input Types
export type CreateCollegeInput = z.infer<typeof createCollegeSchema>
export type UpdateCollegeInput = z.infer<typeof updateCollegeSchema>
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>
export type CreateMajorInput = z.infer<typeof createMajorSchema>
export type UpdateMajorInput = z.infer<typeof updateMajorSchema>
export type CreateCourseInput = z.infer<typeof createCourseSchema>
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>

// ============================================
// COLLEGES
// ============================================

/**
 * Get all colleges with departments, majors, and courses
 */
export async function getColleges(): Promise<ActionResult<CollegeWithDetails[]>> {
    try {
        // Anyone with college.manage, department.manage, or major.manage can view
        // Permission check is done at page level

        const colleges = await db.college.findMany({
            where: { deletedAt: null },
            orderBy: { nameAr: "asc" },
            include: {
                _count: {
                    select: { departments: { where: { deletedAt: null } } },
                },
                departments: {
                    where: { deletedAt: null },
                    orderBy: { nameAr: "asc" },
                    include: {
                        _count: {
                            select: {
                                majors: { where: { deletedAt: null } },
                                courses: { where: { deletedAt: null } },
                            },
                        },
                        majors: {
                            where: { deletedAt: null },
                            orderBy: { nameAr: "asc" },
                        },
                        courses: {
                            where: { deletedAt: null },
                            orderBy: { code: "asc" },
                        },
                    },
                },
            },
        })

        return { success: true, data: colleges as CollegeWithDetails[] }
    } catch (error) {
        console.error("Error fetching colleges:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في جلب الكليات",
        }
    }
}

/**
 * Create a new college
 */
export async function createCollege(
    input: CreateCollegeInput
): Promise<ActionResult<{ id: string }>> {
    try {
        await requirePermission("college.manage")

        const validated = createCollegeSchema.parse(input)

        // Check if code already exists
        const existingCode = await db.college.findFirst({
            where: { code: validated.code, deletedAt: null },
        })
        if (existingCode) {
            return { success: false, error: "كود الكلية مستخدم بالفعل" }
        }

        const college = await db.college.create({
            data: {
                code: validated.code,
                nameAr: validated.nameAr,
                nameEn: validated.nameEn,
                description: validated.description,
            },
        })

        revalidatePath("/academic")
        return { success: true, data: { id: college.id } }
    } catch (error) {
        console.error("Error creating college:", error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في إنشاء الكلية",
        }
    }
}

/**
 * Update an existing college
 */
export async function updateCollege(
    input: UpdateCollegeInput
): Promise<ActionResult> {
    try {
        await requirePermission("college.manage")

        const validated = updateCollegeSchema.parse(input)

        // Check if college exists
        const existing = await db.college.findUnique({
            where: { id: validated.id, deletedAt: null },
        })
        if (!existing) {
            return { success: false, error: "الكلية غير موجودة" }
        }

        // Check if code is taken by another college
        if (validated.code !== existing.code) {
            const codeTaken = await db.college.findFirst({
                where: {
                    code: validated.code,
                    id: { not: validated.id },
                    deletedAt: null,
                },
            })
            if (codeTaken) {
                return { success: false, error: "كود الكلية مستخدم بالفعل" }
            }
        }

        await db.college.update({
            where: { id: validated.id },
            data: {
                code: validated.code,
                nameAr: validated.nameAr,
                nameEn: validated.nameEn,
                description: validated.description,
                isActive: validated.isActive,
            },
        })

        revalidatePath("/academic")
        return { success: true }
    } catch (error) {
        console.error("Error updating college:", error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في تحديث الكلية",
        }
    }
}

/**
 * Delete a college (soft delete)
 */
export async function deleteCollege(id: string): Promise<ActionResult> {
    try {
        await requirePermission("college.manage")

        // Check if college exists
        const college = await db.college.findUnique({
            where: { id, deletedAt: null },
            include: {
                _count: {
                    select: { departments: { where: { deletedAt: null } } },
                },
            },
        })

        if (!college) {
            return { success: false, error: "الكلية غير موجودة" }
        }

        // Check if college has departments
        if (college._count.departments > 0) {
            return {
                success: false,
                error: "لا يمكن حذف الكلية لأنها تحتوي على أقسام",
            }
        }

        // Soft delete
        await db.college.update({
            where: { id },
            data: { deletedAt: new Date() },
        })

        revalidatePath("/academic")
        return { success: true }
    } catch (error) {
        console.error("Error deleting college:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في حذف الكلية",
        }
    }
}

// ============================================
// DEPARTMENTS
// ============================================

/**
 * Get departments (optionally filtered by college)
 */
export async function getDepartments(
    collegeId?: string
): Promise<ActionResult<DepartmentWithDetails[]>> {
    try {
        const where: Record<string, unknown> = { deletedAt: null }
        if (collegeId) {
            where.collegeId = collegeId
        }

        const departments = await db.department.findMany({
            where,
            orderBy: { nameAr: "asc" },
            include: {
                _count: {
                    select: {
                        majors: { where: { deletedAt: null } },
                        courses: { where: { deletedAt: null } },
                    },
                },
                majors: {
                    where: { deletedAt: null },
                    orderBy: { nameAr: "asc" },
                },
                courses: {
                    where: { deletedAt: null },
                    orderBy: { code: "asc" },
                },
            },
        })

        return { success: true, data: departments as DepartmentWithDetails[] }
    } catch (error) {
        console.error("Error fetching departments:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في جلب الأقسام",
        }
    }
}

/**
 * Create a new department
 */
export async function createDepartment(
    input: CreateDepartmentInput
): Promise<ActionResult<{ id: string }>> {
    try {
        await requirePermission("department.manage")

        const validated = createDepartmentSchema.parse(input)

        // Check if college exists
        const college = await db.college.findUnique({
            where: { id: validated.collegeId, deletedAt: null },
        })
        if (!college) {
            return { success: false, error: "الكلية غير موجودة" }
        }

        // Check if code already exists
        const existingCode = await db.department.findFirst({
            where: { code: validated.code, deletedAt: null },
        })
        if (existingCode) {
            return { success: false, error: "كود القسم مستخدم بالفعل" }
        }

        const department = await db.department.create({
            data: {
                collegeId: validated.collegeId,
                code: validated.code,
                nameAr: validated.nameAr,
                nameEn: validated.nameEn,
                description: validated.description,
            },
        })

        revalidatePath("/academic")
        return { success: true, data: { id: department.id } }
    } catch (error) {
        console.error("Error creating department:", error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في إنشاء القسم",
        }
    }
}

/**
 * Update an existing department
 */
export async function updateDepartment(
    input: UpdateDepartmentInput
): Promise<ActionResult> {
    try {
        await requirePermission("department.manage")

        const validated = updateDepartmentSchema.parse(input)

        // Check if department exists
        const existing = await db.department.findUnique({
            where: { id: validated.id, deletedAt: null },
        })
        if (!existing) {
            return { success: false, error: "القسم غير موجود" }
        }

        // Check if code is taken by another department
        if (validated.code !== existing.code) {
            const codeTaken = await db.department.findFirst({
                where: {
                    code: validated.code,
                    id: { not: validated.id },
                    deletedAt: null,
                },
            })
            if (codeTaken) {
                return { success: false, error: "كود القسم مستخدم بالفعل" }
            }
        }

        await db.department.update({
            where: { id: validated.id },
            data: {
                collegeId: validated.collegeId,
                code: validated.code,
                nameAr: validated.nameAr,
                nameEn: validated.nameEn,
                description: validated.description,
                isActive: validated.isActive,
            },
        })

        revalidatePath("/academic")
        return { success: true }
    } catch (error) {
        console.error("Error updating department:", error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في تحديث القسم",
        }
    }
}

/**
 * Delete a department (soft delete)
 */
export async function deleteDepartment(id: string): Promise<ActionResult> {
    try {
        await requirePermission("department.manage")

        // Check if department exists
        const department = await db.department.findUnique({
            where: { id, deletedAt: null },
            include: {
                _count: {
                    select: {
                        majors: { where: { deletedAt: null } },
                        courses: { where: { deletedAt: null } },
                    },
                },
            },
        })

        if (!department) {
            return { success: false, error: "القسم غير موجود" }
        }

        // Check if department has majors or courses
        if (department._count.majors > 0 || department._count.courses > 0) {
            return {
                success: false,
                error: "لا يمكن حذف القسم لأنه يحتوي على تخصصات أو مقررات",
            }
        }

        // Soft delete
        await db.department.update({
            where: { id },
            data: { deletedAt: new Date() },
        })

        revalidatePath("/academic")
        return { success: true }
    } catch (error) {
        console.error("Error deleting department:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في حذف القسم",
        }
    }
}

// ============================================
// MAJORS
// ============================================

/**
 * Get majors (optionally filtered by department)
 */
export async function getMajors(
    departmentId?: string
): Promise<ActionResult<MajorData[]>> {
    try {
        const where: Record<string, unknown> = { deletedAt: null }
        if (departmentId) {
            where.departmentId = departmentId
        }

        const majors = await db.major.findMany({
            where,
            orderBy: { nameAr: "asc" },
        })

        return { success: true, data: majors as MajorData[] }
    } catch (error) {
        console.error("Error fetching majors:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في جلب التخصصات",
        }
    }
}

/**
 * Create a new major
 */
export async function createMajor(
    input: CreateMajorInput
): Promise<ActionResult<{ id: string }>> {
    try {
        await requirePermission("major.manage")

        const validated = createMajorSchema.parse(input)

        // Check if department exists
        const department = await db.department.findUnique({
            where: { id: validated.departmentId, deletedAt: null },
        })
        if (!department) {
            return { success: false, error: "القسم غير موجود" }
        }

        // Check if code already exists
        const existingCode = await db.major.findFirst({
            where: { code: validated.code, deletedAt: null },
        })
        if (existingCode) {
            return { success: false, error: "كود التخصص مستخدم بالفعل" }
        }

        const major = await db.major.create({
            data: {
                departmentId: validated.departmentId,
                code: validated.code,
                nameAr: validated.nameAr,
                nameEn: validated.nameEn,
                description: validated.description,
                totalCredits: validated.totalCredits,
            },
        })

        revalidatePath("/academic")
        return { success: true, data: { id: major.id } }
    } catch (error) {
        console.error("Error creating major:", error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في إنشاء التخصص",
        }
    }
}

/**
 * Update an existing major
 */
export async function updateMajor(
    input: UpdateMajorInput
): Promise<ActionResult> {
    try {
        await requirePermission("major.manage")

        const validated = updateMajorSchema.parse(input)

        // Check if major exists
        const existing = await db.major.findUnique({
            where: { id: validated.id, deletedAt: null },
        })
        if (!existing) {
            return { success: false, error: "التخصص غير موجود" }
        }

        // Check if code is taken by another major
        if (validated.code !== existing.code) {
            const codeTaken = await db.major.findFirst({
                where: {
                    code: validated.code,
                    id: { not: validated.id },
                    deletedAt: null,
                },
            })
            if (codeTaken) {
                return { success: false, error: "كود التخصص مستخدم بالفعل" }
            }
        }

        await db.major.update({
            where: { id: validated.id },
            data: {
                departmentId: validated.departmentId,
                code: validated.code,
                nameAr: validated.nameAr,
                nameEn: validated.nameEn,
                description: validated.description,
                totalCredits: validated.totalCredits,
                isActive: validated.isActive,
            },
        })

        revalidatePath("/academic")
        return { success: true }
    } catch (error) {
        console.error("Error updating major:", error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في تحديث التخصص",
        }
    }
}

/**
 * Delete a major (soft delete)
 */
export async function deleteMajor(id: string): Promise<ActionResult> {
    try {
        await requirePermission("major.manage")

        // Check if major exists
        const major = await db.major.findUnique({
            where: { id, deletedAt: null },
            include: {
                _count: {
                    select: { students: true },
                },
            },
        })

        if (!major) {
            return { success: false, error: "التخصص غير موجود" }
        }

        // Check if major has students
        if (major._count.students > 0) {
            return {
                success: false,
                error: "لا يمكن حذف التخصص لأنه يحتوي على طلاب مسجلين",
            }
        }

        // Soft delete
        await db.major.update({
            where: { id },
            data: { deletedAt: new Date() },
        })

        revalidatePath("/academic")
        return { success: true }
    } catch (error) {
        console.error("Error deleting major:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في حذف التخصص",
        }
    }
}

// ============================================
// COURSES
// ============================================

/**
 * Get courses (optionally filtered by department)
 */
export async function getCourses(
    departmentId?: string
): Promise<ActionResult<CourseData[]>> {
    try {
        const where: Record<string, unknown> = { deletedAt: null }
        if (departmentId) {
            where.departmentId = departmentId
        }

        const courses = await db.course.findMany({
            where,
            orderBy: { code: "asc" },
        })

        return { success: true, data: courses as CourseData[] }
    } catch (error) {
        console.error("Error fetching courses:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في جلب المقررات",
        }
    }
}

/**
 * Create a new course
 */
export async function createCourse(
    input: CreateCourseInput
): Promise<ActionResult<{ id: string }>> {
    try {
        await requirePermission("course.create")

        const validated = createCourseSchema.parse(input)

        // Check if department exists
        const department = await db.department.findUnique({
            where: { id: validated.departmentId, deletedAt: null },
        })
        if (!department) {
            return { success: false, error: "القسم غير موجود" }
        }

        // Check if code already exists
        const existingCode = await db.course.findFirst({
            where: { code: validated.code, deletedAt: null },
        })
        if (existingCode) {
            return { success: false, error: "كود المقرر مستخدم بالفعل" }
        }

        const course = await db.course.create({
            data: {
                departmentId: validated.departmentId,
                code: validated.code,
                nameAr: validated.nameAr,
                nameEn: validated.nameEn,
                description: validated.description,
                credits: validated.credits,
            },
        })

        revalidatePath("/academic")
        return { success: true, data: { id: course.id } }
    } catch (error) {
        console.error("Error creating course:", error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في إنشاء المقرر",
        }
    }
}

/**
 * Update an existing course
 */
export async function updateCourse(
    input: UpdateCourseInput
): Promise<ActionResult> {
    try {
        await requirePermission("course.edit")

        const validated = updateCourseSchema.parse(input)

        // Check if course exists
        const existing = await db.course.findUnique({
            where: { id: validated.id, deletedAt: null },
        })
        if (!existing) {
            return { success: false, error: "المقرر غير موجود" }
        }

        // Check if code is taken by another course
        if (validated.code !== existing.code) {
            const codeTaken = await db.course.findFirst({
                where: {
                    code: validated.code,
                    id: { not: validated.id },
                    deletedAt: null,
                },
            })
            if (codeTaken) {
                return { success: false, error: "كود المقرر مستخدم بالفعل" }
            }
        }

        await db.course.update({
            where: { id: validated.id },
            data: {
                departmentId: validated.departmentId,
                code: validated.code,
                nameAr: validated.nameAr,
                nameEn: validated.nameEn,
                description: validated.description,
                credits: validated.credits,
                isActive: validated.isActive,
            },
        })

        revalidatePath("/academic")
        return { success: true }
    } catch (error) {
        console.error("Error updating course:", error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في تحديث المقرر",
        }
    }
}

/**
 * Delete a course (soft delete)
 */
export async function deleteCourse(id: string): Promise<ActionResult> {
    try {
        await requirePermission("course.delete")

        // Check if course exists
        const course = await db.course.findUnique({
            where: { id, deletedAt: null },
            include: {
                _count: {
                    select: { offerings: { where: { deletedAt: null } } },
                },
            },
        })

        if (!course) {
            return { success: false, error: "المقرر غير موجود" }
        }

        // Check if course has offerings
        if (course._count.offerings > 0) {
            return {
                success: false,
                error: "لا يمكن حذف المقرر لأنه مرتبط بشعب دراسية",
            }
        }

        // Soft delete
        await db.course.update({
            where: { id },
            data: { deletedAt: new Date() },
        })

        revalidatePath("/academic")
        return { success: true }
    } catch (error) {
        console.error("Error deleting course:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في حذف المقرر",
        }
    }
}

// ============================================
// STATISTICS
// ============================================

export interface AcademicStats {
    totalColleges: number
    totalDepartments: number
    totalMajors: number
    totalCourses: number
    activeColleges: number
    activeDepartments: number
}

/**
 * Get academic statistics for dashboard
 */
export async function getAcademicStats(): Promise<ActionResult<AcademicStats>> {
    try {
        const [
            totalColleges,
            totalDepartments,
            totalMajors,
            totalCourses,
            activeColleges,
            activeDepartments,
        ] = await Promise.all([
            db.college.count({ where: { deletedAt: null } }),
            db.department.count({ where: { deletedAt: null } }),
            db.major.count({ where: { deletedAt: null } }),
            db.course.count({ where: { deletedAt: null } }),
            db.college.count({ where: { deletedAt: null, isActive: true } }),
            db.department.count({ where: { deletedAt: null, isActive: true } }),
        ])

        return {
            success: true,
            data: {
                totalColleges,
                totalDepartments,
                totalMajors,
                totalCourses,
                activeColleges,
                activeDepartments,
            },
        }
    } catch (error) {
        console.error("Error fetching academic stats:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في جلب الإحصائيات",
        }
    }
}
