import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { normalizeReferrer } from '@/lib/validation'

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
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    // Get all donors and filter by donation date (not createdAt)
    const allDonors = await prisma.donor.findMany({
      select: {
        date: true,
        bloodGroup: true,
        referrer: true,
      },
    })

    // Filter donors whose donation date is in current month
    const thisMonthDonors = allDonors.filter(donor => {
      const donorDate = parseDonationDate(donor.date)
      if (!donorDate) return false
      return donorDate >= monthStart && donorDate <= monthEnd
    })

    const totalThisMonth = thisMonthDonors.length

    // Get blood group breakdown for this month
    const bloodGroupMap: Record<string, number> = {
      'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0
    }
    thisMonthDonors.forEach(donor => {
      if (bloodGroupMap[donor.bloodGroup] !== undefined) {
        bloodGroupMap[donor.bloodGroup]++
      }
    })

    // Get top referrer this month (normalize referrer names for grouping)
    const referrerCounts: Record<string, number> = {}
    const referrerOriginalNames: Record<string, string> = {} // Store original name for display
    
    thisMonthDonors.forEach(donor => {
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

    let topReferrer: string | null = null
    let topReferrerCount = 0
    Object.entries(referrerCounts).forEach(([normalizedReferrer, count]) => {
      if (count > topReferrerCount) {
        // Use the original name for display (or normalized if no original stored)
        topReferrer = referrerOriginalNames[normalizedReferrer] || normalizedReferrer
        topReferrerCount = count
      }
    })

    return NextResponse.json({
      totalThisMonth,
      bloodGroupBreakdown: bloodGroupMap,
      topReferrer,
      topReferrerCount,
    })
  } catch (error) {
    console.error('Error fetching monthly stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch monthly statistics' },
      { status: 500 }
    )
  }
}

