import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validateDonor, normalizePhone, normalizeDate, normalizeReferrer } from '@/lib/validation'
import type { Prisma } from '@/lib/generated/prisma'

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

    // Normalize referrer name to handle variations
    const normalizedReferrer = normalizeReferrer(data.referrer)

    // Prepare data for database - ensure all required fields are present
    const donorData = {
      name: (data.name || '').trim(),
      bloodGroup: bloodGroup,
      batch: (data.batch && data.batch.trim()) ? data.batch.trim() : 'Unknown',
      phone: normalizedPhone,
      date: normalizedDate,
      referrer: normalizedReferrer,
      hallName: (data.hallName && data.hallName.trim()) ? data.hallName.trim() : null,
    }

    // Validate required fields are not empty after trimming
    if (!donorData.name || donorData.name.length === 0) {
      return NextResponse.json(
        { error: 'Name is required and cannot be empty' },
        { status: 400 }
      )
    }
    if (!donorData.bloodGroup || donorData.bloodGroup.length === 0) {
      return NextResponse.json(
        { error: 'Blood group is required and cannot be empty' },
        { status: 400 }
      )
    }

    // Helper function to convert DD-MM-YYYY to sortable YYYY-MM-DD
    function parseSortable(d: string) {
      if (!d) return '0000-00-00';
      const p = d.split('-');
      if (p.length !== 3) return d;
      return `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
    }

    // 1. Find existing donor profile by phone (or by name if phone is empty)
    let existingProfile = null;
    if (donorData.phone && donorData.phone.length >= 10) {
      existingProfile = await prisma.donor.findFirst({
        where: { phone: donorData.phone },
        include: { donations: true }
      });
    } else if (donorData.name) {
      existingProfile = await prisma.donor.findFirst({
        where: { name: { equals: donorData.name, mode: 'insensitive' } },
        include: { donations: true }
      });
    }

    if (existingProfile) {
      // Check for duplicate donation record on the exact same date
      const isDuplicateDate = existingProfile.donations.some(
        rec => rec.date === donorData.date
      );

      if (isDuplicateDate) {
        return NextResponse.json(
          {
            error: `Duplicate entry: "${donorData.name}" already has a donation recorded on ${donorData.date}.`,
            code: 'DUPLICATE_ENTRY',
            existingId: existingProfile.id,
          },
          { status: 409 }
        );
      }

      // Check if new date is more recent than current lastDonationDate
      const currentLastDate = existingProfile.lastDonationDate || existingProfile.date;
      const isNewer = parseSortable(donorData.date) >= parseSortable(currentLastDate);

      // Create new DonationRecord
      await prisma.donationRecord.create({
        data: {
          donorId: existingProfile.id,
          date: donorData.date,
          referrer: donorData.referrer,
        }
      });

      // Update donor profile stats & latest info
      const updatedDonor = await prisma.donor.update({
        where: { id: existingProfile.id },
        data: {
          donationCount: { increment: 1 },
          lastDonationDate: isNewer ? donorData.date : currentLastDate,
          date: isNewer ? donorData.date : existingProfile.date,
          bloodGroup: donorData.bloodGroup || existingProfile.bloodGroup,
          batch: (donorData.batch && donorData.batch !== 'Unknown') ? donorData.batch : existingProfile.batch,
          hallName: donorData.hallName || existingProfile.hallName,
        },
        include: { donations: true }
      });

      return NextResponse.json({ success: true, donor: updatedDonor, isNewProfile: false }, { status: 201 });
    }

    // 2. Create new Donor profile + initial DonationRecord
    const newDonor = await prisma.donor.create({
      data: {
        name: donorData.name,
        bloodGroup: donorData.bloodGroup,
        batch: donorData.batch,
        phone: donorData.phone,
        date: donorData.date,
        lastDonationDate: donorData.date,
        donationCount: 1,
        referrer: donorData.referrer,
        hallName: donorData.hallName,
        donations: {
          create: {
            date: donorData.date,
            referrer: donorData.referrer,
          }
        }
      },
      include: { donations: true }
    });

    return NextResponse.json({ success: true, donor: newDonor, isNewProfile: true }, { status: 201 });
  } catch (error: unknown) {
    // Enhanced error logging
    const errorDetails: {
      message: string
      name?: string
      code?: string
      meta?: unknown
      stack?: string
    } = {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : undefined,
    }

    // Prisma-specific error details
    const prismaError = error as { code?: string; meta?: unknown; stack?: string }
    if (prismaError.code) {
      errorDetails.code = prismaError.code
    }
    if (prismaError.meta) {
      errorDetails.meta = prismaError.meta
    }
    if (prismaError.stack && process.env.NODE_ENV === 'development') {
      errorDetails.stack = prismaError.stack
    }

    console.error('Error creating donor:', errorDetails)

    // Check if error is about missing hallName column
    const errorMessage = error instanceof Error ? error.message : ''
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
    if (prismaError.code === 'P2002') {
      userErrorMessage = 'A donor with this information already exists (duplicate entry)'
    } else if (prismaError.code === 'P1001') {
      userErrorMessage = 'Database connection failed. Please try again later.'
    } else if (error instanceof Error && error.message) {
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

// Helper function to parse DD-MM-YYYY date string to sortable format (YYYY-MM-DD)
function parseDonationDateToSortable(dateStr: string): string {
  const parts = dateStr.split('-')
  if (parts.length !== 3) return '0000-00-00'
  const [day, month, year] = parts
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

// Helper function to convert DD-MM-YYYY to Date object for filtering
function parseDonationDate(dateStr: string): Date | null {
  const parts = dateStr.split('-')
  if (parts.length !== 3) return null
  const day = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1
  const year = parseInt(parts[2], 10)
  const date = new Date(year, month, day)
  return isNaN(date.getTime()) ? null : date
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
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: Prisma.DonorWhereInput = {}

    if (bloodGroup && bloodGroup !== 'all') {
      where.bloodGroup = bloodGroup
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { batch: { contains: search, mode: 'insensitive' } },
        { referrer: { contains: search, mode: 'insensitive' } },
        { hallName: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get all donors for date filtering and sorting (since date is stored as DD-MM-YYYY string)
    // We fetch all matching donors first, then filter by date in memory
    let donors = await prisma.donor.findMany({
      where,
      include: {
        donations: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    // Filter by date range if specified (using donation date, not createdAt)
    if (dateFrom || dateTo) {
      const fromDate = dateFrom ? parseDonationDate(dateFrom) : null
      const toDate = dateTo ? parseDonationDate(dateTo) : null

      donors = donors.filter(donor => {
        const donorDate = parseDonationDate(donor.date)
        if (!donorDate) return false
        if (fromDate && donorDate < fromDate) return false
        if (toDate && donorDate > toDate) return false
        return true
      })
    }

    // Sort by donation date (default) or other fields
    donors.sort((a, b) => {
      let comparison = 0
      
      if (sortBy === 'date') {
        const dateA = parseDonationDateToSortable(a.date)
        const dateB = parseDonationDateToSortable(b.date)
        comparison = dateA.localeCompare(dateB)
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name)
      } else if (sortBy === 'bloodGroup') {
        comparison = a.bloodGroup.localeCompare(b.bloodGroup)
      } else if (sortBy === 'batch') {
        comparison = (a.batch || '').localeCompare(b.batch || '')
      } else if (sortBy === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
      
      return sortOrder === 'desc' ? -comparison : comparison
    })

    // Apply pagination after filtering and sorting
    const filteredTotal = donors.length
    const paginatedDonors = donors.slice(skip, skip + limit)

    return NextResponse.json({
      donors: paginatedDonors,
      pagination: {
        page,
        limit,
        total: filteredTotal,
        totalPages: Math.ceil(filteredTotal / limit),
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

