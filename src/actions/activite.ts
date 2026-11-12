'use server'
/** Journal de fréquentation (onglet Analyse) : une page vue par le compte courant. Jamais bloquant. */
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { dateDuJour, jourParis, normaliserChemin } from '@/lib/activite'

export async function noterVisite(chemin: unknown): Promise<void> {
  try {
    const n = normaliserChemin(chemin)
    if (!n) return
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return
    const compte = await prisma.user.findUnique({ where: { id: userId }, select: { statut: true } })
    if (compte?.statut !== 'approuve') return
    const jour = dateDuJour(jourParis())
    await prisma.visite.upsert({
      where: { userId_jour_chemin_projetId: { userId, jour, chemin: n.chemin, projetId: n.projetId } },
      create: { userId, jour, chemin: n.chemin, projetId: n.projetId },
      update: { nombre: { increment: 1 } },
    })
  } catch {
    // Le suivi ne doit jamais faire échouer la page (course à l'insertion, base indisponible…).
  }
}
