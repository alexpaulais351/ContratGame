'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { BASE_BOITE, OUTILS_BOITE } from '@/lib/boite-a-outils/outils'

/** Sous-onglets de la Boîte à outils (style N2 : bordure basse rouge sur l'actif). */
export function BoiteOutilsNav() {
  const pathname = usePathname()
  return (
    <nav
      aria-label="Outils"
      className="flex gap-1 overflow-x-auto border-b border-vinci-gris-bordure bg-vinci-bleu-tres-clair px-4 lg:px-6"
    >
      <Link
        href={BASE_BOITE}
        aria-current={pathname === BASE_BOITE ? 'page' : undefined}
        className={cn(
          'whitespace-nowrap border-b-2 px-3 py-3 text-sm',
          pathname === BASE_BOITE ? 'border-vinci-rouge font-bold text-vinci-bleu-fonce' : 'border-transparent text-black hover:text-vinci-bleu',
        )}
      >
        Sommaire
      </Link>
      {OUTILS_BOITE.map((o) => {
        const href = `${BASE_BOITE}/${o.slug}`
        const actif = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={o.slug}
            href={href}
            aria-current={actif ? 'page' : undefined}
            className={cn(
              'whitespace-nowrap border-b-2 px-3 py-3 text-sm',
              actif ? 'border-vinci-rouge font-bold text-vinci-bleu-fonce' : 'border-transparent text-black hover:text-vinci-bleu',
            )}
          >
            {o.label}
          </Link>
        )
      })}
    </nav>
  )
}
