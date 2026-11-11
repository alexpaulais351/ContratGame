'use client'
import { memo, useState, type InputHTMLAttributes } from 'react'
import { cn, formatNombreFR, parseNombreFR } from '@/lib/utils'

type Base = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>

function selectionnerAuFocus(el: HTMLInputElement) {
  requestAnimationFrame(() => {
    if (document.activeElement === el) el.select()
  })
}

/** Cellule texte éditable (style .cell-input). */
export const CelluleTexte = memo(function CelluleTexte({
  valeur,
  onValeur,
  className,
  ...rest
}: Base & { valeur: string; onValeur: (v: string) => void }) {
  return (
    <input
      {...rest}
      type="text"
      value={valeur}
      title={valeur || undefined}
      onChange={(e) => onValeur(e.target.value)}
      onFocus={(e) => {
        rest.onFocus?.(e)
        selectionnerAuFocus(e.currentTarget)
      }}
      className={cn('cell-input h-7 truncate', className)}
    />
  )
})

function versTexteEdition(n: number): string {
  if (!n) return ''
  return String(n).replace('.', ',')
}

/**
 * Cellule numérique au format FR : affiche "1 234,50" hors édition,
 * accepte "1234,5" / "1 234.5" en saisie (parseNombreFR).
 */
export const CelluleNombre = memo(function CelluleNombre({
  valeur,
  onValeur,
  decimales = 2,
  className,
  ...rest
}: Base & { valeur: number; onValeur: (v: number) => void; decimales?: number }) {
  const [texte, setTexte] = useState<string | null>(null)
  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={texte ?? formatNombreFR(valeur, decimales)}
      onFocus={(e) => {
        setTexte(versTexteEdition(valeur))
        rest.onFocus?.(e)
        selectionnerAuFocus(e.currentTarget)
      }}
      onChange={(e) => {
        const t = e.target.value.replace(/[^\d\s,.\-]/g, '')
        setTexte(t)
        onValeur(parseNombreFR(t))
      }}
      onBlur={(e) => {
        setTexte(null)
        rest.onBlur?.(e)
      }}
      className={cn('cell-input num h-7', className)}
    />
  )
})
