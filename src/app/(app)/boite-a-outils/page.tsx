import Link from 'next/link'
import { BookA, Calculator, Clock, FileText, GitBranch, ShieldCheck, type LucideIcon } from 'lucide-react'
import { BASE_BOITE, OUTILS_BOITE } from '@/lib/boite-a-outils/outils'
import { VERSION_CCAG_2021 } from '@/lib/boite-a-outils/sources'

const ICONES: Record<string, LucideIcon> = {
  'modeles-courriers': FileText,
  'procedure-dgd': GitBranch,
  'delais-cles': Clock,
  calculateurs: Calculator,
  assurances: ShieldCheck,
  lexique: BookA,
}

export default function BoiteOutilsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <section aria-label="Outils" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {OUTILS_BOITE.map((o) => {
          const Icon = ICONES[o.slug] ?? FileText
          return (
            <Link
              key={o.slug}
              href={`${BASE_BOITE}/${o.slug}`}
              className="group carte flex min-h-32 flex-col gap-2 transition-colors hover:border-vinci-bleu hover:bg-vinci-bleu-tres-clair focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vinci-bleu"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-vinci-bleu text-white">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-base font-bold text-vinci-bleu group-hover:underline">{o.label}</span>
              </span>
              <span className="text-sm text-vinci-texte-secondaire">{o.description}</span>
            </Link>
          )
        })}
      </section>
      <p className="mt-6 text-xs text-vinci-texte-secondaire">
        Référence principale : {VERSION_CCAG_2021}. Les contenus sont des aides : les pièces particulières du marché prévalent.
      </p>
    </div>
  )
}
