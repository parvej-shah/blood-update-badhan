import { prisma } from '@/lib/db'

async function main() {
  console.log('Seeding default roles...')

  // Create default roles if they don't exist
  const roles = [
    {
      name: 'donor',
      description: 'Default role for all users. Can submit and search donors.',
    },
    {
      name: 'moderator',
      description: 'Can moderate content and manage training data.',
    },
    {
      name: 'admin',
      description: 'Full access to all features including user management.',
    },
  ]

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {
        description: role.description,
      },
      create: role,
    })
    console.log(`✓ Role "${role.name}" created/updated`)
  }

  console.log('✅ Default roles seeded successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding roles:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

