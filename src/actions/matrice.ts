'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireMember } from '@/lib/auth-helpers'
import type { ActionResult } from '@/types'
import { DECISIONS, ORDRE_SECTIONS, bidCompParDefaut, criteresDuGabarit, lireBidComp } from '@/lib/matrice-bidcomp'
import { versCritereVue, versFournisseurVue, type CritereVue, type FournisseurVue } from '@/components/modules/matrice/types'

// ───────────────────────────── helpers ─────────────────────────────

function revalider(projetId: string, matriceId?: string) {
  revalidatePath(`/projets/${projetId}/matrice`)
  if (matriceId) revalidatePath(`/projets/${projetId}/matrice/${matriceId}`)
}

function erreur(e: unknown): { success: false; error: string } {
  if (e instanceof z.ZodError) return { success: false, error: e.issues[0]?.message ?? 'Données invalides' }
  return { success: false, error: e instanceof Error ? e.message : 'Erreur inattendue' }
}

/** Vérifie que la matrice appartient bien au projet. */
async function matriceDuProjet(projetId: string, matriceId: string) {
  const m = await prisma.matriceDecisionnelle.findFirst({ where: { id: matriceId, projetId }, select: { id: true, bidComp: true } })
  if (!m) throw new Error('Matrice introuvable')
  return m
}

const texteOpt = z
  .string()
  .trim()
  .max(500)
  .nullable()
  .optional()
  .transform((v) => (v ? v : null))
const nombreOpt = z
  .number()
  .finite()
  .nullable()
  .optional()
  .transform((v) => (v === undefined ? null : v))
const decision = z.enum(['go', 'no_go', 'en_attente'])
const typeCritere = z.enum(['note_1_3', 'texte', 'booleen', 'montant'])
const statut = z.enum(['brouillon', 'en_cours', 'finalisee'])

const bidCompSchema = z.object({
  typologieAchat: z.string().max(100).default(''),
  dateEtablissement: z.string().nullable().default(null),
  synthese: z.object({
    opportunites: z.string().max(10000).default(''),
    risques: z.string().max(10000).default(''),
    recommandation: z.string().max(10000).default(''),
  }),
  fournisseurRecommandeId: z.string().nullable().default(null),
})

const enteteSchema = z.object({
  titre: z.string().trim().min(1, 'Titre requis').max(200),
  acheteur: texteOpt,
  site: texteOpt,
  familleAchats: texteOpt,
  budgetTheorique: nombreOpt,
  devise: z.string().trim().min(1).max(10).default('EUR'),
  seuilGo: z.number().min(0).max(100),
  statut,
})

const fournisseurSchema = z.object({
  id: z.string().min(1),
  nom: z.string().trim().max(200),
  rang: z.number().int().min(0),
  refOffre: texteOpt,
  dateOffre: z
    .string()
    .nullable()
    .optional()
    .transform((v) => {
      if (!v) return null
      const d = new Date(v)
      return Number.isNaN(d.getTime()) ? null : d
    }),
  paysFabrication: texteOpt,
  incoterm: texteOpt,
  montantOffre: nombreOpt,
  decision,
})

const critereSchema = z.object({
  id: z.string().min(1),
  libelle: z.string().trim().min(1, 'Libellé requis').max(300),
  coefficient: z.number().min(0).max(100),
  type: typeCritere,
})

const notationSchema = z.object({
  critereId: z.string().min(1),
  fournisseurId: z.string().min(1),
  note: z.number().int().min(1).max(3).nullable(),
  valeurTexte: z.string().max(5000).nullable(),
  valeurBool: z.boolean().nullable(),
  commentaire: z.string().max(5000).nullable(),
  estNonConformiteMajeure: z.boolean(),
  estNonConformiteNegociable: z.boolean(),
})

const enregistrementSchema = z.object({
  entete: enteteSchema.optional(),
  bidComp: bidCompSchema.optional(),
  fournisseurs: z.array(fournisseurSchema).max(50).optional(),
  criteres: z.array(critereSchema).max(500).optional(),
  notations: z.array(notationSchema).max(5000).optional(),
})

// ───────────────────────────── liste ─────────────────────────────

export async function creerMatrice(projetId: string, data: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    await requireMember(projetId)
    const p = z
      .object({
        titre: z.string().trim().min(1, 'Titre requis').max(200),
        familleAchats: texteOpt,
        acheteur: texteOpt,
        site: texteOpt,
        typologieAchat: z.string().max(100).optional(),
        nbFournisseurs: z.number().int().min(0).max(10).default(3),
      })
      .parse(data)
    const bidComp = { ...bidCompParDefaut(), typologieAchat: p.typologieAchat || 'Fourniture', dateEtablissement: new Date().toISOString().slice(0, 10) }
    const m = await prisma.matriceDecisionnelle.create({
      data: {
        projetId,
        titre: p.titre,
        familleAchats: p.familleAchats,
        acheteur: p.acheteur,
        site: p.site,
        bidComp,
        criteres: { create: criteresDuGabarit() },
        fournisseurs: {
          create: Array.from({ length: p.nbFournisseurs }, (_, i) => ({
            nom: `Fournisseur ${i + 1}`,
            rang: i + 1,
            decision: 'en_attente',
            couleurDecision: DECISIONS.en_attente.couleur,
          })),
        },
      },
    })
    revalider(projetId)
    return { success: true, data: { id: m.id } }
  } catch (e) {
    return erreur(e)
  }
}

export async function dupliquerMatrice(projetId: string, matriceId: string): Promise<ActionResult<{ id: string }>> {
  try {
    await requireMember(projetId)
    const src = await prisma.matriceDecisionnelle.findFirst({
      where: { id: matriceId, projetId },
      include: { fournisseurs: true, criteres: { include: { notations: true } } },
    })
    if (!src) throw new Error('Matrice introuvable')
    const id = await prisma.$transaction(async (tx) => {
      const bc = lireBidComp(src.bidComp)
      const copie = await tx.matriceDecisionnelle.create({
        data: {
          projetId,
          titre: `${src.titre} (copie)`,
          acheteur: src.acheteur,
          site: src.site,
          familleAchats: src.familleAchats,
          budgetTheorique: src.budgetTheorique,
          devise: src.devise,
          seuilGo: src.seuilGo,
          statut: 'brouillon',
          bidComp: bc,
        },
      })
      const mapF = new Map<string, string>()
      for (const f of src.fournisseurs) {
        const { id: ancien, matriceId: _m, ...reste } = f
        const n = await tx.fournisseurCandidat.create({ data: { ...reste, matriceId: copie.id } })
        mapF.set(ancien, n.id)
      }
      const notations: Prisma.NotationCritereCreateManyInput[] = []
      for (const c of src.criteres) {
        const n = await tx.critere.create({
          data: { matriceId: copie.id, famille: c.famille, libelle: c.libelle, coefficient: c.coefficient, type: c.type, ordre: c.ordre },
        })
        for (const nt of c.notations) {
          const fid = mapF.get(nt.fournisseurId)
          if (!fid) continue
          const { id: _i, critereId: _c, fournisseurId: _f, ...val } = nt
          notations.push({ ...val, critereId: n.id, fournisseurId: fid })
        }
      }
      if (notations.length) await tx.notationCritere.createMany({ data: notations })
      if (bc.fournisseurRecommandeId) {
        await tx.matriceDecisionnelle.update({
          where: { id: copie.id },
          data: { bidComp: { ...bc, fournisseurRecommandeId: mapF.get(bc.fournisseurRecommandeId) ?? null } },
        })
      }
      return copie.id
    })
    revalider(projetId)
    return { success: true, data: { id } }
  } catch (e) {
    return erreur(e)
  }
}

export async function supprimerMatrice(projetId: string, matriceId: string): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    await matriceDuProjet(projetId, matriceId)
    await prisma.matriceDecisionnelle.delete({ where: { id: matriceId } })
    revalider(projetId)
    return { success: true, data: undefined }
  } catch (e) {
    return erreur(e)
  }
}

// ───────────────────────────── détail : auto-save ─────────────────────────────

/** Enregistrement groupé (auto-save 500 ms) : en-tête, bidComp, fournisseurs, critères, notations. */
export async function enregistrerMatrice(projetId: string, matriceId: string, data: unknown): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    await matriceDuProjet(projetId, matriceId)
    const p = enregistrementSchema.parse(data)
    const ids = await prisma.matriceDecisionnelle.findUniqueOrThrow({
      where: { id: matriceId },
      select: { fournisseurs: { select: { id: true } }, criteres: { select: { id: true } } },
    })
    const fIds = new Set(ids.fournisseurs.map((f) => f.id))
    const cIds = new Set(ids.criteres.map((c) => c.id))
    const ops: Prisma.PrismaPromise<unknown>[] = []

    if (p.entete || p.bidComp) {
      const bidComp = p.bidComp
        ? { version: 1, ...p.bidComp, fournisseurRecommandeId: p.bidComp.fournisseurRecommandeId && fIds.has(p.bidComp.fournisseurRecommandeId) ? p.bidComp.fournisseurRecommandeId : null }
        : undefined
      ops.push(prisma.matriceDecisionnelle.update({ where: { id: matriceId }, data: { ...(p.entete ?? {}), ...(bidComp ? { bidComp } : {}) } }))
    }
    for (const f of p.fournisseurs ?? []) {
      if (!fIds.has(f.id)) continue
      const { id, ...val } = f
      ops.push(prisma.fournisseurCandidat.update({ where: { id }, data: { ...val, nom: val.nom || 'Fournisseur', couleurDecision: DECISIONS[val.decision].couleur } }))
    }
    for (const c of p.criteres ?? []) {
      if (!cIds.has(c.id)) continue
      const { id, ...val } = c
      ops.push(prisma.critere.update({ where: { id }, data: val }))
    }
    for (const n of p.notations ?? []) {
      if (!cIds.has(n.critereId) || !fIds.has(n.fournisseurId)) continue
      const { critereId, fournisseurId, ...val } = n
      const valeurs = { ...val, estNonConformiteNegociable: val.estNonConformiteMajeure ? false : val.estNonConformiteNegociable }
      ops.push(
        prisma.notationCritere.upsert({
          where: { critereId_fournisseurId: { critereId, fournisseurId } },
          create: { critereId, fournisseurId, ...valeurs },
          update: valeurs,
        }),
      )
    }
    if (ops.length) await prisma.$transaction(ops)
    revalider(projetId, matriceId)
    return { success: true, data: undefined }
  } catch (e) {
    return erreur(e)
  }
}

// ───────────────────────────── fournisseurs ─────────────────────────────

export async function ajouterFournisseur(projetId: string, matriceId: string, nom?: string): Promise<ActionResult<FournisseurVue>> {
  try {
    await requireMember(projetId)
    await matriceDuProjet(projetId, matriceId)
    const n = z.string().trim().max(200).optional().parse(nom)
    const agg = await prisma.fournisseurCandidat.aggregate({ where: { matriceId }, _max: { rang: true }, _count: true })
    if (agg._count >= 20) throw new Error('20 fournisseurs maximum par matrice')
    const rang = (agg._max.rang ?? 0) + 1
    const f = await prisma.fournisseurCandidat.create({
      data: { matriceId, nom: n || `Fournisseur ${rang}`, rang, decision: 'en_attente', couleurDecision: DECISIONS.en_attente.couleur },
    })
    revalider(projetId, matriceId)
    return { success: true, data: versFournisseurVue(f) }
  } catch (e) {
    return erreur(e)
  }
}

export async function supprimerFournisseur(projetId: string, matriceId: string, fournisseurId: string): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    const m = await matriceDuProjet(projetId, matriceId)
    const f = await prisma.fournisseurCandidat.findFirst({ where: { id: fournisseurId, matriceId } })
    if (!f) throw new Error('Fournisseur introuvable')
    const bc = lireBidComp(m.bidComp)
    await prisma.$transaction([
      prisma.fournisseurCandidat.delete({ where: { id: fournisseurId } }),
      ...(bc.fournisseurRecommandeId === fournisseurId
        ? [prisma.matriceDecisionnelle.update({ where: { id: matriceId }, data: { bidComp: { ...bc, fournisseurRecommandeId: null } } })]
        : []),
    ])
    revalider(projetId, matriceId)
    return { success: true, data: undefined }
  } catch (e) {
    return erreur(e)
  }
}

/** Réordonne les colonnes fournisseurs (rang = position). */
export async function reordonnerFournisseurs(projetId: string, matriceId: string, ordre: unknown): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    await matriceDuProjet(projetId, matriceId)
    const idsOrdonnes = z.array(z.string()).max(50).parse(ordre)
    const existants = new Set((await prisma.fournisseurCandidat.findMany({ where: { matriceId }, select: { id: true } })).map((f) => f.id))
    await prisma.$transaction(
      idsOrdonnes.filter((id) => existants.has(id)).map((id, i) => prisma.fournisseurCandidat.update({ where: { id }, data: { rang: i + 1 } })),
    )
    revalider(projetId, matriceId)
    return { success: true, data: undefined }
  } catch (e) {
    return erreur(e)
  }
}

// ───────────────────────────── critères ─────────────────────────────

export async function ajouterCritere(projetId: string, matriceId: string, data: unknown): Promise<ActionResult<CritereVue>> {
  try {
    await requireMember(projetId)
    await matriceDuProjet(projetId, matriceId)
    const p = z
      .object({
        famille: z.string().min(1).max(50),
        libelle: z.string().trim().min(1, 'Libellé requis').max(300),
        type: typeCritere,
        coefficient: z.number().min(0).max(100),
      })
      .parse(data)
    const criteres = await prisma.critere.findMany({ where: { matriceId }, select: { famille: true, ordre: true } })
    if (criteres.length >= 300) throw new Error('300 critères maximum')
    // Insérer à la fin de la section (ordre global : sections du gabarit puis familles libres).
    const rangSection = (f: string) => {
      const i = ORDRE_SECTIONS.indexOf(f)
      return i === -1 ? ORDRE_SECTIONS.length : i
    }
    const rs = rangSection(p.famille)
    const avant = criteres.filter((c) => rangSection(c.famille) <= rs)
    const ordre = avant.length ? Math.max(...avant.map((c) => c.ordre)) + 1 : 0
    const c = await prisma.$transaction(async (tx) => {
      await tx.critere.updateMany({ where: { matriceId, ordre: { gte: ordre } }, data: { ordre: { increment: 1 } } })
      return tx.critere.create({ data: { matriceId, ...p, coefficient: p.type === 'note_1_3' ? p.coefficient : 0, ordre } })
    })
    revalider(projetId, matriceId)
    return { success: true, data: versCritereVue(c) }
  } catch (e) {
    return erreur(e)
  }
}

export async function supprimerCritere(projetId: string, matriceId: string, critereId: string): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    await matriceDuProjet(projetId, matriceId)
    const c = await prisma.critere.findFirst({ where: { id: critereId, matriceId } })
    if (!c) throw new Error('Critère introuvable')
    await prisma.critere.delete({ where: { id: critereId } })
    revalider(projetId, matriceId)
    return { success: true, data: undefined }
  } catch (e) {
    return erreur(e)
  }
}
