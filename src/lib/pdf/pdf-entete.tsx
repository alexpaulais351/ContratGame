import { Image, Path, Rect, StyleSheet, Svg, Text, View } from '@react-pdf/renderer'
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
  marque: { color: PDF_COULEURS.blanc, fontSize: 13, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  projet: { color: PDF_COULEURS.blanc, fontSize: 8.5, textAlign: 'right', marginTop: 2 },
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

type EnteteProps = { profil: ProfilSociete | null; nomProjet: string; titreDocument: string; style?: Style }

/** Bande #004489 : logo du profil utilisateur à gauche (à défaut, nom de société), titre du document + projet à droite. */
export function EntetePDF({ profil, nomProjet, titreDocument }: EnteteProps) {
  return (
    <View style={pdfStyles.entete} fixed>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {profil?.logoSociete ? (
          <View style={pdfStyles.logoFond}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={profil.logoSociete} style={pdfStyles.logo} />
          </View>
        ) : profil?.nomSociete ? (
          <Text style={pdfStyles.societe}>{profil.nomSociete}</Text>
        ) : null}
      </View>
      <View style={[pdfStyles.droite, { maxWidth: '55%' }]}>
        <Text style={pdfStyles.marque}>{titreDocument}</Text>
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
        <Text>Contrat Game · by</Text>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={urlEbgc()} style={{ height: 9, width: 25.4 }} />
      </View>
      <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
    </View>
  )
}

/** Logo Contrat Game vectoriel (document + coche), bordé de blanc pour la bande bleue. */
export function LogoPDF({ size = 30 }: { size?: number }) {
  const B = PDF_COULEURS.enTete
  const W = PDF_COULEURS.blanc
  return (
    <Svg viewBox="-4 -4 128 128" width={size} height={size}>
      <Rect x={-4} y={-4} width={128} height={128} rx={28} fill={W} />
      <Rect width={120} height={120} rx={24} fill={B} />
      <Path d="M25.7 55.4 L66.6 23.4 L81.4 42.3 L40.4 74.3 Z M19.9 56.1 L27.0 50.6 L45.4 74.2 L38.3 79.8 Z M61.6 23.5 L68.7 17.9 L87.2 41.6 L80.1 47.1 Z M57.8 60.8 L64.1 55.8 L91.2 90.5 L84.9 95.4 Z" fill={W} />
      <Rect x={58} y={88} width={46} height={12} rx={3} fill={PDF_COULEURS.rouge} />
    </Svg>
  )
}

/** URL absolue du logo EBGC couleur (react-pdf la charge côté navigateur). */
function urlEbgc(): string {
  const origine = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origine}/ebgc-couleur.png`
}
