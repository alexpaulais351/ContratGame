'use client'
import { useMemo, useState } from 'react'
import { CalendarClock, Download, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { cn, formatDateFR } from '@/lib/utils'
import { useExportPDF } from '@/hooks/useExportPDF'
import { useProfilStore } from '@/stores/profil'
import { VARIANTES_DGD, calculerEcheancesDGD, varianteDGD, type Etape, type ResultatEtape } from '@/lib/boite-a-outils/dgd'
import { estDateValide, isoVersDateLocale, JOURS_SEMAINE, jourSemaine } from '@/lib/boite-a-outils/dates'
import { SOURCES_PAR_OUTIL } from '@/lib/boite-a-outils/sources'
import { SchemaDGD } from './SchemaDGD'
import { AlerteJaune } from './AlerteJaune'

const fr = (iso: string) => formatDateFR(isoVersDateLocale(iso))
const BRANCHES: Record<NonNullable<Etape['branche']>, string> = {
  nominal: 'Chemin nominal',
  reserves: 'DG contesté (réserves)',
  carence: 'Carence du maître d’ouvrage',
  retard: 'Retard du titulaire',
}

function DateResultat({ e, r }: { e: Etape; r: ResultatEtape | undefined }) {
  if (!r?.date) return <span className="text-vinci-texte-secondaire">—</span>
  return (
    <span className="whitespace-nowrap">
      {e.typeDate === 'apartir' && <span className="text-xs text-vinci-texte-secondaire">à partir du </span>}
      <span className="font-semibold">{fr(r.date)}</span>
      <span className="ml-1 text-xs text-vinci-texte-secondaire">({JOURS_SEMAINE[jourSemaine(r.date)]})</span>
      {r.reportee && r.brute && <span className="block text-xs text-vinci-texte-secondaire">reporté du {fr(r.brute)}</span>}
      {r.reelle && (
        <span className={cn('block text-xs', r.depassement ? 'font-bold text-vinci-rouge' : 'text-vinci-vert')}>
          réel : {fr(r.reelle)}{r.depassement ? ' — hors délai' : ''}
        </span>
      )}
    </span>
  )
}

export function ProcedureDGDClient() {
  const profil = useProfilStore((s) => s.profil)
  const { exportAvecGuard, isExporting } = useExportPDF()
  const [cle, setCle] = useState<string>('ccag2021')
  const [depart, setDepart] = useState('')
  const [reelles, setReelles] = useState<Record<string, string>>({})
  const [report, setReport] = useState(true)
  const v = varianteDGD(cle)

  const resultats = useMemo(
    () => (estDateValide(depart) ? calculerEcheancesDGD(v, depart, reelles, report) : null),
    [v, depart, reelles, report],
  )
  const parCle = new Map((resultats ?? []).map((r) => [r.cle, r]))
  const saisissables = v.etapes.filter((e) => e.saisieReelle)

  const changerVariante = (k: string) => {
    setCle(k)
    setReelles({})
  }

  const exporter = () =>
    exportAvecGuard(async () => {
      const [{ ProcedureDGDPDF }, { genererEtTelechargerPDF }, { nomFichierSur }] = await Promise.all([
        import('@/lib/pdf/procedure-dgd'), import('@/lib/pdf/telecharger'), import('@/lib/pdf/format'),
      ])
      const sources = (SOURCES_PAR_OUTIL['procedure-dgd'] ?? []).map((s) => `${s.texte} (${s.version})`).join(' ; ')
      await genererEtTelechargerPDF(
        <ProcedureDGDPDF variante={v} profil={profil} depart={estDateValide(depart) ? depart : null} resultats={resultats} sources={sources} />,
        `Procedure_DGD_${nomFichierSur(v.libelle)}`,
      )
    })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="page-titre">Procédure de décompte général définitif (DGD)</h2>
          <p className="text-sm text-vinci-texte-secondaire">Du PV de réception au DGD : délais, cas de carence et contestation.</p>
        </div>
        <Button onClick={exporter} disabled={isExporting}>
          <Download className="mr-1 h-4 w-4" /> {isExporting ? 'Export…' : 'Exporter en PDF'}
        </Button>
      </div>

      <div role="radiogroup" aria-label="Référentiel" className="flex flex-wrap gap-2">
        {VARIANTES_DGD.map((x) => (
          <button
            key={x.cle}
            type="button"
            role="radio"
            aria-checked={x.cle === cle}
            onClick={() => changerVariante(x.cle)}
            className={cn(
              'min-h-11 rounded-md border px-4 py-2 text-sm font-semibold transition-colors',
              x.cle === cle
                ? 'border-vinci-bleu bg-vinci-bleu text-white'
                : 'border-vinci-bleu bg-white text-vinci-bleu hover:bg-vinci-bleu-tres-clair',
            )}
          >
            {x.libelle}
            {x.cle === 'ccag2021' && <span className="ml-1 text-xs font-normal">(par défaut)</span>}
          </button>
        ))}
      </div>

      {v.alerte && <AlerteJaune>{v.alerte}</AlerteJaune>}

      <section className="carte space-y-3">
        <div>
          <h3 className="text-lg font-bold text-vinci-bleu">{v.titre}</h3>
          <p className="text-xs text-vinci-texte-secondaire">{v.reference}</p>
        </div>
        <SchemaDGD schema={v.schema} titre={v.titre} />
        <p className="flex items-start gap-2 text-xs text-vinci-texte-secondaire">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            Flèches jaunes : délais. En haut : chemin nominal. En vert : DG contesté (réserves + mémoire). En gris : carence du maître d’ouvrage.{' '}
            {v.avertissement}
          </span>
        </p>
      </section>

      <section className="carte space-y-4" aria-labelledby="calc-dgd">
        <h3 id="calc-dgd" className="flex items-center gap-2 text-lg font-bold text-vinci-bleu">
          <CalendarClock className="h-5 w-5" aria-hidden /> Calculateur des dates limites
        </h3>
        {v.alerte && <AlerteJaune>{v.alerte}</AlerteJaune>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label htmlFor="dgd-depart">{v.departLibelle}</Label>
            <Input id="dgd-depart" type="date" value={depart} onChange={(e) => setDepart(e.target.value)} />
          </div>
          {saisissables.map((e) => (
            <div key={e.cle}>
              <Label htmlFor={`dgd-${e.cle}`} className="line-clamp-2" title={e.etape}>
                Date réelle (facultatif) : {e.cle === 'pdf' ? 'remise du PDF' : e.cle === 'dg' ? 'notification du DG' : e.cle === 'renvoi' ? 'renvoi du DG / mémoire' : e.cle === 'decision' ? 'réponse au mémoire' : 'projet de DG du titulaire'}
              </Label>
              <Input
                id={`dgd-${e.cle}`}
                type="date"
                value={reelles[e.cle] ?? ''}
                onChange={(ev) => setReelles((r) => ({ ...r, [e.cle]: ev.target.value }))}
                disabled={!estDateValide(depart)}
              />
            </div>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={report} onCheckedChange={(c) => setReport(c === true)} />
          Reporter au premier jour ouvrable une échéance tombant un samedi, un dimanche ou un jour férié (CCAG 2021 art. 3.2.4)
        </label>
        {!resultats && <p className="text-sm text-vinci-texte-secondaire">Saisissez la date de départ pour afficher les échéances dans le tableau ci-dessous.</p>}
      </section>

      <section className="space-y-2" aria-labelledby="recap-dgd">
        <h3 id="recap-dgd" className="text-lg font-bold text-vinci-bleu">Tableau récapitulatif</h3>
        {v.alerte && <AlerteJaune>{v.alerte}</AlerteJaune>}
        <div className="overflow-x-auto rounded-md border border-vinci-gris-bordure">
          <table className="table-vinci min-w-[900px]">
            <thead>
              <tr>
                <th>Étape</th>
                <th>Acteur</th>
                <th>Délai</th>
                <th>Point de départ</th>
                <th>Article</th>
                <th>Date calculée</th>
              </tr>
            </thead>
            <tbody>
              {v.etapes.map((e) => (
                <tr key={e.cle}>
                  <td className="max-w-[340px]">
                    {e.branche && e.branche !== 'nominal' && (
                      <span className="mb-0.5 block text-[11px] font-bold uppercase text-vinci-texte-secondaire">{BRANCHES[e.branche]}</span>
                    )}
                    {e.etape}
                    {e.note && <span className="mt-0.5 block text-xs text-vinci-texte-secondaire">{e.note}</span>}
                  </td>
                  <td>{e.acteur}</td>
                  <td className="whitespace-nowrap font-bold">{e.delaiTexte}</td>
                  <td>{e.pointDepart}</td>
                  <td className="text-xs">{e.article}</td>
                  <td><DateResultat e={e} r={parCle.get(e.cle)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
