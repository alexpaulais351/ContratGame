'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireMember } from '@/lib/auth-helpers'
import { prochaineReference } from '@/lib/courriers-templates'
import type { ActionResult } from '@/types'

function revalider(projetId: string) {
  revalidatePath(`/projets/${projetId}/courriers`)
  revalidatePath(`/projets/${projetId}/suivi/journal`)
}

const champsSchema = z.object({
  reference: z.string().trim().max(100),
  objet: z.string().max(500),
  type: z.string().max(50),
  destinataire: z.string().max(2000),
  expediteur: z.string().max(2000),
  corps: z.string().max(100000),
  lieu: z.string().max(200),
  modeEnvoi: z.string().max(50),
  copies: z.string().max(2000),
  signataireNom: z.string().max(200),
  signataireFonction: z.string().max(200),
  statut: z.enum(['brouillon', 'envoye']),
  dateEnvoi: z.string().nullable(),
})

const nullable = (s: string | undefined) => (s === undefined ? undefined : s.trim() === '' ? null : s)

function parseDate(s: string | null | undefined): Date | null | undefined {
  if (s === undefined) return undefined
  if (!s) return null
  const d = new Date(s.length === 10 ? s + 'T12:00:00.000Z' : s)
  return Number.isNaN(d.getTime()) ? null : d
}

async function courrierDuProjet(projetId: string, id: string) {
  return prisma.courrierChantier.findFirst({ where: { id, projetId } })
}

export async function referenceSuivante(projetId: string): Promise<string> {
  await requireMember(projetId)
  const annee = new Date().getFullYear()
  const existants = await prisma.courrierChantier.findMany({
    where: { projetId, reference: { startsWith: `CR-${annee}-` } },
    select: { reference: true },
  })
  return prochaineReference(existants.map((c) => c.reference), annee)
}

export async function creerCourrier(projetId: string, data: unknown): Promise<ActionResult<{ id: string }>> {
  await requireMember(projetId)
  const parsed = champsSchema.partial().safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }
  const d = parsed.data
  const reference = d.reference?.trim() || (await referenceSuivante(projetId))
  const c = await prisma.courrierChantier.create({
    data: {
      projetId,
      reference,
      objet: d.objet ?? '',
      type: d.type ?? 'libre',
      destinataire: d.destinataire ?? '',
      expediteur: d.expediteur ?? '',
      corps: d.corps ?? '',
      lieu: nullable(d.lieu),
      modeEnvoi: nullable(d.modeEnvoi),
      copies: nullable(d.copies),
      signataireNom: nullable(d.signataireNom),
      signataireFonction: nullable(d.signataireFonction),
      statut: 'brouillon',
    },
  })
  revalider(projetId)
  return { success: true, data: { id: c.id } }
}

export async function majCourrier(projetId: string, id: string, data: unknown): Promise<ActionResult> {
  await requireMember(projetId)
  const parsed = champsSchema.partial().safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }
  if (!(await courrierDuProjet(projetId, id))) return { success: false, error: 'Courrier introuvable' }
  const d = parsed.data
  await prisma.courrierChantier.update({
    where: { id },
    data: {
      reference: d.reference,
      objet: d.objet,
      type: d.type,
      destinataire: d.destinataire,
      expediteur: d.expediteur,
      corps: d.corps,
      lieu: nullable(d.lieu),
      modeEnvoi: nullable(d.modeEnvoi),
      copies: nullable(d.copies),
      signataireNom: nullable(d.signataireNom),
      signataireFonction: nullable(d.signataireFonction),
      statut: d.statut,
      dateEnvoi: parseDate(d.dateEnvoi),
    },
  })
  revalider(projetId)
  return { success: true, data: undefined }
}

export async function supprimerCourrier(projetId: string, id: string): Promise<ActionResult> {
  await requireMember(projetId)
  if (!(await courrierDuProjet(projetId, id))) return { success: false, error: 'Courrier introuvable' }
  await prisma.courrierChantier.delete({ where: { id } })
  revalider(projetId)
  return { success: true, data: undefined }
}

/** Crée (ou met à jour s'il existe déjà) l'événement Journal lié au courrier. */
async function assurerEvenement(projetId: string, courrier: { id: string; reference: string; objet: string }, date: Date) {
  const titre = `Courrier ${courrier.reference} : ${courrier.objet}`
  const existant = await prisma.evenementChantier.findFirst({ where: { projetId, courrierId: courrier.id } })
  if (existant) {
    await prisma.evenementChantier.update({ where: { id: existant.id }, data: { date, titre } })
    return existant.id
  }
  const cat = await prisma.categorieEvenement.findUnique({ where: { projetId_nom: { projetId, nom: 'Contrat' } } })
  const ev = await prisma.evenementChantier.create({
    data: {
      projetId,
      date,
      titre,
      categorie: 'Contrat',
      categorieId: cat?.id ?? null,
      afficherFrise: true,
      source: 'courrier',
      courrierId: courrier.id,
    },
  })
  return ev.id
}

const envoyeSchema = z.object({
  dateEnvoi: z.string().optional(),
  creerEvenement: z.boolean().default(true),
})

export async function marquerEnvoye(projetId: string, id: string, data: unknown): Promise<ActionResult<{ dateEnvoi: string; evenementId: string | null }>> {
  await requireMember(projetId)
  const parsed = envoyeSchema.safeParse(data ?? {})
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }
  const courrier = await courrierDuProjet(projetId, id)
  if (!courrier) return { success: false, error: 'Courrier introuvable' }
  const date = parseDate(parsed.data.dateEnvoi) ?? new Date()
  const maj = await prisma.courrierChantier.update({ where: { id }, data: { statut: 'envoye', dateEnvoi: date } })
  let evenementId: string | null = null
  if (parsed.data.creerEvenement) evenementId = await assurerEvenement(projetId, maj, date)
  else evenementId = (await prisma.evenementChantier.findFirst({ where: { projetId, courrierId: id }, select: { id: true } }))?.id ?? null
  revalider(projetId)
  return { success: true, data: { dateEnvoi: date.toISOString(), evenementId } }
}

/** Pour un courrier déjà envoyé sans événement : ajoute (une seule fois) l'événement au Journal. */
export async function ajouterAuJournal(projetId: string, id: string): Promise<ActionResult<{ evenementId: string }>> {
  await requireMember(projetId)
  const courrier = await courrierDuProjet(projetId, id)
  if (!courrier) return { success: false, error: 'Courrier introuvable' }
  if (courrier.statut !== 'envoye' || !courrier.dateEnvoi) return { success: false, error: 'Le courrier doit être envoyé' }
  const evenementId = await assurerEvenement(projetId, courrier, courrier.dateEnvoi)
  revalider(projetId)
  return { success: true, data: { evenementId } }
}

export async function repasserBrouillon(projetId: string, id: string): Promise<ActionResult> {
  await requireMember(projetId)
  if (!(await courrierDuProjet(projetId, id))) return { success: false, error: 'Courrier introuvable' }
  await prisma.courrierChantier.update({ where: { id }, data: { statut: 'brouillon' } })
  revalider(projetId)
  return { success: true, data: undefined }
}
