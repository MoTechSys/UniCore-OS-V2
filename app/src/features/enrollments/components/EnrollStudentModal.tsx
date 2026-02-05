"use client"

/**
 * Enroll Student Modal
 * 
 * Modal for searching and enrolling a student in an offering.
 * 
 * @module features/enrollments/components/EnrollStudentModal
 */

import { useState, useTransition, useCallback } from "react"
import { Search, UserPlus, Loader2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { searchStudents, enrollStudent, type StudentSearchResult } from "@/features/enrollments/actions"

// ============================================
// TYPES
// ============================================

interface EnrollStudentModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    offeringId: string
    onSuccess: () => void
}

// ============================================
// COMPONENT
// ============================================

export function EnrollStudentModal({
    open,
    onOpenChange,
    offeringId,
    onSuccess,
}: EnrollStudentModalProps) {
    const [isPending, startTransition] = useTransition()
    const [isSearching, setIsSearching] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<StudentSearchResult[]>([])
    const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(null)

    // Debounced search
    const handleSearch = useCallback(
        async (query: string) => {
            setSearchQuery(query)

            if (query.length < 2) {
                setSearchResults([])
                return
            }

            setIsSearching(true)
            const result = await searchStudents(query, offeringId)
            setIsSearching(false)

            if (result.success) {
                setSearchResults(result.data ?? [])
            }
        },
        [offeringId]
    )

    const handleEnroll = () => {
        if (!selectedStudent) return

        startTransition(async () => {
            const result = await enrollStudent({
                offeringId,
                studentId: selectedStudent.id,
            })

            if (result.success) {
                toast.success("تم تسجيل الطالب بنجاح")
                setSearchQuery("")
                setSearchResults([])
                setSelectedStudent(null)
                onSuccess()
            } else {
                toast.error(result.error ?? "فشل في تسجيل الطالب")
            }
        })
    }

    const handleClose = () => {
        setSearchQuery("")
        setSearchResults([])
        setSelectedStudent(null)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        تسجيل طالب جديد
                    </DialogTitle>
                    <DialogDescription>
                        ابحث عن الطالب بالاسم أو البريد الإلكتروني أو الرقم الجامعي
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="ابحث عن طالب..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pr-10"
                        />
                        {isSearching && (
                            <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                        )}
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="max-h-[300px] overflow-y-auto rounded-lg border">
                            {searchResults.map((student) => (
                                <button
                                    key={student.id}
                                    type="button"
                                    className={`w-full p-3 text-right hover:bg-muted transition-colors border-b last:border-b-0 ${selectedStudent?.id === student.id ? "bg-primary/10" : ""
                                        }`}
                                    onClick={() => setSelectedStudent(student)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{student.name ?? student.email}</p>
                                            <p className="text-sm text-muted-foreground">{student.email}</p>
                                        </div>
                                        {student.studentId && (
                                            <span className="text-sm font-mono text-muted-foreground">
                                                #{student.studentId}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                        <div className="py-8 text-center text-muted-foreground">
                            <Search className="mx-auto h-8 w-8 mb-2 opacity-50" />
                            <p>لم يتم العثور على نتائج</p>
                        </div>
                    )}

                    {/* Selected Student */}
                    {selectedStudent && (
                        <div className="rounded-lg border border-primary bg-primary/5 p-4">
                            <p className="text-sm text-muted-foreground mb-1">الطالب المحدد:</p>
                            <p className="font-medium">{selectedStudent.name ?? selectedStudent.email}</p>
                            {selectedStudent.studentId && (
                                <p className="text-sm text-muted-foreground">
                                    الرقم الجامعي: {selectedStudent.studentId}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleClose}>
                        إلغاء
                    </Button>
                    <Button
                        onClick={handleEnroll}
                        disabled={!selectedStudent || isPending}
                    >
                        {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                        تسجيل الطالب
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
