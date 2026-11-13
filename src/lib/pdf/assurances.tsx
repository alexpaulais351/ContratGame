import { Document, Page, Text, View } from '@react-pdf/renderer'
import type { Style } from '@react-pdf/types'
import { EntetePDF, PiedPagePDF, pdfStyles } from './pdf-entete'
import { PDF_COULEURS } from './format'
import { VINCI, VINCI_SECONDAIRE } from '@/lib/design-tokens'
import * as D from '@/lib/boite-a-outils/assurances'
import { libelleBarre, texteBarre, type Assurance, type CategorieAssurance, type Reflexe } from '@/lib/boite-a-outils/assurances'
import type { ProfilSociete } from '@/stores/profil'

/**
 * La police Helvetica intégrée (jeu WinAnsi) ne contient ni « ≤ », ni « ≥ », ni « → » : ils sont remplacés
 * par des équivalents en toutes lettres avant le rendu PDF.
 */
export function pdfSur<T>(v: T): T {
  if (typeof v === 'string')
    return v.replace(/≤\s?/g, 'au plus ').replace(/≥\s?/g, 'au moins ').replace(/\s?→\s?/g, ' : ') as T
  if (Array.isArray(v)) return v.map(pdfSur) as T
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, pdfSur(x)])) as T
  return v
}

const ASSURANCES = pdfSur(D.ASSURANCES)
const ASSURANCES_FRISE = pdfSur(D.ASSURANCES_FRISE)
const BONS_REFLEXES = pdfSur(D.BONS_REFLEXES)
const OUVRAGES_NON_SOUMIS = pdfSur(D.OUVRAGES_NON_SOUMIS)
const PROCEDURE_DO = pdfSur(D.PROCEDURE_DO)
const QUE_FAIRE_SINISTRE = pdfSur(D.QUE_FAIRE_SINISTRE)
const REGLES_GROUPE_SINISTRE = pdfSur(D.REGLES_GROUPE_SINISTRE)
const VERIF_ATTESTATION_ST = pdfSur(D.VERIF_ATTESTATION_ST)
const { FIN_FRISE, JALONS_FRISE, LIBELLE_CATEGORIE, LIBELLE_NATURE, PHASES_FRISE, SOURCE_GUIDE } = D

const LARGEUR_LIBELLE = 165
const LARGEUR_FRISE = 786 - LARGEUR_LIBELLE
const x = (v: number) => (v / FIN_FRISE) * LARGEUR_FRISE
const TITRE_DOC = 'Assurances de chantier'
const NOM_PROJET = 'Assurances'

function styleBarre(a: Pick<Assurance, 'nature' | 'couleur'>, partiel?: boolean): Style {
  const c = VINCI_SECONDAIRE[a.couleur]
  const opacity = partiel ? 0.5 : 1
  if (a.nature === 'obligatoire') return { backgroundColor: c.base, borderWidth: 1.2, borderColor: c.base, opacity }
  if (a.nature === 'facultative') return { backgroundColor: c.clair, borderWidth: 1.2, borderColor: c.base, borderStyle: 'dashed', opacity }
  // Garantie légale : fond clair + double bordure (hachures non disponibles)
  return { backgroundColor: c.clair, borderWidth: 2.5, borderColor: c.base, opacity }
}

const titreSection: Style = { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: VINCI.bleu, marginTop: 8, marginBottom: 4 }
const petit: Style = { fontSize: 7, lineHeight: 1.3 }
const gras: Style = { fontFamily: 'Helvetica-Bold' }

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
        {ASSURANCES_FRISE.map((a, i) => (
          <View key={a.cle} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: i % 2 ? PDF_COULEURS.ligneAlt : PDF_COULEURS.blanc }}>
            <Text style={{ width: LARGEUR_LIBELLE, fontSize: 7, fontFamily: 'Helvetica-Bold', color: VINCI.bleu, paddingHorizontal: 4, paddingVertical: 2 }}>
              {a.sigle ? `${a.sigle} — ` : ''}{a.nom}
            </Text>
            <View style={{ width: LARGEUR_FRISE, height: 19, position: 'relative' }}>
              {a.segments.map((s, k) => (
                <View key={k} style={[{ position: 'absolute', top: 3, height: 13, left: x(s.de), width: x(s.a - s.de), borderRadius: 2, justifyContent: 'center', paddingHorizontal: 3 }, styleBarre(a, s.partiel)]}>
                  <Text style={{ fontSize: 6.3, color: texteBarre(a), fontFamily: 'Helvetica-Bold' }}>{s.note ?? libelleBarre(a)}</Text>
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
            <View style={[{ width: 18, height: 8, borderRadius: 1 }, styleBarre({ nature: n, couleur: 'bleuMoyen' })]} />
            <Text style={{ fontSize: 7 }}>{LIBELLE_NATURE[n]}</Text>
          </View>
        ))}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={[{ width: 18, height: 8, borderRadius: 1 }, styleBarre({ nature: 'obligatoire', couleur: 'bleuMoyen' }, true)]} />
          <Text style={{ fontSize: 7 }}>Couverture conditionnelle / selon contrat</Text>
        </View>
      </View>
      <Text style={{ fontSize: 6.8, color: PDF_COULEURS.texteSecondaire, marginTop: 4 }}>
        Automobile, drone et cyber : sans lien avec une phase du chantier, voir les fiches.
      </Text>
    </View>
  )
}

function Puces({ items, couleur, signe = '•' }: { items: string[]; couleur?: string; signe?: string }) {
  return (
    <View>
      {items.map((t) => (
        <View key={t} style={{ flexDirection: 'row', marginBottom: 1.2 }}>
          <Text style={[petit, { width: 8, color: couleur ?? PDF_COULEURS.noir, fontFamily: 'Helvetica-Bold' }]}>{signe}</Text>
          <Text style={[petit, { flex: 1 }]}>{t}</Text>
        </View>
      ))}
    </View>
  )
}

function SinistresPDF() {
  return (
    <View>
      <View style={{ borderLeftWidth: 3, borderLeftColor: VINCI.rouge, backgroundColor: VINCI.rougeTresClair, padding: 5, marginBottom: 6 }} wrap={false}>
        <Text style={[petit, gras, { color: VINCI.rouge, fontSize: 8, marginBottom: 2 }]}>Règles groupe de déclaration</Text>
        <Puces items={REGLES_GROUPE_SINISTRE} couleur={VINCI.rouge} />
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }} wrap={false}>
        {QUE_FAIRE_SINISTRE.map((p) => (
          <View key={p.phase} style={{ flex: 1, borderWidth: 0.5, borderColor: PDF_COULEURS.bordure, borderTopWidth: 3, borderTopColor: VINCI_SECONDAIRE[p.couleur].base, padding: 5 }}>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 3 }}>{p.phase}</Text>
            {p.etapes.map((e, i) => (
              <Text key={e} style={[petit, { marginBottom: 1.5 }]}>{i + 1}. {e}</Text>
            ))}
          </View>
        ))}
      </View>
      <Text style={titreSection}>Instruction d’un sinistre dommages-ouvrage — délais légaux (C. assur. art. L242-1 et annexe II à l’art. A243-1)</Text>
      <View style={{ flexDirection: 'row', gap: 4 }} wrap={false}>
        {PROCEDURE_DO.map((e) => (
          <View key={e.jalon} style={{ flex: 1, borderWidth: 0.5, borderColor: PDF_COULEURS.bordure, padding: 4 }}>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: e.jalon === 'J + 60' ? VINCI.rouge : VINCI.bleu }}>{e.jalon}</Text>
            <Text style={[petit, gras]}>{e.titre}</Text>
            <Text style={petit}>{e.texte}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

function ReflexePDF({ r, n }: { r: Reflexe; n: number }) {
  const c = VINCI_SECONDAIRE[r.couleur]
  return (
    <View style={{ width: '32.6%', borderWidth: 0.5, borderColor: PDF_COULEURS.bordure, marginBottom: 5 }} wrap={false}>
      <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', backgroundColor: c.clair, borderBottomWidth: 2, borderBottomColor: c.base, paddingHorizontal: 4, paddingVertical: 2.5 }}>
        {n}. {r.theme.toUpperCase()}
      </Text>
      <View style={{ padding: 4 }}>
        <Text style={petit}><Text style={gras}>SI : </Text>{r.si}</Text>
        <Text style={[petit, { marginTop: 2, backgroundColor: VINCI.bleuTresClair, color: VINCI.bleuFonce, padding: 2 }]}><Text style={gras}>ALORS : </Text>{r.alors}</Text>
      </View>
      <Text style={[petit, { borderLeftWidth: 3, borderLeftColor: VINCI.rouge, backgroundColor: VINCI.rougeTresClair, padding: 3 }]}>
        <Text style={[gras, { color: VINCI.rouge }]}>Sanction : </Text>{r.sanction}
      </Text>
    </View>
  )
}

function BonsReflexesPDF() {
  return (
    <View>
      {BONS_REFLEXES.map((b) => (
        <View key={b.cle}>
          <Text style={titreSection}>{b.titre} — {b.principe.toLowerCase()} ({b.definition.toLowerCase()})</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
            {b.reflexes.map((r, i) => <ReflexePDF key={r.theme + i} r={r} n={i + 1} />)}
          </View>
        </View>
      ))}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }} wrap={false}>
        <View style={{ flex: 1, borderWidth: 0.5, borderColor: PDF_COULEURS.bordure, padding: 5 }}>
          <Text style={[petit, gras, { fontSize: 8, color: VINCI.bleuFonce, marginBottom: 2 }]}>Ouvrages non soumis — liste légale (C. assur. art. L243-1-1)</Text>
          <Text style={[petit, gras]}>Toujours non soumis :</Text>
          <Puces items={[...OUVRAGES_NON_SOUMIS.toujours]} />
          <Text style={[petit, gras, { marginTop: 2 }]}>Non soumis, sauf accessoires à un ouvrage soumis :</Text>
          <Puces items={[...OUVRAGES_NON_SOUMIS.saufAccessoire]} />
          <Text style={[petit, { marginTop: 2, color: PDF_COULEURS.texteSecondaire }]}>{OUVRAGES_NON_SOUMIS.existants}</Text>
        </View>
        <View style={{ flex: 1, borderWidth: 0.5, borderColor: PDF_COULEURS.bordure, padding: 5 }}>
          <Text style={[petit, gras, { fontSize: 8, color: VINCI.bleuFonce, marginBottom: 2 }]}>Attestation décennale d’un sous-traitant : 10 points à vérifier</Text>
          {VERIF_ATTESTATION_ST.map((t, i) => (
            <Text key={t} style={[petit, { marginBottom: 1 }]}><Text style={[gras, { color: VINCI.bleu }]}>{i + 1}. </Text>{t}</Text>
          ))}
        </View>
      </View>
    </View>
  )
}

function FichePDF({ a }: { a: Assurance }) {
  const c = VINCI_SECONDAIRE[a.couleur]
  const infos: [string, string][] = [
    ['Obligatoire ?', a.obligatoire], ['Souscripteur', a.souscripteur], ['Bénéficiaire', a.beneficiaire], ['Objet', a.objet],
    ['Déclenchement', a.declenchement], ['Période', a.periode], ['Références', a.references],
  ]
  return (
    <View style={{ borderWidth: 0.5, borderColor: PDF_COULEURS.bordure, borderTopWidth: 3, borderTopColor: c.base, marginBottom: 6 }} wrap={false}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 5, paddingVertical: 3, backgroundColor: PDF_COULEURS.ligneAlt }}>
        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: VINCI.bleu }}>{a.sigle ? `${a.sigle} — ` : ''}{a.nom}</Text>
        <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: a.nature === 'obligatoire' ? VINCI.rouge : PDF_COULEURS.texteSecondaire }}>{LIBELLE_NATURE[a.nature].toUpperCase()}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 6, padding: 5 }}>
        <View style={{ flex: 1.1 }}>
          {infos.map(([k, v]) => (
            <Text key={k} style={[petit, { marginBottom: 1.5 }]}><Text style={[gras, { color: PDF_COULEURS.texteSecondaire }]}>{k} : </Text>{v}</Text>
          ))}
        </View>
        <View style={{ flex: 1 }}>
          {a.garantit && a.garantit.length > 0 && (
            <>
              <Text style={[petit, gras, { color: VINCI_SECONDAIRE.vert.base }]}>Ce que l’assureur garantit</Text>
              <Puces items={a.garantit} couleur={VINCI_SECONDAIRE.vert.base} signe="+" />
            </>
          )}
          {a.neGarantitPas && a.neGarantitPas.length > 0 && (
            <>
              <Text style={[petit, gras, { color: VINCI.rouge, marginTop: 2 }]}>Ce que l’assureur ne garantit pas</Text>
              <Puces items={a.neGarantitPas} couleur={VINCI.rouge} signe="–" />
            </>
          )}
          {a.attention.length > 0 && (
            <>
              <Text style={[petit, gras, { color: VINCI.bleuFonce, marginTop: 2 }]}>Points d’attention</Text>
              <Puces items={a.attention} />
            </>
          )}
        </View>
        {(a.programme?.length || a.regleGroupe?.length) ? (
          <View style={{ flex: 1 }}>
            {a.programme && a.programme.length > 0 && (
              <>
                <Text style={[petit, gras, { color: VINCI.blanc, backgroundColor: VINCI.bleu, paddingHorizontal: 3, paddingVertical: 1.5 }]}>Programme du groupe : plafonds et franchises</Text>
                {a.programme.map((l, i) => (
                  <Text key={l.libelle} style={[petit, { backgroundColor: i % 2 ? PDF_COULEURS.ligneAlt : PDF_COULEURS.blanc, paddingHorizontal: 3, paddingVertical: 1 }]}>
                    <Text style={gras}>{l.libelle} : </Text>{l.valeur}
                  </Text>
                ))}
              </>
            )}
            {a.regleGroupe && a.regleGroupe.length > 0 && (
              <View style={{ borderLeftWidth: 2, borderLeftColor: VINCI.rouge, paddingLeft: 3, marginTop: 3 }}>
                <Text style={[petit, gras, { color: VINCI.rouge }]}>Règles groupe</Text>
                <Puces items={a.regleGroupe} couleur={VINCI.rouge} />
              </View>
            )}
          </View>
        ) : null}
      </View>
      {a.aVerifier && <Text style={[petit, { backgroundColor: VINCI_SECONDAIRE.jaune.clair, color: VINCI_SECONDAIRE.orange.base, paddingHorizontal: 5, paddingVertical: 2 }]}>À vérifier : {a.aVerifier}</Text>}
    </View>
  )
}

function PageAssurances({ profil, children }: { profil: ProfilSociete | null; children: React.ReactNode }) {
  return (
    <Page size="A4" orientation="landscape" style={pdfStyles.page}>
      <EntetePDF profil={profil} nomProjet={NOM_PROJET} titreDocument={TITRE_DOC} />
      {children}
      <PiedPagePDF gauche={TITRE_DOC} />
    </Page>
  )
}

export function AssurancesPDF({ profil, sources }: { profil: ProfilSociete | null; sources: string }) {
  const categories: CategorieAssurance[] = ['ouvrage', 'entreprise']
  return (
    <Document title="Assurances et garanties d’un chantier">
      <PageAssurances profil={profil}>
        <Text style={pdfStyles.titre}>Assurances et garanties d’un chantier</Text>
        <Text style={pdfStyles.sousTitre}>
          Avant, pendant et après la réception — échelle non proportionnelle au temps. Vérifier l’article « Assurances » du CCAP. Plafonds, franchises et règles groupe : {SOURCE_GUIDE}.
        </Text>
        <FrisePDF />
      </PageAssurances>
      <PageAssurances profil={profil}>
        <Text style={pdfStyles.titre}>Que faire en cas de sinistre ?</Text>
        <SinistresPDF />
        <Text style={{ fontSize: 6.8, color: PDF_COULEURS.texteSecondaire, marginTop: 10 }}>Sources : {pdfSur(sources)}</Text>
      </PageAssurances>
      <PageAssurances profil={profil}>
        <Text style={pdfStyles.titre}>Les bons réflexes avant la remise du prix</Text>
        <BonsReflexesPDF />
      </PageAssurances>
      {categories.map((cat) => (
        <PageAssurances key={cat} profil={profil}>
          <Text style={pdfStyles.titre}>Fiches — {LIBELLE_CATEGORIE[cat].titre.toLowerCase()}</Text>
          {ASSURANCES.filter((a) => a.categorie === cat).map((a) => <FichePDF key={a.cle} a={a} />)}
        </PageAssurances>
      ))}
    </Document>
  )
}
