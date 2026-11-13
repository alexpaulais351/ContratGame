'use server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** Compteurs des pastilles de la barre latérale (administrateur) : comptes à valider, nouveaux tickets. */
export async function compteursBarreLaterale(): Promise<{ demandesEnAttente: number; ticketsNouveaux: number }> {
  const session = await auth()
  if (!session?.user?.id) return { demandesEnAttente: 0, ticketsNouveaux: 0 }
  const u = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true, statut: true } })
  if (u?.role !== 'admin' || u.statut !== 'approuve') return { demandesEnAttente: 0, ticketsNouveaux: 0 }
  const [demandesEnAttente, ticketsNouveaux] = await Promise.all([
    prisma.user.count({ where: { statut: 'en_attente' } }),
    prisma.ticket.count({ where: { statut: 'nouveau' } }),
  ])
  return { demandesEnAttente, ticketsNouveaux }
}
