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
  id: string
  phone: string
  name: string
  bloodGroup: string
  batch: string | null
  hallName: string | null
  lastDonationDate: string
  daysSinceLastDonation: number
  donationCount: number
  donations: Array<{ id: string; date: string; referrer: string | null }>
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

    const fourMonthsAgoDate = subMonths(new Date(), 4)

    const donors = await prisma.donor.findMany({
      where: {
        bloodGroup: bloodGroup,
      },
      include: {
        donations: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    const availableDonors: AvailableDonor[] = []
    
    for (const donor of donors) {
      const effectiveDate = donor.lastDonationDate || donor.date
      const donationDate = parseDonationDate(effectiveDate)
      if (!donationDate) continue

      if (donationDate <= fourMonthsAgoDate) {
        const daysSince = Math.floor(
          (new Date().getTime() - donationDate.getTime()) / (1000 * 60 * 60 * 24)
        )

        availableDonors.push({
          id: donor.id,
          phone: donor.phone,
          name: donor.name,
          bloodGroup: donor.bloodGroup,
          batch: donor.batch,
          hallName: donor.hallName,
          lastDonationDate: effectiveDate,
          daysSinceLastDonation: daysSince,
          donationCount: donor.donationCount || donor.donations.length || 1,
          donations: donor.donations.map(d => ({ id: d.id, date: d.date, referrer: d.referrer }))
        })
      }
    }

    // Sort available donors by daysSinceLastDonation descending (oldest last donation first)
    availableDonors.sort((a, b) => b.daysSinceLastDonation - a.daysSinceLastDonation)

    return NextResponse.json({
      bloodGroup,
      count: availableDonors.length,
      donors: availableDonors,
    })
  } catch (error) {
    console.error('Error searching donors:', error)
    return NextResponse.json(
      { error: 'Failed to search donors' },
      { status: 500 }
    )
  }
}
