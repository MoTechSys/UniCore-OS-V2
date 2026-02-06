/**
 * Quiz Actions Utilities
 *
 * Helper functions that are not Server Actions
 *
 * @module features/quizzes/actions/utils
 */

export interface OptionInput {
    id?: string
    text: string
    isCorrect: boolean
    order: number
}

/**
 * Create default options for TRUE_FALSE question
 */
export function createTrueFalseOptions(correctAnswer: boolean): OptionInput[] {
    return [
        { text: "صح", isCorrect: correctAnswer, order: 0 },
        { text: "خطأ", isCorrect: !correctAnswer, order: 1 },
    ]
}

/**
 * Create empty MCQ options
 */
export function createEmptyMCQOptions(count: number = 4): OptionInput[] {
    return Array.from({ length: count }, (_, i) => ({
        text: "",
        isCorrect: i === 0,
        order: i,
    }))
}
