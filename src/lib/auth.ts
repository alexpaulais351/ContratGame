import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authConfig } from '@/lib/auth.config'
import { getAuthSecretSync } from '@/lib/auth-secret-node'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: getAuthSecretSync(),
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = z.object({ email: z.string().email(), password: z.string().min(1) }).safeParse(raw)
        if (!parsed.success) return null
        const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } })
        if (!user) return null
        const ok = await bcrypt.compare(parsed.data.password, user.password)
        if (!ok) return null
        return { id: user.id, email: user.email, name: user.name, role: user.role }
      },
    }),
  ],
})
