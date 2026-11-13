'use client'
import { useMemo, useState } from 'react'
import {
  ArrowDown, BadgeCheck, CheckCircle2, ChevronRight, Download, Gavel, LifeBuoy, ListChecks, Scale, ShieldAlert, Timer, XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { VINCI, VINCI_SECONDAIRE } from '@/lib/design-tokens'
import { useExportPDF } from '@/hooks/useExportPDF'
import { useProfilStore } from '@/stores/profil'
import {
  ASSURANCES, ASSURANCES_FRISE, BONS_REFLEXES, FIN_FRISE, JALONS_FRISE, LIBELLE_CATEGORIE, LIBELLE_NATURE, OUVRAGES_NON_SOUMIS, PHASES_FRISE,
  PROCEDURE_DO, QUE_FAIRE_SINISTRE, REGLES_GROUPE_SINISTRE, SOURCE_GUIDE, VERIF_ATTESTATION_ST, libelleBarre, texteBarre,
  type Assurance, type BlocReflexes, type CategorieAssurance, type NatureCouverture, type Reflexe,
} from '@/lib/boite-a-outils/assurances'
import { SOURCES_PAR_OUTIL } from '@/lib/boite-a-outils/sources'
import { AlerteJaune } from './AlerteJaune'
import { AideDecisionAssurances } from './AideDecisionAssurances'
import { PanoramaCouvertures } from './PanoramaCouvertures'
import { SITUATION_DEFAUT, recommander, type CleGarantie, type Situation } from '@/lib/assurances/aide-decision'

const pct = (x: number) => `${(x / FIN_FRISE) * 100}%`

/** Style d'une barre selon la nature : plein (obligatoire), pointillé (facultative), hachuré (garantie légale). */
function styleBarre(a: Pick<Assurance, 'nature' | 'couleur'> & Partial<Assurance>, partiel?: boolean): React.CSSProperties {
  const c = VINCI_SECONDAIRE[a.couleur]
  const base: React.CSSProperties = { opacity: partiel ? 0.5 : 1 }
  if (a.nature === 'obligatoire') return { ...base, backgroundColor: c.base, border: `2px solid ${c.base}`, color: texteBarre(a as Assurance) }
  if (a.nature === 'facultative') return { ...base, backgroundColor: c.clair, border: `2px dashed ${c.base}`, color: VINCI.noir }
  return {
    ...base,
    backgroundImage: `repeating-linear-gradient(135deg, ${c.base} 0 6px, ${c.clair} 6px 12px)`,
    border: `2px solid ${c.base}`,
    color: VINCI.noir,
  }
}

function PastilleNature({ nature }: { nature: NatureCouverture }) {
  const cls =
    nature === 'obligatoire'
      ? 'bg-vinci-rouge text-white'
      : nature === 'facultative'
        ? 'bg-vinci-gris-clair text-black border border-vinci-gris-bordure'
        : 'bg-vinci-vert-clair text-black border border-vinci-vert'
  return <span className={`inline-block rounded-sm px-1.5 py-0.5 text-[11px] font-bold uppercase ${cls}`}>{LIBELLE_NATURE[nature]}</span>
}

function Legende() {
  const ex = (nature: NatureCouverture) => styleBarre({ nature, couleur: 'bleuMoyen' })
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs">
      {(['obligatoire', 'facultative', 'garantie_legale'] as const).map((n) => (
        <span key={n} className="flex items-center gap-1.5">
          <span className="inline-block h-3.5 w-8 rounded-sm" style={ex(n)} aria-hidden />
          {LIBELLE_NATURE[n]}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3.5 w-8 rounded-sm" style={{ ...ex('obligatoire'), opacity: 0.5 }} aria-hidden />
        Couverture conditionnelle / selon contrat
      </span>
    </div>
  )
}

function Frise({ surligner }: { surligner: CleGarantie[] }) {
  const actif = (cle: string) => surligner.length === 0 || surligner.includes(cle as CleGarantie)
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[860px]">
        {/* En-tête des phases */}
        <div className="grid grid-cols-[230px_1fr] items-end">
          <div />
          <div className="relative h-10">
            {PHASES_FRISE.map((p, i) => (
              <div
                key={p.libelle}
                className="absolute bottom-0 flex h-8 items-center justify-center border-r border-white px-1 text-center text-[11px] font-bold leading-tight text-white"
                style={{ left: pct(p.de), width: pct(p.a - p.de), backgroundColor: i < 2 ? VINCI.bleu : VINCI.bleuFonce }}
              >
                {p.libelle}
              </div>
            ))}
          </div>
        </div>
        {/* Lignes (les assurances sans rattachement à une phase — automobile, drone… — ne figurent pas sur la frise) */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-[230px] right-0">
            {JALONS_FRISE.map((j) => (
              <div
                key={j.libelle}
                className="absolute inset-y-0"
                style={{ left: pct(j.x), borderLeft: j.libelle === 'Réception' ? `3px solid ${VINCI.rouge}` : `1px dashed ${VINCI.gris}` }}
              />
            ))}
          </div>
          {ASSURANCES_FRISE.map((a, i) => (
            <div
              key={a.cle}
              data-surligne={surligner.includes(a.cle as CleGarantie) || undefined}
              className={`grid grid-cols-[230px_1fr] items-center transition-opacity ${i % 2 ? 'bg-vinci-gris-clair' : 'bg-white'} ${actif(a.cle) ? '' : 'opacity-35'} ${surligner.includes(a.cle as CleGarantie) ? 'outline outline-2 -outline-offset-2 outline-vinci-rouge' : ''}`}
            >
              <div className="px-2 py-1.5 text-xs">
                <a href={`#assurance-${a.cle}`} className="font-bold text-vinci-bleu hover:underline">
                  {a.sigle ? `${a.sigle} — ` : ''}{a.nom}
                </a>
              </div>
              <div className="relative h-9">
                {a.segments.map((s, k) => (
                  <div
                    key={k}
                    title={s.note ?? a.periode}
                    className="absolute top-1.5 flex h-6 items-center overflow-hidden rounded-sm px-1.5 text-[10.5px] font-semibold leading-none"
                    style={{ left: pct(s.de), width: pct(s.a - s.de), ...styleBarre(a, s.partiel) }}
                  >
                    <span className="truncate">{s.note ?? libelleBarre(a)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-[230px_1fr]">
          <div />
          <div className="relative h-6">
            {JALONS_FRISE.map((j) => (
              <span
                key={j.libelle}
                className={`absolute top-1 -translate-x-1/2 whitespace-nowrap text-[11px] ${j.libelle === 'Réception' ? 'font-bold text-vinci-rouge' : 'text-vinci-texte-secondaire'}`}
                style={{ left: pct(j.x) }}
              >
                {j.libelle}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────── Fiches ─────────────────────────── */

function ListeIcone({ items, ok }: { items: string[]; ok: boolean }) {
  const Icone = ok ? CheckCircle2 : XCircle
  return (
    <ul className="space-y-1">
      {items.map((t) => (
        <li key={t} className="flex items-start gap-1.5">
          <Icone className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', ok ? 'text-vinci-vert' : 'text-vinci-rouge')} aria-hidden />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  )
}

function CarteAssurance({ a }: { a: Assurance }) {
  const c = VINCI_SECONDAIRE[a.couleur]
  const lignes: [string, string][] = [
    ['Obligatoire ?', a.obligatoire],
    ['Souscripteur', a.souscripteur],
    ['Bénéficiaire', a.beneficiaire],
    ['Objet', a.objet],
    ['Déclenchement', a.declenchement],
    ['Période', a.periode],
    ['Références', a.references],
  ]
  return (
    <article id={`assurance-${a.cle}`} className="carte flex scroll-mt-40 flex-col gap-3" style={{ borderTop: `4px solid ${c.base}` }}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-base font-bold text-vinci-bleu">
          {a.sigle && <span className="mr-1">{a.sigle} —</span>}
          {a.nom}
        </h4>
        <div className="flex flex-wrap items-center gap-1.5">
          {a.segments.length === 0 && (
            <span className="rounded-sm border border-vinci-gris-bordure px-1.5 py-0.5 text-[10.5px] font-semibold text-vinci-texte-secondaire">Hors frise</span>
          )}
          <PastilleNature nature={a.nature} />
        </div>
      </header>
      <dl className="grid grid-cols-[110px_1fr] gap-x-2 gap-y-1 text-[13px]">
        {lignes.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="font-semibold text-vinci-texte-secondaire">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>

      {!!(a.garantit?.length || a.neGarantitPas?.length) && (
        <div className="grid gap-2 text-[12.5px] sm:grid-cols-2">
          {a.garantit && a.garantit.length > 0 && (
            <div className="rounded-md border border-vinci-vert bg-vinci-vert-clair/60 p-2">
              <p className="mb-1 font-bold text-black">Ce que l’assureur garantit</p>
              <ListeIcone items={a.garantit} ok />
            </div>
          )}
          {a.neGarantitPas && a.neGarantitPas.length > 0 && (
            <div className="rounded-md border border-vinci-rouge/40 bg-vinci-rouge-tres-clair p-2">
              <p className="mb-1 font-bold text-black">Ce que l’assureur ne garantit pas</p>
              <ListeIcone items={a.neGarantitPas} ok={false} />
            </div>
          )}
        </div>
      )}

      {a.programme && a.programme.length > 0 && (
        <details className="group rounded-md border border-vinci-gris-bordure text-[12.5px]">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-md bg-vinci-gris-clair px-2 py-1.5 font-bold text-vinci-bleu-fonce">
            <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" aria-hidden />
            <Scale className="h-4 w-4" aria-hidden /> Programme du groupe : plafonds et franchises
          </summary>
          <table className="w-full border-collapse">
            <tbody>
              {a.programme.map((l, i) => (
                <tr key={l.libelle} className={i % 2 ? 'bg-vinci-gris-clair' : 'bg-white'}>
                  <th scope="row" className="w-[38%] px-2 py-1 text-left align-top font-semibold">{l.libelle}</th>
                  <td className="px-2 py-1 align-top">{l.valeur}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}

      {a.regleGroupe && a.regleGroupe.length > 0 && (
        <div className="rounded-md border border-vinci-rouge/30 border-l-4 border-l-vinci-rouge bg-white p-2 text-[13px]">
          <p className="mb-1 flex items-center gap-1 font-bold text-vinci-rouge">
            <Gavel className="h-4 w-4" aria-hidden /> Règles groupe
          </p>
          <ul className="list-disc space-y-0.5 pl-5">{a.regleGroupe.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      )}

      {a.attention.length > 0 && (
        <div className="rounded-md bg-vinci-bleu-tres-clair p-2 text-[13px]">
          <p className="mb-1 flex items-center gap-1 font-bold text-vinci-bleu-fonce">
            <ShieldAlert className="h-4 w-4" aria-hidden /> Points d’attention conducteur de travaux
          </p>
          <ul className="list-disc space-y-0.5 pl-5">{a.attention.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      )}
      {a.aVerifier && <p className="rounded-sm bg-vinci-jaune-clair px-2 py-1 text-xs font-semibold text-vinci-orange">À vérifier : {a.aVerifier}</p>}
    </article>
  )
}

function GroupeFiches({ categorie }: { categorie: CategorieAssurance }) {
  const liste = ASSURANCES.filter((a) => a.categorie === categorie)
  const L = LIBELLE_CATEGORIE[categorie]
  return (
    <section className="space-y-3" aria-labelledby={`fiches-${categorie}`}>
      <div className="flex flex-wrap items-end justify-between gap-2 border-b-2 border-vinci-bleu pb-1">
        <h3 id={`fiches-${categorie}`} className="text-lg font-bold text-vinci-bleu">{L.titre}</h3>
        <p className="text-xs text-vinci-texte-secondaire">{L.sous} · {liste.length} fiches</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {liste.map((a) => <CarteAssurance key={a.cle} a={a} />)}
      </div>
    </section>
  )
}

/* ─────────────────────────── Bons réflexes avant la remise du prix ─────────────────────────── */

function CarteReflexe({ r, n }: { r: Reflexe; n: number }) {
  const c = VINCI_SECONDAIRE[r.couleur]
  return (
    <li className="flex flex-col overflow-hidden rounded-md border border-vinci-gris-bordure bg-white shadow-sm">
      <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: c.clair, borderBottom: `3px solid ${c.base}` }}>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-vinci-bleu text-xs font-bold text-white">{n}</span>
        <span className="text-[13px] font-bold uppercase tracking-wide text-black">{r.theme}</span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3 text-[13px]">
        <p>
          <span className="mr-1 rounded-sm bg-vinci-gris-clair px-1 text-[11px] font-bold text-vinci-texte-secondaire">SI</span>
          {r.si}
        </p>
        <ArrowDown className="mx-auto h-4 w-4 text-vinci-bleu" aria-hidden />
        <p className="flex-1 rounded-md bg-vinci-bleu-tres-clair p-2 text-vinci-bleu-fonce">
          <span className="mr-1 rounded-sm bg-vinci-bleu px-1 text-[11px] font-bold text-white">ALORS</span>
          {r.alors}
        </p>
      </div>
      <p className="border-l-4 border-vinci-rouge bg-vinci-rouge-tres-clair px-3 py-2 text-[12.5px]">
        <strong className="text-vinci-rouge">Sanction : </strong>
        {r.sanction}
      </p>
    </li>
  )
}

function BonsReflexes() {
  const [cle, setCle] = useState<BlocReflexes['cle']>('soumis')
  const bloc = BONS_REFLEXES.find((b) => b.cle === cle) ?? BONS_REFLEXES[0]
  return (
    <section className="overflow-hidden rounded-lg border border-vinci-gris-bordure bg-white shadow-sm" aria-labelledby="bons-reflexes">
      <div className="px-5 py-4 text-white" style={{ background: `linear-gradient(90deg, ${VINCI.bleu}, ${VINCI.bleuFonce})` }}>
        <h3 id="bons-reflexes" className="flex items-center gap-2 text-lg font-bold">
          <BadgeCheck className="h-5 w-5" aria-hidden /> Les bons réflexes avant la remise du prix
        </h3>
        <p className="text-[13px] opacity-90">Les questions à se poser (et à soumettre à la Direction des Assurances) avant de remettre une offre, avec leurs sanctions.</p>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div role="tablist" aria-label="Type d’ouvrage" className="inline-flex rounded-md border border-vinci-bleu p-0.5">
            {BONS_REFLEXES.map((b) => (
              <button
                key={b.cle}
                type="button"
                role="tab"
                aria-selected={b.cle === cle}
                onClick={() => setCle(b.cle)}
                className={cn(
                  'rounded px-3 py-1.5 text-sm font-semibold transition-colors',
                  b.cle === cle ? 'bg-vinci-bleu text-white' : 'text-vinci-bleu hover:bg-vinci-bleu-tres-clair',
                )}
              >
                {b.titre}
              </button>
            ))}
          </div>
          <p className="text-xs text-vinci-texte-secondaire">{bloc.definition}</p>
        </div>

        <p className="rounded-full border border-vinci-bleu bg-vinci-bleu-tres-clair px-4 py-1.5 text-center text-sm font-bold uppercase tracking-wide text-vinci-bleu-fonce">
          {bloc.principe}
        </p>

        <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" role="tabpanel" aria-label={bloc.titre}>
          {bloc.reflexes.map((r, i) => <CarteReflexe key={r.theme + i} r={r} n={i + 1} />)}
        </ol>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-md border border-vinci-gris-bordure p-3 text-[13px]">
            <p className="mb-2 flex items-center gap-1.5 font-bold text-vinci-bleu-fonce">
              <Scale className="h-4 w-4" aria-hidden /> Ouvrage soumis ou non ? — liste légale (C. assur. art. L243-1-1)
            </p>
            <p className="mb-1 text-xs font-bold uppercase text-vinci-texte-secondaire">Toujours non soumis</p>
            <ul className="mb-2 list-disc space-y-0.5 pl-5">{OUVRAGES_NON_SOUMIS.toujours.map((t) => <li key={t}>{t}</li>)}</ul>
            <p className="mb-1 text-xs font-bold uppercase text-vinci-texte-secondaire">Non soumis, sauf s’ils sont accessoires à un ouvrage soumis</p>
            <ul className="mb-2 list-disc space-y-0.5 pl-5">{OUVRAGES_NON_SOUMIS.saufAccessoire.map((t) => <li key={t}>{t}</li>)}</ul>
            <p className="rounded-sm bg-vinci-gris-clair px-2 py-1 text-xs">{OUVRAGES_NON_SOUMIS.existants}</p>
          </div>
          <div className="rounded-md border border-vinci-gris-bordure p-3 text-[13px]">
            <p className="mb-2 flex items-center gap-1.5 font-bold text-vinci-bleu-fonce">
              <ListChecks className="h-4 w-4" aria-hidden /> Attestation décennale d’un sous-traitant : 10 points à vérifier
            </p>
            <ol className="space-y-1">
              {VERIF_ATTESTATION_ST.map((t, i) => (
                <li key={t} className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-vinci-bleu text-[11px] font-bold text-vinci-bleu">{i + 1}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── Sinistres ─────────────────────────── */

function ProcedureDO() {
  return (
    <div className="rounded-md border border-vinci-gris-bordure p-3">
      <p className="mb-3 flex items-center gap-1.5 font-bold text-vinci-bleu-fonce">
        <Timer className="h-4 w-4" aria-hidden /> Instruction d’un sinistre dommages-ouvrage — délais légaux (C. assur. art. L242-1 et annexe II à l’art. A243-1)
      </p>
      <ol className="relative grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <span className="absolute left-0 right-0 top-4 hidden h-0.5 bg-vinci-bleu-clair xl:block" aria-hidden />
        {PROCEDURE_DO.map((e) => (
          <li key={e.jalon} className="relative flex flex-col items-start gap-1 xl:items-center xl:text-center">
            <span
              className={cn(
                'relative z-10 rounded-full border-2 px-2.5 py-1 text-xs font-bold',
                e.jalon === 'J + 60' ? 'border-vinci-rouge bg-vinci-rouge text-white' : 'border-vinci-bleu bg-white text-vinci-bleu',
              )}
            >
              {e.jalon}
            </span>
            <span className="text-[13px] font-bold">{e.titre}</span>
            <span className="text-xs text-vinci-texte-secondaire">{e.texte}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 rounded-sm bg-vinci-jaune-clair px-2 py-1 text-xs font-semibold">
        Sinistre dans l’année qui suit la réception : la DO n’est saisie qu’après une mise en demeure de l’entreprise restée infructueuse.
      </p>
    </div>
  )
}

export function AssurancesClient() {
  const profil = useProfilStore((s) => s.profil)
  const { exportAvecGuard, isExporting } = useExportPDF()
  const [situation, setSituation] = useState<Situation>(SITUATION_DEFAUT)
  const reco = useMemo(() => recommander(situation), [situation])

  const exporter = () =>
    exportAvecGuard(async () => {
      const [{ AssurancesPDF }, { genererEtTelechargerPDF }] = await Promise.all([
        import('@/lib/pdf/assurances'), import('@/lib/pdf/telecharger'),
      ])
      const sources = (SOURCES_PAR_OUTIL.assurances ?? []).map((s) => `${s.texte} (${s.version})`).join(' ; ')
      await genererEtTelechargerPDF(<AssurancesPDF profil={profil} sources={sources} />, 'Assurances_chantier')
    })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-vinci-texte-secondaire">Avant, pendant et après la réception : qui souscrit, qui est couvert, et comment réagir.</p>
        <Button onClick={exporter} disabled={isExporting}>
          <Download className="mr-1 h-4 w-4" /> {isExporting ? 'Export…' : 'Exporter en PDF'}
        </Button>
      </div>

      <AlerteJaune>
        Aide-mémoire : les obligations dépendent de la nature de l’ouvrage et du maître d’ouvrage. Vérifiez l’article « Assurances » du CCAP et
        les attestations de chaque intervenant. Plafonds, franchises et règles « groupe » : {SOURCE_GUIDE} — consultez la Direction des
        Assurances pour tout cas particulier. La GPA et la garantie biennale sont des garanties légales, pas des assurances.
      </AlerteJaune>

      <PanoramaCouvertures />

      <AideDecisionAssurances situation={situation} onChange={setSituation} reco={reco} />

      <section className="carte space-y-3" aria-labelledby="frise-assurances">
        <h3 id="frise-assurances" className="text-lg font-bold text-vinci-bleu">Frise des couvertures — selon votre situation</h3>
        {reco.surligner.length > 0 && (
          <p className="text-xs text-vinci-texte-secondaire">
            Encadrées en rouge : les garanties correspondant à la situation choisie dans l’aide à la décision.
          </p>
        )}
        <Legende />
        <Frise surligner={reco.surligner} />
        <p className="text-xs text-vinci-texte-secondaire">
          Échelle non proportionnelle au temps. Survolez une barre pour le détail ; cliquez sur un nom pour sa fiche. Les assurances sans lien avec
          une phase du chantier (automobile, drone et cyber) ne figurent que dans les fiches.
        </p>
      </section>

      <BonsReflexes />

      <GroupeFiches categorie="ouvrage" />
      <GroupeFiches categorie="entreprise" />

      <section className="carte space-y-4" aria-labelledby="sinistre">
        <h3 id="sinistre" className="flex items-center gap-2 text-lg font-bold text-vinci-bleu">
          <LifeBuoy className="h-5 w-5" aria-hidden /> Que faire en cas de sinistre ?
        </h3>
        <div className="rounded-md border border-vinci-rouge/30 border-l-4 border-l-vinci-rouge bg-vinci-rouge-tres-clair/50 p-3 text-[13px]">
          <p className="mb-1 flex items-center gap-1 font-bold text-vinci-rouge"><Gavel className="h-4 w-4" aria-hidden /> Règles groupe de déclaration</p>
          <ul className="list-disc space-y-0.5 pl-5">{REGLES_GROUPE_SINISTRE.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {QUE_FAIRE_SINISTRE.map((p) => (
            <div key={p.phase} className="rounded-md border border-vinci-gris-bordure p-3" style={{ borderTop: `4px solid ${VINCI_SECONDAIRE[p.couleur].base}` }}>
              <p className="mb-2 font-bold">{p.phase}</p>
              <ol className="list-decimal space-y-1 pl-5 text-[13px]">
                {p.etapes.map((e) => <li key={e}>{e}</li>)}
              </ol>
            </div>
          ))}
        </div>
        <ProcedureDO />
      </section>
    </div>
  )
}
