'use client'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowUp, Check, FileDown, Heading, Import, Link2, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useExportPDF } from '@/hooks/useExportPDF'
import { useProfilStore } from '@/stores/profil'
import { nomFichierSur } from '@/lib/pdf/format'
import {
  ajouterLigneFicheEcart,
  modifierLigneFicheEcart,
  reordonnerFicheEcart,
  supprimerLigneFicheEcart,
  type LigneFicheEcartDTO,
} from '@/actions/fiche-ecart'
import { ImportJournalDialog } from './ImportJournalDialog'
import { JournalOnglets } from './JournalOnglets'
import type { EvenementImportable } from './types'
import { CHAMPS_FICHE_ECART, numeroterFicheEcart, type ChampFicheEcart } from './numerotation'

export type { EvenementImportable }

type Patch = Partial<Record<ChampFicheEcart, string>>

const LARGEURS: Record<ChampFicheEcart, string> = {
  etude: 'min-w-[220px]',
  prevuDCE: 'min-w-[160px]',
  phaseTransitoire: 'min-w-[160px]',
  exe: 'min-w-[160px]',
  impacts: 'min-w-[200px]',
  delaisImpactes: 'min-w-[120px]',
  coutImpactes: 'min-w-[120px]',
}
const COLONNES_FICHE_ECART = CHAMPS_FICHE_ECART.map((c) => ({ ...c, largeur: LARGEURS[c.champ] }))

/** Textarea qui s'ajuste à son contenu. */
function TextareaAuto({ value, onChange, className, placeholder }: { value: string; onChange: (v: string) => void; className?: string; placeholder?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const t = ref.current
    if (!t) return
    t.style.height = '0px'
    t.style.height = `${t.scrollHeight}px`
  }, [value])
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn('cell-input block resize-none overflow-hidden leading-snug', className)}
    />
  )
}

export function FicheEcartClient({
  projetId,
  nomProjet,
  initial,
  evenements,
}: {
  projetId: string
  nomProjet: string
  initial: LigneFicheEcartDTO[]
  evenements: EvenementImportable[]
}) {
  const [lignes, setLignes] = useState(initial)
  const [etat, setEtat] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [importOuvert, setImportOuvert] = useState(false)
  const [aSupprimer, setASupprimer] = useState<LigneFicheEcartDTO | null>(null)
  const [pending, start] = useTransition()
  const { exportAvecGuard, isExporting } = useExportPDF()
  const profil = useProfilStore((s) => s.profil)

  // Auto-save debounced 500 ms, par ligne (patchs cumulés)
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const pendingPatch = useRef<Record<string, Patch>>({})
  const savedTimer = useRef<ReturnType<typeof setTimeout>>()

  const flush = useCallback(
    async (id: string) => {
      const patch = pendingPatch.current[id]
      delete pendingPatch.current[id]
      delete timers.current[id]
      if (!patch) return
      setEtat('saving')
      const r = await modifierLigneFicheEcart(projetId, id, patch)
      if (!r.success) {
        toast.error(r.error)
        setEtat('idle')
        return
      }
      setEtat('saved')
      clearTimeout(savedTimer.current)
      savedTimer.current = setTimeout(() => setEtat('idle'), 1800)
    },
    [projetId],
  )

  const modifier = useCallback(
    (id: string, patch: Patch) => {
      setLignes((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)))
      pendingPatch.current[id] = { ...pendingPatch.current[id], ...patch }
      clearTimeout(timers.current[id])
      timers.current[id] = setTimeout(() => void flush(id), 500)
    },
    [flush],
  )

  const toutEnregistrer = useCallback(async () => {
    const ids = Object.keys(timers.current)
    ids.forEach((id) => clearTimeout(timers.current[id]))
    await Promise.all(ids.map((id) => flush(id)))
  }, [flush])

  useEffect(() => {
    const t = timers.current
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void toutEnregistrer()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      Object.keys(t).forEach((id) => {
        clearTimeout(t[id])
        void flush(id)
      })
      clearTimeout(savedTimer.current)
    }
  }, [flush, toutEnregistrer])

  const numeros = useMemo(() => numeroterFicheEcart(lignes), [lignes])
  const importes = useMemo(() => new Set(lignes.map((l) => l.evenementId).filter((x): x is string => !!x)), [lignes])
  const importables = useMemo(() => evenements.filter((e) => !importes.has(e.id)), [evenements, importes])
  const evParId = useMemo(() => new Map(evenements.map((e) => [e.id, e])), [evenements])

  function ajouter(estChapitre: boolean) {
    start(async () => {
      const r = await ajouterLigneFicheEcart(projetId, { estChapitre })
      if (!r.success) return void toast.error(r.error)
      setLignes((ls) => [...ls, r.data])
    })
  }

  function deplacer(index: number, sens: -1 | 1) {
    const cible = index + sens
    if (cible < 0 || cible >= lignes.length) return
    const ancien = lignes
    const nouveau = [...lignes]
    ;[nouveau[index], nouveau[cible]] = [nouveau[cible], nouveau[index]]
    setLignes(nouveau)
    start(async () => {
      const r = await reordonnerFicheEcart(projetId, nouveau.map((l) => l.id))
      if (!r.success) {
        toast.error(r.error)
        setLignes(ancien)
      }
    })
  }

  function confirmerSuppression() {
    if (!aSupprimer) return
    const l = aSupprimer
    clearTimeout(timers.current[l.id])
    delete timers.current[l.id]
    delete pendingPatch.current[l.id]
    start(async () => {
      const r = await supprimerLigneFicheEcart(projetId, l.id)
      if (!r.success) return void toast.error(r.error)
      setLignes((ls) => ls.filter((x) => x.id !== l.id))
      setASupprimer(null)
    })
  }

  function exporter() {
    void exportAvecGuard(async () => {
      await toutEnregistrer()
      const [{ FicheEcartPDF }, { genererEtTelechargerPDF }] = await Promise.all([import('@/lib/pdf/fiche-ecart'), import('@/lib/pdf/telecharger')])
      await genererEtTelechargerPDF(<FicheEcartPDF profil={profil} nomProjet={nomProjet} lignes={lignes} />, `Fiche_ecart_${nomFichierSur(nomProjet)}.pdf`)
    })
  }

  const nbLignes = lignes.filter((l) => !l.estChapitre).length

  return (
    <div className="space-y-4">
      <JournalOnglets projetId={projetId} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="page-titre">Fiche écart</h2>
          <p className="text-sm text-vinci-texte-secondaire">
            {nbLignes} écart{nbLignes > 1 ? 's' : ''} · {lignes.length - nbLignes} chapitre{lignes.length - nbLignes > 1 ? 's' : ''}
            <span className="ml-3 inline-flex items-center gap-1 text-xs">
              {etat === 'saving' && (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" /> Enregistrement…
                </>
              )}
              {etat === 'saved' && (
                <span className="inline-flex items-center gap-1 text-vinci-vert">
                  <Check className="h-3 w-3" /> Enregistré
                </span>
              )}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="btn-toolbar" onClick={() => ajouter(true)} disabled={pending}>
            <Heading /> Chapitre
          </Button>
          <Button variant="outline" className="btn-toolbar" onClick={() => ajouter(false)} disabled={pending}>
            <Plus /> Ligne
          </Button>
          <Button variant="outline" className="btn-secondaire" onClick={() => setImportOuvert(true)}>
            <Import /> Importer depuis Journal
          </Button>
          <Button variant="outline" className="btn-secondaire" onClick={exporter} disabled={isExporting || lignes.length === 0}>
            {isExporting ? <Loader2 className="animate-spin" /> : <FileDown />} Exporter PDF
          </Button>
        </div>
      </div>

      <section className="carte overflow-x-auto p-0">
        {lignes.length === 0 ? (
          <div className="p-8 text-center text-sm text-vinci-texte-secondaire">
            Fiche écart vide. Ajoutez un chapitre, une ligne, ou importez des événements du journal.
          </div>
        ) : (
          <table className="table-vinci">
            <thead>
              <tr>
                <th className="w-[44px]">N°</th>
                {COLONNES_FICHE_ECART.map((c) => (
                  <th key={c.champ} className={c.largeur}>
                    {c.libelle}
                  </th>
                ))}
                <th className="w-[104px]" />
              </tr>
            </thead>
            <tbody>
              {lignes.map((l, i) => {
                const actions = (
                  <div className="flex items-center justify-end gap-0.5">
                    <Button size="icon" variant="ghost" className="h-7 w-7" title="Monter" disabled={i === 0 || pending} onClick={() => deplacer(i, -1)}>
                      <ArrowUp />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      title="Descendre"
                      disabled={i === lignes.length - 1 || pending}
                      onClick={() => deplacer(i, 1)}
                    >
                      <ArrowDown />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-vinci-rouge hover:bg-vinci-rouge-tres-clair hover:text-vinci-rouge-fonce"
                      title="Supprimer"
                      onClick={() => setASupprimer(l)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                )
                if (l.estChapitre) {
                  return (
                    <tr key={l.id} className="!bg-vinci-bleu-tres-clair">
                      <td className="align-top font-bold text-vinci-bleu-fonce">{numeros[l.id]}</td>
                      <td colSpan={COLONNES_FICHE_ECART.length} className="align-top">
                        <TextareaAuto
                          value={l.etude}
                          onChange={(v) => modifier(l.id, { etude: v })}
                          placeholder="Titre du chapitre"
                          className="font-bold uppercase text-vinci-bleu-fonce"
                        />
                      </td>
                      <td className="align-top">{actions}</td>
                    </tr>
                  )
                }
                const ev = l.evenementId ? evParId.get(l.evenementId) : undefined
                return (
                  <tr key={l.id}>
                    <td className="align-top tabular-nums text-vinci-texte-secondaire">{numeros[l.id]}</td>
                    {COLONNES_FICHE_ECART.map((c) => (
                      <td key={c.champ} className="align-top">
                        <TextareaAuto value={l[c.champ]} onChange={(v) => modifier(l.id, { [c.champ]: v })} className={c.champ === 'etude' ? 'font-semibold' : ''} />
                        {c.champ === 'etude' && ev && (
                          <Link
                            href={`/projets/${projetId}/suivi/journal#ev-${ev.id}`}
                            className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-vinci-bleu-clair hover:underline"
                            title="Événement du journal à l'origine de cette ligne"
                          >
                            <Link2 className="h-3 w-3" /> Journal
                          </Link>
                        )}
                      </td>
                    ))}
                    <td className="align-top">{actions}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>

      <ImportJournalDialog
        open={importOuvert}
        onOpenChange={setImportOuvert}
        projetId={projetId}
        evenements={importables}
        onImporte={(nouvelles) => setLignes((ls) => [...ls, ...nouvelles])}
      />

      <Dialog open={!!aSupprimer} onOpenChange={(o) => !o && setASupprimer(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-vinci-bleu">{aSupprimer?.estChapitre ? 'Supprimer le chapitre ?' : 'Supprimer la ligne ?'}</DialogTitle>
            <DialogDescription>
              {aSupprimer?.estChapitre
                ? 'Seule la ligne de chapitre est supprimée : les écarts qui suivent sont conservés.'
                : `« ${aSupprimer?.etude || 'Ligne sans titre'} » sera supprimée définitivement.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="btn-secondaire" onClick={() => setASupprimer(null)} disabled={pending}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmerSuppression} disabled={pending}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
