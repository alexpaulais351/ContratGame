import { Document, Page, Text, View } from '@react-pdf/renderer'
import { EntetePDF, PiedPagePDF, pdfStyles } from './pdf-entete'
import { formatDateFR, PDF_COULEURS } from './format'
import { VINCI } from '@/lib/design-tokens'
import { CHAMPS_FICHE_ECART, numeroterFicheEcart, type ChampFicheEcart } from '@/components/modules/journal/numerotation'
import type { ProfilSociete } from '@/stores/profil'

export type LigneFicheEcartPDF = { id: string; estChapitre: boolean } & Record<ChampFicheEcart, string>

const LARGEURS: Record<ChampFicheEcart | 'numero', number> = {
  numero: 4,
  etude: 18,
  prevuDCE: 14,
  phaseTransitoire: 14,
  exe: 14,
  impacts: 18,
  delaisImpactes: 9,
  coutImpactes: 9,
}
const TOTAL = Object.values(LARGEURS).reduce((s, w) => s + w, 0)
const pct = (w: number) => `${(w / TOTAL) * 100}%`

/** Fiche écart — A4 paysage, même structure que l'écran (chapitres + 7 colonnes). */
export function FicheEcartPDF({ lignes, profil, nomProjet }: { lignes: LigneFicheEcartPDF[]; profil: ProfilSociete | null; nomProjet: string }) {
  const numeros = numeroterFicheEcart(lignes)
  const nbEcarts = lignes.filter((l) => !l.estChapitre).length
  let alt = 0
  return (
    <Document title={`Fiche écart - ${nomProjet}`}>
      <Page size="A4" orientation="landscape" style={pdfStyles.page}>
        <EntetePDF profil={profil} nomProjet={nomProjet} />
        <Text style={pdfStyles.titre}>Fiche écart</Text>
        <Text style={pdfStyles.sousTitre}>
          {nbEcarts} écart{nbEcarts > 1 ? 's' : ''} — édité le {formatDateFR(new Date())}
        </Text>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.thRow} fixed>
            <Text style={[pdfStyles.th, { width: pct(LARGEURS.numero) }]}>N°</Text>
            {CHAMPS_FICHE_ECART.map((c) => (
              <Text key={c.champ} style={[pdfStyles.th, { width: pct(LARGEURS[c.champ]) }]}>
                {c.libelle}
              </Text>
            ))}
          </View>
          {lignes.map((l) => {
            if (l.estChapitre) {
              alt = 0
              return (
                <View
                  key={l.id}
                  style={[pdfStyles.tr, { backgroundColor: VINCI.bleuTresClair }]}
                  wrap={false}
                  minPresenceAhead={30}
                >
                  <Text style={[pdfStyles.td, { width: pct(LARGEURS.numero), fontFamily: 'Helvetica-Bold', color: VINCI.bleuFonce }]}>{numeros[l.id]}</Text>
                  <Text style={[pdfStyles.td, { width: pct(TOTAL - LARGEURS.numero), fontFamily: 'Helvetica-Bold', color: VINCI.bleuFonce, fontSize: 9 }]}>
                    {(l.etude || 'Chapitre').toUpperCase()}
                  </Text>
                </View>
              )
            }
            const fond = alt++ % 2 === 1 ? pdfStyles.trAlt : {}
            return (
              <View key={l.id} style={[pdfStyles.tr, fond]} wrap={false}>
                <Text style={[pdfStyles.td, { width: pct(LARGEURS.numero), color: PDF_COULEURS.texteSecondaire }]}>{numeros[l.id]}</Text>
                {CHAMPS_FICHE_ECART.map((c) => (
                  <Text
                    key={c.champ}
                    style={[pdfStyles.td, { width: pct(LARGEURS[c.champ]) }, c.champ === 'etude' ? { fontFamily: 'Helvetica-Bold' } : {}]}
                  >
                    {l[c.champ]}
                  </Text>
                ))}
              </View>
            )
          })}
        </View>
        <PiedPagePDF gauche={`Fiche écart — ${nomProjet}`} />
      </Page>
    </Document>
  )
}
