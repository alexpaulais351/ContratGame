import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { PDF_COULEURS, formatDateFR } from './format'
import { libelleModeEnvoi } from '@/lib/courriers-templates'
import type { ProfilSociete } from '@/stores/profil'

export type CourrierPDFData = {
  reference: string
  objet: string
  destinataire: string
  lieu: string
  dateEnvoi: string | null
  modeEnvoi: string
  copies: string
  signataireNom: string
  signataireFonction: string
  expediteur: string
  corps: string
}

const s = StyleSheet.create({
  page: { paddingTop: 0, paddingBottom: 60, paddingHorizontal: 0, fontFamily: 'Helvetica', fontSize: 10.5, color: PDF_COULEURS.noir, lineHeight: 1.4 },
  bande: { backgroundColor: PDF_COULEURS.enTete, height: 10 },
  entete: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 50, paddingTop: 22, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: PDF_COULEURS.bordure },
  logo: { height: 48, maxWidth: 140, objectFit: 'contain', marginBottom: 6 },
  societe: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: PDF_COULEURS.enTete },
  petit: { fontSize: 8.5, color: PDF_COULEURS.texteSecondaire },
  corpsPage: { paddingHorizontal: 50, paddingTop: 24 },
  destWrap: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 20 },
  dest: { width: '48%', fontFamily: 'Helvetica' },
  lieuDate: { textAlign: 'right', marginBottom: 16 },
  meta: { marginBottom: 4, fontSize: 10 },
  objet: { fontFamily: 'Helvetica-Bold', marginTop: 8, marginBottom: 16 },
  signature: { marginTop: 28, alignItems: 'flex-end' },
  copies: { marginTop: 24, fontSize: 9, color: PDF_COULEURS.texteSecondaire },
  pied: { position: 'absolute', bottom: 20, left: 50, right: 50, borderTopWidth: 0.5, borderTopColor: PDF_COULEURS.bordure, paddingTop: 4, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7.5, color: PDF_COULEURS.texteGris },
})

export function CourrierPDF({ courrier: c, profil }: { courrier: CourrierPDFData; profil: ProfilSociete | null; nomProjet?: string }) {
  const dateTxt = c.dateEnvoi ? formatDateFR(c.dateEnvoi) : formatDateFR(new Date())
  const lieuDate = c.lieu ? `${c.lieu}, le ${dateTxt}` : `Le ${dateTxt}`
  const contact = [profil?.telSociete ? `Tél. : ${profil.telSociete}` : '', profil?.faxSociete ? `Fax : ${profil.faxSociete}` : ''].filter(Boolean).join('   ')
  const paragraphes = (c.corps || '').split('\n')
  return (
    <Document title={`Courrier ${c.reference}`}>
      <Page size="A4" style={s.page}>
        <View style={s.bande} fixed />
        <View style={s.entete}>
          <View>
            {profil?.logoSociete ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={profil.logoSociete} style={s.logo} />
            ) : null}
            {profil?.nomSociete ? <Text style={s.societe}>{profil.nomSociete}</Text> : null}
            {profil?.adresseSociete ? <Text style={s.petit}>{profil.adresseSociete}</Text> : null}
            {contact ? <Text style={s.petit}>{contact}</Text> : null}
          </View>
          {profil?.certifications ? (
            <View style={{ maxWidth: 170, alignItems: 'flex-end' }}>
              <Text style={[s.petit, { textAlign: 'right' }]}>{profil.certifications}</Text>
            </View>
          ) : null}
        </View>
        <View style={s.corpsPage}>
          <View style={s.destWrap}>
            <View style={s.dest}>
              {c.destinataire.split('\n').map((l, i) => (
                <Text key={i} style={i === 0 ? { fontFamily: 'Helvetica-Bold' } : undefined}>{l || ' '}</Text>
              ))}
            </View>
          </View>
          <Text style={s.lieuDate}>{lieuDate}</Text>
          {c.reference ? <Text style={s.meta}>Réf. : {c.reference}</Text> : null}
          {c.modeEnvoi ? <Text style={[s.meta, { fontFamily: 'Helvetica-Bold' }]}>{libelleModeEnvoi(c.modeEnvoi) || c.modeEnvoi}</Text> : null}
          <Text style={s.objet}>Objet : {c.objet}</Text>
          {paragraphes.map((p, i) => (
            <Text key={i} style={{ marginBottom: p === '' ? 4 : 2, textAlign: 'justify' }}>{p === '' ? ' ' : p}</Text>
          ))}
          <View style={s.signature} wrap={false}>
            {c.signataireNom ? <Text style={{ fontFamily: 'Helvetica-Bold' }}>{c.signataireNom}</Text> : null}
            {c.signataireFonction ? <Text>{c.signataireFonction}</Text> : null}
          </View>
          {c.copies ? <Text style={s.copies}>Copies : {c.copies}</Text> : null}
        </View>
        <View style={s.pied} fixed>
          <Text>{[profil?.nomSociete, c.reference].filter(Boolean).join(' – ')}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
