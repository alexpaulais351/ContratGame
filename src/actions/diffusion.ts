'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireMember } from '@/lib/auth-helpers'
import { VALEURS_ROLES, cleContact } from '@/components/modules/diffusion/contacts'
import type { ActionResult } from '@/types'

const txt = (max: number) =>
  z.string().trim().max(max).optional().nullable().transform((v) => (v ? v : null))

const contactSchema = z.object({
  organisation: z.string().trim().min(1, 'Organisation requise').max(200),
  civilite: txt(30),
  prenom: txt(100),
  nom: txt(100),
  fonction: txt(200),
  role: z.enum(VALEURS_ROLES),
  email: z.string().trim().max(200).email('E-mail invalide').optional().nullable().or(z.literal('')).transform((v) => (v ? v : null)),
  telephone: txt(50),
  adresse: txt(1000),
  destinataireParDefaut: z.boolean().default(false),
  copieParDefaut: z.boolean().default(false),
  diffusionCR: z.boolean().default(true),
  commentaire: txt(2000),
})

function revalider(projetId: string) {
  revalidatePath(`/projets/${projetId}/diffusion`)
  revalidatePath(`/projets/${projetId}/courriers`, 'layout')
}

const err = (e: unknown): { success: false; error: string } => ({
  success: false,
  error: e instanceof z.ZodError ? e.issues[0].message : e instanceof Error ? e.message : 'Erreur',
})

async function contactDuProjet(projetId: string, id: string) {
  const c = await prisma.contactDiffusion.findFirst({ where: { id, projetId }, select: { id: true } })
  if (!c) throw new Error('Contact introuvable')
}

async function ordreSuivant(projetId: string) {
  const max = await prisma.contactDiffusion.aggregate({ where: { projetId }, _max: { ordre: true } })
  return (max._max.ordre ?? -1) + 1
}

export async function creerContactDiffusion(projetId: string, data: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    await requireMember(projetId)
    const p = contactSchema.parse(data)
    const c = await prisma.contactDiffusion.create({ data: { projetId, ...p, ordre: await ordreSuivant(projetId) } })
    revalider(projetId)
    return { success: true, data: { id: c.id } }
  } catch (e) { return err(e) }
}

export async function majContactDiffusion(projetId: string, id: string, data: unknown): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    const p = contactSchema.parse(data)
    await contactDuProjet(projetId, id)
    await prisma.contactDiffusion.update({ where: { id }, data: p })
    revalider(projetId)
    return { success: true, data: undefined }
  } catch (e) { return err(e) }
}

export async function supprimerContactDiffusion(projetId: string, id: string): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    await contactDuProjet(projetId, id)
    await prisma.contactDiffusion.delete({ where: { id } })
    revalider(projetId)
    return { success: true, data: undefined }
  } catch (e) { return err(e) }
}

/** Réécrit `ordre` (0..n) dans l'ordre donné. */
export async function reorderContactsDiffusion(projetId: string, orderedIds: string[]): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    const ids = z.array(z.string()).max(1000).parse(orderedIds)
    await prisma.$transaction(
      ids.map((id, i) => prisma.contactDiffusion.updateMany({ where: { id, projetId }, data: { ordre: i } })),
    )
    revalider(projetId)
    return { success: true, data: undefined }
  } catch (e) { return err(e) }
}

/** Ajoute les sous-traitants du projet absents de la liste (rôle sous_traitant). Renvoie le nombre ajouté. */
export async function importerSousTraitantsDiffusion(projetId: string): Promise<ActionResult<{ ajoutes: number }>> {
  try {
    await requireMember(projetId)
    const [sts, existants] = await Promise.all([
      prisma.sousTraitant.findMany({ where: { projetId }, orderBy: [{ ordre: 'asc' }, { nom: 'asc' }] }),
      prisma.contactDiffusion.findMany({ where: { projetId }, select: { organisation: true } }),
    ])
    const presents = new Set(existants.map((c) => cleContact(c.organisation)))
    let ordre = await ordreSuivant(projetId)
    const aCreer = []
    for (const st of sts) {
      const cle = cleContact(st.nom)
      if (presents.has(cle)) continue
      presents.add(cle)
      const [prenom, ...reste] = (st.contact ?? '').trim().split(/\s+/).filter(Boolean)
      aCreer.push({
        projetId, organisation: st.nom, role: 'sous_traitant',
        prenom: reste.length ? prenom : null, nom: reste.length ? reste.join(' ') : prenom ?? null,
        email: st.email, telephone: st.telephone, ordre: ordre++,
      })
    }
    if (aCreer.length) await prisma.contactDiffusion.createMany({ data: aCreer })
    revalider(projetId)
    return { success: true, data: { ajoutes: aCreer.length } }
  } catch (e) { return err(e) }
}

/** Ajoute le maître d'ouvrage des infos projet s'il n'existe pas déjà (aucun contact « moa » de même organisation). */
export async function importerMoaDiffusion(projetId: string): Promise<ActionResult<{ ajoutes: number }>> {
  try {
    await requireMember(projetId)
    const projet = await prisma.projet.findUnique({
      where: { id: projetId }, select: { moaNom: true, moaPrenom: true, moaAdresse: true },
    })
    const nomMoa = projet?.moaNom?.trim()
    if (!nomMoa) return { success: false, error: "Aucun maître d'ouvrage renseigné dans les Infos du projet" }
    const prenom = projet?.moaPrenom?.trim() || null
    // MOA personne physique (prénom renseigné) : l'organisation reprend « Prénom Nom ».
    const organisation = prenom ? `${prenom} ${nomMoa}` : nomMoa
    const existants = await prisma.contactDiffusion.findMany({ where: { projetId }, select: { organisation: true, role: true } })
    const cles = new Set([cleContact(organisation), cleContact(nomMoa)])
    if (existants.some((c) => cles.has(cleContact(c.organisation)))) return { success: true, data: { ajoutes: 0 } }
    const aDejaDestinataire = await prisma.contactDiffusion.count({ where: { projetId, destinataireParDefaut: true } })
    await prisma.contactDiffusion.create({
      data: {
        projetId, organisation, role: 'moa',
        prenom: prenom ? prenom : null, nom: prenom ? nomMoa : null,
        adresse: projet?.moaAdresse?.trim() || null,
        destinataireParDefaut: aDejaDestinataire === 0,
        ordre: await ordreSuivant(projetId),
      },
    })
    revalider(projetId)
    return { success: true, data: { ajoutes: 1 } }
  } catch (e) { return err(e) }
}
