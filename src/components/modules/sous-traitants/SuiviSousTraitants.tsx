'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileDown } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { formatMontant, formatNombreFR, parseNombreFR } from '@/lib/utils'
import { MOIS_COURTS_FR } from '@/lib/mois'
import { useExportPDF } from '@/hooks/useExportPDF'
import { useProfilStore } from '@/stores/profil'
import { genererEtTelechargerPDF } from '@/lib/pdf/telecharger'
import { nomFichierSur } from '@/lib/pdf/format'
import { upsertFacturation } from '@/actions/sous-traitants'
import { pctAvancement } from './calcul'

export type STSuivi = {
  id: string
  nom: string
  paiementDirect: boolean
  montantMarche: number
  montantAvenants: number
  facturations: { annee: number; mois: number; montant: number }[]
}

const cle = (id: string, mois: number) => `${id}:${mois}`
const fmtSaisie = (n: number) => (n ? formatNombreFR(n) : '')

export function SuiviSousTraitants({ projetId, nomProjet, annee, annees, sousTraitants }: {
  projetId: string; nomProjet: string; annee: number; annees: number[]; sousTraitants: STSuivi[]
}) {
  const router = useRouter()
  const profil = useProfilStore((s) => s.profil)
  const { exportAvecGuard, isExporting } = useExportPDF()
  const [saisies, setSaisies] = useState<Record<string, string>>({})
  const [etat, setEtat] = useState<'idle' | 'saving' | 'saved'>('idle')
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // Réinitialise les saisies locales quand les données serveur / l'année changent
  useEffect(() => { setSaisies({}) }, [sousTraitants, annee])
  useEffect(() => () => { Object.values(timers.current).forEach(clearTimeout) }, [])

  const valeur = useCallback((st: STSuivi, mois: number) => {
    const k = cle(st.id, mois)
    if (k in saisies) return parseNombreFR(saisies[k])
    return st.facturations.find((f) => f.annee === annee && f.mois === mois)?.montant ?? 0
  }, [saisies, annee])

  function modifier(st: STSuivi, mois: number, texte: string) {
    const k = cle(st.id, mois)
    setSaisies((s) => ({ ...s, [k]: texte }))
    clearTimeout(timers.current[k])
    timers.current[k] = setTimeout(async () => {
      setEtat('saving')
      const r = await upsertFacturation(projetId, st.id, annee, mois, parseNombreFR(texte))
      if (!r.success) { toast.error(r.error); setEtat('idle'); return }
      setEtat('saved')
    }, 500)
  }

  const lignes = useMemo(() => sousTraitants.map((st) => {
    const total = st.montantMarche + st.montantAvenants
    const mois = Array.from({ length: 12 }, (_, i) => valeur(st, i + 1))
    const factureAnnee = mois.reduce((s, v) => s + v, 0)
    // cumul = autres années (données serveur) + année affichée (saisie en cours)
    const autres = st.facturations.filter((f) => f.annee !== annee).reduce((s, f) => s + f.montant, 0)
    const cumul = autres + factureAnnee
    return { st, total, mois, factureAnnee, cumul, reste: total - cumul, pct: pctAvancement(cumul, total) }
  }), [sousTraitants, valeur, annee])

  const tot = useMemo(() => ({
    marche: lignes.reduce((s, l) => s + l.st.montantMarche, 0),
    avenants: lignes.reduce((s, l) => s + l.st.montantAvenants, 0),
    total: lignes.reduce((s, l) => s + l.total, 0),
    mois: Array.from({ length: 12 }, (_, i) => lignes.reduce((s, l) => s + l.mois[i], 0)),
    annee: lignes.reduce((s, l) => s + l.factureAnnee, 0),
    cumul: lignes.reduce((s, l) => s + l.cumul, 0),
  }), [lignes])

  function exporter() {
    exportAvecGuard(async () => {
      const { SousTraitantsPDF } = await import('@/lib/pdf/sous-traitants')
      await genererEtTelechargerPDF(
        <SousTraitantsPDF
          annee={annee}
          nomProjet={nomProjet}
          profil={profil}
          lignes={lignes.map((l) => ({
            nom: l.st.nom, paiementDirect: l.st.paiementDirect, montantMarche: l.st.montantMarche, montantAvenants: l.st.montantAvenants,
            montantTotal: l.total, mois: l.mois, factureAnnee: l.factureAnnee, cumulFacture: l.cumul, reste: l.reste, pct: l.pct,
          }))}
        />,
        `Suivi_ST_${nomFichierSur(nomProjet)}_${annee}`,
      )
    })
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-titre">Suivi sous-traitants</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-vinci-texte-secondaire" aria-live="polite">
            {etat === 'saving' ? 'Enregistrement…' : etat === 'saved' ? 'Enregistré' : ''}
          </span>
          <label className="flex items-center gap-2 text-sm">
            Année
            <select
              className="h-9 rounded-md border border-vinci-gris-bordure bg-white px-2 text-sm"
              value={annee}
              onChange={(e) => router.push(`?annee=${e.target.value}`)}
            >
              {annees.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
          <Button variant="outline" className="btn-toolbar" disabled={isExporting || lignes.length === 0} onClick={exporter}>
            <FileDown className="mr-1 h-4 w-4" />Export PDF
          </Button>
        </div>
      </div>

      {lignes.length === 0 ? (
        <p className="text-vinci-texte-secondaire">Aucun sous-traitant. Créez-les dans l&apos;onglet « Sous-traitants ».</p>
      ) : (
        <>
          <h2 className="mb-2 font-bold text-vinci-bleu">Récapitulatif</h2>
          <div className="mb-8 overflow-x-auto">
            <table className="table-vinci">
              <thead>
                <tr>
                  <th>Sous-traitant</th>
                  <th className="num">Marché</th>
                  <th className="num">Avenants</th>
                  <th className="num">Montant total</th>
                  <th className="num">Facturé {annee}</th>
                  <th className="num">Cumul facturé</th>
                  <th className="num">Reste à facturer</th>
                  <th className="min-w-[160px]">Avancement</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((l) => (
                  <tr key={l.st.id}>
                    <td className="font-medium">{l.st.nom}{l.st.paiementDirect && <span className="ml-2 text-xs text-vinci-bleu">(PD)</span>}</td>
                    <td className="num">{formatMontant(l.st.montantMarche)}</td>
                    <td className="num">{formatMontant(l.st.montantAvenants)}</td>
                    <td className="num font-medium">{formatMontant(l.total)}</td>
                    <td className="num">{formatMontant(l.factureAnnee)}</td>
                    <td className="num">{formatMontant(l.cumul)}</td>
                    <td className={`num ${l.reste < 0 ? 'font-bold text-vinci-rouge' : ''}`}>{formatMontant(l.reste)}</td>
                    <td><Barre pct={l.pct} /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total</td>
                  <td className="num">{formatMontant(tot.marche)}</td>
                  <td className="num">{formatMontant(tot.avenants)}</td>
                  <td className="num">{formatMontant(tot.total)}</td>
                  <td className="num">{formatMontant(tot.annee)}</td>
                  <td className="num">{formatMontant(tot.cumul)}</td>
                  <td className="num">{formatMontant(tot.total - tot.cumul)}</td>
                  <td>{formatNombreFR(pctAvancement(tot.cumul, tot.total), 1)} %</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <h2 className="mb-2 font-bold text-vinci-bleu">Facturations mensuelles {annee} (€)</h2>
          <div className="overflow-x-auto">
            <table className="table-vinci min-w-[1100px]">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 bg-vinci-bleu">Sous-traitant</th>
                  {MOIS_COURTS_FR.map((m) => <th key={m} className="num">{m}</th>)}
                  <th className="num">Total {annee}</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((l) => (
                  <tr key={l.st.id}>
                    <td className="sticky left-0 z-[5] bg-inherit font-medium">{l.st.nom}</td>
                    {l.mois.map((_, i) => (
                      <td key={i} className="p-0.5">
                        <input
                          className="cell-input num min-w-[72px]"
                          inputMode="decimal"
                          aria-label={`${l.st.nom} ${MOIS_COURTS_FR[i]} ${annee}`}
                          value={cle(l.st.id, i + 1) in saisies ? saisies[cle(l.st.id, i + 1)] : fmtSaisie(l.mois[i])}
                          onChange={(e) => modifier(l.st, i + 1, e.target.value)}
                        />
                      </td>
                    ))}
                    <td className="num font-medium">{formatNombreFR(l.factureAnnee)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="sticky left-0 z-[5] bg-vinci-bleu-fonce">Total</td>
                  {tot.mois.map((v, i) => <td key={i} className="num">{v ? formatNombreFR(v) : ''}</td>)}
                  <td className="num">{formatNombreFR(tot.annee)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function Barre({ pct }: { pct: number }) {
  const depasse = pct > 100
  return (
    <div className="flex items-center gap-2">
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-vinci-gris-bordure" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full ${depasse ? 'bg-vinci-rouge' : 'bg-vinci-bleu'}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
      </div>
      <span className={`num w-14 text-xs font-medium ${depasse ? 'text-vinci-rouge' : ''}`}>{formatNombreFR(pct, 1)} %</span>
    </div>
  )
}
