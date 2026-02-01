import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireModerator } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await requireModerator()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit
    const field = searchParams.get('field')
    const patternType = searchParams.get('patternType')

    const where: any = {}
    if (field) where.field = field
    if (patternType) where.patternType = patternType

    const [patterns, total] = await Promise.all([
      prisma.parsingPattern.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { successRate: 'desc' },
          { usageCount: 'desc' },
        ],
      }),
      prisma.parsingPattern.count({ where }),
    ])

    return NextResponse.json({
      patterns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Error fetching patterns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch patterns' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireModerator()

    const body = await request.json()
    const { patternType, pattern, field, confidence, usageCount, successRate, isEnabled } = body

    if (!patternType || !pattern || !field) {
      return NextResponse.json(
        { error: 'patternType, pattern, and field are required' },
        { status: 400 }
      )
    }

    const patternRecord = await prisma.parsingPattern.create({
      data: {
        patternType,
        pattern,
        field,
        confidence: confidence || 0.5,
        usageCount: usageCount || 0,
        successRate: successRate || 0.0,
        isEnabled: isEnabled !== undefined ? isEnabled : true,
      },
    })

    return NextResponse.json(patternRecord, { status: 201 })
  } catch (error: any) {
    console.error('Error creating pattern:', error)
    return NextResponse.json(
      { error: 'Failed to create pattern' },
      { status: 500 }
    )
  }
}

