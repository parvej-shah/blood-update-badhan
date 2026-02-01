import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireModerator } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireModerator()

    const { id } = await params
    const body = await request.json()
    const { confidence, isEnabled, successRate, usageCount } = body

    const pattern = await prisma.parsingPattern.update({
      where: { id },
      data: {
        ...(confidence !== undefined && { confidence }),
        ...(isEnabled !== undefined && { isEnabled }),
        ...(successRate !== undefined && { successRate }),
        ...(usageCount !== undefined && { usageCount }),
      },
    })

    return NextResponse.json(pattern)
  } catch (error: any) {
    console.error('Error updating pattern:', error)
    return NextResponse.json(
      { error: 'Failed to update pattern' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireModerator()

    const { id } = await params
    await prisma.parsingPattern.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting pattern:', error)
    return NextResponse.json(
      { error: 'Failed to delete pattern' },
      { status: 500 }
    )
  }
}

