import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** 1234.5 → "1 234,50" (espace fine insécable remplacée par espace simple pour les PDF) */
export function formatNombreFR(n: number, decimales = 2): string {
  if (n === null || n === undefined || Number.isNaN(n)) n = 0
  const fixe = Math.abs(n).toFixed(decimales)
  const [ent, dec] = fixe.split('.')
  const entGroupe = ent.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  const signe = n < 0 && Number(fixe) !== 0 ? '-' : ''
  return signe + entGroupe + (dec ? ',' + dec : '')
}

/** 1234.5 → "1 234,50 €" */
export function formatMontant(n: number): string {
  return formatNombreFR(n, 2) + ' €'
}

/** Date → "01/04/2026" */
export function formatDateFR(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return ''
  const j = String(d.getDate()).padStart(2, '0')
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${j}/${m}/${d.getFullYear()}`
}

/** "#004489" → { r: 0, g: 68, b: 137 } */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim())
  if (!m) return null
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}

/** Date → "2026-04-01" pour <input type="date"> */
export function toInputDate(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

/** "1 234,5" → 1234.5 (saisie FR tolérante) */
export function parseNombreFR(s: string): number {
  const n = Number(String(s).replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}
