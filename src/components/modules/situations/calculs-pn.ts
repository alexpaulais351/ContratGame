import type { LignePNSituation } from './types'

export type PNCalcule = LignePNSituation & { montantPrecedent: number; montantCumul: number; montantMois: number }

/** Montants d'un prix nouveau à partir de l'avancement cumulé (%) saisi. Fonction pure. */
export function calculerPN(l: LignePNSituation, avancement: number): PNCalcule {
  const montantPrecedent = (l.avancementPrecedent / 100) * l.montantBasePrecedent
  const montantCumul = (avancement / 100) * l.montantBase
  return { ...l, avancement, montantPrecedent, montantCumul, montantMois: montantCumul - montantPrecedent }
}

export function totaliserPN(l: PNCalcule[]) {
  return l.reduce(
    (a, p) => ({ base: a.base + p.montantBase, precedent: a.precedent + p.montantPrecedent, mois: a.mois + p.montantMois, cumul: a.cumul + p.montantCumul }),
    { base: 0, precedent: 0, mois: 0, cumul: 0 },
  )
}
