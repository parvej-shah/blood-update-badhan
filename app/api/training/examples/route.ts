import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireModerator } from '@/lib/auth'
import { parseWithCustomModel } from '@/lib/custom-parser'
import { ParsedDonorData } from '@/lib/parser'

export async function GET(request: NextRequest) {
  try {
    // Check moderator/admin status
    await requireModerator()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const [examples, total] = await Promise.all([
      prisma.parsingExample.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.parsingExample.count(),
    ])

    return NextResponse.json({
      examples,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Error fetching training examples:', error)
    return NextResponse.json(
      { error: 'Failed to fetch training examples' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check moderator/admin status
    await requireModerator()

    const body = await request.json()
    const { rawText, expectedOutput } = body

    if (!rawText || !expectedOutput) {
      return NextResponse.json(
        { error: 'rawText and expectedOutput are required' },
        { status: 400 }
      )
    }

    // Parse the text to get actual output
    const parsedOutput = parseWithCustomModel(rawText)
    
    // Calculate confidence (compare parsed vs expected)
    let matches = 0
    let totalFields = 0
    const fields: (keyof ParsedDonorData)[] = ['name', 'bloodGroup', 'phone', 'date', 'batch', 'referrer', 'hallName']
    
    for (const field of fields) {
      totalFields++
      const parsed = String(parsedOutput[field] || '').trim()
      const expected = String(expectedOutput[field] || '').trim()
      if (parsed && expected && parsed.toLowerCase() === expected.toLowerCase()) {
        matches++
      }
    }
    
    const confidence = totalFields > 0 ? matches / totalFields : 0
    const isCorrect = confidence > 0.7 // Consider correct if > 70% match

    const example = await prisma.parsingExample.create({
      data: {
        rawText,
        expectedOutput: expectedOutput as any,
        parsedOutput: parsedOutput as any,
        confidence,
        isCorrect,
      },
    })

    return NextResponse.json(example, { status: 201 })
  } catch (error: any) {
    console.error('Error creating training example:', error)
    return NextResponse.json(
      { error: 'Failed to create training example' },
      { status: 500 }
    )
  }
}

