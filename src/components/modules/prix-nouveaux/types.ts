import type { StatutPrixNouveau } from '@/types'
import { SEMANTIQUE, type Semantique } from '@/lib/design-tokens'

export type PrixNouveauDTO = {
  id: string
  numero: string
  intitule: string
  dateDevis: string // YYYY-MM-DD ou ''
  montantPresente: number
  montantAccepte: number | null
  debourseReel: number | null
  numeroOS: string
  dateOS: string
  delaiSupplementaire: string
  potentielAcceptation: number
  statut: string
  commentaire: string
}

export const STATUTS: { value: StatutPrixNouveau; label: string; sem: Semantique }[] = [
  { value: 'a_venir', label: 'À venir', sem: 'neutre' },
  { value: 'en_cours', label: 'En cours', sem: 'info' },
  { value: 'accepte', label: 'Accepté', sem: 'succes' },
  { value: 'refuse', label: 'Refusé', sem: 'danger' },
]

export function statutInfo(statut: string) {
  return STATUTS.find((s) => s.value === statut) ?? STATUTS[0]
}

/** >=75 vert, 50-74 bleu moyen, 25-49 jaune, <25 orange/rouge */
export function potentielSemantique(p: number): Semantique {
  if (p >= 75) return 'succes'
  if (p >= 50) return 'info'
  if (p >= 25) return 'avertissement'
  return 'alerte'
}

export function couleursSem(s: Semantique) {
  return SEMANTIQUE[s]
}

export function ponderé(l: Pick<PrixNouveauDTO, 'montantPresente' | 'potentielAcceptation'>) {
  return (l.montantPresente * l.potentielAcceptation) / 100
}

export function marge(l: Pick<PrixNouveauDTO, 'montantAccepte' | 'debourseReel'>): number | null {
  if (l.montantAccepte == null || l.debourseReel == null) return null
  return l.montantAccepte - l.debourseReel
}

export function totaux(lignes: PrixNouveauDTO[]) {
  return lignes.reduce(
    (t, l) => ({
      presente: t.presente + l.montantPresente,
      pondere: t.pondere + ponderé(l),
      accepte: t.accepte + (l.montantAccepte ?? 0),
      debourse: t.debourse + (l.debourseReel ?? 0),
    }),
    { presente: 0, pondere: 0, accepte: 0, debourse: 0 },
  )
}
