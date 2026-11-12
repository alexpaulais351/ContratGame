'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireMember } from '@/lib/auth-helpers'
import { CLES_PERIODE, type PeriodeDTO } from '@/components/modules/journal/periodes'
import type { ActionResult } from '@/types'

/** Périodes de la frise chronologique du journal (barres sur une plage de dates). */

function revalider(projetId: string) {
  revalidatePath(`/projets/${projetId}/suivi/journal`)
}

function erreur(e: unknown): { success: false; error: string } {
  if (e instanceof z.ZodError) return { success: false, error: e.issues[0]?.message ?? 'Données invalides' }
  return { success: false, error: e instanceof Error ? e.message : 'Erreur inattendue' }
}

/** 'AAAA-MM-JJ' → Date à midi UTC (même jour quel que soit le fuseau). */
function versDate(jour: string): Date {
  return new Date(`${jour.slice(0, 10)}T12:00:00.000Z`)
}

const jourSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide')

const periodeSchema = z
  .object({
    titre: z.string().trim().min(1, 'Titre requis').max(120, 'Titre trop long'),
    sousTitre: z.string().trim().max(160, 'Sous-titre trop long').optional().nullable(),
    debut: jourSchema,
    fin: jourSchema,
    couleur: z.enum(CLES_PERIODE),
    afficherFrise: z.boolean().default(true),
    zoneFond: z.boolean().default(false),
  })
  .refine((d) => d.fin >= d.debut, { message: 'La date de fin doit être postérieure ou égale à la date de début', path: ['fin'] })

function versDTO(p: {
  id: string
  titre: string
  sousTitre: string | null
  dateDebut: Date
  dateFin: Date
  couleur: string
  afficherFrise: boolean
  zoneFond: boolean
  ordre: number
}): PeriodeDTO {
  return {
    id: p.id,
    titre: p.titre,
    sousTitre: p.sousTitre,
    debut: p.dateDebut.toISOString().slice(0, 10),
    fin: p.dateFin.toISOString().slice(0, 10),
    couleur: p.couleur,
    afficherFrise: p.afficherFrise,
    zoneFond: p.zoneFond,
    ordre: p.ordre,
  }
}

export async function creerPeriode(projetId: string, data: unknown): Promise<ActionResult<PeriodeDTO>> {
  try {
    await requireMember(projetId)
    const d = periodeSchema.parse(data)
    const dernier = await prisma.periodeFrise.aggregate({ where: { projetId }, _max: { ordre: true } })
    const p = await prisma.periodeFrise.create({
      data: {
        projetId,
        titre: d.titre,
        sousTitre: d.sousTitre || null,
        dateDebut: versDate(d.debut),
        dateFin: versDate(d.fin),
        couleur: d.couleur,
        afficherFrise: d.afficherFrise,
        zoneFond: d.zoneFond,
        ordre: (dernier._max.ordre ?? -1) + 1,
      },
    })
    revalider(projetId)
    return { success: true, data: versDTO(p) }
  } catch (e) {
    return erreur(e)
  }
}

export async function modifierPeriode(projetId: string, id: string, data: unknown): Promise<ActionResult<PeriodeDTO>> {
  try {
    await requireMember(projetId)
    const existe = await prisma.periodeFrise.findFirst({ where: { id, projetId }, select: { id: true } })
    if (!existe) return { success: false, error: 'Période introuvable' }
    const d = periodeSchema.parse(data)
    const p = await prisma.periodeFrise.update({
      where: { id },
      data: {
        titre: d.titre,
        sousTitre: d.sousTitre || null,
        dateDebut: versDate(d.debut),
        dateFin: versDate(d.fin),
        couleur: d.couleur,
        afficherFrise: d.afficherFrise,
        zoneFond: d.zoneFond,
      },
    })
    revalider(projetId)
    return { success: true, data: versDTO(p) }
  } catch (e) {
    return erreur(e)
  }
}

export async function supprimerPeriode(projetId: string, id: string): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    const existe = await prisma.periodeFrise.findFirst({ where: { id, projetId }, select: { id: true } })
    if (!existe) return { success: false, error: 'Période introuvable' }
    await prisma.periodeFrise.delete({ where: { id } })
    revalider(projetId)
    return { success: true, data: undefined }
  } catch (e) {
    return erreur(e)
  }
}
