// PDF A4 paysage de la matrice décisionnelle d'offres fournisseurs (Bid Comp).
import { Document, Page, Text, View } from '@react-pdf/renderer'
import { COULEURS_NC, DECISIONS, STATUTS_MATRICE, lireMontant } from '@/lib/matrice-bidcomp'
import { VINCI, VINCI_SECONDAIRE } from '@/lib/design-tokens'
import type { ProfilSociete } from '@/stores/profil'
import { analyserMatrice, cleNotation, formatMontantDevise, grouperParSection } from '@/components/modules/matrice/grille'
import type { MatriceVue } from '@/components/modules/matrice/types'
import { EntetePDF, PiedPagePDF, pdfStyles } from './pdf-entete'
import { formatDateFR, formatNombreFR, PDF_COULEURS } from './format'

const LARGEUR_UTILE = 842 - 56
const L_CRITERE = 190
const L_COEF = 32

function PastilleDecision({ decision }: { decision: string }) {
  const d = DECISIONS[(decision in DECISIONS ? decision : 'en_attente') as keyof typeof DECISIONS]
  return (
    <Text
      style={{
        backgroundColor: d.couleur,
        color: decision === 'en_attente' ? VINCI.noir : VINCI.blanc,
        fontFamily: 'Helvetica-Bold',
        fontSize: 7,
        paddingVertical: 1,
        paddingHorizontal: 4,
        borderRadius: 2,
        textAlign: 'center',
      }}
    >
      {d.label}
    </Text>
  )
}

export function MatriceBidCompPDF({ matrice: m, profil, nomProjet }: { matrice: MatriceVue; profil: ProfilSociete | null; nomProjet: string }) {
  const a = analyserMatrice(m)
  const F = m.fournisseurs
  const lF = F.length ? (LARGEUR_UTILE - L_CRITERE - L_COEF) / F.length : 0
  const fs = F.length > 6 ? 6 : 7
  const statut = STATUTS_MATRICE.find((s) => s.value === m.statut)?.label ?? m.statut
  const reco = F.find((f) => f.id === m.bidComp.fournisseurRecommandeId)
  let alt = false

  const cellBase = { width: lF, padding: 2.5, fontSize: fs, borderLeftWidth: 0.5, borderLeftColor: PDF_COULEURS.bordure, textAlign: 'center' as const }

  // Fonction (et non composant) : l'alternance des fonds est calculée dans l'ordre de rendu.
  const ligneInfo = (label: string, valeur: (i: number) => React.ReactNode) => {
    alt = !alt
    return (
      <View key={label} style={[pdfStyles.tr, alt ? {} : pdfStyles.trAlt]} wrap={false}>
        <Text style={[pdfStyles.td, { width: L_CRITERE, fontSize: fs, fontFamily: 'Helvetica-Bold' }]}>{label}</Text>
        <Text style={[pdfStyles.td, { width: L_COEF, fontSize: fs, textAlign: 'center' }]} />
        {F.map((f, i) => (
          <View key={f.id} style={cellBase}>
            {typeof valeur(i) === 'string' ? <Text>{valeur(i)}</Text> : valeur(i)}
          </View>
        ))}
      </View>
    )
  }

  const infos: [string, string][] = [
    ['Acheteur', m.acheteur ?? ''],
    ['Site', m.site ?? ''],
    ["Famille d'achats", m.familleAchats ?? ''],
    ["Typologie d'achat", m.bidComp.typologieAchat],
    ['Budget théorique', m.budgetTheorique != null ? formatMontantDevise(m.budgetTheorique, m.devise) : ''],
    ['Seuil GO', `${formatNombreFR(m.seuilGo, 0)} %`],
    ['Statut', statut],
    ["Date d'établissement", m.bidComp.dateEtablissement ? formatDateFR(m.bidComp.dateEtablissement) : ''],
  ]

  const tries = [...F].sort((x, y) => (a.scores.get(x.id)?.classement ?? 99) - (a.scores.get(y.id)?.classement ?? 99))

  return (
    <Document title={`Matrice décisionnelle — ${m.titre}`} author="Conduc Rail">
      <Page size="A4" orientation="landscape" style={pdfStyles.page}>
        <EntetePDF profil={profil} nomProjet={nomProjet} />
        <Text style={pdfStyles.titre}>Matrice décisionnelle d&apos;offres fournisseurs — {m.titre}</Text>

        {/* En-tête de la matrice */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8, borderWidth: 0.5, borderColor: PDF_COULEURS.bordure }}>
          {infos.map(([k, v]) => (
            <View key={k} style={{ width: '25%', flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: PDF_COULEURS.bordure }}>
              <Text style={{ width: '45%', padding: 3, fontSize: 7.5, backgroundColor: VINCI.bleuTresClair, color: VINCI.bleuFonce, fontFamily: 'Helvetica-Bold' }}>{k}</Text>
              <Text style={{ width: '55%', padding: 3, fontSize: 7.5 }}>{v}</Text>
            </View>
          ))}
        </View>

        {/* Grille */}
        <View style={pdfStyles.table}>
          <View style={pdfStyles.thRow} fixed>
            <Text style={[pdfStyles.th, { width: L_CRITERE }]}>Critère</Text>
            <Text style={[pdfStyles.th, { width: L_COEF, textAlign: 'center' }]}>Coef.</Text>
            {F.map((f, i) => (
              <Text key={f.id} style={[pdfStyles.th, { width: lF, textAlign: 'center', fontSize: fs + 0.5 }]}>
                {i + 1}. {f.nom}
              </Text>
            ))}
          </View>

          {grouperParSection(m.criteres).map((s) => {
            alt = false
            return (
              <View key={s.cle}>
                <View style={{ flexDirection: 'row', backgroundColor: VINCI.bleuClair }} wrap={false} minPresenceAhead={30}>
                  <Text style={{ color: VINCI.blanc, fontFamily: 'Helvetica-Bold', fontSize: fs + 0.5, padding: 3 }}>{s.libelle.toUpperCase()}</Text>
                </View>
                {s.cle === 'offre' && (
                  <>
                    {ligneInfo('Réf. offre', (i) => F[i].refOffre ?? '')}
                    {ligneInfo("Date de l'offre", (i) => (F[i].dateOffre ? formatDateFR(F[i].dateOffre) : ''))}
                    {ligneInfo('Pays de fabrication', (i) => F[i].paysFabrication ?? '')}
                    {ligneInfo('Incoterm', (i) => F[i].incoterm ?? '')}
                    {ligneInfo("Montant de l'offre (HT)", (i) => formatMontantDevise(F[i].montantOffre, m.devise))}
                    {ligneInfo('Décision', (i) => <PastilleDecision decision={F[i].decision} />)}
                  </>
                )}
                {s.criteres.map((c) => {
                  alt = !alt
                  return (
                    <View key={c.id} style={[pdfStyles.tr, alt ? {} : pdfStyles.trAlt]} wrap={false}>
                      <Text style={[pdfStyles.td, { width: L_CRITERE, fontSize: fs }]}>{c.libelle}</Text>
                      <Text style={[pdfStyles.td, { width: L_COEF, fontSize: fs, textAlign: 'center' }]}>
                        {c.type === 'note_1_3' ? formatNombreFR(c.coefficient, Number.isInteger(c.coefficient) ? 0 : 1) : ''}
                      </Text>
                      {F.map((f) => {
                        const n = a.index.get(cleNotation(c.id, f.id))
                        let txt = ''
                        if (n) {
                          if (c.type === 'note_1_3') txt = n.note ? String(n.note) : ''
                          else if (c.type === 'booleen') txt = n.valeurBool === null ? '' : n.valeurBool ? 'Oui' : 'Non'
                          else if (c.type === 'montant') txt = formatMontantDevise(lireMontant(n.valeurTexte), m.devise)
                          else txt = n.valeurTexte ?? ''
                        }
                        const nc = n?.estNonConformiteMajeure ? COULEURS_NC.majeure : n?.estNonConformiteNegociable ? COULEURS_NC.negociable : null
                        return (
                          <View
                            key={f.id}
                            style={[
                              cellBase,
                              nc ? { backgroundColor: nc.fond, borderWidth: 1, borderColor: nc.bordure } : {},
                            ]}
                          >
                            <Text
                              style={{
                                fontFamily: c.type === 'note_1_3' ? 'Helvetica-Bold' : 'Helvetica',
                                color: c.type === 'note_1_3' && n?.note === 1 ? VINCI.rouge : c.type === 'note_1_3' && n?.note === 3 ? VINCI_SECONDAIRE.vert.base : VINCI.noir,
                                textAlign: c.type === 'montant' ? 'right' : 'center',
                              }}
                            >
                              {txt}
                            </Text>
                            {n?.commentaire ? <Text style={{ fontSize: fs - 1, color: VINCI.texteSecondaire, marginTop: 1 }}>{n.commentaire}</Text> : null}
                          </View>
                        )
                      })}
                    </View>
                  )
                })}
                {s.avecSousTotal && s.criteres.length > 0 && (
                  <View style={{ flexDirection: 'row', backgroundColor: VINCI.bleuTresClair }} wrap={false}>
                    <Text style={[pdfStyles.td, { width: L_CRITERE + L_COEF, fontSize: fs, fontFamily: 'Helvetica-Bold', color: VINCI.bleuFonce }]}>
                      Sous-total {s.libelle.toLowerCase()}
                    </Text>
                    {F.map((f) => (
                      <Text key={f.id} style={[cellBase, { textAlign: 'right', fontFamily: 'Helvetica-Bold', color: VINCI.bleuFonce }]}>
                        {formatMontantDevise(a.sousTotaux.get(s.cle)?.get(f.id) ?? null, m.devise)}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )
          })}

          {/* Pied : scores */}
          {(
            [
              ['Score total pondéré', `/${formatNombreFR(a.maximum, 0)}`, (id: string) => formatNombreFR(a.scores.get(id)?.total ?? 0, Number.isInteger(a.scores.get(id)?.total ?? 0) ? 0 : 1)],
              ['Score normalisé', `seuil ${formatNombreFR(m.seuilGo, 0)}%`, (id: string) => `${formatNombreFR(a.scores.get(id)?.pourcentage ?? 0, 1)} %`],
              ['Classement', '', (id: string) => String(a.scores.get(id)?.classement ?? '')],
              ['Décision suggérée', '', (id: string) => DECISIONS[a.scores.get(id)?.decisionSuggeree ?? 'en_attente'].label],
            ] as const
          ).map(([lib, coef, val]) => (
            <View key={lib} style={pdfStyles.tfRow} wrap={false}>
              <Text style={[pdfStyles.tf, { width: L_CRITERE, fontSize: fs + 0.5 }]}>{lib}</Text>
              <Text style={[pdfStyles.tf, { width: L_COEF, fontSize: fs - 0.5, textAlign: 'center' }]}>{coef}</Text>
              {F.map((f) => (
                <Text key={f.id} style={[pdfStyles.tf, { width: lF, textAlign: 'center', fontSize: fs + 0.5 }, a.meilleurId === f.id && lib === 'Classement' ? { backgroundColor: VINCI.blanc, color: VINCI.bleuFonce } : {}]}>
                  {val(f.id)}
                </Text>
              ))}
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
          <Text style={{ fontSize: 6.5, color: PDF_COULEURS.texteSecondaire }}>Notes : 1 insuffisant · 2 acceptable · 3 très satisfaisant</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <View style={{ width: 8, height: 6, backgroundColor: COULEURS_NC.majeure.fond, borderWidth: 1, borderColor: COULEURS_NC.majeure.bordure }} />
            <Text style={{ fontSize: 6.5 }}>Non-conformité majeure</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <View style={{ width: 8, height: 6, backgroundColor: COULEURS_NC.negociable.fond, borderWidth: 1, borderColor: COULEURS_NC.negociable.bordure }} />
            <Text style={{ fontSize: 6.5 }}>Non-conformité négociable</Text>
          </View>
        </View>

        {/* Synthèse */}
        <View break={F.length > 0 && m.criteres.length > 25}>
          <Text style={[pdfStyles.titre, { marginTop: 12, fontSize: 12 }]}>Sélection — synthèse</Text>
          <View style={pdfStyles.table} wrap={false}>
            <View style={pdfStyles.thRow}>
              {['Rang', 'Fournisseur', 'Montant offre (HT)', 'Score pondéré', 'Score normalisé', 'NC majeures', 'Décision suggérée', 'Décision'].map((t, i) => (
                <Text key={t} style={[pdfStyles.th, { flex: i === 1 ? 3 : i === 0 ? 0.7 : 1.4, textAlign: i === 1 ? 'left' : 'center' }]}>
                  {t}
                </Text>
              ))}
            </View>
            {tries.map((f, k) => {
              const s = a.scores.get(f.id)
              const estReco = f.id === reco?.id
              return (
                <View key={f.id} style={[pdfStyles.tr, k % 2 ? pdfStyles.trAlt : {}, estReco ? { backgroundColor: VINCI.bleuTresClair } : {}, { alignItems: 'center' }]}>
                  <Text style={[pdfStyles.td, { flex: 0.7, textAlign: 'center', fontFamily: 'Helvetica-Bold' }]}>{s?.classement ?? ''}</Text>
                  <Text style={[pdfStyles.td, { flex: 3, fontFamily: estReco ? 'Helvetica-Bold' : 'Helvetica', color: estReco ? VINCI.bleuFonce : VINCI.noir }]}>
                    {f.nom}
                    {estReco ? '  (recommandé)' : ''}
                  </Text>
                  <Text style={[pdfStyles.td, { flex: 1.4, textAlign: 'right' }]}>{formatMontantDevise(f.montantOffre, m.devise)}</Text>
                  <Text style={[pdfStyles.td, { flex: 1.4, textAlign: 'center' }]}>
                    {formatNombreFR(s?.total ?? 0, Number.isInteger(s?.total ?? 0) ? 0 : 1)} / {formatNombreFR(a.maximum, 0)}
                  </Text>
                  <Text style={[pdfStyles.td, { flex: 1.4, textAlign: 'center', fontFamily: 'Helvetica-Bold' }]}>{formatNombreFR(s?.pourcentage ?? 0, 1)} %</Text>
                  <Text style={[pdfStyles.td, { flex: 1.4, textAlign: 'center', color: s?.nbNcMajeures ? VINCI.rouge : VINCI.noir }]}>{s?.nbNcMajeures ?? 0}</Text>
                  <View style={{ flex: 1.4, padding: 3 }}>
                    <PastilleDecision decision={s?.decisionSuggeree ?? 'en_attente'} />
                  </View>
                  <View style={{ flex: 1.4, padding: 3 }}>
                    <PastilleDecision decision={f.decision} />
                  </View>
                </View>
              )
            })}
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }} wrap={false}>
            {(
              [
                ['Opportunités', m.bidComp.synthese.opportunites, VINCI_SECONDAIRE.vert.base],
                ['Risques', m.bidComp.synthese.risques, VINCI.rouge],
                ['Recommandation', [reco ? `Fournisseur recommandé : ${reco.nom}` : '', m.bidComp.synthese.recommandation].filter(Boolean).join('\n\n'), VINCI.bleu],
              ] as const
            ).map(([titre, texte, couleur]) => (
              <View key={titre} style={{ flex: 1, borderWidth: 0.5, borderColor: PDF_COULEURS.bordure, borderLeftWidth: 3, borderLeftColor: couleur, padding: 6 }}>
                <Text style={{ fontFamily: 'Helvetica-Bold', color: VINCI.bleu, fontSize: 9, marginBottom: 4 }}>{titre}</Text>
                <Text style={{ fontSize: 8, lineHeight: 1.35 }}>{texte || '—'}</Text>
              </View>
            ))}
          </View>
        </View>

        <PiedPagePDF gauche={`Matrice décisionnelle — ${m.titre} — édité le ${formatDateFR(new Date())}`} />
      </Page>
    </Document>
  )
}
