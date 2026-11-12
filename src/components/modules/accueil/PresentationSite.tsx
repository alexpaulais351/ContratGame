import { BookOpen, Download, ExternalLink } from 'lucide-react'

// Paramètre de version : force le rechargement de la présentation après chaque mise à jour (cache navigateur).
export const PDF_PRESENTATION = '/presentation-contrat-game.pdf?v=2026-11-12'

/** Présentation du site : PDF intégré + ouverture plein écran + téléchargement. */
export function PresentationSite() {
  return (
    <section aria-labelledby="titre-presentation" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="titre-presentation" className="flex items-center gap-2 text-xl font-bold text-vinci-bleu">
          <BookOpen className="h-5 w-5" aria-hidden />
          Présentation du site
        </h2>
        <div className="flex flex-wrap gap-2">
          <a
            href={PDF_PRESENTATION}
            target="_blank"
            rel="noopener"
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-vinci-bleu px-4 text-sm font-medium text-vinci-bleu hover:bg-vinci-gris-clair"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            Ouvrir en plein écran
          </a>
          <a
            href={PDF_PRESENTATION}
            download="Presentation-Contrat-Game.pdf"
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-vinci-bleu px-4 text-sm font-medium text-white hover:bg-vinci-bleu-fonce"
          >
            <Download className="h-4 w-4" aria-hidden />
            Télécharger le PDF
          </a>
        </div>
      </div>
      <object
        data={PDF_PRESENTATION}
        type="application/pdf"
        className="h-[70vh] w-full rounded-lg border border-vinci-gris-bordure bg-white lg:h-[80vh]"
        aria-label="Présentation du site (PDF)"
      >
        <p className="p-4 text-sm">
          Votre navigateur ne peut pas afficher le PDF.{' '}
          <a href={PDF_PRESENTATION} target="_blank" rel="noopener" className="font-medium text-vinci-bleu underline">
            Ouvrir la présentation
          </a>
          .
        </p>
      </object>
    </section>
  )
}
