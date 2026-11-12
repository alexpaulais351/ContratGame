import { VINCI } from '@/lib/design-tokens'
import { dateDuJour } from '@/lib/activite'
import { formatDateFR, formatNombreFR } from '@/lib/utils'
import type { PointSerie } from './donnees'

const L = 760
const MARGE_G = 40
const MARGE_D = 8
const H_PANNEAU = 110
const ECART = 34
const HAUT = 22

const n0 = (v: number) => formatNombreFR(v, 0)
const jourCourt = (iso: string) => formatDateFR(dateDuJour(iso)).slice(0, 5)

/** Pas « rond » pour l'axe vertical (1, 2, 5 × 10^k). */
function graduations(max: number): number[] {
  if (max <= 0) return [0, 1]
  const brut = max / 3
  const p = 10 ** Math.floor(Math.log10(brut))
  const pas = [1, 2, 5, 10].map((k) => k * p).find((k) => k >= brut) ?? brut
  const ticks: number[] = []
  for (let v = 0; v <= max + pas * 0.001; v += pas) ticks.push(v)
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + pas)
  return ticks
}

type Panneau = { titre: string; cle: 'vues' | 'visiteurs'; couleur: string; unite: [string, string] }

/**
 * Activité par jour (ou par semaine) : deux panneaux superposés partageant l'axe des dates
 * — pages vues (barres) au-dessus, visiteurs uniques (ligne + points) en dessous —
 * chacun avec sa propre échelle (pas de double axe). Info-bulle native au survol de chaque colonne.
 */
export function GraphiqueActivite({ serie, granularite }: { serie: PointSerie[]; granularite: 'jour' | 'semaine' }) {
  const panneaux: Panneau[] = [
    { titre: 'Pages vues', cle: 'vues', couleur: VINCI.bleu, unite: ['page vue', 'pages vues'] },
    { titre: 'Visiteurs uniques', cle: 'visiteurs', couleur: VINCI.bleuClair, unite: ['visiteur', 'visiteurs'] },
  ]
  const nb = Math.max(1, serie.length)
  const largeurUtile = L - MARGE_G - MARGE_D
  const pasX = largeurUtile / nb
  const largeurBarre = Math.max(2, Math.min(28, pasX - 2))
  const cx = (i: number) => MARGE_G + pasX * i + pasX / 2
  const yAxeDates = HAUT + 2 * H_PANNEAU + ECART
  const hauteur = yAxeDates + 22
  const pasEtiquette = Math.max(1, Math.ceil(nb / 10))

  const libelleSeau = (p: PointSerie) =>
    granularite === 'jour' ? formatDateFR(dateDuJour(p.debut)) : `Semaine du ${formatDateFR(dateDuJour(p.debut))} au ${formatDateFR(dateDuJour(p.fin))}`
  const pl = (v: number, u: [string, string]) => `${n0(v)} ${v > 1 ? u[1] : u[0]}`

  const resume = serie.map((p) => `${jourCourt(p.debut)} : ${p.vues} vues, ${p.visiteurs} visiteurs`).join(' ; ')

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${L} ${hauteur}`}
        className="h-auto w-full min-w-[560px]"
        role="img"
        aria-label={`Activité ${granularite === 'jour' ? 'par jour' : 'par semaine'} — ${resume}`}
      >
        {panneaux.map((pan, ip) => {
          const y0 = HAUT + ip * (H_PANNEAU + ECART)
          const yBase = y0 + H_PANNEAU
          const max = Math.max(...serie.map((p) => p[pan.cle]), 0)
          const ticks = graduations(max)
          const haut = ticks[ticks.length - 1] || 1
          const y = (v: number) => yBase - (v / haut) * H_PANNEAU
          const points = serie.map((p, i) => `${cx(i)},${y(p.visiteurs)}`).join(' ')
          return (
            <g key={pan.cle}>
              <text x={MARGE_G} y={y0 - 9} fontSize={12} fontWeight={700} fill={VINCI.bleuFonce}>
                {pan.titre}
              </text>
              {ticks.map((t) => (
                <g key={t}>
                  <line x1={MARGE_G} x2={L - MARGE_D} y1={y(t)} y2={y(t)} stroke={VINCI.grisBordure} strokeWidth={t === 0 ? 1 : 0.6} strokeDasharray={t === 0 ? undefined : '3 3'} />
                  <text x={MARGE_G - 6} y={y(t) + 4} fontSize={10} textAnchor="end" fill={VINCI.texteSecondaire}>
                    {n0(t)}
                  </text>
                </g>
              ))}
              {pan.cle === 'vues'
                ? serie.map((p, i) => {
                    const h = yBase - y(p.vues)
                    if (h <= 0) return null
                    const r = Math.min(4, largeurBarre / 2, h)
                    const x = cx(i) - largeurBarre / 2
                    // barre arrondie en haut, ancrée sur la ligne de base
                    const d = `M${x},${yBase} V${yBase - h + r} Q${x},${yBase - h} ${x + r},${yBase - h} H${x + largeurBarre - r} Q${x + largeurBarre},${yBase - h} ${x + largeurBarre},${yBase - h + r} V${yBase} Z`
                    return <path key={p.debut} d={d} fill={pan.couleur} />
                  })
                : (
                  <>
                    <polyline points={points} fill="none" stroke={pan.couleur} strokeWidth={2} strokeLinejoin="round" />
                    {serie.map((p, i) =>
                      nb <= 45 || p.visiteurs > 0 ? (
                        <circle key={p.debut} cx={cx(i)} cy={y(p.visiteurs)} r={nb <= 45 ? 3.5 : 2.5} fill={pan.couleur} stroke={VINCI.blanc} strokeWidth={1.5} />
                      ) : null,
                    )}
                  </>
                )}
            </g>
          )
        })}

        {/* Axe des dates commun */}
        {serie.map((p, i) =>
          i % pasEtiquette === 0 ? (
            <text key={p.debut} x={cx(i)} y={yAxeDates + 14} fontSize={10} textAnchor="middle" fill={VINCI.texteSecondaire}>
              {jourCourt(p.debut)}
            </text>
          ) : null,
        )}

        {/* Zones de survol : toute la hauteur de la colonne (cible plus large que la marque) */}
        {serie.map((p, i) => (
          <rect key={p.debut} x={MARGE_G + pasX * i} y={HAUT - 14} width={pasX} height={yAxeDates - HAUT + 14} fill="transparent" className="hover:fill-vinci-bleu/10">
            <title>{`${libelleSeau(p)}\n${pl(p.vues, panneaux[0].unite)}\n${pl(p.visiteurs, panneaux[1].unite)}\n${pl(p.connexions, ['connexion', 'connexions'])}`}</title>
          </rect>
        ))}
      </svg>
    </div>
  )
}
