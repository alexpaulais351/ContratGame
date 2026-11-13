/**
 * Aide à la décision « Quelle garantie / assurance mobiliser ? » — module PUR (testé dans
 * aide-decision.test.ts). Règles déclaratives : problématique × moment × rôle × type d'ouvrage
 * × assurances souscrites → recommandation.
 *
 * Textes (versions en vigueur, voir l'encadré « Sources et versions ») :
 *  - C. civ. art. 1792, 1792-2, 1792-3, 1792-4-1 à 1792-4-3, 1792-6, 1253 (troubles du voisinage), 2224, 2226, 2241 ;
 *  - C. assur. art. L113-2 (déclaration de sinistre), L114-1 (prescription biennale), L124-3 (action directe),
 *    L211-1, L241-1, L241-2, L242-1 (DO : 60 j / 90 j), L243-1-1 (ouvrages exclus) ;
 *  - CCAG Travaux 2021 art. 8, 41.6, 44.1, 44.2 ; C. com. art. L133-3 (réserves au transporteur) ;
 *  - Guide des assurances 2026 — Divisions Bâtiment France / Génie Civil France (14e éd., usage interne) :
 *    procédure d'instruction DO, règles « groupe », polices bris de machine, multirisque, flotte, transport.
 * Outil d'aide : ne remplace pas l'analyse des contrats d'assurance et des pièces du marché.
 */
import type { NatureCouverture } from '@/lib/boite-a-outils/assurances'
import type { TypeCourrier } from '@/lib/courriers-templates'

/* ─────────────────────────── Entrées ─────────────────────────── */

export type Probleme =
  | 'fissure_structurelle'
  | 'infiltration'
  | 'equipement_dissociable'
  | 'equipement_indissociable'
  | 'esthetique'
  | 'non_conformite'
  | 'reserve_non_levee'
  | 'dommage_ouvrage_travaux'
  | 'vol_chantier'
  | 'dommage_voisin'
  | 'blessure_tiers'
  | 'dommage_sous_traitant'
  | 'dommage_engin'
  | 'pollution'
  | 'defaut_conception'
  | 'entreprise_liquidee'
  | 'dommage_existant'
  | 'reclamation_tiers'
  | 'incendie_base_vie'
  | 'sinistre_auto'
  | 'avarie_transport'

export type Moment = 'avant_reception' | 'reception' | 'annee1' | 'an1_2' | 'an2_10' | 'plus10'
export type Role = 'moa' | 'entreprise' | 'sous_traitant'
export type TypeOuvrage = 'soumis' | 'exclu' | 'inconnu'
export type Souscription = 'oui' | 'non' | 'inconnu'

export type Situation = {
  probleme: Probleme
  moment: Moment
  role: Role
  ouvrage: TypeOuvrage
  doSouscrite: Souscription
  trcSouscrite: Souscription
}

export const PROBLEMES: { cle: Probleme; libelle: string; groupe: string }[] = [
  { cle: 'fissure_structurelle', libelle: 'Fissures structurelles / atteinte à la solidité (affaissement, effondrement partiel)', groupe: 'Désordres de l’ouvrage' },
  { cle: 'infiltration', libelle: 'Infiltrations d’eau / défaut d’étanchéité', groupe: 'Désordres de l’ouvrage' },
  { cle: 'equipement_dissociable', libelle: 'Équipement dissociable qui ne fonctionne pas (volets, portes, robinetterie, VMC, radiateurs…)', groupe: 'Désordres de l’ouvrage' },
  { cle: 'equipement_indissociable', libelle: 'Équipement indissociable défaillant (canalisations encastrées, plancher chauffant…)', groupe: 'Désordres de l’ouvrage' },
  { cle: 'esthetique', libelle: 'Défaut esthétique / finitions (teinte, aspect, petites fissures d’enduit)', groupe: 'Désordres de l’ouvrage' },
  { cle: 'non_conformite', libelle: 'Non-conformité au marché sans désordre (matériau différent, cote non respectée)', groupe: 'Désordres de l’ouvrage' },
  { cle: 'reserve_non_levee', libelle: 'Réserve formulée à la réception et non levée', groupe: 'Désordres de l’ouvrage' },
  { cle: 'defaut_conception', libelle: 'Défaut de conception (erreur d’étude, de calcul, de plan)', groupe: 'Désordres de l’ouvrage' },
  { cle: 'entreprise_liquidee', libelle: 'Désordre dont l’entreprise responsable a disparu (liquidation)', groupe: 'Désordres de l’ouvrage' },
  { cle: 'dommage_ouvrage_travaux', libelle: 'Dommage à l’ouvrage en cours de travaux (incendie, tempête, inondation, effondrement)', groupe: 'Sinistres de chantier' },
  { cle: 'vol_chantier', libelle: 'Vol ou vandalisme sur le chantier (matériaux, ouvrages, matériel)', groupe: 'Sinistres de chantier' },
  { cle: 'dommage_voisin', libelle: 'Dommage à un tiers / riverain / bâtiment voisin pendant les travaux', groupe: 'Sinistres de chantier' },
  { cle: 'blessure_tiers', libelle: 'Blessure d’un tiers (ou d’un salarié) sur le chantier', groupe: 'Sinistres de chantier' },
  { cle: 'dommage_existant', libelle: 'Dommage à un ouvrage existant du maître d’ouvrage (réhabilitation, extension, ouvrage voisin confié)', groupe: 'Sinistres de chantier' },
  { cle: 'reclamation_tiers', libelle: 'Réclamation, mise en cause ou assignation reçue d’un tiers', groupe: 'Sinistres de chantier' },
  { cle: 'dommage_sous_traitant', libelle: 'Dommage causé par un sous-traitant', groupe: 'Sinistres de chantier' },
  { cle: 'pollution', libelle: 'Atteinte à l’environnement (déversement d’hydrocarbures, rejet, pollution progressive)', groupe: 'Sinistres de chantier' },
  { cle: 'dommage_engin', libelle: 'Engin ou matériel cassé, volé ou renversé (loué ou en propriété) — ou dommage causé par un engin', groupe: 'Matériels, locaux, véhicules' },
  { cle: 'incendie_base_vie', libelle: 'Incendie, dégât des eaux ou vol dans la base vie / les bureaux de chantier', groupe: 'Matériels, locaux, véhicules' },
  { cle: 'sinistre_auto', libelle: 'Accident ou vol d’un véhicule de société, de fonction ou personnel en mission', groupe: 'Matériels, locaux, véhicules' },
  { cle: 'avarie_transport', libelle: 'Matériel ou fourniture endommagé pendant le transport ou la livraison', groupe: 'Matériels, locaux, véhicules' },
]

export const MOMENTS: { cle: Moment; libelle: string }[] = [
  { cle: 'avant_reception', libelle: 'Avant la réception (pendant les travaux)' },
  { cle: 'reception', libelle: 'À la réception (réserve au PV)' },
  { cle: 'annee1', libelle: 'Dans l’année qui suit la réception' },
  { cle: 'an1_2', libelle: 'Entre 1 et 2 ans après la réception' },
  { cle: 'an2_10', libelle: 'Entre 2 et 10 ans après la réception' },
  { cle: 'plus10', libelle: 'Plus de 10 ans après la réception' },
]

export const ROLES: { cle: Role; libelle: string }[] = [
  { cle: 'moa', libelle: 'Maître d’ouvrage' },
  { cle: 'entreprise', libelle: 'Entreprise principale (titulaire)' },
  { cle: 'sous_traitant', libelle: 'Sous-traitant' },
]

export const TYPES_OUVRAGE: { cle: TypeOuvrage; libelle: string }[] = [
  { cle: 'soumis', libelle: 'Bâtiment ou ouvrage soumis à l’assurance obligatoire' },
  { cle: 'exclu', libelle: 'Ouvrage non soumis (art. L243-1-1 C. assur. : infrastructures routières, ferroviaires, portuaires, ouvrages maritimes, réseaux, voiries…)' },
  { cle: 'inconnu', libelle: 'Je ne sais pas' },
]

export const SITUATION_DEFAUT: Situation = {
  probleme: 'fissure_structurelle', moment: 'an2_10', role: 'moa', ouvrage: 'soumis', doSouscrite: 'inconnu', trcSouscrite: 'inconnu',
}

/* ─────────────────────────── Sorties ─────────────────────────── */

/** Clés des garanties : celles de la frise (lib/boite-a-outils/assurances) + responsabilités sans assurance dédiée. */
export type CleGarantie =
  | 'trc' | 'rc' | 'gpa' | 'biennale' | 'rcd' | 'rcdgc' | 'do' | 'cnr' | 'ccrd' | 'st' | 'bet' | 'env'
  | 'engins' | 'bdm' | 'trs' | 'transport' | 'nautique' | 'auto' | 'drone'
  | 'contractuelle' | 'voisinage' | 'aucune'

export type GarantieMobilisable = {
  cle: CleGarantie
  libelle: string
  nature: NatureCouverture | 'responsabilite'
  principale: boolean
  commentaire: string
}

export type EtapeAction = { texte: string; delai?: string; source?: string; aVerifier?: boolean }

export type Recommandation = {
  titre: string
  garanties: GarantieMobilisable[]
  pourquoi: string[]
  quiContreQui: { qui: string; contre: string; comment: string }[]
  etapes: EtapeAction[]
  documents: string[]
  pieges: string[]
  courriers: { type: TypeCourrier; libelle: string }[]
  alertes: string[]
  /** Clés des barres à mettre en évidence sur la frise. */
  surligner: CleGarantie[]
}

export const AVERTISSEMENT_AIDE =
  'Outil d’aide : ne remplace pas l’analyse des contrats d’assurance et des pièces du marché ; en cas de doute, contacter le service juridique / l’assureur.'

/* ─────────────────────────── Briques réutilisables ─────────────────────────── */

const G = {
  gpa: (principale = true, commentaire = 'Tous désordres signalés à la réception ou notifiés par écrit dans l’année (C. civ. art. 1792-6).'): GarantieMobilisable =>
    ({ cle: 'gpa', libelle: 'Garantie de parfait achèvement (GPA)', nature: 'garantie_legale', principale, commentaire }),
  biennale: (principale = true): GarantieMobilisable =>
    ({ cle: 'biennale', libelle: 'Garantie biennale de bon fonctionnement', nature: 'garantie_legale', principale, commentaire: 'Éléments d’équipement dissociables, 2 ans minimum après réception (C. civ. art. 1792-3).' }),
  do: (principale = true, commentaire = 'Préfinancement des désordres de nature décennale sans recherche de responsabilité (C. assur. art. L242-1).'): GarantieMobilisable =>
    ({ cle: 'do', libelle: 'Assurance dommages-ouvrage (DO)', nature: 'obligatoire', principale, commentaire }),
  rcd: (principale = true, commentaire = 'Responsabilité décennale de plein droit des constructeurs (C. civ. art. 1792 ; C. assur. art. L241-1).'): GarantieMobilisable =>
    ({ cle: 'rcd', libelle: 'Responsabilité civile décennale (RCD) des constructeurs', nature: 'obligatoire', principale, commentaire }),
  rc: (principale = true, commentaire = 'Dommages causés aux tiers du fait de l’activité.'): GarantieMobilisable =>
    ({ cle: 'rc', libelle: 'Responsabilité civile (RC exploitation / professionnelle)', nature: 'facultative', principale, commentaire }),
  trc: (principale = true, commentaire = 'Dommages matériels à l’ouvrage en cours de travaux, sans recherche de responsabilité.'): GarantieMobilisable =>
    ({ cle: 'trc', libelle: 'Tous risques chantier (TRC)', nature: 'facultative', principale, commentaire }),
  contractuelle: (principale = true, commentaire = 'Responsabilité contractuelle de droit commun pour faute prouvée (dommages « intermédiaires », non-conformités).'): GarantieMobilisable =>
    ({ cle: 'contractuelle', libelle: 'Responsabilité contractuelle de l’entreprise', nature: 'responsabilite', principale, commentaire }),
  st: (principale = false): GarantieMobilisable =>
    ({ cle: 'st', libelle: 'Assurances du sous-traitant (RC, décennale)', nature: 'facultative', principale, commentaire: 'Recours de l’entreprise principale contre son sous-traitant et l’assureur de celui-ci.' }),
  rcdgc: (principale = false, commentaire = 'Si une assurance décennale a été exigée par le marché et souscrite (police RCD génie civil, intégration de l’opération).'): GarantieMobilisable =>
    ({ cle: 'rcdgc', libelle: 'RC décennale des ouvrages non soumis (génie civil)', nature: 'facultative', principale, commentaire }),
  bdm: (principale = true, commentaire = 'Bris, destruction, vol, renversement des matériels loués ou en propriété (valeur catalogue ≤ 2 M€ HT) ; franchise 10 %, mini 5 000 €, maxi 25 000 €.'): GarantieMobilisable =>
    ({ cle: 'bdm', libelle: 'Bris de machine (matériels loués ou en propriété)', nature: 'facultative', principale, commentaire }),
  engins: (principale = false, commentaire = 'Dommages causés aux tiers par l’engin en circulation : police flotte (engins non immatriculés assurés automatiquement).'): GarantieMobilisable =>
    ({ cle: 'engins', libelle: 'RC circulation des engins (police flotte)', nature: 'obligatoire', principale, commentaire }),
  trs: (principale = true, commentaire = 'Multirisque « tous risques sauf » : bases vie et bungalows garantis sans déclaration préalable.'): GarantieMobilisable =>
    ({ cle: 'trs', libelle: 'Multirisque bureaux et bases vie (TRS)', nature: 'facultative', principale, commentaire }),
}

/** Règle interne : sinistres à signaler à la Direction des Assurances (Guide des assurances 2026). */
const ETAPE_REGLE_GROUPE: EtapeAction = {
  texte: 'Règle groupe : enjeu ≥ 500 K€ (≥ 150 K€ en corporel), pollution ou atteinte à l’image du groupe → informer la Direction des Assurances, qui gère le dossier avec la filiale ; sinon déclaration au courtier gestionnaire (formulaire sur Dat@ssur)',
  source: 'Guide des assurances 2026',
}

const DOCS_BASE = ['Marché (AE, CCAP, CCTP) et avenants', 'Attestations d’assurance des intervenants valables à la date d’ouverture du chantier']
const DOCS_RECEPTION = ['PV de réception et liste des réserves', 'PV des OPR', 'DOE']
const DOCS_CONSTAT = ['Photos datées et localisées', 'Constat contradictoire signé ou constat de commissaire de justice (ex-huissier)']

const ETAPE_DECLARATION_RC: EtapeAction = {
  texte: 'Déclarer le sinistre à l’assureur concerné (par écrit, de préférence LRAR) dans le délai prévu au contrat',
  delai: 'Délai contractuel, au moins 5 jours ouvrés (2 jours ouvrés en cas de vol)',
  source: 'C. assur. art. L113-2',
}

const ETAPES_DO: EtapeAction[] = [
  { texte: 'Le MOA déclare le sinistre à l’assureur dommages-ouvrage par écrit (LRAR) : n° de police, adresse, date de réception, date d’apparition et description des désordres', source: 'C. assur. art. L242-1 et annexe II art. A243-1' },
  { texte: 'Déclaration incomplète : l’assureur dispose de 10 jours pour réclamer les pièces manquantes ; à défaut, elle est réputée complète. Prendre les mesures d’urgence pour éviter l’aggravation', delai: '10 jours', source: 'C. assur. annexe II art. A243-1' },
  { texte: 'Sinistre évalué à moins de 1 930 € TTC ou déclaration manifestement injustifiée : refus ou offre sans expertise (l’assuré peut contester et demander une expertise)', delai: '15 jours', source: 'Annexe II art. A243-1 ; Guide des assurances 2026' },
  { texte: 'L’assureur DO notifie sa position sur la mise en jeu des garanties, après transmission préalable du rapport d’expertise ; à défaut, la garantie est acquise', delai: '60 jours à compter de la réception de la déclaration', source: 'C. assur. art. L242-1' },
  { texte: 'L’assureur DO présente une offre d’indemnité en cas d’acceptation (prolongation possible jusqu’à 225 jours pour difficultés techniques exceptionnelles, avec l’accord de l’assuré) ; paiement dans les 15 jours de l’acceptation, avance des ¾ en cas de refus de l’offre', delai: '90 jours à compter de la réception de la déclaration', source: 'C. assur. art. L242-1 et annexe II art. A243-1' },
  { texte: 'À défaut de réponse dans les délais : l’assuré peut engager les travaux après l’avoir notifié à l’assureur ; l’indemnité est majorée de plein droit d’un intérêt égal au double du taux de l’intérêt légal', source: 'C. assur. art. L242-1' },
  { texte: 'Côté entreprise : si les travaux en cause ont été sous-traités, transmettre à l’expert l’attestation, le marché et les coordonnées du sous-traitant pour qu’il soit convoqué ; ne jamais réparer sans la validation de l’expert', source: 'Guide des assurances 2026' },
  { texte: 'Action contre l’assureur DO : prescription de 2 ans à compter de l’événement (refus, absence de réponse…)', delai: '2 ans', source: 'C. assur. art. L114-1', aVerifier: true },
]

const ETAPE_ASSIGNATION_10ANS: EtapeAction = {
  texte: 'Pour interrompre le délai décennal : une assignation (référé-expertise ou au fond) est nécessaire — une LRAR ou une déclaration à l’assureur ne suffit pas vis-à-vis du constructeur',
  delai: 'Avant l’expiration des 10 ans suivant la réception',
  source: 'C. civ. art. 1792-4-1 et 2241',
}

function base(titre: string): Recommandation {
  return { titre, garanties: [], pourquoi: [], quiContreQui: [], etapes: [], documents: [...DOCS_BASE], pieges: [], courriers: [], alertes: [], surligner: [] }
}

const libelleMoment = (m: Moment) => MOMENTS.find((x) => x.cle === m)?.libelle ?? m

/* ─────────────────────────── Désordres après réception ─────────────────────────── */

/** Désordre de gravité potentiellement décennale (solidité / impropriété à la destination). */
function desordreDecennal(s: Situation, r: Recommandation, nature: string) {
  const exclu = s.ouvrage === 'exclu'
  if (exclu)
    r.alertes.push('Ouvrage non soumis à l’obligation d’assurance (C. assur. art. L243-1-1) : la responsabilité décennale existe, mais il n’y a en principe ni DO ni assurance décennale obligatoire. Vérifier si le CCAP a exigé une assurance décennale (police RCD génie civil intégrée pour l’opération).')
  switch (s.moment) {
    case 'avant_reception':
      r.garanties.push(G.contractuelle(true, 'Avant réception, l’entreprise reste gardienne de l’ouvrage et doit reprendre les ouvrages défectueux à ses frais.'))
      if (s.trcSouscrite !== 'non') r.garanties.push(G.trc(false, 'Seulement si le dommage est accidentel (effondrement, sinistre) et si une TRC est souscrite.'))
      r.garanties.push(G.do(false, 'Avant réception, uniquement si le contrat de l’entreprise est résilié pour inexécution après mise en demeure restée infructueuse.'))
      r.pourquoi.push('Avant la réception, les garanties légales (GPA, biennale, décennale) ne jouent pas encore : c’est l’exécution du marché qui s’applique.')
      r.quiContreQui.push({ qui: 'MOE / MOA', contre: 'Entreprise', comment: 'Ordre de service de reprise, puis mise en demeure ; refus de réception ou réception avec réserves.' })
      r.etapes.push(
        { texte: 'Constater contradictoirement le désordre (compte rendu de chantier, photos)' },
        { texte: 'Notifier un ordre de service de reprise ; l’entreprise dispose de 15 jours pour émettre des réserves sur l’OS', delai: '15 jours', source: 'CCAG Travaux 2021 art. 3.8.2' },
        { texte: 'À défaut d’exécution : mise en demeure, puis mesures coercitives (exécution aux frais et risques)', source: 'CCAG Travaux 2021 art. 52', aVerifier: true },
        { texte: 'Ne pas prononcer la réception sans réserve tant que le désordre n’est pas repris' },
      )
      r.courriers.push({ type: 'mise_en_demeure', libelle: 'Mise en demeure' }, { type: 'constat', libelle: 'Constat contradictoire' })
      r.surligner.push('trc', 'do')
      break
    case 'reception':
    case 'annee1':
      r.garanties.push(G.gpa())
      r.garanties.push(G.do(false, 'Si le désordre est de nature décennale et que l’entreprise n’exécute pas après mise en demeure restée infructueuse (C. assur. art. L242-1).'))
      r.pourquoi.push(
        s.moment === 'reception'
          ? 'Désordre réservé au PV de réception : il relève de la GPA, pas de la décennale (un désordre apparent réservé ne bénéficie pas de la présomption décennale).'
          : 'Désordre apparu dans l’année qui suit la réception : il relève de la GPA ; s’il est de gravité décennale, la DO peut être mobilisée après mise en demeure infructueuse de l’entreprise.',
      )
      r.quiContreQui.push(
        { qui: 'Maître d’ouvrage', contre: 'Entreprise ayant réalisé l’ouvrage', comment: 'Notification écrite du désordre au titre de la GPA, puis mise en demeure.' },
        { qui: 'Maître d’ouvrage', contre: 'Assureur DO', comment: 'Si l’entreprise ne s’exécute pas et que le désordre est de nature décennale.' },
      )
      r.etapes.push(
        { texte: 'Notifier le désordre par écrit à l’entreprise (LRAR) en fixant un délai d’intervention', delai: 'Dans l’année suivant la réception', source: 'C. civ. art. 1792-6' },
        { texte: 'À défaut d’exécution : mise en demeure, puis exécution aux frais et risques de l’entreprise', source: 'C. civ. art. 1792-6 ; CCAG Travaux 2021 art. 41.6' },
        { texte: 'Le MOA peut prolonger le délai de garantie tant que les travaux ne sont pas achevés', source: 'CCAG Travaux 2021 art. 44.2' },
        { texte: 'Désordre décennal non repris : déclarer à l’assureur DO seulement après une mise en demeure restée infructueuse (sans réponse dans un délai raisonnable ou refus de l’entreprise)', source: 'C. assur. art. L242-1 ; Guide des assurances 2026' },
        { texte: 'Conserver la retenue de garantie jusqu’à la levée des réserves', source: 'CCP art. R2191-35' },
      )
      r.documents.push(...DOCS_RECEPTION, ...DOCS_CONSTAT, 'Copie de la mise en demeure et de son accusé de réception')
      r.pieges.push('Un désordre APPARENT à la réception et non réservé est couvert par la réception : plus de recours (ni GPA ni décennale).', 'Le délai d’un an de la GPA est un délai d’action : agir avant son expiration.')
      r.courriers.push({ type: 'mise_en_demeure', libelle: 'Mise en demeure (GPA)' })
      r.surligner.push('gpa', 'do')
      break
    case 'an1_2':
    case 'an2_10':
      r.garanties.push(G.do(true, 'Le MOA déclare d’abord à son assureur DO, qui préfinance puis exerce ses recours.'))
      r.garanties.push(G.rcd(true, 'Responsabilité décennale de plein droit du (des) constructeur(s) ayant réalisé l’ouvrage, couverte par leur assurance RCD.'))
      if (s.doSouscrite === 'non') r.garanties[0] = G.do(false, 'Pas de DO souscrite : le MOA agit directement contre les constructeurs et leurs assureurs RCD.')
      if (exclu) r.garanties.push(G.rcdgc(false))
      r.pourquoi.push(`Désordre apparu ${libelleMoment(s.moment).toLowerCase()}, de nature ${nature} : il relève de la garantie décennale (C. civ. art. 1792), à condition d’avoir été caché lors de la réception.`)
      r.quiContreQui.push(
        { qui: 'Maître d’ouvrage', contre: 'Assureur DO', comment: 'Déclaration de sinistre (LRAR) — préfinancement des réparations.' },
        { qui: 'Assureur DO / MOA', contre: 'Constructeurs (entreprise, MOE, BET) et leurs assureurs RCD', comment: 'Recours subrogatoire de l’assureur DO ou action directe du MOA (C. assur. art. L124-3).' },
        { qui: 'Entreprise mise en cause', contre: 'Son assureur RCD (et son sous-traitant éventuel)', comment: 'Transmettre sans délai la réclamation et participer à l’expertise.' },
      )
      if (s.doSouscrite !== 'non') r.etapes.push(...ETAPES_DO)
      else r.etapes.push({ texte: 'Mettre en cause le constructeur et son assureur RCD (attestation valable à la date d’ouverture du chantier)', source: 'C. assur. art. L124-3' })
      r.etapes.push(ETAPE_ASSIGNATION_10ANS)
      r.documents.push(...DOCS_RECEPTION, ...DOCS_CONSTAT, 'Police DO (n° de contrat)', 'Déclaration réglementaire d’ouverture de chantier (DOC)')
      r.pieges.push(
        'Le délai de 10 ans court à compter de la réception : seule une action en justice l’interrompt.',
        'Vérifier que l’activité déclarée par l’entreprise à son assureur couvre les travaux en cause.',
        'Un désordre purement esthétique ou mineur n’est pas décennal : il relève alors de la responsabilité contractuelle (faute à prouver).',
      )
      r.courriers.push({ type: 'transmission', libelle: 'Transmission de documents (déclaration de sinistre)' })
      r.surligner.push('do', 'rcd')
      if (exclu) r.surligner.push('rcdgc')
      break
    case 'plus10':
      r.garanties.push({ cle: 'aucune', libelle: 'Plus de garantie décennale', nature: 'responsabilite', principale: true, commentaire: 'Les actions contre les constructeurs sont prescrites 10 ans après la réception (C. civ. art. 1792-4-1 et 1792-4-3).' })
      r.pourquoi.push('Au-delà de 10 ans après la réception, la garantie décennale, la DO et la responsabilité contractuelle des constructeurs sont expirées, sauf action interrompue avant le terme ou faute dolosive (cas exceptionnel).')
      r.etapes.push(
        { texte: 'Vérifier si une action (assignation, référé-expertise) a été introduite avant l’expiration des 10 ans', source: 'C. civ. art. 2241' },
        { texte: 'Consulter le service juridique en cas de soupçon de faute dolosive (dissimulation volontaire)', aVerifier: true },
        { texte: 'À défaut : réparation à la charge du propriétaire (entretien / travaux neufs)' },
      )
      r.pieges.push('Une simple déclaration ou une LRAR n’a pas interrompu le délai décennal.')
      r.surligner.push('rcd', 'do')
      break
  }
}

/* ─────────────────────────── Règles par problématique ─────────────────────────── */

type Regle = (s: Situation) => Recommandation

const REGLES: Record<Probleme, Regle> = {
  fissure_structurelle: (s) => {
    const r = base('Atteinte à la solidité de l’ouvrage')
    desordreDecennal(s, r, 'compromettre la solidité de l’ouvrage')
    return r
  },

  infiltration: (s) => {
    const r = base('Infiltrations / défaut d’étanchéité')
    desordreDecennal(s, r, 'rendre l’ouvrage impropre à sa destination (si les infiltrations sont généralisées ou récurrentes)')
    if (s.moment === 'an1_2' || s.moment === 'an2_10')
      r.pieges.push('Des infiltrations ponctuelles sans conséquence sur l’usage peuvent ne pas être jugées décennales : faire qualifier le désordre par l’expert.')
    return r
  },

  equipement_indissociable: (s) => {
    const r = base('Équipement indissociable défaillant')
    desordreDecennal(s, r, 'affecter un élément d’équipement indissociable (C. civ. art. 1792-2)')
    return r
  },

  equipement_dissociable: (s) => {
    const r = base('Équipement dissociable qui ne fonctionne pas')
    if (s.moment === 'avant_reception') {
      r.garanties.push(G.contractuelle(true, 'Avant réception : l’entreprise doit livrer un équipement en état de fonctionnement (essais, OPR).'))
      r.etapes.push({ texte: 'Faire constater le dysfonctionnement lors des essais / OPR et l’inscrire en réserve', source: 'CCAG Travaux 2021 art. 41' })
      r.courriers.push({ type: 'reserves', libelle: 'Émission de réserves' })
    } else if (s.moment === 'reception' || s.moment === 'annee1') {
      r.garanties.push(G.gpa(), G.biennale(false))
      r.pourquoi.push('Dans l’année de parfait achèvement, la GPA couvre tous les désordres ; la biennale s’applique aussi aux équipements dissociables.')
      r.etapes.push(
        { texte: 'Notifier le dysfonctionnement par écrit à l’entreprise (LRAR)', source: 'C. civ. art. 1792-6' },
        { texte: 'À défaut d’intervention : mise en demeure puis exécution aux frais de l’entreprise', source: 'CCAG Travaux 2021 art. 41.6' },
      )
      r.courriers.push({ type: 'mise_en_demeure', libelle: 'Mise en demeure (GPA)' })
      r.surligner.push('gpa', 'biennale')
    } else if (s.moment === 'an1_2') {
      r.garanties.push(G.biennale())
      r.pourquoi.push('Élément d’équipement dissociable (démontable sans détériorer l’ouvrage) défaillant moins de 2 ans après la réception : garantie biennale de bon fonctionnement (C. civ. art. 1792-3).')
      r.quiContreQui.push({ qui: 'Maître d’ouvrage', contre: 'Entreprise ayant posé l’équipement', comment: 'Réclamation écrite puis action avant l’expiration des 2 ans.' })
      r.etapes.push(
        { texte: 'Adresser une réclamation écrite (LRAR) à l’entreprise' },
        { texte: 'À défaut de solution : agir en justice avant l’expiration du délai', delai: '2 ans à compter de la réception', source: 'C. civ. art. 1792-3' },
        { texte: 'Si le dysfonctionnement rend l’ouvrage dans son ensemble impropre à sa destination : il peut relever de la décennale (faire qualifier par un expert)', aVerifier: true },
      )
      r.courriers.push({ type: 'mise_en_demeure', libelle: 'Mise en demeure' })
      r.surligner.push('biennale')
    } else if (s.moment === 'an2_10') {
      r.garanties.push({ cle: 'aucune', libelle: 'Garantie biennale expirée', nature: 'responsabilite', principale: true, commentaire: 'Le délai de 2 ans est écoulé.' })
      r.garanties.push(G.rcd(false, 'Seulement si le dysfonctionnement rend l’ouvrage dans son ensemble impropre à sa destination.'))
      r.pourquoi.push('Plus de 2 ans après la réception, un équipement dissociable n’est plus garanti, sauf impropriété de l’ouvrage à sa destination (décennale).')
      r.etapes.push({ texte: 'Faire qualifier le désordre (impropriété à la destination ?) avant toute déclaration', aVerifier: true })
      r.surligner.push('biennale', 'rcd')
    } else {
      r.garanties.push({ cle: 'aucune', libelle: 'Aucune garantie légale', nature: 'responsabilite', principale: true, commentaire: 'Délais biennal et décennal expirés.' })
      r.pourquoi.push('Plus de 10 ans après la réception : remplacement à la charge du propriétaire.')
    }
    r.documents.push(...DOCS_RECEPTION, 'Notices et garanties fabricant de l’équipement', 'Contrats d’entretien / de maintenance')
    r.pieges.push('Une garantie fabricant (commerciale) peut s’ajouter aux garanties légales : la vérifier.', 'Un défaut d’entretien ou une usure normale n’est pas couvert.')
    return r
  },

  esthetique: (s) => {
    const r = base('Défaut esthétique / finitions')
    if (s.moment === 'avant_reception' || s.moment === 'reception' || s.moment === 'annee1') {
      if (s.moment === 'avant_reception') {
        r.garanties.push(G.contractuelle(true, 'Faire reprendre avant la réception (ordre de service, réserves aux OPR).'))
        r.courriers.push({ type: 'reserves', libelle: 'Émission de réserves' })
      } else {
        r.garanties.push(G.gpa())
        r.courriers.push({ type: 'mise_en_demeure', libelle: 'Mise en demeure (GPA)' })
        r.surligner.push('gpa')
      }
      r.pourquoi.push('Un défaut esthétique n’est en principe ni décennal ni biennal : il doit être réservé à la réception ou signalé dans l’année de parfait achèvement.')
      r.etapes.push({ texte: 'Signaler par écrit le défaut à l’entreprise avec photos et localisation', source: 'C. civ. art. 1792-6' })
    } else if (s.moment !== 'plus10') {
      r.garanties.push(G.contractuelle(true, 'Après la GPA : responsabilité contractuelle de droit commun pour faute prouvée, 10 ans après réception (C. civ. art. 1792-4-3).'))
      r.pourquoi.push('Défaut non décennal apparu après l’année de parfait achèvement (« dommage intermédiaire ») : il faut prouver une faute de l’entreprise.')
      r.etapes.push({ texte: 'Réunir les preuves de la faute (non-respect du CCTP, des DTU / règles de l’art)' }, { texte: 'Réclamation écrite puis, à défaut, action en justice', delai: '10 ans à compter de la réception', source: 'C. civ. art. 1792-4-3' })
    } else {
      r.garanties.push({ cle: 'aucune', libelle: 'Aucune garantie', nature: 'responsabilite', principale: true, commentaire: 'Délais expirés.' })
    }
    r.documents.push(...DOCS_RECEPTION, ...DOCS_CONSTAT, 'CCTP (exigences d’aspect, échantillons validés)')
    r.pieges.push('Un défaut esthétique apparent non réservé à la réception est accepté par le MOA.', 'Les assurances (DO, RCD) ne couvrent pas les désordres purement esthétiques.')
    r.surligner.push('gpa')
    return r
  },

  non_conformite: (s) => {
    const r = base('Non-conformité au marché')
    if (s.moment === 'plus10') {
      r.garanties.push({ cle: 'aucune', libelle: 'Action prescrite', nature: 'responsabilite', principale: true, commentaire: 'Plus de 10 ans après la réception (C. civ. art. 1792-4-3).' })
    } else {
      r.garanties.push(G.contractuelle(true, 'Inexécution du marché : reprise ou réfaction de prix ; pas d’assurance construction sans désordre.'))
      if (s.moment === 'reception' || s.moment === 'annee1') r.garanties.push(G.gpa(false))
    }
    r.pourquoi.push('Une non-conformité sans désordre (solidité et usage intacts) ne relève pas de la décennale ni de la DO : c’est une question d’exécution du contrat.')
    r.etapes.push(
      { texte: s.moment === 'avant_reception' ? 'Ordre de service de mise en conformité ; réserves possibles du titulaire sous 15 jours' : 'Réserve au PV de réception ou réclamation écrite', source: s.moment === 'avant_reception' ? 'CCAG Travaux 2021 art. 3.8.2' : 'CCAG Travaux 2021 art. 41' },
      { texte: 'Le MOA peut accepter l’ouvrage non conforme moyennant une réfaction sur les prix', source: 'CCAG Travaux 2021 art. 41.7', aVerifier: true },
    )
    r.documents.push('CCTP, plans marché et plans d’exécution visés', ...DOCS_CONSTAT)
    r.pieges.push('Une non-conformité apparente acceptée sans réserve à la réception ne peut plus être reprochée.')
    r.courriers.push({ type: s.moment === 'avant_reception' ? 'mise_en_demeure' : 'reserves', libelle: s.moment === 'avant_reception' ? 'Mise en demeure' : 'Émission de réserves' })
    return r
  },

  reserve_non_levee: (s) => {
    const r = base('Réserve de réception non levée')
    if (s.moment === 'avant_reception') r.alertes.push('Une réserve de réception n’existe qu’à partir de la réception : choisir « À la réception » ou une période postérieure.')
    if (s.moment === 'an1_2' || s.moment === 'an2_10' || s.moment === 'plus10') {
      r.garanties.push(G.gpa(true, 'Délai de garantie prolongé par le MOA ou action engagée dans l’année ? Sinon la GPA est expirée.'))
      r.garanties.push(G.contractuelle(false, 'Les réserves non levées maintiennent la responsabilité contractuelle de l’entreprise (pas la décennale).'))
      r.pourquoi.push('Une réserve non levée relève de la GPA ; passé le délai de garantie, vérifier si le MOA l’a prolongé (CCAG 2021 art. 44.2) ou si une action a été engagée.')
    } else {
      r.garanties.push(G.gpa())
      r.garanties.push(G.do(false, 'Si la réserve porte sur un désordre de gravité décennale et que l’entreprise ne s’exécute pas après mise en demeure.'))
      r.pourquoi.push('Les réserves doivent être levées dans le délai fixé par le MOA, à défaut au plus tard 3 mois avant la fin du délai de garantie (CCAG 2021 art. 41.6).')
    }
    r.quiContreQui.push({ qui: 'Maître d’ouvrage (via le MOE)', contre: 'Entreprise titulaire', comment: 'Mise en demeure de lever les réserves, puis exécution aux frais et risques.' })
    r.etapes.push(
      { texte: 'Relancer par écrit avec la liste des réserves restant à lever et un délai', source: 'CCAG Travaux 2021 art. 41.6' },
      { texte: 'Mise en demeure (LRAR) ; à défaut d’exécution, faire réaliser les travaux aux frais et risques du titulaire', source: 'CCAG Travaux 2021 art. 41.6' },
      { texte: 'Prolonger le délai de garantie si les réserves ne sont pas levées à son terme', source: 'CCAG Travaux 2021 art. 44.2' },
      { texte: 'La retenue de garantie n’est remboursée que 30 jours après la levée des réserves', source: 'CCP art. R2191-35' },
    )
    r.documents.push(...DOCS_RECEPTION, 'PV de levée des réserves partiels', 'Décision de prolongation du délai de garantie')
    r.pieges.push('Laisser expirer le délai de garantie sans le prolonger ni agir fait perdre le bénéfice de la GPA.', 'Le PV de levée des réserves doit être signé par le MOE/MOA.')
    r.courriers.push({ type: 'mise_en_demeure', libelle: 'Mise en demeure (levée des réserves)' })
    r.surligner.push('gpa')
    return r
  },

  dommage_ouvrage_travaux: (s) => {
    const r = base('Dommage à l’ouvrage en cours de travaux')
    if (s.moment !== 'avant_reception')
      r.alertes.push('Après la réception, un dommage à l’ouvrage relève de la GPA, de la DO ou de la décennale : choisir la problématique « fissures / infiltrations… ».')
    if (s.trcSouscrite === 'oui') {
      r.garanties.push(G.trc(true))
      r.pourquoi.push('Une police TRC est souscrite : elle indemnise les dommages matériels à l’ouvrage en cours de travaux, sans recherche préalable de responsabilité (sous déduction de la franchise).')
    } else {
      if (s.trcSouscrite === 'inconnu') r.garanties.push(G.trc(false, 'Vérifier dans le CCAP si une TRC a été souscrite (par le MOA ou l’entreprise générale).'))
      r.garanties.push(G.contractuelle(true, 'Sans TRC : jusqu’à la réception, l’entreprise supporte les pertes et avaries de ses ouvrages, sauf force majeure (à analyser).'))
      r.garanties.push(G.rc(false, 'Si le dommage est imputable à un autre intervenant ou à un tiers : recours contre sa RC.'))
      r.pourquoi.push('Avant réception, l’ouvrage est sous la garde de l’entreprise : elle supporte en principe la charge de sa reconstruction.')
    }
    r.quiContreQui.push(
      { qui: 'Entreprise (ou MOA souscripteur)', contre: 'Assureur TRC', comment: 'Déclaration de sinistre immédiate.' },
      { qui: 'Entreprise sinistrée', contre: 'Responsable éventuel (autre lot, tiers) et son assureur RC', comment: 'Recours si le dommage lui est imputable.' },
    )
    r.etapes.push(
      { texte: 'Mettre en sécurité le chantier ; mesures conservatoires (bâchage, étaiement) sans démolir les éléments de preuve' },
      { texte: 'Informer immédiatement le MOE / MOA et le CSPS ; constat contradictoire', source: 'CCAG Travaux 2021 art. 11' },
      ETAPE_DECLARATION_RC,
      { texte: 'Événement naturel exceptionnel : signaler par écrit au MOA (demande éventuelle d’indemnisation au titre des pertes et avaries / force majeure)', source: 'CCAG Travaux 2021 art. 17', aVerifier: true },
      { texte: 'Attendre l’accord de l’expert avant de reconstruire' },
    )
    if (s.trcSouscrite !== 'non')
      r.etapes.push({ texte: 'TRC souscrite par le MOA : le sinistre se déclare sur sa police (lui demander de déclarer sans délai) ; ne jamais faire état de la police TRC annuelle du groupe. Police du groupe : franchise de 20 % du sinistre (mini 45 000 €, maxi 100 000 €)', source: 'Guide des assurances 2026' })
    r.documents.push(...DOCS_CONSTAT, 'Police TRC et conditions particulières (franchise)', 'Bulletins météo (Météo-France) si événement climatique', 'Journal de chantier')
    r.pieges.push(
      'Déclarer hors délai peut entraîner une déchéance de garantie si l’assureur prouve un préjudice (C. assur. art. L113-2).',
      'Reconstruire avant l’expertise fait perdre les preuves.',
      'Prise de possession ou mise à disposition anticipée : la garantie TRC s’arrête ; la garde doit avoir été transférée au MOA par écrit.',
      'Groupement : la franchise TRC reste à répartir entre les membres selon la convention de groupement.',
    )
    r.courriers.push({ type: 'constat', libelle: 'Constat contradictoire' })
    r.surligner.push('trc', 'rc')
    return r
  },

  vol_chantier: (s) => {
    const r = base('Vol ou vandalisme sur le chantier')
    if (s.moment !== 'avant_reception') r.alertes.push('Après réception, un vol ou une dégradation relève de l’assurance du propriétaire (multirisque).')
    r.garanties.push(s.trcSouscrite === 'non' ? G.contractuelle(true, 'Sans TRC : l’entreprise, gardienne du chantier jusqu’à la réception, supporte la perte de ses ouvrages et matériaux.') : G.trc(true, 'Ouvrages et matériaux sur chantier : la TRC du groupe couvre le vol et la tentative de vol avec effraction ou détérioration, et le vandalisme (franchise 20 %, mini 45 000 €).'))
    r.garanties.push(G.bdm(false, 'Engins et matériels volés ou vandalisés (loués ou en propriété) : bris de machine, franchise 10 % (mini 5 000 €, maxi 25 000 €).'))
    r.garanties.push(G.trs(false, 'Vol dans la base vie ou les bungalows : multirisque TRS, plafond 150 000 €, franchise 12 000 € ; le vol de biens stockés en plein air n’est pas garanti.'))
    r.etapes.push(
      { texte: 'Déposer plainte au commissariat / à la gendarmerie en listant précisément les biens volés ; conserver le récépissé' },
      { texte: 'Déclarer le vol à l’assureur (TRC, bris de machine ou TRS selon les biens) via le courtier', delai: '2 jours ouvrés (sauf délai plus long au contrat)', source: 'C. assur. art. L113-2' },
      { texte: 'Matériel loué : prévenir immédiatement le loueur et lui transmettre la plainte' },
      { texte: 'Informer le MOE / MOA ; inscrire l’événement au journal de chantier ; renforcer la sécurisation' },
    )
    r.documents.push('Récépissé de dépôt de plainte listant les biens', 'Factures / inventaire des biens volés, bons de location', ...DOCS_CONSTAT)
    r.pieges.push('Les polices exigent souvent des mesures de protection (clôture, fermeture, gardiennage) : à défaut, refus de garantie.', 'Un bien non listé dans la plainte ne sera pas indemnisé.')
    r.courriers.push({ type: 'transmission', libelle: 'Transmission de documents' })
    r.surligner.push('trc', 'bdm', 'trs')
    return r
  },

  dommage_voisin: (s) => {
    const r = base('Dommage à un tiers / riverain / bâtiment voisin')
    r.garanties.push(G.rc(true, 'RC exploitation de l’entreprise dont l’intervention a causé le dommage (programme du groupe : troubles anormaux du voisinage 4 M€ par sinistre, franchise 250 000 € ; recours des voisins et des tiers franchise 450 000 €).'))
    r.garanties.push({ cle: 'voisinage', libelle: 'Responsabilité pour troubles anormaux du voisinage', nature: 'responsabilite', principale: false, commentaire: 'Responsabilité sans faute du maître d’ouvrage et des constructeurs vis-à-vis des voisins (C. civ. art. 1253, loi du 15 avril 2024).' })
    r.pourquoi.push('Les dommages aux tiers pendant les travaux relèvent de la responsabilité civile ; le voisin peut agir contre le MOA (troubles anormaux du voisinage) qui se retourne contre l’entreprise responsable.')
    if (s.role === 'moa') r.quiContreQui.push({ qui: 'Maître d’ouvrage mis en cause', contre: 'Entreprise responsable et son assureur RC (et sa propre RC « maître d’ouvrage »)', comment: 'Appeler en garantie l’entreprise ; déclarer à son propre assureur.' })
    r.quiContreQui.push(
      { qui: 'Tiers / voisin', contre: 'Entreprise et/ou MOA', comment: 'Réclamation amiable puis action en responsabilité.' },
      { qui: 'Entreprise', contre: 'Son assureur RC', comment: 'Déclaration de sinistre ; ne pas reconnaître seule sa responsabilité.' },
    )
    r.etapes.push(
      { texte: 'Mesures conservatoires et sécurisation (étaiement, arrêt de l’atelier en cause)' },
      { texte: 'Constat contradictoire avec le tiers (photos, témoins) ; idéalement constat de commissaire de justice' },
      ETAPE_DECLARATION_RC,
      { texte: 'Prévoir un référé préventif (état des lieux avant travaux) sur les prochains chantiers sensibles' },
      { texte: 'Prescription de l’action du tiers', delai: '5 ans (10 ans en cas de dommage corporel)', source: 'C. civ. art. 2224 et 2226' },
    )
    r.documents.push('Référé préventif / constat d’état des avoisinants avant travaux', ...DOCS_CONSTAT, 'Attestation RC de l’entreprise concernée')
    r.pieges.push('Ne pas reconnaître de responsabilité ni promettre d’indemnisation sans accord de l’assureur.', 'Sans état des lieux avant travaux, difficile de prouver que la fissure préexistait.')
    r.courriers.push({ type: 'constat', libelle: 'Constat contradictoire' })
    r.surligner.push('rc')
    return r
  },

  blessure_tiers: () => {
    const r = base('Blessure d’un tiers ou d’un salarié sur le chantier')
    r.garanties.push(G.rc(true, 'Dommage corporel d’un tiers : RC de l’entreprise responsable (ou du MOA selon les circonstances).'))
    r.pourquoi.push('Dommage corporel causé à un tiers : responsabilité civile. Si la victime est un salarié, il s’agit d’un accident du travail (régime de la sécurité sociale).')
    r.quiContreQui.push({ qui: 'Victime', contre: 'Entreprise / MOA', comment: 'Action en responsabilité ; l’assureur RC gère la réclamation.' })
    r.etapes.push(
      { texte: 'Porter secours, alerter les secours (15 / 18 / 112), sécuriser la zone' },
      { texte: 'Informer le MOE, le MOA et le CSPS ; conserver les lieux en l’état pour l’enquête' },
      { texte: 'Salarié : déclaration d’accident du travail à la CPAM', delai: '48 heures (hors dimanches et jours fériés)', source: 'Code de la sécurité sociale art. R441-3' },
      { texte: 'Accident grave ou mortel : informer l’inspection du travail', aVerifier: true },
      ETAPE_DECLARATION_RC,
    )
    r.documents.push('PPSPS, PGC, registre de sécurité', 'Témoignages', 'Plan d’installation de chantier (clôtures, signalisation)')
    r.pieges.push('Le défaut de clôture ou de signalisation du chantier est une cause fréquente de mise en cause du titulaire.')
    r.courriers.push({ type: 'transmission', libelle: 'Transmission de documents' })
    r.surligner.push('rc')
    return r
  },

  dommage_sous_traitant: (s) => {
    const r = base('Dommage causé par un sous-traitant')
    r.garanties.push(G.st(true))
    r.garanties.push(G.rc(false, 'Pendant les travaux : RC exploitation du sous-traitant (dommages aux tiers) et de l’entreprise principale.'))
    if (s.moment !== 'avant_reception' && s.moment !== 'plus10') r.garanties.push(G.rcd(false, 'Désordre décennal après réception : l’entreprise principale (constructeur) en répond vis-à-vis du MOA, puis se retourne contre son sous-traitant.'))
    r.pourquoi.push('Vis-à-vis du maître d’ouvrage, l’entreprise principale répond de son sous-traitant ; elle exerce ensuite son recours contractuel contre lui (loi n° 75-1334 du 31 décembre 1975).')
    r.quiContreQui.push(
      { qui: 'Maître d’ouvrage', contre: 'Entreprise principale (et ses assureurs)', comment: 'Le MOA n’a pas de lien contractuel avec le sous-traitant.' },
      { qui: 'Entreprise principale', contre: 'Sous-traitant et son assureur', comment: 'Recours contractuel ; actions possibles 10 ans après la réception (C. civ. art. 1792-4-2).' },
    )
    if (s.role === 'sous_traitant') r.quiContreQui.push({ qui: 'Sous-traitant', contre: 'Son assureur RC / décennale', comment: 'Déclarer sans délai la réclamation de l’entreprise principale.' })
    r.etapes.push(
      { texte: 'Informer le sous-traitant par écrit et lui demander de déclarer à son assureur' },
      { texte: 'Vérifier l’attestation d’assurance du sous-traitant (activités, validité à l’ouverture du chantier)' },
      ETAPE_DECLARATION_RC,
      { texte: 'Retenir les sommes nécessaires selon le contrat de sous-traitance (si paiement direct : informer le MOA)', aVerifier: true },
    )
    r.documents.push('Contrat de sous-traitance, DC4 / acte spécial', 'Attestations RC et décennale du sous-traitant', ...DOCS_CONSTAT)
    r.pieges.push('Sous-traitant non accepté par le MOA : l’entreprise principale s’expose à des sanctions et perd des moyens de recours.', 'Attestation d’assurance non vérifiée avant le démarrage.')
    r.courriers.push({ type: 'mise_en_demeure', libelle: 'Mise en demeure' })
    r.surligner.push('st', 'rc')
    return r
  },

  dommage_engin: () => {
    const r = base('Engin ou matériel endommagé, volé — ou dommage causé par un engin')
    r.garanties.push(G.bdm(true))
    r.garanties.push(G.engins(false))
    r.garanties.push(G.rc(false, 'Engin en « fonction outil » (pelle qui heurte un réseau, grue…) : c’est la RC générale de l’entreprise qui intervient.'))
    r.pourquoi.push(
      'Les dommages SUBIS par l’engin ou le matériel (casse, renversement, vol, incendie) relèvent du bris de machine, qu’il soit loué ou en propriété.',
      'Les dommages CAUSÉS aux tiers relèvent de la police flotte si l’engin circule (véhicule terrestre à moteur, C. assur. art. L211-1), de la RC générale s’il travaille en fonction outil.',
    )
    r.quiContreQui.push(
      { qui: 'Filiale gardienne', contre: 'Assureur bris de machine (via le courtier dédié)', comment: 'Les contrats cadres excluent les garanties des loueurs : produire l’attestation annuelle bris de machine.' },
      { qui: 'Tiers lésé', contre: 'Entreprise et son assureur (flotte ou RC)', comment: 'Selon que l’engin circulait ou travaillait.' },
    )
    r.etapes.push(
      { texte: 'Sécuriser, établir un constat (constat amiable si un autre véhicule est impliqué), photos' },
      { texte: 'Déclarer le sinistre bris de machine au courtier gestionnaire (formulaire « Bris de machines » sur Dat@ssur) ; vol : plainte et déclaration sous 2 jours ouvrés', delai: '5 jours ouvrés (2 jours ouvrés en cas de vol)', source: 'C. assur. art. L113-2' },
      { texte: 'Engin loué : prévenir immédiatement le loueur ; refuser sa garantie « casse » en produisant l’attestation annuelle du groupe' },
      { texte: 'Dommage à un tiers : déclaration RC ou flotte selon le cas', source: 'Guide des assurances 2026' },
    )
    r.documents.push('Bon de location (accessoires listés) ou inventaire, carte grise de l’engin immatriculé', 'CACES / autorisation de conduite du conducteur', ...DOCS_CONSTAT)
    r.pieges.push(
      'Non couverts : camions (police flotte), consommables (dents, couteaux, forets), pneumatiques, usure, matériel > 2 M€ HT ou mis à disposition d’un tiers.',
      'Non-respect des conditions de manutention ou d’utilisation : refus de garantie.',
      'Conducteur sans autorisation de conduite (CACES) : risque de refus ou de recours de l’assureur.',
    )
    r.surligner.push('bdm', 'engins')
    return r
  },

  pollution: () => {
    const r = base('Atteinte à l’environnement')
    r.garanties.push({ cle: 'env', libelle: 'RC atteinte à l’environnement', nature: 'facultative', principale: true, commentaire: 'Pollution accidentelle : RC de 1re ligne, 1,525 M€ par sinistre et par an (dont préjudice écologique 1,5 M€), complétée par la RC AE de VINCI SA. Pollution graduelle : contrat de VINCI SA.' })
    r.garanties.push(G.rc(false, 'Dommages aux tiers consécutifs à la pollution accidentelle (même programme RC).'))
    r.pourquoi.push('Une pollution soudaine (fausse manœuvre, rupture fortuite de canalisation) est couverte par la RC de 1re ligne ; une pollution qui se manifeste progressivement relève du contrat de VINCI SA. Dans les deux cas, la Direction des Assurances gère le dossier.')
    r.etapes.push(
      { texte: 'Stopper la fuite, confiner (kits absorbants, barrages), protéger réseaux et cours d’eau' },
      { texte: 'Alerter le MOE / MOA, et selon la gravité les autorités (mairie, services de l’État, gestionnaire de réseau)', aVerifier: true },
      { texte: 'Règle groupe : tout sinistre pollution (accidentelle ou graduelle) est signalé à la Direction des Assurances, qui pilote la déclaration', source: 'Guide des assurances 2026' },
      ETAPE_DECLARATION_RC,
      { texte: 'Évacuer les terres et produits souillés en filière agréée ; conserver les bordereaux de suivi de déchets', source: 'CCAG Travaux 2021 art. 36' },
    )
    r.documents.push('Bordereaux de suivi des déchets (BSD)', 'Fiches de données de sécurité des produits', ...DOCS_CONSTAT)
    r.pieges.push('La pollution graduelle n’est pas couverte par la RC de 1re ligne : ne pas la déclarer sur ce contrat.', 'Marché exigeant un plafond supérieur : demander une attestation 2e ligne (72 h) avant la signature.')
    r.surligner.push('env', 'rc')
    return r
  },

  defaut_conception: (s) => {
    const r = base('Défaut de conception')
    if (s.moment === 'avant_reception') {
      r.garanties.push(G.rc(true, 'RC professionnelle du concepteur (MOE, BET) pour l’erreur d’étude.'))
      r.garanties.push(G.contractuelle(false, 'Le titulaire peut être tenu d’un devoir de conseil s’il a constaté l’erreur ; il doit la signaler.'))
      r.pourquoi.push('Avant réception, l’erreur de conception engage la responsabilité contractuelle du concepteur (et de son assureur RC professionnelle).')
      r.etapes.push(
        { texte: 'Signaler par écrit l’erreur au MOE / MOA et demander des instructions (ne pas exécuter un ouvrage manifestement erroné)' },
        { texte: 'Si un OS impose la solution : émettre des réserves sous 15 jours', delai: '15 jours', source: 'CCAG Travaux 2021 art. 3.8.2' },
        { texte: 'Chiffrer les conséquences (prix nouveaux, délai) et les notifier', source: 'CCAG Travaux 2021 art. 13 et 18', aVerifier: true },
      )
      r.courriers.push({ type: 'reserves', libelle: 'Émission de réserves' }, { type: 'prix_nouveau', libelle: 'Demande de prix nouveau / réclamation' })
      r.surligner.push('rc')
    } else {
      desordreDecennal(s, r, 'trouver son origine dans une erreur de conception (le concepteur est un constructeur au sens de l’art. 1792-1 C. civ.)')
      r.quiContreQui.push({ qui: 'Assureur DO / MOA', contre: 'MOE, BET et leurs assureurs RCD', comment: 'Le concepteur est un constructeur au sens de l’art. 1792-1 C. civ.' })
    }
    r.documents.push('Études, notes de calcul, plans visés (VISA)', 'Comptes rendus de chantier mentionnant les alertes')
    r.pieges.push('L’entreprise qui exécute sans réserve une conception manifestement erronée peut voir sa responsabilité partagée (devoir de conseil).')
    return r
  },

  entreprise_liquidee: (s) => {
    const r = base('Entreprise responsable disparue (liquidation)')
    if (s.moment === 'plus10') {
      r.garanties.push({ cle: 'aucune', libelle: 'Plus de garantie', nature: 'responsabilite', principale: true, commentaire: 'Délai décennal expiré.' })
    } else if (s.moment === 'avant_reception' || s.moment === 'reception' || s.moment === 'annee1') {
      r.garanties.push(G.do(true, 'Avant réception : si le contrat a été résilié après mise en demeure infructueuse ; dans l’année de GPA : désordre décennal non repris après mise en demeure.'))
      r.garanties.push(G.contractuelle(false, 'Déclarer la créance au mandataire liquidateur (faible chance de recouvrement).'))
      r.etapes.push(
        { texte: 'Déclarer la créance auprès du mandataire judiciaire', delai: '2 mois à compter de la publication du jugement au BODACC', source: 'C. com. art. R622-24', aVerifier: true },
        { texte: 'Mettre en demeure l’entreprise / le liquidateur, puis saisir l’assureur DO', source: 'C. assur. art. L242-1' },
      )
    } else {
      r.garanties.push(G.do(true, 'La DO préfinance sans attendre la recherche de responsabilité.'))
      r.garanties.push(G.rcd(true, 'Action directe contre l’assureur RCD de l’entreprise liquidée (assureur à la date d’ouverture du chantier).'))
      r.etapes.push(...ETAPES_DO, { texte: 'Sans DO : action directe contre l’assureur RCD de l’entreprise disparue', source: 'C. assur. art. L124-3' }, ETAPE_ASSIGNATION_10ANS)
    }
    r.pourquoi.push('La liquidation de l’entreprise ne fait pas disparaître son assurance décennale : l’assureur reste tenu pour les chantiers ouverts pendant la période de validité du contrat.')
    r.quiContreQui.push({ qui: 'Maître d’ouvrage', contre: 'Assureur DO, puis assureur RCD de l’entreprise liquidée', comment: 'Action directe (C. assur. art. L124-3).' })
    r.documents.push('Attestation d’assurance décennale de l’entreprise valable à l’ouverture du chantier (indispensable pour identifier l’assureur)', 'Extrait Kbis / jugement de liquidation', ...DOCS_RECEPTION)
    r.pieges.push('Sans attestation d’assurance conservée, retrouver l’assureur est difficile : archiver les attestations de chaque chantier.')
    r.courriers.push({ type: 'transmission', libelle: 'Transmission de documents (déclaration de sinistre)' })
    r.surligner.push('do', 'rcd')
    return r
  },
  dommage_existant: (s) => {
    const r = base('Dommage à un ouvrage existant')
    if (s.moment === 'avant_reception') {
      r.garanties.push(G.rc(true, 'Existants et biens confiés du maître d’ouvrage : RC exploitation de l’entreprise (programme du groupe, dommages aux existants inclus dans le plafond de 10 M€ par sinistre).'))
      if (s.trcSouscrite !== 'non')
        r.garanties.push(G.trc(false, 'Seulement si la police de chantier comporte l’option « Existants » (la TRC annuelle du groupe ne couvre pas les existants ; certaines polices excluent l’incendie, la foudre et l’explosion).'))
      r.pourquoi.push('Pendant les travaux, les biens existants du maître d’ouvrage (situés sur, sous ou à proximité du chantier) ne font pas partie de l’ouvrage assuré en TRC, sauf option : leur endommagement relève de la responsabilité civile de l’entreprise.')
      r.etapes.push(
        { texte: 'Mesures conservatoires (bâchage, étaiement, mise hors d’eau) et constat contradictoire avec le MOA' },
        ETAPE_DECLARATION_RC,
        { texte: 'Réhabilitation : vérifier que le marché prévoit la garantie des existants contre l’incendie, la foudre et l’explosion par le MOA', source: 'Guide des assurances 2026' },
      )
      r.surligner.push('rc', 'trc')
    } else if (s.moment === 'plus10') {
      r.garanties.push({ cle: 'aucune', libelle: 'Plus de garantie', nature: 'responsabilite', principale: true, commentaire: 'Délais d’action expirés (10 ans après la réception).' })
    } else {
      r.garanties.push(G.rcd(true, 'Après réception : la police RCD du groupe couvre les dommages aux existants divisibles consécutifs à un désordre décennal (1 M€ par sinistre).'))
      r.garanties.push(G.do(false, 'La DO peut comporter une garantie complémentaire des existants, si elle a été souscrite.'))
      r.pourquoi.push('Un existant totalement incorporé à l’ouvrage neuf et devenu techniquement indivisible suit le régime de l’ouvrage neuf ; sinon, ses dommages sont couverts par les garanties complémentaires « existants » (C. assur. art. L243-1-1 II).')
      r.etapes.push({ texte: 'Faire qualifier le désordre par l’expert (existant divisible ou indivisible, lien avec les travaux neufs)' }, ETAPE_ASSIGNATION_10ANS)
      r.surligner.push('rcd', 'do')
    }
    r.documents.push('Diagnostic / état des lieux des existants avant travaux', ...DOCS_CONSTAT)
    r.pieges.push('Sans état des lieux contradictoire avant travaux, il est difficile de prouver l’état antérieur.', 'Ne pas reconnaître seul sa responsabilité.')
    r.courriers.push({ type: 'constat', libelle: 'Constat contradictoire' })
    return r
  },

  reclamation_tiers: (s) => {
    const r = base('Réclamation ou mise en cause d’un tiers')
    if (s.moment === 'avant_reception') r.garanties.push(G.rc(true, 'RC exploitation / avant réception : 10 M€ par sinistre (programme du groupe).'))
    else r.garanties.push(G.rc(true, 'RC après réception : 10 M€ par sinistre et 50 M€ par an (programme du groupe) ; si le désordre est décennal, c’est la RCD qui intervient.'))
    if (s.moment !== 'avant_reception' && s.moment !== 'plus10') r.garanties.push(G.rcd(false, 'Si la réclamation porte sur un désordre de nature décennale de l’ouvrage.'))
    r.pourquoi.push('Toute réclamation d’un tiers (courrier, mise en demeure, convocation à expertise, assignation) doit être transmise à l’assureur : c’est lui qui dirige la défense et, sauf exception, l’entreprise ne doit rien reconnaître ni transiger seule.')
    r.quiContreQui.push({ qui: 'Tiers', contre: 'Entreprise (et son assureur RC, action directe C. assur. art. L124-3)', comment: 'Le courtier désigne l’expert et, si nécessaire, l’avocat.' })
    r.etapes.push(
      { texte: 'Transmettre sans délai la réclamation au courtier gestionnaire avec le formulaire « Responsabilité civile » (Dat@ssur) et les pièces du marché', source: 'C. assur. art. L113-2' },
      { texte: 'Assignation ou référé : transmettre immédiatement (délais de procédure courts) ; ne pas répondre sur le fond sans l’assureur' },
      { texte: 'À partir de 25 000 € de préjudice réclamé, l’assureur missionne un expert économiste pour vérifier les montants', source: 'Guide des assurances 2026' },
      { texte: 'Prescription de l’action du tiers', delai: '5 ans (10 ans en cas de dommage corporel)', source: 'C. civ. art. 2224 et 2226' },
    )
    r.documents.push('Courrier de réclamation ou acte de procédure (avec sa date de réception)', 'Comptes rendus de chantier, attestations RC des intervenants concernés', ...DOCS_CONSTAT)
    r.pieges.push('Pénalités de retard, amendes et retard de livraison non lié à un sinistre ne sont pas garantis par la RC.', 'Reconnaître sa responsabilité sans l’accord de l’assureur peut lui être inopposable.')
    r.courriers.push({ type: 'transmission', libelle: 'Transmission de documents (déclaration de sinistre)' })
    r.surligner.push('rc')
    return r
  },

  incendie_base_vie: () => {
    const r = base('Sinistre dans la base vie ou les bureaux de chantier')
    r.garanties.push(G.trs())
    r.garanties.push(G.trc(false, 'Seulement si la base vie est intégrée à l’ouvrage et déclarée dans la TRC (mobilier jamais couvert).'))
    r.garanties.push(G.rc(false, 'Si l’incendie se propage aux voisins ou aux tiers : recours des voisins et des tiers (450 000 € en TRS).'))
    r.pourquoi.push('Les bases vie, bungalows et conteneurs de chantier sont garantis par la multirisque du groupe sans déclaration préalable (incendie, dégât des eaux, vol, bris de glace, dommages informatiques).')
    r.etapes.push(
      { texte: 'Évacuer, alerter les secours (18 / 112), mettre en sécurité ; incendie : ne rien déblayer avant l’expert' },
      { texte: 'Vol : déposer plainte en listant les biens', delai: '2 jours ouvrés pour déclarer', source: 'C. assur. art. L113-2' },
      { texte: 'Déclarer le sinistre multirisque (formulaire « Multirisque » sur Dat@ssur) au courtier / à la Direction des Assurances', delai: '5 jours ouvrés', source: 'C. assur. art. L113-2' },
      { texte: 'Réunir la preuve du respect des préconisations bases vie : contrôle électrique annuel par un organisme agréé, détection incendie, extincteurs, référent sécurité, permis de feu', source: 'Guide des assurances 2026' },
      { texte: 'Après le premier versement (acompte), envoyer les factures de remplacement pour l’indemnité différée', delai: '2 ans à compter du sinistre', source: 'Guide des assurances 2026' },
    )
    r.documents.push('Rapport de vérification électrique et registre de sécurité', 'Inventaire et factures du contenu', 'Récépissé de plainte (vol)', ...DOCS_CONSTAT)
    r.pieges.push(
      'Franchise : 12 000 € par sinistre, portée à 60 000 € en cas d’incendie si une préconisation impérative n’est pas respectée.',
      'Le vol de biens stockés en plein air n’est pas garanti ; vol en base vie plafonné à 150 000 €.',
      'Le bris de machine (engins, outillage) relève de la police bris de machine, pas de la TRS.',
    )
    r.courriers.push({ type: 'transmission', libelle: 'Transmission de documents' })
    r.surligner.push('trs')
    return r
  },

  sinistre_auto: () => {
    const r = base('Accident ou vol de véhicule')
    r.garanties.push({ cle: 'auto', libelle: 'Assurance automobile (police flotte ou police mission)', nature: 'obligatoire', principale: true, commentaire: 'Véhicule de fonction ou de société : police flotte (formules A, B ou C). Véhicule personnel en déplacement professionnel : police mission (tous risques, franchise 135 €).' })
    r.pourquoi.push('La RC automobile est attachée au véhicule (C. assur. art. L211-1). Les dommages au véhicule sans tiers identifié ne sont pris en charge qu’en formule tous risques, en cas d’incendie ou de catastrophe naturelle.')
    r.quiContreQui.push({ qui: 'Conducteur / filiale', contre: 'Courtier flotte (Howden) ; Direction des Assurances pour la police mission', comment: 'Les assureurs règlent entre eux selon les conventions IRSA (matériel) et IRCA (corporel).' })
    r.etapes.push(
      { texte: 'Sécuriser les lieux (feux de détresse, triangle) ; blessé, même léger : prévenir police ou gendarmerie' },
      { texte: 'Remplir un seul constat amiable avec l’autre conducteur : recto signé par les deux, cases cochées et leur nombre, point de choc initial, croquis ; en cas de désaccord, ne rien cocher et l’indiquer en « Observations »' },
      { texte: 'Transmettre le constat, la fiche de liaison, la carte grise et les coordonnées du garage au courtier flotte (ou à la Direction des Assurances pour la police mission, avec l’attestation de mission)', delai: '5 jours ouvrés (2 jours ouvrés en cas de vol)', source: 'Guide des assurances 2026 ; C. assur. art. L113-2' },
      { texte: 'Accident corporel : informer le gestionnaire de flotte par mail (déroulé, forces de l’ordre intervenues, n° de procédure, blessés)', delai: '24 heures' },
      { texte: 'Vol : prévenir le responsable de parc, déposer plainte, restituer clés et carte grise ; véhicule non retrouvé sous 30 jours : cession à l’assureur (formules B et C)', delai: '30 jours' },
      { texte: 'Ne pas faire réparer sans expertise ; dommage < 850 € HT : accord préalable du courtier' },
    )
    r.documents.push('Constat amiable (recto signé) ou déclaration circonstanciée', 'Carte grise, fiche de liaison', 'Récépissé de plainte (vol, matériel volé listé)', 'Photos des dommages')
    r.pieges.push(
      'Ne jamais écrire « je reconnais mes torts » ; ne rien ajouter au recto après séparation des exemplaires.',
      'Matériel professionnel volé dans le véhicule : couvert seulement en formule B ou C, s’il figure dans la plainte, avec factures et preuve d’effraction.',
      'Covoiturage via une plateforme : non autorisé.',
    )
    r.surligner.push('auto')
    return r
  },

  avarie_transport: () => {
    const r = base('Avarie ou perte pendant le transport')
    r.garanties.push({ cle: 'transport', libelle: 'Assurance transport', nature: 'facultative', principale: true, commentaire: 'Matériels et marchandises destinés aux chantiers, déclarés avant l’expédition ; sans franchise (sauf tubes et tuyaux : 10 %, mini 20 000 €, maxi 45 000 €) ; 10 M€ par transport.' })
    r.garanties.push(G.bdm(false, 'Engin ou matériel de l’entreprise endommagé lors de son transport par voie terrestre : bris de machine.'))
    r.pourquoi.push('L’assureur indemnise puis se retourne contre le transporteur : il faut donc préserver ce recours par des réserves régulières.')
    r.quiContreQui.push({ qui: 'Destinataire (chantier)', contre: 'Transporteur', comment: 'Réserves écrites et motivées à la livraison, confirmées par LRAR.' })
    r.etapes.push(
      { texte: 'À la livraison : réserves précises et datées sur le bon de livraison (nature et étendue des dommages, colis manquants), photos' },
      { texte: 'Confirmer les réserves au transporteur par lettre recommandée', delai: '3 jours, non compris les jours fériés', source: 'C. com. art. L133-3' },
      { texte: 'Déclarer à l’assureur transport via la Direction des Assurances ; conserver la marchandise endommagée pour l’expertise' },
    )
    r.documents.push('Bon de livraison avec réserves, lettre de voiture / CMR', 'Facture des biens, ordre d’assurance (aliment) de l’expédition', 'Photos des dommages')
    r.pieges.push('Une réception sans réserve ni protestation dans les 3 jours éteint l’action contre le transporteur.', 'Expédition non déclarée à l’assureur avant le départ : pas de garantie.')
    r.courriers.push({ type: 'reserves', libelle: 'Émission de réserves' })
    r.surligner.push('transport', 'bdm')
    return r
  },
}

/* ─────────────────────────── Point d'entrée ─────────────────────────── */

function dedoublonner<T>(arr: T[], cle: (x: T) => string): T[] {
  const vus = new Set<string>()
  return arr.filter((x) => (vus.has(cle(x)) ? false : (vus.add(cle(x)), true)))
}

/** Problématiques pour lesquelles la règle « groupe » de déclaration est rappelée à l'entreprise. */
const PROBLEMES_REGLE_GROUPE: Probleme[] = [
  'fissure_structurelle', 'infiltration', 'equipement_indissociable', 'defaut_conception', 'dommage_ouvrage_travaux', 'dommage_voisin',
  'blessure_tiers', 'dommage_sous_traitant', 'pollution', 'dommage_existant', 'reclamation_tiers', 'incendie_base_vie',
]

/** Calcule la recommandation (garanties triées : principales d'abord). */
export function recommander(s: Situation): Recommandation {
  const r = REGLES[s.probleme](s)
  if (s.ouvrage === 'inconnu' && ['fissure_structurelle', 'infiltration', 'equipement_indissociable', 'defaut_conception', 'entreprise_liquidee'].includes(s.probleme))
    r.alertes.push('Vérifier si l’ouvrage relève de l’obligation d’assurance (bâtiment) ou en est exclu (art. L243-1-1 C. assur. : certains ouvrages de génie civil, d’infrastructure, VRD…).')
  if (r.etapes.length === 0)
    r.etapes.push(
      { texte: 'Vérifier si une action (réclamation, assignation) a été engagée avant l’expiration des délais légaux', source: 'C. civ. art. 1792-4-1 à 1792-4-3 et 2241' },
      { texte: 'À défaut : réparation à la charge du propriétaire ; consulter le service juridique en cas de doute' },
    )
  if (s.role === 'entreprise' || s.role === 'sous_traitant')
    r.etapes.push({ texte: 'Côté entreprise : transmettre sans délai toute réclamation à votre assureur et ne pas reconnaître seul votre responsabilité', source: 'C. assur. art. L113-2' })
  if (s.role === 'entreprise' && PROBLEMES_REGLE_GROUPE.includes(s.probleme)) r.etapes.push(ETAPE_REGLE_GROUPE)
  r.garanties = dedoublonner(
    [...r.garanties.filter((g) => g.principale), ...r.garanties.filter((g) => !g.principale)],
    (g) => g.cle,
  )
  r.courriers = dedoublonner(r.courriers, (c) => c.type)
  r.documents = dedoublonner(r.documents, (d) => d)
  r.surligner = dedoublonner(r.surligner, (d) => d)
  return r
}
