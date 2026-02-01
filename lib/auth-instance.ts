import 'server-only'

import NextAuth from 'next-auth'
import { authOptions } from './auth-config'

// Validate required environment variables
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error(
    'NEXTAUTH_SECRET is not set. Please add it to your .env.local file. ' +
    'You can generate one with: openssl rand -base64 32'
  )
}

export const { handlers, auth } = NextAuth(authOptions)

