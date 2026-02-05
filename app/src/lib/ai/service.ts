/**
 * AI Service - Central AI Integration Layer
 * 
 * Provides a unified interface for AI operations with:
 * - Structured output (JSON mode)
 * - Zod validation for AI responses
 * - Fail-safe error handling
 * - Support for multiple providers
 * 
 * @module lib/ai/service
 */

import { z } from "zod"
import { AI_CONFIG, isAIConfigured } from "./config"

// ============================================
// TYPES
// ============================================

export interface AIResponse<T> {
    success: boolean
    data?: T
    error?: string
}

export interface AIRequestOptions {
    temperature?: number
    maxTokens?: number
}

// ============================================
// GEMINI CLIENT
// ============================================

async function callGemini<T>(
    prompt: string,
    systemPrompt: string,
    schema: z.ZodSchema<T>,
    options: AIRequestOptions = {}
): Promise<AIResponse<T>> {
    const { apiKey, model } = AI_CONFIG.gemini
    const { temperature = AI_CONFIG.defaults.temperature, maxTokens = AI_CONFIG.defaults.maxTokens } = options

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [{ text: `${systemPrompt}\n\n${prompt}` }],
                        },
                    ],
                    generationConfig: {
                        temperature,
                        maxOutputTokens: maxTokens,
                        responseMimeType: "application/json",
                    },
                }),
            }
        )

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error?.message || `Gemini API error: ${response.status}`)
        }

        const data = await response.json()

        // Extract text from response
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (!text) {
            throw new Error("No response from Gemini")
        }

        // Parse and validate JSON
        const parsed = JSON.parse(text)
        const validated = schema.parse(parsed)

        return { success: true, data: validated }
    } catch (error) {
        console.error("Gemini API error:", error)

        if (error instanceof z.ZodError) {
            return { success: false, error: "استجابة AI غير صالحة. حاول مرة أخرى." }
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في الاتصال بخدمة الذكاء الاصطناعي",
        }
    }
}

// ============================================
// OPENAI CLIENT
// ============================================

async function callOpenAI<T>(
    prompt: string,
    systemPrompt: string,
    schema: z.ZodSchema<T>,
    options: AIRequestOptions = {}
): Promise<AIResponse<T>> {
    const { apiKey, model } = AI_CONFIG.openai
    const { temperature = AI_CONFIG.defaults.temperature, maxTokens = AI_CONFIG.defaults.maxTokens } = options

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt },
                ],
                temperature,
                max_tokens: maxTokens,
                response_format: { type: "json_object" },
            }),
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`)
        }

        const data = await response.json()
        const text = data.choices?.[0]?.message?.content

        if (!text) {
            throw new Error("No response from OpenAI")
        }

        // Parse and validate JSON
        const parsed = JSON.parse(text)
        const validated = schema.parse(parsed)

        return { success: true, data: validated }
    } catch (error) {
        console.error("OpenAI API error:", error)

        if (error instanceof z.ZodError) {
            return { success: false, error: "استجابة AI غير صالحة. حاول مرة أخرى." }
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : "فشل في الاتصال بخدمة الذكاء الاصطناعي",
        }
    }
}

// ============================================
// MAIN AI SERVICE
// ============================================

/**
 * Generate a structured response from AI
 * 
 * @param prompt - The user prompt
 * @param systemPrompt - The system prompt with instructions
 * @param schema - Zod schema to validate response
 * @param options - Optional configuration
 */
export async function generateStructured<T>(
    prompt: string,
    systemPrompt: string,
    schema: z.ZodSchema<T>,
    options: AIRequestOptions = {}
): Promise<AIResponse<T>> {
    // Check configuration
    if (!isAIConfigured()) {
        return {
            success: false,
            error: "خدمة الذكاء الاصطناعي غير مُعدّة. يرجى إضافة مفتاح API في الإعدادات.",
        }
    }

    // Call appropriate provider
    const provider = AI_CONFIG.provider

    if (provider === "gemini") {
        return callGemini(prompt, systemPrompt, schema, options)
    }

    if (provider === "openai") {
        return callOpenAI(prompt, systemPrompt, schema, options)
    }

    return {
        success: false,
        error: `مزود AI غير مدعوم: ${provider}`,
    }
}

// ============================================
// EXPORT
// ============================================

export { isAIConfigured }
