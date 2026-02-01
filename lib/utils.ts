import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely parse JSON string with consistent error handling
 * @param jsonText - The JSON string to parse
 * @param context - Optional context for error messages (e.g., "API response", "request body")
 * @returns Parsed JSON object
 * @throws Error with consistent format if parsing fails
 */
export function safeJsonParse<T = any>(jsonText: string, context?: string): T {
  try {
    return JSON.parse(jsonText) as T
  } catch (error: any) {
    const contextMsg = context ? ` (${context})` : ''
    const errorMessage = `Failed to parse JSON${contextMsg}: ${error.message || 'Invalid JSON format'}`
    console.error(`❌ ${errorMessage}`)
    console.error(`   JSON text preview:`, jsonText.substring(0, 200))
    throw new Error(errorMessage)
  }
}

/**
 * Safely parse JSON from Response with consistent error handling
 * @param response - The fetch Response object
 * @param context - Optional context for error messages
 * @returns Parsed JSON object
 * @throws Error with consistent format if parsing fails
 */
export async function safeResponseJson<T = any>(response: Response, context?: string): Promise<T> {
  try {
    const text = await response.text()
    if (!text) {
      const contextMsg = context ? ` (${context})` : ''
      throw new Error(`Empty response body${contextMsg}`)
    }
    return safeJsonParse<T>(text, context || `Response from ${response.url}`)
  } catch (error: any) {
    // If it's already our formatted error, re-throw it
    if (error.message && error.message.includes('Failed to parse JSON')) {
      throw error
    }
    // Otherwise, wrap it
    const contextMsg = context ? ` (${context})` : ''
    const errorMessage = `Failed to parse response JSON${contextMsg}: ${error.message || 'Unknown error'}`
    console.error(`❌ ${errorMessage}`)
    throw new Error(errorMessage)
  }
}
