import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { startOfMonth, endOfMonth } from 'date-fns'

export async function GET() {
  try {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    // Get total donors this month
    const totalThisMonth = await prisma.donor.count({
      where: {
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    })

    // Get blood group breakdown for this month
    const bloodGroupBreakdown = await prisma.donor.groupBy({
      by: ['bloodGroup'],
      where: {
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      _count: {
        id: true,
      },
    })

    // Get top referrer this month
    const topReferrer = await prisma.donor.groupBy({
      by: ['referrer'],
      where: {
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
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
      take: 1,
    })

    const bloodGroupMap: Record<string, number> = {}
    bloodGroupBreakdown.forEach((item) => {
      bloodGroupMap[item.bloodGroup] = item._count.id
    })

    return NextResponse.json({
      totalThisMonth,
      bloodGroupBreakdown: bloodGroupMap,
      topReferrer: topReferrer[0]?.referrer || null,
      topReferrerCount: topReferrer[0]?._count.id || 0,
    })
  } catch (error) {
    console.error('Error fetching monthly stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch monthly statistics' },
      { status: 500 }
    )
  }
}

