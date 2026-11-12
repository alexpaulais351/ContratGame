import { Document, Page, Text, View } from '@react-pdf/renderer'
import { EntetePDF, PiedPagePDF, pdfStyles } from './pdf-entete'
import { PDF_COULEURS, formatDateFR } from './format'
import { AlertePDF } from './procedure-dgd'
import { VINCI, VINCI_SECONDAIRE } from '@/lib/design-tokens'
import {
  AVERTISSEMENT_AIDE, MOMENTS, PROBLEMES, ROLES, TYPES_OUVRAGE, type Recommandation, type Situation,
} from '@/lib/assurances/aide-decision'
import { LIBELLE_NATURE } from '@/lib/boite-a-outils/assurances'
import { DATE_MAJ } from '@/lib/boite-a-outils/sources'
import { isoVersDateLocale } from '@/lib/boite-a-outils/dates'
import type { ProfilSociete } from '@/stores/profil'

const lib = <T extends { cle: string; libelle: string }>(liste: T[], cle: string) => liste.find((x) => x.cle === cle)?.libelle ?? cle
const SOUS = { oui: 'Oui', non: 'Non', inconnu: 'Non précisé' } as const

const titreSection = { fontSize: 10, fontFamily: 'Helvetica-Bold', color: VINCI.bleu, marginTop: 10, marginBottom: 4 } as const
const texte = { fontSize: 8.5, marginBottom: 2, lineHeight: 1.35 } as const

export function FicheAideDecisionPDF({ situation: s, reco: r, profil }: { situation: Situation; reco: Recommandation; profil: ProfilSociete | null }) {
  return (
    <Document title={`Fiche assurance — ${r.titre}`}>
      <Page size="A4" style={pdfStyles.page}>
        <EntetePDF profil={profil} nomProjet="Boîte à outils — Assurances" titreDocument="Fiche d’aide à la décision" />
        <Text style={pdfStyles.titre}>{r.titre}</Text>
        <View style={{ borderWidth: 0.5, borderColor: PDF_COULEURS.bordure, backgroundColor: PDF_COULEURS.ligneAlt, padding: 6, marginBottom: 8 }}>
          <Text style={texte}>Problématique : {lib(PROBLEMES, s.probleme)}</Text>
          <Text style={texte}>Moment : {lib(MOMENTS, s.moment)}</Text>
          <Text style={texte}>Rôle : {lib(ROLES, s.role)} · Ouvrage : {lib(TYPES_OUVRAGE, s.ouvrage)}</Text>
          <Text style={texte}>DO souscrite : {SOUS[s.doSouscrite]} · TRC souscrite : {SOUS[s.trcSouscrite]}</Text>
        </View>

        {r.alertes.map((a) => <AlertePDF key={a} texte={a} />)}

        <Text style={titreSection}>Garanties / assurances mobilisables</Text>
        {r.garanties.map((g, i) => (
          <View key={g.cle} wrap={false} style={{ borderWidth: 0.5, borderColor: g.principale ? VINCI.bleu : PDF_COULEURS.bordure, backgroundColor: g.principale ? VINCI.bleuTresClair : PDF_COULEURS.blanc, padding: 5, marginBottom: 4 }}>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: VINCI.bleuFonce }}>
              {i + 1}. {g.libelle}{g.principale ? '  — en priorité' : ''}
            </Text>
            <Text style={{ fontSize: 7, color: g.nature === 'obligatoire' ? VINCI.rouge : PDF_COULEURS.texteSecondaire, marginVertical: 1 }}>
              {g.nature === 'responsabilite' ? 'Responsabilité (sans assurance dédiée)' : LIBELLE_NATURE[g.nature]}
            </Text>
            <Text style={texte}>{g.commentaire}</Text>
          </View>
        ))}

        {r.pourquoi.length > 0 && <Text style={titreSection}>Pourquoi ?</Text>}
        {r.pourquoi.map((t) => <Text key={t} style={texte}>• {t}</Text>)}

        {r.quiContreQui.length > 0 && <Text style={titreSection}>Qui agit, contre qui ?</Text>}
        {r.quiContreQui.map((q) => (
          <Text key={q.qui + q.contre} style={texte}>
            • <Text style={{ fontFamily: 'Helvetica-Bold' }}>{q.qui}</Text> contre <Text style={{ fontFamily: 'Helvetica-Bold' }}>{q.contre}</Text> — {q.comment}
          </Text>
        ))}

        <Text style={titreSection}>Étapes à suivre</Text>
        {r.etapes.map((e, i) => (
          <View key={e.texte} wrap={false} style={{ flexDirection: 'row', marginBottom: 3 }}>
            <Text style={{ width: 14, fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: VINCI.rouge }}>{i + 1}.</Text>
            <View style={{ flex: 1 }}>
              <Text style={texte}>{e.texte}</Text>
              {(e.delai || e.source || e.aVerifier) && (
                <Text style={{ fontSize: 7.5, color: PDF_COULEURS.texteSecondaire }}>
                  {e.delai ? `Délai : ${e.delai}` : ''}{e.delai && e.source ? ' · ' : ''}{e.source ?? ''}{e.aVerifier ? ' · à vérifier' : ''}
                </Text>
              )}
            </View>
          </View>
        ))}

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={titreSection}>Documents à réunir</Text>
            {r.documents.map((d) => <Text key={d} style={texte}>• {d}</Text>)}
          </View>
          {r.pieges.length > 0 && (
            <View style={{ flex: 1 }}>
              <Text style={[titreSection, { color: VINCI.rouge }]}>Pièges fréquents</Text>
              {r.pieges.map((d) => <Text key={d} style={texte}>• {d}</Text>)}
            </View>
          )}
        </View>

        {r.courriers.length > 0 && (
          <Text style={[texte, { marginTop: 8 }]}>
            Modèles de courriers utiles (Boîte à outils) : {r.courriers.map((c) => c.libelle).join(' ; ')}
          </Text>
        )}

        <View style={{ marginTop: 10, borderTopWidth: 0.5, borderTopColor: VINCI_SECONDAIRE.jaune.base, paddingTop: 4 }}>
          <Text style={{ fontSize: 7.5, color: PDF_COULEURS.texteSecondaire }}>{AVERTISSEMENT_AIDE}</Text>
          <Text style={{ fontSize: 7, color: PDF_COULEURS.texteSecondaire, marginTop: 2 }}>
            Textes en vigueur : Code civil, Code des assurances, CCAG Travaux 2021 (version consolidée), CCP. Contenu à jour au {formatDateFR(isoVersDateLocale(DATE_MAJ))}.
          </Text>
        </View>
        <PiedPagePDF gauche="Fiche d’aide à la décision — assurances" />
      </Page>
    </Document>
  )
}
