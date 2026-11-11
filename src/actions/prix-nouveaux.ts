'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireMember } from '@/lib/auth-helpers'
import type { ActionResult } from '@/types'

const STATUTS = ['a_venir', 'en_cours', 'accepte', 'refuse'] as const

const champsSchema = z
  .object({
    numero: z.string().max(100),
    intitule: z.string().max(500),
    dateDevis: z.string().nullable(),
    montantPresente: z.number().finite(),
    montantAccepte: z.number().finite().nullable(),
    debourseReel: z.number().finite().nullable(),
    numeroOS: z.string().max(100).nullable(),
    dateOS: z.string().nullable(),
    delaiSupplementaire: z.string().max(200).nullable(),
    potentielAcceptation: z.number().int().min(0).max(100),
    statut: z.enum(STATUTS),
    commentaire: z.string().max(5000).nullable(),
  })
  .partial()

function versDate(s: string | null | undefined): Date | null | undefined {
  if (s === undefined) return undefined
  if (!s) return null
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

function path(projetId: string) {
  return `/projets/${projetId}/suivi/prix-nouveaux`
}

export async function creerPrixNouveau(projetId: string): Promise<ActionResult<{ id: string }>> {
  try {
    await requireMember(projetId)
    const max = await prisma.prixNouveau.aggregate({ where: { projetId }, _max: { ordre: true } })
    const pn = await prisma.prixNouveau.create({
      data: { projetId, ordre: (max._max.ordre ?? -1) + 1 },
    })
    revalidatePath(path(projetId))
    return { success: true, data: { id: pn.id } }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Erreur' }
  }
}

export async function modifierPrixNouveau(projetId: string, id: string, data: unknown): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    const parsed = champsSchema.safeParse(data)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }
    const { dateDevis, dateOS, ...reste } = parsed.data
    const res = await prisma.prixNouveau.updateMany({
      where: { id, projetId },
      data: { ...reste, dateDevis: versDate(dateDevis), dateOS: versDate(dateOS) },
    })
    if (res.count === 0) return { success: false, error: 'Prix nouveau introuvable' }
    revalidatePath(path(projetId))
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Erreur' }
  }
}

export async function supprimerPrixNouveau(projetId: string, id: string): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    await prisma.prixNouveau.deleteMany({ where: { id, projetId } })
    revalidatePath(path(projetId))
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Erreur' }
  }
}

export async function reorderPrixNouveaux(projetId: string, orderedIds: string[]): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    const ids = z.array(z.string()).parse(orderedIds)
    const existants = await prisma.prixNouveau.findMany({ where: { projetId }, select: { id: true } })
    const set = new Set(existants.map((e) => e.id))
    const valides = ids.filter((i) => set.has(i))
    await prisma.$transaction(
      valides.map((id, ordre) => prisma.prixNouveau.update({ where: { id }, data: { ordre } })),
    )
    revalidatePath(path(projetId))
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Erreur' }
  }
}
