import { Document, Line, Page, Polygon, Rect, Svg, Text, View } from '@react-pdf/renderer'
import { EntetePDF, PiedPagePDF, pdfStyles } from './pdf-entete'
import { PDF_COULEURS, formatDateFR } from './format'
import { VINCI, VINCI_SECONDAIRE } from '@/lib/design-tokens'
import {
  COULEURS_SCHEMA, polygoneFleche, polygonePentagone, polygonePointe, zoneTexte, type ResultatEtape, type SchemaGeometrie,
  type VarianteDGD,
} from '@/lib/boite-a-outils/dgd'
import { isoVersDateLocale } from '@/lib/boite-a-outils/dates'
import type { ProfilSociete } from '@/stores/profil'

/** Largeur utile d'une page A4 paysage (842 pt − marges 2 × 28). */
const LARGEUR_UTILE = 786

/** Pas de césure automatique (« dé-compte ») dans les boîtes du schéma. */
const sansCesure = (mot: string) => [mot]

const iso = (d: string | null) => (d ? formatDateFR(isoVersDateLocale(d)) : '—')

export function SchemaPDF({ schema, largeur = LARGEUR_UTILE }: { schema: SchemaGeometrie; largeur?: number }) {
  const s = largeur / schema.largeur
  const { axe } = schema
  return (
    <View style={{ position: 'relative', width: schema.largeur * s, height: schema.hauteur * s }}>
      <Svg width={schema.largeur * s} height={schema.hauteur * s} viewBox={`0 0 ${schema.largeur} ${schema.hauteur}`} style={{ position: 'absolute', top: 0, left: 0 }}>
        <Line x1={axe.x1} y1={axe.y - 3} x2={axe.x2} y2={axe.y - 3} stroke={VINCI.noir} strokeWidth={2} />
        <Line x1={axe.x1} y1={axe.y + 3} x2={axe.x2} y2={axe.y + 3} stroke={VINCI.noir} strokeWidth={2} />
        {schema.traits.map((t, i) => (
          <Line key={`t${i}`} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={VINCI.noir} strokeWidth={t.pointille ? 3 : 2.5} strokeDasharray={t.pointille ? '5 5' : undefined} />
        ))}
        {schema.traits.filter((t) => t.pointe).map((t, i) => (
          <Polygon key={`p${i}`} points={polygonePointe(t, 11)} fill={VINCI.noir} />
        ))}
        {schema.fleches.map((f, i) => (
          <Polygon key={`f${i}`} points={polygoneFleche(f)} fill={COULEURS_SCHEMA[f.couleur].fond} />
        ))}
        {schema.boites.map((b) =>
          b.forme === 'pentagone' ? (
            <Polygon key={b.id} points={polygonePentagone(b)} fill={COULEURS_SCHEMA[b.couleur].fond} />
          ) : (
            <Rect key={b.id} x={b.x} y={b.y} width={b.w} height={b.h} rx={12} ry={12} fill={COULEURS_SCHEMA[b.couleur].fond} />
          ),
        )}
      </Svg>
      {schema.fleches.filter((f) => f.label).map((f, i) => (
        <View key={`fl${i}`} style={{ position: 'absolute', left: f.x1 * s, top: (f.y - f.h / 2) * s, width: (f.x2 - f.x1) * s, height: f.h * s, justifyContent: 'center', alignItems: 'center' }}>
          <Text hyphenationCallback={sansCesure} style={{ fontFamily: 'Helvetica-Bold', fontSize: (f.taille ?? 20) * s, color: COULEURS_SCHEMA[f.couleur].texte }}>{f.label}</Text>
        </View>
      ))}
      {schema.boites.map((b) => {
        const z = zoneTexte(b)
        return (
          <View key={`tx-${b.id}`} style={{ position: 'absolute', left: z.x * s, top: z.y * s, width: z.w * s, height: z.h * s, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 * s }}>
            <Text hyphenationCallback={sansCesure} style={{ textAlign: 'center', fontSize: (b.taille ?? 14) * s, lineHeight: 1.25, color: COULEURS_SCHEMA[b.couleur].texte, fontFamily: b.gras ? 'Helvetica-Bold' : 'Helvetica' }}>
              {b.texte}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

/** Bandeau d'avertissement jaune VINCI (#F2AB1B / #FFF7D1). */
export function AlertePDF({ texte }: { texte: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: VINCI_SECONDAIRE.jaune.clair, borderLeftWidth: 4, borderLeftColor: VINCI_SECONDAIRE.jaune.base, borderWidth: 0.5, borderColor: VINCI_SECONDAIRE.jaune.base, padding: 6, marginBottom: 8 }} wrap={false}>
      <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 11, color: VINCI_SECONDAIRE.orange.base, marginRight: 6 }}>!</Text>
      <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: PDF_COULEURS.noir, flex: 1 }}>{texte}</Text>
    </View>
  )
}

type Props = {
  variante: VarianteDGD
  profil: ProfilSociete | null
  depart: string | null
  resultats: ResultatEtape[] | null
  sources: string
}

const COLS = [
  { k: 'etape', titre: 'Étape', w: '34%' },
  { k: 'acteur', titre: 'Acteur', w: '14%' },
  { k: 'delai', titre: 'Délai', w: '11%' },
  { k: 'depart', titre: 'Point de départ', w: '19%' },
  { k: 'article', titre: 'Article', w: '12%' },
  { k: 'date', titre: 'Date calculée', w: '10%' },
] as const

export function ProcedureDGDPDF({ variante: v, profil, depart, resultats, sources }: Props) {
  const parCle = new Map((resultats ?? []).map((r) => [r.cle, r]))
  return (
    <Document title={v.titre}>
      <Page size="A4" orientation="landscape" style={pdfStyles.page}>
        <EntetePDF profil={profil} nomProjet={v.libelle} titreDocument="Procédure de DGD" />
        <Text style={pdfStyles.titre}>{v.titre}</Text>
        <Text style={pdfStyles.sousTitre}>{v.reference}</Text>
        {v.alerte ? <AlertePDF texte={v.alerte} /> : null}
        <SchemaPDF schema={v.schema} />
        <Text style={{ fontSize: 7.5, color: PDF_COULEURS.texteSecondaire, marginTop: 6 }}>{v.avertissement}</Text>
        <PiedPagePDF gauche={v.libelle} />
      </Page>
      <Page size="A4" orientation="landscape" style={pdfStyles.page}>
        <EntetePDF profil={profil} nomProjet={v.libelle} titreDocument="Procédure de DGD" />
        <Text style={pdfStyles.titre}>Récapitulatif des étapes</Text>
        {depart ? (
          <Text style={pdfStyles.sousTitre}>
            {v.departLibelle} : {iso(depart)} — dates limites calculées en jours calendaires, reportées au premier jour ouvrable si elles tombent un samedi, un dimanche ou un jour férié.
          </Text>
        ) : (
          <Text style={pdfStyles.sousTitre}>Saisissez une date de départ dans l’outil pour obtenir les dates limites.</Text>
        )}
        {v.alerte ? <AlertePDF texte={v.alerte} /> : null}
        <View style={pdfStyles.table}>
          <View style={pdfStyles.thRow} fixed>
            {COLS.map((c) => (
              <Text key={c.k} style={[pdfStyles.th, { width: c.w }]}>{c.titre}</Text>
            ))}
          </View>
          {v.etapes.map((e, i) => {
            const r = parCle.get(e.cle)
            const date = r?.date ? `${e.typeDate === 'apartir' ? 'À partir du ' : ''}${iso(r.date)}${r.reelle ? `\n(réel : ${iso(r.reelle)})` : ''}` : '—'
            return (
              <View key={e.cle} style={[pdfStyles.tr, i % 2 === 1 ? pdfStyles.trAlt : {}]} wrap={false}>
                <Text style={[pdfStyles.td, { width: COLS[0].w }]}>{e.etape}{e.note ? `\n${e.note}` : ''}</Text>
                <Text style={[pdfStyles.td, { width: COLS[1].w }]}>{e.acteur}</Text>
                <Text style={[pdfStyles.td, { width: COLS[2].w, fontFamily: 'Helvetica-Bold' }]}>{e.delaiTexte}</Text>
                <Text style={[pdfStyles.td, { width: COLS[3].w }]}>{e.pointDepart}</Text>
                <Text style={[pdfStyles.td, { width: COLS[4].w }]}>{e.article}</Text>
                <Text style={[pdfStyles.td, { width: COLS[5].w, color: r?.depassement ? PDF_COULEURS.rouge : PDF_COULEURS.noir }]}>{date}</Text>
              </View>
            )
          })}
        </View>
        <Text style={{ fontSize: 7, color: PDF_COULEURS.texteSecondaire, marginTop: 8 }}>Sources : {sources}</Text>
        <PiedPagePDF gauche={v.libelle} />
      </Page>
    </Document>
  )
}
