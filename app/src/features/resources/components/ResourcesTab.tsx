"use client"

/**
 * Resources Tab Component
 * 
 * Main tab component for resource management in offering details.
 * Shows uploader for instructors and resource list for all.
 * 
 * @module features/resources/components/ResourcesTab
 */

import { useEffect, useState, useTransition } from "react"
import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { ResourceUploader } from "./ResourceUploader"
import { ResourceList } from "./ResourceList"
import { getResources, type ResourceData } from "../actions"

// ============================================
// TYPES
// ============================================

interface ResourcesTabProps {
    offeringId: string
    canUpload: boolean
    canDelete: boolean
}

// ============================================
// COMPONENT
// ============================================

export function ResourcesTab({ offeringId, canUpload, canDelete }: ResourcesTabProps) {
    const [resources, setResources] = useState<ResourceData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isPending, startTransition] = useTransition()

    const loadResources = async () => {
        const result = await getResources(offeringId)
        if (result.success && result.data) {
            setResources(result.data)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        loadResources()
    }, [offeringId])

    const handleSuccess = () => {
        startTransition(() => {
            loadResources()
        })
    }

    if (isLoading) {
        return (
            <Card>
                <CardContent className="py-12">
                    <div className="flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <span className="mr-2 text-muted-foreground">جارٍ تحميل الملفات...</span>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {/* Uploader - Only for instructors */}
            {canUpload && (
                <ResourceUploader offeringId={offeringId} onSuccess={handleSuccess} />
            )}

            {/* Resource List */}
            <div className={isPending ? "opacity-50 pointer-events-none" : ""}>
                <ResourceList
                    resources={resources}
                    canDelete={canDelete}
                    onSuccess={handleSuccess}
                />
            </div>
        </div>
    )
}
