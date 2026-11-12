'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireMember } from '@/lib/auth-helpers'
import type { ActionResult } from '@/types'

const txt = z.string().trim().optional().nullable().transform((v) => (v ? v : null))
const stSchema = z.object({
  nom: z.string().trim().min(1, 'Nom requis'),
  contact: txt,
  telephone: txt,
  email: z.string().trim().email('Email invalide').optional().nullable().or(z.literal('')).transform((v) => (v ? v : null)),
  paiementDirect: z.boolean().default(false),
  montantMarche: z.number().finite().default(0),
  montantAS: z.number().finite().default(0),
  commentaire: txt,
})
const avenantSchema = z.object({
  numero: z.string().trim().default(''),
  libelle: z.string().trim().default(''),
  montant: z.number().finite().default(0),
  date: z.string().optional().nullable(),
})

function revalider(projetId: string) {
  revalidatePath(`/projets/${projetId}/sous-traitants`)
  revalidatePath(`/projets/${projetId}/suivi/sous-traitants`)
  revalidatePath(`/projets/${projetId}/suivi/situations`, 'layout')
}
const err = (e: unknown): { success: false; error: string } => ({
  success: false,
  error: e instanceof z.ZodError ? e.issues[0].message : e instanceof Error ? e.message : 'Erreur',
})

async function stDuProjet(projetId: string, id: string) {
  const st = await prisma.sousTraitant.findFirst({ where: { id, projetId }, select: { id: true } })
  if (!st) throw new Error('Sous-traitant introuvable')
}

export async function creerSousTraitant(projetId: string, data: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    await requireMember(projetId)
    const p = stSchema.parse(data)
    const max = await prisma.sousTraitant.aggregate({ where: { projetId }, _max: { ordre: true } })
    const st = await prisma.sousTraitant.create({ data: { projetId, ...p, ordre: (max._max.ordre ?? -1) + 1 } })
    revalider(projetId)
    return { success: true, data: { id: st.id } }
  } catch (e) { return err(e) }
}

export async function majSousTraitant(projetId: string, id: string, data: unknown): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    const p = stSchema.parse(data)
    await stDuProjet(projetId, id)
    await prisma.sousTraitant.update({ where: { id }, data: p })
    revalider(projetId)
    return { success: true, data: undefined }
  } catch (e) { return err(e) }
}

export async function supprimerSousTraitant(projetId: string, id: string): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    await stDuProjet(projetId, id)
    await prisma.sousTraitant.delete({ where: { id } })
    revalider(projetId)
    return { success: true, data: undefined }
  } catch (e) { return err(e) }
}

export async function reorderSousTraitants(projetId: string, orderedIds: string[]): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    const ids = z.array(z.string()).parse(orderedIds)
    await prisma.$transaction(
      ids.map((id, i) => prisma.sousTraitant.updateMany({ where: { id, projetId }, data: { ordre: i } })),
    )
    revalider(projetId)
    return { success: true, data: undefined }
  } catch (e) { return err(e) }
}

export async function creerAvenant(projetId: string, sousTraitantId: string, data: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    await requireMember(projetId)
    const p = avenantSchema.parse(data)
    await stDuProjet(projetId, sousTraitantId)
    const a = await prisma.avenantSousTraitant.create({
      data: { sousTraitantId, numero: p.numero, libelle: p.libelle, montant: p.montant, date: p.date ? new Date(p.date) : null },
    })
    revalider(projetId)
    return { success: true, data: { id: a.id } }
  } catch (e) { return err(e) }
}

export async function majAvenant(projetId: string, id: string, data: unknown): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    const p = avenantSchema.parse(data)
    const av = await prisma.avenantSousTraitant.findFirst({ where: { id, sousTraitant: { projetId } }, select: { id: true } })
    if (!av) throw new Error('Avenant introuvable')
    await prisma.avenantSousTraitant.update({
      where: { id },
      data: { numero: p.numero, libelle: p.libelle, montant: p.montant, date: p.date ? new Date(p.date) : null },
    })
    revalider(projetId)
    return { success: true, data: undefined }
  } catch (e) { return err(e) }
}

export async function supprimerAvenant(projetId: string, id: string): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    const r = await prisma.avenantSousTraitant.deleteMany({ where: { id, sousTraitant: { projetId } } })
    if (r.count === 0) throw new Error('Avenant introuvable')
    revalider(projetId)
    return { success: true, data: undefined }
  } catch (e) { return err(e) }
}

/** Upsert d'une facturation mensuelle ; un montant à 0 supprime la ligne. */
export async function upsertFacturation(
  projetId: string,
  sousTraitantId: string,
  annee: number,
  mois: number,
  montant: number,
): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    const p = z.object({ annee: z.number().int().min(2000).max(2100), mois: z.number().int().min(1).max(12), montant: z.number().finite() })
      .parse({ annee, mois, montant })
    await stDuProjet(projetId, sousTraitantId)
    const where = { sousTraitantId_annee_mois: { sousTraitantId, annee: p.annee, mois: p.mois } }
    if (p.montant === 0) {
      await prisma.facturationSousTraitant.deleteMany({ where: { sousTraitantId, annee: p.annee, mois: p.mois } })
    } else {
      await prisma.facturationSousTraitant.upsert({
        where,
        create: { sousTraitantId, annee: p.annee, mois: p.mois, montant: p.montant },
        update: { montant: p.montant },
      })
    }
    revalider(projetId)
    return { success: true, data: undefined }
  } catch (e) { return err(e) }
}
