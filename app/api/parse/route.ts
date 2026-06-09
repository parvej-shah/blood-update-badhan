import { NextRequest, NextResponse } from 'next/server'
import { parseWithGemini } from '@/lib/gemini-parser'
import { parseBulkFormattedText, parseFixedFormatBlocks, isFixedBlockFormat } from '@/lib/parser'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, useAI = true } = body

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'text is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    const trimmedText = text.trim()

    // 1. Attempt Gemini AI parsing (skipped if useAI is false)
    const aiDonors = useAI ? await parseWithGemini(trimmedText) : null

    if (aiDonors && aiDonors.length > 0) {
      return NextResponse.json({ donors: aiDonors, usedAI: true })
    }

    // 2. Try fixed-format block parser
    if (isFixedBlockFormat(trimmedText)) {
      const fixedDonors = parseFixedFormatBlocks(trimmedText)
      if (fixedDonors.length > 0) {
        console.log(`[api/parse] Fixed-format parser: ${fixedDonors.length} donor(s)`)
        return NextResponse.json({ donors: fixedDonors, usedAI: false })
      }
    }

    // 3. Fall back to regex parser
    console.log('[api/parse] Falling back to regex parser')
    const regexDonors = await parseBulkFormattedText(trimmedText)

    if (!regexDonors || regexDonors.length === 0) {
      return NextResponse.json(
        { error: 'Could not parse any donor records from the provided text.' },
        { status: 422 }
      )
    }

    return NextResponse.json({ donors: regexDonors, usedAI: false })

  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('[api/parse] Unexpected error:', error)
    return NextResponse.json(
      { error: err.message || 'Internal server error during parsing' },
      { status: 500 }
    )
  }
}
