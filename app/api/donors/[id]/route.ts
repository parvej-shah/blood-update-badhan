import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validateDonor, normalizePhone, normalizeDate, normalizeReferrer } from '@/lib/validation'
import { isAdminFromHeader } from '@/lib/auth'

// Check admin status from request header
function checkAdmin(request: NextRequest): boolean {
  return isAdminFromHeader(request)
}

// GET single donor by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const donor = await prisma.donor.findUnique({
      where: { id },
    })

    if (!donor) {
      return NextResponse.json(
        { error: 'Donor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ donor })
  } catch (error) {
    console.error('Error fetching donor:', error)
    return NextResponse.json(
      { error: 'Failed to fetch donor' },
      { status: 500 }
    )
  }
}

// PUT/PATCH - Update donor
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin status
    if (!checkAdmin(request)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Validate the input
    const validation = validateDonor(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const data = validation.data!

    // Normalize phone, date, and referrer
    const normalizedPhone = normalizePhone(data.phone)
    const normalizedDate = normalizeDate(data.date)
    const normalizedReferrer = normalizeReferrer(data.referrer)

    // Ensure bloodGroup is a string
    const bloodGroup = typeof data.bloodGroup === 'string' ? data.bloodGroup : String(data.bloodGroup)

    // Check if donor exists
    const existingDonor = await prisma.donor.findUnique({
      where: { id },
    })

    if (!existingDonor) {
      return NextResponse.json(
        { error: 'Donor not found' },
        { status: 404 }
      )
    }

    // Check for duplicate (excluding current donor)
    const duplicateDonor = await prisma.donor.findFirst({
      where: {
        phone: normalizedPhone,
        date: normalizedDate,
        name: {
          equals: data.name.trim(),
          mode: 'insensitive',
        },
        NOT: {
          id: id, // Exclude current donor
        },
      },
    })

    if (duplicateDonor) {
      return NextResponse.json(
        {
          error: `Duplicate entry detected. A donor with phone ${normalizedPhone}, name "${data.name}", and date ${normalizedDate} already exists.`,
          code: 'DUPLICATE_ENTRY',
        },
        { status: 409 }
      )
    }

    // Prepare data for update
    const donorData = {
      name: (data.name || '').trim(),
      bloodGroup: bloodGroup,
      batch: (data.batch && data.batch.trim()) ? data.batch.trim() : 'Unknown',
      phone: normalizedPhone,
      date: normalizedDate,
      referrer: normalizedReferrer,
      hallName: (data.hallName && data.hallName.trim()) ? data.hallName.trim() : null,
    }

    // Validate required fields
    if (!donorData.name || donorData.name.length === 0) {
      return NextResponse.json(
        { error: 'Name is required and cannot be empty' },
        { status: 400 }
      )
    }
    if (!donorData.phone || donorData.phone.length === 0) {
      return NextResponse.json(
        { error: 'Phone is required and cannot be empty' },
        { status: 400 }
      )
    }
    if (!donorData.date || donorData.date.length === 0) {
      return NextResponse.json(
        { error: 'Date is required and cannot be empty' },
        { status: 400 }
      )
    }
    if (!donorData.bloodGroup || donorData.bloodGroup.length === 0) {
      return NextResponse.json(
        { error: 'Blood group is required and cannot be empty' },
        { status: 400 }
      )
    }

    // Update donor
    const updatedDonor = await prisma.donor.update({
      where: { id },
      data: donorData,
    })

    return NextResponse.json({ success: true, donor: updatedDonor })
  } catch (error: unknown) {
    console.error('Error updating donor:', error)

    const prismaError = error as { code?: string; message?: string }
    let userErrorMessage = 'Failed to update donor'
    if (prismaError.code === 'P2025') {
      userErrorMessage = 'Donor not found'
    } else if (prismaError.code === 'P2002') {
      userErrorMessage = 'A donor with this information already exists'
    } else if (error instanceof Error && error.message) {
      userErrorMessage = error.message
    }

    return NextResponse.json(
      { error: userErrorMessage },
      { status: 500 }
    )
  }
}

// DELETE - Delete donor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin status
    if (!checkAdmin(request)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Check if donor exists
    const donor = await prisma.donor.findUnique({
      where: { id },
    })

    if (!donor) {
      return NextResponse.json(
        { error: 'Donor not found' },
        { status: 404 }
      )
    }

    // Delete donor
    await prisma.donor.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Donor deleted successfully' })
  } catch (error: unknown) {
    console.error('Error deleting donor:', error)

    const prismaError = error as { code?: string; message?: string }
    let userErrorMessage = 'Failed to delete donor'
    if (prismaError.code === 'P2025') {
      userErrorMessage = 'Donor not found'
    } else if (error instanceof Error && error.message) {
      userErrorMessage = error.message
    }

    return NextResponse.json(
      { error: userErrorMessage },
      { status: 500 }
    )
  }
}

