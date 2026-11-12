'use client'
import Link from 'next/link'
import { Mail, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { BadgeCategorie } from './BadgeCategorie'
import { PiecesJointes } from './PiecesJointes'
import { couleursDe, jourFR, nomCategorie, type CategorieDTO, type EvenementDTO } from './types'

type Props = {
  projetId: string
  evenements: EvenementDTO[]
  categories: CategorieDTO[]
  surligne: string | null
  onModifier: (ev: EvenementDTO) => void
  onSupprimer: (ev: EvenementDTO) => void
  onBasculerFrise: (ev: EvenementDTO, afficher: boolean) => void
}

export function ListeEvenements({ projetId, evenements, categories, surligne, onModifier, onSupprimer, onBasculerFrise }: Props) {
  if (evenements.length === 0) {
    return <p className="p-6 text-center text-sm text-vinci-texte-secondaire">Aucun événement pour ces filtres.</p>
  }
  return (
    <table className="table-vinci min-w-[860px]">
      <thead>
        <tr>
          <th className="w-[100px]">Date</th>
          <th>Événement</th>
          <th className="w-[170px]">Catégorie</th>
          <th className="w-[220px]">Pièces jointes</th>
          <th className="w-[70px] text-center">Frise</th>
          <th className="w-[90px]" />
        </tr>
      </thead>
      <tbody>
        {evenements.map((ev) => (
          <tr key={ev.id} id={`ev-${ev.id}`} data-selected={surligne === ev.id}>
            <td className="whitespace-nowrap align-top font-semibold tabular-nums">{jourFR(ev.jour)}</td>
            <td className="align-top">
              <button type="button" className="text-left font-bold text-vinci-bleu hover:underline" onClick={() => onModifier(ev)}>
                {ev.titre}
              </button>
              {ev.description && <p className="mt-0.5 whitespace-pre-wrap text-[13px] text-vinci-texte-secondaire">{ev.description}</p>}
              {ev.courrierId && (
                <Link
                  href={`/projets/${projetId}/courriers/${ev.courrierId}`}
                  className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-vinci-bleu-clair hover:underline"
                >
                  <Mail className="h-3.5 w-3.5" /> Voir le courrier lié
                </Link>
              )}
            </td>
            <td className="align-top">
              <BadgeCategorie nom={nomCategorie(ev, categories)} couleurs={couleursDe(ev, categories)} />
            </td>
            <td className="align-top">
              <PiecesJointes projetId={projetId} fichiers={ev.fichiers} />
            </td>
            <td className="text-center align-top">
              <Checkbox
                checked={ev.afficherFrise}
                onCheckedChange={(v) => onBasculerFrise(ev, v === true)}
                aria-label="Afficher sur la frise"
                title="Afficher sur la frise"
              />
            </td>
            <td className="align-top">
              <div className="flex justify-end gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8 text-vinci-bleu" title="Modifier" onClick={() => onModifier(ev)}>
                  <Pencil />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-vinci-rouge hover:bg-vinci-rouge-tres-clair hover:text-vinci-rouge-fonce"
                  title="Supprimer"
                  onClick={() => onSupprimer(ev)}
                >
                  <Trash2 />
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
