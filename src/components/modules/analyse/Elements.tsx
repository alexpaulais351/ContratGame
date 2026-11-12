import type { LucideIcon } from 'lucide-react'
import { VINCI, VINCI_SECONDAIRE } from '@/lib/design-tokens'
import { cn, formatNombreFR } from '@/lib/utils'
import type { StatutCompte } from './donnees'

export const n0 = (v: number) => formatNombreFR(v, 0)

export function Kpi({ titre, valeur, detail, icon: Icon }: { titre: string; valeur: string; detail?: string; icon: LucideIcon }) {
  return (
    <div className="carte flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-vinci-bleu-tres-clair text-vinci-bleu">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase tracking-wide text-vinci-texte-secondaire">{titre}</div>
        <div className="text-2xl font-bold leading-tight text-vinci-bleu">{valeur}</div>
        {detail && <div className="mt-0.5 text-xs text-vinci-texte-secondaire">{detail}</div>}
      </div>
    </div>
  )
}

export function Section({ titre, sousTitre, children, className }: { titre: string; sousTitre?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('carte flex flex-col gap-3', className)}>
      <div>
        <h2 className="text-base font-bold text-vinci-bleu">{titre}</h2>
        {sousTitre && <p className="text-xs text-vinci-texte-secondaire">{sousTitre}</p>}
      </div>
      {children}
    </section>
  )
}

/** Barre de proportion (part d'un maximum). */
export function BarreProportion({ valeur, max, couleur = VINCI.bleu }: { valeur: number; max: number; couleur?: string }) {
  const pct = max > 0 ? Math.max(valeur > 0 ? 2 : 0, (valeur / max) * 100) : 0
  return (
    <div className="h-2 w-full min-w-16 rounded-full bg-vinci-gris-clair" aria-hidden>
      <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: couleur }} />
    </div>
  )
}

export type Barre = { libelle: string; valeur: number; couleur: string }

/** Barres horizontales étiquetées (valeur en texte, couleur = identité). */
export function BarresHorizontales({ barres, total }: { barres: Barre[]; total?: number }) {
  const max = Math.max(1, ...barres.map((b) => b.valeur))
  const somme = total ?? barres.reduce((s, b) => s + b.valeur, 0)
  return (
    <ul className="flex flex-col gap-2">
      {barres.map((b) => (
        <li key={b.libelle} className="grid grid-cols-[7.5rem_1fr_4.5rem] items-center gap-2 text-sm">
          <span className="flex items-center gap-2 truncate">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: b.couleur }} aria-hidden />
            {b.libelle}
          </span>
          <BarreProportion valeur={b.valeur} max={max} couleur={b.couleur} />
          <span className="num text-right tabular-nums">
            <b>{n0(b.valeur)}</b>
            <span className="text-xs text-vinci-texte-secondaire"> · {somme ? n0(Math.round((b.valeur / somme) * 100)) : 0} %</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

export const STATUT_LIBELLE: Record<StatutCompte, { label: string; cls: string; couleur: string }> = {
  approuve: { label: 'Actif', cls: 'bg-vinci-vert-clair text-black border-vinci-vert', couleur: VINCI_SECONDAIRE.vert.base },
  en_attente: { label: 'En attente', cls: 'bg-vinci-jaune-clair text-black border-vinci-jaune', couleur: VINCI_SECONDAIRE.jaune.base },
  refuse: { label: 'Refusé', cls: 'bg-vinci-rouge-tres-clair text-vinci-rouge-fonce border-vinci-rouge', couleur: VINCI.rouge },
  suspendu: { label: 'Suspendu', cls: 'bg-vinci-gris-clair text-vinci-texte-secondaire border-vinci-gris', couleur: VINCI.gris },
}

export function BadgeStatut({ statut }: { statut: StatutCompte }) {
  const s = STATUT_LIBELLE[statut]
  return <span className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold ${s.cls}`}>{s.label}</span>
}

/** Petites barres verticales (inscriptions par mois), valeur au-dessus et au survol. */
export function MiniBarres({ donnees }: { donnees: { cle: string; libelle: string; valeur: number }[] }) {
  const max = Math.max(1, ...donnees.map((d) => d.valeur))
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[420px] items-end gap-1.5" role="img" aria-label={donnees.map((d) => `${d.libelle} : ${d.valeur}`).join(', ')}>
        {donnees.map((d) => (
          <div key={d.cle} className="flex flex-1 flex-col items-center gap-1" title={`${d.libelle} : ${n0(d.valeur)} inscription${d.valeur > 1 ? 's' : ''}`}>
            <span className="text-xs font-semibold tabular-nums text-black">{d.valeur > 0 ? n0(d.valeur) : ''}</span>
            <div className="flex h-24 w-full items-end border-b border-vinci-gris-bordure">
              <div
                className="mx-auto w-full max-w-7 rounded-t-[4px] bg-vinci-bleu"
                style={{ height: d.valeur > 0 ? `${Math.max(4, (d.valeur / max) * 100)}%` : 0 }}
              />
            </div>
            <span className="whitespace-nowrap text-[10px] text-vinci-texte-secondaire">{d.libelle}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
