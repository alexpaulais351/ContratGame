import type { LigneDETableau, LignePDFSituation } from './types'

export const arrondi = (n: number) => Math.round(n * 100) / 100

export function calculerLigne(l: LigneDETableau, cumul: number, pu: number): LignePDFSituation {
  const qteMois = cumul - l.cumulPrecedent
  const montantPrecedent = l.cumulPrecedent * l.puPrecedent
  const montantCumul = cumul * pu
  return {
    id: l.id,
    code: l.code,
    designation: l.designation,
    unite: l.unite,
    estChapitre: l.estChapitre,
    quantite: l.quantite,
    prixUnitaire: pu,
    cumulPrecedent: l.cumulPrecedent,
    qteMois,
    cumul,
    pourcent: l.quantite > 0 ? (cumul / l.quantite) * 100 : 0,
    montantPrecedent,
    montantMois: montantCumul - montantPrecedent,
    montantCumul,
  }
}

export type Totaux = { marche: number; precedent: number; mois: number; cumul: number; pourcent: number }

export function totaliser(lignes: LignePDFSituation[]): Totaux {
  let marche = 0, precedent = 0, mois = 0, cumul = 0
  for (const l of lignes) {
    if (l.estChapitre) continue
    marche += l.quantite * l.prixUnitaire
    precedent += l.montantPrecedent
    mois += l.montantMois
    cumul += l.montantCumul
  }
  return { marche, precedent, mois, cumul, pourcent: marche > 0 ? (cumul / marche) * 100 : 0 }
}

/** Sous-total par chapitre : renvoie Map<idChapitre, Totaux> (lignes jusqu'au chapitre suivant). */
export function sousTotaux(lignes: LignePDFSituation[]): Map<string, Totaux> {
  const res = new Map<string, Totaux>()
  let courant: string | null = null
  let buf: LignePDFSituation[] = []
  const flush = () => { if (courant) res.set(courant, totaliser(buf)) }
  for (const l of lignes) {
    if (l.estChapitre) { flush(); courant = l.id; buf = [] } else buf.push(l)
  }
  flush()
  return res
}
