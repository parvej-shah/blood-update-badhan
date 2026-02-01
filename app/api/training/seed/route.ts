import { NextRequest, NextResponse } from 'next/server'
import { isAdminFromHeader } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { parseWithCustomModel } from '@/lib/custom-parser'
import { ParsedDonorData } from '@/lib/parser'

/**
 * Seed endpoint - can be called by admin to seed initial training data
 * This is a simplified version - you can expand it with more examples
 */
export async function POST(request: NextRequest) {
  try {
    if (!isAdminFromHeader(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Basic training examples (you can add more)
    const trainingExamples = [
      {
        rawText: "Sona mia vai\nO+\n01955-198724\n18-9-25",
        expectedOutput: {
          name: "Sona mia vai",
          bloodGroup: "O+",
          phone: "01955198724",
          date: "18-09-2025",
          batch: "Unknown",
          referrer: "",
          hallName: "",
        } as ParsedDonorData,
      },
      {
        rawText: "Maruf\n+8801521712737\nB+\n25/1/2026",
        expectedOutput: {
          name: "Maruf",
          bloodGroup: "B+",
          phone: "01521712737",
          date: "25-01-2026",
          batch: "Unknown",
          referrer: "",
          hallName: "",
        } as ParsedDonorData,
      },
      {
        rawText: "Tanvir Ahmed\nBadhon\nB(+ve)\nChemistry 23-24\n+8801518961476\n02.01.2026",
        expectedOutput: {
          name: "Badhon",
          bloodGroup: "B+",
          phone: "01518961476",
          date: "02-01-2026",
          batch: "Chemistry 23-24",
          referrer: "Tanvir Ahmed",
          hallName: "",
        } as ParsedDonorData,
      },
      {
        rawText: "Saifullah\nArafat\nAB(+)ve\n17-12-25\n01637234096",
        expectedOutput: {
          name: "Arafat",
          bloodGroup: "AB+",
          phone: "01637234096",
          date: "17-12-2025",
          batch: "Unknown",
          referrer: "Saifullah",
          hallName: "",
        } as ParsedDonorData,
      },
    ]

    let seeded = 0
    for (const example of trainingExamples) {
      // Check if already exists
      const existing = await prisma.parsingExample.findFirst({
        where: {
          rawText: example.rawText,
        },
      })

      if (existing) {
        continue // Skip if already exists
      }

      // Parse the text
      const parsedOutput = parseWithCustomModel(example.rawText)
      
      // Calculate confidence
      let matches = 0
      let totalFields = 0
      const fields: (keyof ParsedDonorData)[] = ['name', 'bloodGroup', 'phone', 'date', 'batch', 'referrer', 'hallName']
      
      for (const field of fields) {
        totalFields++
        const parsed = String(parsedOutput[field] || '').trim()
        const expected = String(example.expectedOutput[field] || '').trim()
        if (parsed && expected && parsed.toLowerCase() === expected.toLowerCase()) {
          matches++
        }
      }
      
      const confidence = totalFields > 0 ? matches / totalFields : 0
      const isCorrect = confidence > 0.7

      await prisma.parsingExample.create({
        data: {
          rawText: example.rawText,
          expectedOutput: example.expectedOutput as any,
          parsedOutput: parsedOutput as any,
          confidence,
          isCorrect,
        },
      })

      seeded++
    }

    return NextResponse.json({
      success: true,
      seeded,
      total: trainingExamples.length,
      message: `Seeded ${seeded} training examples`,
    })
  } catch (error: any) {
    console.error('Error seeding training data:', error)
    return NextResponse.json(
      { error: 'Failed to seed training data', details: error.message },
      { status: 500 }
    )
  }
}

