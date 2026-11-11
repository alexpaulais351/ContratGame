/**
 * PDF Sous-traitants.
 *
 * API STABLE (utilisée par le PDF de situation) :
 *   - type RecapSTMois = { nom, montantTotal, factureMois, cumulFacture, reste, pct }[]
 *       (pct en pourcentage 0-100+, montants en €)
 *   - <SectionSousTraitantsPDF lignes={RecapSTMois} titre?={string} />
 *       Bloc <View> à insérer DANS une <Page> existante (tableau récap + totaux).
 *   - Données : getRecapSousTraitantsMois(projetId, annee, mois)
 *       dans '@/components/modules/sous-traitants/recap' (serveur).
 *   - <SousTraitantsPDF .../> : document complet « Suivi sous-traitants » d'une année.
 */
import { Document, Page, Text, View } from '@react-pdf/renderer'
import { EntetePDF, PiedPagePDF, pdfStyles } from './pdf-entete'
import { PDF_COULEURS, formatMontant, formatNombreFR } from './format'
import { MOIS_COURTS_FR } from '@/lib/mois'
import type { ProfilSociete } from '@/stores/profil'

export type RecapSTMois = {
  nom: string
  montantTotal: number
  factureMois: number
  cumulFacture: number
  reste: number
  pct: number
}[]

const pct = (n: number) => formatNombreFR(n, 1) + ' %'

export function SectionSousTraitantsPDF({ lignes, titre = 'Sous-traitants' }: { lignes: RecapSTMois; titre?: string }) {
  const w = ['28%', '15%', '15%', '15%', '15%', '12%']
  const tot = lignes.reduce(
    (a, l) => ({ t: a.t + l.montantTotal, m: a.m + l.factureMois, c: a.c + l.cumulFacture, r: a.r + l.reste }),
    { t: 0, m: 0, c: 0, r: 0 },
  )
  const heads = ['Sous-traitant', 'Montant total', 'Facturé du mois', 'Cumul facturé', 'Reste à facturer', '% avanc.']
  return (
    <View wrap={false} style={{ marginTop: 12 }}>
      <Text style={pdfStyles.titre}>{titre}</Text>
      <View style={pdfStyles.table}>
        <View style={pdfStyles.thRow}>
          {heads.map((h, i) => (
            <Text key={h} style={[pdfStyles.th, i > 0 ? pdfStyles.num : {}, { width: w[i] }]}>{h}</Text>
          ))}
        </View>
        {lignes.map((l, i) => (
          <View key={l.nom + i} style={[pdfStyles.tr, i % 2 ? pdfStyles.trAlt : {}]}>
            <Text style={[pdfStyles.td, { width: w[0] }]}>{l.nom}</Text>
            <Text style={[pdfStyles.td, pdfStyles.num, { width: w[1] }]}>{formatMontant(l.montantTotal)}</Text>
            <Text style={[pdfStyles.td, pdfStyles.num, { width: w[2] }]}>{formatMontant(l.factureMois)}</Text>
            <Text style={[pdfStyles.td, pdfStyles.num, { width: w[3] }]}>{formatMontant(l.cumulFacture)}</Text>
            <Text style={[pdfStyles.td, pdfStyles.num, { width: w[4] }]}>{formatMontant(l.reste)}</Text>
            <Text style={[pdfStyles.td, pdfStyles.num, { width: w[5] }, l.pct > 100 ? { color: PDF_COULEURS.rouge } : {}]}>{pct(l.pct)}</Text>
          </View>
        ))}
        <View style={pdfStyles.tfRow}>
          <Text style={[pdfStyles.tf, { width: w[0] }]}>Total</Text>
          <Text style={[pdfStyles.tf, pdfStyles.num, { width: w[1] }]}>{formatMontant(tot.t)}</Text>
          <Text style={[pdfStyles.tf, pdfStyles.num, { width: w[2] }]}>{formatMontant(tot.m)}</Text>
          <Text style={[pdfStyles.tf, pdfStyles.num, { width: w[3] }]}>{formatMontant(tot.c)}</Text>
          <Text style={[pdfStyles.tf, pdfStyles.num, { width: w[4] }]}>{formatMontant(tot.r)}</Text>
          <Text style={[pdfStyles.tf, pdfStyles.num, { width: w[5] }]}>{pct(tot.t > 0 ? (tot.c / tot.t) * 100 : 0)}</Text>
        </View>
      </View>
    </View>
  )
}

export type LigneSTAnnee = {
  nom: string
  paiementDirect: boolean
  montantMarche: number
  montantAvenants: number
  montantTotal: number
  /** 12 montants (janvier → décembre) de l'année affichée */
  mois: number[]
  factureAnnee: number
  cumulFacture: number
  reste: number
  pct: number
}

export function SousTraitantsPDF({ lignes, annee, nomProjet, profil }: {
  lignes: LigneSTAnnee[]; annee: number; nomProjet: string; profil: ProfilSociete | null
}) {
  const sum = (f: (l: LigneSTAnnee) => number) => lignes.reduce((s, l) => s + f(l), 0)
  const totMois = Array.from({ length: 12 }, (_, i) => sum((l) => l.mois[i] ?? 0))
  const totTotal = sum((l) => l.montantTotal)
  const totCumul = sum((l) => l.cumulFacture)
  const wNom = '15%'
  const wC = '5.6%'
  const wR = '7.4%'
  return (
    <Document title={`Suivi sous-traitants ${annee}`}>
      <Page size="A4" orientation="landscape" style={pdfStyles.page}>
        <EntetePDF profil={profil} nomProjet={nomProjet} />
        <Text style={pdfStyles.titre}>Suivi des sous-traitants — {annee}</Text>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.thRow}>
            <Text style={[pdfStyles.th, { width: wNom }]}>Sous-traitant</Text>
            <Text style={[pdfStyles.th, pdfStyles.num, { width: wR }]}>Total</Text>
            {MOIS_COURTS_FR.map((m) => (
              <Text key={m} style={[pdfStyles.th, pdfStyles.num, { width: wC }]}>{m}</Text>
            ))}
            <Text style={[pdfStyles.th, pdfStyles.num, { width: wR }]}>Cumul</Text>
            <Text style={[pdfStyles.th, pdfStyles.num, { width: wR }]}>Reste</Text>
            <Text style={[pdfStyles.th, pdfStyles.num, { width: '5%' }]}>%</Text>
          </View>
          {lignes.map((l, i) => (
            <View key={l.nom + i} style={[pdfStyles.tr, i % 2 ? pdfStyles.trAlt : {}]} wrap={false}>
              <Text style={[pdfStyles.td, { width: wNom }]}>{l.nom}{l.paiementDirect ? ' (PD)' : ''}</Text>
              <Text style={[pdfStyles.td, pdfStyles.num, { width: wR }]}>{formatNombreFR(l.montantTotal)}</Text>
              {l.mois.map((v, k) => (
                <Text key={k} style={[pdfStyles.td, pdfStyles.num, { width: wC }]}>{v ? formatNombreFR(v) : ''}</Text>
              ))}
              <Text style={[pdfStyles.td, pdfStyles.num, { width: wR }]}>{formatNombreFR(l.cumulFacture)}</Text>
              <Text style={[pdfStyles.td, pdfStyles.num, { width: wR }]}>{formatNombreFR(l.reste)}</Text>
              <Text style={[pdfStyles.td, pdfStyles.num, { width: '5%' }, l.pct > 100 ? { color: PDF_COULEURS.rouge } : {}]}>{formatNombreFR(l.pct, 0)}</Text>
            </View>
          ))}
          <View style={pdfStyles.tfRow}>
            <Text style={[pdfStyles.tf, { width: wNom }]}>Total</Text>
            <Text style={[pdfStyles.tf, pdfStyles.num, { width: wR }]}>{formatNombreFR(totTotal)}</Text>
            {totMois.map((v, k) => (
              <Text key={k} style={[pdfStyles.tf, pdfStyles.num, { width: wC }]}>{v ? formatNombreFR(v) : ''}</Text>
            ))}
            <Text style={[pdfStyles.tf, pdfStyles.num, { width: wR }]}>{formatNombreFR(totCumul)}</Text>
            <Text style={[pdfStyles.tf, pdfStyles.num, { width: wR }]}>{formatNombreFR(totTotal - totCumul)}</Text>
            <Text style={[pdfStyles.tf, pdfStyles.num, { width: '5%' }]}>{formatNombreFR(totTotal > 0 ? (totCumul / totTotal) * 100 : 0, 0)}</Text>
          </View>
        </View>
        <Text style={[pdfStyles.sousTitre, { marginTop: 6 }]}>Montants en € HT. PD = paiement direct. Total = marché + avenants.</Text>
        <PiedPagePDF gauche={`Suivi sous-traitants ${annee}`} />
      </Page>
    </Document>
  )
}
