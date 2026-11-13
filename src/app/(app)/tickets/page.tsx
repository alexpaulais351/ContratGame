import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { estAdmin as verifierAdmin } from '@/lib/est-admin'
import { TicketsClient } from '@/components/modules/tickets/TicketsClient'
import type { TicketDTO } from '@/components/modules/tickets/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Tickets — Contrat Game' }

const ORDRE_PRIORITE: Record<string, number> = { haute: 0, normale: 1, basse: 2 }

export default async function TicketsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const moiId = session.user.id
  const admin = await verifierAdmin(moiId)
  // L'administrateur voit toutes les demandes ; un utilisateur ne voit que les siennes.
  const tickets = await prisma.ticket.findMany({
    where: admin ? {} : { auteurId: moiId },
    include: { auteur: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })
  const dto: TicketDTO[] = tickets
    .map((t) => ({
      id: t.id,
      numero: t.numero,
      titre: t.titre,
      description: t.description,
      categorie: t.categorie,
      priorite: t.priorite,
      statut: t.statut,
      page: t.page,
      reponse: t.reponse,
      creeLe: t.createdAt.toISOString(),
      majLe: t.updatedAt.toISOString(),
      auteurNom: t.auteur.name,
      auteurEmail: t.auteur.email,
      estAuteur: t.auteurId === moiId,
    }))
    .sort((a, b) => (admin ? (ORDRE_PRIORITE[a.priorite] ?? 1) - (ORDRE_PRIORITE[b.priorite] ?? 1) : 0))
  return (
    <main className="p-4 lg:p-6">
      <div className="mx-auto max-w-5xl">
        <TicketsClient tickets={dto} estAdmin={admin} />
      </div>
    </main>
  )
}
