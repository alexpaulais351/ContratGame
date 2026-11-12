import { TriangleAlert } from 'lucide-react'

/** Bandeau d'avertissement affiché sous l'en-tête, sur toutes les pages. */
export function Disclaimer() {
  return (
    <div
      role="note"
      className="flex items-start gap-2 border-b border-vinci-gris-bordure bg-vinci-rouge-tres-clair px-4 py-2 text-xs text-vinci-bleu-fonce sm:text-sm"
    >
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-vinci-rouge" aria-hidden />
      <p>
        Outil d&apos;aide à la gestion contractuelle et financière. Les documents produits (courriers, situations,
        réclamations) doivent être relus et validés par une personne compétente avant tout envoi.
      </p>
    </div>
  )
}
