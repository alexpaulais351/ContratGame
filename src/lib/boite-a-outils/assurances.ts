/**
 * Assurances et garanties d'un chantier — données (rendu écran + PDF).
 *
 * Sources principales : Code civil art. 1792 à 1792-6 ; Code des assurances art. L241-1, L241-2,
 * L242-1 (et annexe II à l'art. A243-1), L243-1-1, L243-2, L243-3, L211-1 ; loi n° 78-12 du 4 janvier 1978
 * (« loi Spinetta ») ; CCAG Travaux 2021 art. 8 (assurances) et 44 (garanties) ;
 * Guide des assurances 2026 — Divisions Bâtiment France / Génie Civil France (14e édition, en vigueur au
 * 1er janvier 2026, usage interne) : plafonds, franchises, règles « groupe » et procédures internes.
 * Les tarifs et taux de prime du guide (partie 3) ne sont volontairement pas repris.
 * Les mentions « à vérifier » signalent un point non confirmé par une source.
 */
import { VINCI, VINCI_SECONDAIRE, type CleSecondaire } from '@/lib/design-tokens'

export type NatureCouverture = 'obligatoire' | 'facultative' | 'garantie_legale'

export const LIBELLE_NATURE: Record<NatureCouverture, string> = {
  obligatoire: 'Assurance obligatoire',
  facultative: 'Assurance facultative',
  garantie_legale: 'Garantie légale (pas une assurance)',
}

/** Famille de fiche : couverture de l'opération de construction ou de l'entreprise (matériels, locaux, véhicules…). */
export type CategorieAssurance = 'ouvrage' | 'entreprise'

export const LIBELLE_CATEGORIE: Record<CategorieAssurance, { titre: string; sous: string }> = {
  ouvrage: {
    titre: 'Assurances et garanties de l’opération de construction',
    sous: 'Ouvrage, responsabilités des constructeurs, sous-traitants et tiers',
  },
  entreprise: {
    titre: 'Assurances de l’entreprise sur le chantier',
    sous: 'Engins et matériels, base vie, véhicules, transports, matériel flottant, drones',
  },
}

/** Mention de la source interne utilisée pour les plafonds, franchises et règles « groupe ». */
export const SOURCE_GUIDE = 'Guide des assurances 2026 (14e éd., en vigueur au 01/01/2026, usage interne)'

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

export type LignePlafond = { libelle: string; valeur: string }

export type Assurance = {
  cle: string
  nom: string
  sigle?: string
  nature: NatureCouverture
  categorie: CategorieAssurance
  couleur: CleSecondaire
  obligatoire: string
  souscripteur: string
  beneficiaire: string
  objet: string
  declenchement: string
  periode: string
  references: string
  /** Ce que l'assureur garantit à titre principal. */
  garantit?: string[]
  /** Ce que l'assureur ne garantit pas. */
  neGarantitPas?: string[]
  /** Plafonds et franchises du programme du groupe (Guide des assurances 2026). */
  programme?: LignePlafond[]
  /** Règles internes au groupe (seuils de déclaration, consultations obligatoires…). */
  regleGroupe?: string[]
  attention: string[]
  /** Exclure du panorama « vue d'ensemble » (reste sur la frise détaillée et dans les fiches). */
  horsPanorama?: boolean
  /** Segments de frise ; tableau vide = assurance sans rattachement à une phase (exclue des frises). */
  segments: SegmentFrise[]
  aVerifier?: string
}

export const ASSURANCES: Assurance[] = [
  /* ───────────────────────── Opération de construction ───────────────────────── */
  {
    cle: 'trc', nom: 'Tous risques chantier', sigle: 'TRC', nature: 'facultative', categorie: 'ouvrage', couleur: 'jaune',
    obligatoire: 'Non : aucune loi ne l’impose. Le marché peut ne rien prévoir, l’imposer au maître d’ouvrage ou la confier au constructeur (option à privilégier : transfert du risque maîtrisé, conditions négociées)',
    souscripteur: 'Entreprise (police annuelle du groupe ou police de chantier) ou maître d’ouvrage',
    beneficiaire: 'Police annuelle du groupe : les seules filiales du groupe (pas le MOA, ni les cotraitants ou sous-traitants extérieurs). Police de chantier : tous les intervenants désignés',
    objet: 'Dommages matériels (perte, destruction, détérioration) fortuits et soudains à l’ouvrage en cours de réalisation : effondrement, incendie, tempête, inondation, vol avec effraction, vandalisme, erreur de conception ou d’exécution…',
    declenchement: 'Sinistre pendant les travaux, indemnisé sans recherche préalable de responsabilité (principe « tous risques sauf » : c’est à l’assureur de prouver l’exclusion)',
    periode: 'Du premier ordre de service (ou de l’accord formel du MOA sur le démarrage) jusqu’à la première de ces dates : mise en service, réception (expresse ou tacite), prise de possession par le MOA. Puis maintenance-visite de 12 mois',
    references: 'C. civ. art. 1788 à 1790 (risques à la charge de l’entrepreneur jusqu’à la réception) et 1792-6 ; CCAG Travaux 2021 art. 8.2 et 43 (mise à disposition) ; contrat d’assurance',
    garantit: [
      'Dommages matériels à l’ouvrage, aux ouvrages provisoires prévus au marché et aux matériaux sur chantier, y compris travaux sous-traités',
      'Erreur de conception, erreur d’exécution, vice de matériaux (partie viciée incluse), vol et tentative de vol avec effraction, vandalisme, attentats',
      'Garanties annexes : péril imminent et mesures conservatoires, frais de déblai et de retirement de l’eau, transport à grande vitesse et heures supplémentaires, réfection des plans, honoraires d’experts',
      'Clause des 72 heures : un événement naturel générant des désordres en 72 heures = un seul sinistre (une seule franchise)',
      'Maintenance-visite 12 mois : dommages causés par l’entreprise lorsqu’elle revient sur le chantier (levée des réserves, contrôle, entretien)',
    ],
    neGarantitPas: [
      'Dommages prévisibles (absence d’aléa) et travaux d’amélioration consécutifs au sinistre',
      'Dommages aux existants, sauf extension spécifique (option « Existants » des polices de chantier)',
      'Pertes financières sans dommage matériel',
      'Période postérieure à une prise de possession anticipée, ou garantie non prolongée alors que la réception est reportée',
      'Mobilier de la base vie installée dans l’ouvrage ; travaux preneurs (police annuelle)',
    ],
    programme: [
      { libelle: 'Police annuelle — conditions', valeur: 'Marché < 100 M€ HT par filiale (somme des marchés en groupement entre filiales) ; durée des travaux ≤ 48 mois' },
      { libelle: 'Seuils particuliers', valeur: '10 M€ HT : réseaux de chauffage urbain, ouvrages en terre ou en enrochement · 15 M€ HT : tunnels (hors tunneliers, tranchées couvertes, méthode autrichienne)' },
      { libelle: 'Plafond « autres ouvrages »', valeur: '49,9 M€ par sinistre et par an (partagé entre tous les chantiers des filiales : vérifier qu’il suffit)' },
      { libelle: 'Plafond tunnels / chauffage urbain, terre, enrochement', valeur: '5 M€ par sinistre et 10 M€ par an / 3 M€ par sinistre et 6 M€ par an' },
      { libelle: 'Franchise (police annuelle)', valeur: '20 % du coût du sinistre, minimum 45 000 €, maximum 100 000 €' },
      { libelle: 'Polices de chantier', valeur: 'Protocole TRC / montage-essais (catégories d’ouvrages, ≤ 60 M€, 49,9 M€ ou 30 M€ HT, durée < 36 mois) ; protocole TRC dédié au montage immobilier ; marché de l’assurance pour les grands chantiers' },
    ],
    regleGroupe: [
      'Choisir la solution TRC dès l’appel d’offres ; consulter la Direction des Assurances si le marché impose une TRC couvrant tous les intervenants (police spécifique, prime à intégrer au prix)',
      'TRC souscrite par le MOA : déclarer le sinistre sur la police du MOA et ne jamais faire état de la police annuelle du groupe (veiller à ce que l’expert ne la mentionne pas)',
      'Arrêt ou prolongation des travaux, mise à disposition anticipée : contacter la Direction des Assurances (risque d’arrêt de la garantie)',
    ],
    attention: [
      'TRC du MOA : exiger une franchise adaptée, l’abandon de recours contre les assureurs des constructeurs, l’absence de refacturation de la prime, l’engagement de déclarer sans délai, la transmission de la police (et de la clause de prévention incendie) et sa prolongation si le chantier dure',
      'Anticiper la répartition de la franchise entre cotraitants dans la convention de groupement ou le marché : l’assureur indemnise sans rechercher les responsabilités',
      'Mise à disposition anticipée (MADA) : transférer la garde et les risques au MOA par convention écrite ; intégrer les travaux preneurs à une police de chantier ; le mobilier reste à assurer par le preneur',
      'Déclarer sans délai (délai contractuel, au moins 5 jours ouvrés ; 2 jours ouvrés en cas de vol) avec photos, constat contradictoire et comptes rendus de chantier',
    ],
    segments: [{ de: 1, a: 3 }, { de: 3, a: 4.5, partiel: true, note: 'Maintenance-visite 12 mois' }],
  },
  {
    cle: 'rc', nom: 'Responsabilité civile exploitation / professionnelle', sigle: 'RC', nature: 'facultative', categorie: 'ouvrage', couleur: 'bleuMoyen',
    obligatoire: 'Non obligatoire par la loi, mais exigée par le marché (CCAG Travaux 2021 art. 8.1.1)',
    souscripteur: 'Chaque entreprise (titulaire, cotraitants, sous-traitants) — programme RC de 1re ligne du groupe pour toutes les filiales (hors BET : contrat distinct)',
    beneficiaire: 'Les tiers victimes (y compris le maître d’ouvrage pour ses existants et biens confiés)',
    objet: 'Conséquences pécuniaires des dommages corporels, matériels et immatériels (consécutifs ou non) causés aux tiers du fait de l’activité, avant et après réception, y compris faute inexcusable de l’employeur',
    declenchement: 'Réclamation d’un tiers mettant en cause la responsabilité de l’entreprise (délictuelle, quasi délictuelle ou contractuelle dans une certaine limite)',
    periode: 'Pendant toute l’activité ; RC « après livraison / réception » ensuite',
    references: 'C. civ. art. 1240 et s. (responsabilité délictuelle) et 1253 (troubles anormaux du voisinage) ; CCAG Travaux 2021 art. 8.1.1 et 8.1.3',
    garantit: [
      'Dommages causés aux tiers : matériels, immatériels consécutifs ou non, corporels (salarié ou tiers)',
      'Faute inexcusable de l’employeur, troubles anormaux du voisinage, dommages aux existants et biens confiés',
      'Pollution accidentelle (soudaine), protection pénale et recours',
      'Responsabilité contractuelle, dans une certaine limite : l’assureur ne compense pas une obligation de faire non réalisée',
      'Groupements : le contrat s’applique, mais pas à la responsabilité des membres extérieurs au groupe',
    ],
    neGarantitPas: [
      'Notre propre préjudice et les dommages matériels à nos travaux',
      'Amendes et pénalités contractuelles (pénalités de retard)',
      'Retard de livraison non lié à un sinistre (ex. : problème d’approvisionnement de matériaux)',
      'Dommages prévisibles (défaut d’aléa, dommages inhérents à l’acte de construire) et engagements contractuels excessifs',
      'Sinistres de nature décennale (relevant de la police RCD)',
    ],
    programme: [
      { libelle: 'RC exploitation et avant réception', valeur: '10 M€ par sinistre tous dommages confondus' },
      { libelle: 'RC après réception', valeur: '10 M€ par sinistre et 50 M€ par an' },
      { libelle: 'RC professionnelle', valeur: '10 M€ par sinistre et 18,3 M€ par an' },
      { libelle: 'Troubles anormaux du voisinage', valeur: '4 M€ par sinistre et par an' },
      { libelle: 'Faute inexcusable', valeur: '5 M€ par an pour l’ensemble des assurés (dont amiante 500 000 €)' },
      { libelle: 'Amiante', valeur: '1 M€ par sinistre (hors désamiantage) ; désamiantage avec qualification 1552 : 3 M€ par sinistre et par an' },
      { libelle: 'Franchises', valeur: 'Propre à chaque filiale : 2 000 € à 25 000 € · DINC 16 000 € · troubles du voisinage 250 000 € · faute inexcusable 100 000 € · recours des voisins et des tiers 450 000 € · engins non immatriculés en circulation 2 030 € · canalisations 5 000 €' },
      { libelle: 'Territorialité', valeur: 'Monde entier sauf USA et Canada (exigences locales possibles à l’étranger)' },
    ],
    regleGroupe: [
      'Sinistre dont l’enjeu est ≥ 500 K€ (≥ 150 K€ en corporel) ou engageant l’image du groupe : informer la Direction des Assurances, qui pilote le dossier avec la filiale',
      'Sinistre < 150 K€ (hors corporel) : géré par le courtier sur le budget auto-assuré (BAA, franchise absolue de 150 K€), qui nomme l’expert et si besoin l’avocat',
      'Plafond plus élevé exigé par le marché : demander une attestation 2e ligne (au moins 72 h) ; ne présenter que l’attestation de 1re ligne en négociation',
      'Activité nouvelle ou inhabituelle, site nucléaire : consulter la Direction des Assurances bien avant la remise de l’offre',
      'À partir de 25 000 € de préjudice, l’assureur missionne un expert économiste',
    ],
    attention: [
      'Attestation à fournir dans les 15 jours suivant la notification du marché et avant tout début d’exécution (CCAG 2021 art. 8.1.3)',
      'Exiger l’attestation RC de chaque sous-traitant avant son arrivée sur le chantier',
      'Amiante : activité de retrait sans qualification, plafond abaissé à 1 M€ (3 M€ par an) — prudence à la prise de commande',
    ],
    segments: [{ de: 0, a: 3 }, { de: 3, a: 8, partiel: true, note: 'RC après réception' }],
  },
  {
    cle: 'gpa', nom: 'Garantie de parfait achèvement', sigle: 'GPA', nature: 'garantie_legale', categorie: 'ouvrage', couleur: 'vert',
    obligatoire: 'Garantie légale due par l’entrepreneur (pas une assurance : en principe non assurée)',
    souscripteur: '— (obligation de l’entrepreneur)',
    beneficiaire: 'Maître d’ouvrage',
    objet: 'Réparation de tous les désordres signalés à la réception (réserves) ou notifiés par écrit pendant l’année qui suit',
    declenchement: 'Notification écrite du désordre par le MOA ; exécution dans le délai fixé d’un commun accord ou, à défaut, par le MOA',
    periode: '1 an à compter de la réception',
    references: 'C. civ. art. 1792-6 ; CCAG Travaux 2021 art. 44.1 (délai de garantie, prolongeable : 44.2)',
    garantit: ['Tous les désordres, quelle que soit leur gravité, réservés ou notifiés dans l’année'],
    neGarantitPas: ['Les désordres apparents non réservés à la réception', 'L’usure normale et le défaut d’entretien'],
    attention: [
      'Suivre la levée des réserves (délai fixé par le MOA, à défaut 3 mois avant la fin du délai de garantie : CCAG 2021 art. 41.6)',
      'Désordre de nature décennale dans l’année : la DO ne peut être saisie qu’après une mise en demeure de l’entreprise restée infructueuse',
      'La retenue de garantie est remboursée 30 jours après l’expiration du délai de garantie (CCP art. R2191-35)',
    ],
    segments: [{ de: 3, a: 4.5 }],
  },
  {
    cle: 'biennale', nom: 'Garantie biennale de bon fonctionnement', nature: 'garantie_legale', categorie: 'ouvrage', couleur: 'vertVif',
    obligatoire: 'Garantie légale due par les constructeurs ; la police RCD du groupe la couvre en garantie complémentaire',
    souscripteur: '— (obligation des constructeurs)',
    beneficiaire: 'Maître d’ouvrage et propriétaires successifs',
    objet: 'Bon fonctionnement des éléments d’équipement dissociables de l’ouvrage (ex. robinetterie, volets, équipements démontables)',
    declenchement: 'Dysfonctionnement d’un élément d’équipement dissociable',
    periode: '2 ans minimum à compter de la réception',
    references: 'C. civ. art. 1792-3',
    programme: [{ libelle: 'Police RCD du groupe', valeur: 'Bon fonctionnement : 4 M€ par sinistre (marchés de travaux)' }],
    attention: ['Ne couvre pas les éléments indissociables (relevant de la décennale)'],
    segments: [{ de: 3, a: 5.5 }],
  },
  {
    cle: 'rcd', nom: 'Responsabilité civile décennale — ouvrages soumis', sigle: 'RCD', nature: 'obligatoire', categorie: 'ouvrage', couleur: 'orange',
    obligatoire: 'Oui pour tout constructeur lié au MOA par un contrat de louage d’ouvrage (entreprises, architectes, BET, contrôleurs…), pour les ouvrages soumis à l’obligation (anciennement dits « de bâtiment »). Les sous-traitants n’y sont pas soumis par la loi',
    souscripteur: 'Chaque constructeur, à la date d’ouverture du chantier (DOC)',
    beneficiaire: 'Maître d’ouvrage et propriétaires successifs',
    objet: 'Dommages qui compromettent la solidité de l’ouvrage ou de ses éléments d’équipement indissociables, ou le rendent impropre à sa destination (vice caché à la réception)',
    declenchement: 'Désordre de nature décennale apparu après la réception : présomption de responsabilité, sans preuve de faute (sauf cause étrangère)',
    periode: '10 ans à compter de la réception ; contrat géré en capitalisation (la prime de l’année de la DOC couvre les 10 ans)',
    references: 'C. civ. art. 1792, 1792-2 et 1792-4-1 ; C. assur. art. L241-1, L243-1-1 (ouvrages non soumis), L243-2 (attestation) ; CCAG Travaux 2021 art. 8.1.2 ; défaut d’assurance : C. assur. art. L243-3',
    garantit: [
      'Paiement des travaux de réparation (y compris déblai, démolition), y compris en qualité de sous-traitant',
      'Garanties complémentaires : effondrement ou menace grave d’effondrement avant réception, bon fonctionnement 2 ans, dommages aux existants, immatériels consécutifs, dommages intermédiaires, défaut caché des éléments de process (C. civ. art. 1792-7)',
      'Garantie automatique si techniques courantes et coût global de l’opération (TCE + honoraires) ≤ 15 M€ HT',
      'Groupements : part propre de la filiale et condamnations in solidum',
    ],
    neGarantitPas: [
      'Le parachèvement (finitions) et les défauts esthétiques',
      'Les ouvrages exclus par la loi (art. L243-1-1 C. assur.)',
      'Les travaux de technique non courante et le réemploi de matériaux en l’absence de déclaration préalable',
      'La solidarité contractuelle avec un concepteur extérieur au groupe (conception-réalisation)',
    ],
    programme: [
      { libelle: 'Champ d’application', valeur: 'Opérations ≤ 15 M€ HT (TCE + honoraires, hors équipements spéciaux) ; France métropolitaine et DROM' },
      { libelle: 'Garantie obligatoire', valeur: 'À hauteur des travaux de réparation de l’ouvrage' },
      { libelle: 'Effondrement avant réception', valeur: '3 M€ par sinistre' },
      { libelle: 'Bon fonctionnement / dommages intermédiaires', valeur: '4 M€ par sinistre chacun' },
      { libelle: 'Existants / immatériels consécutifs', valeur: '1 M€ par sinistre chacun' },
      { libelle: 'Défaut caché des éléments de process', valeur: '458 000 € par sinistre et par an' },
      { libelle: 'Franchise', valeur: 'Selon le chiffre d’affaires de la filiale : 1 900 € à 130 000 € par sinistre, indexée entre la DOC et la déclaration' },
    ],
    regleGroupe: [
      'Contacter la Direction des Assurances dès que le coût prévisionnel de l’opération approche 15 M€ HT (TCE, honoraires compris) : un CCRD est alors indispensable',
      'Techniques non courantes, ouvrage à caractère exceptionnel (grande portée, grande hauteur, grande profondeur), venues d’eau, colonnes ballastées, inclusions rigides en variante, étanchéité bentonitique, photovoltaïque : consulter la Direction des Assurances au stade de l’appel d’offres',
      'Réemploi : seuls les matériaux inertes sont acceptés sans validation ; saisir la Direction des Assurances pour le bois extérieur, un matériau de clos-couvert (tuiles), un matériau mixte, ou un réemploi > 20 % du lot. Réemploi interdit : équipements électriques ou mécaniques complexes, matériaux mal stockés, non conformes aux normes ou détournés de leur usage',
      'Faire analyser le CCAP par les juristes de la délégation, en lien avec la Direction des Assurances',
    ],
    attention: [
      'Technique courante = travaux conformes à une norme (NF DTU, NF EN), à des règles ou recommandations professionnelles acceptées par la C2P, ou procédés sous ETE/DTA ou Avis technique non mis en observation, ou ATEx favorable au plus tard à la réception',
      'Vérifier que les activités déclarées couvrent bien les travaux réalisés (cause fréquente de refus de garantie)',
      'Groupement solidaire : les montants de garantie constituent l’engagement maximum de l’assureur, quel que soit le nombre de membres ; chaque membre supporte sa franchise au prorata de sa part',
    ],
    segments: [{ de: 1, a: 3, partiel: true, note: 'Effondrement avant réception' }, { de: 3, a: 8 }],
  },
  {
    cle: 'rcdgc', nom: 'Responsabilité décennale — ouvrages non soumis (génie civil)', sigle: 'RCD GC', nature: 'facultative', categorie: 'ouvrage', couleur: 'orange',
    obligatoire: 'Non : la responsabilité décennale existe, mais l’assurance n’est pas imposée par la loi pour les ouvrages listés à l’art. L243-1-1 C. assur. (anciennement dits « de génie civil »). Elle peut être exigée par le marché',
    souscripteur: 'Entreprise, par avenant d’intégration de l’opération à la police du groupe (selon option)',
    beneficiaire: 'Maître d’ouvrage et propriétaires successifs',
    objet: 'Réparation des dommages de nature décennale (atteinte à la solidité et impropriété à destination) d’un ouvrage non soumis, réalisé et réceptionné ; option étanchéité',
    declenchement: 'Désordre décennal après réception (garantie déclenchée par le fait dommageable)',
    periode: '10 ans à compter de la réception',
    references: 'C. civ. art. 1792, 1792-2 et 1792-4-1 ; C. assur. art. L243-1-1 (ordonnance n° 2005-658 du 8 juin 2005)',
    garantit: [
      'Ouvrages non soumis dont le coût total prévisionnel (travaux + honoraires, hors process) ≤ 50 M€ HT ; ouvrages sur ou sous l’eau ≤ 7 M€ HT',
      'Intégration simplifiée jusqu’à 30 M€ ; entre 30 et 50 M€ : examen du dossier, étude de sol G2 AVP minimum, pas d’amélioration de sol',
      'Projets éoliens éligibles depuis le 01/01/2024 (protocole spécifique : consulter avant la remise du prix)',
      'Option étanchéité après étude favorable (franchise d’au moins 75 000 €)',
    ],
    neGarantitPas: [
      'Le parachèvement, les dommages prévisibles, les éléments d’équipement dissociables et le process',
      'Les couches d’usure des voiries, les revêtements des sols sportifs, les tassements prévus par les études de sol',
      'Les ouvrages exceptionnels ou inusuels, mobiles, en terre, en enrochement ; réseaux de chauffage urbain, géothermie ; le nucléaire (exclu des protocoles)',
      'Les demandes de garanties « tous intervenants » (police spécifique nécessaire)',
    ],
    programme: [
      { libelle: 'Ouvrages maritimes, fluviaux, lacustres', valeur: '2 M€ épuisables sur la durée de la garantie' },
      { libelle: 'Autres ouvrages — options', valeur: 'Opt. 1 : 500 K€/sinistre, 1 M€ épuisables (opérations < 5 M€) · opt. 2 : 2,5 M€ épuisables · opt. 3 : 5 M€/sinistre, 10 M€ épuisables · opt. 4 : 10 M€/sinistre, 20 M€ épuisables' },
      { libelle: 'Franchises', valeur: '30 K€ / 75 K€ / 200 K€ selon l’option, indexées (TP01) entre la réception et la déclaration' },
    ],
    regleGroupe: [
      'Contacter la Direction des Assurances au stade de l’appel d’offres pour faire modifier les clauses et chiffrer l’assurance exigée',
      'Refuser toute clause exorbitante (ex. : montant de garantie égal au coût total de l’opération) : la capacité du marché est limitée à 20-30 M€',
    ],
    attention: ['Vérifier dans le CCAP si une assurance décennale est exigée contractuellement : à défaut de démarche, vous n’êtes pas assuré'],
    segments: [{ de: 3, a: 8 }],
  },
  {
    cle: 'do', nom: 'Dommages-ouvrage', sigle: 'DO', nature: 'obligatoire', categorie: 'ouvrage', couleur: 'bleuCiel',
    obligatoire: 'Oui pour le maître d’ouvrage (propriétaire, promoteur, vendeur) de travaux sur un ouvrage soumis. Exceptions : ouvrages de l’art. L243-1-1 ; État et certaines personnes morales (publiques ou grandes entreprises) pour des ouvrages autres que d’habitation',
    souscripteur: 'Maître d’ouvrage, avant l’ouverture du chantier (le bénéfice est transmis aux propriétaires successifs)',
    beneficiaire: 'Maître d’ouvrage et propriétaires successifs',
    objet: 'Préfinancement rapide de la réparation des dommages de nature décennale, sans recherche préalable de responsabilité ; l’assureur DO exerce ensuite ses recours contre les constructeurs et leurs assureurs RCD',
    declenchement: 'Après réception : désordre décennal. Avant réception : contrat de l’entrepreneur résilié pour inexécution après mise en demeure restée infructueuse. Pendant l’année de GPA : après mise en demeure restée infructueuse (sans réponse dans un délai raisonnable ou réponse négative)',
    periode: 'De la réception jusqu’à 10 ans (pleinement après l’expiration de la GPA) ; avant réception et pendant la GPA dans les cas limitatifs ci-dessus',
    references: 'C. assur. art. L242-1 et annexe II à l’art. A243-1 (clauses types d’ordre public) ; loi « Spinetta » n° 78-12 du 4 janvier 1978',
    garantit: [
      'Travaux de réparation des dommages de nature décennale, au bénéfice des propriétaires successifs',
      'Garanties complémentaires possibles : bon fonctionnement, existants, immatériels consécutifs',
    ],
    neGarantitPas: ['Les désordres non décennaux (esthétiques, finitions)', 'Les ouvrages exclus par l’art. L243-1-1 C. assur.'],
    programme: [
      { libelle: 'Protocole DO / CNR du groupe (montage immobilier)', valeur: 'Opérations ≤ 50 M€ HT (honoraires et existants compris, hors équipements spéciaux) ; étude technique entre 30 et 50 M€ ; hors hôpitaux, cliniques et EHPAD' },
      { libelle: 'Conditions de souscription', valeur: 'Contrôle technique (LP, + LE en réhabilitation, + PS si parasismique), étude de sol G2 AVP, techniques courantes, pas d’immixtion du MOA' },
      { libelle: 'Franchise DO', valeur: 'Néant' },
    ],
    regleGroupe: [
      'Sinistre « avenant 1 » en dommages-ouvrage : informer la Direction des Assurances (règle groupe)',
      'Opération > 15 M€ HT : les assureurs DO imposent un CCRD et des attestations nominatives (10 / 6 / 3 M€)',
    ],
    attention: [
      'Délais légaux de l’assureur DO : 10 jours pour réclamer les pièces manquantes, 15 jours pour les petits sinistres (< 1 930 € TTC) sans expertise, 60 jours pour prendre position (à défaut, garantie acquise), 90 jours pour l’offre d’indemnité (225 jours en cas de difficultés techniques exceptionnelles acceptées par l’assuré), paiement 15 jours après acceptation',
      'L’assureur exige le PV de réception des travaux (art. 1792-6 C. civ.), pas le PV de livraison, et le rapport final du contrôleur technique : purger ses réserves',
      'Les marchés publics de l’État et des collectivités (hors logement) n’y sont en général pas soumis : vérifier le CCAP',
    ],
    segments: [
      { de: 1, a: 3, partiel: true, note: 'Si résiliation après mise en demeure' },
      { de: 3, a: 4.5, partiel: true, note: 'Après mise en demeure infructueuse' },
      { de: 4.5, a: 8 },
    ],
  },
  {
    cle: 'cnr', nom: 'Constructeur non réalisateur', sigle: 'CNR', nature: 'obligatoire', categorie: 'ouvrage', couleur: 'violet',
    obligatoire: 'Oui pour celui qui fait réaliser des travaux pour le compte d’autrui (promoteur, vendeur d’immeuble à construire, vendeur après achèvement, mandataire du MOA)',
    souscripteur: 'Promoteur / vendeur — volet CNR inclus dans toute police DO',
    beneficiaire: 'Acquéreurs et propriétaires successifs',
    objet: 'Responsabilité décennale du constructeur non réalisateur (dommages visés aux art. 1792 et 1792-2 C. civ.)',
    declenchement: 'Désordre décennal mettant en cause le vendeur / promoteur',
    periode: '10 ans à compter de la réception',
    references: 'C. assur. art. L241-2 ; C. civ. art. 1792-1',
    programme: [
      { libelle: 'Protocole DO / CNR du groupe', valeur: 'Filiales de montage immobilier ; chaque opération est déclarée à l’assureur, qui émet un contrat spécifique' },
      { libelle: 'Franchise CNR', valeur: '1 200 € par sinistre' },
    ],
    regleGroupe: [
      'Signature des actes (VEFA, CPI) : l’attestation DO / CNR justifiant du paiement de la prime suffit ; ne pas communiquer les conditions générales (accord-cadre confidentiel)',
      'Anticiper la demande d’attestation (questionnaire, étude de sol G2 AVP, rapport initial du contrôleur technique, permis de construire) ; la régularisation n’est pas obtenue s’il manque des attestations',
    ],
    attention: ['Rarement applicable aux marchés publics de travaux classiques (MOA public non vendeur)'],
    segments: [{ de: 3, a: 8 }],
  },
  {
    cle: 'ccrd', nom: 'Contrat collectif de responsabilité décennale / police unique de chantier', sigle: 'CCRD / PUC', nature: 'facultative', categorie: 'ouvrage', couleur: 'rose',
    obligatoire: 'Non imposé par la loi, mais indispensable dès que le coût prévisionnel de l’opération (travaux TCE + honoraires, hors équipements spéciaux) approche ou dépasse 15 M€ HT : au-delà, la police RCD individuelle ne joue plus pleinement',
    souscripteur: 'Maître d’ouvrage (fortement recommandé, sans refacturation de la prime) ; à défaut, l’entreprise qui répercute la prime dans son offre',
    beneficiaire: 'Tous les intervenants à l’acte de construire ; les sous-traitants doivent être assurés ou bénéficier d’une renonciation à recours',
    objet: 'CCRD : assurance « 2e ligne » qui intervient au-delà des plafonds des polices RCD individuelles (« 1re ligne »), lesquels forment sa franchise absolue. PUC : regroupe en une seule police la DO et la RCD de tous les intervenants',
    declenchement: 'Désordre décennal dépassant les garanties individuelles (CCRD) ; tout désordre décennal (PUC)',
    periode: '10 ans à compter de la réception',
    references: 'C. assur. art. L241-1 et R243-1 ; CCAG Travaux 2021 art. 8.2 ; circulaire France Assureurs n° 59/2014 (groupements) ; FFB',
    programme: [
      { libelle: 'Plafonds de 1re ligne exigés (règle 10 / 6 / 3)', valeur: '10 M€ : gros œuvre, structure, fondations, clos et couvert · 6 M€ : autres traitants directs (second œuvre) · 3 M€ : non-réalisateurs (MOE, BET, contrôleur technique)' },
      { libelle: 'Attestations', valeur: 'Nominatives : nom et adresse du chantier, DOC, coût total de l’opération, établies sous condition de souscription du CCRD' },
    ],
    regleGroupe: [
      'Saisir la Direction des Assurances dès l’appel d’offres si le CCRD n’est pas prévu, s’il est refacturé aux entreprises ou si ses plafonds ne respectent pas la règle 10 / 6 / 3 (négociations longues)',
      'Groupement : refuser une franchise absolue appliquée individuellement à chaque membre ; elle doit être unique pour le groupement',
      'Prix remis hors CCRD : utiliser la clause type du clausier du guide (prix hors coût de CCRD)',
    ],
    attention: [
      'Le CCAP doit préciser le souscripteur, la prise en charge de la prime, les modalités et la franchise absolue',
      'CCRD souscrit par un tiers : vérifier qu’il confère la qualité d’assuré aux sous-traitants ou renonce à recours contre eux et leurs assureurs',
    ],
    segments: [{ de: 3, a: 8 }],
    aVerifier: 'Police unique de chantier (PUC) : non traitée par le guide interne, fonctionnement à vérifier auprès de l’assureur',
  },
  {
    cle: 'st', nom: 'Assurances des sous-traitants', sigle: 'ST', nature: 'facultative', categorie: 'ouvrage', couleur: 'grisChaud',
    obligatoire: 'Le sous-traitant n’est soumis ni à la responsabilité décennale des constructeurs ni à l’obligation d’assurance (pas de contrat avec le MOA). Le contrat de sous-traitance doit donc l’imposer : la police RCD du groupe exige que les sous-traitants soient valablement assurés',
    souscripteur: 'Chaque sous-traitant',
    beneficiaire: 'Entreprise principale (recours) ; tiers (RC)',
    objet: 'RC exploitation + responsabilité de nature décennale du sous-traitant vis-à-vis de l’entreprise principale (garanties de même nature que l’assurance obligatoire)',
    declenchement: 'Recours de l’entreprise principale ou de son assureur',
    periode: 'Actions contre le sous-traitant : 10 ans à compter de la réception (C. civ. art. 1792-4-2)',
    references: 'Loi n° 75-1334 du 31 décembre 1975 ; C. civ. art. 1792-4-2 ; C. assur. art. L243-2 et arrêté du 5 janvier 2016 (modèle d’attestation)',
    programme: [
      { libelle: 'Montants minimums recommandés', valeur: '10 M€ : gros œuvre et structure · 6 M€ : second œuvre · 3 M€ : études ou maîtrise d’œuvre' },
      { libelle: 'Opération < 15 M€ HT', valeur: 'Attestation annuelle valable à la DOC, activités conformes ; nominative en cas de technique non courante' },
      { libelle: 'Opération > 15 M€ HT', valeur: 'Attestation nominative obligatoire (opération, adresse, MOA, coût total, DOC, nature et montant du lot)' },
      { libelle: 'Sous-traitants étrangers (accord-cadre)', valeur: 'Siège dans l’UE, établissement en France, sous-traitant direct sans police décennale d’abonnement ; opération ≤ 30 M€ HT, technique courante ; 6 M€ par sinistre, franchise 10 000 € ; prime déductible des situations ; BET exclus' },
    ],
    regleGroupe: [
      'Vérifier l’attestation AVANT la signature du contrat de sous-traitance et l’intégrer en annexe ; la conserver le plus longtemps possible (elle permet d’appeler directement l’assureur si le sous-traitant disparaît)',
      'Attestations de compagnies étrangères en libre prestation de services (LPS) ou d’assureurs fragiles : vigilance extrême (garantie très basse, gestion en répartition, solidité seule) ; en cas de doute, saisir la Direction juridique ou la Direction des Assurances',
      'Sous-traitant étranger : saisir la Direction des Assurances avant de signer le contrat de sous-traitance (2 souscriptions maximum par sous-traitant)',
    ],
    attention: [
      'Points clés de l’attestation : assureur (pas un courtier), assuré = titulaire du lot, activités couvrant les travaux, DOC dans la période de validité, références aux art. 1792 et 1792-2 C. civ. et à la loi du 4 janvier 1978, montant et franchise, date, cachet et signature',
      'Exiger aussi l’attestation RC exploitation avant l’arrivée sur le chantier (DC4 / acte spécial)',
      'Le CCRD éventuel doit bénéficier aux sous-traitants ou renoncer à recours contre eux (CCAG 2021 art. 8.2)',
    ],
    segments: [{ de: 1, a: 3 }, { de: 3, a: 8, partiel: true, note: 'Responsabilité vis-à-vis de l’entreprise principale' }],
  },
  {
    cle: 'bet', nom: 'Bureaux d’études techniques — RC professionnelle et décennale', sigle: 'BET', nature: 'obligatoire', categorie: 'ouvrage', couleur: 'orange',
    obligatoire: 'RCD obligatoire pour les missions de conception sur des ouvrages soumis ; RC professionnelle exigée par les marchés',
    souscripteur: 'Structures BET et filiales dédiées aux études (contrat distinct du programme RC des entreprises)',
    beneficiaire: 'Maître d’ouvrage, donneur d’ordre, tiers',
    objet: 'Responsabilités exploitation et professionnelle (avant et après livraison), faute inexcusable, atteinte à l’environnement accidentelle, responsabilité décennale (ouvrages soumis et non soumis listés)',
    declenchement: 'Réclamation liée à une mission d’études, de maîtrise d’œuvre, d’AMO ou de coordination SPS, quel que soit le fondement invoqué',
    periode: 'Depuis le démarrage des études ; décennale 10 ans après réception',
    references: 'C. civ. art. 1792-1 (le concepteur est un constructeur) ; loi MOP n° 85-704 du 12 juillet 1985',
    garantit: [
      'Missions de maîtrise d’œuvre, BET, économiste, AMO, coordination SPS, essais, conseil — en locateur d’ouvrage ou en sous-traitant, seul, en groupement ou en SEP',
      'Ouvrages non soumis listés dans l’annexe contractuelle (infrastructures, réseaux, ouvrages sportifs non couverts…), sur déclaration',
    ],
    neGarantitPas: [
      'Missions de maîtrise d’ouvrage déléguée ou de mandataire du MOA',
      'Non-respect délibéré des règles de l’art ou des réserves du contrôleur technique',
      'Engagements de performance au-delà des normes (acoustique, thermique…), retards non accidentels',
      'Ouvrages mobiles, en terre, en enrochement, chauffage urbain, géothermie, process, éoliennes (sauf accord préalable)',
    ],
    programme: [
      { libelle: 'RC exploitation / professionnelle', valeur: '3 M€ par sinistre ; faute inexcusable 1 M€ par an ; amiante 1 M€ ; pollution accidentelle 1,5 M€' },
      { libelle: 'RC décennale', valeur: 'Ouvrages soumis : coût de réparation (opérations ≤ 30 M€ HT, au-delà avenant ou règle proportionnelle) ; non soumis : 1,5 M€ par sinistre' },
      { libelle: 'Franchises', valeur: '35 000 € par sinistre (néant en corporel hors faute inexcusable)' },
    ],
    regleGroupe: ['Opération > 15 M€ HT ou ouvrage absent de la liste annexe : soumettre une étude particulière à la Direction des Assurances avant la passation du marché'],
    attention: ['Étude de sol : non couverte au titre de l’activité d’ingénierie de la police RCD des entreprises'],
    horsPanorama: true,
    segments: [{ de: 0, a: 3, note: 'RC professionnelle (études)' }, { de: 3, a: 8, partiel: true, note: 'Décennale du concepteur' }],
  },
  {
    cle: 'env', nom: 'RC atteinte à l’environnement', sigle: 'RCAE', nature: 'facultative', categorie: 'ouvrage', couleur: 'vert',
    obligatoire: 'Non : la pollution accidentelle est incluse dans la RC de 1re ligne ; la pollution graduelle relève d’un contrat souscrit au niveau de VINCI SA',
    souscripteur: 'Programme du groupe (RC 1re ligne + RC AE de VINCI SA)',
    beneficiaire: 'Tiers ; collectivités (frais de dépollution) ; préjudice écologique',
    objet: 'Pollution accidentelle (soudaine : fausse manœuvre, rupture fortuite de canalisation) ou graduelle, frais de dépollution, préjudice écologique',
    declenchement: 'Pollution liée au chantier (déversement, rejet, déchets)',
    periode: 'Avant et après livraison',
    references: 'Code de l’environnement (responsabilité environnementale, art. L160-1 et s.) ; C. civ. art. 1246 et s. (préjudice écologique) ; contrat d’assurance',
    programme: [
      { libelle: 'Pollution accidentelle (RC 1re ligne)', valeur: '1,525 M€ par sinistre et par an pour l’ensemble des assurés, dont préjudice écologique 1,5 M€ ; complément par la RC AE de VINCI SA' },
      { libelle: 'Pollution graduelle', valeur: 'Déclaration sur le contrat de VINCI SA (la RC 1re ligne n’intervient pas)' },
    ],
    regleGroupe: ['Tout sinistre pollution, accidentelle ou graduelle : informer la Direction des Assurances (gestion centralisée)', 'Plafond plus élevé exigé : attestation 2e ligne (72 h)'],
    attention: ['Gestion des déchets de chantier : CCAG 2021 art. 36 ; conserver les bordereaux de suivi'],
    segments: [{ de: 1, a: 3 }, { de: 3, a: 8, partiel: true, note: 'Après livraison' }],
  },

  /* ───────────────────────── Entreprise sur le chantier ───────────────────────── */
  {
    cle: 'engins', nom: 'Engins de chantier — RC circulation', nature: 'obligatoire', categorie: 'entreprise', couleur: 'bleuMoyen',
    obligatoire: 'Oui : un engin automoteur est un véhicule terrestre à moteur (assurance RC obligatoire)',
    souscripteur: 'Police flotte automobile du groupe',
    beneficiaire: 'Tiers victimes',
    objet: 'Dommages causés aux tiers par l’engin en circulation. Engin en « fonction outil » : RC générale. Dommages subis par l’engin : bris de machine',
    declenchement: 'Accident impliquant l’engin en circulation',
    periode: 'Pendant l’utilisation (chantier, dépôt, trajets)',
    references: 'C. assur. art. L211-1 (assurance automobile obligatoire)',
    programme: [
      { libelle: 'Engins non immatriculés', valeur: 'Assurés automatiquement sur la flotte, sans déclaration (propriété ou location courte, moyenne, longue durée) ; franchise RC (forfait IDA 2026) : 2 030 €' },
      { libelle: 'Engins immatriculés', valeur: 'À déclarer au parc pour être assurés' },
    ],
    regleGroupe: ['Engin loué : refuser l’assurance RC du loueur en produisant le « Mémo Véhicule Assuré » édité sur l’extranet du courtier'],
    attention: ['Conducteur titulaire de l’autorisation de conduite (CACES) : à défaut, risque de recours de l’assureur'],
    segments: [{ de: 1, a: 3 }],
  },
  {
    cle: 'bdm', nom: 'Bris de machine — matériels loués ou en propriété', sigle: 'BDM', nature: 'facultative', categorie: 'entreprise', couleur: 'violet',
    obligatoire: 'Non (police d’abonnement du groupe, automatique)',
    souscripteur: 'Programme du groupe (assureur Albingia, gestion exclusive par le courtier SIACI Saint-Honoré)',
    beneficiaire: 'Filiale gardienne du matériel (propriétaire ou locataire)',
    objet: 'Bris, destructions ou pertes soudains et fortuits des matériels et engins de chantier, en propriété ou loués, sous la garde de la filiale : en activité, au repos, au montage / démontage, au chargement / déchargement, en circulation ou en transport terrestre',
    declenchement: 'Dommage, vol, renversement, vandalisme, catastrophe naturelle affectant le matériel',
    periode: 'Toute l’année, sur les chantiers et en dépôt',
    references: 'Contrat d’assurance ; RC circulation : C. assur. art. L211-1 (assureur automobile)',
    garantit: [
      'Matériels de valeur à neuf catalogue unitaire ≤ 2 M€ HT (foreuses ≤ 1 M€), avec équipements et accessoires figurant sur le bon de location ou à l’inventaire',
      'Bungalows hors bases vie ; matériels de plus de 10 ans pour les seuls événements extérieurs (choc, renversement, effondrement, inondation, incendie, vol…)',
      'Frais de déblai / retirement : 5 % de la valeur d’achat, minimum 30 000 €, dans la limite de 500 000 € par an',
    ],
    neGarantitPas: [
      'Camions, bungalows de bureaux et bases vie (multirisque TRS), matériels mis à disposition de tiers',
      'Consommables (burins, forets, dents, couteaux, batteries, fluides), pneumatiques, câbles, flexibles',
      'Usure, corrosion, dommages esthétiques ; exposition rendant le sinistre inéluctable ; non-respect des conditions de manutention',
      'Matériels travaillant sous terre au-delà de 1 M€ (garantie spécifique), outils de forage (tiges, tubes, trépans)',
      'La RC circulation (apportée par l’assureur automobile)',
    ],
    programme: [
      { libelle: 'Plafond', valeur: '10 M€ par sinistre toutes garanties confondues ; territoire : UE, Suisse, Monaco, DROM-COM' },
      { libelle: 'Franchise', valeur: '10 % des dommages, minimum 5 000 €, maximum 25 000 €' },
      { libelle: 'Forage < 1 M€ / engins sous terre', valeur: '10 %, mini 15 000 € maxi 50 000 € / 10 %, mini 6 000 € maxi 30 000 €' },
    ],
    regleGroupe: ['Loueur qui impose sa propre garantie : les contrats cadres l’excluent ; produire l’attestation annuelle bris de machine fournie à chaque filiale'],
    attention: ['Vérifier l’état du matériel loué à la livraison et faire figurer les accessoires sur le bon de location', 'Vol : dépôt de plainte et déclaration dans les 2 jours ouvrés'],
    segments: [{ de: 1, a: 3 }],
  },
  {
    cle: 'trs', nom: 'Multirisque bureaux et bases vie', sigle: 'TRS', nature: 'facultative', categorie: 'entreprise', couleur: 'rose',
    obligatoire: 'Non (police « tous risques sauf » du groupe) — le preneur d’un bail doit en revanche assurer ses risques locatifs',
    souscripteur: 'Programme du groupe',
    beneficiaire: 'Filiales occupantes',
    objet: 'Dommages aux sites permanents, bases vie et bungalows de chantier et à leur contenu : incendie et risques annexes, dégâts des eaux, tempête, vol, bris de glace, dommages informatiques, catastrophes naturelles',
    declenchement: 'Sinistre affectant les locaux ou leur contenu',
    periode: 'Durée d’occupation (bases vie garanties sans déclaration préalable)',
    references: 'Contrat d’assurance',
    garantit: [
      'Bases vie de chantier sans déclaration préalable (France métropolitaine, Europe, DROM-COM)',
      'Immeubles d’habitation ou de bureaux < 5 000 m² réceptionnés, non livrés et gardiennés : 3 mois maximum ; lots invendus 6 mois',
      'Frais supplémentaires pour reprendre l’activité (locaux de remplacement, transports)',
    ],
    neGarantitPas: ['Le bris de machine (police BDM)', 'Le vol de biens stockés en plein air', 'Les sites industriels exploités (UIOM, STEP…)'],
    programme: [
      { libelle: 'Limite contractuelle (LCI)', valeur: '19,9 M€ par sinistre' },
      { libelle: 'Vol', valeur: 'Bases vie : 150 000 € · établissements permanents : 700 000 €' },
      { libelle: 'Recours des voisins et des tiers (incendie, explosion)', valeur: '450 000 €' },
      { libelle: 'Franchises', valeur: 'Hors bases vie 7 500 € · bases vie, bungalows, conteneurs 12 000 € · 60 000 € en cas d’incendie si une préconisation impérative n’est pas respectée · frais supplémentaires 13 000 €' },
    ],
    regleGroupe: [
      'Préconisations bases vie (depuis 2020) : installation électrique contrôlée chaque année par un organisme agréé, détection incendie et intrusion (et report d’alarme vers une télésurveillance au-delà de 12 modules), extincteurs (1 par étage et par 200 m²), référent sécurité, permis de feu, interdiction de fumer affichée',
      'Base vie conséquente : vérifier avec la Direction des Assurances que la LCI de 19,9 M€ suffit',
      'Mise à disposition d’un local ou d’un logement pour le chantier : le déclarer pour obtenir une attestation ; signaler toute fin de bail',
      'Après un sinistre indemnisé, envoyer les justificatifs de remplacement dans les 2 ans pour percevoir l’indemnité différée',
    ],
    attention: [
      'Implanter la base vie loin des bâtiments (au moins sa hauteur), hors zone inondable ; modules en laine de roche ou REI 60 ; cuisines en partie haute ; bennes et zone fumeurs à plus de 10 m',
      'Proscrire les chauffages d’appoint personnels et l’empilement des multiprises ; circuit électrique dédié à l’électroménager ; armoires sécurisées pour la recharge des batteries',
    ],
    segments: [{ de: 1, a: 3, note: 'Base vie et bureaux de chantier' }],
  },
  {
    cle: 'transport', nom: 'Assurance transport', nature: 'facultative', categorie: 'entreprise', couleur: 'vertVif',
    obligatoire: 'Non',
    souscripteur: 'Police du groupe VINCI (adhésion de l’entreprise), sur déclaration de chaque expédition',
    beneficiaire: 'Pour compte de qui il appartiendra (filiales, propriétaires des biens)',
    objet: 'Matériels, marchandises et biens (propriété, loués ou prêtés) destinés à approvisionner les chantiers, pendant le transport terrestre, maritime, fluvial ou aérien et les chargements / déchargements ; vol, vandalisme, pillage',
    declenchement: 'Perte ou avarie pendant le transport',
    periode: 'De l’enlèvement à la livraison',
    references: 'Contrat d’assurance ; C. com. art. L133-3 (réserves au transporteur)',
    neGarantitPas: ['Valeurs supérieures à 10 M€ par transport sans accord préalable', 'Vice propre de la marchandise', 'Commerce prohibé ou sous embargo', 'Faute inexcusable (relevant de la RC générale)'],
    programme: [
      { libelle: 'Engagement maximum', valeur: '10 M€ par moyen de transport ou lieu de stationnement' },
      { libelle: 'Franchise', valeur: 'Néant, sauf tubes, pipes et tuyaux : 10 %, minimum 20 000 €, maximum 45 000 €' },
    ],
    regleGroupe: ['Déclarer chaque expédition à l’avance : transitaire, dates de chargement et de livraison, itinéraire, nature, valeur et mode de chargement de la marchandise'],
    attention: ['Formuler des réserves précises sur le bon de livraison et les confirmer au transporteur par lettre recommandée dans les 3 jours (hors jours fériés)'],
    segments: [{ de: 1, a: 3, note: 'Approvisionnement du chantier' }],
  },
  {
    cle: 'nautique', nom: 'Travaux nautiques — matériel flottant', nature: 'facultative', categorie: 'entreprise', couleur: 'bleuMoyen',
    obligatoire: 'Non',
    souscripteur: 'Police « Corps & Machines » du groupe',
    beneficiaire: 'Filiales propriétaires ou affréteurs',
    objet: 'Dommages aux pousseurs, péniches, barges, dragues et matériel embarqué (y compris perte totale et vol) ; frais de retirement et de balisage d’épaves ; recours de tiers ; responsabilité d’affréteur',
    declenchement: 'Accident de navigation ou sinistre sur l’unité',
    periode: 'Pendant l’exploitation des unités',
    references: 'Contrat d’assurance maritime et fluviale',
    neGarantitPas: ['Vice propre et vétusté', 'Faute inexcusable', 'Retard et immobilisation des unités', 'Location des unités à un tiers'],
    programme: [
      { libelle: 'Recours de tiers, assistance', valeur: '10 M€ par événement' },
      { libelle: 'Frais de retirement', valeur: '300 000 € à 1 M€ par événement selon l’unité' },
      { libelle: 'Matériel embarqué', valeur: '1,5 M€ maximum (déclarer au-delà)' },
      { libelle: 'Franchises', valeur: '2 500 € à 40 000 € selon la valeur ; néant en perte totale, assistance, retirement, recours de tiers corporels' },
    ],
    regleGroupe: ['Remorquage en mer, location d’une unité à un tiers : consulter la Direction des Assurances au préalable'],
    attention: ['En cas de sinistre : mesures conservatoires, préserver les recours contre les transporteurs et responsables, déclarer au plus vite'],
    segments: [{ de: 1, a: 3 }],
  },
  {
    cle: 'auto', nom: 'Automobile — polices flotte et mission', nature: 'obligatoire', categorie: 'entreprise', couleur: 'bleuCiel',
    obligatoire: 'Oui (RC automobile obligatoire)',
    souscripteur: 'Police flotte du groupe (véhicules de fonction, de service, camions, remorques) ; police mission (véhicule personnel utilisé en déplacement professionnel)',
    beneficiaire: 'Tiers victimes ; conducteur (dommages corporels du conducteur) ; entreprise',
    objet: 'Flotte : RC, protection juridique, incendie, assistance (formule A), + vol (formule B) ; tous risques (formule C) à titre exceptionnel. Mission : tous risques y compris bris de glace',
    declenchement: 'Accident, vol, incendie, événement naturel',
    periode: 'Permanente',
    references: 'C. assur. art. L211-1 ; conventions IRSA (matériel) et IRCA (corporel) entre assureurs',
    garantit: ['Grêle, chute d’arbre ou de pierre sans franchise (franchise légale si catastrophe naturelle)', 'Matériel professionnel volé dans un véhicule assuré au minimum en formule B (avec dépôt de plainte listant le matériel)', 'Police mission : véhicule de remplacement 10 jours'],
    neGarantitPas: ['Dommages au véhicule sans tiers identifié hors formule tous risques, incendie ou catastrophe naturelle (à la charge de l’entreprise)', 'Effets personnels dans les véhicules de fonction ou de société', 'Covoiturage organisé via une plateforme (non autorisé)'],
    programme: [{ libelle: 'Franchises', valeur: 'Flotte : RC 2 131,50 € (forfait IDA et fonds de garantie compris), vol 1 500 €, incendie 1 000 €, dommage (formule C) 1 500 € · mission : 135 €' }],
    regleGroupe: ['Constat à transmettre au courtier flotte (Howden) dans les 5 jours ouvrés (2 jours ouvrés en cas de vol), avec fiche de liaison, carte grise et coordonnées du garage', 'Accident corporel : informer le gestionnaire de flotte par mail dans les 24 h', 'Ne pas faire réparer sans expertise ; dommage < 850 € HT : accord préalable du courtier'],
    attention: ['Bien remplir le recto du constat avec l’autre conducteur : cases cochées et leur nombre, croquis, point de choc initial ; ne rien ajouter après séparation des exemplaires'],
    segments: [],
  },
  {
    cle: 'drone', nom: 'RC drone et cyber', nature: 'facultative', categorie: 'entreprise', couleur: 'grisChaud',
    obligatoire: 'Non (polices du groupe VINCI, adhésion déclarative)',
    souscripteur: 'Groupe VINCI SA (SMA pour la RC drone)',
    beneficiaire: 'Tiers (drone) ; entreprise et tiers (cyber)',
    objet: 'Drone : RC pour les dommages causés aux tiers par l’utilisation d’un drone. Cyber : pertes de l’entreprise (pertes d’exploitation, frais de restauration et d’investigation, cyber-extorsion) et RC (atteinte aux données, au réseau)',
    declenchement: 'Accident de drone ; cyberattaque, fuite de données',
    periode: 'Permanente',
    references: 'Contrats d’assurance du groupe',
    garantit: ['Drone : activité de travail aérien déclarée au manuel d’activités particulières (MAP) et prévue aux conditions particulières, par les pilotes désignés (licence valide)'],
    neGarantitPas: ['Drone : usage privé, location ou prêt à des tiers, drone non déclaré', 'Cyber : réclamations antérieures, comportement malhonnête, recueil non autorisé de données, coupure de réseau hors du contrôle de l’assuré'],
    programme: [{ libelle: 'Drone', valeur: 'Adhésion préalable obligatoire : nombre de drones, n° de série et modèle, identité et licence des pilotes ; territoire monde sauf USA et Canada' }, { libelle: 'Cyber', valeur: 'Plafond général 50 M€ par an (sous-limites) ; franchise 1 M€ par sinistre ; pertes d’exploitation au-delà de 12 h' }],
    attention: ['Adhérer à la garantie drone AVANT tout vol professionnel'],
    segments: [],
  },
]

/** Assurances représentées sur les frises (celles qui ont au moins un segment). */
export const ASSURANCES_FRISE = ASSURANCES.filter((a) => a.segments.length > 0)

/* ───────────────────────── Bons réflexes avant la remise du prix ───────────────────────── */

export type Reflexe = { theme: string; si: string; alors: string; sanction: string; couleur: CleSecondaire }

export type BlocReflexes = { cle: 'soumis' | 'non_soumis'; titre: string; principe: string; definition: string; reflexes: Reflexe[] }

export const BONS_REFLEXES: BlocReflexes[] = [
  {
    cle: 'soumis', titre: 'Ouvrage soumis à l’obligation d’assurance',
    principe: 'L’assurance de responsabilité décennale est légale et obligatoire',
    definition: 'Ouvrages anciennement dits « de bâtiment »',
    reflexes: [
      { theme: 'Tous risques chantier', couleur: 'jaune', si: 'Le client exige une TRC qui doit bénéficier à tous les intervenants, ou les conditions de la TRC du groupe ne sont pas réunies (montant, durée, type d’ouvrage)', alors: 'Faire chiffrer une police TRC de chantier par la Direction des Assurances dès l’appel d’offres et intégrer la prime au prix', sanction: 'Vous n’êtes pas assuré si vous n’avez pas fait la démarche de souscrire la garantie' },
      { theme: 'Technique courante', couleur: 'orange', si: 'Les travaux font appel à une technique non courante ou l’ouvrage présente un caractère exceptionnel', alors: 'Le déclarer à la Direction des Assurances pour racheter l’exclusion ; exiger des sous-traitants concernés une attestation nominative visant le procédé', sanction: 'Vous n’êtes pas assuré si vous n’avez pas racheté l’exclusion de garantie' },
      { theme: 'CCRD', couleur: 'rose', si: 'Le coût prévisionnel de l’opération (travaux TCE + honoraires, hors équipements spéciaux) excède 15 M€ HT', alors: 'Le marché doit prévoir la souscription d’un contrat collectif de responsabilité décennale (par le MOA, sans refacturation ; à défaut, chiffrer la prime avec la Direction des Assurances)', sanction: 'En cas de sinistre, l’indemnité versée par l’assureur est réduite ou, selon le cas, il refuse d’intervenir' },
      { theme: 'Sous-traitants', couleur: 'grisChaud', si: 'Le coût prévisionnel de l’opération excède 15 M€ HT', alors: 'Exiger des sous-traitants des attestations de responsabilité décennale nominatives et vérifier leur conformité', sanction: 'En cas de sinistre, notre assureur supporte la réparation sans recours ; la sinistralité de la police du groupe se dégrade' },
      { theme: 'Cotraitants', couleur: 'bleuMoyen', si: 'Vous êtes mandataire d’un groupement de conception-réalisation, ou votre groupement est solidaire', alors: 'Vérifier les attestations de responsabilité décennale de vos cotraitants', sanction: 'L’assureur peut facturer une surprime ; les conséquences de la solidarité avec les concepteurs ne sont pas garanties' },
      { theme: 'Contractant général', couleur: 'violet', si: 'Vous intervenez en contractant général (travaux + maîtrise d’œuvre) et le coût prévisionnel excède 15 M€ HT', alors: 'Tenir à disposition de l’assureur les attestations décennales nominatives des sous-traitants', sanction: 'En cas de sinistre, l’indemnité versée par l’assureur est réduite' },
    ],
  },
  {
    cle: 'non_soumis', titre: 'Ouvrage non soumis à l’obligation d’assurance',
    principe: 'L’assurance de responsabilité décennale n’est pas imposée par la loi',
    definition: 'Ouvrages anciennement dits « de génie civil » (art. L243-1-1 C. assur.)',
    reflexes: [
      { theme: 'Tous risques chantier', couleur: 'jaune', si: 'Le client exige une TRC qui doit bénéficier à tous les intervenants, ou les conditions de la TRC du groupe ne sont pas réunies', alors: 'Faire chiffrer une police TRC de chantier dès l’appel d’offres et intégrer la prime au prix', sanction: 'Vous n’êtes pas assuré si vous n’avez pas fait la démarche de souscrire la garantie' },
      { theme: 'Décennale contractuelle', couleur: 'orange', si: 'Le marché exige une assurance décennale', alors: 'Faire intégrer l’opération à la police RCD génie civil (≤ 50 M€ HT, ≤ 7 M€ sur ou sous l’eau) ; refuser les montants exorbitants (égaux au coût de l’opération) et les garanties « tous intervenants »', sanction: 'Vous n’êtes pas assuré si vous n’avez pas fait la démarche de souscrire la garantie' },
    ],
  },
]

/** Liste légale des ouvrages non soumis à l'obligation d'assurance (C. assur. art. L243-1-1, ord. n° 2005-658 du 8 juin 2005). */
export const OUVRAGES_NON_SOUMIS = {
  toujours: [
    'Ouvrages maritimes, lacustres, fluviaux',
    'Infrastructures routières, portuaires, aéroportuaires, héliportuaires, ferroviaires',
    'Ouvrages de traitement de résidus urbains, de déchets industriels et d’effluents',
    'Leurs éléments d’équipement',
  ],
  saufAccessoire: [
    'Voiries, ouvrages piétonniers, parcs de stationnement',
    'Réseaux divers, canalisations, lignes ou câbles et leurs supports',
    'Ouvrages de transport, production, stockage et distribution d’énergie',
    'Ouvrages de stockage et de traitement de solides en vrac, de fluides et liquides',
    'Ouvrages de télécommunications, ouvrages sportifs non couverts',
  ],
  existants: 'Les ouvrages existants avant l’ouverture du chantier ne sont pas soumis, sauf s’ils sont totalement incorporés dans l’ouvrage neuf et en deviennent techniquement indivisibles.',
} as const

/** Points à vérifier sur l'attestation décennale d'un sous-traitant (Guide des assurances 2026). */
export const VERIF_ATTESTATION_ST: string[] = [
  'En-tête d’une compagnie d’assurance ou de son agent identifiable — refuser les attestations de courtiers et se méfier des compagnies inhabituelles',
  'L’assuré est bien le titulaire du lot et les activités garanties correspondent aux travaux sous-traités',
  'Document sous numéro provisoire ou projet : à faire confirmer par une attestation définitive',
  'La date d’ouverture de chantier (ou l’OS si l’entreprise a été créée après) se situe dans la période de validité',
  'Travaux de technique courante ; sinon attestation nominative mentionnant le procédé garanti',
  'Durée : ferme de 10 ans / durée de la responsabilité, gestion en capitalisation ou déclenchement par le fait dommageable',
  'Mentions légales : art. 1792 et 1792-2 C. civ., loi du 4 janvier 1978, garantie en qualité de sous-traitant',
  'Mentions minimales du modèle d’attestation (arrêté du 5 janvier 2016) ; nominative au-delà de 15 M€ HT',
  'Montant de garantie suffisant au regard des travaux, franchise, coût de l’opération couvert',
  'Date, cachet et signature de l’assureur ; idéalement, mention « à jour du paiement des primes »',
]

/** Instruction d'un sinistre dommages-ouvrage (C. assur. art. L242-1 et annexe II à l'art. A243-1). */
export const PROCEDURE_DO: { jalon: string; titre: string; texte: string }[] = [
  { jalon: 'J', titre: 'Déclaration réputée complète', texte: 'Réception de la déclaration (ou J + 10 si l’assureur n’a pas réclamé de pièce). Le MOA prend les mesures d’urgence pour éviter l’aggravation.' },
  { jalon: 'J + 10', titre: 'Pièces manquantes', texte: 'Délai dont dispose l’assureur pour réclamer les informations manquantes.' },
  { jalon: 'J + 15', titre: 'Petits sinistres', texte: 'Sinistre < 1 930 € TTC ou déclaration manifestement injustifiée : refus ou offre sans expertise (l’assuré peut contester et obtenir une expertise).' },
  { jalon: 'J + 60', titre: 'Position sur la garantie', texte: 'Après expertise et transmission préalable du rapport à l’assuré. À défaut de notification, la garantie DO est acquise.' },
  { jalon: 'J + 90', titre: 'Offre d’indemnité', texte: 'Prolongation possible jusqu’à J + 225 pour difficultés techniques exceptionnelles, avec l’accord de l’assuré.' },
  { jalon: '+ 15 jours', titre: 'Règlement', texte: 'Paiement dans les 15 jours de l’acceptation ; en cas de refus de l’offre, l’assuré peut obtenir une avance des ¾ de l’indemnité.' },
]

/** Règles « groupe » de déclaration et de gestion des sinistres (Guide des assurances 2026). */
export const REGLES_GROUPE_SINISTRE: string[] = [
  'Principe : gestion décentralisée — la filiale déclare au courtier gestionnaire en utilisant le formulaire de déclaration disponible sur Dat@ssur',
  'RC, sinistre < 150 K€ hors corporel : le courtier nomme l’expert (et si besoin l’avocat), informe l’assureur et la Direction des Assurances',
  'Sinistre ≥ 500 K€ (≥ 150 K€ en corporel), « avenant 1 » en dommages-ouvrage, pollution accidentelle ou graduelle, ou engageant l’image du groupe : la filiale informe la Direction des Assurances, qui gère le dossier avec elle',
  'Ne jamais réparer sans la validation de l’expert ; si les travaux en cause ont été sous-traités, transmettre à l’expert l’attestation, le marché et les coordonnées du sous-traitant pour qu’il soit convoqué',
]

export const QUE_FAIRE_SINISTRE: { phase: string; couleur: CleSecondaire; etapes: string[] }[] = [
  {
    phase: 'Pendant les travaux', couleur: 'jaune',
    etapes: [
      'Mettre en sécurité le chantier et les personnes ; mesures conservatoires sans détruire les preuves ; prévenir le MOE / MOA',
      'Constat contradictoire (photos datées, PV, témoins) — inscription au journal de chantier',
      'Déclarer à l’assureur concerné (TRC du groupe ou du MOA, RC) : au moins 5 jours ouvrés, 2 jours ouvrés en cas de vol (avec dépôt de plainte)',
      'TRC souscrite par le MOA : lui demander de déclarer sans délai sur sa police, ou déclarer à sa place s’il est défaillant',
      'Ne pas reconstruire avant l’accord de l’expert ; dommage causé par un sous-traitant : l’informer par écrit et réclamer son attestation',
    ],
  },
  {
    phase: 'Pendant l’année de parfait achèvement', couleur: 'vert',
    etapes: [
      'Le MOA notifie le désordre par écrit à l’entreprise (GPA, C. civ. art. 1792-6)',
      'Intervenir dans le délai fixé ; à défaut, exécution aux frais de l’entreprise après mise en demeure',
      'Désordre décennal : le MOA ne peut saisir l’assureur DO qu’après une mise en demeure restée infructueuse (sans réponse ou refus)',
      'Assurer le suivi de la levée des réserves avant la fin du délai de garantie',
    ],
  },
  {
    phase: 'Après réception (biennale / décennale)', couleur: 'orange',
    etapes: [
      'Le MOA déclare le sinistre à l’assureur DO (s’il existe) : 60 jours pour la position, 90 jours pour l’offre',
      'À défaut de DO : action directe contre le constructeur et son assureur RCD (attestation valable à la DOC)',
      'L’entreprise transmet sans délai la réclamation au courtier avec le formulaire « Responsabilité décennale » et participe à l’expertise (convoquer le sous-traitant concerné)',
      'Conserver DOE, PV de réception, attestations d’assurance valables à la DOC',
    ],
  },
  {
    phase: 'Matériel, base vie, véhicules', couleur: 'bleuMoyen',
    etapes: [
      'Engin ou matériel endommagé ou volé : déclaration bris de machine au courtier dédié ; prévenir le loueur ; plainte en cas de vol',
      'Incendie ou vol en base vie : déclaration multirisque (TRS) ; conserver les justificatifs de remplacement (indemnité différée, 2 ans)',
      'Accident de véhicule : constat amiable rempli avec l’autre conducteur, transmis au courtier flotte sous 5 jours ouvrés ; corporel : gestionnaire de flotte informé sous 24 h',
      'Avarie de transport : réserves sur le bon de livraison, confirmées au transporteur sous 3 jours',
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
