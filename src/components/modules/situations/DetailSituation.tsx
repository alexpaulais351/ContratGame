'use client'
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowLeft, CheckCircle2, FileDown, FileSpreadsheet, Lock, Unlock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { formatMontant, formatNombreFR, parseNombreFR } from '@/lib/utils'
import { libelleMois } from '@/lib/mois'
import { VINCI } from '@/lib/design-tokens'
import { changerStatutSituation, enregistrerAvancementsPN, enregistrerQuantites } from '@/actions/situations'
import { upsertFacturation } from '@/actions/sous-traitants'
import { useExportPDF } from '@/hooks/useExportPDF'
import { useProfilStore } from '@/stores/profil'
import { nomFichierSur } from '@/lib/pdf/format'
import { StatutBadge } from './StatutBadge'
import { calculerLigne, sousTotaux, totaliser } from './calculs'
import { calculerPN, totaliserPN } from './calculs-pn'
import { calculerDecompte } from './decompte'
import type { LigneDETableau, LignePNSituation, RecapSTLigne } from './types'

type Props = {
  projetId: string
  nomProjet: string
  situation: { id: string; numero: number; libelle: string; annee: number; mois: number; statut: 'brouillon' | 'validee' }
  numeroPrecedent: number | null
  lignes: LigneDETableau[]
  recapST: RecapSTLigne[]
  prixNouveaux: LignePNSituation[]
}

type EtatSauvegarde = 'idle' | 'saving' | 'saved' | 'error'

export function DetailSituation({ projetId, nomProjet, situation, numeroPrecedent, lignes, recapST, prixNouveaux }: Props) {
  const router = useRouter()
  const profil = useProfilStore((s) => s.profil)
  const { exportAvecGuard, isExporting } = useExportPDF()
  const [statut, setStatut] = useState(situation.statut)
  const lecture = statut === 'validee'
  const [saisies, setSaisies] = useState<Record<string, string>>(() =>
    Object.fromEntries(lignes.filter((l) => !l.estChapitre).map((l) => [l.id, l.cumul === 0 ? '' : String(l.cumul).replace('.', ',')])),
  )
  const fmtSaisie = (n: number) => (n === 0 ? '' : String(n).replace('.', ','))
  // Prix nouveaux (OS reçu) : avancement cumulé en %
  const [saisiesPN, setSaisiesPN] = useState<Record<string, string>>(() => Object.fromEntries(prixNouveaux.map((p) => [p.id, fmtSaisie(p.avancement)])))
  const dirtyPN = useRef<Set<string>>(new Set())
  const saisiesPNRef = useRef(saisiesPN)
  saisiesPNRef.current = saisiesPN
  // Sous-traitants : montant facturé du mois (synchronisé avec le Suivi ST)
  const [saisiesST, setSaisiesST] = useState<Record<string, string>>(() => Object.fromEntries(recapST.map((r) => [r.id, fmtSaisie(r.factureMois)])))
  const dirtyST = useRef<Set<string>>(new Set())
  const saisiesSTRef = useRef(saisiesST)
  saisiesSTRef.current = saisiesST
  const [etat, setEtat] = useState<EtatSauvegarde>('idle')
  const dirty = useRef<Set<string>>(new Set())
  const saisiesRef = useRef(saisies)
  saisiesRef.current = saisies
  const timer = useRef<ReturnType<typeof setTimeout>>()

  const flush = useCallback(async () => {
    clearTimeout(timer.current)
    if (dirty.current.size === 0 && dirtyPN.current.size === 0 && dirtyST.current.size === 0) return true
    const ids = Array.from(dirty.current)
    const idsPN = Array.from(dirtyPN.current)
    const idsST = Array.from(dirtyST.current)
    dirty.current.clear()
    dirtyPN.current.clear()
    dirtyST.current.clear()
    setEtat('saving')
    const erreurs: string[] = []
    if (ids.length) {
      const r = await enregistrerQuantites(
        projetId,
        situation.id,
        ids.map((id) => ({ ligneDEId: id, quantite: parseNombreFR(saisiesRef.current[id] ?? '') })),
      )
      if (!r.success) { ids.forEach((id) => dirty.current.add(id)); erreurs.push(r.error) }
    }
    if (idsPN.length) {
      const r = await enregistrerAvancementsPN(
        projetId,
        situation.id,
        idsPN.map((id) => ({ prixNouveauId: id, avancement: parseNombreFR(saisiesPNRef.current[id] ?? '') })),
      )
      if (!r.success) { idsPN.forEach((id) => dirtyPN.current.add(id)); erreurs.push(r.error) }
    }
    for (const id of idsST) {
      const r = await upsertFacturation(projetId, id, situation.annee, situation.mois, parseNombreFR(saisiesSTRef.current[id] ?? ''))
      if (!r.success) { dirtyST.current.add(id); erreurs.push(r.error) }
    }
    if (erreurs.length) {
      setEtat('error')
      toast.error(erreurs[0])
      return false
    }
    setEtat('saved')
    return true
  }, [projetId, situation.id, situation.annee, situation.mois])

  const scheduleSave = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => void flush(), 500)
  }, [flush])

  useEffect(() => () => clearTimeout(timer.current), [])

  // Sauvegarde immédiate à la fermeture de l'onglet / navigation si des saisies sont en attente.
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty.current.size + dirtyPN.current.size + dirtyST.current.size > 0) { e.preventDefault(); void flush() }
    }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [flush])

  const onChange = (id: string, v: string) => {
    setSaisies((s) => ({ ...s, [id]: v }))
    dirty.current.add(id)
    setEtat('idle')
    scheduleSave()
  }
  const onChangePN = (id: string, v: string) => {
    setSaisiesPN((s) => ({ ...s, [id]: v }))
    dirtyPN.current.add(id)
    setEtat('idle')
    scheduleSave()
  }
  const onChangeST = (id: string, v: string) => {
    setSaisiesST((s) => ({ ...s, [id]: v }))
    dirtyST.current.add(id)
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
  const pnCalcules = useMemo(
    () => prixNouveaux.map((p) => calculerPN(p, parseNombreFR(saisiesPN[p.id] ?? ''))),
    [prixNouveaux, saisiesPN],
  )
  const totauxPN = useMemo(() => totaliserPN(pnCalcules), [pnCalcules])
  const totauxGeneraux = useMemo(
    () => ({ precedent: totaux.precedent + totauxPN.precedent, mois: totaux.mois + totauxPN.mois, cumul: totaux.cumul + totauxPN.cumul }),
    [totaux, totauxPN],
  )
  const stCalcules: RecapSTLigne[] = useMemo(
    () =>
      recapST.map((r) => {
        const factureMois = parseNombreFR(saisiesST[r.id] ?? '')
        const cumule = r.cumulPrecedent + factureMois
        return { ...r, factureMois, cumule, reste: r.montantTotal - cumule, pourcent: r.montantTotal > 0 ? (cumule / r.montantTotal) * 100 : 0 }
      }),
    [recapST, saisiesST],
  )
  const decompte = useMemo(() => calculerDecompte(totauxGeneraux, stCalcules), [totauxGeneraux, stCalcules])

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
          recapST={stCalcules}
          prixNouveaux={pnCalcules}
          totauxPN={totauxPN}
          decompte={decompte}
        />,
        `Situation_${situation.numero}_${nomFichierSur(nomProjet)}`,
      )
    })

  const exporterExcel = () =>
    exportAvecGuard(async () => {
      await flush()
      const { exporterSituationExcel } = await import('./export-excel')
      await exporterSituationExcel({
        nomProjet,
        profil,
        numero: situation.numero,
        libelle: situation.libelle,
        periode: libelleMois(situation.mois, situation.annee),
        statut,
        lignes: calculees,
        totaux,
        prixNouveaux: pnCalcules,
        totauxPN,
        recapST: stCalcules,
        decompte,
      })
    })

  const totalST = stCalcules.reduce(
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
          <Button variant="outline" className="btn-toolbar" onClick={exporterExcel} disabled={isExporting}>
            <FileSpreadsheet className="mr-1 h-4 w-4" /> Exporter Excel
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
              <td colSpan={8}>TOTAL travaux du marché — marché : {formatMontant(totaux.marche)}</td>
              <td className="num">{formatNombreFR(totaux.pourcent, 1)} %</td>
              <td className="num">{formatMontant(totaux.precedent)}</td>
              <td className="num">{formatMontant(totaux.mois)}</td>
              <td className="num">{formatMontant(totaux.cumul)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── Prix nouveaux (OS reçus) ── */}
      <h2 className="mb-1 mt-8 text-lg font-bold text-vinci-bleu">Prix nouveaux — OS reçus</h2>
      <p className="mb-2 text-xs text-vinci-texte-secondaire">
        Prix nouveaux dont l&apos;ordre de service est reçu (n° ou date d&apos;OS renseigné dans Prix Nouveaux, OS daté au plus tard ce mois-ci).
        Saisissez l&apos;avancement <strong>cumulé</strong> en % ; montant = montant accepté (à défaut, présenté).
      </p>
      {pnCalcules.length === 0 ? (
        <p className="text-sm text-vinci-texte-secondaire">
          Aucun prix nouveau avec OS reçu.{' '}
          <Link href={`/projets/${projetId}/suivi/prix-nouveaux`} className="font-medium text-vinci-bleu underline">Gérer les prix nouveaux</Link>
        </p>
      ) : (
        <div className="carte overflow-x-auto p-0">
          <table className="table-vinci min-w-[1000px]">
            <thead>
              <tr>
                <th>N°</th>
                <th>Intitulé</th>
                <th>OS</th>
                <th className="text-right">Montant</th>
                <th className="text-right">% préc.</th>
                <th className="w-28 text-right">% cumulé</th>
                <th className="text-right">Montant préc.</th>
                <th className="text-right">Montant mois</th>
                <th className="text-right">Montant cumulé</th>
              </tr>
            </thead>
            <tbody>
              {pnCalcules.map((p) => {
                const alerte = p.avancement > 100 + 1e-9 || p.avancement < p.avancementPrecedent - 1e-9
                return (
                  <tr key={p.id} style={alerte ? { backgroundColor: VINCI.rougeTresClair } : undefined}>
                    <td className="whitespace-nowrap">{p.numero}</td>
                    <td className="min-w-[220px]">{p.intitule}</td>
                    <td className="whitespace-nowrap text-xs">
                      {p.numeroOS || 'OS'}
                      {p.dateOS ? ` du ${p.dateOS.split('-').reverse().join('/')}` : ''}
                    </td>
                    <td className="num">
                      {formatMontant(p.montantBase)}
                      {!p.accepte && <span className="ml-1 rounded-sm bg-vinci-jaune-clair px-1 text-[10px] text-black" title="Montant accepté non renseigné : montant présenté utilisé">présenté</span>}
                    </td>
                    <td className="num">{formatNombreFR(p.avancementPrecedent, 1)} %</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <input
                          className="cell-input num"
                          style={alerte ? { borderColor: VINCI.rouge } : undefined}
                          inputMode="decimal"
                          value={saisiesPN[p.id] ?? ''}
                          placeholder="0"
                          disabled={lecture}
                          onChange={(e) => onChangePN(p.id, e.target.value)}
                          onBlur={() => void flush()}
                          aria-label={`Avancement cumulé ${p.numero} ${p.intitule}`}
                        />
                        <span className="text-xs">%</span>
                      </div>
                    </td>
                    <td className="num">{formatMontant(p.montantPrecedent)}</td>
                    <td className="num">{formatMontant(p.montantMois)}</td>
                    <td className="num font-semibold">{formatMontant(p.montantCumul)}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>TOTAL prix nouveaux</td>
                <td className="num">{formatMontant(totauxPN.base)}</td>
                <td colSpan={2} />
                <td className="num">{formatMontant(totauxPN.precedent)}</td>
                <td className="num">{formatMontant(totauxPN.mois)}</td>
                <td className="num">{formatMontant(totauxPN.cumul)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ── Sous-traitants ── */}
      <h2 className="mb-1 mt-8 text-lg font-bold text-vinci-bleu">Sous-traitants — {libelleMois(situation.mois, situation.annee)}</h2>
      <p className="mb-2 text-xs text-vinci-texte-secondaire">
        Saisissez le montant HT facturé par chaque sous-traitant pour ce mois : il est enregistré dans le Suivi ST (mêmes données).
        PD = paiement direct par le maître d&apos;ouvrage (déduit de la part revenant à l&apos;entreprise).
      </p>
      {stCalcules.length === 0 ? (
        <p className="text-sm text-vinci-texte-secondaire">Aucun sous-traitant sur ce projet.</p>
      ) : (
        <div className="carte overflow-x-auto p-0">
          <table className="table-vinci">
            <thead>
              <tr>
                <th>Sous-traitant</th>
                <th className="text-right">Montant total</th>
                <th className="text-right">Cumul préc.</th>
                <th className="w-36 text-right">Facturé du mois</th>
                <th className="text-right">Cumul facturé</th>
                <th className="text-right">Reste à facturer</th>
                <th className="text-right">% av.</th>
              </tr>
            </thead>
            <tbody>
              {stCalcules.map((r) => (
                <tr key={r.id} style={r.cumule > r.montantTotal + 1e-9 ? { backgroundColor: VINCI.rougeTresClair } : undefined}>
                  <td>
                    {r.nom}
                    {r.paiementDirect && <span className="ml-2 rounded-sm bg-vinci-bleu-tres-clair px-1 text-[10px] font-bold text-vinci-bleu-fonce">PD</span>}
                  </td>
                  <td className="num">{formatMontant(r.montantTotal)}</td>
                  <td className="num">{formatMontant(r.cumulPrecedent)}</td>
                  <td>
                    <input
                      className="cell-input num"
                      inputMode="decimal"
                      value={saisiesST[r.id] ?? ''}
                      placeholder="0"
                      disabled={lecture}
                      onChange={(e) => onChangeST(r.id, e.target.value)}
                      onBlur={() => void flush()}
                      aria-label={`Montant facturé du mois ${r.nom}`}
                    />
                  </td>
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
                <td className="num">{formatMontant(totalST.cumule - totalST.mois)}</td>
                <td className="num">{formatMontant(totalST.mois)}</td>
                <td className="num">{formatMontant(totalST.cumule)}</td>
                <td className="num">{formatMontant(totalST.reste)}</td>
                <td className="num">{totalST.total > 0 ? `${formatNombreFR((totalST.cumule / totalST.total) * 100, 1)} %` : ''}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ── Décompte ── */}
      <h2 className="mb-2 mt-8 text-lg font-bold text-vinci-bleu">Décompte de la situation</h2>
      <div className="carte max-w-3xl overflow-x-auto p-0">
        <table className="table-vinci">
          <thead>
            <tr>
              <th>Montants HT</th>
              <th className="text-right">Du mois</th>
              <th className="text-right">Cumulé</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Travaux du marché (détail estimatif)</td><td className="num">{formatMontant(totaux.mois)}</td><td className="num">{formatMontant(totaux.cumul)}</td></tr>
            <tr><td>Prix nouveaux (OS reçus)</td><td className="num">{formatMontant(totauxPN.mois)}</td><td className="num">{formatMontant(totauxPN.cumul)}</td></tr>
            <tr className="font-bold"><td>Total travaux</td><td className="num">{formatMontant(decompte.mois)}</td><td className="num">{formatMontant(decompte.cumul)}</td></tr>
            <tr><td>dont sous-traitants en paiement direct</td><td className="num">− {formatMontant(decompte.stPaiementDirectMois)}</td><td className="num">− {formatMontant(decompte.stPaiementDirectCumul)}</td></tr>
          </tbody>
          <tfoot>
            <tr><td>Montant revenant à l&apos;entreprise</td><td className="num">{formatMontant(decompte.titulaireMois)}</td><td className="num">{formatMontant(decompte.titulaireCumul)}</td></tr>
          </tfoot>
        </table>
      </div>
    </main>
  )
}
