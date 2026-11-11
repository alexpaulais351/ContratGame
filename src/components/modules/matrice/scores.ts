// Calculs PURS de la matrice Bid Comp (testés dans scores.test.ts).
// Aucun import applicatif : utilisable côté serveur, client, PDF, Excel, tests.

export type DecisionCalc = 'go' | 'no_go' | 'en_attente'

export type CritereCalc = { id: string; type: string; coefficient: number; famille?: string }
export type NotationCalc = {
  critereId: string
  fournisseurId: string
  note: number | null
  valeurTexte?: string | null
  estNonConformiteMajeure: boolean
  estNonConformiteNegociable: boolean
}

export type ScoreFournisseur = {
  fournisseurId: string
  /** Σ note × coefficient (critères note_1_3) */
  total: number
  /** 3 × Σ coefficients des critères notés (note_1_3, coef > 0) */
  maximum: number
  /** total / maximum × 100 (0 si maximum nul) */
  pourcentage: number
  nbNotes: number
  nbNcMajeures: number
  nbNcNegociables: number
  /** 1 = meilleur ; ex aequo = même rang (classement « 1, 1, 3 ») */
  classement: number
  decisionSuggeree: DecisionCalc
}

const estNote = (c: CritereCalc) => c.type === 'note_1_3' && c.coefficient > 0
const cle = (critereId: string, fournisseurId: string) => `${critereId}:${fournisseurId}`

/** Indexe les notations par « critereId:fournisseurId ». */
export function indexerNotations<N extends NotationCalc>(notations: N[]): Map<string, N> {
  return new Map(notations.map((n) => [cle(n.critereId, n.fournisseurId), n]))
}

function noteValide(note: number | null | undefined): number | null {
  if (note === null || note === undefined || !Number.isFinite(note)) return null
  if (note < 1 || note > 3) return null
  return Math.round(note)
}

/** Score total pondéré = Σ note × coef sur les critères note_1_3. */
export function scoreTotalPondere(criteres: CritereCalc[], notations: Map<string, NotationCalc>, fournisseurId: string): number {
  let total = 0
  for (const c of criteres) {
    if (!estNote(c)) continue
    const note = noteValide(notations.get(cle(c.id, fournisseurId))?.note)
    if (note !== null) total += note * c.coefficient
  }
  return total
}

/** Score maximal atteignable = 3 × Σ coef des critères notés. */
export function scoreMaximum(criteres: CritereCalc[]): number {
  return 3 * criteres.filter(estNote).reduce((s, c) => s + c.coefficient, 0)
}

/** Score normalisé en % (0-100). */
export function scoreNormalise(total: number, maximum: number): number {
  if (maximum <= 0) return 0
  return (total / maximum) * 100
}

/**
 * Décision suggérée :
 *  - au moins une non-conformité majeure → no_go
 *  - aucune note saisie → en_attente
 *  - score normalisé ≥ seuilGo → go
 *  - sinon → en_attente (à négocier / clarifier)
 */
export function decisionSuggeree(pourcentage: number, nbNcMajeures: number, nbNotes: number, seuilGo: number): DecisionCalc {
  if (nbNcMajeures > 0) return 'no_go'
  if (nbNotes === 0) return 'en_attente'
  if (pourcentage >= seuilGo - 1e-9) return 'go'
  return 'en_attente'
}

/** Classement par score décroissant ; ex aequo → même rang (1, 1, 3). */
export function classer(scores: { id: string; valeur: number }[]): Map<string, number> {
  const tries = [...scores].sort((a, b) => b.valeur - a.valeur)
  const rangs = new Map<string, number>()
  tries.forEach((s, i) => {
    const prec = tries[i - 1]
    rangs.set(s.id, prec && Math.abs(prec.valeur - s.valeur) < 1e-9 ? rangs.get(prec.id)! : i + 1)
  })
  return rangs
}

/** Calcule tous les scores d'une matrice. */
export function calculerScores(
  criteres: CritereCalc[],
  fournisseurIds: string[],
  notations: NotationCalc[],
  seuilGo: number,
): Map<string, ScoreFournisseur> {
  const index = indexerNotations(notations)
  const ids = new Set(criteres.map((c) => c.id))
  const maximum = scoreMaximum(criteres)
  const partiels = fournisseurIds.map((fid) => {
    const total = scoreTotalPondere(criteres, index, fid)
    let nbNotes = 0
    let nbNcMajeures = 0
    let nbNcNegociables = 0
    for (const c of criteres) {
      const nt = index.get(cle(c.id, fid))
      if (!nt) continue
      if (estNote(c) && noteValide(nt.note) !== null) nbNotes++
    }
    for (const nt of notations) {
      if (nt.fournisseurId !== fid || !ids.has(nt.critereId)) continue
      if (nt.estNonConformiteMajeure) nbNcMajeures++
      else if (nt.estNonConformiteNegociable) nbNcNegociables++
    }
    const pourcentage = scoreNormalise(total, maximum)
    return { fournisseurId: fid, total, maximum, pourcentage, nbNotes, nbNcMajeures, nbNcNegociables }
  })
  const rangs = classer(partiels.map((p) => ({ id: p.fournisseurId, valeur: p.pourcentage })))
  return new Map(
    partiels.map((p) => [
      p.fournisseurId,
      { ...p, classement: rangs.get(p.fournisseurId) ?? 0, decisionSuggeree: decisionSuggeree(p.pourcentage, p.nbNcMajeures, p.nbNotes, seuilGo) },
    ]),
  )
}

/**
 * Meilleur fournisseur : meilleur score parmi ceux sans non-conformité majeure
 * et ayant au moins une note ; null sinon.
 */
export function meilleurFournisseur(scores: Map<string, ScoreFournisseur>): string | null {
  let best: ScoreFournisseur | null = null
  scores.forEach((s) => {
    if (s.nbNcMajeures > 0 || s.nbNotes === 0) return
    if (!best || s.pourcentage > best.pourcentage) best = s
  })
  return best ? (best as ScoreFournisseur).fournisseurId : null
}

/** Somme des montants (critères de type montant) d'une famille pour un fournisseur. */
export function totalMontants(criteres: CritereCalc[], notations: Map<string, NotationCalc>, fournisseurId: string, famille: string): number | null {
  let total = 0
  let trouve = false
  for (const c of criteres) {
    if (c.type !== 'montant' || c.famille !== famille) continue
    const txt = notations.get(cle(c.id, fournisseurId))?.valeurTexte
    if (txt === null || txt === undefined || txt.trim() === '') continue
    const v = Number(txt.replace(/\s/g, '').replace(',', '.'))
    if (Number.isFinite(v)) {
      total += v
      trouve = true
    }
  }
  return trouve ? total : null
}
