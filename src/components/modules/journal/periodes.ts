/**
 * Périodes de la frise : palette (VINCI), DTO et sous-titre automatique.
 * Module pur (aucune dépendance React / DOM) : utilisable côté serveur (actions, seed) et client.
 */
import { VINCI, VINCI_SECONDAIRE } from '@/lib/design-tokens'

export type CouleursPeriode = { fond: string; bordure: string; texte: string }

/** Clés de palette d'une période (champ PeriodeFrise.couleur). */
export const COULEURS_PERIODE = {
  bleu: { fond: VINCI.bleuTresClair, bordure: VINCI.bleu, texte: VINCI.bleuFonce },
  rouge: { fond: VINCI.rougeTresClair, bordure: VINCI.rouge, texte: VINCI.rougeFonce },
  jaune: { fond: VINCI_SECONDAIRE.jaune.clair, bordure: VINCI_SECONDAIRE.jaune.base, texte: VINCI.noir },
  vert: { fond: VINCI_SECONDAIRE.vert.clair, bordure: VINCI_SECONDAIRE.vert.base, texte: VINCI.noir },
  orange: { fond: VINCI_SECONDAIRE.orange.clair, bordure: VINCI_SECONDAIRE.orange.base, texte: VINCI.noir },
  violet: { fond: VINCI_SECONDAIRE.violet.clair, bordure: VINCI_SECONDAIRE.violet.base, texte: VINCI.noir },
  bleuCiel: { fond: VINCI_SECONDAIRE.bleuMoyen.clair, bordure: VINCI_SECONDAIRE.bleuMoyen.base, texte: VINCI.bleuFonce },
  rose: { fond: VINCI_SECONDAIRE.rose.clair, bordure: VINCI_SECONDAIRE.rose.base, texte: VINCI.noir },
  gris: { fond: VINCI_SECONDAIRE.grisChaud.clair, bordure: VINCI_SECONDAIRE.grisChaud.base, texte: VINCI.texteSecondaire },
} as const satisfies Record<string, CouleursPeriode>

export type ClePeriode = keyof typeof COULEURS_PERIODE

export const CLES_PERIODE = Object.keys(COULEURS_PERIODE) as [ClePeriode, ...ClePeriode[]]

export const TEINTES_PERIODE: { cle: ClePeriode; libelle: string }[] = [
  { cle: 'bleu', libelle: 'Bleu — fait contractuel' },
  { cle: 'rouge', libelle: 'Rouge — délai / risque' },
  { cle: 'jaune', libelle: 'Jaune — phase' },
  { cle: 'vert', libelle: 'Vert — validé / réalisé' },
  { cle: 'orange', libelle: 'Orange — alerte' },
  { cle: 'violet', libelle: 'Violet' },
  { cle: 'bleuCiel', libelle: 'Bleu moyen — information' },
  { cle: 'rose', libelle: 'Rose' },
  { cle: 'gris', libelle: 'Gris — neutre / arrêt' },
]

export function couleursPeriode(cle: string): CouleursPeriode {
  return (COULEURS_PERIODE as Record<string, CouleursPeriode>)[cle] ?? COULEURS_PERIODE.bleu
}

export type PeriodeDTO = {
  id: string
  titre: string
  sousTitre: string | null
  /** 'AAAA-MM-JJ' */
  debut: string
  /** 'AAAA-MM-JJ' */
  fin: string
  couleur: string
  afficherFrise: boolean
  zoneFond: boolean
  ordre: number
}

function versUTC(jour: string) {
  const [a, m, j] = jour.slice(0, 10).split('-').map(Number)
  return Date.UTC(a, m - 1, j)
}

/** Nombre de jours (inclus) entre deux dates 'AAAA-MM-JJ'. */
export function nbJoursInclus(debut: string, fin: string): number {
  return Math.round((versUTC(fin) - versUTC(debut)) / 86_400_000) + 1
}

/** Durée lisible : « 5 jours », « 3 semaines », « 2 mois », « 2 ans ». */
export function dureeLisible(debut: string, fin: string): string {
  const n = nbJoursInclus(debut, fin)
  if (n < 14) return `${n} jour${n > 1 ? 's' : ''}`
  if (n < 45) {
    const s = Math.round(n / 7)
    return `${s} semaine${s > 1 ? 's' : ''}`
  }
  const m = Math.max(1, Math.round(n / 30.44))
  if (m >= 24 && m % 12 === 0) return `${m / 12} ans`
  return `${m} mois`
}

/** Sous-titre automatique : « 2 mois · 05/01 → 27/02/2026 » (année répétée si elle change). */
export function sousTitreAuto(debut: string, fin: string): string {
  const [a1, m1, j1] = debut.slice(0, 10).split('-')
  const [a2, m2, j2] = fin.slice(0, 10).split('-')
  const d = a1 === a2 ? `${j1}/${m1}` : `${j1}/${m1}/${a1}`
  return `${dureeLisible(debut, fin)} · ${d} → ${j2}/${m2}/${a2}`
}

/** Sous-titre affiché : celui saisi, sinon le sous-titre automatique. */
export function sousTitreAffiche(p: Pick<PeriodeDTO, 'sousTitre' | 'debut' | 'fin'>): string {
  return p.sousTitre?.trim() || sousTitreAuto(p.debut, p.fin)
}
