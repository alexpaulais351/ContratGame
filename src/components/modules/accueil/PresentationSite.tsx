import { BookOpen, Download, ExternalLink } from 'lucide-react'

export const PDF_PRESENTATION = '/presentation-contrat-game.pdf'

/** Présentation du site : PDF intégré + ouverture plein écran + téléchargement. */
export function PresentationSite() {
  return (
    <section className="mt-8">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold text-vinci-bleu">
          <BookOpen className="h-5 w-5" /> Présentation du site
        </h2>
        <div className="flex gap-2">
          <a
            href={PDF_PRESENTATION}
            target="_blank"
            rel="noopener"
            className="btn-secondaire inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium"
          >
            <ExternalLink className="h-4 w-4" /> Ouvrir en plein écran
          </a>
          <a
            href={PDF_PRESENTATION}
            download="Presentation_Contrat_Game.pdf"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-vinci-bleu px-3 text-sm font-medium text-white hover:bg-vinci-bleu-fonce"
          >
            <Download className="h-4 w-4" /> Télécharger le PDF
          </a>
        </div>
      </div>
      <div className="overflow-hidden rounded-md border border-vinci-gris-bordure bg-vinci-gris-clair">
        <iframe src={`${PDF_PRESENTATION}#view=FitH`} title="Présentation de Contrat Game" className="h-[75vh] w-full" />
      </div>
    </section>
  )
}
