'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireMember } from '@/lib/auth-helpers'
import { formatDateFR } from '@/lib/utils'
import type { ActionResult } from '@/types'

export type LigneFicheEcartDTO = {
  id: string
  evenementId: string | null
  etude: string
  prevuDCE: string
  phaseTransitoire: string
  exe: string
  impacts: string
  delaisImpactes: string
  coutImpactes: string
  ordre: number
  chapitre: string | null
  estChapitre: boolean
}

const SELECT = {
  id: true,
  evenementId: true,
  etude: true,
  prevuDCE: true,
  phaseTransitoire: true,
  exe: true,
  impacts: true,
  delaisImpactes: true,
  coutImpactes: true,
  ordre: true,
  chapitre: true,
  estChapitre: true,
} as const

function revalider(projetId: string) {
  revalidatePath(`/projets/${projetId}/suivi/journal/fiche-ecart`)
}

function erreur(e: unknown): { success: false; error: string } {
  if (e instanceof z.ZodError) return { success: false, error: e.issues[0]?.message ?? 'Données invalides' }
  return { success: false, error: e instanceof Error ? e.message : 'Erreur inattendue' }
}

async function prochainOrdre(projetId: string) {
  const max = await prisma.ligneFicheEcart.aggregate({ where: { projetId }, _max: { ordre: true } })
  return (max._max.ordre ?? -1) + 1
}

const champTexte = z.string().max(20000)
const patchSchema = z
  .object({
    etude: champTexte,
    prevuDCE: champTexte,
    phaseTransitoire: champTexte,
    exe: champTexte,
    impacts: champTexte,
    delaisImpactes: champTexte,
    coutImpactes: champTexte,
  })
  .partial()

export async function ajouterLigneFicheEcart(projetId: string, data: unknown): Promise<ActionResult<LigneFicheEcartDTO>> {
  try {
    await requireMember(projetId)
    const d = z.object({ estChapitre: z.boolean().default(false), etude: z.string().max(500).optional() }).parse(data ?? {})
    const ligne = await prisma.ligneFicheEcart.create({
      data: {
        projetId,
        estChapitre: d.estChapitre,
        etude: d.etude ?? (d.estChapitre ? 'Nouveau chapitre' : ''),
        chapitre: d.estChapitre ? d.etude ?? 'Nouveau chapitre' : null,
        ordre: await prochainOrdre(projetId),
      },
      select: SELECT,
    })
    revalider(projetId)
    return { success: true, data: ligne }
  } catch (e) {
    return erreur(e)
  }
}

export async function modifierLigneFicheEcart(projetId: string, id: string, data: unknown): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    const ligne = await prisma.ligneFicheEcart.findFirst({ where: { id, projetId }, select: { estChapitre: true } })
    if (!ligne) return { success: false, error: 'Ligne introuvable' }
    const d = patchSchema.parse(data)
    await prisma.ligneFicheEcart.update({
      where: { id },
      data: { ...d, ...(ligne.estChapitre && d.etude !== undefined ? { chapitre: d.etude } : {}) },
    })
    revalider(projetId)
    return { success: true, data: undefined }
  } catch (e) {
    return erreur(e)
  }
}

export async function supprimerLigneFicheEcart(projetId: string, id: string): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    const r = await prisma.ligneFicheEcart.deleteMany({ where: { id, projetId } })
    if (r.count === 0) return { success: false, error: 'Ligne introuvable' }
    revalider(projetId)
    return { success: true, data: undefined }
  } catch (e) {
    return erreur(e)
  }
}

export async function reordonnerFicheEcart(projetId: string, orderedIds: unknown): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    const ids = z.array(z.string()).parse(orderedIds)
    const existants = await prisma.ligneFicheEcart.findMany({ where: { projetId, id: { in: ids } }, select: { id: true } })
    if (existants.length !== ids.length) return { success: false, error: 'Lignes invalides' }
    await prisma.$transaction(ids.map((id, ordre) => prisma.ligneFicheEcart.update({ where: { id }, data: { ordre } })))
    revalider(projetId)
    return { success: true, data: undefined }
  } catch (e) {
    return erreur(e)
  }
}

/** Une ligne par événement : etude = "titre (date)", evenementId ; les événements déjà importés sont ignorés. */
export async function importerDepuisJournal(projetId: string, evenementIds: unknown): Promise<ActionResult<LigneFicheEcartDTO[]>> {
  try {
    await requireMember(projetId)
    const ids = z.array(z.string()).min(1, 'Aucun événement sélectionné').parse(evenementIds)
    const deja = await prisma.ligneFicheEcart.findMany({
      where: { projetId, evenementId: { in: ids } },
      select: { evenementId: true },
    })
    const exclus = new Set(deja.map((l) => l.evenementId))
    const evenements = await prisma.evenementChantier.findMany({
      where: { projetId, id: { in: ids.filter((id) => !exclus.has(id)) } },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, titre: true, date: true },
    })
    if (evenements.length === 0) return { success: false, error: 'Ces événements sont déjà importés' }
    let ordre = await prochainOrdre(projetId)
    const creees = await prisma.$transaction(
      evenements.map((ev) =>
        prisma.ligneFicheEcart.create({
          data: { projetId, evenementId: ev.id, etude: `${ev.titre} (${formatDateFR(ev.date)})`, ordre: ordre++ },
          select: SELECT,
        }),
      ),
    )
    revalider(projetId)
    return { success: true, data: creees }
  } catch (e) {
    return erreur(e)
  }
}
