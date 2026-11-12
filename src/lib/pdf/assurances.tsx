import { Document, Page, Text, View } from '@react-pdf/renderer'
import type { Style } from '@react-pdf/types'
import { EntetePDF, PiedPagePDF, pdfStyles } from './pdf-entete'
import { PDF_COULEURS } from './format'
import { VINCI, VINCI_SECONDAIRE } from '@/lib/design-tokens'
import {
  ASSURANCES, FIN_FRISE, JALONS_FRISE, LIBELLE_NATURE, PHASES_FRISE, QUE_FAIRE_SINISTRE, libelleBarre, texteBarre, type Assurance,
} from '@/lib/boite-a-outils/assurances'
import type { ProfilSociete } from '@/stores/profil'

const LARGEUR_LIBELLE = 150
const LARGEUR_FRISE = 786 - LARGEUR_LIBELLE
const x = (v: number) => (v / FIN_FRISE) * LARGEUR_FRISE

function styleBarre(a: Assurance, partiel?: boolean): Style {
  const c = VINCI_SECONDAIRE[a.couleur]
  const opacity = partiel ? 0.5 : 1
  if (a.nature === 'obligatoire') return { backgroundColor: c.base, borderWidth: 1.2, borderColor: c.base, opacity }
  if (a.nature === 'facultative') return { backgroundColor: c.clair, borderWidth: 1.2, borderColor: c.base, borderStyle: 'dashed', opacity }
  // Garantie légale : fond clair + double bordure (hachures non disponibles)
  return { backgroundColor: c.clair, borderWidth: 2.5, borderColor: c.base, opacity }
}


function FrisePDF() {
  return (
    <View>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: LARGEUR_LIBELLE }} />
        <View style={{ width: LARGEUR_FRISE, height: 20, position: 'relative' }}>
          {PHASES_FRISE.map((p, i) => (
            <View key={p.libelle} style={{ position: 'absolute', left: x(p.de), width: x(p.a - p.de), height: 20, backgroundColor: i < 2 ? VINCI.bleu : VINCI.bleuFonce, justifyContent: 'center', borderRightWidth: 1, borderRightColor: VINCI.blanc }}>
              <Text style={{ color: VINCI.blanc, fontSize: 7.5, fontFamily: 'Helvetica-Bold', textAlign: 'center' }}>{p.libelle}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={{ position: 'relative' }}>
        {ASSURANCES.map((a, i) => (
          <View key={a.cle} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: i % 2 ? PDF_COULEURS.ligneAlt : PDF_COULEURS.blanc }}>
            <Text style={{ width: LARGEUR_LIBELLE, fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: VINCI.bleu, paddingHorizontal: 4, paddingVertical: 3 }}>
              {a.sigle ? `${a.sigle} — ` : ''}{a.nom}
            </Text>
            <View style={{ width: LARGEUR_FRISE, height: 20, position: 'relative' }}>
              {a.segments.map((s, k) => (
                <View key={k} style={[{ position: 'absolute', top: 3, height: 14, left: x(s.de), width: x(s.a - s.de), borderRadius: 2, justifyContent: 'center', paddingHorizontal: 3 }, styleBarre(a, s.partiel)]}>
                  <Text style={{ fontSize: 6.5, color: texteBarre(a), fontFamily: 'Helvetica-Bold' }}>{s.note ?? libelleBarre(a)}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
        {JALONS_FRISE.map((j) => (
          <View key={j.libelle} style={{ position: 'absolute', top: 0, bottom: 0, left: LARGEUR_LIBELLE + x(j.x), borderLeftWidth: j.libelle === 'Réception' ? 2 : 0.5, borderLeftColor: j.libelle === 'Réception' ? VINCI.rouge : VINCI.gris }} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', height: 12 }}>
        <View style={{ width: LARGEUR_LIBELLE }} />
        <View style={{ width: LARGEUR_FRISE, position: 'relative' }}>
          {JALONS_FRISE.map((j) => (
            <Text key={j.libelle} style={{ position: 'absolute', left: Math.min(x(j.x) - 20, LARGEUR_FRISE - 42), width: 42, textAlign: 'center', top: 2, fontSize: 6.5, color: j.libelle === 'Réception' ? VINCI.rouge : PDF_COULEURS.texteSecondaire, fontFamily: j.libelle === 'Réception' ? 'Helvetica-Bold' : 'Helvetica' }}>
              {j.libelle}
            </Text>
          ))}
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 14, marginTop: 6 }}>
        {(['obligatoire', 'facultative', 'garantie_legale'] as const).map((n) => (
          <View key={n} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={[{ width: 18, height: 8, borderRadius: 1 }, styleBarre({ ...ASSURANCES[0], nature: n, couleur: 'bleuMoyen' })]} />
            <Text style={{ fontSize: 7 }}>{LIBELLE_NATURE[n]}</Text>
          </View>
        ))}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={[{ width: 18, height: 8, borderRadius: 1 }, styleBarre({ ...ASSURANCES[0], nature: 'obligatoire', couleur: 'bleuMoyen' }, true)]} />
          <Text style={{ fontSize: 7 }}>Couverture conditionnelle / selon contrat</Text>
        </View>
      </View>
    </View>
  )
}

const COLS = [
  { titre: 'Assurance / garantie', w: '15%' },
  { titre: 'Obligatoire ?', w: '17%' },
  { titre: 'Souscripteur', w: '11%' },
  { titre: 'Objet', w: '19%' },
  { titre: 'Période', w: '12%' },
  { titre: 'Références', w: '12%' },
  { titre: 'Points d’attention', w: '14%' },
] as const

export function AssurancesPDF({ profil, sources }: { profil: ProfilSociete | null; sources: string }) {
  return (
    <Document title="Assurances et garanties d’un chantier">
      <Page size="A4" orientation="landscape" style={pdfStyles.page}>
        <EntetePDF profil={profil} nomProjet="Boîte à outils" titreDocument="Assurances de chantier" />
        <Text style={pdfStyles.titre}>Assurances et garanties d’un chantier</Text>
        <Text style={pdfStyles.sousTitre}>Avant, pendant et après la réception — échelle non proportionnelle au temps. Vérifier l’article « Assurances » du CCAP.</Text>
        <FrisePDF />
        <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: VINCI.bleu, marginTop: 12, marginBottom: 4 }}>Que faire en cas de sinistre ?</Text>
        <View style={{ flexDirection: 'row', gap: 8 }} wrap={false}>
          {QUE_FAIRE_SINISTRE.map((p) => (
            <View key={p.phase} style={{ flex: 1, borderWidth: 0.5, borderColor: PDF_COULEURS.bordure, borderTopWidth: 3, borderTopColor: VINCI_SECONDAIRE[p.couleur].base, padding: 5 }}>
              <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 3 }}>{p.phase}</Text>
              {p.etapes.map((e, i) => (
                <Text key={e} style={{ fontSize: 7, marginBottom: 1.5 }}>{i + 1}. {e}</Text>
              ))}
            </View>
          ))}
        </View>
        <PiedPagePDF gauche="Assurances de chantier" />
      </Page>
      <Page size="A4" orientation="landscape" style={pdfStyles.page}>
        <EntetePDF profil={profil} nomProjet="Boîte à outils" titreDocument="Assurances de chantier" />
        <Text style={pdfStyles.titre}>Fiches par assurance</Text>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.thRow} fixed>
            {COLS.map((c) => (
              <Text key={c.titre} style={[pdfStyles.th, { width: c.w }]}>{c.titre}</Text>
            ))}
          </View>
          {ASSURANCES.map((a, i) => (
            <View key={a.cle} style={[pdfStyles.tr, i % 2 === 1 ? pdfStyles.trAlt : {}]} wrap={false}>
              <View style={[pdfStyles.td, { width: COLS[0].w }]}>
                <Text style={{ fontFamily: 'Helvetica-Bold', color: VINCI.bleu, fontSize: 7.5 }}>{a.sigle ? `${a.sigle} — ` : ''}{a.nom}</Text>
                <Text style={{ fontSize: 6.5, color: a.nature === 'obligatoire' ? VINCI.rouge : PDF_COULEURS.texteSecondaire, marginTop: 2 }}>{LIBELLE_NATURE[a.nature]}</Text>
              </View>
              <Text style={[pdfStyles.td, { width: COLS[1].w, fontSize: 7 }]}>{a.obligatoire}</Text>
              <Text style={[pdfStyles.td, { width: COLS[2].w, fontSize: 7 }]}>{a.souscripteur}</Text>
              <Text style={[pdfStyles.td, { width: COLS[3].w, fontSize: 7 }]}>{a.objet}</Text>
              <Text style={[pdfStyles.td, { width: COLS[4].w, fontSize: 7 }]}>{a.periode}</Text>
              <Text style={[pdfStyles.td, { width: COLS[5].w, fontSize: 7 }]}>{a.references}</Text>
              <Text style={[pdfStyles.td, { width: COLS[6].w, fontSize: 7 }]}>{a.attention.map((t) => `• ${t}`).join('\n')}{a.aVerifier ? `\nÀ vérifier : ${a.aVerifier}` : ''}</Text>
            </View>
          ))}
        </View>
        <Text style={{ fontSize: 7, color: PDF_COULEURS.texteSecondaire, marginTop: 8 }}>Sources : {sources}</Text>
        <PiedPagePDF gauche="Assurances de chantier" />
      </Page>
    </Document>
  )
}
