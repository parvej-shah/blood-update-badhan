import { GoogleGenerativeAI } from '@google/generative-ai'
import { ParsedDonorData } from './parser'
import { normalizeBloodGroup, normalizePhone, normalizeDate } from './validation'

const AI_TIMEOUT = 30000 // 30 seconds timeout

/**
 * Check if AI parsing is enabled
 */
export function isAIParsingEnabled(): boolean {
  return process.env.USE_AI_PARSING !== 'false'
}

/**
 * Parse donor data using Google Gemini API
 */
export async function parseWithGemini(text: string): Promise<ParsedDonorData[]> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `Extract donor information from the following text and return as a JSON array. If there are multiple donors, return an array of objects. If there's only one donor, return an array with one object.

Required fields:
- name: string (required) - The donor's name
- bloodGroup: string (must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-)
- batch: string (or "Unknown" if not found)
- hospital: string (or "Unknown" if not found)
- phone: string (Bangladesh format: 01XXXXXXXXX, extract from any format)
- date: string (format as DD-MM-YYYY, extract from any date format)
- referrer: string (or empty string if not found)
- hallName: string (or empty string if not found)

CRITICAL RULE FOR NAME PARSING:
- If the text starts with TWO names on the first two lines (separated by newline), the FIRST name is the REFERRER and the SECOND name is the DONOR NAME
- Examples:
  * "Tanvir Ahmed\nBadhon\n..." → referrer: "Tanvir Ahmed", name: "Badhon"
  * "Saifullah\nArafat\n..." → referrer: "Saifullah", name: "Arafat"
  * "Abdur\nSojib\n..." → referrer: "Abdur", name: "Sojib"
- If there's only one name at the top or names are not in this format, treat the first name as the donor name and referrer as empty/unknown

Rules:
1. Extract blood group in any format (B(+ve), B(positive), B+ve, AB(+)ve, A POSITIVE, etc.) and normalize to A+, A-, B+, B-, AB+, AB-, O+, O-
2. Extract phone number in any format and normalize to 01XXXXXXXXX format (remove +880 prefix if present)
3. Extract date in any format (DD-MM-YY, DD-MM-YYYY, DD.MM.YY, DD.MM.YYYY, M/D/YY, M/D/YYYY, 4/1/26, etc.) and format as DD-MM-YYYY
4. If a field is missing, use the default values: batch="Unknown", hospital="Unknown", referrer="", hallName=""
5. Return ONLY valid JSON array, no additional text or markdown

Text to parse:
${text}

Return the JSON array:`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT)

    const result = await model.generateContent(prompt)
    clearTimeout(timeoutId)

    const response = result.response
    const textResponse = response.text()

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = textResponse.trim()
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    // Parse JSON
    const parsed = JSON.parse(jsonText)
    
    // Ensure it's an array
    const donors = Array.isArray(parsed) ? parsed : [parsed]

    // Normalize and validate each donor
    const normalizedDonors: ParsedDonorData[] = []
    for (const donor of donors) {
      if (!donor.name || !donor.bloodGroup) {
        console.warn('Skipping donor with missing name or blood group:', donor)
        continue
      }

      // Normalize fields
      const normalized: ParsedDonorData = {
        name: String(donor.name || '').trim(),
        bloodGroup: normalizeBloodGroup(String(donor.bloodGroup || '')),
        batch: String(donor.batch || 'Unknown').trim(),
        hospital: String(donor.hospital || 'Unknown').trim(),
        phone: donor.phone ? normalizePhone(String(donor.phone)) : '',
        date: donor.date ? normalizeDate(String(donor.date)) : '',
        referrer: String(donor.referrer || '').trim(),
        hallName: String(donor.hallName || '').trim(),
      }

      // Validate required fields
      if (normalized.name && normalized.bloodGroup && normalized.phone && normalized.date) {
        normalizedDonors.push(normalized)
      } else {
        console.warn('Skipping donor with missing required fields:', normalized)
      }
    }

    return normalizedDonors
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Gemini API request timed out')
    }
    console.error('Gemini parsing error:', error)
    throw new Error(`Gemini parsing failed: ${error.message || 'Unknown error'}`)
  }
}

/**
 * Parse donor data using DeepSeek API
 */
export async function parseWithDeepSeek(text: string): Promise<ParsedDonorData[]> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured')
  }

  const prompt = `Extract donor information from the following text and return as a JSON array. If there are multiple donors, return an array of objects. If there's only one donor, return an array with one object.

Required fields:
- name: string (required) - The donor's name
- bloodGroup: string (must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-)
- batch: string (or "Unknown" if not found)
- hospital: string (or "Unknown" if not found)
- phone: string (Bangladesh format: 01XXXXXXXXX, extract from any format)
- date: string (format as DD-MM-YYYY, extract from any date format)
- referrer: string (or empty string if not found)
- hallName: string (or empty string if not found)

CRITICAL RULE FOR NAME PARSING:
- If the text starts with TWO names on the first two lines (separated by newline), the FIRST name is the REFERRER and the SECOND name is the DONOR NAME
- Examples:
  * "Tanvir Ahmed\nBadhon\n..." → referrer: "Tanvir Ahmed", name: "Badhon"
  * "Saifullah\nArafat\n..." → referrer: "Saifullah", name: "Arafat"
  * "Abdur\nSojib\n..." → referrer: "Abdur", name: "Sojib"
- If there's only one name at the top or names are not in this format, treat the first name as the donor name and referrer as empty/unknown

Rules:
1. Extract blood group in any format (B(+ve), B(positive), B+ve, AB(+)ve, A POSITIVE, etc.) and normalize to A+, A-, B+, B-, AB+, AB-, O+, O-
2. Extract phone number in any format and normalize to 01XXXXXXXXX format (remove +880 prefix if present)
3. Extract date in any format (DD-MM-YY, DD-MM-YYYY, DD.MM.YY, DD.MM.YYYY, M/D/YY, M/D/YYYY, 4/1/26, etc.) and format as DD-MM-YYYY
4. If a field is missing, use the default values: batch="Unknown", hospital="Unknown", referrer="", hallName=""
5. Return ONLY valid JSON array, no additional text or markdown

Text to parse:
${text}

Return the JSON array:`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT)

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1, // Low temperature for consistent extraction
        max_tokens: 2000,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const textResponse = data.choices?.[0]?.message?.content || ''

    if (!textResponse) {
      throw new Error('Empty response from DeepSeek API')
    }

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = textResponse.trim()
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    // Parse JSON
    const parsed = JSON.parse(jsonText)
    
    // Ensure it's an array
    const donors = Array.isArray(parsed) ? parsed : [parsed]

    // Normalize and validate each donor
    const normalizedDonors: ParsedDonorData[] = []
    for (const donor of donors) {
      if (!donor.name || !donor.bloodGroup) {
        console.warn('Skipping donor with missing name or blood group:', donor)
        continue
      }

      // Normalize fields
      const normalized: ParsedDonorData = {
        name: String(donor.name || '').trim(),
        bloodGroup: normalizeBloodGroup(String(donor.bloodGroup || '')),
        batch: String(donor.batch || 'Unknown').trim(),
        hospital: String(donor.hospital || 'Unknown').trim(),
        phone: donor.phone ? normalizePhone(String(donor.phone)) : '',
        date: donor.date ? normalizeDate(String(donor.date)) : '',
        referrer: String(donor.referrer || '').trim(),
        hallName: String(donor.hallName || '').trim(),
      }

      // Validate required fields
      if (normalized.name && normalized.bloodGroup && normalized.phone && normalized.date) {
        normalizedDonors.push(normalized)
      } else {
        console.warn('Skipping donor with missing required fields:', normalized)
      }
    }

    return normalizedDonors
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('DeepSeek API request timed out')
    }
    console.error('DeepSeek parsing error:', error)
    throw new Error(`DeepSeek parsing failed: ${error.message || 'Unknown error'}`)
  }
}

/**
 * Parse donor data using AI with fallback chain (Gemini → DeepSeek)
 */
export async function parseWithAI(text: string): Promise<ParsedDonorData[]> {
  if (!isAIParsingEnabled()) {
    throw new Error('AI parsing is disabled')
  }

  // Try Gemini first
  if (process.env.GEMINI_API_KEY) {
    try {
      console.log('🤖 Attempting to parse with Gemini...')
      const result = await parseWithGemini(text)
      console.log(`✅ Gemini parsing successful: ${result.length} donor(s) extracted`)
      return result
    } catch (error: any) {
      console.warn(`⚠️ Gemini parsing failed: ${error.message}`)
      // Fall through to DeepSeek
    }
  }

  // Try DeepSeek as fallback
  if (process.env.DEEPSEEK_API_KEY) {
    try {
      console.log('🤖 Attempting to parse with DeepSeek...')
      const result = await parseWithDeepSeek(text)
      console.log(`✅ DeepSeek parsing successful: ${result.length} donor(s) extracted`)
      return result
    } catch (error: any) {
      console.error(`❌ DeepSeek parsing failed: ${error.message}`)
      throw error
    }
  }

  throw new Error('No AI API keys configured (GEMINI_API_KEY or DEEPSEEK_API_KEY required)')
}


