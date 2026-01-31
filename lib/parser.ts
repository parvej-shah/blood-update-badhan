import { normalizeBloodGroup } from './validation'
import { parseWithCustomModel, parseBulkWithCustomModel } from './custom-parser'

export interface ParsedDonorData {
  name: string
  bloodGroup: string
  batch: string
  phone: string
  date: string
  referrer: string
  hallName: string
}

/**
 * Detect if text is unstructured (needs AI parsing)
 */
export function isUnstructuredText(text: string): boolean {
  // Check if text contains structured format pattern
  const hasStructuredPattern = /Donor Name:\s*.+/i.test(text)
  
  if (hasStructuredPattern) {
    // Has structured pattern, try regex parsing first
    return false
  }

  // Check if text mentions donor-related keywords but lacks structure
  const donorKeywords = [
    /blood\s*group/i,
    /blood\s*type/i,
    /phone/i,
    /mobile/i,
    /donor/i,
    /batch/i,
    /hospital/i,
    /referrer/i,
    /hall/i,
    /\b(A\+|A-|B\+|B-|AB\+|AB-|O\+|O-)\b/i, // Blood groups
    /\b0?1[3-9]\d{8,9}\b/, // Bangladesh phone numbers
    /\b\+?8801[3-9]\d{8,9}\b/, // Bangladesh phone numbers (+880 format)
  ]
  
  // Check for date patterns
  const datePatterns = [
    /\d{1,2}\s*[\/\-\.]\s*\d{1,2}\s*[\/\-\.]\s*\d{2,4}/,
    /\d{1,2}\s+\d{1,2}\s+\d{2,4}/,
  ]
  
  const keywordMatches = donorKeywords.filter(keyword => keyword.test(text))
  const dateMatches = datePatterns.filter(pattern => pattern.test(text))
  const totalMatches = keywordMatches.length + (dateMatches.length > 0 ? 1 : 0)
  
  // If we have at least 2 indicators (blood group + phone/date, or name + blood group + phone/date)
  const hasBloodGroup = /\b(A\+|A-|B\+|B-|AB\+|AB-|O\+|O-)\b/i.test(text)
  const hasPhone = /\b0?1[3-9]\d{8,9}\b/.test(text) || /\b\+?8801[3-9]\d{8,9}\b/.test(text)
  const hasDate = dateMatches.length > 0
  
  // Check for name-like pattern (multiple words that could be a name)
  const namePattern = /^[A-Za-z\s]{3,30}$/m
  const hasNameLikePattern = namePattern.test(text.split('\n')[0]?.trim() || '')
  
  // If we have blood group + (phone OR date), or name + blood group + (phone OR date), it's likely unstructured donor data
  if (hasBloodGroup && (hasPhone || hasDate)) {
    return true
  }
  
  if (hasNameLikePattern && hasBloodGroup && (hasPhone || hasDate)) {
    return true
  }
  
  // Fallback: at least 2 keyword matches suggests donor info but unstructured
  if (totalMatches >= 2) {
    return true
  }
  
  return false
}

export function parseFormattedText(text: string): ParsedDonorData {
  const patterns = {
    name: /Donor Name:\s*(.+)/i,
    bloodGroup: /Blood Group:\s*(.+)/i,
    batch: /Batch:\s*(.+)/i,
    hospital: /Hospital:\s*(.+)/i,
    phone: /Phone:\s*(.+)/i,
    date: /Date:\s*(.+)/i,
    referrer: /Referrer:\s*(.+)/i,
    hallName: /Hall Name:\s*(.+)/i,
  }

  const extracted: Partial<ParsedDonorData> = {}

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern)
    extracted[key as keyof ParsedDonorData] = match ? match[1].trim() : ''
  }

  // Clean phone number (remove underscores, spaces, dashes)
  if (extracted.phone) {
    extracted.phone = extracted.phone.replace(/[_\s-]/g, '')
  }

  // Normalize blood group (handle formats like "B(+ve)", "B(positive)", etc.)
  if (extracted.bloodGroup) {
    extracted.bloodGroup = normalizeBloodGroup(extracted.bloodGroup)
  }

  // Set defaults
  extracted.batch = extracted.batch || 'Unknown'
  extracted.referrer = extracted.referrer || ''
  extracted.hallName = extracted.hallName || ''

  return {
    name: extracted.name || '',
    bloodGroup: extracted.bloodGroup || '',
    batch: extracted.batch || 'Unknown',
    phone: extracted.phone || '',
    date: extracted.date || '',
    referrer: extracted.referrer || '',
    hallName: extracted.hallName || '',
  }
}

// Parse bulk text with multiple donor entries
// Uses custom parser for all parsing
export async function parseBulkFormattedText(text: string): Promise<ParsedDonorData[]> {
  // First, try structured format parsing
  const entries: string[] = []
  
  // Try splitting by double newlines
  const doubleNewlineSplit = text.split(/\n\s*\n/)
  
  if (doubleNewlineSplit.length > 1) {
    // Multiple entries separated by blank lines
    entries.push(...doubleNewlineSplit.filter(entry => entry.trim().length > 0))
  } else {
    // Try splitting by "Donor Name:" pattern (new entry indicator)
    const donorNameMatches = text.matchAll(/Donor Name:/gi)
    const matches = Array.from(donorNameMatches)
    
    if (matches.length > 1) {
      // Multiple entries found
      for (let i = 0; i < matches.length; i++) {
        const start = matches[i].index || 0
        const end = i < matches.length - 1 ? (matches[i + 1].index || text.length) : text.length
        const entry = text.substring(start, end).trim()
        if (entry) entries.push(entry)
      }
    } else {
      // Single entry
      entries.push(text.trim())
    }
  }
  
  // Check if text has structured format (contains "Donor Name:" labels)
  const hasStructuredFormat = /Donor\s+Name\s*:/i.test(text)
  
  // Try structured parsing first only if it has structured format
  const parsedEntries: ParsedDonorData[] = []
  let hasValidEntries = false
  
  if (hasStructuredFormat) {
    for (const entry of entries) {
      if (entry.trim()) {
        try {
          const parsed = parseFormattedText(entry)
          // Only add if it has at least name and blood group
          if (parsed.name && parsed.bloodGroup) {
            parsedEntries.push(parsed)
            hasValidEntries = true
          }
        } catch (error) {
          // Skip invalid entries for now
          console.warn('Failed to parse entry with structured format:', error)
        }
      }
    }
  }
  
  // If structured parsing failed or detected unstructured text, use custom parser
  if (!hasValidEntries || !hasStructuredFormat || isUnstructuredText(text)) {
    try {
      console.log('🔍 Using custom parser for unstructured text...')
      const customParsed = parseBulkWithCustomModel(text)
      console.log(`📊 Custom parser returned ${customParsed.length} result(s)`)
      if (customParsed.length > 0) {
        console.log(`✅ Custom parsing successful: ${customParsed.length} donor(s) extracted`)
        // Convert ParsingResult to ParsedDonorData
        return customParsed.map(result => ({
          name: result.name,
          bloodGroup: result.bloodGroup,
          batch: result.batch,
          phone: result.phone,
          date: result.date,
          referrer: result.referrer,
          hallName: result.hallName,
        }))
      } else {
        console.warn('⚠️ Custom parser returned 0 results')
      }
    } catch (error: any) {
      console.error(`❌ Custom parsing failed: ${error.message}`, error.stack)
      // If custom parsing fails, return structured results (even if empty)
    }
  }
  
  return parsedEntries
}

// Synchronous version for backward compatibility (used in components)
// This will only use regex parsing
export function parseBulkFormattedTextSync(text: string): ParsedDonorData[] {
  const entries: string[] = []
  
  const doubleNewlineSplit = text.split(/\n\s*\n/)
  
  if (doubleNewlineSplit.length > 1) {
    entries.push(...doubleNewlineSplit.filter(entry => entry.trim().length > 0))
  } else {
    const donorNameMatches = text.matchAll(/Donor Name:/gi)
    const matches = Array.from(donorNameMatches)
    
    if (matches.length > 1) {
      for (let i = 0; i < matches.length; i++) {
        const start = matches[i].index || 0
        const end = i < matches.length - 1 ? (matches[i + 1].index || text.length) : text.length
        const entry = text.substring(start, end).trim()
        if (entry) entries.push(entry)
      }
    } else {
      entries.push(text.trim())
    }
  }
  
  const parsedEntries: ParsedDonorData[] = []
  for (const entry of entries) {
    if (entry.trim()) {
      try {
        const parsed = parseFormattedText(entry)
        if (parsed.name && parsed.bloodGroup) {
          parsedEntries.push(parsed)
        }
      } catch (error) {
        console.warn('Failed to parse entry:', error)
      }
    }
  }
  
  return parsedEntries
}

