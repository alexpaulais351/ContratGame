'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarRange, FileWarning } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Onglets internes du module : Journal (événements + frise) ↔ Fiche écart. */
export function JournalOnglets({ projetId }: { projetId: string }) {
  const pathname = usePathname()
  const base = `/projets/${projetId}/suivi/journal`
  const onglets = [
    { href: base, label: 'Événements & frise', icone: CalendarRange, actif: pathname === base },
    { href: `${base}/fiche-ecart`, label: 'Fiche écart', icone: FileWarning, actif: pathname.startsWith(`${base}/fiche-ecart`) },
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
