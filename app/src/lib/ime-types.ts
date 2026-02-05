/**
 * IME Composition Types
 * 
 * Type definitions for handling Input Method Editor (IME) composition
 * events, particularly for non-Latin input methods (Arabic, Chinese, Japanese, etc.)
 * 
 * @module lib/ime-types
 */

/**
 * Extended KeyboardEvent with isComposing property.
 * The isComposing property exists at runtime but isn't typed in all TS libs.
 */
export interface CompositionKeyboardEvent extends KeyboardEvent {
    readonly isComposing?: boolean
}

/**
 * Extended InputEvent with isComposing property.
 */
export interface CompositionInputEvent extends InputEvent {
    readonly isComposing?: boolean
}

/**
 * Type guard to check if a keyboard event is a composition event.
 * 
 * @param e - The keyboard event to check
 * @returns True if the event is during IME composition
 * 
 * @example
 * ```tsx
 * const handleKeyDown = (e: KeyboardEvent) => {
 *   if (isComposingKeyboardEvent(e)) {
 *     // Skip processing during IME input
 *     return
 *   }
 *   // Handle the keydown
 * }
 * ```
 */
export function isComposingKeyboardEvent(e: KeyboardEvent): boolean {
    return (e as CompositionKeyboardEvent).isComposing === true
}

/**
 * Type guard to check if an input event is during composition.
 * 
 * @param e - The input event or native event to check
 * @returns True if the event is during IME composition
 */
export function isComposingInputEvent(e: Event): boolean {
    return (e as CompositionInputEvent).isComposing === true
}

/**
 * Wrapper for React's native event to check composition status.
 * Works with both InputEvent and native events.
 * 
 * @param nativeEvent - The native event from React's synthetic event
 * @returns True if the event is during IME composition
 */
export function isNativeEventComposing(nativeEvent: Event): boolean {
    return (nativeEvent as CompositionInputEvent).isComposing === true
}
