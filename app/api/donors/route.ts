import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validateDonor, normalizePhone, normalizeDate } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
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

    // Normalize phone and date
    const normalizedPhone = normalizePhone(data.phone)
    const normalizedDate = normalizeDate(data.date)

    // Ensure bloodGroup is a string (after Zod transform)
    const bloodGroup = typeof data.bloodGroup === 'string' ? data.bloodGroup : String(data.bloodGroup)

    // Prepare data for database - ensure all required fields are present
    const donorData = {
      name: (data.name || '').trim(),
      bloodGroup: bloodGroup,
      batch: (data.batch && data.batch.trim()) ? data.batch.trim() : 'Unknown',
      hospital: (data.hospital && data.hospital.trim()) ? data.hospital.trim() : 'Unknown',
      phone: normalizedPhone,
      date: normalizedDate,
      referrer: (data.referrer && data.referrer.trim()) ? data.referrer.trim() : null,
      hallName: (data.hallName && data.hallName.trim()) ? data.hallName.trim() : null,
    }

    // Validate required fields are not empty after trimming
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

    // Check for duplicate: same phone + date combination
    const existingDonor = await prisma.donor.findFirst({
      where: {
        phone: donorData.phone,
        date: donorData.date,
        name: {
          equals: donorData.name,
          mode: 'insensitive',
        },
      },
    })

    if (existingDonor) {
      return NextResponse.json(
        { 
          error: `Duplicate entry detected. A donor with phone ${donorData.phone}, name "${donorData.name}", and date ${donorData.date} already exists.`,
          code: 'DUPLICATE_ENTRY',
          existingId: existingDonor.id,
        },
        { status: 409 } // Conflict status code
      )
    }

    // Create donor
    const donor = await prisma.donor.create({
      data: donorData,
    })

    return NextResponse.json({ success: true, donor }, { status: 201 })
  } catch (error: any) {
    // Enhanced error logging
    const errorDetails: any = {
      message: error?.message || 'Unknown error',
      name: error?.name,
    }

    // Prisma-specific error details
    if (error?.code) {
      errorDetails.code = error.code
    }
    if (error?.meta) {
      errorDetails.meta = error.meta
    }
    if (error?.stack && process.env.NODE_ENV === 'development') {
      errorDetails.stack = error.stack
    }

    console.error('Error creating donor:', errorDetails)

    // Check if error is about missing hallName column
    const errorMessage = error?.message || ''
    if (errorMessage.includes('Unknown argument `hallName`')) {
      return NextResponse.json(
        { 
          error: 'Database schema is out of date. Please run the SQL migration to add the hallName column. See prisma/add-hallname-column.sql',
          code: 'SCHEMA_OUT_OF_DATE'
        },
        { status: 500 }
      )
    }

    // User-friendly error messages
    let userErrorMessage = 'Failed to create donor'
    if (error?.code === 'P2002') {
      userErrorMessage = 'A donor with this information already exists (duplicate entry)'
    } else if (error?.code === 'P1001') {
      userErrorMessage = 'Database connection failed. Please try again later.'
    } else if (error?.message) {
      userErrorMessage = error.message
    }

    return NextResponse.json(
      { 
        error: userErrorMessage,
        ...(process.env.NODE_ENV === 'development' && { details: errorDetails })
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const bloodGroup = searchParams.get('bloodGroup')
    const search = searchParams.get('search')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (bloodGroup && bloodGroup !== 'all') {
      where.bloodGroup = bloodGroup
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ]
    }

    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) {
        where.date.gte = dateFrom
      }
      if (dateTo) {
        where.date.lte = dateTo
      }
    }

    // Get total count
    const total = await prisma.donor.count({ where })

    // Get donors
    const donors = await prisma.donor.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      donors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching donors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch donors' },
      { status: 500 }
    )
  }
}

