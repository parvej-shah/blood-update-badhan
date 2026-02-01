import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// GET - Get user roles (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      roles: user.roles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
      })),
    })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized') || error.message?.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error fetching user roles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user roles' },
      { status: 500 }
    )
  }
}

// POST - Add role to user (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()

    const { id } = await params
    const body = await request.json()
    const { roleName } = body

    if (!roleName) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { name: roleName },
    })

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Check if user already has this role
    const existingUserRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: id,
          roleId: role.id,
        },
      },
    })

    if (existingUserRole) {
      return NextResponse.json(
        { error: 'User already has this role' },
        { status: 409 }
      )
    }

    // Add role to user
    await prisma.userRole.create({
      data: {
        userId: id,
        roleId: role.id,
      },
    })

    // Return updated user with roles
    const updatedUser = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    })

    return NextResponse.json({
      id: updatedUser!.id,
      name: updatedUser!.name,
      phone: updatedUser!.phone,
      roles: updatedUser!.roles.map((ur) => ur.role.name),
    })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized') || error.message?.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'User already has this role' },
        { status: 409 }
      )
    }
    console.error('Error adding role to user:', error)
    return NextResponse.json(
      { error: 'Failed to add role to user' },
      { status: 500 }
    )
  }
}

// DELETE - Remove role from user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const roleName = searchParams.get('roleName')

    if (!roleName) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { name: roleName },
    })

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Prevent removing donor role (everyone should have at least donor role)
    if (roleName === 'donor') {
      return NextResponse.json(
        { error: 'Cannot remove donor role. All users must have the donor role.' },
        { status: 400 }
      )
    }

    // Remove role from user
    await prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId: id,
          roleId: role.id,
        },
      },
    })

    // Return updated user with roles
    const updatedUser = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    })

    return NextResponse.json({
      id: updatedUser!.id,
      name: updatedUser!.name,
      phone: updatedUser!.phone,
      roles: updatedUser!.roles.map((ur) => ur.role.name),
    })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized') || error.message?.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'User does not have this role' },
        { status: 404 }
      )
    }
    console.error('Error removing role from user:', error)
    return NextResponse.json(
      { error: 'Failed to remove role from user' },
      { status: 500 }
    )
  }
}

