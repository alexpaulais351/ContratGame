'use client'
import { useState } from 'react'
import { cn, formatNombreFR, parseNombreFR } from '@/lib/utils'

/**
 * Saisie numérique FR : affiche « 1 234,50 » hors focus, valeur brute en édition.
 * Vide → null.
 */
export function ChampNombre({
  valeur,
  onChange,
  decimales = 2,
  suffixe,
  className,
  placeholder,
  ariaLabel,
}: {
  valeur: number | null
  onChange: (v: number | null) => void
  decimales?: number
  suffixe?: string
  className?: string
  placeholder?: string
  ariaLabel?: string
}) {
  const [edition, setEdition] = useState<string | null>(null)
  const affiche = edition ?? (valeur === null ? '' : formatNombreFR(valeur, decimales) + (suffixe ? ` ${suffixe}` : ''))
  return (
    <input
      type="text"
      inputMode="decimal"
      aria-label={ariaLabel}
      placeholder={placeholder}
      className={cn('cell-input num', className)}
      value={affiche}
      onFocus={(e) => {
        setEdition(valeur === null ? '' : String(valeur).replace('.', ','))
        requestAnimationFrame(() => e.target.select())
      }}
      onChange={(e) => {
        setEdition(e.target.value)
        const t = e.target.value.trim()
        onChange(t === '' ? null : parseNombreFR(t))
      }}
      onBlur={() => setEdition(null)}
    />
  )
}
