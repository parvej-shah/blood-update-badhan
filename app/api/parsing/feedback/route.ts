import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { Prisma } from '@/lib/generated/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rawText, parsedOutput, isCorrect, comment, userId } = body

    if (!rawText || !parsedOutput || typeof isCorrect !== 'boolean') {
      return NextResponse.json(
        { error: 'rawText, parsedOutput, and isCorrect are required' },
        { status: 400 }
      )
    }

    const feedback = await prisma.userFeedback.create({
      data: {
        rawText,
        parsedOutput: parsedOutput as Prisma.InputJsonValue,
        isCorrect,
        comment: comment || null,
        userId: userId || null,
        reviewedByAdmin: false,
      },
    })

    return NextResponse.json(feedback, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating feedback:', error)
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit
    const reviewed = searchParams.get('reviewed')

    const where: Prisma.UserFeedbackWhereInput = {}
    if (reviewed === 'false') {
      where.reviewedByAdmin = false
    } else if (reviewed === 'true') {
      where.reviewedByAdmin = true
    }

    const [feedbacks, total] = await Promise.all([
      prisma.userFeedback.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.userFeedback.count({ where }),
    ])

    return NextResponse.json({
      feedbacks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: unknown) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    )
  }
}

