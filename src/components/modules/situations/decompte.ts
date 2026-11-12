import type { RecapSTLigne } from './types'

export type DecompteSituation = {
  /** travaux du mois (HT) */
  mois: number
  cumul: number
  /** part des sous-traitants en paiement direct (payée directement par le MOA) */
  stPaiementDirectMois: number
  stPaiementDirectCumul: number
  /** montant revenant au titulaire = travaux − ST en paiement direct */
  titulaireMois: number
  titulaireCumul: number
  /** total facturé par l'ensemble des sous-traitants (pour information) */
  stTousMois: number
  stTousCumul: number
}

/** Décompte du mois : part titulaire / part des sous-traitants en paiement direct. Fonction pure. */
export function calculerDecompte(totaux: { mois: number; cumul: number }, st: RecapSTLigne[]): DecompteSituation {
  const pd = st.filter((s) => s.paiementDirect)
  const somme = (l: RecapSTLigne[], k: 'factureMois' | 'cumule') => l.reduce((a, s) => a + s[k], 0)
  const stPaiementDirectMois = somme(pd, 'factureMois')
  const stPaiementDirectCumul = somme(pd, 'cumule')
  return {
    mois: totaux.mois,
    cumul: totaux.cumul,
    stPaiementDirectMois,
    stPaiementDirectCumul,
    titulaireMois: totaux.mois - stPaiementDirectMois,
    titulaireCumul: totaux.cumul - stPaiementDirectCumul,
    stTousMois: somme(st, 'factureMois'),
    stTousCumul: somme(st, 'cumule'),
  }
}
