import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdminFromHeader } from '@/lib/auth'

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
    const { reviewedByAdmin } = body

    const feedback = await prisma.userFeedback.update({
      where: { id },
      data: {
        reviewedByAdmin: reviewedByAdmin !== undefined ? reviewedByAdmin : true,
      },
    })

    return NextResponse.json(feedback)
  } catch (error: unknown) {
    console.error('Error updating feedback:', error)
    return NextResponse.json(
      { error: 'Failed to update feedback' },
      { status: 500 }
    )
  }
}

