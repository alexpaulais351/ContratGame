'use client'
import { lireFichierEvenement } from '@/actions/journal'

/** Cache mémoire (session de page) des pièces jointes chargées à la demande. */
const cache = new Map<string, Promise<string>>()

export function chargerFichier(projetId: string, fichierId: string): Promise<string> {
  let p = cache.get(fichierId)
  if (!p) {
    p = lireFichierEvenement(projetId, fichierId).then((r) => {
      if (!r.success) throw new Error(r.error)
      return r.data.contenu
    })
    p.catch(() => cache.delete(fichierId))
    cache.set(fichierId, p)
  }
  return p
}

export function oublierFichier(fichierId: string) {
  cache.delete(fichierId)
}

export function dataUrlVersBlob(dataUrl: string): Blob {
  const virgule = dataUrl.indexOf(',')
  const entete = dataUrl.slice(0, virgule)
  const type = /data:([^;]+)/.exec(entete)?.[1] ?? 'application/octet-stream'
  const bin = atob(dataUrl.slice(virgule + 1))
  const octets = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) octets[i] = bin.charCodeAt(i)
  return new Blob([octets], { type })
}

/**
 * Ouvre une pièce jointe (PDF ou image) dans un nouvel onglet via une blob URL.
 * L'onglet est ouvert de façon synchrone (anti-bloqueur de pop-up) puis alimenté.
 */
export async function ouvrirDansOnglet(projetId: string, fichierId: string) {
  const fenetre = window.open('', '_blank')
  try {
    const contenu = await chargerFichier(projetId, fichierId)
    const url = URL.createObjectURL(dataUrlVersBlob(contenu))
    if (fenetre) fenetre.location.href = url
    else window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (e) {
    fenetre?.close()
    throw e
  }
}

export function lireFichierLocal(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error ?? new Error('Lecture impossible'))
    r.readAsDataURL(f)
  })
}
