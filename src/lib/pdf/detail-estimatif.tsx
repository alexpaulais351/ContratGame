import { Document, Page, Text, View } from '@react-pdf/renderer'
import type { Style } from '@react-pdf/types'
import { EntetePDF, PiedPagePDF, pdfStyles } from './pdf-entete'
import { formatDateFR, formatMontant, formatNombreFR } from './format'
import { VINCI } from '@/lib/design-tokens'
import type { ProfilSociete } from '@/stores/profil'
import { calculerSousTotaux, montantLigne, totalGeneral, type LigneDEClient } from '@/components/modules/detail-estimatif/types'

export type OptionsPDFDE = {
  /** Ligne de sous-total à la fin de chaque chapitre */
  sousTotaux: boolean
  /** Tableau récapitulatif par chapitre en fin de document */
  recapitulatif: boolean
  paysage: boolean
}

type Props = {
  lignes: LigneDEClient[]
  nomProjet: string
  profil: ProfilSociete | null
  options: OptionsPDFDE
}

const COL = {
  code: { width: '10%' },
  designation: { width: '44%' },
  unite: { width: '7%', textAlign: 'center' },
  quantite: { width: '11%', textAlign: 'right' },
  pu: { width: '12%', textAlign: 'right' },
  montant: { width: '16%', textAlign: 'right' },
} satisfies Record<string, Style>

const styleChapitre: Style = { backgroundColor: VINCI.bleuTresClair }
const texteChapitre: Style = { fontFamily: 'Helvetica-Bold', color: VINCI.bleuFonce }
const styleSousTotal: Style = { backgroundColor: VINCI.grisClair, borderTopWidth: 0.5, borderTopColor: VINCI.gris }

type Rangee =
  | { type: 'ligne'; ligne: LigneDEClient; alt: boolean }
  | { type: 'chapitre'; ligne: LigneDEClient }
  | { type: 'sousTotal'; chapitre: LigneDEClient; montant: number }

/** Aplati les lignes en rangées PDF (avec sous-totaux optionnels). */
function construireRangees(lignes: LigneDEClient[], avecSousTotaux: boolean, sousTotaux: Map<string, number>): Rangee[] {
  const res: Rangee[] = []
  let chapitreCourant: LigneDEClient | null = null
  let alt = false
  const fermer = () => {
    if (avecSousTotaux && chapitreCourant) {
      res.push({ type: 'sousTotal', chapitre: chapitreCourant, montant: sousTotaux.get(chapitreCourant.id) ?? 0 })
    }
  }
  for (const l of lignes) {
    if (l.estChapitre) {
      fermer()
      chapitreCourant = l
      alt = false
      res.push({ type: 'chapitre', ligne: l })
    } else {
      res.push({ type: 'ligne', ligne: l, alt })
      alt = !alt
    }
  }
  fermer()
  return res
}

function libelleChapitre(l: LigneDEClient) {
  return [l.code, l.designation].filter(Boolean).join(' — ') || 'Chapitre'
}

export function DocumentDetailEstimatif({ lignes, nomProjet, profil, options }: Props) {
  const sousTotaux = calculerSousTotaux(lignes)
  const total = totalGeneral(lignes)
  const rangees = construireRangees(lignes, options.sousTotaux, sousTotaux)
  const chapitres = lignes.filter((l) => l.estChapitre)
  const nbLignes = lignes.length - chapitres.length

  return (
    <Document title={`Détail Estimatif — ${nomProjet}`} author="Contrat Game">
      <Page size="A4" orientation={options.paysage ? 'landscape' : 'portrait'} style={pdfStyles.page}>
        <EntetePDF profil={profil} nomProjet={nomProjet} titreDocument="Détail Estimatif" />
        <Text style={pdfStyles.titre}>Détail Estimatif</Text>
        <Text style={pdfStyles.sousTitre}>
          {nbLignes} ligne{nbLignes > 1 ? 's' : ''} · {chapitres.length} chapitre{chapitres.length > 1 ? 's' : ''} · édité le {formatDateFR(new Date())} ·
          montants HT en euros
        </Text>

        <View style={pdfStyles.table}>
          <View style={pdfStyles.thRow} fixed>
            <Text style={[pdfStyles.th, COL.code]}>Code</Text>
            <Text style={[pdfStyles.th, COL.designation]}>Désignation</Text>
            <Text style={[pdfStyles.th, COL.unite]}>Unité</Text>
            <Text style={[pdfStyles.th, COL.quantite]}>Quantité</Text>
            <Text style={[pdfStyles.th, COL.pu]}>PU HT</Text>
            <Text style={[pdfStyles.th, COL.montant]}>Montant HT</Text>
          </View>

          {rangees.map((r, i) => {
            if (r.type === 'chapitre') {
              return (
                <View key={i} style={[pdfStyles.tr, styleChapitre]} wrap={false} minPresenceAhead={30}>
                  <Text style={[pdfStyles.td, COL.code, texteChapitre]}>{r.ligne.code}</Text>
                  <Text style={[pdfStyles.td, { width: '74%' }, texteChapitre]}>{(r.ligne.designation || 'Chapitre').toUpperCase()}</Text>
                  <Text style={[pdfStyles.td, COL.montant, texteChapitre]}>
                    {options.sousTotaux ? '' : formatMontant(sousTotaux.get(r.ligne.id) ?? 0)}
                  </Text>
                </View>
              )
            }
            if (r.type === 'sousTotal') {
              return (
                <View key={i} style={[pdfStyles.tr, styleSousTotal]} wrap={false}>
                  <Text style={[pdfStyles.td, { width: '84%', textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>
                    Sous-total {libelleChapitre(r.chapitre)}
                  </Text>
                  <Text style={[pdfStyles.td, COL.montant, { fontFamily: 'Helvetica-Bold' }]}>{formatMontant(r.montant)}</Text>
                </View>
              )
            }
            const l = r.ligne
            return (
              <View key={i} style={r.alt ? [pdfStyles.tr, pdfStyles.trAlt] : pdfStyles.tr} wrap={false}>
                <Text style={[pdfStyles.td, COL.code]}>{l.code}</Text>
                <Text style={[pdfStyles.td, COL.designation]}>{l.designation}</Text>
                <Text style={[pdfStyles.td, COL.unite]}>{l.unite}</Text>
                <Text style={[pdfStyles.td, COL.quantite]}>{formatNombreFR(l.quantite)}</Text>
                <Text style={[pdfStyles.td, COL.pu]}>{formatNombreFR(l.prixUnitaire)}</Text>
                <Text style={[pdfStyles.td, COL.montant]}>{formatNombreFR(montantLigne(l))}</Text>
              </View>
            )
          })}

          <View style={pdfStyles.tfRow} wrap={false}>
            <Text style={[pdfStyles.tf, { width: '84%', textAlign: 'right' }]}>TOTAL GÉNÉRAL HT</Text>
            <Text style={[pdfStyles.tf, COL.montant]}>{formatMontant(total)}</Text>
          </View>
        </View>

        {options.recapitulatif && chapitres.length > 0 ? (
          <View style={{ marginTop: 18 }} wrap={false}>
            <Text style={[pdfStyles.titre, { fontSize: 11 }]}>Récapitulatif par chapitre</Text>
            <View style={pdfStyles.table}>
              <View style={pdfStyles.thRow}>
                <Text style={[pdfStyles.th, { width: '12%' }]}>Code</Text>
                <Text style={[pdfStyles.th, { width: '56%' }]}>Chapitre</Text>
                <Text style={[pdfStyles.th, { width: '20%', textAlign: 'right' }]}>Montant HT</Text>
                <Text style={[pdfStyles.th, { width: '12%', textAlign: 'right' }]}>% total</Text>
              </View>
              {chapitres.map((c, i) => {
                const m = sousTotaux.get(c.id) ?? 0
                return (
                  <View key={c.id} style={i % 2 === 1 ? [pdfStyles.tr, pdfStyles.trAlt] : pdfStyles.tr}>
                    <Text style={[pdfStyles.td, { width: '12%' }]}>{c.code}</Text>
                    <Text style={[pdfStyles.td, { width: '56%' }]}>{c.designation}</Text>
                    <Text style={[pdfStyles.td, { width: '20%', textAlign: 'right' }]}>{formatMontant(m)}</Text>
                    <Text style={[pdfStyles.td, { width: '12%', textAlign: 'right' }]}>
                      {total ? formatNombreFR((m / total) * 100, 1) : '0,0'} %
                    </Text>
                  </View>
                )
              })}
              <View style={pdfStyles.tfRow}>
                <Text style={[pdfStyles.tf, { width: '68%', textAlign: 'right' }]}>TOTAL GÉNÉRAL HT</Text>
                <Text style={[pdfStyles.tf, { width: '20%', textAlign: 'right' }]}>{formatMontant(total)}</Text>
                <Text style={[pdfStyles.tf, { width: '12%', textAlign: 'right' }]}>100,0 %</Text>
              </View>
            </View>
          </View>
        ) : null}

        <PiedPagePDF gauche={`Détail Estimatif — ${nomProjet}`} />
      </Page>
    </Document>
  )
}
