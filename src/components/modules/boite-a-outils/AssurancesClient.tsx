'use client'
import { useMemo, useState } from 'react'
import { Download, LifeBuoy, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VINCI, VINCI_SECONDAIRE } from '@/lib/design-tokens'
import { useExportPDF } from '@/hooks/useExportPDF'
import { useProfilStore } from '@/stores/profil'
import {
  ASSURANCES, FIN_FRISE, JALONS_FRISE, LIBELLE_NATURE, PHASES_FRISE, QUE_FAIRE_SINISTRE, libelleBarre, texteBarre, type Assurance,
  type NatureCouverture,
} from '@/lib/boite-a-outils/assurances'
import { SOURCES_PAR_OUTIL } from '@/lib/boite-a-outils/sources'
import { AlerteJaune } from './AlerteJaune'
import { AideDecisionAssurances } from './AideDecisionAssurances'
import { PanoramaCouvertures } from './PanoramaCouvertures'
import { SITUATION_DEFAUT, recommander, type CleGarantie, type Situation } from '@/lib/assurances/aide-decision'

const pct = (x: number) => `${(x / FIN_FRISE) * 100}%`

/** Style d'une barre selon la nature : plein (obligatoire), pointillé (facultative), hachuré (garantie légale). */
function styleBarre(a: Assurance, partiel?: boolean): React.CSSProperties {
  const c = VINCI_SECONDAIRE[a.couleur]
  const base: React.CSSProperties = { opacity: partiel ? 0.5 : 1 }
  if (a.nature === 'obligatoire') return { ...base, backgroundColor: c.base, border: `2px solid ${c.base}`, color: texteBarre(a) }
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
  const ex = (nature: NatureCouverture) => styleBarre({ ...ASSURANCES[0], nature, couleur: 'bleuMoyen' })
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
        <div className="grid grid-cols-[210px_1fr] items-end">
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
        {/* Lignes */}
        <div className="relative">
          {/* Jalons verticaux (en arrière-plan) */}
          <div className="pointer-events-none absolute inset-y-0 left-[210px] right-0">
            {JALONS_FRISE.map((j) => (
              <div
                key={j.libelle}
                className="absolute inset-y-0"
                style={{ left: pct(j.x), borderLeft: j.libelle === 'Réception' ? `3px solid ${VINCI.rouge}` : `1px dashed ${VINCI.gris}` }}
              />
            ))}
          </div>
          {ASSURANCES.map((a, i) => (
            <div
              key={a.cle}
              data-surligne={surligner.includes(a.cle as CleGarantie) || undefined}
              className={`grid grid-cols-[210px_1fr] items-center transition-opacity ${i % 2 ? 'bg-vinci-gris-clair' : 'bg-white'} ${actif(a.cle) ? '' : 'opacity-35'} ${surligner.includes(a.cle as CleGarantie) ? 'outline outline-2 -outline-offset-2 outline-vinci-rouge' : ''}`}
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
        {/* Jalons (légende basse) */}
        <div className="grid grid-cols-[210px_1fr]">
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
    <article id={`assurance-${a.cle}`} className="carte scroll-mt-40" style={{ borderTop: `4px solid ${c.base}` }}>
      <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-bold text-vinci-bleu">
          {a.sigle && <span className="mr-1">{a.sigle} —</span>}
          {a.nom}
        </h3>
        <PastilleNature nature={a.nature} />
      </header>
      <dl className="grid grid-cols-[110px_1fr] gap-x-2 gap-y-1 text-[13px]">
        {lignes.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="font-semibold text-vinci-texte-secondaire">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      {a.attention.length > 0 && (
        <div className="mt-3 rounded-md bg-vinci-bleu-tres-clair p-2 text-[13px]">
          <p className="mb-1 flex items-center gap-1 font-bold text-vinci-bleu-fonce">
            <ShieldAlert className="h-4 w-4" aria-hidden /> Points d’attention conducteur de travaux
          </p>
          <ul className="list-disc space-y-0.5 pl-5">
            {a.attention.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      )}
      {a.aVerifier && <p className="mt-2 rounded-sm bg-vinci-jaune-clair px-2 py-1 text-xs font-semibold text-vinci-orange">À vérifier : {a.aVerifier}</p>}
    </article>
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="page-titre">Assurances et garanties d’un chantier</h2>
          <p className="text-sm text-vinci-texte-secondaire">Qui assure quoi, pour qui et quand : avant, pendant et après la réception.</p>
        </div>
        <Button onClick={exporter} disabled={isExporting}>
          <Download className="mr-1 h-4 w-4" /> {isExporting ? 'Export…' : 'Exporter en PDF'}
        </Button>
      </div>

      <AlerteJaune>
        Aide-mémoire général : les obligations dépendent de la nature de l’ouvrage et du maître d’ouvrage. Vérifiez l’article « Assurances » du CCAP
        et les attestations de chaque intervenant. La GPA et la garantie biennale sont des garanties légales, pas des assurances.
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
        <p className="text-xs text-vinci-texte-secondaire">Échelle non proportionnelle au temps. Survolez une barre pour le détail ; cliquez sur un nom pour sa fiche.</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2" aria-label="Fiches assurances">
        {ASSURANCES.map((a) => (
          <CarteAssurance key={a.cle} a={a} />
        ))}
      </section>

      <section className="carte" aria-labelledby="sinistre">
        <h3 id="sinistre" className="mb-3 flex items-center gap-2 text-lg font-bold text-vinci-bleu">
          <LifeBuoy className="h-5 w-5" aria-hidden /> Que faire en cas de sinistre ?
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          {QUE_FAIRE_SINISTRE.map((p) => (
            <div key={p.phase} className="rounded-md border border-vinci-gris-bordure p-3" style={{ borderTop: `4px solid ${VINCI_SECONDAIRE[p.couleur].base}` }}>
              <p className="mb-2 font-bold">{p.phase}</p>
              <ol className="list-decimal space-y-1 pl-5 text-[13px]">
                {p.etapes.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
