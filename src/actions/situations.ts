'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireMember } from '@/lib/auth-helpers'
import type { ActionResult } from '@/types'

function revalider(projetId: string, situationId?: string) {
  revalidatePath(`/projets/${projetId}/suivi/situations`)
  if (situationId) revalidatePath(`/projets/${projetId}/suivi/situations/${situationId}`)
  revalidatePath(`/projets/${projetId}/suivi/sous-traitants`)
}

const creationSchema = z.object({
  libelle: z.string().trim().max(200).default(''),
  annee: z.coerce.number().int().min(2000).max(2100),
  mois: z.coerce.number().int().min(1).max(12),
})

export async function creerSituation(projetId: string, data: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    await requireMember(projetId)
    const p = creationSchema.safeParse(data)
    if (!p.success) return { success: false, error: p.error.issues[0].message }
    // Numéro séquentiel = max + 1 ; retry en cas de course sur la contrainte unique.
    for (let essai = 0; essai < 3; essai++) {
      const agg = await prisma.situation.aggregate({ where: { projetId }, _max: { numero: true } })
      const numero = (agg._max.numero ?? 0) + 1
      try {
        const s = await prisma.situation.create({
          data: { projetId, numero, libelle: p.data.libelle || `Situation n°${numero}`, annee: p.data.annee, mois: p.data.mois },
        })
        revalider(projetId)
        return { success: true, data: { id: s.id } }
      } catch (e) {
        if ((e as { code?: string }).code !== 'P2002') throw e
      }
    }
    return { success: false, error: 'Impossible d\'attribuer un numéro, réessayez' }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function modifierSituation(projetId: string, situationId: string, data: unknown): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    const p = creationSchema.partial().safeParse(data)
    if (!p.success) return { success: false, error: p.error.issues[0].message }
    const s = await prisma.situation.findFirst({ where: { id: situationId, projetId } })
    if (!s) return { success: false, error: 'Situation introuvable' }
    if (s.statut === 'validee') return { success: false, error: 'Situation validée : lecture seule' }
    await prisma.situation.update({ where: { id: situationId }, data: p.data })
    revalider(projetId, situationId)
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function changerStatutSituation(projetId: string, situationId: string, statut: 'brouillon' | 'validee'): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    if (statut !== 'brouillon' && statut !== 'validee') return { success: false, error: 'Statut invalide' }
    const r = await prisma.situation.updateMany({ where: { id: situationId, projetId }, data: { statut } })
    if (r.count === 0) return { success: false, error: 'Situation introuvable' }
    revalider(projetId, situationId)
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

const quantitesSchema = z
  .array(z.object({ ligneDEId: z.string().min(1), quantite: z.number().finite() }))
  .max(5000)

/** Upsert de la quantité cumulée ; prixUnitaire = snapshot du PU courant de la ligne DE. */
export async function enregistrerQuantites(projetId: string, situationId: string, items: unknown): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    const p = quantitesSchema.safeParse(items)
    if (!p.success) return { success: false, error: 'Données invalides' }
    const s = await prisma.situation.findFirst({ where: { id: situationId, projetId } })
    if (!s) return { success: false, error: 'Situation introuvable' }
    if (s.statut === 'validee') return { success: false, error: 'Situation validée : lecture seule' }
    const lignesDE = await prisma.ligneDE.findMany({
      where: { projetId, estChapitre: false, id: { in: p.data.map((i) => i.ligneDEId) } },
      select: { id: true, prixUnitaire: true },
    })
    const pu = new Map(lignesDE.map((l) => [l.id, l.prixUnitaire]))
    const valides = p.data.filter((i) => pu.has(i.ligneDEId))
    await prisma.$transaction(
      valides.map((i) =>
        prisma.ligneSituation.upsert({
          where: { situationId_ligneDEId: { situationId, ligneDEId: i.ligneDEId } },
          create: { situationId, ligneDEId: i.ligneDEId, quantite: i.quantite, prixUnitaire: pu.get(i.ligneDEId)! },
          update: { quantite: i.quantite, prixUnitaire: pu.get(i.ligneDEId)! },
        }),
      ),
    )
    // Pas de revalidatePath de la page détail : l'état client fait foi pendant la saisie
    // (évite un re-rendu serveur qui écraserait la saisie en cours). La liste, elle, est mise à jour.
    revalidatePath(`/projets/${projetId}/suivi/situations`)
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function supprimerSituation(projetId: string, situationId: string): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    await prisma.$transaction(async (tx) => {
      const s = await tx.situation.findFirst({ where: { id: situationId, projetId } })
      if (!s) throw new Error('Situation introuvable')
      await tx.situation.delete({ where: { id: situationId } })
      const autre = await tx.situation.count({ where: { projetId, annee: s.annee, mois: s.mois } })
      if (autre === 0) {
        await tx.facturationSousTraitant.deleteMany({
          where: { annee: s.annee, mois: s.mois, sousTraitant: { projetId } },
        })
      }
    })
    revalider(projetId)
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

const avancementsSchema = z.array(z.object({ prixNouveauId: z.string().min(1), avancement: z.number().finite().min(0).max(1000) })).max(500)

/** Enregistre l'avancement cumulé (%) des prix nouveaux (OS reçu) dans une situation ; fige le montant de référence. */
export async function enregistrerAvancementsPN(projetId: string, situationId: string, data: unknown): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    const items = avancementsSchema.parse(data)
    const s = await prisma.situation.findFirst({ where: { id: situationId, projetId } })
    if (!s) return { success: false, error: 'Situation introuvable' }
    if (s.statut === 'validee') return { success: false, error: 'Situation validée : lecture seule' }
    const pns = await prisma.prixNouveau.findMany({ where: { projetId, id: { in: items.map((i) => i.prixNouveauId) } } })
    const parId = new Map(pns.map((p) => [p.id, p]))
    await prisma.$transaction(
      items
        .filter((i) => parId.has(i.prixNouveauId))
        .map((i) => {
          const p = parId.get(i.prixNouveauId)!
          const montantBase = p.montantAccepte ?? p.montantPresente
          return prisma.ligneSituationPN.upsert({
            where: { situationId_prixNouveauId: { situationId, prixNouveauId: i.prixNouveauId } },
            create: { situationId, prixNouveauId: i.prixNouveauId, avancement: i.avancement, montantBase },
            update: { avancement: i.avancement, montantBase },
          })
        }),
    )
    // pas de revalidation de la page détail (évite d'écraser la saisie en cours) : liste seulement
    revalidatePath(`/projets/${projetId}/suivi/situations`)
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: e instanceof z.ZodError ? e.issues[0].message : (e as Error).message }
  }
}
