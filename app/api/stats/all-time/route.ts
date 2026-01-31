import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { subMonths, startOfMonth, format } from 'date-fns'

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

export async function GET() {
  try {
    // Get total donors
    const totalDonors = await prisma.donor.count()

    // Get all donors with their donation dates
    const donors = await prisma.donor.findMany({
      select: {
        date: true,
        bloodGroup: true,
      },
    })

    // Group by month and blood group based on donation date (not createdAt)
    const monthlyData: Record<string, Record<string, number>> = {}
    const twelveMonthsAgo = startOfMonth(subMonths(new Date(), 11))

    // Initialize all 12 months
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

    // Count donations by their actual donation date
    donors.forEach((donor) => {
      const donorDate = parseDonationDate(donor.date)
      if (!donorDate || donorDate < twelveMonthsAgo) return
      
      const monthKey = format(donorDate, 'yyyy-MM')
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

