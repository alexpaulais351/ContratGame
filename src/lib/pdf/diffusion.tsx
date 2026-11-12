// PDF « Liste de diffusion » : tableau des contacts groupés par rôle (A4 paysage).
import { Document, Page, Text, View } from '@react-pdf/renderer'
import { EntetePDF, PiedPagePDF, pdfStyles } from './pdf-entete'
import { PDF_COULEURS, formatDateFR } from './format'
import { VINCI } from '@/lib/design-tokens'
import { grouperParRole, nomComplet, type ContactDiffusionDTO } from '@/components/modules/diffusion/contacts'
import type { ProfilSociete } from '@/stores/profil'

const W = ['20%', '15%', '14%', '18%', '10%', '15%', '8%']
const HEADS = ['Organisation', 'Contact', 'Fonction', 'E-mail', 'Téléphone', 'Adresse', 'Diffusion']

function codesDiffusion(c: ContactDiffusionDTO): string {
  return [c.destinataireParDefaut && 'Dest.', c.copieParDefaut && 'Copie', c.diffusionCR && 'Infos'].filter(Boolean).join(' · ')
}

export function ListeDiffusionPDF({ contacts, nomProjet, profil }: { contacts: ContactDiffusionDTO[]; nomProjet: string; profil: ProfilSociete | null }) {
  const groupes = grouperParRole(contacts)
  return (
    <Document title={`Liste de diffusion — ${nomProjet}`}>
      <Page size="A4" orientation="landscape" style={pdfStyles.page}>
        <EntetePDF profil={profil} nomProjet={nomProjet} titreDocument="Liste de diffusion" />
        <Text style={pdfStyles.titre}>Liste de diffusion du chantier</Text>
        <Text style={pdfStyles.sousTitre}>
          {contacts.length} contact(s) · édition du {formatDateFR(new Date())} · Diffusion : Dest. = destinataire par défaut des courriers,
          Copie = copie par défaut, Infos = reçoit les informations et comptes rendus de chantier
        </Text>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.thRow}>
            {HEADS.map((h, i) => <Text key={h} style={[pdfStyles.th, { width: W[i] }]}>{h}</Text>)}
          </View>
          {groupes.map((g) => (
            <View key={g.role}>
              <View style={{ flexDirection: 'row', backgroundColor: VINCI.bleuTresClair, borderBottomWidth: 0.5, borderBottomColor: PDF_COULEURS.bordure }} wrap={false} minPresenceAhead={20}>
                <Text style={[pdfStyles.td, { fontFamily: 'Helvetica-Bold', color: VINCI.bleuFonce }]}>{g.label} ({g.contacts.length})</Text>
              </View>
              {g.contacts.map((c, i) => (
                <View key={c.id} style={[pdfStyles.tr, i % 2 ? pdfStyles.trAlt : {}]} wrap={false}>
                  <Text style={[pdfStyles.td, { width: W[0], fontFamily: 'Helvetica-Bold' }]}>{c.organisation}</Text>
                  <Text style={[pdfStyles.td, { width: W[1] }]}>{nomComplet(c)}</Text>
                  <Text style={[pdfStyles.td, { width: W[2] }]}>{c.fonction ?? ''}</Text>
                  <Text style={[pdfStyles.td, { width: W[3] }]}>{c.email ?? ''}</Text>
                  <Text style={[pdfStyles.td, { width: W[4] }]}>{c.telephone ?? ''}</Text>
                  <Text style={[pdfStyles.td, { width: W[5] }]}>{c.adresse ?? ''}</Text>
                  <Text style={[pdfStyles.td, { width: W[6] }]}>{codesDiffusion(c)}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
        <PiedPagePDF gauche={nomProjet} />
      </Page>
    </Document>
  )
}
