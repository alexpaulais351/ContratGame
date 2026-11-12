/**
 * Assurances et garanties d'un chantier — données (rendu écran + PDF).
 *
 * Sources principales : Code civil art. 1792 à 1792-6 ; Code des assurances art. L241-1, L241-2,
 * L242-1, L243-2, L243-3, L211-1 ; loi n° 78-12 du 4 janvier 1978 (« loi Spinetta ») ;
 * CCAG Travaux 2021 art. 8 (assurances) et 44 (garanties) ; FFB (dossier CCRD > 15 M€).
 * Les mentions « à vérifier » signalent un point non confirmé par une source officielle.
 */
import { VINCI, VINCI_SECONDAIRE, type CleSecondaire } from '@/lib/design-tokens'

export type NatureCouverture = 'obligatoire' | 'facultative' | 'garantie_legale'

export const LIBELLE_NATURE: Record<NatureCouverture, string> = {
  obligatoire: 'Assurance obligatoire',
  facultative: 'Assurance facultative',
  garantie_legale: 'Garantie légale (pas une assurance)',
}

/**
 * Échelle de la frise (unités arbitraires, non proportionnelles au temps réel) :
 * 0 → 1 : avant travaux · 1 → 3 : pendant travaux · 3 : réception ·
 * 3 → 4,5 : 1re année (GPA) · 4,5 → 5,5 : 2e année · 5,5 → 8 : jusqu'à 10 ans.
 */
export const PHASES_FRISE = [
  { de: 0, a: 1, libelle: 'Avant travaux' },
  { de: 1, a: 3, libelle: 'Pendant travaux' },
  { de: 3, a: 4.5, libelle: '1re année' },
  { de: 4.5, a: 5.5, libelle: '2e année' },
  { de: 5.5, a: 8, libelle: '3e à 10e année' },
] as const

export const JALONS_FRISE = [
  { x: 1, libelle: 'Ouverture du chantier' },
  { x: 3, libelle: 'Réception' },
  { x: 4.5, libelle: '+1 an' },
  { x: 5.5, libelle: '+2 ans' },
  { x: 8, libelle: '+10 ans' },
] as const

export const FIN_FRISE = 8

export type SegmentFrise = { de: number; a: number; partiel?: boolean; note?: string }

export type Assurance = {
  cle: string
  nom: string
  sigle?: string
  nature: NatureCouverture
  couleur: CleSecondaire
  obligatoire: string
  souscripteur: string
  beneficiaire: string
  objet: string
  declenchement: string
  periode: string
  references: string
  attention: string[]
  segments: SegmentFrise[]
  aVerifier?: string
}

export const ASSURANCES: Assurance[] = [
  {
    cle: 'trc', nom: 'Tous risques chantier', sigle: 'TRC', nature: 'facultative', couleur: 'jaune',
    obligatoire: 'Non (souvent prévue par le CCAP ou souscrite par l’entreprise générale)',
    souscripteur: 'Maître d’ouvrage ou entreprise générale / mandataire du groupement',
    beneficiaire: 'Tous les intervenants désignés (MOA, entreprises, sous-traitants)',
    objet: 'Dommages matériels accidentels à l’ouvrage en cours de construction (incendie, effondrement, tempête, inondation, vol, vandalisme…), selon les garanties souscrites',
    declenchement: 'Sinistre pendant les travaux, sans recherche préalable de responsabilité',
    periode: 'De l’ouverture du chantier à la réception (extension « maintenance-visite » possible après réception selon le contrat)',
    references: 'Contrat d’assurance ; CCAG Travaux 2021 art. 8.2 (le MOA indique les assurances qu’il souscrit)',
    attention: [
      'Vérifier dans le CCAP qui souscrit la TRC et le montant de la franchise laissée à la charge des entreprises',
      'Déclarer le sinistre sans délai à l’assureur (délai contractuel, souvent 5 jours ouvrés)',
      'Conserver photos, constats contradictoires et PV de chantier',
    ],
    segments: [{ de: 1, a: 3 }, { de: 3, a: 4.5, partiel: true, note: 'Maintenance-visite (option)' }],
  },
  {
    cle: 'rc', nom: 'Responsabilité civile professionnelle / exploitation', sigle: 'RC', nature: 'facultative', couleur: 'bleuMoyen',
    obligatoire: 'Non obligatoire en général, mais exigée par le marché (CCAG Travaux 2021 art. 8.1.1)',
    souscripteur: 'Chaque entreprise (titulaire, cotraitants, sous-traitants)',
    beneficiaire: 'Les tiers victimes et le maître d’ouvrage',
    objet: 'Dommages corporels, matériels et immatériels causés aux tiers du fait de l’activité (pendant les travaux) ou des ouvrages livrés (RC après travaux)',
    declenchement: 'Mise en cause de la responsabilité de l’entreprise par un tiers',
    periode: 'Pendant toute l’activité ; RC « après livraison » selon le contrat',
    references: 'C. civ. art. 1240 et s. (responsabilité délictuelle) ; CCAG Travaux 2021 art. 8.1.1',
    attention: [
      'Attestation à fournir dans les 15 jours suivant la notification du marché et avant tout début d’exécution (CCAG 2021 art. 8.1.3)',
      'Exiger l’attestation RC de chaque sous-traitant avant son arrivée sur le chantier',
    ],
    segments: [{ de: 0, a: 3 }, { de: 3, a: 8, partiel: true, note: 'RC après travaux (selon contrat)' }],
  },
  {
    cle: 'gpa', nom: 'Garantie de parfait achèvement', sigle: 'GPA', nature: 'garantie_legale', couleur: 'vert',
    obligatoire: 'Garantie légale due par l’entrepreneur (pas une assurance : en général non assurée)',
    souscripteur: '— (obligation de l’entrepreneur)',
    beneficiaire: 'Maître d’ouvrage',
    objet: 'Réparation de tous les désordres signalés à la réception (réserves) ou notifiés par écrit pendant l’année qui suit',
    declenchement: 'Notification écrite du désordre par le MOA ; exécution dans le délai fixé d’un commun accord ou, à défaut, par le MOA',
    periode: '1 an à compter de la réception',
    references: 'C. civ. art. 1792-6 ; CCAG Travaux 2021 art. 44.1 (délai de garantie, prolongeable : 44.2)',
    attention: [
      'Suivre la levée des réserves (délai fixé par le MOA, à défaut 3 mois avant la fin du délai de garantie : CCAG 2021 art. 41.6)',
      'La retenue de garantie est remboursée 30 jours après l’expiration du délai de garantie (CCP art. R2191-35)',
    ],
    segments: [{ de: 3, a: 4.5 }],
  },
  {
    cle: 'biennale', nom: 'Garantie biennale de bon fonctionnement', nature: 'garantie_legale', couleur: 'vertVif',
    obligatoire: 'Garantie légale due par les constructeurs (pas une assurance obligatoire)',
    souscripteur: '— (obligation des constructeurs)',
    beneficiaire: 'Maître d’ouvrage et propriétaires successifs',
    objet: 'Bon fonctionnement des éléments d’équipement dissociables de l’ouvrage (ex. robinetterie, volets, équipements démontables)',
    declenchement: 'Dysfonctionnement d’un élément d’équipement dissociable',
    periode: '2 ans minimum à compter de la réception',
    references: 'C. civ. art. 1792-3',
    attention: ['Ne couvre pas les éléments indissociables (relevant de la décennale)'],
    segments: [{ de: 3, a: 5.5 }],
  },
  {
    cle: 'rcd', nom: 'Responsabilité civile décennale', sigle: 'RCD', nature: 'obligatoire', couleur: 'orange',
    obligatoire: 'Oui pour tout constructeur lié au MOA par un contrat de louage d’ouvrage (entreprises, architectes, BET, contrôleurs…) pour les ouvrages soumis à l’obligation',
    souscripteur: 'Chaque constructeur (entreprise titulaire, cotraitants, MOE…)',
    beneficiaire: 'Maître d’ouvrage et propriétaires successifs',
    objet: 'Dommages qui compromettent la solidité de l’ouvrage ou le rendent impropre à sa destination (y compris éléments d’équipement indissociables)',
    declenchement: 'Désordre de nature décennale apparu après la réception (responsabilité de plein droit)',
    periode: '10 ans à compter de la réception',
    references: 'C. civ. art. 1792, 1792-2 et 1792-4-1 ; C. assur. art. L241-1 et L243-2 ; CCAG Travaux 2021 art. 8.1.2 ; sanction pénale du défaut d’assurance : C. assur. art. L243-3',
    attention: [
      'Contrat en cours de validité à la date d’ouverture du chantier (DOC) : vérifier les dates de l’attestation',
      'Vérifier que les ACTIVITÉS déclarées couvrent bien les travaux réalisés (cause fréquente de refus de garantie)',
      'Ouvrages exclus de l’obligation (certains ouvrages de génie civil, VRD…) : C. assur. art. L243-1-1 — la garantie n’est alors exigée que si le CCAP le prévoit',
    ],
    segments: [{ de: 3, a: 8 }],
  },
  {
    cle: 'do', nom: 'Dommages-ouvrage', sigle: 'DO', nature: 'obligatoire', couleur: 'bleuCiel',
    obligatoire: 'Oui pour le maître d’ouvrage (personne qui fait réaliser des travaux de construction). Exceptions : personnes morales de droit public (et MOA en contrat de partenariat) pour des ouvrages autres que d’habitation ; certaines grandes entreprises pour leurs locaux professionnels',
    souscripteur: 'Maître d’ouvrage, avant l’ouverture du chantier',
    beneficiaire: 'Maître d’ouvrage et propriétaires successifs',
    objet: 'Préfinancement rapide de la réparation des dommages de nature décennale, sans recherche préalable de responsabilité ; l’assureur DO se retourne ensuite contre les constructeurs et leurs assureurs',
    declenchement: 'Après réception : désordre décennal. Avant réception : contrat de l’entrepreneur résilié pour inexécution après mise en demeure restée infructueuse. Pendant l’année de GPA : après mise en demeure restée infructueuse',
    periode: 'De la réception jusqu’à 10 ans (pleinement après l’expiration de la GPA) ; avant réception et pendant la GPA dans les cas limitatifs ci-dessus',
    references: 'C. assur. art. L242-1 (et annexe II à l’art. A243-1) ; loi « Spinetta » n° 78-12 du 4 janvier 1978',
    attention: [
      'Assureur DO : 60 jours pour prendre position sur la garantie, 90 jours pour proposer une indemnité (C. assur. art. L242-1) — à vérifier dans le contrat',
      'Les marchés publics de l’État et des collectivités (hors logement) n’y sont en général pas soumis : vérifier le CCAP',
    ],
    segments: [
      { de: 1, a: 3, partiel: true, note: 'Si résiliation après mise en demeure' },
      { de: 3, a: 4.5, partiel: true, note: 'Après mise en demeure infructueuse' },
      { de: 4.5, a: 8 },
    ],
  },
  {
    cle: 'cnr', nom: 'Constructeur non réalisateur', sigle: 'CNR', nature: 'obligatoire', couleur: 'violet',
    obligatoire: 'Oui pour celui qui fait réaliser des travaux pour le compte d’autrui (promoteur, vendeur d’immeuble à construire, vendeur après achèvement…)',
    souscripteur: 'Promoteur / vendeur (maître d’ouvrage vendeur)',
    beneficiaire: 'Acquéreurs et propriétaires successifs',
    objet: 'Responsabilité décennale du constructeur non réalisateur (dommages visés aux art. 1792 et 1792-2 C. civ.)',
    declenchement: 'Désordre décennal mettant en cause le vendeur / promoteur',
    periode: '10 ans à compter de la réception',
    references: 'C. assur. art. L241-2 ; C. civ. art. 1792-1',
    attention: ['Rarement applicable aux marchés publics de travaux classiques (MOA public non vendeur)'],
    segments: [{ de: 3, a: 8 }],
  },
  {
    cle: 'ccrd', nom: 'Contrat collectif de responsabilité décennale / police unique de chantier', sigle: 'CCRD / PUC', nature: 'facultative', couleur: 'rose',
    obligatoire: 'Non (recommandé pour les opérations > 15 M€ HT, au-delà desquelles les plafonds des polices individuelles sont limités)',
    souscripteur: 'Maître d’ouvrage (ou titulaire si le CCAP le prévoit)',
    beneficiaire: 'Maître d’ouvrage ; les constructeurs sont assurés au-delà de leur franchise absolue',
    objet: 'CCRD : complément « 2e ligne » des RCD individuelles au-delà de leur plafond. PUC : regroupe en une seule police la DO et la RCD de tous les intervenants',
    declenchement: 'Désordre décennal dépassant les garanties individuelles (CCRD) ; tout désordre décennal (PUC)',
    periode: '10 ans à compter de la réception',
    references: 'C. assur. art. L241-1 et R243-1 (annexe II : clauses types RCD collective) ; CCAG Travaux 2021 art. 8.2 ; FFB',
    attention: [
      'Le CCAP doit préciser le souscripteur, les modalités et la franchise absolue (= plafond de la police individuelle du titulaire)',
      'Seuil de 15 M€ HT (honoraires compris) : seuil de marché assurantiel, à vérifier',
    ],
    segments: [{ de: 3, a: 8 }],
    aVerifier: 'Seuil de 15 M€ HT et fonctionnement de la PUC : à vérifier auprès de l’assureur',
  },
  {
    cle: 'st', nom: 'Assurances des sous-traitants', sigle: 'ST', nature: 'facultative', couleur: 'grisChaud',
    obligatoire: 'Le sous-traitant n’est pas soumis à l’obligation d’assurance décennale (pas de contrat de louage d’ouvrage avec le MOA), mais l’entreprise principale l’exige quasi systématiquement',
    souscripteur: 'Chaque sous-traitant',
    beneficiaire: 'Entreprise principale (responsabilité contractuelle) ; tiers (RC)',
    objet: 'RC exploitation + responsabilité « décennale » du sous-traitant vis-à-vis de l’entreprise principale',
    declenchement: 'Recours de l’entreprise principale ou de son assureur',
    periode: 'Actions contre le sous-traitant : 10 ans à compter de la réception (C. civ. art. 1792-4-2)',
    references: 'Loi n° 75-1334 du 31 décembre 1975 ; C. civ. art. 1792-4-2',
    attention: [
      'Demander les attestations RC + décennale AVANT l’acceptation du sous-traitant et le démarrage (DC4 / acte spécial)',
      'Vérifier la cohérence entre activités déclarées et travaux sous-traités',
      'Le CCRD éventuel peut couvrir les sous-traitants (CCAG 2021 art. 8.2)',
    ],
    segments: [{ de: 1, a: 3 }, { de: 3, a: 8, partiel: true, note: 'Responsabilité vis-à-vis de l’entreprise principale' }],
  },
  {
    cle: 'engins', nom: 'Engins de chantier', nature: 'obligatoire', couleur: 'bleuMoyen',
    obligatoire: 'RC « circulation » obligatoire pour les engins automoteurs (véhicules terrestres à moteur) ; « bris de machine » facultatif',
    souscripteur: 'Propriétaire ou loueur de l’engin (vérifier le contrat de location)',
    beneficiaire: 'Tiers victimes ; propriétaire de l’engin (dommages à l’engin)',
    objet: 'Dommages causés par l’engin (y compris à l’arrêt selon contrat) ; dommages subis par l’engin (bris, vol, incendie)',
    declenchement: 'Accident impliquant l’engin',
    periode: 'Pendant l’utilisation sur le chantier',
    references: 'C. assur. art. L211-1 (assurance automobile obligatoire)',
    attention: ['Engins loués : vérifier qui assure (loueur ou entreprise) et la franchise'],
    segments: [{ de: 1, a: 3 }],
    aVerifier: 'Champ exact de l’obligation pour les engins non immatriculés : à vérifier auprès de l’assureur',
  },
  {
    cle: 'env', nom: 'RC atteinte à l’environnement', sigle: 'RCAE', nature: 'facultative', couleur: 'vert',
    obligatoire: 'Non (souvent exclue ou limitée dans la RC générale : à vérifier)',
    souscripteur: 'Entreprise',
    beneficiaire: 'Tiers ; collectivités (frais de dépollution)',
    objet: 'Pollutions accidentelles ou graduelles, frais de dépollution, préjudice écologique selon contrat',
    declenchement: 'Pollution liée au chantier (déversement, rejet, déchets)',
    periode: 'Pendant les travaux (et après selon contrat)',
    references: 'Code de l’environnement (responsabilité environnementale, art. L160-1 et s.) ; contrat d’assurance',
    attention: ['Vérifier les exclusions « pollution » de la RC exploitation', 'Gestion des déchets de chantier : CCAG 2021 art. 36'],
    segments: [{ de: 1, a: 3 }, { de: 3, a: 8, partiel: true, note: 'Selon contrat' }],
  },
]

export const QUE_FAIRE_SINISTRE: { phase: string; couleur: CleSecondaire; etapes: string[] }[] = [
  {
    phase: 'Pendant les travaux', couleur: 'jaune',
    etapes: [
      'Mettre en sécurité le chantier et les personnes ; prévenir le MOE / MOA',
      'Constat contradictoire (photos datées, PV, témoins) — inscription au journal de chantier',
      'Déclarer le sinistre à l’assureur concerné (TRC, RC) dans le délai du contrat',
      'Ne pas réparer avant l’accord de l’assureur ou de l’expert, sauf mesures conservatoires',
      'En cas de dommage causé par un sous-traitant : l’informer par écrit et réclamer son attestation RC',
    ],
  },
  {
    phase: 'Pendant l’année de parfait achèvement', couleur: 'vert',
    etapes: [
      'Le MOA notifie le désordre par écrit à l’entreprise (GPA, C. civ. art. 1792-6)',
      'Intervenir dans le délai fixé ; à défaut, exécution aux frais de l’entreprise après mise en demeure',
      'Désordre de nature décennale non repris après mise en demeure : le MOA peut saisir l’assureur DO',
      'Assurer le suivi de la levée des réserves avant la fin du délai de garantie',
    ],
  },
  {
    phase: 'Après réception (biennale / décennale)', couleur: 'orange',
    etapes: [
      'Le MOA déclare le sinistre à l’assureur dommages-ouvrage (s’il existe) par lettre recommandée',
      'À défaut de DO : action directe contre le constructeur et son assureur RCD',
      'L’entreprise transmet sans délai la réclamation à son assureur RCD et participe à l’expertise',
      'Conserver DOE, PV de réception, attestations d’assurance valables à la DOC',
    ],
  },
]

export function couleurAssurance(a: Assurance) {
  return VINCI_SECONDAIRE[a.couleur]
}

/** Teintes claires sur lesquelles le texte doit être noir (contraste). */
const TEINTES_CLAIRES: CleSecondaire[] = ['jaune', 'vertVif', 'bleuCiel', 'grisChaud']

/** Couleur du texte d'une barre de la frise. */
export function texteBarre(a: Assurance): string {
  return a.nature === 'obligatoire' && !TEINTES_CLAIRES.includes(a.couleur) ? VINCI.blanc : VINCI.noir
}

/** Libellé court d'une barre. */
export function libelleBarre(a: Assurance): string {
  return a.sigle ?? a.nom
}
