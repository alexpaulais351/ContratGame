'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth-helpers'
import type { ActionResult } from '@/types'

const opt = z.string().trim().max(500).optional().transform((v) => (v ? v : null))

const profilSchema = z.object({
  name: z.string().trim().min(1, 'Nom requis').max(200),
  email: z.string().trim().toLowerCase().email('Email invalide'),
  logoSociete: z
    .string()
    .max(1_600_000, 'Logo trop volumineux')
    .refine((v) => v.startsWith('data:image/'), 'Format de logo invalide')
    .nullable()
    .optional(),
  nomSociete: opt,
  adresseSociete: opt,
  telSociete: opt,
  faxSociete: opt,
  certifications: z.string().trim().max(2000).optional().transform((v) => (v ? v : null)),
})

export type ProfilSauvegarde = {
  nom: string
  email: string
  logoSociete: string | null
  nomSociete: string | null
  adresseSociete: string | null
  telSociete: string | null
  faxSociete: string | null
  certifications: string | null
}

export async function sauvegarderProfil(data: unknown): Promise<ActionResult<ProfilSauvegarde>> {
  const user = await requireUser()
  const parsed = profilSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }
  const p = parsed.data
  const existant = await prisma.user.findUnique({ where: { email: p.email } })
  if (existant && existant.id !== user.id) return { success: false, error: 'Cet email est déjà utilisé' }
  const u = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: p.name,
      email: p.email,
      logoSociete: p.logoSociete ?? null,
      nomSociete: p.nomSociete,
      adresseSociete: p.adresseSociete,
      telSociete: p.telSociete,
      faxSociete: p.faxSociete,
      certifications: p.certifications,
    },
  })
  revalidatePath('/', 'layout')
  return {
    success: true,
    data: {
      nom: u.name,
      email: u.email,
      logoSociete: u.logoSociete,
      nomSociete: u.nomSociete,
      adresseSociete: u.adresseSociete,
      telSociete: u.telSociete,
      faxSociete: u.faxSociete,
      certifications: u.certifications,
    },
  }
}

export async function changerMotDePasse(data: unknown): Promise<ActionResult> {
  const user = await requireUser()
  const parsed = z
    .object({
      ancien: z.string().min(1, 'Ancien mot de passe requis'),
      nouveau: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères').max(200),
    })
    .safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }
  const u = await prisma.user.findUnique({ where: { id: user.id } })
  if (!u) return { success: false, error: 'Utilisateur introuvable' }
  if (!(await bcrypt.compare(parsed.data.ancien, u.password))) return { success: false, error: 'Ancien mot de passe incorrect' }
  await prisma.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash(parsed.data.nouveau, 10) } })
  return { success: true, data: undefined }
}
