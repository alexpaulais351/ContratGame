/**
 * Procédure de décompte général définitif (DGD) — données et calculs PURS.
 *
 * Une même géométrie (coordonnées dans un canevas fixe) est rendue :
 *  - à l'écran en HTML/SVG (components/modules/boite-a-outils/SchemaDGD.tsx),
 *  - dans le PDF en @react-pdf (lib/pdf/procedure-dgd.tsx).
 *
 * Sources (voir le rapport / l'onglet « Délais clés ») :
 *  - CCAG Travaux 2021 (arrêté du 30 mars 2021 modifié) : art. 12.3, 12.4, 55 ;
 *  - CCAG Travaux 2009 (arrêté du 8 septembre 2009 modifié par l'arrêté du 3 mars 2014) : art. 13.3, 13.4, 50 ;
 *  - CCCG Travaux SNCF : schéma fourni par l'utilisateur (photo), reproduit tel quel.
 */
import { VINCI, VINCI_SECONDAIRE } from '@/lib/design-tokens'
import { echeance, estDateValide, libelleDelai, type DateISO, type Delai } from './dates'

/* ─────────────────────────── Géométrie du schéma ─────────────────────────── */

export const COULEURS_SCHEMA = {
  bleu: { fond: VINCI.bleu, texte: VINCI.blanc },
  bleuFonce: { fond: VINCI.bleuFonce, texte: VINCI.blanc },
  bleuClair: { fond: VINCI.bleuClair, texte: VINCI.blanc },
  bleuMoyen: { fond: VINCI_SECONDAIRE.bleuMoyen.base, texte: VINCI.blanc },
  bleuCiel: { fond: VINCI_SECONDAIRE.bleuCiel.base, texte: VINCI.noir },
  vert: { fond: VINCI_SECONDAIRE.vert.base, texte: VINCI.blanc },
  jaune: { fond: VINCI_SECONDAIRE.jaune.base, texte: VINCI.noir },
  violet: { fond: VINCI_SECONDAIRE.violet.base, texte: VINCI.blanc },
  orange: { fond: VINCI_SECONDAIRE.orange.base, texte: VINCI.blanc },
  gris: { fond: VINCI.texteSecondaire, texte: VINCI.blanc },
  grisChaud: { fond: VINCI_SECONDAIRE.grisChaud.base, texte: VINCI.noir },
} as const

export type CleCouleur = keyof typeof COULEURS_SCHEMA

export type Boite = {
  id: string
  x: number
  y: number
  w: number
  h: number
  texte: string
  couleur: CleCouleur
  forme?: 'rect' | 'pentagone'
  gras?: boolean
  /** Taille de police dans le repère du canevas (défaut 14). */
  taille?: number
}

/** Flèche épaisse (délai) : double (↔) ou simple vers la droite (→). */
export type Fleche = {
  x1: number
  x2: number
  y: number
  h: number
  label: string
  couleur: CleCouleur
  sens: 'double' | 'droite'
  taille?: number
}

export type Trait = { x1: number; y1: number; x2: number; y2: number; pointille?: boolean; pointe?: boolean }

export type SchemaGeometrie = {
  largeur: number
  hauteur: number
  axe: { y: number; x1: number; x2: number }
  boites: Boite[]
  fleches: Fleche[]
  traits: Trait[]
}

type Pt = [number, number]
const pts = (p: Pt[]) => p.map(([x, y]) => `${round(x)},${round(y)}`).join(' ')
const round = (n: number) => Math.round(n * 10) / 10

/** Points du polygone d'une flèche épaisse. */
export function polygoneFleche(f: Fleche): string {
  const L = Math.min(34, (f.x2 - f.x1) / 3)
  const demi = f.h / 2
  const fut = f.h * 0.3
  const { x1, x2, y } = f
  if (f.sens === 'droite') {
    return pts([
      [x1, y - fut], [x2 - L, y - fut], [x2 - L, y - demi], [x2, y],
      [x2 - L, y + demi], [x2 - L, y + fut], [x1, y + fut],
    ])
  }
  return pts([
    [x1, y], [x1 + L, y - demi], [x1 + L, y - fut], [x2 - L, y - fut], [x2 - L, y - demi], [x2, y],
    [x2 - L, y + demi], [x2 - L, y + fut], [x1 + L, y + fut], [x1 + L, y + demi],
  ])
}

export const POINTE_PENTAGONE = 42

/** Points d'une boîte en forme de flèche (pentagone pointant vers la droite). */
export function polygonePentagone(b: Boite): string {
  const L = Math.min(POINTE_PENTAGONE, b.w / 3)
  return pts([[b.x, b.y], [b.x + b.w - L, b.y], [b.x + b.w, b.y + b.h / 2], [b.x + b.w - L, b.y + b.h], [b.x, b.y + b.h]])
}

/** Petite pointe triangulaire à l'extrémité (x2, y2) d'un trait. */
export function polygonePointe(t: Trait, taille = 9): string {
  const ang = Math.atan2(t.y2 - t.y1, t.x2 - t.x1)
  const a1 = ang + Math.PI - 0.45
  const a2 = ang + Math.PI + 0.45
  return pts([
    [t.x2, t.y2],
    [t.x2 + taille * Math.cos(a1), t.y2 + taille * Math.sin(a1)],
    [t.x2 + taille * Math.cos(a2), t.y2 + taille * Math.sin(a2)],
  ])
}

/** Zone de texte d'une boîte (la pointe du pentagone est exclue). */
export function zoneTexte(b: Boite): { x: number; y: number; w: number; h: number } {
  if (b.forme === 'pentagone') return { x: b.x, y: b.y, w: b.w - Math.min(POINTE_PENTAGONE, b.w / 3) * 0.8, h: b.h }
  return { x: b.x, y: b.y, w: b.w, h: b.h }
}

/* ─────────────────────────── Étapes (tableau + calculateur) ─────────────────────────── */

export type Etape = {
  cle: string
  etape: string
  acteur: string
  /** Délai lisible (« 30 jours », « 6 mois », « — »). */
  delaiTexte: string
  /** Délai calculable ; absent = étape non calculable automatiquement. */
  delai?: Delai
  /** Clé de l'étape dont la date sert de point de départ (absent = point de départ initial). */
  depuis?: string
  pointDepart: string
  article: string
  /** « limite » = date au plus tard ; « apartir » = possible à compter de cette date. */
  typeDate?: 'limite' | 'apartir'
  /** L'utilisateur peut saisir la date réelle de cette étape (affine les étapes suivantes). */
  saisieReelle?: boolean
  branche?: 'nominal' | 'reserves' | 'carence' | 'retard'
  note?: string
}

export type VarianteDGD = {
  cle: 'ccag2021' | 'ccag2009' | 'cccg'
  libelle: string
  titre: string
  reference: string
  avertissement: string
  /** Avertissement fort (bandeau jaune) affiché partout où la variante est utilisée. */
  alerte?: string
  departLibelle: string
  etapes: Etape[]
  schema: SchemaGeometrie
}

/* ── Gabarit commun CCAG (2021 et 2009 version 2014 : même mécanique) ── */

type TextesCcag = {
  reception: string
  remisePDF: string
  etablissementDG: string
  notificationDG: string
  renvoiDG: string
  dgd: string
  retardPDF: string
  indexRevision: string
  reserves: string
  decision: string
  carence1: string
  carence2: string
  carence3: string
}

function schemaCcag(t: TextesCcag): SchemaGeometrie {
  const Y = 300
  const J = [40, 330, 600, 870] // jalons : réception, PDF, DG, renvoi
  return {
    largeur: 1300,
    hauteur: 640,
    axe: { y: Y, x1: 16, x2: 1290 },
    fleches: [
      { x1: J[0], x2: J[1], y: Y, h: 62, label: '30 jours', couleur: 'jaune', sens: 'double' },
      { x1: J[1], x2: J[2], y: Y, h: 62, label: '30 jours', couleur: 'jaune', sens: 'double' },
      { x1: J[2], x2: J[3], y: Y, h: 62, label: '30 jours', couleur: 'jaune', sens: 'double' },
      { x1: 880, x2: 990, y: 412, h: 56, label: '30 j', couleur: 'jaune', sens: 'double' },
      { x1: 646, x2: 700, y: 572, h: 40, label: '', couleur: 'grisChaud', sens: 'droite' },
      { x1: 920, x2: 975, y: 572, h: 40, label: '10 j', couleur: 'grisChaud', sens: 'droite', taille: 11 },
    ],
    traits: [
      { x1: 375, y1: 82, x2: 375, y2: 104, pointille: true },
      { x1: 555, y1: 82, x2: 555, y2: 104, pointille: true },
      { x1: J[1], y1: 214, x2: J[1], y2: Y - 4, pointe: true },
      { x1: J[2], y1: 214, x2: J[2], y2: Y - 4, pointe: true },
      { x1: J[3], y1: 214, x2: J[3], y2: Y - 4, pointe: true },
      { x1: J[0], y1: Y + 32, x2: J[0], y2: 470, pointille: true },
      { x1: J[2], y1: Y + 32, x2: J[2], y2: 530, pointille: true },
      { x1: J[3], y1: Y + 32, x2: J[3], y2: 372, pointille: true },
    ],
    boites: [
      { id: 'etab', x: 330, y: 8, w: 270, h: 74, texte: t.etablissementDG, couleur: 'bleuCiel', taille: 13 },
      { id: 'pdf', x: 225, y: 104, w: 210, h: 110, texte: t.remisePDF, couleur: 'grisChaud' },
      { id: 'notif', x: 480, y: 104, w: 240, h: 110, texte: t.notificationDG, couleur: 'bleuFonce' },
      { id: 'renvoi', x: 760, y: 104, w: 220, h: 110, texte: t.renvoiDG, couleur: 'bleuMoyen' },
      { id: 'sansres', x: 995, y: 70, w: 190, h: 180, texte: t.dgd, couleur: 'bleu', forme: 'pentagone', taille: 13 },
      { id: 'dgd', x: 1192, y: 112, w: 98, h: 96, texte: 'Le DG devient le DGD', couleur: 'violet', gras: true, taille: 15 },
      { id: 'reception', x: 8, y: 470, w: 190, h: 110, texte: t.reception, couleur: 'bleuClair', gras: true },
      { id: 'retard', x: 60, y: 348, w: 250, h: 104, texte: t.retardPDF, couleur: 'orange', taille: 12.5 },
      { id: 'index', x: 345, y: 348, w: 240, h: 104, texte: t.indexRevision, couleur: 'jaune', taille: 12.5 },
      { id: 'reserves', x: 640, y: 372, w: 240, h: 82, texte: t.reserves, couleur: 'vert', taille: 13 },
      { id: 'decision', x: 990, y: 340, w: 300, h: 146, texte: t.decision, couleur: 'vert', taille: 13 },
      { id: 'carence1', x: 380, y: 530, w: 266, h: 88, texte: t.carence1, couleur: 'gris', taille: 13 },
      { id: 'carence2', x: 700, y: 530, w: 220, h: 88, texte: t.carence2, couleur: 'gris', taille: 13 },
      { id: 'carence3', x: 975, y: 530, w: 315, h: 88, texte: t.carence3, couleur: 'violet', taille: 13 },
    ],
  }
}

function etapesCcag(a: {
  reception: string; pdf: string; retard: string; dg: string; renvoi: string; tacite: string; memoire: string
  decision: string; ta: string; carence: string; ta6mois: string; rejet: string; retardDelai: string
}): Etape[] {
  return [
    {
      cle: 'reception', etape: 'Notification de la décision de réception des travaux', acteur: 'Maître d’ouvrage',
      delaiTexte: '—', pointDepart: 'Point de départ de la procédure', article: a.reception, saisieReelle: false, branche: 'nominal',
    },
    {
      cle: 'pdf', etape: 'Notification du projet de décompte final (demande de paiement finale) au MOE et au MOA', acteur: 'Titulaire',
      delaiTexte: '30 jours', delai: { jours: 30 }, depuis: 'reception', pointDepart: 'Notification de la décision de réception',
      article: a.pdf, saisieReelle: true, branche: 'nominal',
    },
    {
      cle: 'retard', etape: 'Retard du titulaire : mise en demeure de produire le projet de décompte final, puis décompte final établi d’office par le MOE aux frais du titulaire',
      acteur: 'MOA / MOE', delaiTexte: a.retardDelai,
      pointDepart: 'Mise en demeure', article: a.retard, branche: 'retard',
    },
    {
      cle: 'dg', etape: 'Notification au titulaire du décompte général signé (projet établi par le MOE)', acteur: 'Maître d’ouvrage (RPA)',
      delaiTexte: '30 jours', delai: { jours: 30 }, depuis: 'pdf',
      pointDepart: 'Réception de la demande de paiement finale par le MOE (ou par le MOA, si plus tardive)', article: a.dg,
      saisieReelle: true, branche: 'nominal',
    },
    {
      cle: 'renvoi', etape: 'Renvoi du décompte général signé, sans ou avec réserves (réserves motivées et chiffrées dans un mémoire en réclamation)',
      acteur: 'Titulaire', delaiTexte: '30 jours', delai: { jours: 30 }, depuis: 'dg', pointDepart: 'Notification du décompte général',
      article: `${a.renvoi} ; ${a.memoire}`, saisieReelle: true, branche: 'nominal',
    },
    {
      cle: 'tacite', etape: 'DG signé sans réserves, ou non renvoyé dans le délai, ou réserves non motivées : le DG devient le DGD',
      acteur: '—', delaiTexte: 'À l’expiration du délai', delai: { jours: 0 }, depuis: 'renvoi', pointDepart: 'Expiration du délai de renvoi',
      article: a.tacite, typeDate: 'apartir', branche: 'nominal',
    },
    {
      cle: 'decision', etape: 'Décision motivée sur le mémoire en réclamation (silence = rejet implicite)', acteur: 'Maître d’ouvrage (RPA), après avis du MOE',
      delaiTexte: '30 jours', delai: { jours: 30 }, depuis: 'renvoi', pointDepart: 'Réception du mémoire en réclamation',
      article: `${a.decision} ; ${a.rejet}`, saisieReelle: true, branche: 'reserves',
    },
    {
      cle: 'ta', etape: 'Saisine du tribunal administratif (à défaut : forclusion, la décision est réputée acceptée)', acteur: 'Titulaire',
      delaiTexte: '6 mois', delai: { mois: 6 }, depuis: 'decision', pointDepart: 'Notification de la décision ou rejet implicite',
      article: a.ta6mois, branche: 'reserves',
      note: 'La saisine d’un comité consultatif de règlement amiable, d’un conciliateur ou d’un médiateur interrompt le délai de recours.',
    },
    {
      cle: 'carence', etape: 'DG non notifié dans le délai : le titulaire notifie au MOA (copie MOE) un projet de décompte général signé',
      acteur: 'Titulaire', delaiTexte: 'Dès l’expiration du délai de notification', delai: { jours: 0 }, depuis: 'dg',
      pointDepart: 'Expiration du délai de notification du DG', article: a.carence, typeDate: 'apartir', saisieReelle: true, branche: 'carence',
    },
    {
      cle: 'tacite2', etape: 'Notification du DG par le MOA ; à défaut, le projet du titulaire devient le DGD (DGD « tacite »)',
      acteur: 'Maître d’ouvrage', delaiTexte: '10 jours', delai: { jours: 10 }, depuis: 'carence',
      pointDepart: 'Réception du projet de DG du titulaire', article: a.carence, branche: 'carence',
    },
  ]
}

const CCAG2021: VarianteDGD = {
  cle: 'ccag2021',
  libelle: 'CCAG Travaux 2021',
  titre: 'Procédure de DGD — CCAG Travaux 2021',
  reference: 'Arrêté du 30 mars 2021 portant approbation du CCAG Travaux, version consolidée (arrêtés modificatifs du 30/09/2021 et du 29/12/2022) — art. 12.3, 12.4 et 55',
  avertissement:
    'Délais du CCAG Travaux 2021 (jours calendaires, art. 3.2). Le CCAP peut y déroger : vérifiez toujours les pièces particulières du marché.',
  departLibelle: 'Date de notification de la décision de réception',
  etapes: etapesCcag({
    reception: 'Art. 41.3 et 12.3.2', pdf: 'Art. 12.3.1 et 12.3.2', retard: 'Art. 12.3.4', retardDelai: '15 jours', dg: 'Art. 12.4.1 et 12.4.2',
    renvoi: 'Art. 12.4.3', tacite: 'Art. 12.4.3 et 12.4.5', memoire: '55.1.1', decision: 'Art. 55.1.2', rejet: '55.1.3',
    ta: '55.3.2', carence: 'Art. 12.4.4', ta6mois: 'Art. 55.3.2 et 55.3.3 (55.2.3 : interruption)',
  }),
  schema: schemaCcag({
    reception: 'Notification de la décision de réception des travaux (41.3)',
    remisePDF: 'Le titulaire notifie son projet de décompte final au MOE et au MOA (12.3.2)',
    etablissementDG: 'Le MOE accepte ou rectifie le PDF puis établit le projet de DG (12.3.3, 12.4.1)',
    notificationDG: 'Le MOA notifie au titulaire le décompte général signé (12.4.2)',
    renvoiDG: 'Le titulaire renvoie le DG signé, avec ou sans réserves (12.4.3)',
    dgd: 'DG signé sans réserves, ou non renvoyé sous 30 j, ou réserves non motivées (12.4.3, 12.4.5)',
    retardPDF: 'Retard du titulaire : mise en demeure de remettre le PDF sous 15 j, sinon décompte final établi d’office (12.3.4)',
    indexRevision: 'Index de révision non connus : révision notifiée dans les 10 j suivant leur publication (12.4.2)',
    reserves: 'DG renvoyé avec réserves + mémoire en réclamation (55.1.1)',
    decision: 'Le MOA notifie sa décision motivée sous 30 j ; silence = rejet (55.1.2, 55.1.3). Le titulaire a 6 mois pour saisir le TA, sinon forclusion (55.3.2)',
    carence1: 'DG non notifié au titulaire dans le délai de 30 jours (12.4.2)',
    carence2: 'Le titulaire notifie au MOA un projet de DG signé (12.4.4)',
    carence3: 'Pas de DG notifié sous 10 j : le projet du titulaire devient le DGD (12.4.4)',
  }),
}

const CCAG2009: VarianteDGD = {
  cle: 'ccag2009',
  libelle: 'CCAG Travaux 2009',
  titre: 'Procédure de DGD — CCAG Travaux 2009 (version 2014)',
  reference:
    'Arrêté du 8 septembre 2009 modifié par l’arrêté du 3 mars 2014 — art. 13.3, 13.4 et 50 (marchés dont la consultation a été engagée à compter du 1er avril 2014)',
  avertissement:
    'Version issue de l’arrêté du 3 mars 2014. Pour un marché passé sous la version initiale du CCAG 2009 (avant avril 2014), les délais étaient plus longs (projet de décompte final 45 j, DG 40 j, renvoi 45 j — à vérifier dans les pièces du marché). Le CCAP peut déroger.',
  departLibelle: 'Date de notification de la décision de réception',
  etapes: etapesCcag({
    reception: 'Art. 41.3 et 13.3.2', pdf: 'Art. 13.3.1 et 13.3.2', retard: 'Art. 13.3.4', retardDelai: 'Fixé par la mise en demeure (à vérifier)', dg: 'Art. 13.4.1 et 13.4.2',
    renvoi: 'Art. 13.4.3', tacite: 'Art. 13.4.3 et 13.4.5', memoire: '50.1.1', decision: 'Art. 50.1.2', rejet: '50.1.3',
    ta: '50.3.2', carence: 'Art. 13.4.4', ta6mois: 'Art. 50.3.2 et 50.3.3',
  }),
  schema: schemaCcag({
    reception: 'Notification de la décision de réception des travaux (41.3)',
    remisePDF: 'Le titulaire transmet son projet de décompte final au MOE et au RPA (13.3.2)',
    etablissementDG: 'Le MOE accepte ou rectifie le PDF puis établit le projet de DG (13.3.3, 13.4.1)',
    notificationDG: 'Le RPA notifie au titulaire le décompte général signé (13.4.2)',
    renvoiDG: 'Le titulaire renvoie le DG signé, avec ou sans réserves (13.4.3)',
    dgd: 'DG signé sans réserves, ou non renvoyé sous 30 j, ou réserves non motivées (13.4.3, 13.4.5)',
    retardPDF: 'Retard du titulaire : mise en demeure, puis décompte final établi d’office par le MOE (13.3.4)',
    indexRevision: 'Révision : prise en compte des index publiés (13.4.2) — modalités à vérifier au CCAP',
    reserves: 'DG renvoyé avec réserves + mémoire en réclamation (50.1.1)',
    decision: 'Le RPA notifie sa décision motivée sous 30 j ; silence = rejet (50.1.2, 50.1.3). Le titulaire a 6 mois pour saisir le TA, sinon forclusion (50.3.2)',
    carence1: 'DG non notifié au titulaire dans le délai de 30 jours (13.4.2)',
    carence2: 'Le titulaire notifie au RPA un projet de DG signé (13.4.4)',
    carence3: 'Pas de DG notifié sous 10 j : le projet du titulaire devient le DGD (13.4.4)',
  }),
}

/* ── CCCG Travaux (photo fournie) : reproduction fidèle ── */

function schemaCccg(): SchemaGeometrie {
  const Y = 300
  const J = [40, 330, 600, 870]
  return {
    largeur: 1300,
    hauteur: 640,
    axe: { y: Y, x1: 16, x2: 1290 },
    fleches: [
      { x1: J[0], x2: J[1], y: Y, h: 62, label: '45 jours', couleur: 'jaune', sens: 'double' },
      { x1: J[1], x2: J[2], y: Y, h: 62, label: '90 jours', couleur: 'jaune', sens: 'double' },
      { x1: J[2], x2: J[3], y: Y, h: 62, label: '45 jours', couleur: 'jaune', sens: 'double' },
      { x1: 880, x2: 990, y: 412, h: 56, label: '6 mois', couleur: 'jaune', sens: 'double' },
      { x1: 646, x2: 700, y: 572, h: 40, label: '', couleur: 'grisChaud', sens: 'droite' },
      { x1: 920, x2: 975, y: 572, h: 40, label: '', couleur: 'grisChaud', sens: 'droite' },
    ],
    traits: [
      { x1: 375, y1: 82, x2: 375, y2: 104, pointille: true },
      { x1: 555, y1: 82, x2: 555, y2: 104, pointille: true },
      { x1: J[1], y1: 214, x2: J[1], y2: Y - 4, pointe: true },
      { x1: J[2], y1: 214, x2: J[2], y2: Y - 4, pointe: true },
      { x1: J[3], y1: 214, x2: J[3], y2: Y - 4, pointe: true },
      { x1: J[0], y1: Y + 32, x2: J[0], y2: 470, pointille: true },
      { x1: J[2], y1: Y + 32, x2: J[2], y2: 530, pointille: true },
      { x1: J[3], y1: Y + 32, x2: J[3], y2: 372, pointille: true },
      { x1: 1240, y1: Y + 3, x2: 1240, y2: 340 },
    ],
    boites: [
      { id: 'etab', x: 330, y: 8, w: 270, h: 74, texte: 'Établissement du projet de DG par le MOE', couleur: 'bleuCiel' },
      { id: 'pdf', x: 225, y: 104, w: 210, h: 110, texte: 'Remise par le titulaire de son PDF au MOE', couleur: 'grisChaud' },
      { id: 'notif', x: 480, y: 104, w: 240, h: 110, texte: 'Notification par OS au titulaire du DG signé par la PRM', couleur: 'bleuFonce' },
      { id: 'renvoi', x: 760, y: 104, w: 220, h: 110, texte: 'Renvoi par le titulaire au MOE du DG signé avec ou sans réserves', couleur: 'bleuMoyen' },
      {
        id: 'sansres', x: 995, y: 70, w: 190, h: 180, couleur: 'bleu', forme: 'pentagone', taille: 13,
        texte: 'DG signé sans réserves par le titulaire, ou renvoyé après le délai de 45 j, ou réserves non motivées',
      },
      { id: 'dgd', x: 1192, y: 112, w: 98, h: 96, texte: 'Le DG devient le DGD', couleur: 'violet', gras: true, taille: 15 },
      { id: 'reception', x: 8, y: 470, w: 190, h: 110, texte: 'Date d’établissement du PV de réception des travaux', couleur: 'bleuClair', gras: true },
      {
        id: 'index', x: 345, y: 348, w: 240, h: 104, couleur: 'jaune', gras: true, taille: 13,
        texte: 'ou 30 jours après la publication de l’indice permettant la révision du solde',
      },
      { id: 'reserves', x: 640, y: 372, w: 240, h: 82, texte: 'Si DG renvoyé signé avec réserves par le titulaire + mémoire', couleur: 'vert', taille: 13 },
      {
        id: 'decision', x: 990, y: 340, w: 300, h: 146, couleur: 'vert', taille: 13,
        texte: 'La PRM a 6 mois pour répondre. L’entreprise a 3 mois à compter de la réponse ou de l’expiration du délai de 6 mois pour contester et saisir le TA',
      },
      { id: 'carence1', x: 380, y: 530, w: 266, h: 88, texte: 'Si pas de notification au titulaire du DG signé dans le délai de 90 jours ou 30 jours', couleur: 'gris', taille: 13 },
      { id: 'carence2', x: 700, y: 530, w: 220, h: 88, texte: 'Mise en demeure de la PRM par le titulaire', couleur: 'gris', taille: 13 },
      { id: 'carence3', x: 975, y: 530, w: 315, h: 88, texte: 'Pas de réponse : saisine possible du TA', couleur: 'gris', taille: 13 },
    ],
  }
}

const ART_CCCG = 'CCCG Travaux SNCF (schéma fourni) — article à vérifier dans le CCCG applicable'

const CCCG: VarianteDGD = {
  cle: 'cccg',
  libelle: 'CCCG Travaux — SNCF',
  titre: 'Procédure de DGD — CCCG Travaux SNCF',
  reference: 'Reproduction du schéma « Procédure de DGD (CCCG Travaux) » — règlement définitif des comptes, demande de paiement finale, décompte général',
  avertissement:
    'Schéma reproduit à l’identique du document fourni (CCCG Travaux SNCF). Vérifiez la version du CCCG visée par votre marché et les dérogations du CCAP.',
  alerte: 'Attention : procédure propre aux marchés SNCF (CCCG Travaux SNCF), différente du CCAG Travaux. À n’utiliser que si le marché s’y réfère.',
  departLibelle: 'Date d’établissement du PV de réception',
  etapes: [
    { cle: 'reception', etape: 'Établissement du PV de réception des travaux', acteur: 'Maître d’ouvrage / MOE', delaiTexte: '—', pointDepart: 'Point de départ de la procédure', article: ART_CCCG, branche: 'nominal' },
    { cle: 'pdf', etape: 'Remise par le titulaire de son projet de décompte final (PDF) au MOE', acteur: 'Titulaire', delaiTexte: '45 jours', delai: { jours: 45 }, depuis: 'reception', pointDepart: 'Date du PV de réception', article: ART_CCCG, saisieReelle: true, branche: 'nominal' },
    {
      cle: 'dg', etape: 'Notification par OS au titulaire du DG signé par la PRM (projet de DG établi par le MOE)', acteur: 'PRM (MOE pour le projet)', delaiTexte: '90 jours',
      delai: { jours: 90 }, depuis: 'pdf', pointDepart: 'Remise du PDF', article: ART_CCCG, saisieReelle: true, branche: 'nominal',
      note: 'Ou 30 jours après la publication de l’indice permettant la révision du solde (si plus tardif).',
    },
    { cle: 'renvoi', etape: 'Renvoi par le titulaire au MOE du DG signé, avec ou sans réserves (+ mémoire si réserves)', acteur: 'Titulaire', delaiTexte: '45 jours', delai: { jours: 45 }, depuis: 'dg', pointDepart: 'Notification du DG', article: ART_CCCG, saisieReelle: true, branche: 'nominal' },
    { cle: 'tacite', etape: 'DG signé sans réserves, ou renvoyé après le délai de 45 j, ou réserves non motivées : le DG devient le DGD', acteur: '—', delaiTexte: 'À l’expiration du délai', delai: { jours: 0 }, depuis: 'renvoi', pointDepart: 'Expiration du délai de renvoi', article: ART_CCCG, typeDate: 'apartir', branche: 'nominal' },
    { cle: 'decision', etape: 'Réponse de la PRM au mémoire', acteur: 'PRM', delaiTexte: '6 mois', delai: { mois: 6 }, depuis: 'renvoi', pointDepart: 'Renvoi du DG avec réserves + mémoire', article: ART_CCCG, saisieReelle: true, branche: 'reserves' },
    { cle: 'ta', etape: 'Contestation et saisine du tribunal administratif', acteur: 'Titulaire', delaiTexte: '3 mois', delai: { mois: 3 }, depuis: 'decision', pointDepart: 'Réponse de la PRM ou expiration du délai de 6 mois', article: ART_CCCG, branche: 'reserves' },
    { cle: 'carence', etape: 'Pas de notification du DG dans le délai de 90 j (ou 30 j) : mise en demeure de la PRM par le titulaire', acteur: 'Titulaire', delaiTexte: 'Dès l’expiration du délai', delai: { jours: 0 }, depuis: 'dg', pointDepart: 'Expiration du délai de notification du DG', article: ART_CCCG, typeDate: 'apartir', branche: 'carence' },
    { cle: 'tacite2', etape: 'Pas de réponse à la mise en demeure : saisine possible du TA', acteur: 'Titulaire', delaiTexte: 'Non précisé sur le schéma', pointDepart: 'Mise en demeure restée sans réponse', article: ART_CCCG, branche: 'carence', note: 'Délai de réponse à la mise en demeure : à vérifier dans le CCCG.' },
  ],
  schema: schemaCccg(),
}

export const VARIANTES_DGD: VarianteDGD[] = [CCAG2021, CCAG2009, CCCG]

export function varianteDGD(cle: string): VarianteDGD {
  return VARIANTES_DGD.find((v) => v.cle === cle) ?? CCAG2021
}

/* ─────────────────────────── Calculateur ─────────────────────────── */

export type ResultatEtape = {
  cle: string
  /** Date calculée (limite ou « à partir du »), null si non calculable. */
  date: DateISO | null
  /** Date brute avant report au jour ouvrable (si différente). */
  brute: DateISO | null
  reportee: boolean
  /** Date réelle saisie par l'utilisateur pour cette étape. */
  reelle: DateISO | null
  /** La date réelle saisie dépasse la date limite. */
  depassement: boolean
}

/**
 * Calcule les dates de chaque étape à partir de la date de départ (réception) et des dates
 * réelles éventuellement saisies. Une étape dont la date réelle est connue sert de point de
 * départ aux étapes suivantes ; à défaut, on retient sa date limite théorique.
 */
export function calculerEcheancesDGD(
  variante: VarianteDGD,
  depart: DateISO,
  reelles: Record<string, string | null | undefined> = {},
  report = true,
): ResultatEtape[] {
  const dates: Record<string, DateISO | null> = {}
  const res: ResultatEtape[] = []
  for (const e of variante.etapes) {
    const reelle = estDateValide(reelles[e.cle]) ? (reelles[e.cle] as DateISO) : null
    if (!e.depuis) {
      const d = e.cle === 'reception' && estDateValide(depart) ? depart : null
      dates[e.cle] = d
      res.push({ cle: e.cle, date: d, brute: d, reportee: false, reelle: null, depassement: false })
      continue
    }
    const base = dates[e.depuis] ?? null
    if (!base || !e.delai) {
      dates[e.cle] = reelle
      res.push({ cle: e.cle, date: null, brute: null, reportee: false, reelle, depassement: false })
      continue
    }
    // « À partir du » : pas de report au jour ouvrable (ce n'est pas une date limite).
    const ech = echeance(base, e.delai, report && e.typeDate !== 'apartir')
    dates[e.cle] = reelle ?? ech.date
    res.push({
      cle: e.cle,
      date: ech.date,
      brute: ech.brute,
      reportee: ech.reportee,
      reelle,
      depassement: !!reelle && e.typeDate !== 'apartir' && reelle > ech.date,
    })
  }
  return res
}

export { libelleDelai }
