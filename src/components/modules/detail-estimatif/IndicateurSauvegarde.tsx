'use client'
import { AlertCircle, Check, Loader2 } from 'lucide-react'
import type { StatutSauvegarde } from './useAutoSave'

/** Feedback discret de l'auto-save. */
export function IndicateurSauvegarde({ statut }: { statut: StatutSauvegarde }) {
  if (statut === 'idle') return <span className="text-xs text-vinci-texte-secondaire">Ctrl+S pour enregistrer</span>
  if (statut === 'attente')
    return <span className="text-xs text-vinci-texte-secondaire">Modifications en attente…</span>
  if (statut === 'enCours')
    return (
      <span className="inline-flex items-center gap-1 text-xs text-vinci-texte-secondaire">
        <Loader2 className="h-3 w-3 animate-spin" /> Enregistrement…
      </span>
    )
  if (statut === 'erreur')
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-vinci-rouge">
        <AlertCircle className="h-3 w-3" /> Erreur d&apos;enregistrement
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 text-xs text-vinci-vert">
      <Check className="h-3 w-3" /> Enregistré
    </span>
  )
}
