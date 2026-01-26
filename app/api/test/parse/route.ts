import { NextRequest, NextResponse } from 'next/server'
import { parseBulkFormattedText } from '@/lib/parser'

/**
 * Test endpoint for parsing (uses custom parser)
 * POST /api/test/parse
 * Body: { text: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    console.log('🧪 Testing parsing with text:', text.substring(0, 100) + '...')
    
    const parsed = await parseBulkFormattedText(text)
    
    return NextResponse.json({
      success: true,
      count: parsed.length,
      donors: parsed,
    })
  } catch (error: any) {
    console.error('❌ Parsing test error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to parse text',
        details: error.stack 
      },
      { status: 500 }
    )
  }
}

