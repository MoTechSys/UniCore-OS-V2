/**
 * useToast Hook
 * 
 * A wrapper around sonner's toast for consistent toast notifications
 * @module hooks/use-toast
 */

import { toast as sonnerToast } from "sonner"

export interface Toast {
  id?: string
  title?: string
  description?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  action?: {
    label: string
    onClick: () => void
  }
}

export function useToast() {
  return {
    toast: ({
      title,
      description,
      variant = "default",
    }: {
      title?: string
      description?: string
      variant?: "default" | "destructive" | "success"
    }) => {
      const message = title ? `${title}${description ? ": " + description : ""}` : description

      if (variant === "destructive") {
        sonnerToast.error(message || "حدث خطأ")
      } else if (variant === "success") {
        sonnerToast.success(message || "تم بنجاح")
      } else {
        sonnerToast.message(message || "إخطار")
      }
    },
  }
}

export const toast = sonnerToast
