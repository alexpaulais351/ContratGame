'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth-helpers'
import { estAdmin } from '@/lib/est-admin'
import type { ActionResult } from '@/types'
import { CATEGORIES_TICKET, PRIORITES_TICKET, STATUTS_TICKET } from '@/components/modules/tickets/types'

const cles = <T extends { value: string }>(l: readonly T[]) => l.map((x) => x.value) as [string, ...string[]]

function revalider() {
  revalidatePath('/tickets')
  revalidatePath('/', 'layout') // pastille de la barre latérale
}

function erreur(e: unknown): { success: false; error: string } {
  if (e instanceof z.ZodError) return { success: false, error: e.issues[0]?.message ?? 'Données invalides' }
  return { success: false, error: e instanceof Error ? e.message : 'Erreur inattendue' }
}

const creationSchema = z.object({
  titre: z.string().trim().min(3, 'Titre trop court').max(160),
  description: z.string().trim().min(5, 'Décrivez votre demande').max(10000),
  categorie: z.enum(cles(CATEGORIES_TICKET)),
  priorite: z.enum(cles(PRIORITES_TICKET)),
  page: z.string().trim().max(300).optional(),
})

/** Tout utilisateur validé peut ouvrir un ticket. */
export async function creerTicket(data: unknown): Promise<ActionResult<{ numero: number }>> {
  try {
    const user = await requireUser()
    const d = creationSchema.parse(data)
    const t = await prisma.ticket.create({
      data: { auteurId: user.id, titre: d.titre, description: d.description, categorie: d.categorie, priorite: d.priorite, page: d.page || null },
      select: { numero: true },
    })
    revalider()
    return { success: true, data: t }
  } catch (e) {
    return erreur(e)
  }
}

const traitementSchema = z.object({
  statut: z.enum(cles(STATUTS_TICKET)),
  priorite: z.enum(cles(PRIORITES_TICKET)),
  reponse: z.string().trim().max(10000).optional(),
})

/** Administrateur : statut, priorité et réponse à l'auteur. */
export async function traiterTicket(ticketId: string, data: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser()
    if (!(await estAdmin(user.id))) return { success: false, error: 'Réservé aux administrateurs' }
    const d = traitementSchema.parse(data)
    await prisma.ticket.update({ where: { id: ticketId }, data: { statut: d.statut, priorite: d.priorite, reponse: d.reponse || null } })
    revalider()
    return { success: true, data: undefined }
  } catch (e) {
    return erreur(e)
  }
}

/** Suppression : l'administrateur, ou l'auteur tant que le ticket n'est pas pris en charge. */
export async function supprimerTicket(ticketId: string): Promise<ActionResult> {
  try {
    const user = await requireUser()
    const t = await prisma.ticket.findUnique({ where: { id: ticketId }, select: { auteurId: true, statut: true } })
    if (!t) return { success: false, error: 'Ticket introuvable' }
    const admin = await estAdmin(user.id)
    if (!admin && !(t.auteurId === user.id && t.statut === 'nouveau')) {
      return { success: false, error: 'Seul un ticket non encore pris en charge peut être supprimé par son auteur' }
    }
    await prisma.ticket.delete({ where: { id: ticketId } })
    revalider()
    return { success: true, data: undefined }
  } catch (e) {
    return erreur(e)
  }
}
