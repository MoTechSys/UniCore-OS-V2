"use client"

/**
 * Type-Safe Zod Resolver
 * 
 * A centralized wrapper for zodResolver that properly handles Zod v4 
 * compatibility with @hookform/resolvers.
 * 
 * @module lib/form-resolver
 */

import { zodResolver } from "@hookform/resolvers/zod"
import type { FieldValues, Resolver } from "react-hook-form"
import type { ZodType, ZodTypeDef } from "zod"

/**
 * Creates a type-safe resolver for react-hook-form with Zod v4.
 * 
 * This wrapper addresses the type mismatch between Zod v4's output types
 * and @hookform/resolvers expectations, providing a clean API without
 * requiring `as any` assertions throughout the codebase.
 * 
 * @template TFieldValues - The form field values type
 * @template TContext - Optional context type for the resolver
 * @param schema - The Zod schema to validate against
 * @returns A properly typed Resolver for use with useForm
 * 
 * @example
 * ```tsx
 * const formSchema = z.object({ name: z.string() })
 * type FormValues = z.infer<typeof formSchema>
 * 
 * const form = useForm<FormValues>({
 *   resolver: safeZodResolver<FormValues>(formSchema),
 * })
 * ```
 */
export function safeZodResolver<
    TFieldValues extends FieldValues,
    TContext = unknown
>(
    schema: ZodType<TFieldValues, ZodTypeDef, unknown>
): Resolver<TFieldValues, TContext> {
    // The assertion here is necessary due to Zod v4 / @hookform/resolvers
    // type signature mismatch. This is the single point where we handle
    // this incompatibility, keeping all consumer code fully type-safe.
    return zodResolver(schema) as unknown as Resolver<TFieldValues, TContext>
}
