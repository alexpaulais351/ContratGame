import { VINCI_SECONDAIRE, couleursCategorie } from '@/lib/design-tokens'
import { formatNombreFR } from '@/lib/utils'
import type { CategorieDTO, FichierMeta } from '@/actions/journal'

export type { CategorieDTO, FichierMeta }

export type EvenementDTO = {
  id: string
  /** 'AAAA-MM-JJ' */
  jour: string
  titre: string
  description: string | null
  categorie: string
  categorieId: string | null
  afficherFrise: boolean
  source: string | null
  courrierId: string | null
  fichiers: FichierMeta[]
}

/** Événement proposé à l'import dans la fiche écart. */
export type EvenementImportable = {
  id: string
  jour: string
  titre: string
  description: string | null
  categorie: string | null
  couleur: string | null
}

export type CouleursCategorie = Pick<CategorieDTO, 'couleurBg' | 'couleurBorder' | 'couleurText' | 'couleurPoint'>

/** Couleurs neutres (gris chaud VINCI) pour un événement sans catégorie. */
export const COULEURS_SANS_CATEGORIE: CouleursCategorie = couleursCategorie('grisChaud')

export const SANS_CATEGORIE = '__sans__'

export function couleursDe(ev: Pick<EvenementDTO, 'categorieId'>, categories: CategorieDTO[]): CouleursCategorie {
  return categories.find((c) => c.id === ev.categorieId) ?? COULEURS_SANS_CATEGORIE
}

export function nomCategorie(ev: Pick<EvenementDTO, 'categorieId' | 'categorie'>, categories: CategorieDTO[]): string {
  return categories.find((c) => c.id === ev.categorieId)?.nom ?? (ev.categorie || 'Sans catégorie')
}

/** 'AAAA-MM-JJ' → 'JJ/MM/AAAA' */
export function jourFR(jour: string): string {
  const [a, m, j] = jour.slice(0, 10).split('-')
  return `${j}/${m}/${a}`
}

/** Date (ISO) → 'AAAA-MM-JJ' en heure locale */
export function versJour(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const TEINTES: { cle: keyof typeof VINCI_SECONDAIRE; libelle: string }[] = [
  { cle: 'vert', libelle: 'Vert' },
  { cle: 'vertVif', libelle: 'Vert vif' },
  { cle: 'bleuMoyen', libelle: 'Bleu moyen' },
  { cle: 'bleuCiel', libelle: 'Bleu ciel' },
  { cle: 'jaune', libelle: 'Jaune doré' },
  { cle: 'orange', libelle: 'Orange brun' },
  { cle: 'rose', libelle: 'Rose' },
  { cle: 'violet', libelle: 'Violet' },
  { cle: 'grisChaud', libelle: 'Gris chaud' },
]

export const TAILLE_MAX_FICHIER = 5 * 1024 * 1024

export function formatTaille(octets: number): string {
  if (octets < 1024) return `${octets} o`
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`
  return `${formatNombreFR(octets / (1024 * 1024), 1)} Mo`
}
