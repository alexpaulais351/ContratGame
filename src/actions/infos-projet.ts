'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireMember } from '@/lib/auth-helpers'
import { TOUS_MODULES } from '@/lib/modules-projet'
import type { ActionResult } from '@/types'

const opt = z.string().trim().max(1000).optional().transform((v) => (v ? v : null))
const dateOpt = z
  .string()
  .optional()
  .transform((v, ctx) => {
    if (!v) return null
    const d = new Date(v)
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: 'custom', message: 'Date invalide' })
      return z.NEVER
    }
    return d
  })

const infosSchema = z.object({
  name: z.string().trim().min(1, 'Nom du projet requis').max(200),
  description: opt,
  moaNom: opt,
  moaPrenom: opt,
  moaAdresse: opt,
  numeroAffaire: opt,
  numeroCommande: opt,
  numeroOTP: opt,
  adresseChantier: opt,
  dateDebut: dateOpt,
  dateFin: dateOpt,
})

export async function sauvegarderInfosProjet(projetId: string, data: unknown): Promise<ActionResult> {
  await requireMember(projetId)
  const parsed = infosSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }
  const { dateDebut, dateFin } = parsed.data
  if (dateDebut && dateFin && dateFin < dateDebut) return { success: false, error: 'La date de fin précède la date de début' }
  await prisma.projet.update({ where: { id: projetId }, data: parsed.data })
  revalidatePath(`/projets/${projetId}`, 'layout')
  revalidatePath('/projets')
  return { success: true, data: undefined }
}

export async function sauvegarderModulesMasques(projetId: string, masques: unknown): Promise<ActionResult> {
  await requireMember(projetId)
  const parsed = z.array(z.string()).safeParse(masques)
  if (!parsed.success) return { success: false, error: 'Données invalides' }
  const valides = new Set(TOUS_MODULES.filter((m) => m.toggleable).map((m) => m.key))
  const liste = Array.from(new Set(parsed.data)).filter((k) => valides.has(k))
  await prisma.projet.update({ where: { id: projetId }, data: { modulesMasques: liste } })
  revalidatePath(`/projets/${projetId}`, 'layout')
  return { success: true, data: undefined }
}

export async function ajouterMembre(projetId: string, email: unknown): Promise<ActionResult> {
  await requireMember(projetId)
  const parsed = z.string().trim().toLowerCase().email('Email invalide').safeParse(email)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }
  const user = await prisma.user.findUnique({ where: { email: parsed.data } })
  if (!user) return { success: false, error: 'Aucun utilisateur avec cet email' }
  const deja = await prisma.projetMember.findUnique({ where: { userId_projetId: { userId: user.id, projetId } } })
  if (deja) return { success: false, error: 'Cet utilisateur est déjà membre du projet' }
  await prisma.projetMember.create({ data: { userId: user.id, projetId, role: 'member' } })
  revalidatePath(`/projets/${projetId}/infos`)
  return { success: true, data: undefined }
}

async function nbOwners(projetId: string) {
  return prisma.projetMember.count({ where: { projetId, role: 'owner' } })
}

export async function retirerMembre(projetId: string, memberId: string): Promise<ActionResult> {
  const { member } = await requireMember(projetId)
  if (member.role !== 'owner') return { success: false, error: 'Réservé aux propriétaires' }
  const cible = await prisma.projetMember.findFirst({ where: { id: memberId, projetId } })
  if (!cible) return { success: false, error: 'Membre introuvable' }
  if (cible.role === 'owner' && (await nbOwners(projetId)) <= 1) {
    return { success: false, error: 'Impossible de retirer le dernier propriétaire' }
  }
  await prisma.projetMember.delete({ where: { id: cible.id } })
  revalidatePath(`/projets/${projetId}/infos`)
  revalidatePath('/projets')
  return { success: true, data: undefined }
}

export async function changerRoleMembre(projetId: string, memberId: string, role: unknown): Promise<ActionResult> {
  const { member } = await requireMember(projetId)
  if (member.role !== 'owner') return { success: false, error: 'Réservé aux propriétaires' }
  const parsed = z.enum(['owner', 'member']).safeParse(role)
  if (!parsed.success) return { success: false, error: 'Rôle invalide' }
  const cible = await prisma.projetMember.findFirst({ where: { id: memberId, projetId } })
  if (!cible) return { success: false, error: 'Membre introuvable' }
  if (cible.role === 'owner' && parsed.data === 'member' && (await nbOwners(projetId)) <= 1) {
    return { success: false, error: 'Il doit rester au moins un propriétaire' }
  }
  await prisma.projetMember.update({ where: { id: cible.id }, data: { role: parsed.data } })
  revalidatePath(`/projets/${projetId}/infos`)
  return { success: true, data: undefined }
}
