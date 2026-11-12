import { Document, Page, Text, View } from '@react-pdf/renderer'
import { EntetePDF, PiedPagePDF, pdfStyles } from './pdf-entete'
import { PDF_COULEURS, formatMontant, formatNombreFR } from './format'
import type { ProfilSociete } from '@/stores/profil'
import type { LignePDFSituation, RecapSTLigne } from '@/components/modules/situations/types'
import { sousTotaux, type Totaux } from '@/components/modules/situations/calculs'
import type { PNCalcule } from '@/components/modules/situations/calculs-pn'
import type { DecompteSituation } from '@/components/modules/situations/decompte'

type Props = {
  profil: ProfilSociete | null
  nomProjet: string
  numero: number
  libelle: string
  periode: string
  statut: 'brouillon' | 'validee'
  lignes: LignePDFSituation[]
  totaux: Totaux
  recapST: RecapSTLigne[]
  prixNouveaux: PNCalcule[]
  totauxPN: { base: number; precedent: number; mois: number; cumul: number }
  decompte: DecompteSituation
}

// Largeurs en % (paysage)
const W = { code: 7, des: 25, u: 4, qm: 7, pu: 7, cp: 7, qmo: 7, cum: 7, pct: 5, mp: 8, mm: 8, mc: 8 }
const w = (k: keyof typeof W) => ({ width: `${W[k]}%` })
const pct = (n: number) => `${formatNombreFR(n, 1)} %`

export function SituationPDF({ profil, nomProjet, numero, libelle, periode, statut, lignes, totaux, recapST, prixNouveaux, totauxPN, decompte }: Props) {
  const st = sousTotaux(lignes)
  const stTot = recapST.reduce(
    (a, r) => ({ total: a.total + r.montantTotal, mois: a.mois + r.factureMois, cumule: a.cumule + r.cumule, reste: a.reste + r.reste }),
    { total: 0, mois: 0, cumule: 0, reste: 0 },
  )
  let alt = 0
  return (
    <Document title={`Situation n°${numero}`}>
      <Page size="A4" orientation="landscape" style={pdfStyles.page}>
        <EntetePDF profil={profil} nomProjet={nomProjet} titreDocument="Situation de travaux" />
        <Text style={pdfStyles.titre}>
          Situation de travaux n°{numero}{libelle ? ` — ${libelle}` : ''}
        </Text>
        <Text style={pdfStyles.sousTitre}>
          {periode} · {statut === 'validee' ? 'Validée' : 'Brouillon'}
        </Text>

        <View style={pdfStyles.table}>
          <View style={pdfStyles.thRow} fixed>
            <Text style={[pdfStyles.th, w('code')]}>Code</Text>
            <Text style={[pdfStyles.th, w('des')]}>Désignation</Text>
            <Text style={[pdfStyles.th, w('u')]}>U.</Text>
            <Text style={[pdfStyles.th, pdfStyles.num, w('qm')]}>Qté marché</Text>
            <Text style={[pdfStyles.th, pdfStyles.num, w('pu')]}>PU</Text>
            <Text style={[pdfStyles.th, pdfStyles.num, w('cp')]}>Cumul préc.</Text>
            <Text style={[pdfStyles.th, pdfStyles.num, w('qmo')]}>Qté mois</Text>
            <Text style={[pdfStyles.th, pdfStyles.num, w('cum')]}>Cumul</Text>
            <Text style={[pdfStyles.th, pdfStyles.num, w('pct')]}>%</Text>
            <Text style={[pdfStyles.th, pdfStyles.num, w('mp')]}>Mont. préc.</Text>
            <Text style={[pdfStyles.th, pdfStyles.num, w('mm')]}>Mont. mois</Text>
            <Text style={[pdfStyles.th, pdfStyles.num, w('mc')]}>Mont. cumulé</Text>
          </View>
          {lignes.map((l) => {
            if (l.estChapitre) {
              const t = st.get(l.id)
              alt = 0
              return (
                <View key={l.id} style={[pdfStyles.tr, { backgroundColor: PDF_COULEURS.ligneAlt }]} wrap={false}>
                  <Text style={[pdfStyles.td, w('code'), { fontFamily: 'Helvetica-Bold' }]}>{l.code}</Text>
                  <Text style={[pdfStyles.td, { width: `${W.des + W.u + W.qm + W.pu + W.cp + W.qmo + W.cum}%`, fontFamily: 'Helvetica-Bold', color: PDF_COULEURS.enTete }]}>
                    {l.designation}
                  </Text>
                  <Text style={[pdfStyles.td, pdfStyles.num, w('pct'), { fontFamily: 'Helvetica-Bold' }]}>{t ? pct(t.pourcent) : ''}</Text>
                  <Text style={[pdfStyles.td, pdfStyles.num, w('mp'), { fontFamily: 'Helvetica-Bold' }]}>{t ? formatMontant(t.precedent) : ''}</Text>
                  <Text style={[pdfStyles.td, pdfStyles.num, w('mm'), { fontFamily: 'Helvetica-Bold' }]}>{t ? formatMontant(t.mois) : ''}</Text>
                  <Text style={[pdfStyles.td, pdfStyles.num, w('mc'), { fontFamily: 'Helvetica-Bold' }]}>{t ? formatMontant(t.cumul) : ''}</Text>
                </View>
              )
            }
            alt++
            return (
              <View key={l.id} style={alt % 2 === 0 ? [pdfStyles.tr, pdfStyles.trAlt] : pdfStyles.tr} wrap={false}>
                <Text style={[pdfStyles.td, w('code')]}>{l.code}</Text>
                <Text style={[pdfStyles.td, w('des')]}>{l.designation}</Text>
                <Text style={[pdfStyles.td, w('u')]}>{l.unite}</Text>
                <Text style={[pdfStyles.td, pdfStyles.num, w('qm')]}>{formatNombreFR(l.quantite)}</Text>
                <Text style={[pdfStyles.td, pdfStyles.num, w('pu')]}>{formatNombreFR(l.prixUnitaire)}</Text>
                <Text style={[pdfStyles.td, pdfStyles.num, w('cp')]}>{formatNombreFR(l.cumulPrecedent)}</Text>
                <Text style={[pdfStyles.td, pdfStyles.num, w('qmo')]}>{formatNombreFR(l.qteMois)}</Text>
                <Text style={[pdfStyles.td, pdfStyles.num, w('cum')]}>{formatNombreFR(l.cumul)}</Text>
                <Text style={[pdfStyles.td, pdfStyles.num, w('pct')]}>{pct(l.pourcent)}</Text>
                <Text style={[pdfStyles.td, pdfStyles.num, w('mp')]}>{formatMontant(l.montantPrecedent)}</Text>
                <Text style={[pdfStyles.td, pdfStyles.num, w('mm')]}>{formatMontant(l.montantMois)}</Text>
                <Text style={[pdfStyles.td, pdfStyles.num, w('mc')]}>{formatMontant(l.montantCumul)}</Text>
              </View>
            )
          })}
          <View style={pdfStyles.tfRow} wrap={false}>
            <Text style={[pdfStyles.tf, { width: `${W.code + W.des + W.u + W.qm + W.pu + W.cp + W.qmo + W.cum}%` }]}>
              TOTAL — montant du marché : {formatMontant(totaux.marche)}
            </Text>
            <Text style={[pdfStyles.tf, pdfStyles.num, w('pct')]}>{pct(totaux.pourcent)}</Text>
            <Text style={[pdfStyles.tf, pdfStyles.num, w('mp')]}>{formatMontant(totaux.precedent)}</Text>
            <Text style={[pdfStyles.tf, pdfStyles.num, w('mm')]}>{formatMontant(totaux.mois)}</Text>
            <Text style={[pdfStyles.tf, pdfStyles.num, w('mc')]}>{formatMontant(totaux.cumul)}</Text>
          </View>
        </View>

        {prixNouveaux.length > 0 && (
          <View wrap={false} style={{ marginTop: 16 }}>
            <Text style={[pdfStyles.titre, { fontSize: 11 }]}>Prix nouveaux — OS reçus</Text>
            <View style={pdfStyles.table}>
              <View style={pdfStyles.thRow}>
                <Text style={[pdfStyles.th, { width: '8%' }]}>N°</Text>
                <Text style={[pdfStyles.th, { width: '30%' }]}>Intitulé</Text>
                <Text style={[pdfStyles.th, { width: '12%' }]}>OS</Text>
                <Text style={[pdfStyles.th, pdfStyles.num, { width: '11%' }]}>Montant</Text>
                <Text style={[pdfStyles.th, pdfStyles.num, { width: '6%' }]}>% préc.</Text>
                <Text style={[pdfStyles.th, pdfStyles.num, { width: '6%' }]}>% cumulé</Text>
                <Text style={[pdfStyles.th, pdfStyles.num, { width: '9%' }]}>Mont. préc.</Text>
                <Text style={[pdfStyles.th, pdfStyles.num, { width: '9%' }]}>Mont. mois</Text>
                <Text style={[pdfStyles.th, pdfStyles.num, { width: '9%' }]}>Mont. cumulé</Text>
              </View>
              {prixNouveaux.map((p, i) => (
                <View key={p.id} style={i % 2 === 1 ? [pdfStyles.tr, pdfStyles.trAlt] : pdfStyles.tr}>
                  <Text style={[pdfStyles.td, { width: '8%' }]}>{p.numero}</Text>
                  <Text style={[pdfStyles.td, { width: '30%' }]}>{p.intitule}</Text>
                  <Text style={[pdfStyles.td, { width: '12%' }]}>{[p.numeroOS, p.dateOS ? p.dateOS.split('-').reverse().join('/') : ''].filter(Boolean).join(' du ')}</Text>
                  <Text style={[pdfStyles.td, pdfStyles.num, { width: '11%' }]}>{formatMontant(p.montantBase)}{p.accepte ? '' : ' *'}</Text>
                  <Text style={[pdfStyles.td, pdfStyles.num, { width: '6%' }]}>{pct(p.avancementPrecedent)}</Text>
                  <Text style={[pdfStyles.td, pdfStyles.num, { width: '6%' }]}>{pct(p.avancement)}</Text>
                  <Text style={[pdfStyles.td, pdfStyles.num, { width: '9%' }]}>{formatMontant(p.montantPrecedent)}</Text>
                  <Text style={[pdfStyles.td, pdfStyles.num, { width: '9%' }]}>{formatMontant(p.montantMois)}</Text>
                  <Text style={[pdfStyles.td, pdfStyles.num, { width: '9%' }]}>{formatMontant(p.montantCumul)}</Text>
                </View>
              ))}
              <View style={pdfStyles.tfRow}>
                <Text style={[pdfStyles.tf, { width: '50%' }]}>Total prix nouveaux</Text>
                <Text style={[pdfStyles.tf, pdfStyles.num, { width: '11%' }]}>{formatMontant(totauxPN.base)}</Text>
                <Text style={[pdfStyles.tf, { width: '12%' }]}> </Text>
                <Text style={[pdfStyles.tf, pdfStyles.num, { width: '9%' }]}>{formatMontant(totauxPN.precedent)}</Text>
                <Text style={[pdfStyles.tf, pdfStyles.num, { width: '9%' }]}>{formatMontant(totauxPN.mois)}</Text>
                <Text style={[pdfStyles.tf, pdfStyles.num, { width: '9%' }]}>{formatMontant(totauxPN.cumul)}</Text>
              </View>
            </View>
            {prixNouveaux.some((p) => !p.accepte) && (
              <Text style={[pdfStyles.sousTitre, { marginTop: 3 }]}>* montant présenté (montant accepté non renseigné)</Text>
            )}
          </View>
        )}

        <View break={recapST.length > 0 && lignes.length > 18} wrap={false} style={{ marginTop: 16 }}>
          <Text style={[pdfStyles.titre, { fontSize: 11 }]}>Sous-traitants — {periode}</Text>
          {recapST.length === 0 ? (
            <Text style={pdfStyles.sousTitre}>Aucun sous-traitant sur ce projet.</Text>
          ) : (
            <View style={pdfStyles.table}>
              <View style={pdfStyles.thRow}>
                <Text style={[pdfStyles.th, { width: '28%' }]}>Sous-traitant</Text>
                <Text style={[pdfStyles.th, pdfStyles.num, { width: '16%' }]}>Montant total</Text>
                <Text style={[pdfStyles.th, pdfStyles.num, { width: '16%' }]}>Facturé du mois</Text>
                <Text style={[pdfStyles.th, pdfStyles.num, { width: '16%' }]}>Cumul facturé</Text>
                <Text style={[pdfStyles.th, pdfStyles.num, { width: '16%' }]}>Reste à facturer</Text>
                <Text style={[pdfStyles.th, pdfStyles.num, { width: '8%' }]}>%</Text>
              </View>
              {recapST.map((r, i) => (
                <View key={r.id} style={i % 2 === 1 ? [pdfStyles.tr, pdfStyles.trAlt] : pdfStyles.tr}>
                  <Text style={[pdfStyles.td, { width: '28%' }]}>{r.nom}{r.paiementDirect ? ' (PD)' : ''}</Text>
                  <Text style={[pdfStyles.td, pdfStyles.num, { width: '16%' }]}>{formatMontant(r.montantTotal)}</Text>
                  <Text style={[pdfStyles.td, pdfStyles.num, { width: '16%' }]}>{formatMontant(r.factureMois)}</Text>
                  <Text style={[pdfStyles.td, pdfStyles.num, { width: '16%' }]}>{formatMontant(r.cumule)}</Text>
                  <Text style={[pdfStyles.td, pdfStyles.num, { width: '16%' }]}>{formatMontant(r.reste)}</Text>
                  <Text style={[pdfStyles.td, pdfStyles.num, { width: '8%' }]}>{pct(r.pourcent)}</Text>
                </View>
              ))}
              <View style={pdfStyles.tfRow}>
                <Text style={[pdfStyles.tf, { width: '28%' }]}>Total</Text>
                <Text style={[pdfStyles.tf, pdfStyles.num, { width: '16%' }]}>{formatMontant(stTot.total)}</Text>
                <Text style={[pdfStyles.tf, pdfStyles.num, { width: '16%' }]}>{formatMontant(stTot.mois)}</Text>
                <Text style={[pdfStyles.tf, pdfStyles.num, { width: '16%' }]}>{formatMontant(stTot.cumule)}</Text>
                <Text style={[pdfStyles.tf, pdfStyles.num, { width: '16%' }]}>{formatMontant(stTot.reste)}</Text>
                <Text style={[pdfStyles.tf, pdfStyles.num, { width: '8%' }]}>{stTot.total > 0 ? pct((stTot.cumule / stTot.total) * 100) : ''}</Text>
              </View>
            </View>
          )}
        </View>
        <View wrap={false} style={{ marginTop: 16, width: '60%' }}>
          <Text style={[pdfStyles.titre, { fontSize: 11 }]}>Décompte de la situation (HT)</Text>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.thRow}>
              <Text style={[pdfStyles.th, { width: '50%' }]}>Montants HT</Text>
              <Text style={[pdfStyles.th, pdfStyles.num, { width: '25%' }]}>Du mois</Text>
              <Text style={[pdfStyles.th, pdfStyles.num, { width: '25%' }]}>Cumulé</Text>
            </View>
            {[
              ['Travaux du marché', totaux.mois, totaux.cumul],
              ['Prix nouveaux (OS reçus)', totauxPN.mois, totauxPN.cumul],
              ['Total travaux', decompte.mois, decompte.cumul],
              ['dont sous-traitants en paiement direct (PD)', -decompte.stPaiementDirectMois, -decompte.stPaiementDirectCumul],
            ].map(([l, m, c], i) => (
              <View key={String(l)} style={i % 2 === 1 ? [pdfStyles.tr, pdfStyles.trAlt] : pdfStyles.tr}>
                <Text style={[pdfStyles.td, { width: '50%' }, i === 2 ? { fontFamily: 'Helvetica-Bold' } : {}]}>{String(l)}</Text>
                <Text style={[pdfStyles.td, pdfStyles.num, { width: '25%' }]}>{formatMontant(Number(m))}</Text>
                <Text style={[pdfStyles.td, pdfStyles.num, { width: '25%' }]}>{formatMontant(Number(c))}</Text>
              </View>
            ))}
            <View style={pdfStyles.tfRow}>
              <Text style={[pdfStyles.tf, { width: '50%' }]}>Montant revenant à l&apos;entreprise</Text>
              <Text style={[pdfStyles.tf, pdfStyles.num, { width: '25%' }]}>{formatMontant(decompte.titulaireMois)}</Text>
              <Text style={[pdfStyles.tf, pdfStyles.num, { width: '25%' }]}>{formatMontant(decompte.titulaireCumul)}</Text>
            </View>
          </View>
        </View>
        <PiedPagePDF gauche={`${nomProjet} — Situation n°${numero} — ${periode}`} />
      </Page>
    </Document>
  )
}
