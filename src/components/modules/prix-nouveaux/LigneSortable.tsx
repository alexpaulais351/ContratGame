'use client'
import { memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2 } from 'lucide-react'
import { formatMontant, parseNombreFR } from '@/lib/utils'
import { VINCI } from '@/lib/design-tokens'
import { STATUTS, couleursSem, marge, ponderé, potentielSemantique, statutInfo, type PrixNouveauDTO } from './types'

type Patch = Partial<Omit<PrixNouveauDTO, 'id'>>

function NombreInput({ valeur, onChange, label }: { valeur: number | null; onChange: (n: number | null) => void; label: string }) {
  return (
    <input
      type="number"
      step="0.01"
      aria-label={label}
      className="cell-input num"
      value={valeur ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? null : parseNombreFR(e.target.value))}
    />
  )
}

function LigneBase({
  ligne: l,
  dragActif,
  onChange,
  onSupprimer,
}: {
  ligne: PrixNouveauDTO
  dragActif: boolean
  onChange: (p: Patch) => void
  onSupprimer: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: l.id, disabled: !dragActif })
  const m = marge(l)
  const cp = couleursSem(potentielSemantique(l.potentielAcceptation))
  const si = statutInfo(l.statut)
  const cs = couleursSem(si.sem)
  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1, position: 'relative', zIndex: isDragging ? 20 : undefined }}
    >
      <td>
        <button
          type="button"
          aria-label="Déplacer"
          disabled={!dragActif}
          className="touch-none cursor-grab text-vinci-gris hover:text-vinci-bleu disabled:cursor-not-allowed disabled:opacity-40"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td>
        <input className="cell-input" aria-label="N° devis" value={l.numero} onChange={(e) => onChange({ numero: e.target.value })} />
      </td>
      <td>
        <input className="cell-input" aria-label="Intitulé" value={l.intitule} onChange={(e) => onChange({ intitule: e.target.value })} />
      </td>
      <td>
        <input type="date" className="cell-input" aria-label="Date devis" value={l.dateDevis} onChange={(e) => onChange({ dateDevis: e.target.value })} />
      </td>
      <td>
        <NombreInput label="Montant présenté" valeur={l.montantPresente} onChange={(n) => onChange({ montantPresente: n ?? 0 })} />
      </td>
      <td>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            max={100}
            aria-label="Potentiel d'acceptation (%)"
            className="cell-input num !w-14 rounded-full font-bold"
            style={{ backgroundColor: cp.clair, borderColor: cp.base, color: VINCI.noir }}
            value={l.potentielAcceptation}
            onChange={(e) => onChange({ potentielAcceptation: Math.min(100, Math.max(0, Math.round(parseNombreFR(e.target.value)))) })}
          />
          <span className="text-xs">%</span>
        </div>
      </td>
      <td className="num">{formatMontant(ponderé(l))}</td>
      <td>
        <NombreInput label="Montant accepté" valeur={l.montantAccepte} onChange={(n) => onChange({ montantAccepte: n })} />
      </td>
      <td>
        <NombreInput label="Déboursé réel" valeur={l.debourseReel} onChange={(n) => onChange({ debourseReel: n })} />
      </td>
      <td className="num font-medium" style={{ color: m == null ? undefined : m < 0 ? VINCI.rouge : couleursSem('succes').base }}>
        {m == null ? '—' : formatMontant(m)}
      </td>
      <td>
        <input className="cell-input" aria-label="N° OS" value={l.numeroOS} onChange={(e) => onChange({ numeroOS: e.target.value })} />
      </td>
      <td>
        <input type="date" className="cell-input" aria-label="Date OS" value={l.dateOS} onChange={(e) => onChange({ dateOS: e.target.value })} />
      </td>
      <td>
        <input className="cell-input" aria-label="Délai supplémentaire" value={l.delaiSupplementaire} onChange={(e) => onChange({ delaiSupplementaire: e.target.value })} />
      </td>
      <td>
        <select
          aria-label="Statut"
          className="w-full rounded-full border px-2 py-0.5 text-xs font-medium"
          style={{ backgroundColor: cs.clair, borderColor: cs.base, color: VINCI.noir }}
          value={l.statut}
          onChange={(e) => onChange({ statut: e.target.value })}
        >
          {STATUTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </td>
      <td>
        <input className="cell-input" aria-label="Commentaire" value={l.commentaire} onChange={(e) => onChange({ commentaire: e.target.value })} />
      </td>
      <td>
        <button type="button" aria-label="Supprimer" onClick={onSupprimer} className="text-vinci-texte-secondaire hover:text-vinci-rouge">
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  )
}

export const LigneSortable = memo(LigneBase)
