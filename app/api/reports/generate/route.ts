import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { normalizeReferrer } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dateFrom, dateTo, bloodGroup } = body

    // Build where clause
    const where: any = {}

    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) {
        where.date.gte = dateFrom
      }
      if (dateTo) {
        where.date.lte = dateTo
      }
    }

    if (bloodGroup && bloodGroup !== 'all') {
      where.bloodGroup = bloodGroup
    }

    // Get total donations
    const totalDonations = await prisma.donor.count({ where })

    // Get blood group breakdown
    const bloodGroupBreakdown = await prisma.donor.groupBy({
      by: ['bloodGroup'],
      where,
      _count: {
        id: true,
      },
    })

    const bloodGroupMap: Record<string, number> = {}
    bloodGroupBreakdown.forEach((item) => {
      bloodGroupMap[item.bloodGroup] = item._count.id
    })

    // Get all donors with referrers for normalization
    const donorsWithReferrers = await prisma.donor.findMany({
      where: {
        ...where,
        referrer: {
          not: null,
        },
      },
      select: {
        referrer: true,
      },
    })

    // Group referrers by normalized name
    const referrerCounts: Record<string, number> = {}
    const referrerOriginalNames: Record<string, string> = {} // Store original name for display
    
    donorsWithReferrers.forEach(donor => {
      if (donor.referrer) {
        // Normalize the referrer name for grouping
        const normalized = normalizeReferrer(donor.referrer)
        if (normalized) {
          // Use normalized name as key for counting
          referrerCounts[normalized] = (referrerCounts[normalized] || 0) + 1
          // Store the first original name we see for this normalized name (for display)
          if (!referrerOriginalNames[normalized]) {
            referrerOriginalNames[normalized] = donor.referrer
          }
        }
      }
    })

    // Convert to array and sort by count
    const topReferrers = Object.entries(referrerCounts)
      .map(([normalized, count]) => ({
        referrer: referrerOriginalNames[normalized] || normalized, // Use original name for display
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)


    // Get daily trends
    const allDonors = await prisma.donor.findMany({
      where,
      select: {
        date: true,
      },
    })

    // Group by date
    const dailyTrends: Record<string, number> = {}
    allDonors.forEach((donor) => {
      dailyTrends[donor.date] = (dailyTrends[donor.date] || 0) + 1
    })

    const dailyTrendsArray = Object.entries(dailyTrends)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      totalDonations,
      bloodGroupBreakdown: bloodGroupMap,
      topReferrers: topReferrers, // Already in correct format { referrer, count }
      dailyTrends: dailyTrendsArray,
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}

