// Helpers purs partagés par l'éditeur, l'export Excel et le PDF.
import { DECISIONS, LIBELLES_NOTES, ORDRE_SECTIONS, SECTIONS_MONTANTS, libelleSection, lireMontant } from '@/lib/matrice-bidcomp'
import { formatDateFR, formatNombreFR } from '@/lib/utils'
import { calculerScores, indexerNotations, meilleurFournisseur, scoreMaximum, totalMontants, type ScoreFournisseur } from './scores'
import type { CritereVue, MatriceVue, NotationVue } from './types'

export type SectionGrille = { cle: string; libelle: string; criteres: CritereVue[]; avecSousTotal: boolean }

export const cleNotation = (critereId: string, fournisseurId: string) => `${critereId}:${fournisseurId}`

/** Critères groupés par section (ordre du gabarit, puis familles libres). */
export function grouperParSection(criteres: CritereVue[]): SectionGrille[] {
  const familles = new Set(criteres.map((c) => c.famille))
  const ordre = [...ORDRE_SECTIONS, ...[...familles].filter((f) => !ORDRE_SECTIONS.includes(f))]
  return ordre.map((cle) => ({
    cle,
    libelle: libelleSection(cle),
    criteres: criteres.filter((c) => c.famille === cle).sort((a, b) => a.ordre - b.ordre),
    avecSousTotal: (SECTIONS_MONTANTS as readonly string[]).includes(cle),
  }))
}

export type AnalyseMatrice = {
  scores: Map<string, ScoreFournisseur>
  meilleurId: string | null
  index: Map<string, NotationVue>
  sousTotaux: Map<string, Map<string, number | null>> // famille → fournisseur → total
  maximum: number
}

export function analyserMatrice(m: Pick<MatriceVue, 'criteres' | 'fournisseurs' | 'notations' | 'seuilGo'>): AnalyseMatrice {
  const scores = calculerScores(
    m.criteres,
    m.fournisseurs.map((f) => f.id),
    m.notations,
    m.seuilGo,
  )
  const index = indexerNotations(m.notations)
  const sousTotaux = new Map<string, Map<string, number | null>>()
  for (const fam of SECTIONS_MONTANTS) {
    sousTotaux.set(fam, new Map(m.fournisseurs.map((f) => [f.id, totalMontants(m.criteres, index, f.id, fam)])))
  }
  const maximum = scoreMaximum(m.criteres)
  return { scores, meilleurId: meilleurFournisseur(scores), index, sousTotaux, maximum }
}

/** Valeur affichable d'une cellule (exports). */
export function texteCellule(c: CritereVue, n: NotationVue | undefined, devise = 'EUR'): string {
  if (!n) return ''
  switch (c.type) {
    case 'note_1_3':
      return n.note ? String(n.note) : ''
    case 'booleen':
      return n.valeurBool === null ? '' : n.valeurBool ? 'Oui' : 'Non'
    case 'montant': {
      const v = lireMontant(n.valeurTexte)
      return v === null ? '' : `${formatNombreFR(v, 2)} ${symboleDevise(devise)}`
    }
    default:
      return n.valeurTexte ?? ''
  }
}

export function symboleDevise(devise: string): string {
  return { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF' }[devise] ?? devise
}

export function formatMontantDevise(v: number | null | undefined, devise: string): string {
  if (v === null || v === undefined) return ''
  return `${formatNombreFR(v, 2)} ${symboleDevise(devise)}`
}

export function libelleDecision(d: string): string {
  return DECISIONS[d as keyof typeof DECISIONS]?.label ?? d
}

export { LIBELLES_NOTES, formatDateFR }
