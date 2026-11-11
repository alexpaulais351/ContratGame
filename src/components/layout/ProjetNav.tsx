'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ONGLETS_PROJET, moduleDepuisChemin } from '@/lib/modules-projet'

type Props = { projetId: string; nomProjet: string; modulesMasques: unknown }

/** Topbar + navigation 2 niveaux : N1 = onglets, N2 = modules. */
export function ProjetNav({ projetId, nomProjet, modulesMasques }: Props) {
  const pathname = usePathname()
  const base = `/projets/${projetId}`
  const sousChemin = pathname.startsWith(base + '/') ? pathname.slice(base.length + 1) : ''
  const actif = moduleDepuisChemin(sousChemin)
  const masques = Array.isArray(modulesMasques) ? (modulesMasques as string[]) : []
  const ongletActif = actif?.onglet ?? ONGLETS_PROJET[0]
  const visibles = (mods: typeof ongletActif.modules) => mods.filter((m) => !m.toggleable || !masques.includes(m.key))

  return (
    <header className="sticky top-0 z-30 border-b border-vinci-gris-bordure bg-white">
      <div className="flex items-center gap-3 px-4 py-2 lg:px-6">
        <Link href="/projets" className="text-vinci-texte-secondaire hover:text-vinci-bleu" title="Retour aux projets">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="truncate text-lg font-bold text-vinci-bleu">{nomProjet}</h1>
      </div>
      {/* N1 */}
      <nav className="flex gap-1 px-4 lg:px-6">
        {ONGLETS_PROJET.map((o) => {
          const premier = visibles(o.modules)[0]
          if (!premier) return null
          const estActif = o.key === ongletActif.key
          return (
            <Link
              key={o.key}
              href={`${base}/${premier.href}`}
              className={cn(
                'rounded-t-sm border-b-2 px-4 py-2 text-sm font-bold uppercase tracking-wide',
                estActif
                  ? 'border-vinci-bleu bg-vinci-bleu-tres-clair text-vinci-bleu-fonce'
                  : 'border-transparent text-vinci-texte-secondaire hover:text-vinci-bleu',
              )}
            >
              {o.label}
            </Link>
          )
        })}
      </nav>
      {/* N2 */}
      <nav className="flex gap-1 overflow-x-auto border-t border-vinci-gris-bordure bg-vinci-bleu-tres-clair px-4 lg:px-6">
        {visibles(ongletActif.modules).map((m) => {
          const estActif = actif?.module.key === m.key
          return (
            <Link
              key={m.key}
              href={`${base}/${m.href}`}
              className={cn(
                'whitespace-nowrap border-b-2 px-3 py-2 text-sm',
                estActif ? 'border-vinci-rouge font-bold text-vinci-bleu-fonce' : 'border-transparent text-black hover:text-vinci-bleu',
              )}
            >
              {m.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
