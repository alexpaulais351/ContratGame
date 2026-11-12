'use client'
/**
 * Génération Word (.docx) d'un courrier — même rendu que le PDF courrier officiel
 * (src/lib/pdf/courrier.tsx) : bande bleue VINCI, en-tête société (logo, nom, adresse, tél.),
 * bloc destinataire, lieu/date, référence, mode d'envoi, objet, corps, signature, copies.
 *
 * Utilisé par la bibliothèque de modèles (variables {{…}} et « ……… » surlignées en jaune
 * pour être complétées) et par l'éditeur de courrier d'un projet (vraies valeurs).
 * À charger en import dynamique : await import('@/lib/word/courrier-docx').
 */
import {
  AlignmentType, BorderStyle, Document, Footer, HighlightColor, ImageRun, Packer, PageNumber, Paragraph, ShadingType,
  Table, TableCell, TableRow, TextRun, WidthType, convertMillimetersToTwip,
} from 'docx'
import { VINCI } from '@/lib/design-tokens'
import { formatDateFR } from '@/lib/utils'
import { libelleModeEnvoi } from '@/lib/courriers-templates'
import { telechargerBlob } from '@/hooks/useExportPDF'
import type { ProfilSociete } from '@/stores/profil'

export type CourrierWordData = {
  reference: string
  objet: string
  destinataire: string
  lieu: string
  dateEnvoi: string | null
  modeEnvoi: string
  copies: string
  signataireNom: string
  signataireFonction: string
  corps: string
}

export type OptionsCourrierWord = {
  /** Modèle vierge : lieu/date « à compléter », variables mises en évidence. */
  modele?: boolean
}

const hex = (c: string) => c.replace('#', '').toUpperCase()
const POLICE = 'Arial'
const TAILLE = 21 // demi-points → 10,5 pt (comme le PDF)
const A_COMPLETER = '………'

/** Découpe un texte en runs : {{variables}} et « ……… » surlignés en jaune. */
export function runsAvecVariables(texte: string, base: { bold?: boolean; size?: number; color?: string } = {}): TextRun[] {
  return texte
    .split(/(\{\{\w+\}\}|…{2,}|\.{3,})/g)
    .filter((m) => m !== '')
    .map((m) => {
      const aCompleter = /^\{\{\w+\}\}$/.test(m) || /^…{2,}$/.test(m) || /^\.{3,}$/.test(m)
      return new TextRun({
        text: m,
        font: POLICE,
        size: base.size ?? TAILLE,
        bold: base.bold,
        color: base.color,
        ...(aCompleter ? { highlight: HighlightColor.YELLOW } : {}),
      })
    })
}

const para = (texte: string, opts: { bold?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; after?: number; size?: number; color?: string; indent?: number } = {}) =>
  new Paragraph({
    alignment: opts.align,
    spacing: { after: opts.after ?? 0, line: 276 },
    indent: opts.indent ? { left: opts.indent } : undefined,
    children: runsAvecVariables(texte, { bold: opts.bold, size: opts.size, color: opts.color }),
  })

type Logo = { data: Uint8Array; type: 'png' | 'jpg' | 'gif' | 'bmp'; largeur: number; hauteur: number }

/** Décode le logo (data URL base64) et calcule ses dimensions (hauteur 56 px). */
async function chargerLogo(dataUrl: string | null | undefined): Promise<Logo | null> {
  if (!dataUrl) return null
  const m = /^data:image\/(png|jpe?g|gif|bmp);base64,(.+)$/i.exec(dataUrl)
  if (!m) return null // SVG / WebP non pris en charge par Word : on affiche le nom de société
  const type = (m[1].toLowerCase().startsWith('jp') ? 'jpg' : m[1].toLowerCase()) as Logo['type']
  const bin = atob(m[2])
  const data = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) data[i] = bin.charCodeAt(i)
  const dims = await new Promise<{ w: number; h: number } | null>((resolve) => {
    if (typeof Image === 'undefined') return resolve(null)
    const img = new Image()
    img.onload = () => resolve({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 })
    img.onerror = () => resolve(null)
    img.src = dataUrl
  })
  const hauteur = 56
  const ratio = dims ? dims.w / dims.h : 2
  const largeur = Math.min(190, Math.round(hauteur * ratio))
  return { data, type, largeur, hauteur: Math.round(largeur / ratio) }
}

const SANS_BORDURE = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
}

export async function genererCourrierDocx(c: CourrierWordData, profil: ProfilSociete | null, options: OptionsCourrierWord = {}): Promise<Blob> {
  const logo = await chargerLogo(profil?.logoSociete)

  // En-tête société (gauche) + certifications (droite), comme le PDF.
  const gauche: Paragraph[] = []
  if (logo)
    gauche.push(new Paragraph({
      spacing: { after: 80 },
      children: [new ImageRun({ type: logo.type, data: logo.data, transformation: { width: logo.largeur, height: logo.hauteur } })],
    }))
  if (profil?.nomSociete) gauche.push(para(profil.nomSociete, { bold: true, size: 24, color: hex(VINCI.bleu) }))
  if (profil?.adresseSociete)
    for (const l of profil.adresseSociete.split('\n')) gauche.push(para(l, { size: 17, color: hex(VINCI.texteSecondaire) }))
  if (profil?.telSociete) gauche.push(para(`Tél. : ${profil.telSociete}`, { size: 17, color: hex(VINCI.texteSecondaire) }))
  if (gauche.length === 0) gauche.push(para(options.modele ? '{{societe}}' : '', { bold: true, size: 24, color: hex(VINCI.bleu) }))
  const droite = profil?.certifications
    ? profil.certifications.split('\n').map((l) => para(l, { size: 17, color: hex(VINCI.texteSecondaire), align: AlignmentType.RIGHT }))
    : [new Paragraph({ children: [] })]

  const entete = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { ...SANS_BORDURE, insideHorizontal: SANS_BORDURE.top, insideVertical: SANS_BORDURE.top },
    rows: [
      new TableRow({
        children: [
          new TableCell({ width: { size: 62, type: WidthType.PERCENTAGE }, borders: SANS_BORDURE, children: gauche }),
          new TableCell({ width: { size: 38, type: WidthType.PERCENTAGE }, borders: SANS_BORDURE, children: droite }),
        ],
      }),
    ],
  })

  const bande = new Paragraph({
    shading: { type: ShadingType.CLEAR, color: 'auto', fill: hex(VINCI.bleu) },
    spacing: { after: 200 },
    children: [new TextRun({ text: ' ', size: 8, font: POLICE })],
  })
  const filet = new Paragraph({
    spacing: { after: 360 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: hex(VINCI.grisBordure), space: 4 } },
    children: [],
  })

  const indentDest = convertMillimetersToTwip(88)
  const lignesDest = (c.destinataire || (options.modele ? '{{moa}}\n{{moaAdresse}}' : '')).split('\n')
  const destinataire = lignesDest.map((l, i) => para(l || ' ', { bold: i === 0, indent: indentDest }))

  const dateTxt = c.dateEnvoi ? formatDateFR(c.dateEnvoi) : options.modele ? A_COMPLETER : formatDateFR(new Date())
  const lieu = c.lieu || (options.modele ? A_COMPLETER : '')
  const lieuDate = lieu ? `${lieu}, le ${dateTxt}` : `Le ${dateTxt}`

  const corps = (c.corps || '').split('\n').map((p) =>
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: p === '' ? 60 : 40, line: 276 },
      children: p === '' ? [] : runsAvecVariables(p),
    }),
  )

  const signNom = c.signataireNom || (options.modele ? '{{signataire}}' : '')
  const signFonction = c.signataireFonction || (options.modele ? `Fonction : ${A_COMPLETER}` : '')

  const enfants: (Paragraph | Table)[] = [
    bande,
    entete,
    filet,
    ...destinataire,
    para('', { after: 240 }),
    para(lieuDate, { align: AlignmentType.RIGHT, after: 240 }),
  ]
  if (c.reference || options.modele) enfants.push(para(`Réf. : ${c.reference || A_COMPLETER}`, { after: 40 }))
  if (c.modeEnvoi) enfants.push(para(libelleModeEnvoi(c.modeEnvoi) || c.modeEnvoi, { bold: true, after: 40 }))
  enfants.push(
    new Paragraph({
      spacing: { before: 160, after: 280 },
      children: [new TextRun({ text: 'Objet : ', bold: true, font: POLICE, size: TAILLE }), ...runsAvecVariables(c.objet, { bold: true })],
    }),
    ...corps,
    para('', { after: 400 }),
  )
  if (signNom) enfants.push(para(signNom, { bold: true, align: AlignmentType.RIGHT }))
  if (signFonction) enfants.push(para(signFonction, { align: AlignmentType.RIGHT }))
  if (c.copies)
    enfants.push(
      para('', { after: 300 }),
      // le champ Copies peut contenir des retours à la ligne (Textarea) : un paragraphe par ligne
      ...`Copies : ${c.copies}`.split('\n').map((l) => para(l || ' ', { size: 18, color: hex(VINCI.texteSecondaire) })),
    )

  const piedGauche = [profil?.nomSociete, c.reference].filter(Boolean).join(' – ')
  const footer = new Footer({
    children: [
      new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: hex(VINCI.grisBordure), space: 4 } },
        tabStops: [{ type: 'right', position: convertMillimetersToTwip(170) }],
        children: [
          new TextRun({ text: piedGauche, font: POLICE, size: 15, color: hex(VINCI.gris) }),
          new TextRun({ children: ['\tPage ', PageNumber.CURRENT, ' / ', PageNumber.TOTAL_PAGES], font: POLICE, size: 15, color: hex(VINCI.gris) }),
        ],
      }),
    ],
  })

  const doc = new Document({
    creator: profil?.nomSociete ?? 'Contrat Game',
    title: `Courrier ${c.reference || c.objet}`,
    styles: { default: { document: { run: { font: POLICE, size: TAILLE } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: convertMillimetersToTwip(210), height: convertMillimetersToTwip(297) },
            margin: {
              top: convertMillimetersToTwip(12), bottom: convertMillimetersToTwip(20),
              left: convertMillimetersToTwip(20), right: convertMillimetersToTwip(20),
              footer: convertMillimetersToTwip(8),
            },
          },
        },
        footers: { default: footer },
        children: enfants,
      },
    ],
  })
  return Packer.toBlob(doc)
}

/** Génère et télécharge le .docx (à appeler via exportAvecGuard). */
export async function telechargerCourrierWord(c: CourrierWordData, profil: ProfilSociete | null, nomFichier: string, options: OptionsCourrierWord = {}) {
  const blob = await genererCourrierDocx(c, profil, options)
  telechargerBlob(blob, nomFichier.endsWith('.docx') ? nomFichier : `${nomFichier}.docx`)
}
