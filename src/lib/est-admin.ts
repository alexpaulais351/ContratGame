import { prisma } from '@/lib/prisma'

/** Vrai si l'utilisateur a le rôle « admin » (User.role). Toujours relu en base. */
export async function estAdmin(userId: string): Promise<boolean> {
  if (!userId) return false
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
  return u?.role === 'admin'
}
