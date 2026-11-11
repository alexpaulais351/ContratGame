import { Image, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { Style } from '@react-pdf/types'
import { PDF_COULEURS } from './format'
import type { ProfilSociete } from '@/stores/profil'

export const pdfStyles = StyleSheet.create({
  page: { paddingTop: 70, paddingBottom: 40, paddingHorizontal: 28, fontFamily: 'Helvetica', fontSize: 9, color: PDF_COULEURS.noir },
  entete: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 52,
    backgroundColor: PDF_COULEURS.enTete, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 28,
  },
  logo: { height: 36, maxWidth: 120, objectFit: 'contain' },
  logoFond: { backgroundColor: PDF_COULEURS.blanc, padding: 3, borderRadius: 2 },
  societe: { color: PDF_COULEURS.blanc, fontSize: 10, fontFamily: 'Helvetica-Bold' },
  droite: { alignItems: 'flex-end' },
  marque: { color: PDF_COULEURS.blanc, fontSize: 14, fontFamily: 'Helvetica-Bold', letterSpacing: 1 },
  projet: { color: PDF_COULEURS.blanc, fontSize: 9 },
  titre: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: PDF_COULEURS.enTete, marginBottom: 8 },
  sousTitre: { fontSize: 9, color: PDF_COULEURS.texteSecondaire, marginBottom: 10 },
  pied: {
    position: 'absolute', bottom: 14, left: 28, right: 28, borderTopWidth: 0.5,
    borderTopColor: PDF_COULEURS.bordure, paddingTop: 4, flexDirection: 'row',
    justifyContent: 'space-between', fontSize: 7, color: PDF_COULEURS.texteGris,
  },
  // Tables
  table: { width: '100%', borderWidth: 0.5, borderColor: PDF_COULEURS.bordure },
  thRow: { flexDirection: 'row', backgroundColor: PDF_COULEURS.enTete },
  th: { color: PDF_COULEURS.blanc, fontFamily: 'Helvetica-Bold', padding: 3, fontSize: 8 },
  tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: PDF_COULEURS.bordure },
  trAlt: { backgroundColor: PDF_COULEURS.ligneAlt },
  td: { padding: 3, fontSize: 8 },
  tfRow: { flexDirection: 'row', backgroundColor: PDF_COULEURS.pied },
  tf: { color: PDF_COULEURS.blanc, fontFamily: 'Helvetica-Bold', padding: 3, fontSize: 8 },
  num: { textAlign: 'right' },
})

type EnteteProps = { profil: ProfilSociete | null; nomProjet: string; style?: Style }

/** Bande #004489 : logo utilisateur à gauche, "CONDUC RAIL" + projet à droite. */
export function EntetePDF({ profil, nomProjet }: EnteteProps) {
  return (
    <View style={pdfStyles.entete} fixed>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {profil?.logoSociete ? (
          <View style={pdfStyles.logoFond}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={profil.logoSociete} style={pdfStyles.logo} />
          </View>
        ) : null}
        {profil?.nomSociete ? <Text style={pdfStyles.societe}>{profil.nomSociete}</Text> : null}
      </View>
      <View style={pdfStyles.droite}>
        <Text style={pdfStyles.marque}>CONDUC RAIL</Text>
        <Text style={pdfStyles.projet}>{nomProjet}</Text>
      </View>
    </View>
  )
}

/** Pied : ligne fine #DCDCDC, "Page X / Y", texte #B5ABA1. */
export function PiedPagePDF({ gauche }: { gauche?: string }) {
  return (
    <View style={pdfStyles.pied} fixed>
      <Text>{gauche ?? ''}</Text>
      <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
    </View>
  )
}
