/**
 * Calculateurs contractuels — fonctions PURES (testées dans calculs.test.ts).
 * Valeurs par défaut issues du CCAG Travaux 2021 et du code de la commande publique (CCP) ;
 * le CCAP du marché peut y déroger : toujours vérifier les pièces du marché.
 */
import { ajouterJours, ajouterMois, ecartJours, estDateValide, type DateISO } from './dates'

const arrondi2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

/* ─────────────────────────── Intérêts moratoires ─────────────────────────── */

/** Indemnité forfaitaire pour frais de recouvrement (CCP art. D2192-35). */
export const INDEMNITE_FORFAITAIRE_RECOUVREMENT = 40
/** Majoration du taux BCE (CCP art. R2192-31). */
export const MAJORATION_TAUX_BCE = 8

export type ParamsInteretsMoratoires = {
  montant: number
  /** Date d'expiration du délai de paiement (dernier jour du délai). */
  echeance: DateISO
  /** Date de mise en paiement du principal. */
  paiement: DateISO
  /** Taux BCE (opérations principales de refinancement) en vigueur au 1er jour du semestre, en %. */
  tauxBCE: number
}

export type ResultatInteretsMoratoires = {
  joursRetard: number
  tauxApplique: number
  interets: number
  indemniteForfaitaire: number
  total: number
}

/**
 * Intérêts moratoires (CCP R2192-31 à R2192-33) : ils courent du lendemain de l'expiration du
 * délai de paiement jusqu'à la date de mise en paiement incluse, au taux BCE + 8 points.
 * Calcul : montant × taux × jours / 365. Indemnité forfaitaire de 40 € due dès le premier jour de retard.
 */
export function interetsMoratoires(p: ParamsInteretsMoratoires): ResultatInteretsMoratoires {
  if (!estDateValide(p.echeance) || !estDateValide(p.paiement)) throw new Error('Dates invalides')
  const joursRetard = Math.max(0, ecartJours(p.echeance, p.paiement))
  const tauxApplique = arrondi2(p.tauxBCE + MAJORATION_TAUX_BCE)
  const interets = joursRetard > 0 ? arrondi2((Math.max(0, p.montant) * tauxApplique * joursRetard) / 100 / 365) : 0
  const indemniteForfaitaire = joursRetard > 0 ? INDEMNITE_FORFAITAIRE_RECOUVREMENT : 0
  return { joursRetard, tauxApplique, interets, indemniteForfaitaire, total: arrondi2(interets + indemniteForfaitaire) }
}

/** Date limite de paiement : réception de la demande + délai (30 j par défaut, CCP R2192-10). */
export function echeancePaiement(receptionDemande: DateISO, delaiJours = 30): DateISO {
  return ajouterJours(receptionDemande, delaiJours)
}

/* ─────────────────────────── Révision de prix ─────────────────────────── */

export type ParamsRevision = {
  /** Montant à réviser (prix ou montant de l'acompte) aux conditions économiques du mois zéro. */
  p0: number
  /** Index de référence du mois zéro (I0). */
  indexBase: number
  /** Index du mois de réalisation (Im). */
  indexMois: number
  /** Part fixe « a » (0 à 1, ex. 0,125). 0 = pas de part fixe. */
  partFixe: number
  /** Nombre de décimales d'arrondi du coefficient (null = pas d'arrondi). */
  decimalesCoefficient?: number | null
  /** Arrondi du coefficient : au plus proche ou au supérieur (selon CCAP). */
  modeArrondi?: 'proche' | 'superieur'
}

export type ResultatRevision = { coefficient: number; montantRevise: number; variation: number; partVariable: number }

/** Formule paramétrique simple : C = a + (1 − a) × Im / I0 ; P = P0 × C. */
export function revisionPrix(p: ParamsRevision): ResultatRevision {
  if (!(p.indexBase > 0)) throw new Error('Index de base invalide')
  if (p.partFixe < 0 || p.partFixe >= 1) throw new Error('Part fixe hors limites (0 ≤ a < 1)')
  const partVariable = 1 - p.partFixe
  let c = p.partFixe + partVariable * (p.indexMois / p.indexBase)
  const dec = p.decimalesCoefficient
  if (dec !== null && dec !== undefined) {
    const f = 10 ** dec
    c = p.modeArrondi === 'superieur' ? Math.ceil(c * f - 1e-9) / f : Math.round(c * f) / f
  }
  const montantRevise = arrondi2(p.p0 * c)
  return { coefficient: c, montantRevise, variation: arrondi2(montantRevise - p.p0), partVariable }
}

/* ─────────────────────────── Pénalités de retard ─────────────────────────── */

export type ParamsPenalites = {
  /** Montant HT du marché (ou de la tranche / du bon de commande concerné). */
  montantHT: number
  joursRetard: number
  /** Dénominateur de la pénalité journalière (CCAG Travaux 2021 art. 19.2.3 : 3 000). */
  denominateur?: number
  /** Plafond en % du montant HT (CCAG Travaux 2021 art. 19.2.2 : 10 %). null = pas de plafond. */
  plafondPct?: number | null
  /** Seuil d'exonération (CCAG Travaux 2021 art. 19.2.1 : 1 000 €). */
  seuilExoneration?: number
}

export type ResultatPenalites = {
  penaliteJournaliere: number
  brut: number
  plafond: number | null
  plafonne: boolean
  exonere: boolean
  du: number
}

export function penalitesRetard(p: ParamsPenalites): ResultatPenalites {
  const denominateur = p.denominateur ?? 3000
  const plafondPct = p.plafondPct === undefined ? 10 : p.plafondPct
  const seuil = p.seuilExoneration ?? 1000
  const montant = Math.max(0, p.montantHT)
  const jours = Math.max(0, Math.floor(p.joursRetard))
  const penaliteJournaliere = arrondi2(montant / denominateur)
  const brut = arrondi2((montant * jours) / denominateur)
  const plafond = plafondPct === null ? null : arrondi2((montant * plafondPct) / 100)
  const plafonne = plafond !== null && brut > plafond
  const apresPlafond = plafonne ? (plafond as number) : brut
  const exonere = apresPlafond > 0 && apresPlafond <= seuil
  return { penaliteJournaliere, brut, plafond, plafonne, exonere, du: exonere ? 0 : apresPlafond }
}

/* ─────────────────────────── Retenue de garantie ─────────────────────────── */

export type ParamsRetenue = {
  montantInitialHT: number
  /** Modifications (avenants) en cours d'exécution, HT. */
  modificationsHT?: number
  /** Taux en % (5 % maximum ; 3 % pour une PME avec certains acheteurs — CCP R2191-33). */
  taux: number
  /** Date d'effet de la réception (facultative) pour calculer la libération. */
  dateReception?: DateISO | null
  /** Durée du délai de garantie en mois (CCAG Travaux 2021 art. 44.1 : 1 an). */
  dureeGarantieMois?: number
}

export type ResultatRetenue = {
  base: number
  retenue: number
  finGarantie: DateISO | null
  /** Date limite de remboursement (30 j après l'expiration du délai de garantie, CCP R2191-35). */
  remboursementAuPlusTard: DateISO | null
  tauxSuperieurAuMaximum: boolean
}

export const TAUX_MAX_RETENUE = 5

export function retenueGarantie(p: ParamsRetenue): ResultatRetenue {
  const base = arrondi2(Math.max(0, p.montantInitialHT) + (p.modificationsHT ?? 0))
  const retenue = arrondi2((base * p.taux) / 100)
  let finGarantie: DateISO | null = null
  let remboursementAuPlusTard: DateISO | null = null
  if (p.dateReception && estDateValide(p.dateReception)) {
    finGarantie = ajouterMois(p.dateReception, p.dureeGarantieMois ?? 12)
    remboursementAuPlusTard = ajouterJours(finGarantie, 30)
  }
  return { base, retenue, finGarantie, remboursementAuPlusTard, tauxSuperieurAuMaximum: p.taux > TAUX_MAX_RETENUE }
}
