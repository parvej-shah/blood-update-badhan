import { ParsedDonorData } from './parser'
import { normalizeBloodGroup, normalizePhone, normalizeDate } from './validation'

export interface ParsingResult extends ParsedDonorData {
  confidence: number
}

/**
 * Clean text by removing metadata that shouldn't be parsed
 * Preserves newlines for line-based extraction
 */
function cleanText(text: string): string {
  let cleaned = text
  
  // Remove "Edited" markers (handles "· \nEdited" cross-line pattern from WhatsApp)
  cleaned = cleaned.replace(/[ \t]*·[ \t]*\n[ \t]*Edited[ \t]*/gi, '')
  cleaned = cleaned.replace(/[ \t]*·[ \t]*Edited[ \t]*/gi, ' ')
  cleaned = cleaned.replace(/^[ \t]*Edited[ \t]*$/gim, '')
  
  // WhatsApp timestamps — replace with blank line (block separator)
  // Matches standalone lines: "00:24", "11:32 AM", "21 May 2026, 11:32", "21 May 2026, 11:32 AM"
  cleaned = cleaned.replace(/^[ \t]*(?:\d{1,2}\s+\w+\s+\d{4},?\s*)?\d{1,2}:\d{2}(?:\s*[AP]M)?[ \t]*$/gim, '\n')
  // Strip stray Bengali/Arabic numerals on their own line (WhatsApp reactions/counts)
  cleaned = cleaned.replace(/^[ \t]*[০-৯٠-٩]+[ \t]*$/gm, '')
  // Remove legacy timestamp patterns embedded mid-line
  cleaned = cleaned.replace(/\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4},\s*\d{2}:\d{2}/gi, '')
  cleaned = cleaned.replace(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4},\s*/g, '')
  
  // Remove "deleted a message" text
  cleaned = cleaned.replace(/deleted\s+a\s+message/gi, '')
  
  // Remove reply indicators (e.g., "replied to Sumon")
  cleaned = cleaned.replace(/replied\s+to\s+[\w\s]+/gi, '')
  
  // Remove middle dots
  cleaned = cleaned.replace(/·/g, ' ')
  
  // Clean up extra whitespace but preserve newlines
  // Replace multiple spaces with single space, but keep newlines
  cleaned = cleaned.replace(/[ \t]+/g, ' ') // Multiple spaces/tabs to single space
  cleaned = cleaned.replace(/\n\s*\n\s*\n+/g, '\n\n') // Multiple newlines to double newline
  cleaned = cleaned.replace(/\n[ \t]+/g, '\n') // Remove leading spaces after newlines
  cleaned = cleaned.replace(/[ \t]+\n/g, '\n') // Remove trailing spaces before newlines
  cleaned = cleaned.trim()
  
  return cleaned
}

/**
 * Extract names using two-name rule
 * If two names on first two lines: first = referrer, second = donor
 * Handles cases where name and blood group are on the same line
 */
function extractNames(text: string): { donorName: string; referrer: string } {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  console.log('📋 Lines after split:', lines)
  
  if (lines.length >= 2) {
    const firstLine = lines[0]
    const secondLine = lines[1]
    console.log('🔍 Checking two-name rule. First:', firstLine, 'Second:', secondLine)
    
    // Check if first two lines look like names (not phone, date, blood group, etc.)
    const isNamePattern = (str: string) => {
      // Not a phone number
      if (/^\+?880?1[3-9]\d{8,9}$/.test(str.replace(/[\s-]/g, ''))) return false
      // Not a date
      if (/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/.test(str)) return false
      // Not a pure blood group (but could be name + blood group)
      if (/^[ABO]+[+-]?[()]*[ve]*$/i.test(str)) return false
      // Not "Mobile:", "Date:", "Managed by", etc.
      if (/^(Mobile|Date|Managed|Batch|Phone|Hall|Referrer)\s*:/i.test(str)) return false
      // Has letters and reasonable length
      const result = /^[A-Za-z\u0080-\uFFFF\s\.]{2,50}$/.test(str)
      console.log(`  ✓ isNamePattern("${str}"): ${result}`)
      return result
    }
    
    // Check if line contains name + blood group (e.g., "Abdur Rahman B+", "Riaz(A+)")
    const extractNameFromLine = (str: string): string => {
      // Pattern 1: Name with blood group in parentheses at the end: "Riaz(A+)", "Name(B+)"
      const parenPattern = /^(.+?)\([ABO]+[+-]?[()]*[ve]*\)$/i
      const parenMatch = str.match(parenPattern)
      if (parenMatch && parenMatch[1]) {
        const name = parenMatch[1].trim()
        if (name.length >= 2 && name.length <= 50 && /^[A-Za-z\u0080-\uFFFF\s\.]+$/.test(name)) {
          return name
        }
      }
      
      // Pattern 2: Name followed by blood group with space: "Abdur Rahman B+"
      const spacePatterns = [
        /^(.+?)\s+[ABO]+[+-]?[()]*[ve]*$/i,  // "Name B+" or "Name B(+ve)"
        /^(.+?)\s+[ABO]+[+-]$/i,             // "Name B+" (simpler)
      ]
      
      for (const pattern of spacePatterns) {
        const nameMatch = str.match(pattern)
        if (nameMatch && nameMatch[1]) {
          const name = nameMatch[1].trim()
          // Verify it looks like a name (has letters, reasonable length, not too long)
          if (name.length >= 2 && name.length <= 50 && /^[A-Za-z\u0080-\uFFFF\s\.]+$/.test(name)) {
            return name
          }
        }
      }
      // If no match, return empty (don't return the full string with blood group)
      return ''
    }
    
    const firstIsName = isNamePattern(firstLine)
    console.log(`  First is name: ${firstIsName}`)
    
    // Check if second line has name + blood group (e.g., "Abdur Rahman B+", "Riaz(A+)")
    // Pattern 1: Name with blood group in parentheses: "Riaz(A+)"
    const hasNameWithParenBG = /^[A-Za-z\u0080-\uFFFF\s\.]+\([ABO]+[+-]/i.test(secondLine)
    // Pattern 2: Name with blood group after space: "Abdur Rahman B+"
    const hasNameWithSpaceBG = /^[A-Za-z\u0080-\uFFFF\s\.]+\s+[ABO]+[+-]/i.test(secondLine)
    const secondHasNameAndBG = hasNameWithParenBG || hasNameWithSpaceBG
    const secondIsName = isNamePattern(secondLine)
    console.log(`  Second is name: ${secondIsName}, has name+BG: ${secondHasNameAndBG}`)
    
    // Two-name rule: if first line is a name and second line is a name OR has name+blood group
    if (firstIsName && (secondIsName || secondHasNameAndBG)) {
      console.log('  ✅ Two-name rule applies!')
      // Two-name rule: first = referrer, second = donor
      let donorName = ''
      if (secondHasNameAndBG) {
        // Extract name part from "Name B+" format
        donorName = extractNameFromLine(secondLine)
        console.log(`  Extracted donor name from name+BG: "${donorName}"`)
      } else if (secondIsName) {
        // Pure name on second line
        donorName = secondLine.trim()
        console.log(`  Using second line as donor name: "${donorName}"`)
      }
      
      // Only return if we successfully extracted a donor name
      if (donorName) {
        const result = {
          referrer: firstLine.trim(),
          donorName: donorName
        }
        console.log('  ✅ Returning two-name result:', result)
        return result
      } else {
        console.log('  ❌ Donor name is empty, not returning')
      }
    } else {
      console.log('  ❌ Two-name rule does not apply')
    }
  }
  
  // Single name or names not on first two lines
  // Try to find name on first line
  if (lines.length > 0) {
    const firstLine = lines[0]
    
    // Check if it's name with blood group in parentheses: "Riaz(A+)"
    if (/^[A-Za-z\u0080-\uFFFF\s\.]+\([ABO]+[+-]/i.test(firstLine)) {
      const nameMatch = firstLine.match(/^(.+?)\([ABO]+[+-]/i)
      if (nameMatch && nameMatch[1]) {
        const name = nameMatch[1].trim()
        if (name.length >= 2 && /^[A-Za-z\u0080-\uFFFF\s\.]+$/.test(name)) {
          return {
            referrer: '',
            donorName: name
          }
        }
      }
    }
    
    // Check if it's name + blood group with space: "Name B+"
    if (/^[A-Za-z\u0080-\uFFFF\s\.]+\s+[ABO]+[+-]/i.test(firstLine)) {
      const nameMatch = firstLine.match(/^(.+?)\s+[ABO]+[+-]/i)
      if (nameMatch && nameMatch[1]) {
        const name = nameMatch[1].trim()
        if (name.length >= 2 && /^[A-Za-z\u0080-\uFFFF\s\.]+$/.test(name)) {
          return {
            referrer: '',
            donorName: name
          }
        }
      }
    }
    
    // Pure name check (no blood group)
    if (/^[A-Za-z\u0080-\uFFFF\s\.]{2,50}$/.test(firstLine) && 
        !/^\+?880?1[3-9]\d{8,9}$/.test(firstLine.replace(/[\s-]/g, '')) &&
        !/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/.test(firstLine) &&
        !/^(Mobile|Date|Managed|Batch|Phone|Hall|Referrer)\s*:/i.test(firstLine)) {
      return {
        referrer: '',
        donorName: firstLine.trim()
      }
    }
  }
  
  return { referrer: '', donorName: '' }
}

/**
 * Extract blood group from text
 */
function extractBloodGroup(text: string): string {
  console.log('🩸 Extracting blood group from full text (length:', text.length, ')')
  
  // Since data is line-by-line, check each line for blood group
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  console.log('  Checking', lines.length, 'lines for blood group')
  
  const VALID_BG = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  // Strict shape: must start with A/B/AB/O and contain a +/- indicator
  const BG_SHAPE = /^(?:AB?|O|B)\s*(?:[\(\[]\s*[+\-](?:ve|VE|positive|negative)?\s*[\)\]](?:ve|VE)?|[\(\[]\s*[+\-]\s*[\)\]]|[+\-](?:ve|VE|positive|negative)?)(?:\s+\d+\s*(?:ml|unit))?$|^(?:AB?|O|B)[+\-]$/i

  // First, try to find blood group on its own line (most common case)
  for (const line of lines) {
    console.log(`  Checking line: "${line}"`)
    const cleaned = line.replace(/\s*\d+\s*ml\b/gi, '').replace(/\s*\d+\s*unit\b/gi, '').trim()
    if (!BG_SHAPE.test(cleaned)) continue
    const bg = normalizeBloodGroup(cleaned)
    if (bg && VALID_BG.includes(bg)) {
      console.log(`  ✅ Found blood group: "${bg}"`)
      return bg
    }
  }
  
  // If not found on its own line, search the entire text for patterns
  const cleaned = text.replace(/\bplatelet\b/gi, '')
  const patterns = [
    // Pattern for "Name(BG)" format: "Riaz(A+)", "Name(A+)"
    /\(([ABO]+|AB)[+-]?\)/gi,
    // Pattern for standalone blood group on its own line
    /^([ABO]+|AB)[+-]$/gim,
    // Pattern for "Name B+" format
    /\b([ABO]+|AB)[\s]*[+-](?!\d)/gi,
    // Pattern for "B(+ve)", "B(positive)", etc.
    /\b([ABO]+|AB)[\s]*\([+-]?ve\)/gi,
    /\b([ABO]+|AB)[\s]*\([+-]?positive\)/gi,
    /\b([ABO]+|AB)[\s]*\([+-]?negative\)/gi,
    // Pattern for "B+ve", "B-ve", etc.
    /\b([ABO]+|AB)[\s]*[+-]?ve\b/gi,
  ]
  
  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i]
    const matches = Array.from(cleaned.matchAll(pattern))
    if (matches.length > 0) {
      for (const match of matches) {
        const bgText = match[1] || match[0]
        const bg = normalizeBloodGroup(bgText.trim())
        if (bg && ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(bg)) {
          console.log(`  ✅ Found blood group via pattern ${i}: "${bg}"`)
          return bg
        }
      }
    }
  }
  
  console.log('  ❌ No valid blood group found')
  return ''
}

/**
 * Extract phone number from text
 */
function extractPhone(text: string): string {
  // Strip formatting per-line so dashes inside numbers don't break matching
  for (const line of text.split('\n')) {
    const stripped = line.replace(/[\s\-()]/g, '')
    const m = stripped.match(/(\+?880)?01[3-9]\d{8}/)
    if (m) {
      const phone = normalizePhone(m[0])
      if (/^01[3-9]\d{8}$/.test(phone)) return phone
    }
  }
  return ''
}

/**
 * Extract date from text
 */
function extractDate(text: string): string {
  const DATE_RE = /\b(\d{1,2})[\/\-\._](\d{1,2})[\/\-\._](\d{2,4})\b/g
  for (const match of text.matchAll(DATE_RE)) {
    const [, , , yearStr] = match
    const year = parseInt(yearStr)
    // Reject batch year-ranges: two 2-digit numbers both < 100 (e.g. 22/23, 23-24)
    const part1 = parseInt(match[1])
    const part2 = parseInt(match[2])
    if (yearStr.length <= 2 && part1 <= 31 && part2 <= 12) {
      // could be DD-MM-YY — valid only if year >= 20 (i.e. 2020+)
      if (year < 20) continue
    }
    // Reject patterns where all three parts are 2-digit and look like a batch (e.g. 22/23 parsed as 22-23-??)
    if (yearStr.length <= 2 && part1 >= 20 && part1 <= 30 && part2 >= 20 && part2 <= 30) continue
    const date = normalizeDate(match[0].trim())
    if (date && /^\d{2}-\d{2}-\d{4}$/.test(date)) {
      const yr = parseInt(date.slice(-4))
      if (yr >= 2020) return date
    }
  }
  return ''
}

/**
 * Extract batch from text
 * Must avoid matching phone numbers or dates
 */
function extractBatch(text: string): string {
  // First, extract phone and date to exclude them from batch matching
  const phonePattern = /\+?880?1[3-9]\d{8,9}|01[3-9]\d{8,9}/g
  const datePattern = /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/g
  
  // Create a text without phone and date for batch extraction
  let textForBatch = text
  const phoneMatches = text.matchAll(phonePattern)
  for (const match of phoneMatches) {
    textForBatch = textForBatch.replace(match[0], ' ' + 'X'.repeat(match[0].length) + ' ')
  }
  const dateMatches = text.matchAll(datePattern)
  for (const match of dateMatches) {
    textForBatch = textForBatch.replace(match[0], ' ' + 'X'.repeat(match[0].length) + ' ')
  }
  
  // Batch patterns - only match department names with years or standalone year ranges
  const patterns = [
    // Department + year format (preferred): "Math 23-24", "PHR(24-25)", etc.
    /(Math(?:ematics)?|MTH|Physics|Chemistry|Botany|Pharmacy|Microbiology|Zoology|Statistics|Applied\s*math|AMATH|A\.math|Phy|Ocn|SWE|IIT|PHR|INFS|Fisheries|GEB|EEE|CSE|EECE|NE|ACCE)[\s]*\(?(\d{2,4}[\s\-_\/]?\d{2,4})\)?/gi,
  ]
  
  // Try department patterns first
  for (const pattern of patterns) {
    const matches = textForBatch.matchAll(pattern)
    for (const match of matches) {
      const matchText = match[0].trim()
      // Verify it contains a department name
      if (/[A-Za-z]/.test(matchText)) {
        return matchText
      }
    }
  }
  
  // Only match standalone year ranges (not part of phone/date) - be very strict
  // Year ranges should be like "23-24", "24-25" on their own line or with context
  const yearRangePattern = /\b(\d{2}[\s-]\d{2})\b/g
  const yearMatches = textForBatch.matchAll(yearRangePattern)
  for (const match of yearMatches) {
    const matchText = match[1] // Get the captured group
    const parts = matchText.split(/[\s-]/)
    const first = parseInt(parts[0])
    const second = parseInt(parts[1])
    
    // Verify it's a reasonable batch year range:
    // - Both should be 2-digit years (20-99)
    // - Should be consecutive or close (difference <= 5)
    // - First should be less than second (e.g., 23-24, not 50-40)
    if (first >= 20 && first <= 99 && 
        second >= 20 && second <= 99 && 
        second > first && 
        (second - first) <= 5) {
      // Check context - should not be immediately after/before phone-like digits
      const contextStart = Math.max(0, (match.index || 0) - 3)
      const contextEnd = Math.min(textForBatch.length, (match.index || 0) + matchText.length + 3)
      const context = textForBatch.substring(contextStart, contextEnd)
      
      // Should not be part of a longer number sequence
      if (!/\d{3,}/.test(context.replace(matchText, ''))) {
        return matchText
      }
    }
  }
  
  return ''
}

/**
 * Extract hall name from text
 */
const HALL_NORMALIZE: Array<[RegExp, string]> = [
  [/\b(?:Amar\s+Ekushey\s+Hall|A\.?E\.?\s*Hall|AEH|AE\s+[Hh]all|AE\b)\b/i, 'AE Hall'],
  [/\bFH\s*[Hh]all\b|\bFH\b/i, 'FH Hall'],
  [/\bSH\s*[Hh]all\b|\bSH\b/i, 'SH Hall'],
  [/\bSK\s*[Hh]all\b|\bSK\b/i, 'SK Hall'],
  [/\bMohsin\s*[Hh]all\b|\bMohsin\b/i, 'Mohsin Hall'],
  [/\bJagannath\s*[Hh]all\b|\bJn\s*[Hh]all\b|\bJnU\b/i, 'Jagannath Hall'],
  [/\b21\s*[Hh]all\b/i, '21 Hall'],
  [/\bSurjasen\s*[Hh]all\b/i, 'Surjasen Hall'],
  [/\bPG\s*[Hh]all\b|\bPG\b/i, 'PG Hall'],
]

function extractHall(text: string): string {
  for (const line of text.split('\n')) {
    const t = line.trim()
    for (const [pattern, normalized] of HALL_NORMALIZE) {
      if (pattern.test(t)) return normalized
    }
  }
  // Generic "X hall" fallback
  const generic = text.match(/\b([A-Za-z0-9]+\s+[Hh]all)\b/)
  if (generic) return generic[1].trim()
  return ''
}


/**
 * Extract referrer from text (beyond two-name rule)
 */
function extractReferrer(text: string, alreadyFound: string): string {
  if (alreadyFound) return alreadyFound
  
  // "Managed by" pattern - extract only the name part, stop at end of line
  // Match "Managed by: Name" or "Managed by Name" on a single line
  const lines = text.split('\n')
  for (const line of lines) {
    const managedByMatch = line.match(/Managed\s+by\s*:?\s*([A-Za-z\s]+?)(?:\s*\([^)]+\))?(?:\s*Date\s*:|$)/i)
    if (managedByMatch && managedByMatch[1]) {
      let referrer = managedByMatch[1].trim()
      // Remove batch info in parentheses if any
      referrer = referrer.replace(/\s*\([^)]+\)\s*/, '').trim()
      // Stop at "Date" keyword if present (shouldn't happen with line-by-line, but safety check)
      referrer = referrer.split(/\s+Date\s*/i)[0].trim()
      // Only return if it looks like a name (not empty, has letters)
      if (referrer && /^[A-Za-z\u0080-\uFFFF\s\.]+$/.test(referrer)) {
        return referrer
      }
    }
  }
  
  return ''
}

/**
 * Parse sequential format (comma-separated OR line-by-line)
 * Intelligently detects field types regardless of position
 * Handles: Name+BloodGroup on same line, missing batch, variable referrer position
 */
function parseSequentialFormat(text: string): ParsingResult | null {
  // Split by comma or newline to get parts
  let parts: string[]
  
  if (text.includes(',')) {
    // Comma-separated format
    parts = text.split(',').map(p => p.trim()).filter(p => p.length > 0)
    console.log('🔍 Trying comma-separated format. Parts:', parts)
  } else {
    // Line-by-line format
    parts = text.split('\n').map(p => p.trim()).filter(p => p.length > 0)
    console.log('🔍 Trying line-by-line format. Parts:', parts)
  }
  
  // Need at least 4 parts (name, blood group, phone, date)
  if (parts.length < 4) return null
  
  const result: ParsingResult = {
    name: '',
    bloodGroup: '',
    batch: 'Unknown',
    phone: '',
    date: '',
    referrer: '',
    hallName: '',
    confidence: 0.0
  }
  
  const used: boolean[] = new Array(parts.length).fill(false)
  const nameLikeParts: number[] = []
  
  // Helper: Check if part looks like a name
  const isNameLike = (str: string): boolean => {
    return /^[A-Za-z\u0080-\uFFFF\s\.]{2,50}$/.test(str) &&
           !/^\+?880?1[3-9]\d{8,9}$/.test(str.replace(/[\s-]/g, '')) &&
           !/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/.test(str) &&
           !/^[ABO]+[+-]?[()ve]*$/i.test(str)
  }
  
  // Helper: Check if part looks like a batch
  const isBatchLike = (str: string): boolean => {
    // Batch patterns:
    // - Year range: "23-24", "2023-24", "2023-2024"
    // - Full year: "2024" (4 digits)
    // - Department + year: "IIT 23-24", "Math 2024", "PHR 23-24"
    return /\d{2,4}[\s-]\d{2,4}/.test(str) || // "23-24" or "2023-24"
           /^\d{4}$/.test(str) || // "2024" (exactly 4 digits)
           /(IIT|Math(?:ematics)?|MTH|Physics|Chemistry|Pharmacy|PHR|SWE|Botany|Microbiology|Zoology|Statistics|Ocn|CSE|EEE|EECE|NE|ACCE|GEB|INFS|Fisheries|Applied\s*Math|AMATH|A\.?\s*Math)\s*\d{2,4}/i.test(str) // Dept + year
  }
  
  
  // Helper: Check if part looks like a hall
  const isHallLike = (str: string): boolean => {
    return /Hall|AEH|Amar\s+Ekushey/i.test(str)
  }
  
  // Pass 1: Extract definite fields
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    
    // Check for Name + Blood Group combined (e.g., "Parvej Shah B+")
    const nameBgMatch = part.match(/^(.+?)\s+([ABO]+[+-]?[()ve]*)$/i)
    if (nameBgMatch && !used[i]) {
      const possibleName = nameBgMatch[1].trim()
      const possibleBg = nameBgMatch[2].trim()
      if (isNameLike(possibleName) && extractBloodGroup(possibleBg)) {
        result.name = possibleName
        result.bloodGroup = extractBloodGroup(possibleBg) || ''
        used[i] = true
        console.log(`✓ Found name+BG combo at ${i}: ${possibleName} | ${result.bloodGroup}`)
        continue
      }
    }
    
    // Blood Group (standalone)
    if (!result.bloodGroup && !used[i]) {
      const bg = extractBloodGroup(part)
      if (bg) {
        result.bloodGroup = bg
        used[i] = true
        console.log(`✓ Found blood group at ${i}: ${bg}`)
        continue
      }
    }
    
    // Phone
    if (!result.phone && !used[i]) {
      const phone = extractPhone(part)
      if (phone) {
        result.phone = phone
        used[i] = true
        console.log(`✓ Found phone at ${i}: ${phone}`)
        continue
      }
    }
    
    // Date
    if (!result.date && !used[i]) {
      const date = extractDate(part)
      if (date) {
        result.date = date
        used[i] = true
        console.log(`✓ Found date at ${i}: ${date}`)
        continue
      }
    }
    
    // Batch (specific patterns)
    if (result.batch === 'Unknown' && !used[i] && isBatchLike(part)) {
      result.batch = part
      used[i] = true
      console.log(`✓ Found batch at ${i}: ${part}`)
      continue
    }
    
    
    // Hall (specific patterns)
    if (!result.hallName && !used[i] && isHallLike(part)) {
      result.hallName = part
      used[i] = true
      console.log(`✓ Found hall at ${i}: ${part}`)
      continue
    }
    
    // Collect name-like parts for later processing
    if (!used[i] && isNameLike(part)) {
      nameLikeParts.push(i)
    }
  }
  
  // Pass 2: Process name-like parts
  // If we have 2+ name-like parts: first is referrer, second is donor name
  // If we have 1 name-like part: it's the donor name
  if (!result.name && nameLikeParts.length > 0) {
    if (nameLikeParts.length >= 2) {
      // Two names: first = referrer, second = donor
      result.referrer = parts[nameLikeParts[0]]
      used[nameLikeParts[0]] = true
      console.log(`✓ Found referrer (first name) at ${nameLikeParts[0]}: ${result.referrer}`)
      
      result.name = parts[nameLikeParts[1]]
      used[nameLikeParts[1]] = true
      console.log(`✓ Found donor name (second name) at ${nameLikeParts[1]}: ${result.name}`)
      
      nameLikeParts.splice(0, 2)
    } else {
      // Only one name: it's the donor
      result.name = parts[nameLikeParts[0]]
      used[nameLikeParts[0]] = true
      console.log(`✓ Found name at ${nameLikeParts[0]}: ${result.name}`)
      nameLikeParts.shift()
    }
  }
  
  // Pass 3: Assign remaining unused parts
  for (let i = 0; i < parts.length; i++) {
    if (used[i]) continue
    
    const part = parts[i]
    
    // Skip simple numbers (1-100) - these are NOT batch (like "14 th time")
    const isSimpleNumber = /^\d{1,2}$/.test(part) && parseInt(part) <= 100
    if (isSimpleNumber) {
      console.log(`⚠ Skipping simple number at ${i}: ${part} (not a batch)`)
      continue
    }
    
    // If we still don't have batch and this could be batch (but not a simple number)
    if (result.batch === 'Unknown' && isBatchLike(part)) {
      result.batch = part
      used[i] = true
      console.log(`✓ Assigned batch at ${i}: ${part}`)
      continue
    }
    
    
    // If we still don't have hall
    if (!result.hallName) {
      result.hallName = part
      used[i] = true
      console.log(`✓ Assigned hall at ${i}: ${part}`)
      continue
    }
  }
  
  // Calculate confidence
  let confidenceScore = 0.0
  let maxScore = 0.0
  
  if (result.name) {
    maxScore += 1.0
    confidenceScore += 1.0
  }
  if (result.bloodGroup) {
    maxScore += 1.0
    confidenceScore += 1.0
  }
  if (result.phone) {
    maxScore += 1.0
    confidenceScore += 1.0
  }
  if (result.date) {
    maxScore += 1.0
    confidenceScore += 1.0
  }
  if (result.batch && result.batch !== 'Unknown') {
    maxScore += 0.5
    confidenceScore += 0.5
  }
  
  result.confidence = maxScore > 0 ? confidenceScore / maxScore : 0.0
  
  // Only return if we have minimum required fields
  if (result.name && result.bloodGroup && result.phone && result.date) {
    console.log('✅ Sequential format parsed successfully:', result)
    return result
  }
  
  console.log('❌ Sequential format failed validation')
  return null
}

/**
 * Main custom parser function
 */
export function parseWithCustomModel(text: string): ParsingResult {
  // Try sequential format first (comma-separated or line-by-line)
  const sequentialParsed = parseSequentialFormat(text)
  if (sequentialParsed) {
    return sequentialParsed
  }
  
  // Clean text first (preserves newlines for line-by-line processing)
  const cleanedText = cleanText(text)
  console.log('🧹 Cleaned text (full block):', cleanedText)
  console.log('📏 Text length:', cleanedText.length, 'lines:', cleanedText.split('\n').length)
  
  // Initialize result
  const result: ParsingResult = {
    name: '',
    bloodGroup: '',
    batch: 'Unknown',
    phone: '',
    date: '',
    referrer: '',
    hallName: '',
    confidence: 0.0
  }
  
  // Extract names (two-name rule) - processes the FULL text block
  // Since data is line-by-line, extractNames will check first two lines
  const names = extractNames(cleanedText)
  console.log('👤 Extracted names:', names)
  result.name = names.donorName || ''
  result.referrer = names.referrer || ''
  
  // If name extraction failed, try to extract from first line as fallback
  if (!result.name && cleanedText) {
    const lines = cleanedText.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    if (lines.length > 0) {
      const firstLine = lines[0]
      
      // Try extracting name from "Name(BG)" format
      const parenMatch = firstLine.match(/^(.+?)\([ABO]+[+-]/i)
      if (parenMatch && parenMatch[1]) {
        const name = parenMatch[1].trim()
        if (name.length >= 2 && /^[A-Za-z\u0080-\uFFFF\s\.]+$/.test(name)) {
          result.name = name
        }
      }
      
      // If still no name, check if first line is a pure name
      if (!result.name && 
          !/^\+?880?1[3-9]\d{8,9}$/.test(firstLine.replace(/[\s-]/g, '')) &&
          !/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/.test(firstLine) &&
          !/^(Mobile|Date|Managed|Batch|Phone|Hall|Referrer)\s*:/i.test(firstLine) &&
          /^[A-Za-z\u0080-\uFFFF\s\.]{2,50}$/.test(firstLine)) {
        result.name = firstLine.trim()
      }
    }
  }
  
  // Extract other fields from the FULL text block (not individual lines)
  // Since data is line-by-line, each field should be on its own line
  result.bloodGroup = extractBloodGroup(cleanedText)
  console.log('🩸 Extracted blood group:', result.bloodGroup)
  result.phone = extractPhone(cleanedText)
  result.date = extractDate(cleanedText)
  result.batch = extractBatch(cleanedText) || 'Unknown'
  result.hallName = extractHall(cleanedText)
  
  // Extract referrer (if not already found from two-name rule)
  if (!result.referrer) {
    result.referrer = extractReferrer(cleanedText, '')
  }
  
  // Calculate confidence based on extracted fields
  let confidenceScore = 0.0
  let maxScore = 0.0
  
  if (result.name) {
    maxScore += 1.0
    confidenceScore += 1.0
  }
  if (result.bloodGroup) {
    maxScore += 1.0
    confidenceScore += 1.0
  }
  if (result.phone) {
    maxScore += 1.0
    confidenceScore += 1.0
  }
  if (result.date) {
    maxScore += 1.0
    confidenceScore += 1.0
  }
  if (result.batch && result.batch !== 'Unknown') {
    maxScore += 0.5
    confidenceScore += 0.5
  }
  
  result.confidence = maxScore > 0 ? confidenceScore / maxScore : 0.0
  
  return result
}

/**
 * Parse bulk text with multiple donor entries
 * Data is mostly line-by-line (one piece of info per line)
 */
export function parseBulkWithCustomModel(text: string): ParsingResult[] {
  // Split by double newlines (blank lines) to separate multiple donor entries
  const entries: string[] = []
  
  // Try splitting by double newlines first (multiple entries separated by blank lines)
  const doubleNewlineSplit = text.split(/\n\s*\n/)
  if (doubleNewlineSplit.length > 1) {
    // Multiple entries found
    entries.push(...doubleNewlineSplit.filter(e => e.trim().length > 0))
  } else {
    // Single entry - treat the entire text as one donor entry
    // Since data is line-by-line, we process the whole block together
    entries.push(text.trim())
  }
  
  // Parse each entry (each entry is a full block of line-by-line data)
  const results: ParsingResult[] = []
  for (const entry of entries) {
    if (entry.trim()) {
      console.log(`📦 Processing entry block (${entry.split('\n').length} lines):`, entry.substring(0, 100) + '...')
      const parsed = parseWithCustomModel(entry)
      console.log(`📝 Parsed entry: name="${parsed.name}", bloodGroup="${parsed.bloodGroup}", referrer="${parsed.referrer}"`)
      // Only add if we have at least name and blood group
      if (parsed.name && parsed.bloodGroup) {
        results.push(parsed)
      } else {
        console.warn(`⚠️ Entry rejected: missing name or blood group (name="${parsed.name}", bloodGroup="${parsed.bloodGroup}")`)
      }
    }
  }
  
  return results
}

