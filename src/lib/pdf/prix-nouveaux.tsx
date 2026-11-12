import { Document, Page, Text, View } from '@react-pdf/renderer'
import { EntetePDF, PiedPagePDF, pdfStyles } from './pdf-entete'
import { formatDateFR, formatMontant, PDF_COULEURS } from './format'
import type { ProfilSociete } from '@/stores/profil'

export type PrixNouveauPDF = {
  numero: string
  intitule: string
  dateDevis: string
  montantPresente: number
  potentielAcceptation: number
  montantAccepte: number | null
  debourseReel: number | null
  numeroOS: string
  dateOS: string
  delaiSupplementaire: string
  statutLabel: string
  commentaire: string
}

const COLS = [
  { k: 'numero', t: 'N° devis', w: 6 },
  { k: 'intitule', t: 'Intitulé', w: 17 },
  { k: 'dateDevis', t: 'Date devis', w: 7 },
  { k: 'presente', t: 'Présenté', w: 9, num: true },
  { k: 'potentiel', t: 'Pot.', w: 4.5, num: true },
  { k: 'pondere', t: 'Pondéré', w: 9, num: true },
  { k: 'accepte', t: 'Accepté', w: 9, num: true },
  { k: 'debourse', t: 'Déboursé', w: 9, num: true },
  { k: 'marge', t: 'Marge', w: 8, num: true },
  { k: 'os', t: 'N° OS', w: 5.5 },
  { k: 'dateOS', t: 'Date OS', w: 7 },
  { k: 'delai', t: 'Délai', w: 5.5 },
  { k: 'statut', t: 'Statut', w: 6.5 },
  { k: 'commentaire', t: 'Commentaire', w: 14 },
] as const

const TOTAL_W = COLS.reduce((s, c) => s + c.w, 0)
const pct = (w: number) => `${(w / TOTAL_W) * 100}%`

export function PrixNouveauxPDF({
  lignes,
  profil,
  nomProjet,
}: {
  lignes: PrixNouveauPDF[]
  profil: ProfilSociete | null
  nomProjet: string
}) {
  const pond = (l: PrixNouveauPDF) => (l.montantPresente * l.potentielAcceptation) / 100
  const tot = lignes.reduce(
    (t, l) => ({
      p: t.p + l.montantPresente,
      w: t.w + pond(l),
      a: t.a + (l.montantAccepte ?? 0),
      d: t.d + (l.debourseReel ?? 0),
    }),
    { p: 0, w: 0, a: 0, d: 0 },
  )
  const cellule = (l: PrixNouveauPDF): Record<string, string> => ({
    numero: l.numero,
    intitule: l.intitule,
    dateDevis: formatDateFR(l.dateDevis),
    presente: formatMontant(l.montantPresente),
    potentiel: `${l.potentielAcceptation} %`,
    pondere: formatMontant(pond(l)),
    accepte: l.montantAccepte != null ? formatMontant(l.montantAccepte) : '',
    debourse: l.debourseReel != null ? formatMontant(l.debourseReel) : '',
    marge: l.montantAccepte != null && l.debourseReel != null ? formatMontant(l.montantAccepte - l.debourseReel) : '',
    os: l.numeroOS,
    dateOS: formatDateFR(l.dateOS),
    delai: l.delaiSupplementaire,
    statut: l.statutLabel,
    commentaire: l.commentaire,
  })
  const totauxMap: Record<string, string> = {
    numero: 'TOTAUX',
    presente: formatMontant(tot.p),
    pondere: formatMontant(tot.w),
    accepte: formatMontant(tot.a),
    debourse: formatMontant(tot.d),
  }
  return (
    <Document title={`Prix nouveaux - ${nomProjet}`}>
      <Page size="A4" orientation="landscape" style={pdfStyles.page}>
        <EntetePDF profil={profil} nomProjet={nomProjet} titreDocument="Prix nouveaux" />
        <Text style={pdfStyles.titre}>Suivi des prix nouveaux</Text>
        <Text style={pdfStyles.sousTitre}>
          {lignes.length} prix nouveau{lignes.length > 1 ? 'x' : ''} — édité le {formatDateFR(new Date())}
        </Text>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.thRow} fixed>
            {COLS.map((c) => (
              <Text key={c.k} style={[pdfStyles.th, { width: pct(c.w) }, 'num' in c ? pdfStyles.num : {}]}>
                {c.t}
              </Text>
            ))}
          </View>
          {lignes.map((l, i) => {
            const v = cellule(l)
            return (
              <View key={i} style={[pdfStyles.tr, i % 2 === 1 ? pdfStyles.trAlt : {}]} wrap={false}>
                {COLS.map((c) => (
                  <Text key={c.k} style={[pdfStyles.td, { width: pct(c.w) }, 'num' in c ? pdfStyles.num : {}]}>
                    {v[c.k]}
                  </Text>
                ))}
              </View>
            )
          })}
          <View style={pdfStyles.tfRow} wrap={false}>
            {COLS.map((c) => (
              <Text key={c.k} style={[pdfStyles.tf, { width: pct(c.w) }, 'num' in c ? pdfStyles.num : {}]}>
                {totauxMap[c.k] ?? ''}
              </Text>
            ))}
          </View>
        </View>
        <PiedPagePDF gauche={`Prix nouveaux — ${nomProjet}`} />
      </Page>
    </Document>
  )
}

export { PDF_COULEURS }
