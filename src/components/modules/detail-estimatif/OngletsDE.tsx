'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Table2, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Onglets internes du module : Détail Estimatif ↔ Co-traitance. */
export function OngletsDE({ projetId }: { projetId: string }) {
  const pathname = usePathname()
  const base = `/projets/${projetId}/detail-estimatif`
  const onglets = [
    { href: base, label: 'Détail Estimatif', icone: Table2, actif: pathname === base },
    { href: `${base}/cotraitance`, label: 'Co-traitance', icone: Users, actif: pathname.startsWith(`${base}/cotraitance`) },
  ]
  return (
    <nav className="flex gap-1 border-b border-vinci-gris-bordure">
      {onglets.map((o) => (
        <Link
          key={o.href}
          href={o.href}
          className={cn(
            '-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm',
            o.actif ? 'border-vinci-bleu font-bold text-vinci-bleu' : 'border-transparent text-vinci-texte-secondaire hover:text-vinci-bleu',
          )}
        >
          <o.icone className="h-4 w-4" />
          {o.label}
        </Link>
      ))}
    </nav>
  )
}
