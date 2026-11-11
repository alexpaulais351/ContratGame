'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireMember } from '@/lib/auth-helpers'
import type { ActionResult } from '@/types'
import { lireRepartition, type CoTraitantClient, type LigneDEClient } from '@/components/modules/detail-estimatif/types'

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

function revalider(projetId: string) {
  revalidatePath(`/projets/${projetId}/detail-estimatif`)
  revalidatePath(`/projets/${projetId}/detail-estimatif/cotraitance`)
}

function messageErreur(e: unknown): string {
  if (e instanceof z.ZodError) return e.issues[0]?.message ?? 'Données invalides'
  if (e instanceof Error) return e.message
  return 'Erreur inattendue'
}

type LigneDB = {
  id: string
  code: string
  designation: string
  unite: string
  quantite: number
  prixUnitaire: number
  estChapitre: boolean
  repartition: Prisma.JsonValue
  ordre: number
}

function versClient(l: LigneDB): LigneDEClient {
  return {
    id: l.id,
    code: l.code,
    designation: l.designation,
    unite: l.unite,
    quantite: l.quantite,
    prixUnitaire: l.prixUnitaire,
    estChapitre: l.estChapitre,
    repartition: lireRepartition(l.repartition),
    ordre: l.ordre,
  }
}

const nombre = z.number().finite()

// ---------------------------------------------------------------------------
// Lignes DE
// ---------------------------------------------------------------------------

const schemaCreation = z.object({
  apresId: z.string().min(1).nullable().optional(),
  estChapitre: z.boolean().default(false),
  designation: z.string().max(1000).optional(),
})

/** Crée une ligne (ou un chapitre) après la ligne `apresId`, ou en fin de tableau. */
export async function creerLigneDE(projetId: string, data: unknown): Promise<ActionResult<LigneDEClient>> {
  try {
    await requireMember(projetId)
    const parsed = schemaCreation.parse(data)
    const ligne = await prisma.$transaction(async (tx) => {
      let ordre: number
      if (parsed.apresId) {
        const ref = await tx.ligneDE.findFirst({ where: { id: parsed.apresId, projetId }, select: { ordre: true } })
        if (!ref) throw new Error('Ligne de référence introuvable')
        await tx.ligneDE.updateMany({ where: { projetId, ordre: { gt: ref.ordre } }, data: { ordre: { increment: 1 } } })
        ordre = ref.ordre + 1
      } else {
        const max = await tx.ligneDE.aggregate({ where: { projetId }, _max: { ordre: true } })
        ordre = (max._max.ordre ?? -1) + 1
      }
      return tx.ligneDE.create({
        data: {
          projetId,
          ordre,
          estChapitre: parsed.estChapitre,
          designation: parsed.designation ?? (parsed.estChapitre ? 'Nouveau chapitre' : ''),
        },
      })
    })
    revalider(projetId)
    return { success: true, data: versClient(ligne) }
  } catch (e) {
    return { success: false, error: messageErreur(e) }
  }
}

const schemaPatch = z
  .object({
    code: z.string().max(50),
    designation: z.string().max(1000),
    unite: z.string().max(20),
    quantite: nombre,
    prixUnitaire: nombre,
  })
  .partial()

/** Met à jour une ou plusieurs cellules d'une ligne (auto-save). */
export async function updateLigneDE(projetId: string, ligneId: string, patch: unknown): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    const data = schemaPatch.parse(patch)
    const res = await prisma.ligneDE.updateMany({ where: { id: ligneId, projetId }, data })
    if (res.count === 0) return { success: false, error: 'Ligne introuvable' }
    revalider(projetId)
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: messageErreur(e) }
  }
}

/** Supprime une ligne DE (les lignes de situation liées sont supprimées en cascade). */
export async function supprimerLigneDE(projetId: string, ligneId: string): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    const res = await prisma.ligneDE.deleteMany({ where: { id: ligneId, projetId } })
    if (res.count === 0) return { success: false, error: 'Ligne introuvable' }
    revalider(projetId)
    revalidatePath(`/projets/${projetId}/suivi/situations`, 'layout')
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: messageErreur(e) }
  }
}

/** Réécrit `ordre` selon l'ordre fourni (glisser-déposer), dans une transaction. */
export async function reorderLignesDE(projetId: string, orderedIds: unknown): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    const ids = z.array(z.string().min(1)).parse(orderedIds)
    const existantes = await prisma.ligneDE.findMany({ where: { projetId }, select: { id: true, ordre: true } })
    const ordreActuel = new Map(existantes.map((l) => [l.id, l.ordre]))
    if (ids.length !== existantes.length || new Set(ids).size !== ids.length || ids.some((id) => !ordreActuel.has(id))) {
      return { success: false, error: 'Liste de lignes incohérente, rechargez la page' }
    }
    // N'écrit que les lignes dont l'ordre change (fluide même avec 500+ lignes).
    const majs = ids
      .map((id, index) => ({ id, index }))
      .filter(({ id, index }) => ordreActuel.get(id) !== index)
      .map(({ id, index }) => prisma.ligneDE.update({ where: { id }, data: { ordre: index } }))
    if (majs.length > 0) await prisma.$transaction(majs)
    revalider(projetId)
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: messageErreur(e) }
  }
}

// ---------------------------------------------------------------------------
// Co-traitance
// ---------------------------------------------------------------------------

/** Enregistre la répartition du PU d'une ligne entre co-traitants. */
export async function updateRepartitionLigneDE(projetId: string, ligneId: string, repartition: unknown): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    const rep = z.record(z.string().min(1), nombre).parse(repartition)
    const res = await prisma.ligneDE.updateMany({
      where: { id: ligneId, projetId, estChapitre: false },
      data: { repartition: rep as Prisma.InputJsonValue },
    })
    if (res.count === 0) return { success: false, error: 'Ligne introuvable' }
    revalider(projetId)
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: messageErreur(e) }
  }
}

/**
 * Pour chaque ligne (ou les lignes `ligneIds`), affecte au mandataire le reste
 * du PU non réparti (PU − Σ parts des autres co-traitants).
 */
export async function repartirResteAuMandataire(
  projetId: string,
  ligneIds?: unknown,
): Promise<ActionResult<{ id: string; repartition: Record<string, number> }[]>> {
  try {
    await requireMember(projetId)
    const ids = ligneIds === undefined ? null : z.array(z.string().min(1)).parse(ligneIds)
    const cotraitants = await prisma.coTraitant.findMany({ where: { projetId } })
    const mandataire = cotraitants.find((c) => c.estMandataire)
    if (!mandataire) return { success: false, error: 'Aucun mandataire déclaré' }
    const autres = cotraitants.filter((c) => !c.estMandataire).map((c) => c.id)
    const lignes = await prisma.ligneDE.findMany({
      where: { projetId, estChapitre: false, ...(ids ? { id: { in: ids } } : {}) },
      select: { id: true, prixUnitaire: true, repartition: true },
    })
    const resultats: { id: string; repartition: Record<string, number> }[] = []
    const majs: Prisma.PrismaPromise<unknown>[] = []
    for (const l of lignes) {
      const rep = lireRepartition(l.repartition) ?? {}
      const sommeAutres = autres.reduce((s, id) => s + (rep[id] ?? 0), 0)
      const reste = Math.round((l.prixUnitaire - sommeAutres) * 10000) / 10000
      if (rep[mandataire.id] === reste) continue
      const nouvelle = { ...rep, [mandataire.id]: reste }
      resultats.push({ id: l.id, repartition: nouvelle })
      majs.push(prisma.ligneDE.update({ where: { id: l.id }, data: { repartition: nouvelle } }))
    }
    if (majs.length > 0) await prisma.$transaction(majs)
    revalider(projetId)
    return { success: true, data: resultats }
  } catch (e) {
    return { success: false, error: messageErreur(e) }
  }
}

function versCoTraitantClient(c: { id: string; nom: string; estMandataire: boolean; ordre: number }): CoTraitantClient {
  return { id: c.id, nom: c.nom, estMandataire: c.estMandataire, ordre: c.ordre }
}

const schemaCoTraitant = z.object({
  nom: z.string().trim().min(1, 'Nom requis').max(200),
  estMandataire: z.boolean().optional(),
})

export async function creerCoTraitant(projetId: string, data: unknown): Promise<ActionResult<CoTraitantClient[]>> {
  try {
    await requireMember(projetId)
    const parsed = schemaCoTraitant.parse(data)
    const liste = await prisma.$transaction(async (tx) => {
      const existants = await tx.coTraitant.findMany({ where: { projetId } })
      // Le premier co-traitant devient mandataire par défaut ; un seul mandataire.
      const estMandataire = parsed.estMandataire ?? existants.length === 0
      if (estMandataire) await tx.coTraitant.updateMany({ where: { projetId }, data: { estMandataire: false } })
      const maxOrdre = existants.reduce((m, c) => Math.max(m, c.ordre), -1)
      await tx.coTraitant.create({ data: { projetId, nom: parsed.nom, estMandataire, ordre: maxOrdre + 1 } })
      return tx.coTraitant.findMany({ where: { projetId }, orderBy: { ordre: 'asc' } })
    })
    revalider(projetId)
    return { success: true, data: liste.map(versCoTraitantClient) }
  } catch (e) {
    return { success: false, error: messageErreur(e) }
  }
}

export async function updateCoTraitant(projetId: string, coTraitantId: string, data: unknown): Promise<ActionResult<CoTraitantClient[]>> {
  try {
    await requireMember(projetId)
    const parsed = schemaCoTraitant.partial().parse(data)
    const liste = await prisma.$transaction(async (tx) => {
      const ct = await tx.coTraitant.findFirst({ where: { id: coTraitantId, projetId } })
      if (!ct) throw new Error('Co-traitant introuvable')
      if (parsed.estMandataire === true) {
        await tx.coTraitant.updateMany({ where: { projetId, NOT: { id: coTraitantId } }, data: { estMandataire: false } })
      }
      await tx.coTraitant.update({ where: { id: coTraitantId }, data: parsed })
      return tx.coTraitant.findMany({ where: { projetId }, orderBy: { ordre: 'asc' } })
    })
    revalider(projetId)
    return { success: true, data: liste.map(versCoTraitantClient) }
  } catch (e) {
    return { success: false, error: messageErreur(e) }
  }
}

/** Supprime un co-traitant et retire sa part des répartitions des lignes. */
export async function supprimerCoTraitant(projetId: string, coTraitantId: string): Promise<ActionResult<CoTraitantClient[]>> {
  try {
    await requireMember(projetId)
    const liste = await prisma.$transaction(async (tx) => {
      const ct = await tx.coTraitant.findFirst({ where: { id: coTraitantId, projetId } })
      if (!ct) throw new Error('Co-traitant introuvable')
      await tx.coTraitant.delete({ where: { id: coTraitantId } })
      const lignes = await tx.ligneDE.findMany({ where: { projetId, NOT: { repartition: { equals: Prisma.AnyNull } } }, select: { id: true, repartition: true } })
      for (const l of lignes) {
        const rep = lireRepartition(l.repartition)
        if (rep && coTraitantId in rep) {
          delete rep[coTraitantId]
          await tx.ligneDE.update({ where: { id: l.id }, data: { repartition: rep } })
        }
      }
      const restants = await tx.coTraitant.findMany({ where: { projetId }, orderBy: { ordre: 'asc' } })
      // Conserver un mandataire si le mandataire a été supprimé.
      if (ct.estMandataire && restants.length > 0) {
        await tx.coTraitant.update({ where: { id: restants[0].id }, data: { estMandataire: true } })
        restants[0] = { ...restants[0], estMandataire: true }
      }
      return restants
    })
    revalider(projetId)
    return { success: true, data: liste.map(versCoTraitantClient) }
  } catch (e) {
    return { success: false, error: messageErreur(e) }
  }
}

/** Réordonne les co-traitants (ordre des colonnes). */
export async function reorderCoTraitants(projetId: string, orderedIds: unknown): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    const ids = z.array(z.string().min(1)).parse(orderedIds)
    const existants = await prisma.coTraitant.findMany({ where: { projetId }, select: { id: true } })
    const setExistants = new Set(existants.map((c) => c.id))
    if (ids.length !== existants.length || ids.some((id) => !setExistants.has(id))) {
      return { success: false, error: 'Liste de co-traitants incohérente' }
    }
    await prisma.$transaction(ids.map((id, ordre) => prisma.coTraitant.update({ where: { id }, data: { ordre } })))
    revalider(projetId)
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: messageErreur(e) }
  }
}
