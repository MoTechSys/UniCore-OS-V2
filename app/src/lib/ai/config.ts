/**
 * AI Service Configuration
 * 
 * Central configuration for AI providers.
 * 
 * @module lib/ai/config
 */

// AI Provider Type
export type AIProvider = "openai" | "gemini"

// Configuration
export const AI_CONFIG = {
    // Default provider (can be changed)
    provider: (process.env.AI_PROVIDER as AIProvider) || "gemini",

    // API Keys
    openai: {
        apiKey: process.env.OPENAI_API_KEY || "",
        model: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
    },

    gemini: {
        apiKey: process.env.GOOGLE_AI_API_KEY || "",
        model: process.env.GOOGLE_AI_MODEL || "gemini-1.5-flash",
    },

    // Defaults
    defaults: {
        temperature: 0.7,
        maxTokens: 4096,
    },
} as const

// Check if AI is configured
export function isAIConfigured(): boolean {
    const provider = AI_CONFIG.provider
    if (provider === "openai") {
        return !!AI_CONFIG.openai.apiKey
    }
    if (provider === "gemini") {
        return !!AI_CONFIG.gemini.apiKey
    }
    return false
}
