import { prisma } from './db'
import { ParsedDonorData } from './parser'

export interface Pattern {
  patternType: 'regex' | 'positional' | 'keyword'
  pattern: string
  field: string
  confidence: number
  usageCount: number
  successRate: number
}

/**
 * Extract regex patterns from training examples
 */
function extractRegexPatterns(examples: Array<{ rawText: string; expectedOutput: ParsedDonorData }>): Pattern[] {
  const patterns: Pattern[] = []
  
  // Blood group patterns
  const bloodGroupPatterns = [
    { regex: /\b([ABO]+|AB)[\s]*[\(]*[\s]*[+-]?[ve]*[\)]*[\s]*[+-]?[ve]*/gi, field: 'bloodGroup' },
    { regex: /\b([ABO]+|AB)[\s]*[+-]/gi, field: 'bloodGroup' },
    { regex: /\b([ABO]+|AB)[\s]*\([+-]?ve\)/gi, field: 'bloodGroup' },
  ]
  
  // Phone patterns
  const phonePatterns = [
    { regex: /\+?880?1[3-9]\d{8,9}/g, field: 'phone' },
    { regex: /01[3-9]\d{8,9}/g, field: 'phone' },
  ]
  
  // Date patterns
  const datePatterns = [
    { regex: /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/g, field: 'date' },
  ]
  
  // Batch patterns
  const batchPatterns = [
    { regex: /(Math|Physics|Chemistry|Botany|Pharmacy|Microbiology|Applied\s+math|A\.math|Phy|Ocn|SWE|Swe|IIT|PHR)[\s]*\(?(\d{2,4}[\s-]?\d{2,4})\)?/gi, field: 'batch' },
    { regex: /(\d{2,4}[\s-]\d{2,4})/g, field: 'batch' },
  ]
  
  // Hall patterns
  const hallPatterns = [
    { regex: /(Amar\s+Ekushey\s+Hall|A\.E\.?\s+Hall|AEH|AE\s+hall|AE\b)/gi, field: 'hallName' },
    { regex: /(Jagannath\s+hall|Jn\s+hall|JnU)/gi, field: 'hallName' },
    { regex: /\b([A-Za-z\s]+hall)\b/gi, field: 'hallName' },
  ]
  
  // Referrer patterns
  const referrerPatterns = [
    { regex: /Managed\s+by\s*:?\s*([A-Za-z\s]+(?:\([^)]+\))?)/gi, field: 'referrer' },
  ]
  
  const allPatterns = [
    ...bloodGroupPatterns,
    ...phonePatterns,
    ...datePatterns,
    ...batchPatterns,
    ...hallPatterns,
    ...referrerPatterns,
  ]
  
  // Calculate success rate for each pattern
  for (const { regex, field } of allPatterns) {
    let matches = 0
    let correctMatches = 0
    
    for (const example of examples) {
      const textMatches = example.rawText.match(regex)
      if (textMatches && textMatches.length > 0) {
        matches++
        const expectedValue = example.expectedOutput[field as keyof ParsedDonorData]
        if (expectedValue && String(expectedValue).trim().length > 0) {
          correctMatches++
        }
      }
    }
    
    if (matches > 0) {
      const successRate = correctMatches / matches
      patterns.push({
        patternType: 'regex',
        pattern: regex.source,
        field,
        confidence: successRate,
        usageCount: matches,
        successRate,
      })
    }
  }
  
  return patterns
}

/**
 * Extract positional patterns from training examples
 */
function extractPositionalPatterns(examples: Array<{ rawText: string; expectedOutput: ParsedDonorData }>): Pattern[] {
  const patterns: Pattern[] = []
  
  // Two-name rule pattern
  let twoNameMatches = 0
  let twoNameCorrect = 0
  
  for (const example of examples) {
    const lines = example.rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    if (lines.length >= 2) {
      const firstLine = lines[0]
      const secondLine = lines[1]
      
      // Check if first two lines are names
      const isNamePattern = (str: string) => {
        if (/^\+?880?1[3-9]\d{8,9}$/.test(str.replace(/[\s-]/g, ''))) return false
        if (/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/.test(str)) return false
        if (/^[ABO]+[+-]?[()]*[ve]*$/i.test(str)) return false
        return /^[A-Za-z\u0080-\uFFFF\s\.]{2,50}$/.test(str)
      }
      
      if (isNamePattern(firstLine) && isNamePattern(secondLine)) {
        twoNameMatches++
        // Check if expected output has referrer and donor name matching
        if (example.expectedOutput.referrer && 
            example.expectedOutput.name &&
            (firstLine.includes(example.expectedOutput.referrer) || 
             example.expectedOutput.referrer.includes(firstLine)) &&
            (secondLine.includes(example.expectedOutput.name) ||
             example.expectedOutput.name.includes(secondLine))) {
          twoNameCorrect++
        }
      }
    }
  }
  
  if (twoNameMatches > 0) {
    const successRate = twoNameCorrect / twoNameMatches
    patterns.push({
      patternType: 'positional',
      pattern: 'first_line_referrer_second_line_donor',
      field: 'name',
      confidence: successRate,
      usageCount: twoNameMatches,
      successRate,
    })
  }
  
  return patterns
}

/**
 * Extract keyword-based patterns from training examples
 */
function extractKeywordPatterns(examples: Array<{ rawText: string; expectedOutput: ParsedDonorData }>): Pattern[] {
  const patterns: Pattern[] = []
  
  // Keyword patterns for various fields
  const keywordMappings: Array<{ keyword: string; field: string }> = [
    { keyword: 'Blood Group:', field: 'bloodGroup' },
    { keyword: 'Phone:', field: 'phone' },
    { keyword: 'Mobile:', field: 'phone' },
    { keyword: 'Date:', field: 'date' },
    { keyword: 'Batch:', field: 'batch' },
    { keyword: 'Referrer:', field: 'referrer' },
    { keyword: 'Hall Name:', field: 'hallName' },
    { keyword: 'Managed by', field: 'referrer' },
  ]
  
  for (const { keyword, field } of keywordMappings) {
    let matches = 0
    let correctMatches = 0
    
    for (const example of examples) {
      if (example.rawText.toLowerCase().includes(keyword.toLowerCase())) {
        matches++
        const expectedValue = example.expectedOutput[field as keyof ParsedDonorData]
        if (expectedValue && String(expectedValue).trim().length > 0) {
          correctMatches++
        }
      }
    }
    
    if (matches > 0) {
      const successRate = correctMatches / matches
      patterns.push({
        patternType: 'keyword',
        pattern: keyword,
        field,
        confidence: successRate,
        usageCount: matches,
        successRate,
      })
    }
  }
  
  return patterns
}

/**
 * Learn patterns from all training examples
 */
export async function learnPatterns(): Promise<{
  patternsLearned: number
  statistics: {
    totalExamples: number
    regexPatterns: number
    positionalPatterns: number
    keywordPatterns: number
    averageConfidence: number
  }
}> {
  // Fetch all training examples
  const examples = await prisma.parsingExample.findMany({
    where: {
      isCorrect: true, // Only use correct examples
    },
  })
  
  if (examples.length === 0) {
    return {
      patternsLearned: 0,
      statistics: {
        totalExamples: 0,
        regexPatterns: 0,
        positionalPatterns: 0,
        keywordPatterns: 0,
        averageConfidence: 0,
      },
    }
  }
  
  // Parse expected output
  const parsedExamples = examples.map(ex => ({
    rawText: ex.rawText,
    expectedOutput: ex.expectedOutput as unknown as ParsedDonorData,
  }))
  
  // Extract patterns
  const regexPatterns = extractRegexPatterns(parsedExamples)
  const positionalPatterns = extractPositionalPatterns(parsedExamples)
  const keywordPatterns = extractKeywordPatterns(parsedExamples)
  
  // Combine all patterns
  const allPatterns = [...regexPatterns, ...positionalPatterns, ...keywordPatterns]
  
  // Store patterns in database (upsert)
  let patternsStored = 0
  for (const pattern of allPatterns) {
    // Check if pattern already exists
    const existing = await prisma.parsingPattern.findFirst({
      where: {
        patternType: pattern.patternType,
        pattern: pattern.pattern,
        field: pattern.field,
      },
    })
    
    if (existing) {
      // Update existing pattern
      await prisma.parsingPattern.update({
        where: { id: existing.id },
        data: {
          confidence: pattern.confidence,
          usageCount: pattern.usageCount,
          successRate: pattern.successRate,
          isEnabled: pattern.successRate > 0.3, // Disable patterns with < 30% success rate
        },
      })
    } else {
      // Create new pattern
      await prisma.parsingPattern.create({
        data: {
          patternType: pattern.patternType,
          pattern: pattern.pattern,
          field: pattern.field,
          confidence: pattern.confidence,
          usageCount: pattern.usageCount,
          successRate: pattern.successRate,
          isEnabled: pattern.successRate > 0.3,
        },
      })
    }
    patternsStored++
  }
  
  // Calculate statistics
  const totalConfidence = allPatterns.reduce((sum, p) => sum + p.confidence, 0)
  const averageConfidence = allPatterns.length > 0 ? totalConfidence / allPatterns.length : 0
  
  return {
    patternsLearned: patternsStored,
    statistics: {
      totalExamples: examples.length,
      regexPatterns: regexPatterns.length,
      positionalPatterns: positionalPatterns.length,
      keywordPatterns: keywordPatterns.length,
      averageConfidence,
    },
  }
}

/**
 * Get learned patterns from database
 */
export async function getLearnedPatterns(field?: string): Promise<Pattern[]> {
  const patterns = await prisma.parsingPattern.findMany({
    where: {
      isEnabled: true,
      ...(field && { field }),
    },
    orderBy: [
      { successRate: 'desc' },
      { usageCount: 'desc' },
    ],
  })
  
  return patterns.map(p => ({
    patternType: p.patternType as 'regex' | 'positional' | 'keyword',
    pattern: p.pattern,
    field: p.field,
    confidence: p.confidence,
    usageCount: p.usageCount,
    successRate: p.successRate,
  }))
}

