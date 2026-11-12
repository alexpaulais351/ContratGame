'use server'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth-helpers'
import { estAdmin } from '@/lib/est-admin'
import type { ActionResult } from '@/types'

/** Auth + rôle admin relu en base (jamais confiance au client ni au JWT). */
async function requireAdmin() {
  const user = await requireUser()
  if (!(await estAdmin(user.id))) throw new Error('Accès réservé aux administrateurs')
  return user
}

const zRole = z.enum(['user', 'admin'])
const zMotDePasse = z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères').max(200)
const erreur = (e: z.ZodError) => e.issues[0]?.message ?? 'Données invalides'

export async function creerCompte(data: unknown): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin()
  const parsed = z
    .object({
      name: z.string().trim().min(1, 'Nom requis').max(120),
      email: z.string().trim().toLowerCase().email('Email invalide'),
      password: zMotDePasse,
      role: zRole,
      projetIds: z.array(z.string()).default([]),
    })
    .safeParse(data)
  if (!parsed.success) return { success: false, error: erreur(parsed.error) }
  const { name, email, password, role, projetIds } = parsed.data

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } }))
    return { success: false, error: 'Un compte existe déjà avec cet email' }

  // Seuls les projets dont l'admin est lui-même membre peuvent être attribués
  const projetsAutorises = projetIds.length
    ? await prisma.projetMember.findMany({ where: { userId: admin.id, projetId: { in: projetIds } }, select: { projetId: true } })
    : []

  const user = await prisma.user.create({
    data: {
      name,
      email,
      role,
      password: await bcrypt.hash(password, 10),
      memberships: { create: projetsAutorises.map((p) => ({ projetId: p.projetId, role: 'member' })) },
    },
  })
  revalidatePath('/comptes')
  return { success: true, data: { id: user.id } }
}

export async function reinitialiserMotDePasse(userId: string, data: unknown): Promise<ActionResult> {
  await requireAdmin()
  const parsed = z.object({ password: zMotDePasse }).safeParse(data)
  if (!parsed.success) return { success: false, error: erreur(parsed.error) }
  const cible = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!cible) return { success: false, error: 'Utilisateur introuvable' }
  await prisma.user.update({ where: { id: userId }, data: { password: await bcrypt.hash(parsed.data.password, 10) } })
  revalidatePath('/comptes')
  return { success: true, data: undefined }
}

export async function changerRole(userId: string, role: unknown): Promise<ActionResult> {
  const admin = await requireAdmin()
  const parsed = zRole.safeParse(role)
  if (!parsed.success) return { success: false, error: 'Rôle invalide' }
  if (userId === admin.id && parsed.data !== 'admin')
    return { success: false, error: 'Vous ne pouvez pas retirer votre propre rôle administrateur' }

  const res = await prisma.$transaction(async (tx) => {
    const cible = await tx.user.findUnique({ where: { id: userId }, select: { role: true } })
    if (!cible) return 'Utilisateur introuvable'
    if (cible.role === 'admin' && parsed.data !== 'admin') {
      const nbAdmins = await tx.user.count({ where: { role: 'admin' } })
      if (nbAdmins <= 1) return 'Impossible de retirer le dernier administrateur'
    }
    await tx.user.update({ where: { id: userId }, data: { role: parsed.data } })
    return null
  })
  if (res) return { success: false, error: res }
  revalidatePath('/comptes')
  return { success: true, data: undefined }
}

/**
 * Supprime un compte. Les projets dont il était le seul propriétaire sont transférés
 * à l'administrateur qui supprime (sinon ils deviendraient inaccessibles).
 */
export async function supprimerCompte(userId: string): Promise<ActionResult<{ projetsTransferes: number }>> {
  const admin = await requireAdmin()
  if (userId === admin.id) return { success: false, error: 'Vous ne pouvez pas supprimer votre propre compte' }

  const res = await prisma.$transaction(async (tx) => {
    const cible = await tx.user.findUnique({
      where: { id: userId },
      select: { role: true, memberships: { where: { role: 'owner' }, select: { projetId: true } } },
    })
    if (!cible) return { erreur: 'Utilisateur introuvable' }
    if (cible.role === 'admin' && (await tx.user.count({ where: { role: 'admin' } })) <= 1)
      return { erreur: 'Impossible de supprimer le dernier administrateur' }

    let transferes = 0
    for (const { projetId } of cible.memberships) {
      const autresOwners = await tx.projetMember.count({ where: { projetId, role: 'owner', userId: { not: userId } } })
      if (autresOwners > 0) continue
      await tx.projetMember.upsert({
        where: { userId_projetId: { userId: admin.id, projetId } },
        create: { userId: admin.id, projetId, role: 'owner' },
        update: { role: 'owner' },
      })
      transferes++
    }
    await tx.user.delete({ where: { id: userId } })
    return { transferes }
  })
  if ('erreur' in res) return { success: false, error: res.erreur ?? 'Erreur' }
  revalidatePath('/comptes')
  revalidatePath('/projets')
  return { success: true, data: { projetsTransferes: res.transferes } }
}
