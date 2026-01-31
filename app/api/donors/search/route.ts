import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { subMonths } from 'date-fns'

// Helper function to parse DD-MM-YYYY to Date object
function parseDonationDate(dateStr: string): Date | null {
  const parts = dateStr.split('-')
  if (parts.length !== 3) return null
  const day = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1
  const year = parseInt(parts[2], 10)
  const date = new Date(year, month, day)
  return isNaN(date.getTime()) ? null : date
}

interface DonorRecord {
  phone: string
  name: string
  bloodGroup: string
  batch: string | null
  hallName: string | null
  date: string
}

interface AvailableDonor {
  phone: string
  name: string
  bloodGroup: string
  batch: string | null
  hallName: string | null
  lastDonationDate: string
  daysSinceLastDonation: number
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const bloodGroup = searchParams.get('bloodGroup')

    if (!bloodGroup || bloodGroup === 'all') {
      return NextResponse.json(
        { error: 'Blood group is required' },
        { status: 400 }
      )
    }

    // Calculate 4 months ago threshold (as DD-MM-YYYY string for comparison)
    const fourMonthsAgo = subMonths(new Date(), 4)
    const fourMonthsAgoStr = `${String(fourMonthsAgo.getDate()).padStart(2, '0')}-${String(fourMonthsAgo.getMonth() + 1).padStart(2, '0')}-${fourMonthsAgo.getFullYear()}`

    // Get all donors with the specified blood group, ordered by date descending
    // This ensures we process the most recent donation first for each phone number
    const donors = await prisma.donor.findMany({
      where: {
        bloodGroup: bloodGroup,
      },
      select: {
        phone: true,
        name: true,
        bloodGroup: true,
        batch: true,
        hallName: true,
        date: true,
      },
      orderBy: {
        date: 'desc', // Most recent first - helps with grouping optimization
      },
    })

    // Group by phone number and get the most recent donation for each donor
    // Since we ordered by date desc, the first occurrence of each phone is the most recent
    const donorMap = new Map<string, DonorRecord>()
    
    // Time complexity: O(n) - single pass through donors
    for (const donor of donors) {
      // If we haven't seen this phone number yet, it's the most recent (due to ordering)
      if (!donorMap.has(donor.phone)) {
        donorMap.set(donor.phone, donor)
      }
      // If we've already seen it, skip (we already have the most recent due to ordering)
    }

    // Calculate 4 months ago threshold for date comparison
    const fourMonthsAgoDate = subMonths(new Date(), 4)

    // Filter to only include donors whose last donation was 4+ months ago
    // Time complexity: O(m) where m = unique phone numbers (m ≤ n)
    const availableDonors: AvailableDonor[] = []
    
    for (const donor of donorMap.values()) {
      const donationDate = parseDonationDate(donor.date)
      if (!donationDate) continue

      // Check if last donation was 4+ months ago
      if (donationDate <= fourMonthsAgoDate) {
        const daysSince = Math.floor(
          (new Date().getTime() - donationDate.getTime()) / (1000 * 60 * 60 * 24)
        )

        availableDonors.push({
          phone: donor.phone,
          name: donor.name,
          bloodGroup: donor.bloodGroup,
          batch: donor.batch,
          hallName: donor.hallName,
          lastDonationDate: donor.date,
          daysSinceLastDonation: daysSince,
        })
      }
    }

    // Sort by days since last donation (most available first)
    // Time complexity: O(k log k) where k = available donors (k ≤ m ≤ n)
    availableDonors.sort((a, b) => b.daysSinceLastDonation - a.daysSinceLastDonation)

    return NextResponse.json({
      bloodGroup,
      count: availableDonors.length,
      donors: availableDonors,
    })
  } catch (error) {
    console.error('Error searching available donors:', error)
    return NextResponse.json(
      { error: 'Failed to search available donors' },
      { status: 500 }
    )
  }
}

