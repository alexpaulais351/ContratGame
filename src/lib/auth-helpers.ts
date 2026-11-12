import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'

/** Pour les Server Actions : lève une erreur si non authentifié ou compte non approuvé. */
export async function requireUser() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Non authentifié')
  const compte = await prisma.user.findUnique({ where: { id: session.user.id }, select: { statut: true } })
  if (!compte || compte.statut !== 'approuve') throw new Error('Compte non validé')
  return session.user as { id: string; name?: string | null; email?: string | null }
}

/** Pour les Server Actions liées à un projet : auth + membership. */
export async function requireMember(projetId: string) {
  const user = await requireUser()
  const member = await prisma.projetMember.findUnique({
    where: { userId_projetId: { userId: user.id, projetId } },
  })
  if (!member) throw new Error('Accès refusé')
  return { user, member }
}

/** Pour les Server Components (pages) : redirige / 404 au lieu de lever. */
export async function getProjetPourPage(projetId: string) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const member = await prisma.projetMember.findUnique({
    where: { userId_projetId: { userId: session.user.id, projetId } },
    include: { projet: true },
  })
  if (!member) notFound()
  return { user: session.user, member, projet: member.projet }
}
