import { NextRequest, NextResponse } from 'next/server'
import { requireModerator } from '@/lib/auth'
import { learnPatterns } from '@/lib/pattern-learner'

export async function POST(request: NextRequest) {
  try {
    await requireModerator()

    const result = await learnPatterns()

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('Error learning patterns:', error)
    return NextResponse.json(
      { error: 'Failed to learn patterns', details: error.message },
      { status: 500 }
    )
  }
}

