'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { ActionResult } from '@/types'

export type StatutSauvegarde = 'idle' | 'attente' | 'enCours' | 'ok' | 'erreur'

type Envoyer = (id: string, patch: Record<string, unknown>) => Promise<ActionResult>

const DELAI_MS = 500

/**
 * Auto-save debounced 500 ms PAR CELLULE (clé id + champ), avec
 * `toutEnregistrer()` pour forcer l'envoi immédiat (Ctrl+S, démontage).
 */
export function useAutoSave(envoyer: Envoyer) {
  const envoyerRef = useRef(envoyer)
  envoyerRef.current = envoyer
  const pending = useRef(new Map<string, Record<string, unknown>>())
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const inflight = useRef(0)
  const erreurRef = useRef(false)
  const [statut, setStatut] = useState<StatutSauvegarde>('idle')

  const majStatut = useCallback(() => {
    if (inflight.current > 0) setStatut('enCours')
    else if (pending.current.size > 0) setStatut('attente')
    else setStatut(erreurRef.current ? 'erreur' : 'ok')
  }, [])

  const envoyerPatch = useCallback(
    async (id: string, patch: Record<string, unknown>) => {
      if (Object.keys(patch).length === 0) return
      inflight.current += 1
      erreurRef.current = false
      majStatut()
      try {
        const res = await envoyerRef.current(id, patch)
        if (!res.success) {
          erreurRef.current = true
          toast.error(`Enregistrement impossible : ${res.error}`)
        }
      } catch {
        erreurRef.current = true
        toast.error('Enregistrement impossible (connexion ?)')
      } finally {
        inflight.current -= 1
        majStatut()
      }
    },
    [majStatut],
  )

  const envoyerCellule = useCallback(
    (id: string, champ: string) => {
      timers.current.delete(`${id}|${champ}`)
      const p = pending.current.get(id)
      if (!p || !(champ in p)) return
      const valeur = p[champ]
      delete p[champ]
      if (Object.keys(p).length === 0) pending.current.delete(id)
      void envoyerPatch(id, { [champ]: valeur })
    },
    [envoyerPatch],
  )

  const planifier = useCallback(
    (id: string, champ: string, valeur: unknown) => {
      const p = pending.current.get(id) ?? {}
      p[champ] = valeur
      pending.current.set(id, p)
      const cle = `${id}|${champ}`
      const t = timers.current.get(cle)
      if (t) clearTimeout(t)
      timers.current.set(cle, setTimeout(() => envoyerCellule(id, champ), DELAI_MS))
      setStatut('attente')
    },
    [envoyerCellule],
  )

  /** Envoie immédiatement tout ce qui est en attente. */
  const toutEnregistrer = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t))
    timers.current.clear()
    const lots = Array.from(pending.current.entries())
    pending.current.clear()
    lots.forEach(([id, patch]) => void envoyerPatch(id, patch))
    return lots.length
  }, [envoyerPatch])

  /** Oublie les modifications en attente d'une ligne (ex. ligne supprimée). */
  const annuler = useCallback(
    (id: string) => {
      pending.current.delete(id)
      timers.current.forEach((t, cle) => {
        if (cle.startsWith(id + '|')) {
          clearTimeout(t)
          timers.current.delete(cle)
        }
      })
      majStatut()
    },
    [majStatut],
  )

  // Avertir avant de quitter la page avec des modifications non envoyées ; flush au démontage.
  useEffect(() => {
    const avant = (e: BeforeUnloadEvent) => {
      if (pending.current.size > 0 || inflight.current > 0) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', avant)
    return () => {
      window.removeEventListener('beforeunload', avant)
      toutEnregistrer()
    }
  }, [toutEnregistrer])

  return { planifier, toutEnregistrer, annuler, statut }
}

/** Ctrl+S / Cmd+S : force la sauvegarde immédiate (bloque la boîte « Enregistrer sous » du navigateur). */
export function useRaccourciSauvegarde(toutEnregistrer: () => number) {
  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault()
        const n = toutEnregistrer()
        toast.success(n > 0 ? 'Modifications enregistrées' : 'Tout est déjà enregistré', { duration: 1500 })
      }
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [toutEnregistrer])
}
