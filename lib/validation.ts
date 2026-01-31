import { z } from 'zod'

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const

// Normalize blood group formats like "B(+ve)", "B(positive)", "B+ve" to "B+"
export function normalizeBloodGroup(bloodGroup: string): string {
  if (!bloodGroup) return bloodGroup
  
  // Convert to uppercase and remove spaces
  let normalized = bloodGroup.toUpperCase().trim()
  
  // Extract the base type (A, B, AB, O) and rh factor
  const baseMatch = normalized.match(/^([ABO]+|AB)/i)
  if (!baseMatch) return bloodGroup
  
  const base = baseMatch[1].toUpperCase()
  
  // Check for positive indicators: (+ve), (positive), +ve, positive, +
  const isPositive = /\(?\+?VE\)?|\(?POSITIVE\)?|\+/i.test(normalized)
  // Check for negative indicators: (-ve), (negative), -ve, negative, neg, minus, -
  const isNegative = /\(?-?VE\)?|\(?NEGATIVE\)?|\(?NEG\)?|\(?MINUS\)?|-/i.test(normalized)
  
  // Determine the rh factor
  let rh = ''
  if (isPositive) {
    rh = '+'
  } else if (isNegative) {
    rh = '-'
  } else {
    // If no indicator found, try to extract from the end
    if (normalized.endsWith('+')) {
      rh = '+'
    } else if (normalized.endsWith('-')) {
      rh = '-'
    } else {
      // Default to + if ambiguous
      rh = '+'
    }
  }
  
  // Construct normalized format
  const result = base + rh
  
  // Validate the result
  const validGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  if (validGroups.includes(result)) {
    return result
  }
  
  return bloodGroup // Return original if can't normalize
}

export const donorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  bloodGroup: z
    .string()
    .transform((val) => normalizeBloodGroup(val))
    .refine(
      (val) => bloodGroups.includes(val as typeof bloodGroups[number]),
      {
        message: 'Invalid blood group. Accepted formats: A+, A-, B+, B-, AB+, AB-, O+, O- or B(+ve), B(positive), etc.',
      }
    ),
  batch: z.string().optional(),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .refine(
      (phone) => {
        // Remove all non-digit characters except +
        const cleaned = phone.replace(/[^\d+]/g, '')
        // Bangladesh format: 11 digits starting with 01, or +880 format
        return (
          /^01\d{9}$/.test(cleaned) ||
          /^\+8801\d{9}$/.test(cleaned) ||
          /^8801\d{9}$/.test(cleaned)
        )
      },
      {
        message: 'Phone number must be in Bangladesh format (01XXXXXXXXX or +8801XXXXXXXXX)',
      }
    ),
  date: z
    .string()
    .min(1, 'Date is required')
    .refine(
      (date) => {
        // Accept DD-MM-YY, DD-MM-YYYY, DD.MM.YY, DD.MM.YYYY, M/D/YY, M/D/YYYY, MM/DD/YY, or MM/DD/YYYY
        return (
          /^\d{1,2}[.-]\d{1,2}[.-]\d{2,4}$/.test(date) || // Dash or dot format
          /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(date) // Slash format
        )
      },
      {
        message: 'Date must be in DD-MM-YY, DD-MM-YYYY, DD.MM.YY, DD.MM.YYYY, M/D/YY, or M/D/YYYY format',
      }
    ),
  referrer: z.string().optional(),
  hallName: z.string().optional(),
})

export type DonorInput = z.infer<typeof donorSchema>

export function normalizePhone(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '')
  
  // Convert +880 to 0
  if (cleaned.startsWith('+880')) {
    cleaned = '0' + cleaned.slice(4)
  } else if (cleaned.startsWith('880')) {
    cleaned = '0' + cleaned.slice(3)
  }
  
  return cleaned
}

/**
 * Normalize referrer names to handle variations like:
 * - "md rowshon" vs "Rowshon" vs "Md. Rowshon"
 * - "muhammad ali" vs "Muhammad Ali" vs "Md Ali"
 * - Case variations and spacing
 * 
 * This ensures that the same person is recognized regardless of how their name is entered.
 */
export function normalizeReferrer(referrer: string | null | undefined): string | null {
  if (!referrer) return null
  
  // Trim and normalize whitespace
  let normalized = referrer.trim().replace(/\s+/g, ' ')
  
  if (!normalized) return null
  
  // Common prefixes to remove (case-insensitive)
  // These are common in Bangladesh/Islamic names
  const prefixes = [
    /^md\.?\s+/i,           // md, md., MD, MD.
    /^m\.?\s+/i,            // m, m., M, M.
    /^muhammad\s+/i,        // muhammad, Muhammad
    /^mohammad\s+/i,        // mohammad, Mohammad
    /^mohammed\s+/i,        // mohammed, Mohammed
    /^mohd\.?\s+/i,         // mohd, mohd., Mohd
    /^moh\.?\s+/i,          // moh, moh., Moh
    /^engr\.?\s+/i,         // engr, engr., Engr (Engineer)
    /^dr\.?\s+/i,           // dr, dr., Dr (Doctor)
    /^prof\.?\s+/i,         // prof, prof., Prof (Professor)
    /^mr\.?\s+/i,           // mr, mr., Mr
    /^mrs\.?\s+/i,          // mrs, mrs., Mrs
    /^miss\s+/i,            // miss, Miss
    /^ms\.?\s+/i,           // ms, ms., Ms
  ]
  
  // Remove prefixes
  for (const prefix of prefixes) {
    normalized = normalized.replace(prefix, '')
  }
  
  // Normalize case: First letter of each word uppercase, rest lowercase
  normalized = normalized
    .split(' ')
    .map(word => {
      if (!word) return ''
      // Handle special cases like "vai", "apu", "bhai" (common in Bangladesh)
      const lowerWord = word.toLowerCase()
      if (['vai', 'apu', 'bhai', 'bhaiya', 'dada', 'didi', 'apa'].includes(lowerWord)) {
        return lowerWord
      }
      // Capitalize first letter, lowercase rest
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
    .trim()
  
  // Remove trailing dots and clean up
  normalized = normalized.replace(/\.+$/, '').trim()
  
  return normalized || null
}

export function normalizeDate(dateStr: string): string {
  // Parse DD-MM-YY, DD-MM-YYYY, DD.MM.YY, DD.MM.YYYY, M/D/YY, M/D/YYYY, MM/DD/YY, or MM/DD/YYYY
  let separator: string
  let isSlashFormat = false
  
  if (dateStr.includes('/')) {
    separator = '/'
    isSlashFormat = true
  } else if (dateStr.includes('.')) {
    separator = '.'
  } else {
    separator = '-'
  }
  
  const parts = dateStr.split(separator)
  if (parts.length !== 3) return dateStr

  let day: number
  let month: number
  let year: number

  if (isSlashFormat) {
    // Slash format: Could be M/D/YY (US) or D/M/YY (European/Bangladesh)
    // Smart detection: if first number > 12, it must be day/month/year
    const first = parseInt(parts[0], 10)
    const second = parseInt(parts[1], 10)
    
    if (first > 12 && second <= 12) {
      // First is day, second is month (D/M/YY format)
      day = first
      month = second
      year = parseInt(parts[2], 10)
    } else if (first <= 12 && second > 12) {
      // First is month, second is day (M/D/YY format)
      month = first
      day = second
      year = parseInt(parts[2], 10)
    } else {
      // Ambiguous: default to D/M/YY (day/month/year) for consistency with DD-MM-YY format
      day = first
      month = second
      year = parseInt(parts[2], 10)
    }
  } else {
    // Dash or dot format: DD-MM-YY or DD.MM.YY (day/month/year)
    day = parseInt(parts[0], 10)
    month = parseInt(parts[1], 10)
    year = parseInt(parts[2], 10)
  }

  // Handle 2-digit year (assume 2000-2099)
  if (year < 100) {
    year += 2000
  }

  // Validate date
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return dateStr
  }

  // Format as DD-MM-YYYY for storage (always use dash for consistency, day/month/year format)
  return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`
}

export function formatDateForDisplay(dateStr: string): string {
  // Convert DD-MM-YYYY to readable format
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr

  const day = parts[0]
  const month = parts[1]
  const year = parts[2]

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]

  const monthIndex = parseInt(month, 10) - 1
  if (monthIndex < 0 || monthIndex > 11) return dateStr

  return `${day} ${monthNames[monthIndex]} ${year}`
}

export function validateDonor(data: unknown): { success: boolean; data?: DonorInput; error?: string } {
  try {
    const validated = donorSchema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0]
      return { success: false, error: firstIssue?.message || 'Validation failed' }
    }
    return { success: false, error: 'Validation failed' }
  }
}

