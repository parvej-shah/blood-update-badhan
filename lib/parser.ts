import { normalizeBloodGroup } from './validation'

export interface ParsedDonorData {
  name: string
  bloodGroup: string
  batch: string
  hospital: string
  phone: string
  date: string
  referrer: string
  hallName: string
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
  extracted.hospital = extracted.hospital || 'Unknown'
  extracted.referrer = extracted.referrer || ''
  extracted.hallName = extracted.hallName || ''

  return {
    name: extracted.name || '',
    bloodGroup: extracted.bloodGroup || '',
    batch: extracted.batch || 'Unknown',
    hospital: extracted.hospital || 'Unknown',
    phone: extracted.phone || '',
    date: extracted.date || '',
    referrer: extracted.referrer || '',
    hallName: extracted.hallName || '',
  }
}

// Parse bulk text with multiple donor entries
// Entries are separated by double newlines or lines starting with "Donor Name:"
export function parseBulkFormattedText(text: string): ParsedDonorData[] {
  // Split by double newlines or lines that start with "Donor Name:" (new entry)
  const entries: string[] = []
  
  // First, try splitting by double newlines
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
  
  // Parse each entry
  const parsedEntries: ParsedDonorData[] = []
  for (const entry of entries) {
    if (entry.trim()) {
      try {
        const parsed = parseFormattedText(entry)
        // Only add if it has at least name and blood group
        if (parsed.name && parsed.bloodGroup) {
          parsedEntries.push(parsed)
        }
      } catch (error) {
        // Skip invalid entries
        console.warn('Failed to parse entry:', error)
      }
    }
  }
  
  return parsedEntries
}

