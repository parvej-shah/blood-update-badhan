import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdminFromHeader } from '@/lib/auth'
import { parseWithCustomModel } from '@/lib/custom-parser'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdminFromHeader(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const example = await prisma.parsingExample.findUnique({
      where: { id },
    })

    if (!example) {
      return NextResponse.json({ error: 'Example not found' }, { status: 404 })
    }

    return NextResponse.json(example)
  } catch (error: any) {
    console.error('Error fetching training example:', error)
    return NextResponse.json(
      { error: 'Failed to fetch training example' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdminFromHeader(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { rawText, expectedOutput } = body

    // Re-parse if rawText changed
    let parsedOutput = undefined
    let confidence = undefined
    let isCorrect = undefined

    if (rawText) {
      parsedOutput = parseWithCustomModel(rawText)
      
      if (expectedOutput) {
        let matches = 0
        let totalFields = 0
        const fields = ['name', 'bloodGroup', 'phone', 'date', 'batch', 'hospital', 'referrer', 'hallName']
        
        for (const field of fields) {
          totalFields++
          const parsed = String(parsedOutput[field as keyof typeof parsedOutput] || '').trim()
          const expected = String(expectedOutput[field] || '').trim()
          if (parsed && expected && parsed.toLowerCase() === expected.toLowerCase()) {
            matches++
          }
        }
        
        confidence = totalFields > 0 ? matches / totalFields : 0
        isCorrect = confidence > 0.7
      }
    }

    const example = await prisma.parsingExample.update({
      where: { id },
      data: {
        ...(rawText && { rawText }),
        ...(expectedOutput && { expectedOutput: expectedOutput as any }),
        ...(parsedOutput && { parsedOutput: parsedOutput as any }),
        ...(confidence !== undefined && { confidence }),
        ...(isCorrect !== undefined && { isCorrect }),
      },
    })

    return NextResponse.json(example)
  } catch (error: any) {
    console.error('Error updating training example:', error)
    return NextResponse.json(
      { error: 'Failed to update training example' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdminFromHeader(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await prisma.parsingExample.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting training example:', error)
    return NextResponse.json(
      { error: 'Failed to delete training example' },
      { status: 500 }
    )
  }
}

