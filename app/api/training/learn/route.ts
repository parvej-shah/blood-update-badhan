import { NextRequest, NextResponse } from 'next/server'
import { isAdminFromHeader } from '@/lib/auth'
import { learnPatterns } from '@/lib/pattern-learner'

export async function POST(request: NextRequest) {
  try {
    if (!isAdminFromHeader(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

