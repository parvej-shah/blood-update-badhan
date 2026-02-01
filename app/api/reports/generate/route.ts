import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { normalizeReferrer } from '@/lib/validation'
import { differenceInDays, subDays } from 'date-fns'
import type { Prisma } from '@/lib/generated/prisma'

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

// Helper function to format Date to DD-MM-YYYY
function formatDateToString(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dateFrom, dateTo, bloodGroup } = body

    // Parse date filters
    const fromDate = dateFrom ? parseDonationDate(dateFrom) : null
    const toDate = dateTo ? parseDonationDate(dateTo) : null

    // Build base where clause (only for bloodGroup, not date)
    const baseWhere: Prisma.DonorWhereInput = {}
    if (bloodGroup && bloodGroup !== 'all') {
      baseWhere.bloodGroup = bloodGroup
    }

    // Fetch all donors (we'll filter by date in memory since date is stored as DD-MM-YYYY string)
    const allDonors = await prisma.donor.findMany({
      where: baseWhere,
      select: {
        date: true,
        bloodGroup: true,
        referrer: true,
      },
    })

    // Filter donors by date range in memory
    const filteredDonors = allDonors.filter(donor => {
      const donorDate = parseDonationDate(donor.date)
      if (!donorDate) return false
      if (fromDate && donorDate < fromDate) return false
      if (toDate && donorDate > toDate) return false
      return true
    })

    // Get total donations
    const totalDonations = filteredDonors.length

    // Get blood group breakdown
    const bloodGroupMap: Record<string, number> = {
      'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0
    }
    filteredDonors.forEach(donor => {
      if (bloodGroupMap[donor.bloodGroup] !== undefined) {
        bloodGroupMap[donor.bloodGroup]++
      }
    })

    // Get all donors with referrers for normalization
    const donorsWithReferrers = filteredDonors.filter(donor => donor.referrer !== null)

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


    // Get daily trends from filtered donors

    // Group by date
    const dailyTrends: Record<string, number> = {}
    filteredDonors.forEach((donor) => {
      dailyTrends[donor.date] = (dailyTrends[donor.date] || 0) + 1
    })

    const dailyTrendsArray = Object.entries(dailyTrends)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Calculate Peak Performance Metrics
    const dayOfWeekCounts: Record<string, number> = {}
    const weekOfMonthCounts: Record<string, number> = {}
    
    filteredDonors.forEach((donor) => {
      const date = parseDonationDate(donor.date)
      if (!date) return
      
      // Day of week (0 = Sunday, 1 = Monday, etc.)
      const dayOfWeek = date.getDay()
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const dayName = dayNames[dayOfWeek]
      dayOfWeekCounts[dayName] = (dayOfWeekCounts[dayName] || 0) + 1
      
      // Week of month (1-5)
      const weekOfMonth = Math.ceil(date.getDate() / 7)
      const weekKey = `Week ${weekOfMonth}`
      weekOfMonthCounts[weekKey] = (weekOfMonthCounts[weekKey] || 0) + 1
    })
    
    // Find busiest day of week
    const busiestDayOfWeek = Object.entries(dayOfWeekCounts)
      .sort((a, b) => b[1] - a[1])[0] || null
    
    // Find busiest week of month
    const busiestWeekOfMonth = Object.entries(weekOfMonthCounts)
      .sort((a, b) => b[1] - a[1])[0] || null
    
    // Find peak donation day (single day with most donations)
    const peakDay = dailyTrendsArray
      .sort((a, b) => b.count - a.count)[0] || null

    // Calculate Growth Metrics (compare with previous period)
    let growthMetrics = null
    
    if (dateFrom && dateTo) {
      const currentStart = parseDonationDate(dateFrom)
      const currentEnd = parseDonationDate(dateTo)
      
      if (currentStart && currentEnd) {
        // Calculate period duration
        const periodDays = differenceInDays(currentEnd, currentStart) + 1
        
        // Calculate previous period (same duration, shifted back)
        const previousEnd = subDays(currentStart, 1)
        const previousStart = subDays(previousEnd, periodDays - 1)
        
        const previousDateFrom = formatDateToString(previousStart)
        const previousDateTo = formatDateToString(previousEnd)
        
        // Build base where clause (without date filters, since we'll filter in memory)
        const baseWhere: Prisma.DonorWhereInput = {}
        if (bloodGroup && bloodGroup !== 'all') {
          baseWhere.bloodGroup = bloodGroup
        }
        
        // Fetch all donors for previous period (we need to filter by date in memory)
        // because date is stored as DD-MM-YYYY string and string comparison doesn't work correctly
        const allDonorsForComparison = await prisma.donor.findMany({
          where: baseWhere,
          select: {
            date: true,
            bloodGroup: true,
          },
        })
        
        // Filter previous period donors in memory
        const previousPeriodDonors = allDonorsForComparison.filter(donor => {
          const donorDate = parseDonationDate(donor.date)
          if (!donorDate) return false
          return donorDate >= previousStart && donorDate <= previousEnd
        })
        
        const previousTotalDonations = previousPeriodDonors.length
        
        // Calculate growth percentage
        const growthPercentage = previousTotalDonations > 0
          ? ((totalDonations - previousTotalDonations) / previousTotalDonations) * 100
          : totalDonations > 0 ? 100 : 0
        
        // Calculate previous period blood group breakdown
        const previousBloodGroupMap: Record<string, number> = {}
        previousPeriodDonors.forEach(donor => {
          previousBloodGroupMap[donor.bloodGroup] = (previousBloodGroupMap[donor.bloodGroup] || 0) + 1
        })
        
        // Calculate blood group growth
        const bloodGroupGrowth: Record<string, { current: number; previous: number; growth: number }> = {}
        const allBloodGroups = new Set([...Object.keys(bloodGroupMap), ...Object.keys(previousBloodGroupMap)])
        
        allBloodGroups.forEach(bg => {
          const current = bloodGroupMap[bg] || 0
          const previous = previousBloodGroupMap[bg] || 0
          const growth = previous > 0 ? ((current - previous) / previous) * 100 : (current > 0 ? 100 : 0)
          bloodGroupGrowth[bg] = { current, previous, growth }
        })
        
        growthMetrics = {
          currentPeriod: {
            totalDonations,
            dateFrom,
            dateTo,
          },
          previousPeriod: {
            totalDonations: previousTotalDonations,
            dateFrom: previousDateFrom,
            dateTo: previousDateTo,
          },
          growthPercentage: Math.round(growthPercentage * 100) / 100, // Round to 2 decimal places
          bloodGroupGrowth,
        }
      }
    }

    return NextResponse.json({
      totalDonations,
      bloodGroupBreakdown: bloodGroupMap,
      topReferrers: topReferrers, // Already in correct format { referrer, count }
      dailyTrends: dailyTrendsArray,
      peakPerformance: {
        busiestDayOfWeek: busiestDayOfWeek ? {
          day: busiestDayOfWeek[0],
          count: busiestDayOfWeek[1]
        } : null,
        busiestWeekOfMonth: busiestWeekOfMonth ? {
          week: busiestWeekOfMonth[0],
          count: busiestWeekOfMonth[1]
        } : null,
        peakDay: peakDay ? {
          date: peakDay.date,
          count: peakDay.count
        } : null,
      },
      growthMetrics,
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}

