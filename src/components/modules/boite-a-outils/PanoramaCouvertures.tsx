'use client'
import { useState } from 'react'
import { CalendarClock, Flag, HardHat, ShieldCheck } from 'lucide-react'
import { VINCI, VINCI_SECONDAIRE } from '@/lib/design-tokens'
import { ASSURANCES, LIBELLE_NATURE, PHASES_FRISE, type Assurance } from '@/lib/boite-a-outils/assurances'

/** Icône et sous-titre de chaque phase du panorama. */
const DETAIL_PHASES = [
  { icone: Flag, sous: 'Préparation, signature du marché' },
  { icone: HardHat, sous: 'Exécution jusqu’à la réception' },
  { icone: ShieldCheck, sous: 'Parfait achèvement' },
  { icone: CalendarClock, sous: 'Bon fonctionnement' },
  { icone: CalendarClock, sous: 'Décennale' },
]

const JALONS = ['Signature', 'Ouverture du chantier', 'Réception', '+1 an', '+2 ans', '+10 ans']

type Actif = { a: Assurance; partiel: boolean }

function assurancesDeLaPhase(de: number, a: number): Actif[] {
  return ASSURANCES.flatMap((x) => {
    const segs = x.segments.filter((s) => s.de < a && s.a > de)
    if (segs.length === 0) return []
    return [{ a: x, partiel: segs.every((s) => s.partiel) }]
  })
}

function Puce({ a, partiel, survol, onSurvol }: Actif & { survol: string | null; onSurvol: (c: string | null) => void }) {
  const c = VINCI_SECONDAIRE[a.couleur]
  const eteint = survol !== null && survol !== a.cle
  const style: React.CSSProperties =
    a.nature === 'obligatoire'
      ? { backgroundColor: c.base, borderColor: c.base, color: a.couleur === 'jaune' || a.couleur === 'vertVif' || a.couleur === 'bleuCiel' ? VINCI.noir : VINCI.blanc }
      : a.nature === 'facultative'
        ? { backgroundColor: c.clair, borderColor: c.base, borderStyle: 'dashed', color: VINCI.noir }
        : { backgroundImage: `repeating-linear-gradient(135deg, ${c.clair} 0 6px, ${VINCI.blanc} 6px 12px)`, borderColor: c.base, color: VINCI.noir }
  return (
    <a
      href={`#assurance-${a.cle}`}
      onMouseEnter={() => onSurvol(a.cle)}
      onMouseLeave={() => onSurvol(null)}
      onFocus={() => onSurvol(a.cle)}
      onBlur={() => onSurvol(null)}
      title={`${a.nom} — ${LIBELLE_NATURE[a.nature]}${partiel ? ' (selon contrat)' : ''}\n${a.periode}`}
      className={`flex items-start justify-between gap-1 rounded-md border-2 px-2 py-1 text-[11.5px] leading-tight shadow-sm transition-all hover:-translate-y-0.5 hover:shadow ${eteint ? 'opacity-25' : ''} ${partiel ? 'opacity-60' : ''}`}
      style={style}
    >
      <span className="min-w-0">
        {a.sigle ? (
          <>
            <span className="font-bold">{a.sigle}</span> <span className="font-semibold">({a.nom})</span>
          </>
        ) : (
          <span className="font-bold">{a.nom}</span>
        )}
      </span>
      {a.nature === 'obligatoire' && <span className="shrink-0 rounded-sm bg-white/90 px-1 text-[9px] text-vinci-rouge">OBLIG.</span>}
    </a>
  )
}

/** Vue d'ensemble « bien design » des couvertures par phase du chantier (en tête de page). */
export function PanoramaCouvertures() {
  const [survol, setSurvol] = useState<string | null>(null)
  return (
    <section className="overflow-hidden rounded-lg border border-vinci-gris-bordure bg-white shadow-sm" aria-labelledby="panorama-couvertures">
      <div className="px-5 py-4 text-white" style={{ background: `linear-gradient(90deg, ${VINCI.bleu}, ${VINCI.bleuFonce})` }}>
        <h3 id="panorama-couvertures" className="text-lg font-bold">Frise des couvertures — vue d’ensemble</h3>
        <p className="text-[13px] opacity-90">Quelles assurances et garanties jouent à chaque étape, de la signature du marché aux 10 ans après réception.</p>
      </div>

      <div className="overflow-x-auto px-5 pb-5 pt-6">
        <div className="min-w-[820px]">
          {/* Axe du temps : phases colorées + jalons */}
          <div className="relative mb-2 h-3 rounded-full" style={{ background: VINCI.grisClair }}>
            <div className="absolute inset-y-0 left-0 grid w-full grid-cols-5 gap-1">
              {PHASES_FRISE.map((p, i) => (
                <div key={p.libelle} className="h-3 first:rounded-l-full last:rounded-r-full" style={{ backgroundColor: i < 2 ? VINCI.bleu : i === 2 ? VINCI_SECONDAIRE.vert.base : i === 3 ? VINCI_SECONDAIRE.vertVif.base : VINCI_SECONDAIRE.orange.base }} />
              ))}
            </div>
            {JALONS.map((j, i) => (
              <div key={j} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${(i / 5) * 100}%` }}>
                <div
                  className="h-5 w-5 rounded-full border-[3px] bg-white shadow"
                  style={{ borderColor: j === 'Réception' ? VINCI.rouge : VINCI.bleuFonce, width: j === 'Réception' ? 26 : undefined, height: j === 'Réception' ? 26 : undefined }}
                />
              </div>
            ))}
          </div>
          <div className="relative mb-5 h-5">
            {JALONS.map((j, i) => (
              <span
                key={j}
                className={`absolute top-1 whitespace-nowrap text-[11.5px] ${i === 0 ? '' : i === 5 ? '-translate-x-full' : '-translate-x-1/2'} ${j === 'Réception' ? 'font-bold text-vinci-rouge' : 'font-semibold text-vinci-bleu-fonce'}`}
                style={{ left: `${(i / 5) * 100}%` }}
              >
                {j}
              </span>
            ))}
          </div>

          {/* Colonnes de phases */}
          <div className="grid grid-cols-5 gap-3">
            {PHASES_FRISE.map((p, i) => {
              const D = DETAIL_PHASES[i]
              const liste = assurancesDeLaPhase(p.de, p.a)
              return (
                <div key={p.libelle} className="flex flex-col rounded-md border border-vinci-gris-bordure bg-vinci-gris-clair/50">
                  <div className="flex items-center gap-2 border-b border-vinci-gris-bordure bg-white px-2.5 py-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-vinci-bleu-tres-clair text-vinci-bleu">
                      <D.icone className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold leading-tight text-vinci-bleu-fonce">{p.libelle}</p>
                      <p className="truncate text-[11px] text-vinci-texte-secondaire">{D.sous}</p>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5 p-2">
                    {liste.map((x) => (
                      <Puce key={x.a.cle} {...x} survol={survol} onSurvol={setSurvol} />
                    ))}
                  </div>
                  <p className="border-t border-vinci-gris-bordure px-2.5 py-1 text-right text-[11px] text-vinci-texte-secondaire">
                    {liste.length} couverture{liste.length > 1 ? 's' : ''}
                  </p>
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-xs text-vinci-texte-secondaire">
            Plein = assurance obligatoire · pointillé = facultative · hachuré = garantie légale · atténué = selon contrat. Survolez une garantie pour la suivre
            d’une phase à l’autre, cliquez pour ouvrir sa fiche.
          </p>
        </div>
      </div>
    </section>
  )
}
