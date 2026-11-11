'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireMember, requireUser } from '@/lib/auth-helpers'
import { couleursCategorie } from '@/lib/design-tokens'
import { CATEGORIES_SYSTEME } from '@/lib/categories-systeme'
import type { ActionResult } from '@/types'


export async function creerProjet(data: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser()
  const parsed = z.object({ name: z.string().trim().min(1, 'Nom requis'), description: z.string().optional() }).safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }
  const projet = await prisma.projet.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      members: { create: { userId: user.id, role: 'owner' } },
      categories: {
        create: CATEGORIES_SYSTEME.map((c) => ({ nom: c.nom, estSysteme: true, ...couleursCategorie(c.cle) })),
      },
    },
  })
  revalidatePath('/projets')
  return { success: true, data: { id: projet.id } }
}

export async function supprimerProjet(projetId: string): Promise<ActionResult> {
  const { member } = await requireMember(projetId)
  if (member.role !== 'owner') return { success: false, error: 'Seul le propriétaire peut supprimer le projet' }
  await prisma.projet.delete({ where: { id: projetId } })
  revalidatePath('/projets')
  redirect('/projets')
}
