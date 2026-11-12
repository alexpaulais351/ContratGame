export type SituationListeItem = {
  id: string
  numero: number
  libelle: string
  annee: number
  mois: number
  statut: 'brouillon' | 'validee'
  montantCumule: number
  montantMois: number
}

export type LigneDETableau = {
  id: string
  code: string
  designation: string
  unite: string
  quantite: number
  prixUnitaire: number
  estChapitre: boolean
  /** quantité cumulée de la situation précédente */
  cumulPrecedent: number
  /** quantité cumulée saisie (situation courante) */
  cumul: number
  /** PU snapshot de la situation courante (sinon PU du DE) */
  puSituation: number
  /** PU snapshot de la situation précédente (sinon PU du DE) */
  puPrecedent: number
}

export type RecapSTLigne = {
  id: string
  nom: string
  /** sous-traitant en paiement direct par le maître d'ouvrage */
  paiementDirect: boolean
  /** cumul facturé jusqu'au mois précédent (inclus) */
  cumulPrecedent: number
  montantTotal: number
  factureMois: number
  cumule: number
  reste: number
  pourcent: number
}

export type LignePDFSituation = {
  id: string
  code: string
  designation: string
  unite: string
  estChapitre: boolean
  quantite: number
  prixUnitaire: number
  cumulPrecedent: number
  qteMois: number
  cumul: number
  pourcent: number
  montantPrecedent: number
  montantMois: number
  montantCumul: number
}

/** Prix nouveau avec OS reçu, intégré à la situation (avancement cumulé en %). */
export type LignePNSituation = {
  id: string
  numero: string
  intitule: string
  numeroOS: string | null
  /** 'AAAA-MM-JJ' */
  dateOS: string | null
  /** true si montant accepté connu (sinon montant présenté) */
  accepte: boolean
  /** montant de référence (accepté, sinon présenté) */
  montantBase: number
  /** montant de référence figé dans la situation précédente */
  montantBasePrecedent: number
  avancementPrecedent: number
  avancement: number
}
