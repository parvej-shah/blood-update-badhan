import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

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

    // Get top 10 referrers
    const topReferrers = await prisma.donor.groupBy({
      by: ['referrer'],
      where: {
        ...where,
        referrer: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    })

    // Get top 5 hospitals
    const topHospitals = await prisma.donor.groupBy({
      by: ['hospital'],
      where: {
        ...where,
        hospital: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    })

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
      topReferrers: topReferrers.map((item) => ({
        referrer: item.referrer,
        count: item._count.id,
      })),
      topHospitals: topHospitals.map((item) => ({
        hospital: item.hospital,
        count: item._count.id,
      })),
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

