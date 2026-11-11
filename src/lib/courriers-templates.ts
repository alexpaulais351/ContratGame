/** Modèles types de courriers de chantier. Variables {{xxx}} remplacées à la création. */

export type TypeCourrier =
  | 'reserves'
  | 'mise_en_demeure'
  | 'prolongation_delai'
  | 'transmission'
  | 'prix_nouveau'
  | 'constat'
  | 'accuse_reception'
  | 'libre'

export type ModeEnvoi = 'lrar' | 'mail' | 'main_propre' | 'simple'

export const MODES_ENVOI: { value: ModeEnvoi; label: string }[] = [
  { value: 'lrar', label: 'Lettre recommandée avec AR' },
  { value: 'mail', label: 'Courrier électronique' },
  { value: 'main_propre', label: 'Remise en main propre' },
  { value: 'simple', label: 'Courrier simple' },
]

export function libelleModeEnvoi(v: string | null | undefined): string {
  return MODES_ENVOI.find((m) => m.value === v)?.label ?? ''
}

export type ModeleCourrier = {
  type: TypeCourrier
  label: string
  description: string
  objet: string
  modeEnvoi: ModeEnvoi
  corps: string
}

export const VARIABLES_COURRIER = [
  'projet', 'moa', 'moaAdresse', 'numeroAffaire', 'numeroCommande', 'numeroOTP',
  'adresseChantier', 'date', 'societe', 'signataire',
] as const

export type ContexteCourrier = {
  projet?: string | null
  moa?: string | null
  moaAdresse?: string | null
  numeroAffaire?: string | null
  numeroCommande?: string | null
  numeroOTP?: string | null
  adresseChantier?: string | null
  date?: string | null
  societe?: string | null
  signataire?: string | null
}

const SIGNATURE = '\n\nDans l’attente de votre retour, nous vous prions d’agréer, Madame, Monsieur, l’expression de nos salutations distinguées.'
const REF_MARCHE = 'Marché n° {{numeroCommande}} – Affaire {{numeroAffaire}}'

export const MODELES_COURRIERS: ModeleCourrier[] = [
  {
    type: 'reserves',
    label: 'Émission de réserves',
    description: 'Formule des réserves sur un document, un ordre de service ou une décision.',
    objet: '{{projet}} – Émission de réserves',
    modeEnvoi: 'lrar',
    corps: `Madame, Monsieur,

Dans le cadre du chantier {{projet}} ({{REF}}), nous avons pris connaissance de votre document daté du ……… relatif à ………

Après examen, nous sommes amenés à formuler les réserves suivantes :

1. ………
2. ………
3. ………

Ces réserves portent sur les conséquences techniques, financières et sur les délais d’exécution induites. Nous nous réservons le droit de présenter toute réclamation complémentaire en application des stipulations contractuelles.

Nous vous demandons de bien vouloir prendre en compte ces réserves et de nous faire part de votre position dans un délai de quinze (15) jours à compter de la réception du présent courrier.${SIGNATURE}`.replace('{{REF}}', REF_MARCHE),
  },
  {
    type: 'mise_en_demeure',
    label: 'Mise en demeure',
    description: 'Met en demeure le destinataire d’exécuter une obligation contractuelle dans un délai donné.',
    objet: '{{projet}} – Mise en demeure',
    modeEnvoi: 'lrar',
    corps: `Madame, Monsieur,

Par la présente, et en référence au {{REF}} relatif au chantier {{projet}} situé {{adresseChantier}}, nous constatons que vous n’avez pas satisfait à l’obligation suivante :

………

Malgré nos précédentes demandes en date du ………, la situation demeure inchangée.

En conséquence, nous vous mettons en demeure de procéder à ……… dans un délai de huit (8) jours à compter de la réception du présent courrier.

À défaut, nous nous réservons le droit de faire exécuter ces prestations à vos frais et risques, d’appliquer les pénalités prévues au contrat et de faire valoir tous nos droits.

Le présent courrier vaut mise en demeure au sens des stipulations contractuelles.${SIGNATURE}`.replace('{{REF}}', REF_MARCHE),
  },
  {
    type: 'prolongation_delai',
    label: 'Demande de prolongation de délai',
    description: 'Sollicite une prolongation du délai d’exécution en justifiant les causes.',
    objet: '{{projet}} – Demande de prolongation de délai',
    modeEnvoi: 'lrar',
    corps: `Madame, Monsieur,

Dans le cadre du chantier {{projet}} ({{REF}}), nous vous informons que l’exécution des travaux est impactée par les événements suivants :

– ………
– ………

Ces événements, qui ne nous sont pas imputables, ont entraîné un retard estimé à ……… jours calendaires sur le chemin critique du planning.

Nous sollicitons en conséquence une prolongation du délai contractuel de ……… jours calendaires, portant la date d’achèvement des travaux au ………

Nous restons à votre disposition pour vous présenter l’analyse détaillée de l’impact planning et vous remercions de bien vouloir nous notifier votre accord.${SIGNATURE}`.replace('{{REF}}', REF_MARCHE),
  },
  {
    type: 'transmission',
    label: 'Transmission de documents',
    description: 'Accompagne l’envoi de documents (plans, notes, PV, fiches techniques…).',
    objet: '{{projet}} – Transmission de documents',
    modeEnvoi: 'mail',
    corps: `Madame, Monsieur,

Veuillez trouver ci-joint, pour le chantier {{projet}} ({{REF}}), les documents suivants :

– ………  (indice ……)
– ………  (indice ……)
– ………  (indice ……)

Ces documents sont transmis pour : ☐ information  ☐ visa  ☐ approbation  ☐ exécution.

Nous vous remercions de bien vouloir nous retourner un exemplaire visé dans les meilleurs délais.${SIGNATURE}`.replace('{{REF}}', REF_MARCHE),
  },
  {
    type: 'prix_nouveau',
    label: 'Demande de prix nouveau / réclamation',
    description: 'Présente une demande de rémunération complémentaire ou un prix nouveau.',
    objet: '{{projet}} – Demande de prix nouveau / réclamation',
    modeEnvoi: 'lrar',
    corps: `Madame, Monsieur,

Dans le cadre du chantier {{projet}} ({{REF}}), des prestations non prévues au marché ont été demandées ou rendues nécessaires par ………

Ces prestations, détaillées ci-après, ne correspondent à aucun prix du bordereau :

– Désignation : ………
– Quantité estimée : ………
– Justification : ………

Nous vous transmettons en pièce jointe le mémoire justificatif et la proposition de prix nouveau correspondante, d’un montant de ……… € HT.

Nous vous demandons de bien vouloir valider ce prix nouveau par ordre de service ou avenant, et nous réservons le droit de compléter la présente réclamation.${SIGNATURE}`.replace('{{REF}}', REF_MARCHE),
  },
  {
    type: 'constat',
    label: 'Constat contradictoire',
    description: 'Convoque ou acte un constat contradictoire sur site.',
    objet: '{{projet}} – Constat contradictoire',
    modeEnvoi: 'lrar',
    corps: `Madame, Monsieur,

Dans le cadre du chantier {{projet}} ({{REF}}), nous vous informons que nous avons constaté ou allons constater, le ……… à ……… h, sur {{adresseChantier}}, les faits suivants :

………

Conformément aux stipulations contractuelles, nous vous invitons à assister ou à vous faire représenter à ce constat contradictoire.

À défaut de présence de votre part, le constat sera réputé contradictoire et vous sera notifié, accompagné des photographies et relevés réalisés.${SIGNATURE}`.replace('{{REF}}', REF_MARCHE),
  },
  {
    type: 'accuse_reception',
    label: 'Accusé de réception',
    description: 'Accuse réception d’un courrier, d’un document ou d’un ordre de service.',
    objet: '{{projet}} – Accusé de réception',
    modeEnvoi: 'mail',
    corps: `Madame, Monsieur,

Nous accusons réception de votre courrier / document en date du ………, référencé ………, relatif au chantier {{projet}} ({{REF}}).

Nous en avons pris connaissance. Cet accusé de réception ne vaut pas acceptation de son contenu : nous reviendrons vers vous dans les meilleurs délais si des observations devaient être formulées.${SIGNATURE}`.replace('{{REF}}', REF_MARCHE),
  },
  {
    type: 'libre',
    label: 'Courrier libre',
    description: 'Page blanche avec formule d’appel et de politesse.',
    objet: '{{projet}} – ',
    modeEnvoi: 'simple',
    corps: `Madame, Monsieur,

………${SIGNATURE}`,
  },
]

export function modeleParType(type: string): ModeleCourrier | undefined {
  return MODELES_COURRIERS.find((m) => m.type === type)
}

export function libelleTypeCourrier(type: string): string {
  return modeleParType(type)?.label ?? 'Autre'
}

/** Remplace les {{variables}} ; une variable sans valeur laisse « ……… » à compléter. */
export function appliquerVariables(texte: string, ctx: ContexteCourrier): string {
  return texte.replace(/\{\{(\w+)\}\}/g, (_m, cle: string) => {
    const v = (ctx as Record<string, string | null | undefined>)[cle]
    return v && v.trim() ? v.trim() : '………'
  })
}

/** Référence suggérée : CR-2026-001, incrémentée sur les références existantes. */
export function prochaineReference(existantes: string[], annee: number): string {
  const prefixe = `CR-${annee}-`
  let max = 0
  for (const r of existantes) {
    if (r.startsWith(prefixe)) {
      const n = parseInt(r.slice(prefixe.length), 10)
      if (Number.isFinite(n) && n > max) max = n
    }
  }
  return prefixe + String(max + 1).padStart(3, '0')
}
