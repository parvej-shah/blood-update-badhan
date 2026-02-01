import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const admin = await isAdmin()
    return NextResponse.json({ isAdmin: admin })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check admin status' },
      { status: 500 }
    )
  }
}

