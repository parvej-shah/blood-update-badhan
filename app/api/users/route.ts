import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, requireAdmin, getCurrentUser } from '@/lib/auth'
import { normalizePhone } from '@/lib/validation'

// GET - List all users (admin only)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const users = await prisma.user.findMany({
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Format response
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      phone: user.phone,
      roles: user.roles.map((ur) => ur.role.name),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }))

    return NextResponse.json(formattedUsers)
  } catch (error: any) {
    if (error.message?.includes('Unauthorized') || error.message?.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST - Create new user (public registration or admin creation)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, password } = body

    if (!name || !phone || !password) {
      return NextResponse.json(
        { error: 'Name, phone, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Normalize phone number
    const normalizedPhone = normalizePhone(phone)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this phone number already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Get donor role (default role)
    const donorRole = await prisma.role.findUnique({
      where: { name: 'donor' },
    })

    if (!donorRole) {
      return NextResponse.json(
        { error: 'Default role not found. Please seed roles first.' },
        { status: 500 }
      )
    }

    // Create user with default donor role
    const user = await prisma.user.create({
      data: {
        name,
        phone: normalizedPhone,
        password: hashedPassword,
        roles: {
          create: {
            roleId: donorRole.id,
          },
        },
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    })

    // Return user without password
    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        phone: user.phone,
        roles: user.roles.map((ur) => ur.role.name),
        createdAt: user.createdAt,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating user:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'User with this phone number already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}

