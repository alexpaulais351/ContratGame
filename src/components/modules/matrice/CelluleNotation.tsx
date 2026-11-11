'use client'
import { memo, useState } from 'react'
import { AlertOctagon, Eraser, MessageSquare, MoreVertical, TriangleAlert } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LIBELLES_NOTES, lireMontant } from '@/lib/matrice-bidcomp'
import { cn } from '@/lib/utils'
import { ChampNombre } from './ChampNombre'
import { symboleDevise } from './grille'
import type { CritereVue, NotationVue } from './types'

export type PatchNotation = Partial<Omit<NotationVue, 'critereId' | 'fournisseurId'>>

type Props = {
  critere: CritereVue
  fournisseurId: string
  notation: NotationVue | undefined
  devise: string
  onChange: (critereId: string, fournisseurId: string, patch: PatchNotation) => void
  onCommentaire: (critereId: string, fournisseurId: string) => void
}

/** Classes de fond selon le marquage de non-conformité. */
export function classesNC(n: Pick<NotationVue, 'estNonConformiteMajeure' | 'estNonConformiteNegociable'> | undefined): string {
  if (n?.estNonConformiteMajeure) return 'bg-vinci-rouge-tres-clair shadow-[inset_0_0_0_2px_#E20025]'
  if (n?.estNonConformiteNegociable) return 'bg-vinci-jaune-clair shadow-[inset_0_0_0_2px_#F2AB1B]'
  return ''
}

function CelluleNotationBase({ critere, fournisseurId, notation, devise, onChange, onCommentaire }: Props) {
  const [menu, setMenu] = useState(false)
  const maj = (patch: PatchNotation) => onChange(critere.id, fournisseurId, patch)
  const majeure = !!notation?.estNonConformiteMajeure
  const negociable = !!notation?.estNonConformiteNegociable && !majeure

  let champ: React.ReactNode
  switch (critere.type) {
    case 'note_1_3':
      champ = (
        <select
          aria-label={`Note ${critere.libelle}`}
          className={cn('cell-input h-7 cursor-pointer text-center font-bold', notation?.note === 1 && 'text-vinci-rouge', notation?.note === 3 && 'text-vinci-vert')}
          value={notation?.note ?? ''}
          onChange={(e) => maj({ note: e.target.value ? Number(e.target.value) : null })}
        >
          <option value="">—</option>
          {[1, 2, 3].map((v) => (
            <option key={v} value={v}>
              {LIBELLES_NOTES[v]}
            </option>
          ))}
        </select>
      )
      break
    case 'booleen':
      champ = (
        <label className="flex h-7 cursor-pointer items-center justify-center gap-2">
          <Checkbox checked={notation?.valeurBool === true} onCheckedChange={(v) => maj({ valeurBool: v === true })} aria-label={critere.libelle} />
          <span className={cn('text-xs', notation?.valeurBool === null || notation?.valeurBool === undefined ? 'text-vinci-gris' : '')}>
            {notation?.valeurBool === true ? 'Oui' : notation?.valeurBool === false ? 'Non' : '—'}
          </span>
        </label>
      )
      break
    case 'montant':
      champ = (
        <ChampNombre
          ariaLabel={critere.libelle}
          valeur={lireMontant(notation?.valeurTexte)}
          suffixe={symboleDevise(devise)}
          onChange={(v) => maj({ valeurTexte: v === null ? null : String(v) })}
        />
      )
      break
    default:
      champ = (
        <input
          aria-label={critere.libelle}
          className="cell-input h-7"
          value={notation?.valeurTexte ?? ''}
          onChange={(e) => maj({ valeurTexte: e.target.value || null })}
        />
      )
  }

  return (
    <td
      className={cn('relative border-b border-r border-vinci-gris-bordure p-0.5', classesNC(notation))}
      onContextMenu={(e) => {
        e.preventDefault()
        setMenu(true)
      }}
      title={notation?.commentaire ?? undefined}
    >
      {notation?.commentaire ? (
        <span aria-hidden className="pointer-events-none absolute right-0 top-0 size-0 border-l-[7px] border-t-[7px] border-l-transparent border-t-vinci-bleu" />
      ) : null}
      <div className="flex items-center gap-0.5">
        <div className="min-w-0 flex-1">{champ}</div>
        <DropdownMenu open={menu} onOpenChange={setMenu}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Options de la cellule"
              className={cn(
                'flex h-7 w-5 shrink-0 items-center justify-center rounded-sm text-vinci-texte-secondaire opacity-40 hover:bg-vinci-gris-clair hover:opacity-100 focus:opacity-100',
                (majeure || negociable) && 'opacity-100',
              )}
            >
              {majeure ? <AlertOctagon className="size-3.5 text-vinci-rouge" /> : negociable ? <TriangleAlert className="size-3.5 text-vinci-jaune" /> : <MoreVertical className="size-3.5" />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="truncate text-xs text-vinci-texte-secondaire">{critere.libelle}</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={majeure}
              onCheckedChange={(v) => maj({ estNonConformiteMajeure: v === true, estNonConformiteNegociable: false })}
            >
              <span className="mr-2 inline-block size-3 rounded-sm border border-vinci-rouge bg-vinci-rouge-tres-clair" />
              Non-conformité majeure
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={negociable}
              onCheckedChange={(v) => maj({ estNonConformiteNegociable: v === true, estNonConformiteMajeure: false })}
            >
              <span className="mr-2 inline-block size-3 rounded-sm border border-vinci-jaune bg-vinci-jaune-clair" />
              Non-conformité négociable
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onCommentaire(critere.id, fournisseurId)}>
              <MessageSquare /> {notation?.commentaire ? 'Modifier le commentaire…' : 'Ajouter un commentaire…'}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                maj({ note: null, valeurTexte: null, valeurBool: null, commentaire: null, estNonConformiteMajeure: false, estNonConformiteNegociable: false })
              }
            >
              <Eraser /> Effacer la cellule
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </td>
  )
}

export const CelluleNotation = memo(CelluleNotationBase)
