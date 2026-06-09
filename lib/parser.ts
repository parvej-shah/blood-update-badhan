import { normalizeBloodGroup, normalizePhone, normalizeDate } from './validation'
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

// ─── Fixed-format block parser ────────────────────────────────────────────────
// Handles blocks separated by blank lines where the structure is:
//   Line 1: Referrer name
//   Line 2: Donor name
//   Line 3: Blood group (or "Platelet" → skip block)
//   Line 4+: dept/batch, hall name, date, phone — any order

const VALID_BLOOD_GROUPS = new Set(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])

const HALL_MAP: Record<string, string> = {
  'AEH': 'AE Hall', 'AE': 'AE Hall', 'A.E': 'AE Hall', 'A.E HALL': 'AE Hall', 'AE HALL': 'AE Hall',
  'FH': 'FH Hall', 'FH HALL': 'FH Hall',
  'SH': 'SH Hall', 'SH HALL': 'SH Hall',
  'SK': 'SK Hall', 'SK HALL': 'SK Hall',
  'MOHSIN': 'Mohsin Hall', 'MOHSIN HALL': 'Mohsin Hall',
  'JAGANNATH': 'Jagannath Hall', 'JAGANNATH HALL': 'Jagannath Hall', 'JNU': 'Jagannath Hall',
  '21': '21 Hall', '21 HALL': '21 Hall',
  'SURJASEN': 'Surjasen Hall', 'SURJASEN HALL': 'Surjasen Hall',
  'PG': 'PG Hall', 'PG HALL': 'PG Hall',
}

const DEPT_KEYWORDS = /\b(IIT|Math|Mathematics|MTH|Chemistry|SWE|INFS|Fisheries|Applied\s*math|AMATH|Phy|Physics|Ocn|NE|ACCE|EEE|GEB|Botany|Microbiology|Zoology|Statistics|CSE|EECE|BUET|DU|RU|CU|JU|SUST|KUET|RUET|CUET)\b/i

// Academic year range: both sides must be plausible 2-digit years (19-30) or 4-digit years
const BATCH_YEAR_RE = /\b(?:20)?([1-2]\d)[-_/](?:20)?([1-2]\d)\b/

// Matches digits-only phone sequences (after stripping country code / formatting)
const PHONE_DIGITS_RE = /[\d\s\-+()]{7,}/

const DATE_RE = /\b\d{1,2}[\/\-._]\d{1,2}[\/\-._]\d{2,4}\b/

// Must look like a blood group before we try to normalize:
// Handles: A+, B-, AB+, O+, B(+ve), O(+ve), B(+)ve, O(+)ve, AB(+ve), O(+), B(-ve)
const BLOOD_GROUP_SHAPE_RE = /^(?:AB?|O|B)\s*(?:[\(\[]\s*[+\-](?:ve|VE|positive|negative)?\s*[\)\]](?:ve|VE)?|[\(\[]\s*[+\-]\s*[\)\]]|[+\-](?:ve|VE|positive|negative)?)(?:\s+\d+\s*(?:ml|unit))?$|^(?:AB?|O|B)[+\-]$/i

function tryNormalizeBloodGroup(line: string): string | null {
  const cleaned = line.replace(/\s*\d+\s*ml\b/gi, '').replace(/\s*\d+\s*unit\b/gi, '').trim()
  if (!BLOOD_GROUP_SHAPE_RE.test(cleaned)) return null
  const norm = normalizeBloodGroup(cleaned)
  return VALID_BLOOD_GROUPS.has(norm) ? norm : null
}

function tryHallName(line: string): string | null {
  const upper = line.trim().toUpperCase().replace(/\s*HALL\s*$/, '').trim()
  return HALL_MAP[upper] ?? HALL_MAP[upper.replace(/\s/g, '')] ?? null
}

function tryBatch(line: string): string | null {
  const hasDept = DEPT_KEYWORDS.test(line)
  const hasYear = BATCH_YEAR_RE.test(line)
  if (hasDept || hasYear) {
    return line.trim().replace(/[_/]/g, '-').replace(/\s+/g, ' ')
  }
  return null
}

function tryPhone(line: string): string | null {
  // Strip formatting chars so dashes/spaces don't break the match
  const digitsOnly = line.replace(/[\s\-()]/g, '')
  // Must contain a Bangladesh number pattern after stripping
  const m = digitsOnly.match(/(\+?880)?01[3-9]\d{8}/)
  if (!m) return null
  const normalized = normalizePhone(m[0])
  return /^01[3-9]\d{8}$/.test(normalized) ? normalized : null
}

const MONTH_NAMES: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
}

function tryDate(line: string): string | null {
  const trimmed = line.trim()
  // Reject year-range patterns like "22-23", "2024-2025"
  if (/^\d{2}-\d{2}$/.test(trimmed) || /^\d{4}-\d{4}$/.test(trimmed)) return null

  // Handle written month names: "17 May 2026", "17 May 26", "May 17 2026"
  const monthNameMatch = trimmed.match(/\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{2,4})\b/i)
    ?? trimmed.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{1,2})[,\s]+(\d{2,4})\b/i)
  if (monthNameMatch) {
    let day: string, month: string, year: string
    if (/^\d/.test(monthNameMatch[1])) {
      // "17 May 2026"
      day = monthNameMatch[1].padStart(2, '0')
      month = MONTH_NAMES[monthNameMatch[2].slice(0, 3).toLowerCase()]
      year = monthNameMatch[3]
    } else {
      // "May 17 2026"
      month = MONTH_NAMES[monthNameMatch[1].slice(0, 3).toLowerCase()]
      day = monthNameMatch[2].padStart(2, '0')
      year = monthNameMatch[3]
    }
    let y = parseInt(year)
    if (y < 100) y += 2000
    if (y < 2020) return null
    return `${day}-${month}-${y}`
  }

  const m = trimmed.match(DATE_RE)
  if (!m) return null
  // Normalize underscore separator to dash before passing to normalizeDate
  const dateStr = m[0].replace(/_/g, '-')
  const normalized = normalizeDate(dateStr)
  const yearMatch = normalized.match(/\d{4}$/)
  if (!yearMatch || parseInt(yearMatch[0]) < 2020) return null
  return normalized
}

function isPhoneLine(line: string): boolean {
  const stripped = line.replace(/[\s\-()]/g, '')
  return /(\+?880)?01[3-9]\d{8}/.test(stripped) && !/[a-zA-Z]/.test(line)
}

function parseFixedBlock(lines: string[]): ParsedDonorData | null {
  if (lines.length < 3) return null

  const referrer = lines[0].trim()

  // Donor name is line[1], unless line[1] is a phone/BG/date — then scan forward
  let donorNameIndex = 1
  if (isPhoneLine(lines[1].trim()) || tryNormalizeBloodGroup(lines[1].trim()) || tryDate(lines[1].trim())) {
    donorNameIndex = -1
    for (let i = 2; i < lines.length; i++) {
      const l = lines[i].trim()
      if (!isPhoneLine(l) && !tryNormalizeBloodGroup(l) && !tryDate(l) && !tryHallName(l) && !tryBatch(l)) {
        donorNameIndex = i; break
      }
    }
    if (donorNameIndex === -1) return null
  }

  let donorName = lines[donorNameIndex].trim()
  if (!donorName) return null

  // Strip trailing parenthetical batch/dept from donor name line: "Rafid vai (IIT)" → name="Rafid vai", batch="IIT"
  let inlineBG = ''
  let inlineBatch = ''
  const nameBatchMatch = donorName.match(/^(.+?)\s*[\(\[](.*?)[\)\]]\s*$/)
  if (nameBatchMatch) {
    const inside = nameBatchMatch[2].trim()
    const batchFromName = tryBatch(inside)
    if (batchFromName) {
      donorName = nameBatchMatch[1].trim()
      inlineBatch = batchFromName
    }
  }

  // Handle blood group embedded in donor name line, with optional trailing batch token:
  //   "Saiful A+ 7th"      → name="Saiful",  BG=A+, batch="7th"
  //   "Minhaz O+(24-25)"   → name="Minhaz",  BG=O+, batch="24-25"
  //   "Rafid vai, O+"      → name="Rafid vai", BG=O+
  //   "Fahim o+"           → name="Fahim",    BG=O+
  const bgTokenMatch = donorName.match(/^(.+?)[\s,]+((?:AB?|O|B)\s*[\(\[]?\s*[+\-][\w\(\)\[\]]*?)\s*(?:[\(\[]?([\w\-\/]+)[\)\]]?)?\s*$/i)
  if (bgTokenMatch) {
    const bgRaw = bgTokenMatch[2].trim()
    const trailingToken = bgTokenMatch[3]?.trim() || ''
    // Strip parenthetical batch year fused onto BG token like "O+(24-25)"
    const fusedBatch = bgRaw.match(/^(.+?)\s*[\(\[]([\d]{2}[-_/][\d]{2})[\)\]]$/)
    const bgClean = fusedBatch ? fusedBatch[1].trim() : bgRaw
    const norm = tryNormalizeBloodGroup(bgClean)
    if (norm) {
      donorName = bgTokenMatch[1].trim().replace(/,\s*$/, '')
      inlineBG = norm
      // Prefer the fused batch year; fall back to trailing token if it looks like a batch
      if (fusedBatch) {
        inlineBatch = fusedBatch[2].replace(/_/g, '-')
      } else if (trailingToken && tryBatch(trailingToken)) {
        inlineBatch = tryBatch(trailingToken)!
      }
    }
  }

  // Scan all lines from index 1 except donorNameIndex for blood group
  let bloodGroup = ''
  let bgLineIndex = -1
  for (let i = 1; i < lines.length; i++) {
    if (i === donorNameIndex) continue
    const l = lines[i].trim()
    if (/^platelet$/i.test(l)) return null
    const bg = tryNormalizeBloodGroup(l)
    if (bg) { bloodGroup = bg; bgLineIndex = i; break }
  }
  if (!bloodGroup && inlineBG) bloodGroup = inlineBG
  if (!bloodGroup) return null

  let phone = ''
  let date = ''
  let batch = ''
  let hallName = ''

  for (let i = 1; i < lines.length; i++) {
    if (i === donorNameIndex) continue
    if (i === bgLineIndex) continue
    const line = lines[i].trim()
    if (!line) continue

    if (!hallName) {
      const h = tryHallName(line)
      if (h) { hallName = h; continue }
    }
    if (!phone) {
      const p = tryPhone(line)
      if (p) { phone = p; continue }
    }
    if (!date) {
      const d = tryDate(line)
      if (d) { date = d; continue }
    }
    if (!batch) {
      const b = tryBatch(line)
      if (b) { batch = b; continue }
    }
  }

  return { name: donorName, bloodGroup, phone, date, batch: batch || inlineBatch || 'Unknown', referrer, hallName }
}

export function parseFixedFormatBlocks(text: string): ParsedDonorData[] {
  const blocks = text.split(/\n\s*\n/).map(b => b.trim()).filter(b => b.length > 0)
  const results: ParsedDonorData[] = []
  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    const donor = parseFixedBlock(lines)
    if (donor) results.push(donor)
  }
  return results
}

export function isFixedBlockFormat(text: string): boolean {
  // Check if any block contains a recognizable blood group (standalone or inline)
  const blocks = text.split(/\n\s*\n/).filter(b => b.trim().length > 0)
  if (blocks.length < 1) return false
  // Check across all blocks (use first 3 blocks max for speed)
  for (const block of blocks.slice(0, 3)) {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    if (lines.length < 2) continue
    for (const line of lines.slice(0, 7)) {
      // Standalone blood group
      if (tryNormalizeBloodGroup(line) !== null || /^platelet$/i.test(line)) return true
      // Inline blood group appended to a name: "Fahim o+" or "Rosul vai, O+"
      const inlineMatch = line.match(/[\s,]+((?:ab?|o|b)\s*[\(\[]?\s*[+\-][\w\(\)\[\]]*)\s*$/i)
      if (inlineMatch && tryNormalizeBloodGroup(inlineMatch[1].trim()) !== null) return true
    }
  }
  return false
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

