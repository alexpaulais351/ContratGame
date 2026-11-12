/**
 * Aide à la décision « Quelle garantie / assurance mobiliser ? » — module PUR (testé dans
 * aide-decision.test.ts). Règles déclaratives : problématique × moment × rôle × type d'ouvrage
 * × assurances souscrites → recommandation.
 *
 * Textes (versions en vigueur, voir l'encadré « Sources et versions ») :
 *  - C. civ. art. 1792, 1792-2, 1792-3, 1792-4-1 à 1792-4-3, 1792-6, 1253 (troubles du voisinage), 2224, 2226, 2241 ;
 *  - C. assur. art. L113-2 (déclaration de sinistre), L114-1 (prescription biennale), L124-3 (action directe),
 *    L211-1, L241-1, L241-2, L242-1 (DO : 60 j / 90 j), L243-1-1 (ouvrages exclus) ;
 *  - CCAG Travaux 2021 art. 8, 41.6, 44.1, 44.2.
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
  { cle: 'dommage_sous_traitant', libelle: 'Dommage causé par un sous-traitant', groupe: 'Sinistres de chantier' },
  { cle: 'dommage_engin', libelle: 'Dommage à un engin ou au matériel (ou causé par un engin)', groupe: 'Sinistres de chantier' },
  { cle: 'pollution', libelle: 'Pollution accidentelle (déversement d’hydrocarbures, rejet, déchets)', groupe: 'Sinistres de chantier' },
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
  { cle: 'exclu', libelle: 'Ouvrage exclu de l’obligation (art. L243-1-1 C. assur. : certains ouvrages de génie civil, VRD, ferroviaires…)' },
  { cle: 'inconnu', libelle: 'Je ne sais pas' },
]

export const SITUATION_DEFAUT: Situation = {
  probleme: 'fissure_structurelle', moment: 'an2_10', role: 'moa', ouvrage: 'soumis', doSouscrite: 'inconnu', trcSouscrite: 'inconnu',
}

/* ─────────────────────────── Sorties ─────────────────────────── */

/** Clés des garanties : celles de la frise (lib/boite-a-outils/assurances) + responsabilités sans assurance dédiée. */
export type CleGarantie =
  | 'trc' | 'rc' | 'gpa' | 'biennale' | 'rcd' | 'do' | 'cnr' | 'ccrd' | 'st' | 'engins' | 'env'
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
  { texte: 'L’assureur DO notifie sa position sur la mise en jeu des garanties (après rapport de l’expert)', delai: '60 jours à compter de la réception de la déclaration', source: 'C. assur. art. L242-1' },
  { texte: 'L’assureur DO présente une offre d’indemnité en cas d’acceptation', delai: '90 jours à compter de la réception de la déclaration', source: 'C. assur. art. L242-1' },
  { texte: 'À défaut de réponse dans les délais : l’assuré peut engager les travaux après l’avoir notifié à l’assureur ; l’indemnité est majorée d’intérêts (double du taux légal)', source: 'C. assur. art. L242-1', aVerifier: true },
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
    r.alertes.push('Ouvrage exclu de l’obligation d’assurance (C. assur. art. L243-1-1) : la responsabilité décennale existe mais l’assurance décennale et la DO peuvent ne pas avoir été souscrites. Vérifier le CCAP (CCAG 2021 art. 8.1.2).')
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
        { texte: 'Désordre décennal non repris après mise en demeure : déclarer à l’assureur DO', source: 'C. assur. art. L242-1' },
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
    r.documents.push(...DOCS_CONSTAT, 'Police TRC et conditions particulières (franchise)', 'Bulletins météo (Météo-France) si événement climatique', 'Journal de chantier')
    r.pieges.push('Déclarer hors délai peut entraîner une déchéance de garantie si l’assureur prouve un préjudice (C. assur. art. L113-2).', 'Reconstruire avant l’expertise fait perdre les preuves.')
    r.courriers.push({ type: 'constat', libelle: 'Constat contradictoire' })
    r.surligner.push('trc', 'rc')
    return r
  },

  vol_chantier: (s) => {
    const r = base('Vol ou vandalisme sur le chantier')
    if (s.moment !== 'avant_reception') r.alertes.push('Après réception, un vol ou une dégradation relève de l’assurance du propriétaire (multirisque).')
    r.garanties.push(s.trcSouscrite === 'non' ? G.contractuelle(true, 'Sans TRC : l’entreprise, gardienne du chantier, supporte la perte de ses ouvrages et matériels (vérifier son assurance « matériel »).') : G.trc(true, 'Si la garantie vol/vandalisme est incluse dans la TRC (vérifier les conditions : clôture, gardiennage).'))
    r.garanties.push({ cle: 'engins', libelle: 'Assurance du matériel / engins (bris, vol)', nature: 'facultative', principale: false, commentaire: 'Pour le matériel et les engins volés ou dégradés.' })
    r.etapes.push(
      { texte: 'Déposer plainte au commissariat / à la gendarmerie et conserver le récépissé' },
      { texte: 'Déclarer le vol à l’assureur', delai: '2 jours ouvrés (sauf délai plus long au contrat)', source: 'C. assur. art. L113-2' },
      { texte: 'Informer le MOE / MOA ; inscrire l’événement au journal de chantier ; renforcer la sécurisation' },
    )
    r.documents.push('Récépissé de dépôt de plainte', 'Factures / inventaire des biens volés', ...DOCS_CONSTAT)
    r.pieges.push('Les polices exigent souvent des mesures de protection (clôture, fermeture, gardiennage) : à défaut, refus de garantie.')
    r.courriers.push({ type: 'transmission', libelle: 'Transmission de documents' })
    r.surligner.push('trc', 'engins')
    return r
  },

  dommage_voisin: (s) => {
    const r = base('Dommage à un tiers / riverain / bâtiment voisin')
    r.garanties.push(G.rc(true, 'RC exploitation de l’entreprise dont l’intervention a causé le dommage.'))
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
    const r = base('Dommage à un engin ou causé par un engin')
    r.garanties.push({ cle: 'engins', libelle: 'Assurance des engins (RC circulation obligatoire, bris de machine)', nature: 'obligatoire', principale: true, commentaire: 'RC obligatoire pour les engins automoteurs (C. assur. art. L211-1) ; dommages à l’engin : bris de machine (facultatif).' })
    r.garanties.push(G.rc(false, 'Engin à l’arrêt ou outil : selon les contrats, la RC exploitation peut intervenir.'))
    r.pourquoi.push('Un engin automoteur est un véhicule terrestre à moteur : les dommages qu’il cause aux tiers relèvent de son assurance obligatoire ; les dommages qu’il subit, de la garantie bris de machine.')
    r.quiContreQui.push({ qui: 'Utilisateur / propriétaire', contre: 'Assureur de l’engin (ou du loueur)', comment: 'Vérifier le contrat de location (qui assure, franchise).' })
    r.etapes.push(
      { texte: 'Sécuriser, établir un constat (constat amiable si un autre véhicule est impliqué)' },
      ETAPE_DECLARATION_RC,
      { texte: 'Engin loué : prévenir immédiatement le loueur' },
    )
    r.documents.push('Carte grise / certificat de l’engin, contrat de location', 'CACES / autorisation de conduite du conducteur', ...DOCS_CONSTAT)
    r.pieges.push('Conducteur sans autorisation de conduite (CACES) : risque de refus ou de recours de l’assureur.', 'Franchise loueur souvent élevée : vérifier le contrat de location.')
    r.surligner.push('engins')
    return r
  },

  pollution: () => {
    const r = base('Pollution accidentelle')
    r.garanties.push({ cle: 'env', libelle: 'RC atteinte à l’environnement', nature: 'facultative', principale: true, commentaire: 'Pollutions et frais de dépollution, selon contrat.' })
    r.garanties.push(G.rc(false, 'La RC exploitation couvre parfois la pollution « accidentelle » (vérifier les exclusions).'))
    r.pourquoi.push('Les pollutions sont souvent exclues ou limitées dans la RC générale : une garantie spécifique est nécessaire pour les frais de dépollution.')
    r.etapes.push(
      { texte: 'Stopper la fuite, confiner (kits absorbants, barrages), protéger réseaux et cours d’eau' },
      { texte: 'Alerter le MOE / MOA, et selon la gravité les autorités (mairie, services de l’État, gestionnaire de réseau)', aVerifier: true },
      ETAPE_DECLARATION_RC,
      { texte: 'Évacuer les terres et produits souillés en filière agréée ; conserver les bordereaux de suivi de déchets', source: 'CCAG Travaux 2021 art. 36' },
    )
    r.documents.push('Bordereaux de suivi des déchets (BSD)', 'Fiches de données de sécurité des produits', ...DOCS_CONSTAT)
    r.pieges.push('Les pollutions « graduelles » sont souvent exclues : lire les conditions.')
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
}

/* ─────────────────────────── Point d'entrée ─────────────────────────── */

function dedoublonner<T>(arr: T[], cle: (x: T) => string): T[] {
  const vus = new Set<string>()
  return arr.filter((x) => (vus.has(cle(x)) ? false : (vus.add(cle(x)), true)))
}

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
  r.garanties = dedoublonner(
    [...r.garanties.filter((g) => g.principale), ...r.garanties.filter((g) => !g.principale)],
    (g) => g.cle,
  )
  r.courriers = dedoublonner(r.courriers, (c) => c.type)
  r.documents = dedoublonner(r.documents, (d) => d)
  r.surligner = dedoublonner(r.surligner, (d) => d)
  return r
}
