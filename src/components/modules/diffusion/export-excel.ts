'use client'
// Export Excel de la liste de diffusion (exceljs côté client), mise en forme VINCI.
import type { Borders, Fill } from 'exceljs'
import { telechargerBlob } from '@/hooks/useExportPDF'
import { VINCI } from '@/lib/design-tokens'
import { formatDateFR } from '@/lib/utils'
import { grouperParRole, nomComplet, type ContactDiffusionDTO } from './contacts'

const argb = (hex: string) => 'FF' + hex.replace('#', '').toUpperCase()
const remplir = (hex: string): Fill => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: argb(hex) } })
const bordureFine: Partial<Borders> = {
  top: { style: 'thin', color: { argb: argb(VINCI.grisBordure) } },
  left: { style: 'thin', color: { argb: argb(VINCI.grisBordure) } },
  bottom: { style: 'thin', color: { argb: argb(VINCI.grisBordure) } },
  right: { style: 'thin', color: { argb: argb(VINCI.grisBordure) } },
}

const COLONNES: { titre: string; largeur: number }[] = [
  { titre: 'Rôle', largeur: 22 },
  { titre: 'Organisation', largeur: 32 },
  { titre: 'Civilité', largeur: 10 },
  { titre: 'Prénom', largeur: 14 },
  { titre: 'Nom', largeur: 16 },
  { titre: 'Fonction', largeur: 24 },
  { titre: 'E-mail', largeur: 32 },
  { titre: 'Téléphone', largeur: 16 },
  { titre: 'Adresse', largeur: 34 },
  { titre: 'Destinataire par défaut', largeur: 13 },
  { titre: 'Copie par défaut', largeur: 11 },
  { titre: 'Diffusion infos chantier', largeur: 13 },
  { titre: 'Commentaire', largeur: 30 },
]

export async function exporterDiffusionExcel(contacts: ContactDiffusionDTO[], nomProjet: string, nomFichier: string) {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Contrat Game'
  wb.created = new Date()
  const ws = wb.addWorksheet('Liste de diffusion', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 3 }],
    pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  })
  const nb = COLONNES.length
  COLONNES.forEach((c, i) => (ws.getColumn(i + 1).width = c.largeur))

  ws.mergeCells(1, 1, 1, nb)
  const t = ws.getCell(1, 1)
  t.value = `LISTE DE DIFFUSION — ${nomProjet}`
  t.fill = remplir(VINCI.bleu)
  t.font = { bold: true, size: 14, color: { argb: argb(VINCI.blanc) } }
  t.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  ws.getRow(1).height = 28
  ws.mergeCells(2, 1, 2, nb)
  const st = ws.getCell(2, 1)
  st.value = `${contacts.length} contact(s) · Édité le ${formatDateFR(new Date())}`
  st.font = { italic: true, color: { argb: argb(VINCI.texteSecondaire) } }

  const entete = ws.getRow(3)
  COLONNES.forEach((c, i) => {
    const cell = entete.getCell(i + 1)
    cell.value = c.titre
    cell.fill = remplir(VINCI.bleu)
    cell.font = { bold: true, color: { argb: argb(VINCI.blanc) } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = bordureFine
  })
  entete.height = 32

  const oui = (b: boolean) => (b ? 'Oui' : '')
  let r = 4
  for (const g of grouperParRole(contacts)) {
    ws.mergeCells(r, 1, r, nb)
    const gc = ws.getCell(r, 1)
    gc.value = `${g.label} (${g.contacts.length})`
    gc.fill = remplir(VINCI.bleuTresClair)
    gc.font = { bold: true, color: { argb: argb(VINCI.bleuFonce) } }
    gc.border = bordureFine
    r++
    g.contacts.forEach((c, i) => {
      const row = ws.getRow(r)
      const valeurs = [
        g.label, c.organisation, c.civilite ?? '', c.prenom ?? '', c.nom ?? '', c.fonction ?? '', c.email ?? '', c.telephone ?? '',
        c.adresse ?? '', oui(c.destinataireParDefaut), oui(c.copieParDefaut), oui(c.diffusionCR), c.commentaire ?? '',
      ]
      valeurs.forEach((v, k) => {
        const cell = row.getCell(k + 1)
        cell.value = k === 6 && v ? { text: v, hyperlink: `mailto:${v}` } : v
        if (k === 6 && v) cell.font = { color: { argb: argb(VINCI.bleu) }, underline: true }
        if (k === 1) cell.font = { bold: true }
        cell.alignment = { vertical: 'top', wrapText: true, horizontal: k >= 9 && k <= 11 ? 'center' : 'left' }
        cell.border = bordureFine
        if (i % 2) cell.fill = remplir(VINCI.grisClair)
      })
      r++
    })
  }
  ws.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: nb } }

  const buf = await wb.xlsx.writeBuffer()
  telechargerBlob(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    nomFichier,
  )
}
