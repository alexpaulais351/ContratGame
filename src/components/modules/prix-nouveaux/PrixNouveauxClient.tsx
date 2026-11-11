'use client'
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { FileDown, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatMontant } from '@/lib/utils'
import { VINCI } from '@/lib/design-tokens'
import { useExportPDF } from '@/hooks/useExportPDF'
import { useProfilStore } from '@/stores/profil'
import {
  creerPrixNouveau,
  modifierPrixNouveau,
  reorderPrixNouveaux,
  supprimerPrixNouveau,
} from '@/actions/prix-nouveaux'
import { STATUTS, couleursSem, statutInfo, totaux, type PrixNouveauDTO } from './types'
import { LigneSortable } from './LigneSortable'

type Filtre = 'tous' | (typeof STATUTS)[number]['value']
type Patch = Partial<Omit<PrixNouveauDTO, 'id'>>

function versPayload(p: Patch) {
  const o: Record<string, unknown> = { ...p }
  if ('dateDevis' in p) o.dateDevis = p.dateDevis || null
  if ('dateOS' in p) o.dateOS = p.dateOS || null
  if ('numeroOS' in p) o.numeroOS = p.numeroOS || null
  if ('delaiSupplementaire' in p) o.delaiSupplementaire = p.delaiSupplementaire || null
  if ('commentaire' in p) o.commentaire = p.commentaire || null
  return o
}

export function PrixNouveauxClient({
  projetId,
  nomProjet,
  initial,
}: {
  projetId: string
  nomProjet: string
  initial: PrixNouveauDTO[]
}) {
  const [lignes, setLignes] = useState<PrixNouveauDTO[]>(initial)
  const [filtre, setFiltre] = useState<Filtre>('tous')
  const [aSupprimer, setASupprimer] = useState<PrixNouveauDTO | null>(null)
  const [etat, setEtat] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [, startTransition] = useTransition()
  const { exportAvecGuard, isExporting } = useExportPDF()
  const profil = useProfilStore((s) => s.profil)

  // Auto-save debounced 500 ms, par ligne (patchs cumulés)
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const pending = useRef<Record<string, Patch>>({})
  const savedTimer = useRef<ReturnType<typeof setTimeout>>()

  const flush = useCallback(
    async (id: string) => {
      const patch = pending.current[id]
      delete pending.current[id]
      delete timers.current[id]
      if (!patch) return
      setEtat('saving')
      const r = await modifierPrixNouveau(projetId, id, versPayload(patch))
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
      pending.current[id] = { ...pending.current[id], ...patch }
      clearTimeout(timers.current[id])
      timers.current[id] = setTimeout(() => void flush(id), 500)
    },
    [flush],
  )

  // Enregistre les modifications en attente au démontage
  useEffect(() => {
    const t = timers.current
    return () => {
      Object.keys(t).forEach((id) => {
        clearTimeout(t[id])
        void flush(id)
      })
      clearTimeout(savedTimer.current)
    }
  }, [flush])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const ancien = lignes
    const de = ancien.findIndex((l) => l.id === active.id)
    const vers = ancien.findIndex((l) => l.id === over.id)
    if (de < 0 || vers < 0) return
    const nouveau = arrayMove(ancien, de, vers)
    setLignes(nouveau)
    startTransition(async () => {
      const r = await reorderPrixNouveaux(projetId, nouveau.map((l) => l.id))
      if (!r.success) {
        toast.error(r.error)
        setLignes(ancien)
      }
    })
  }

  const ajouter = async () => {
    const r = await creerPrixNouveau(projetId)
    if (!r.success) return toast.error(r.error)
    setLignes((ls) => [
      ...ls,
      {
        id: r.data.id, numero: '', intitule: '', dateDevis: '', montantPresente: 0, montantAccepte: null,
        debourseReel: null, numeroOS: '', dateOS: '', delaiSupplementaire: '', potentielAcceptation: 50,
        statut: 'a_venir', commentaire: '',
      },
    ])
    setFiltre('tous')
  }

  const confirmerSuppression = async () => {
    const l = aSupprimer
    if (!l) return
    setASupprimer(null)
    clearTimeout(timers.current[l.id])
    delete timers.current[l.id]
    delete pending.current[l.id]
    const ancien = lignes
    setLignes((ls) => ls.filter((x) => x.id !== l.id))
    const r = await supprimerPrixNouveau(projetId, l.id)
    if (!r.success) {
      toast.error(r.error)
      setLignes(ancien)
    } else toast.success('Prix nouveau supprimé')
  }

  const visibles = useMemo(() => (filtre === 'tous' ? lignes : lignes.filter((l) => l.statut === filtre)), [lignes, filtre])
  const tot = useMemo(() => totaux(visibles), [visibles])
  const totGlobal = useMemo(() => totaux(lignes), [lignes])
  const compte = (s: string) => lignes.filter((l) => l.statut === s).length

  const exporter = () =>
    exportAvecGuard(async () => {
      const [{ PrixNouveauxPDF }, { genererEtTelechargerPDF }, { nomFichierSur }] = await Promise.all([
        import('@/lib/pdf/prix-nouveaux'),
        import('@/lib/pdf/telecharger'),
        import('@/lib/pdf/format'),
      ])
      const data = visibles.map((l) => ({
        numero: l.numero,
        intitule: l.intitule,
        dateDevis: l.dateDevis,
        montantPresente: l.montantPresente,
        potentielAcceptation: l.potentielAcceptation,
        montantAccepte: l.montantAccepte,
        debourseReel: l.debourseReel,
        numeroOS: l.numeroOS,
        dateOS: l.dateOS,
        delaiSupplementaire: l.delaiSupplementaire,
        statutLabel: statutInfo(l.statut).label,
        commentaire: l.commentaire,
      }))
      await genererEtTelechargerPDF(
        <PrixNouveauxPDF lignes={data} profil={profil} nomProjet={nomProjet} />,
        `Prix_nouveaux_${nomFichierSur(nomProjet)}.pdf`,
      )
    })

  const kpis = [
    { label: 'Présenté', valeur: formatMontant(totGlobal.presente), couleur: VINCI.bleu },
    { label: 'Pondéré', valeur: formatMontant(totGlobal.pondere), couleur: couleursSem('info').base },
    { label: 'Accepté', valeur: formatMontant(totGlobal.accepte), couleur: couleursSem('succes').base },
    { label: 'Déboursé réel', valeur: formatMontant(totGlobal.debourse), couleur: VINCI.gris },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="page-titre">Prix nouveaux</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-vinci-texte-secondaire" aria-live="polite">
            {etat === 'saving' ? 'Enregistrement…' : etat === 'saved' ? 'Enregistré' : ''}
          </span>
          <Button variant="outline" className="btn-toolbar" onClick={exporter} disabled={isExporting}>
            <FileDown className="mr-1 h-4 w-4" /> {isExporting ? 'Export…' : 'Export PDF'}
          </Button>
          <Button onClick={ajouter}>
            <Plus className="mr-1 h-4 w-4" /> Ajouter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="carte border-l-4" style={{ borderLeftColor: k.couleur }}>
            <div className="text-xs text-vinci-texte-secondaire">{k.label}</div>
            <div className="text-lg font-bold tabular-nums text-black">{k.valeur}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFiltre('tous')}
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            filtre === 'tous' ? 'border-vinci-bleu bg-vinci-bleu text-white' : 'border-vinci-gris-bordure bg-white text-black hover:bg-vinci-gris-clair'
          }`}
        >
          Tous ({lignes.length})
        </button>
        {STATUTS.map((s) => {
          const c = couleursSem(s.sem)
          const actif = filtre === s.value
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => setFiltre(s.value)}
              className="rounded-full border px-3 py-1 text-xs font-medium"
              style={{
                borderColor: c.base,
                backgroundColor: actif ? c.base : c.clair,
                color: actif ? VINCI.blanc : VINCI.noir,
              }}
            >
              {s.label} ({compte(s.value)})
            </button>
          )
        })}
        {filtre !== 'tous' && (
          <span className="text-xs text-vinci-texte-secondaire">Glisser-déposer désactivé pendant le filtrage</span>
        )}
      </div>

      <div className="overflow-x-auto rounded-md border border-vinci-gris-bordure bg-white">
        <table className="table-vinci min-w-[1500px]">
          <thead>
            <tr>
              <th className="w-8" />
              <th className="w-24">N° devis</th>
              <th className="min-w-[220px]">Intitulé</th>
              <th className="w-36">Date devis</th>
              <th className="w-32 text-right">Présenté</th>
              <th className="w-28">Potentiel</th>
              <th className="w-32 text-right">Pondéré</th>
              <th className="w-32 text-right">Accepté</th>
              <th className="w-32 text-right">Déboursé</th>
              <th className="w-28 text-right">Marge</th>
              <th className="w-24">N° OS</th>
              <th className="w-36">Date OS</th>
              <th className="w-28">Délai suppl.</th>
              <th className="w-32">Statut</th>
              <th className="min-w-[200px]">Commentaire</th>
              <th className="w-10" />
            </tr>
          </thead>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={visibles.map((l) => l.id)} strategy={verticalListSortingStrategy}>
              <tbody>
                {visibles.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="py-8 text-center text-vinci-texte-secondaire">
                      Aucun prix nouveau{filtre !== 'tous' ? ' pour ce statut' : ''}.
                    </td>
                  </tr>
                ) : (
                  visibles.map((l) => (
                    <LigneSortable
                      key={l.id}
                      ligne={l}
                      dragActif={filtre === 'tous'}
                      onChange={(p) => modifier(l.id, p)}
                      onSupprimer={() => setASupprimer(l)}
                    />
                  ))
                )}
              </tbody>
            </SortableContext>
          </DndContext>
          <tfoot>
            <tr>
              <td colSpan={4}>
                Totaux{filtre !== 'tous' ? ` — ${statutInfo(filtre).label}` : ''}
              </td>
              <td className="num">{formatMontant(tot.presente)}</td>
              <td />
              <td className="num">{formatMontant(tot.pondere)}</td>
              <td className="num">{formatMontant(tot.accepte)}</td>
              <td className="num">{formatMontant(tot.debourse)}</td>
              <td colSpan={7} />
            </tr>
          </tfoot>
        </table>
      </div>

      <Dialog open={aSupprimer !== null} onOpenChange={(o) => !o && setASupprimer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce prix nouveau ?</DialogTitle>
            <DialogDescription>
              {aSupprimer ? `${aSupprimer.numero || 'Sans numéro'} — ${aSupprimer.intitule || 'Sans intitulé'}. ` : ''}
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="btn-secondaire" onClick={() => setASupprimer(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmerSuppression}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
