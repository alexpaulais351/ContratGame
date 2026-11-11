'use client'
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowLeft, CheckCircle2, FileDown, Lock, Unlock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { formatMontant, formatNombreFR, parseNombreFR } from '@/lib/utils'
import { libelleMois } from '@/lib/mois'
import { VINCI } from '@/lib/design-tokens'
import { changerStatutSituation, enregistrerQuantites } from '@/actions/situations'
import { useExportPDF } from '@/hooks/useExportPDF'
import { useProfilStore } from '@/stores/profil'
import { nomFichierSur } from '@/lib/pdf/format'
import { StatutBadge } from './StatutBadge'
import { calculerLigne, sousTotaux, totaliser } from './calculs'
import type { LigneDETableau, RecapSTLigne } from './types'

type Props = {
  projetId: string
  nomProjet: string
  situation: { id: string; numero: number; libelle: string; annee: number; mois: number; statut: 'brouillon' | 'validee' }
  numeroPrecedent: number | null
  lignes: LigneDETableau[]
  recapST: RecapSTLigne[]
}

type EtatSauvegarde = 'idle' | 'saving' | 'saved' | 'error'

export function DetailSituation({ projetId, nomProjet, situation, numeroPrecedent, lignes, recapST }: Props) {
  const router = useRouter()
  const profil = useProfilStore((s) => s.profil)
  const { exportAvecGuard, isExporting } = useExportPDF()
  const [statut, setStatut] = useState(situation.statut)
  const lecture = statut === 'validee'
  const [saisies, setSaisies] = useState<Record<string, string>>(() =>
    Object.fromEntries(lignes.filter((l) => !l.estChapitre).map((l) => [l.id, l.cumul === 0 ? '' : String(l.cumul).replace('.', ',')])),
  )
  const [etat, setEtat] = useState<EtatSauvegarde>('idle')
  const dirty = useRef<Set<string>>(new Set())
  const saisiesRef = useRef(saisies)
  saisiesRef.current = saisies
  const timer = useRef<ReturnType<typeof setTimeout>>()

  const flush = useCallback(async () => {
    clearTimeout(timer.current)
    if (dirty.current.size === 0) return true
    const ids = Array.from(dirty.current)
    dirty.current.clear()
    setEtat('saving')
    const r = await enregistrerQuantites(
      projetId,
      situation.id,
      ids.map((id) => ({ ligneDEId: id, quantite: parseNombreFR(saisiesRef.current[id] ?? '') })),
    )
    if (!r.success) {
      ids.forEach((id) => dirty.current.add(id))
      setEtat('error')
      toast.error(r.error)
      return false
    }
    setEtat('saved')
    return true
  }, [projetId, situation.id])

  const scheduleSave = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => void flush(), 500)
  }, [flush])

  useEffect(() => () => clearTimeout(timer.current), [])

  // Sauvegarde immédiate à la fermeture de l'onglet / navigation si des saisies sont en attente.
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty.current.size > 0) { e.preventDefault(); void flush() } }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [flush])

  const onChange = (id: string, v: string) => {
    setSaisies((s) => ({ ...s, [id]: v }))
    dirty.current.add(id)
    setEtat('idle')
    scheduleSave()
  }

  const calculees = useMemo(
    () =>
      lignes.map((l) => {
        if (l.estChapitre) return calculerLigne(l, 0, l.prixUnitaire)
        const cumul = parseNombreFR(saisies[l.id] ?? '')
        // Ligne déjà saisie en base : PU snapshot ; sinon PU courant du DE.
        return calculerLigne(l, cumul, l.puSituation)
      }),
    [lignes, saisies],
  )
  const totaux = useMemo(() => totaliser(calculees), [calculees])
  const sousTot = useMemo(() => sousTotaux(calculees), [calculees])

  const basculerStatut = async () => {
    if (!(await flush())) return
    const cible = lecture ? 'brouillon' : 'validee'
    const r = await changerStatutSituation(projetId, situation.id, cible)
    if (!r.success) return void toast.error(r.error)
    setStatut(cible)
    toast.success(cible === 'validee' ? 'Situation validée' : 'Situation repassée en brouillon')
    router.refresh()
  }

  const exporter = () =>
    exportAvecGuard(async () => {
      await flush()
      const [{ SituationPDF }, { genererEtTelechargerPDF }] = await Promise.all([
        import('@/lib/pdf/situation'),
        import('@/lib/pdf/telecharger'),
      ])
      await genererEtTelechargerPDF(
        <SituationPDF
          profil={profil}
          nomProjet={nomProjet}
          numero={situation.numero}
          libelle={situation.libelle}
          periode={libelleMois(situation.mois, situation.annee)}
          statut={statut}
          lignes={calculees}
          totaux={totaux}
          recapST={recapST}
        />,
        `Situation_${situation.numero}_${nomFichierSur(nomProjet)}`,
      )
    })

  const totalST = recapST.reduce(
    (a, r) => ({ total: a.total + r.montantTotal, mois: a.mois + r.factureMois, cumule: a.cumule + r.cumule, reste: a.reste + r.reste }),
    { total: 0, mois: 0, cumule: 0, reste: 0 },
  )

  return (
    <main className="p-6">
      <Link href={`/projets/${projetId}/suivi/situations`} className="mb-2 inline-flex items-center text-sm text-vinci-bleu hover:underline">
        <ArrowLeft className="mr-1 h-4 w-4" /> Situations
      </Link>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="page-titre">
            Situation n°{situation.numero}
            <span className="ml-2 text-base font-normal text-vinci-texte-secondaire">
              {situation.libelle} — {libelleMois(situation.mois, situation.annee)}
            </span>
          </h1>
          <StatutBadge statut={statut} />
        </div>
        <div className="flex items-center gap-2">
          <span className="min-w-24 text-right text-xs text-vinci-texte-secondaire" aria-live="polite">
            {etat === 'saving' && 'Enregistrement…'}
            {etat === 'saved' && (
              <span className="inline-flex items-center"><CheckCircle2 className="mr-1 h-3.5 w-3.5 text-vinci-vert" />Enregistré</span>
            )}
            {etat === 'error' && <span className="text-vinci-rouge">Échec de l&apos;enregistrement</span>}
          </span>
          <Button variant="outline" className="btn-toolbar" onClick={exporter} disabled={isExporting}>
            <FileDown className="mr-1 h-4 w-4" /> {isExporting ? 'Export…' : 'Exporter PDF'}
          </Button>
          {lecture ? (
            <Button variant="outline" className="btn-secondaire" onClick={basculerStatut}>
              <Unlock className="mr-1 h-4 w-4" /> Repasser en brouillon
            </Button>
          ) : (
            <Button onClick={basculerStatut}>
              <Lock className="mr-1 h-4 w-4" /> Valider la situation
            </Button>
          )}
        </div>
      </div>

      <p className="mb-2 text-xs text-vinci-texte-secondaire">
        {numeroPrecedent ? `Cumul précédent = situation n°${numeroPrecedent}.` : 'Première situation : cumul précédent nul.'}{' '}
        Saisissez la quantité réalisée <strong>cumulée</strong> pour chaque ligne.
        {lecture && ' Situation validée : lecture seule.'}
      </p>

      <div className="carte overflow-x-auto p-0">
        <table className="table-vinci min-w-[1250px]">
          <thead>
            <tr>
              <th>Code</th>
              <th>Désignation</th>
              <th>U.</th>
              <th className="text-right">Qté marché</th>
              <th className="text-right">PU</th>
              <th className="text-right">Cumul préc.</th>
              <th className="text-right">Qté du mois</th>
              <th className="w-32 text-right">Cumul total</th>
              <th className="text-right">% av.</th>
              <th className="text-right">Montant préc.</th>
              <th className="text-right">Montant mois</th>
              <th className="text-right">Montant cumulé</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l, i) => {
              const c = calculees[i]
              if (l.estChapitre) {
                const st = sousTot.get(l.id)
                return (
                  <tr key={l.id} style={{ backgroundColor: VINCI.bleuTresClair }} className="font-bold text-vinci-bleu-fonce">
                    <td>{l.code}</td>
                    <td colSpan={7}>{l.designation}</td>
                    <td className="num">{st ? `${formatNombreFR(st.pourcent, 1)} %` : ''}</td>
                    <td className="num">{st ? formatMontant(st.precedent) : ''}</td>
                    <td className="num">{st ? formatMontant(st.mois) : ''}</td>
                    <td className="num">{st ? formatMontant(st.cumul) : ''}</td>
                  </tr>
                )
              }
              const depasse = c.cumul > l.quantite + 1e-9
              const recule = c.cumul < l.cumulPrecedent - 1e-9
              const alerte = depasse || recule
              return (
                <Fragment key={l.id}>
                  <tr style={alerte ? { backgroundColor: VINCI.rougeTresClair } : undefined}>
                    <td className="whitespace-nowrap">{l.code}</td>
                    <td className="min-w-[220px]">{l.designation}</td>
                    <td>{l.unite}</td>
                    <td className="num">{formatNombreFR(l.quantite)}</td>
                    <td className="num">{formatNombreFR(l.puSituation)}</td>
                    <td className="num">{formatNombreFR(l.cumulPrecedent)}</td>
                    <td className="num" style={recule ? { color: VINCI.rouge, fontWeight: 700 } : undefined}>{formatNombreFR(c.qteMois)}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        {alerte && (
                          <span title={depasse ? 'Cumul supérieur à la quantité du marché' : 'Cumul inférieur au cumul précédent'}>
                            <AlertTriangle className="h-4 w-4 shrink-0 text-vinci-rouge" aria-label="Alerte" />
                          </span>
                        )}
                        <input
                          className="cell-input num"
                          style={alerte ? { borderColor: VINCI.rouge } : undefined}
                          inputMode="decimal"
                          value={saisies[l.id] ?? ''}
                          placeholder="0"
                          disabled={lecture}
                          onChange={(e) => onChange(l.id, e.target.value)}
                          onBlur={() => void flush()}
                          aria-label={`Quantité cumulée ${l.code} ${l.designation}`}
                        />
                      </div>
                    </td>
                    <td className="num">{formatNombreFR(c.pourcent, 1)} %</td>
                    <td className="num">{formatMontant(c.montantPrecedent)}</td>
                    <td className="num">{formatMontant(c.montantMois)}</td>
                    <td className="num font-semibold">{formatMontant(c.montantCumul)}</td>
                  </tr>
                </Fragment>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={8}>TOTAL — marché : {formatMontant(totaux.marche)}</td>
              <td className="num">{formatNombreFR(totaux.pourcent, 1)} %</td>
              <td className="num">{formatMontant(totaux.precedent)}</td>
              <td className="num">{formatMontant(totaux.mois)}</td>
              <td className="num">{formatMontant(totaux.cumul)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <h2 className="mb-2 mt-8 text-lg font-bold text-vinci-bleu">Sous-traitants — {libelleMois(situation.mois, situation.annee)}</h2>
      {recapST.length === 0 ? (
        <p className="text-sm text-vinci-texte-secondaire">Aucun sous-traitant sur ce projet.</p>
      ) : (
        <div className="carte overflow-x-auto p-0">
          <table className="table-vinci">
            <thead>
              <tr>
                <th>Sous-traitant</th>
                <th className="text-right">Montant total</th>
                <th className="text-right">Facturé du mois</th>
                <th className="text-right">Cumul facturé</th>
                <th className="text-right">Reste à facturer</th>
                <th className="text-right">% av.</th>
              </tr>
            </thead>
            <tbody>
              {recapST.map((r) => (
                <tr key={r.id}>
                  <td>{r.nom}</td>
                  <td className="num">{formatMontant(r.montantTotal)}</td>
                  <td className="num">{formatMontant(r.factureMois)}</td>
                  <td className="num">{formatMontant(r.cumule)}</td>
                  <td className="num">{formatMontant(r.reste)}</td>
                  <td className="num">{formatNombreFR(r.pourcent, 1)} %</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td>
                <td className="num">{formatMontant(totalST.total)}</td>
                <td className="num">{formatMontant(totalST.mois)}</td>
                <td className="num">{formatMontant(totalST.cumule)}</td>
                <td className="num">{formatMontant(totalST.reste)}</td>
                <td className="num">{totalST.total > 0 ? `${formatNombreFR((totalST.cumule / totalST.total) * 100, 1)} %` : ''}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </main>
  )
}
