import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns'

export async function GET() {
  try {
    // Get total donors
    const totalDonors = await prisma.donor.count()

    // Get monthly donations for last 12 months grouped by blood group
    const twelveMonthsAgo = subMonths(new Date(), 11)
    const monthStart = startOfMonth(twelveMonthsAgo)

    // Get all donors from last 12 months
    const donors = await prisma.donor.findMany({
      where: {
        createdAt: {
          gte: monthStart,
        },
      },
      select: {
        createdAt: true,
        bloodGroup: true,
      },
    })

    // Group by month and blood group
    const monthlyData: Record<string, Record<string, number>> = {}

    for (let i = 0; i < 12; i++) {
      const month = startOfMonth(subMonths(new Date(), 11 - i))
      const monthKey = format(month, 'yyyy-MM')
      monthlyData[monthKey] = {
        'A+': 0,
        'A-': 0,
        'B+': 0,
        'B-': 0,
        'AB+': 0,
        'AB-': 0,
        'O+': 0,
        'O-': 0,
      }
    }

    donors.forEach((donor) => {
      const monthKey = format(donor.createdAt, 'yyyy-MM')
      if (monthlyData[monthKey] && monthlyData[monthKey][donor.bloodGroup] !== undefined) {
        monthlyData[monthKey][donor.bloodGroup]++
      }
    })

    // Convert to array format for charts
    const monthlyChartData = Object.entries(monthlyData).map(([month, breakdown]) => ({
      month,
      ...breakdown,
    }))

    return NextResponse.json({
      totalDonors,
      monthlyData: monthlyChartData,
    })
  } catch (error) {
    console.error('Error fetching all-time stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch all-time statistics' },
      { status: 500 }
    )
  }
}

