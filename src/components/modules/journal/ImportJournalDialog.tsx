'use client'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { Import, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { VINCI } from '@/lib/design-tokens'
import { importerDepuisJournal, type LigneFicheEcartDTO } from '@/actions/fiche-ecart'
import { jourFR, type EvenementImportable } from './types'

type Props = {
  open: boolean
  onOpenChange: (o: boolean) => void
  projetId: string
  /** événements pas encore importés (anti-doublon) */
  evenements: EvenementImportable[]
  onImporte: (lignes: LigneFicheEcartDTO[]) => void
}

export function ImportJournalDialog({ open, onOpenChange, projetId, evenements, onImporte }: Props) {
  const [selection, setSelection] = useState<string[]>([])
  const [recherche, setRecherche] = useState('')
  const [pending, start] = useTransition()

  useEffect(() => {
    if (open) {
      setSelection([])
      setRecherche('')
    }
  }, [open])

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    if (!q) return evenements
    return evenements.filter((e) => `${e.titre} ${e.description ?? ''} ${e.categorie ?? ''} ${jourFR(e.jour)}`.toLowerCase().includes(q))
  }, [evenements, recherche])

  const tousCoches = filtres.length > 0 && filtres.every((e) => selection.includes(e.id))

  function basculer(id: string) {
    setSelection((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  function importer() {
    start(async () => {
      const r = await importerDepuisJournal(projetId, selection)
      if (!r.success) return void toast.error(r.error)
      onImporte(r.data)
      toast.success(`${r.data.length} ligne${r.data.length > 1 ? 's' : ''} importée${r.data.length > 1 ? 's' : ''}`)
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col">
        <DialogHeader>
          <DialogTitle className="text-vinci-bleu">Importer depuis le Journal</DialogTitle>
          <DialogDescription>
            Une ligne par événement sélectionné (« titre (date) »). Les événements déjà importés n&apos;apparaissent pas.
          </DialogDescription>
        </DialogHeader>

        {evenements.length === 0 ? (
          <p className="py-6 text-center text-sm text-vinci-texte-secondaire">Tous les événements du journal sont déjà importés.</p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-vinci-gris" />
                <Input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher un événement" className="pl-8" />
              </div>
              <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm">
                <Checkbox
                  checked={tousCoches}
                  onCheckedChange={(v) =>
                    setSelection((s) =>
                      v === true ? Array.from(new Set([...s, ...filtres.map((e) => e.id)])) : s.filter((id) => !filtres.some((e) => e.id === id)),
                    )
                  }
                />
                Tout sélectionner
              </label>
            </div>
            <ul className="min-h-0 flex-1 divide-y divide-vinci-gris-bordure overflow-y-auto rounded-sm border border-vinci-gris-bordure">
              {filtres.map((e) => {
                const coche = selection.includes(e.id)
                return (
                  <li key={e.id}>
                    <label className={`flex cursor-pointer items-start gap-3 px-3 py-2 ${coche ? 'bg-vinci-bleu-tres-clair' : 'hover:bg-vinci-gris-clair'}`}>
                      <Checkbox checked={coche} onCheckedChange={() => basculer(e.id)} className="mt-0.5" />
                      <span className="w-[84px] shrink-0 text-sm font-semibold tabular-nums">{jourFR(e.jour)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-vinci-bleu-fonce">{e.titre}</span>
                        {e.description && <span className="line-clamp-1 block text-xs text-vinci-texte-secondaire">{e.description}</span>}
                      </span>
                      {e.categorie && (
                        <span className="inline-flex shrink-0 items-center gap-1 text-xs text-vinci-texte-secondaire">
                          <span className="h-2 w-2 rounded-full" style={{ background: e.couleur ?? VINCI.gris }} />
                          {e.categorie}
                        </span>
                      )}
                    </label>
                  </li>
                )
              })}
              {filtres.length === 0 && <li className="px-3 py-4 text-center text-sm text-vinci-texte-secondaire">Aucun résultat</li>}
            </ul>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" className="btn-secondaire" onClick={() => onOpenChange(false)} disabled={pending}>
            Annuler
          </Button>
          <Button onClick={importer} disabled={pending || selection.length === 0}>
            <Import /> Importer ({selection.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
