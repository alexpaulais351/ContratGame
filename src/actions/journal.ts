'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireMember } from '@/lib/auth-helpers'
import { VINCI_SECONDAIRE, couleursCategorie, type CleSecondaire } from '@/lib/design-tokens'
import type { ActionResult } from '@/types'

/** Taille maximale d'une pièce jointe (octets du fichier d'origine). */
const TAILLE_MAX_FICHIER = 5 * 1024 * 1024
const TYPES_AUTORISES = /^(image\/(png|jpe?g|gif|webp)|application\/pdf)$/

function revalider(projetId: string) {
  revalidatePath(`/projets/${projetId}/suivi/journal`)
  revalidatePath(`/projets/${projetId}/suivi/journal/fiche-ecart`)
}

function erreur(e: unknown): { success: false; error: string } {
  if (e instanceof z.ZodError) return { success: false, error: e.issues[0]?.message ?? 'Données invalides' }
  return { success: false, error: e instanceof Error ? e.message : 'Erreur inattendue' }
}

/** 'AAAA-MM-JJ' → Date à midi UTC (même jour quel que soit le fuseau). */
function versDate(jour: string): Date {
  return new Date(`${jour.slice(0, 10)}T12:00:00.000Z`)
}

async function evenementDuProjet(projetId: string, id: string) {
  return prisma.evenementChantier.findFirst({ where: { id, projetId }, select: { id: true } })
}

const evenementSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide'),
  titre: z.string().trim().min(1, 'Titre requis').max(300, 'Titre trop long'),
  description: z.string().max(20000).optional().nullable(),
  categorieId: z.string().optional().nullable(),
  afficherFrise: z.boolean().default(true),
})

async function resoudreCategorie(projetId: string, categorieId: string | null | undefined) {
  if (!categorieId) return { categorieId: null, categorie: '' }
  const cat = await prisma.categorieEvenement.findFirst({ where: { id: categorieId, projetId } })
  if (!cat) throw new Error('Catégorie introuvable')
  return { categorieId: cat.id, categorie: cat.nom }
}

export async function creerEvenement(projetId: string, data: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    await requireMember(projetId)
    const d = evenementSchema.parse(data)
    const cat = await resoudreCategorie(projetId, d.categorieId)
    const ev = await prisma.evenementChantier.create({
      data: {
        projetId,
        date: versDate(d.date),
        titre: d.titre,
        description: d.description?.trim() || null,
        afficherFrise: d.afficherFrise,
        ...cat,
      },
    })
    revalider(projetId)
    return { success: true, data: { id: ev.id } }
  } catch (e) {
    return erreur(e)
  }
}

export async function modifierEvenement(projetId: string, id: string, data: unknown): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    if (!(await evenementDuProjet(projetId, id))) return { success: false, error: 'Événement introuvable' }
    const d = evenementSchema.parse(data)
    const cat = await resoudreCategorie(projetId, d.categorieId)
    await prisma.evenementChantier.update({
      where: { id },
      data: {
        date: versDate(d.date),
        titre: d.titre,
        description: d.description?.trim() || null,
        afficherFrise: d.afficherFrise,
        ...cat,
      },
    })
    revalider(projetId)
    return { success: true, data: undefined }
  } catch (e) {
    return erreur(e)
  }
}

export async function basculerAffichageFrise(projetId: string, id: string, afficher: boolean): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    if (!(await evenementDuProjet(projetId, id))) return { success: false, error: 'Événement introuvable' }
    await prisma.evenementChantier.update({ where: { id }, data: { afficherFrise: z.boolean().parse(afficher) } })
    revalider(projetId)
    return { success: true, data: undefined }
  } catch (e) {
    return erreur(e)
  }
}

export async function supprimerEvenement(projetId: string, id: string): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    if (!(await evenementDuProjet(projetId, id))) return { success: false, error: 'Événement introuvable' }
    await prisma.evenementChantier.delete({ where: { id } })
    revalider(projetId)
    return { success: true, data: undefined }
  } catch (e) {
    return erreur(e)
  }
}

// ---------------------------------------------------------------------------
// Pièces jointes (base64, images et PDF)
// ---------------------------------------------------------------------------

const fichierSchema = z.object({
  nom: z.string().trim().min(1).max(255),
  type: z.string().regex(TYPES_AUTORISES, 'Seules les images (PNG, JPEG, GIF, WebP) et les PDF sont acceptés'),
  /** data URL "data:<type>;base64,..." */
  contenu: z.string().startsWith('data:', 'Contenu invalide'),
  taille: z.number().int().positive().max(TAILLE_MAX_FICHIER, 'Fichier trop volumineux (5 Mo maximum)'),
})

export type FichierMeta = { id: string; nom: string; type: string; taille: number }

export async function ajouterFichierEvenement(projetId: string, evenementId: string, data: unknown): Promise<ActionResult<FichierMeta>> {
  try {
    await requireMember(projetId)
    if (!(await evenementDuProjet(projetId, evenementId))) return { success: false, error: 'Événement introuvable' }
    const f = fichierSchema.parse(data)
    // contrôle de cohérence taille déclarée / contenu
    const base64 = f.contenu.slice(f.contenu.indexOf(',') + 1)
    if (Math.floor((base64.length * 3) / 4) > TAILLE_MAX_FICHIER + 4) return { success: false, error: 'Fichier trop volumineux (5 Mo maximum)' }
    const cree = await prisma.fichierEvenement.create({
      data: { evenementId, nom: f.nom, type: f.type, contenu: f.contenu, taille: f.taille },
      select: { id: true, nom: true, type: true, taille: true },
    })
    revalider(projetId)
    return { success: true, data: cree }
  } catch (e) {
    return erreur(e)
  }
}

export async function supprimerFichierEvenement(projetId: string, fichierId: string): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    const f = await prisma.fichierEvenement.findFirst({ where: { id: fichierId, evenement: { projetId } }, select: { id: true } })
    if (!f) return { success: false, error: 'Pièce jointe introuvable' }
    await prisma.fichierEvenement.delete({ where: { id: fichierId } })
    revalider(projetId)
    return { success: true, data: undefined }
  } catch (e) {
    return erreur(e)
  }
}

/** Lecture (pas une mutation) : contenu d'une pièce jointe en data URL, chargé à la demande. */
export async function lireFichierEvenement(projetId: string, fichierId: string): Promise<ActionResult<{ contenu: string; type: string; nom: string }>> {
  try {
    await requireMember(projetId)
    const f = await prisma.fichierEvenement.findFirst({
      where: { id: fichierId, evenement: { projetId } },
      select: { contenu: true, type: true, nom: true },
    })
    if (!f) return { success: false, error: 'Pièce jointe introuvable' }
    const contenu = f.contenu.startsWith('data:') ? f.contenu : `data:${f.type};base64,${f.contenu}`
    return { success: true, data: { contenu, type: f.type, nom: f.nom } }
  } catch (e) {
    return erreur(e)
  }
}

// ---------------------------------------------------------------------------
// Catégories
// ---------------------------------------------------------------------------

const cles = Object.keys(VINCI_SECONDAIRE) as [CleSecondaire, ...CleSecondaire[]]
const categorieSchema = z.object({
  nom: z.string().trim().min(1, 'Nom requis').max(60, 'Nom trop long'),
  cle: z.enum(cles),
})

export type CategorieDTO = {
  id: string
  nom: string
  couleurBg: string
  couleurBorder: string
  couleurText: string
  couleurPoint: string
  estSysteme: boolean
}

export async function creerCategorie(projetId: string, data: unknown): Promise<ActionResult<CategorieDTO>> {
  try {
    await requireMember(projetId)
    const d = categorieSchema.parse(data)
    const existe = await prisma.categorieEvenement.findFirst({ where: { projetId, nom: { equals: d.nom, mode: 'insensitive' } } })
    if (existe) return { success: false, error: 'Une catégorie porte déjà ce nom' }
    const cat = await prisma.categorieEvenement.create({
      data: { projetId, nom: d.nom, estSysteme: false, ...couleursCategorie(d.cle) },
      select: { id: true, nom: true, couleurBg: true, couleurBorder: true, couleurText: true, couleurPoint: true, estSysteme: true },
    })
    revalider(projetId)
    return { success: true, data: cat }
  } catch (e) {
    return erreur(e)
  }
}

export async function supprimerCategorie(projetId: string, id: string): Promise<ActionResult> {
  try {
    await requireMember(projetId)
    const cat = await prisma.categorieEvenement.findFirst({ where: { id, projetId } })
    if (!cat) return { success: false, error: 'Catégorie introuvable' }
    if (cat.estSysteme) return { success: false, error: 'Les catégories système ne peuvent pas être supprimées' }
    await prisma.$transaction([
      // les événements perdent leur catégorie (categorieId → null via SetNull) : on vide aussi le libellé
      prisma.evenementChantier.updateMany({ where: { projetId, categorieId: id }, data: { categorie: '' } }),
      prisma.categorieEvenement.delete({ where: { id } }),
    ])
    revalider(projetId)
    return { success: true, data: undefined }
  } catch (e) {
    return erreur(e)
  }
}
