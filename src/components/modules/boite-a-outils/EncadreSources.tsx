import { BookMarked, ExternalLink } from 'lucide-react'
import { DATE_MAJ, SOURCES_PAR_OUTIL, type Source } from '@/lib/boite-a-outils/sources'
import { isoVersDateLocale } from '@/lib/boite-a-outils/dates'
import { formatDateFR } from '@/lib/utils'

/** Encadré « Sources et versions » affiché en pied de chaque outil. */
export function EncadreSources({ outil, sources }: { outil?: string; sources?: Source[] }) {
  const liste = sources ?? (outil ? SOURCES_PAR_OUTIL[outil] ?? [] : [])
  return (
    <section aria-label="Sources et versions" className="mt-8 rounded-md border border-vinci-gris-bordure bg-vinci-gris-clair p-4 text-sm">
      <h2 className="mb-2 flex items-center gap-2 font-bold text-vinci-bleu">
        <BookMarked className="h-4 w-4" aria-hidden /> Sources et versions
      </h2>
      <ul className="space-y-1.5">
        {liste.map((s) => (
          <li key={s.texte} className="leading-snug">
            <span className="font-semibold">{s.texte}</span>
            <span className="text-vinci-texte-secondaire"> — {s.version}</span>
            {s.aVerifier && (
              <span className="ml-1 rounded-sm bg-vinci-jaune-clair px-1 text-xs font-semibold text-vinci-orange">à vérifier</span>
            )}
            {s.url && (
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="ml-1 inline-flex items-center gap-0.5 text-vinci-bleu underline">
                lien officiel <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-vinci-texte-secondaire">
        Page mise à jour le {formatDateFR(isoVersDateLocale(DATE_MAJ))}. Document d’aide non contractuel : les pièces particulières du marché
        (CCAP, CCTP…) peuvent déroger aux textes cités. Vérifiez toujours la version applicable à votre marché.
      </p>
    </section>
  )
}
