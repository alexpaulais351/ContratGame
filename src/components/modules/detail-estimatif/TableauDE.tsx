'use client'
import { memo, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type Modifier,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { defaultRangeExtractor, useVirtualizer, type Range } from '@tanstack/react-virtual'
import { FileDown, FolderPlus, GripVertical, Plus, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn, formatMontant, formatNombreFR } from '@/lib/utils'
import { creerLigneDE, reorderLignesDE, supprimerLigneDE, updateLigneDE } from '@/actions/detail-estimatif'
import { CelluleNombre, CelluleTexte } from './Cellules'
import { IndicateurSauvegarde } from './IndicateurSauvegarde'
import { ExportDEDialog } from './ExportDEDialog'
import { useAutoSave, useRaccourciSauvegarde } from './useAutoSave'
import { calculerSousTotaux, montantLigne, totalGeneral, type LigneDEClient } from './types'

// ---------------------------------------------------------------------------
// Constantes de mise en page (hauteurs fixes → virtualisation sans mesure)
// ---------------------------------------------------------------------------
const HAUTEUR_LIGNE = 36
const HAUTEUR_ENTETE = 36
const HAUTEUR_PIED = 38
const NB_COLONNES = 8

/** Colonnes éditables, dans l'ordre de navigation clavier. */
const CHAMPS = ['code', 'designation', 'unite', 'quantite', 'prixUnitaire'] as const
type Champ = (typeof CHAMPS)[number]
/** Un chapitre n'a que code + désignation. */
const DERNIERE_COL_CHAPITRE = 1

type Props = { projetId: string; nomProjet: string; lignesInitiales: LigneDEClient[] }

/** Empêche tout déplacement horizontal pendant le glisser-déposer. */
const restreindreVertical: Modifier = ({ transform }) => ({ ...transform, x: 0 })

export function TableauDE({ projetId, nomProjet, lignesInitiales }: Props) {
  const [lignes, setLignes] = useState<LigneDEClient[]>(lignesInitiales)
  const [selectionId, setSelectionId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [confirmerSuppression, setConfirmerSuppression] = useState(false)
  const [exportOuvert, setExportOuvert] = useState(false)
  const [creationEnCours, setCreationEnCours] = useState(false)

  const lignesRef = useRef(lignes)
  lignesRef.current = lignes

  // ----- Auto-save -----------------------------------------------------------
  const envoyer = useCallback((id: string, patch: Record<string, unknown>) => updateLigneDE(projetId, id, patch), [projetId])
  const { planifier, toutEnregistrer, annuler, statut } = useAutoSave(envoyer)
  useRaccourciSauvegarde(toutEnregistrer)

  const modifierChamp = useCallback(
    (id: string, champ: Champ, valeur: string | number) => {
      setLignes((prev) => prev.map((l) => (l.id === id ? { ...l, [champ]: valeur } : l)))
      planifier(id, champ, valeur)
    },
    [planifier],
  )

  // ----- Calculs -------------------------------------------------------------
  const sousTotaux = useMemo(() => calculerSousTotaux(lignes), [lignes])
  const total = useMemo(() => totalGeneral(lignes), [lignes])
  const ids = useMemo(() => lignes.map((l) => l.id), [lignes])
  const nbChapitres = useMemo(() => lignes.filter((l) => l.estChapitre).length, [lignes])
  const indexActif = activeId ? ids.indexOf(activeId) : -1
  const indexSelection = selectionId ? ids.indexOf(selectionId) : -1

  // ----- Virtualisation ------------------------------------------------------
  const scrollRef = useRef<HTMLDivElement>(null)
  const indexActifRef = useRef(indexActif)
  indexActifRef.current = indexActif
  const rangeExtractor = useCallback((range: Range) => {
    // La ligne en cours de glisser reste toujours montée (dnd-kit en a besoin).
    const base = defaultRangeExtractor(range)
    const a = indexActifRef.current
    if (a >= 0 && !base.includes(a)) return [...base, a].sort((x, y) => x - y)
    return base
  }, [])
  const virtualizer = useVirtualizer({
    count: lignes.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => HAUTEUR_LIGNE,
    overscan: 15,
    paddingStart: HAUTEUR_ENTETE,
    scrollPaddingStart: HAUTEUR_ENTETE,
    scrollPaddingEnd: HAUTEUR_PIED,
    rangeExtractor,
    getItemKey: (i) => lignesRef.current[i]?.id ?? i,
  })
  const items = virtualizer.getVirtualItems()
  const totalHauteur = virtualizer.getTotalSize()
  // Rangées rendues + espaceurs (gère aussi la ligne glissée hors de la fenêtre visible).
  const rendu: ({ type: 'ligne'; index: number } | { type: 'espace'; cle: string; hauteur: number })[] = []
  let curseur = HAUTEUR_ENTETE
  for (const item of items) {
    if (item.start > curseur) rendu.push({ type: 'espace', cle: `e${item.index}`, hauteur: item.start - curseur })
    rendu.push({ type: 'ligne', index: item.index })
    curseur = item.end
  }
  if (totalHauteur > curseur) rendu.push({ type: 'espace', cle: 'fin', hauteur: totalHauteur - curseur })

  // ----- Navigation clavier --------------------------------------------------
  const colVoulue = useRef(1)
  const navVerticale = useRef(false)
  const focusCellule = useCallback(
    (ligne: number, col: number, vertical = false) => {
      const n = lignesRef.current.length
      if (n === 0) return
      const r = Math.max(0, Math.min(n - 1, ligne))
      const cible = lignesRef.current[r]
      const c = cible.estChapitre ? Math.min(col, DERNIERE_COL_CHAPITRE) : col
      if (!vertical) colVoulue.current = col
      navVerticale.current = vertical
      virtualizer.scrollToIndex(r, { align: 'auto' })
      let essais = 0
      const tenter = () => {
        const el = scrollRef.current?.querySelector<HTMLInputElement>(`input[data-nav-ligne="${r}"][data-nav-col="${c}"]`)
        if (el) {
          if (el === document.activeElement) navVerticale.current = false
          el.focus({ preventScroll: false })
        } else if (essais++ < 10) {
          requestAnimationFrame(tenter)
        }
      }
      requestAnimationFrame(tenter)
    },
    [virtualizer],
  )

  const surToucheTableau = useCallback(
    (e: KeyboardEvent<HTMLTableSectionElement>) => {
      const cible = e.target as HTMLElement
      if (cible.tagName !== 'INPUT') return
      const ligne = Number(cible.dataset.navLigne)
      const col = Number(cible.dataset.navCol)
      if (!Number.isFinite(ligne) || !Number.isFinite(col)) return
      const estChapitre = lignesRef.current[ligne]?.estChapitre
      const derniereCol = estChapitre ? DERNIERE_COL_CHAPITRE : CHAMPS.length - 1
      const dernColDe = (i: number) => (lignesRef.current[i]?.estChapitre ? DERNIERE_COL_CHAPITRE : CHAMPS.length - 1)

      switch (e.key) {
        case 'Enter':
          e.preventDefault()
          focusCellule(ligne + (e.shiftKey ? -1 : 1), colVoulue.current, true)
          break
        case 'ArrowDown':
          e.preventDefault()
          focusCellule(ligne + 1, colVoulue.current, true)
          break
        case 'ArrowUp':
          e.preventDefault()
          focusCellule(ligne - 1, colVoulue.current, true)
          break
        case 'Tab':
          e.preventDefault()
          if (e.shiftKey) {
            if (col > 0) focusCellule(ligne, col - 1)
            else if (ligne > 0) focusCellule(ligne - 1, dernColDe(ligne - 1))
          } else if (col < derniereCol) focusCellule(ligne, col + 1)
          else if (ligne < lignesRef.current.length - 1) focusCellule(ligne + 1, 0)
          break
        case 'Escape':
          cible.blur()
          break
      }
    },
    [focusCellule],
  )

  const surFocusCellule = useCallback((id: string, col: number) => {
    setSelectionId(id)
    // Un clic / Tab dans une cellule fixe la colonne de référence (pas une navigation verticale,
    // pour retrouver la bonne colonne après avoir traversé un chapitre).
    if (!navVerticale.current) colVoulue.current = col
    navVerticale.current = false
  }, [])

  // Focus différé sur une ligne qui vient d'être créée (après le rendu).
  const [focusApres, setFocusApres] = useState<string | null>(null)
  useEffect(() => {
    if (!focusApres) return
    const i = lignes.findIndex((l) => l.id === focusApres)
    if (i >= 0) {
      setFocusApres(null)
      focusCellule(i, 1)
    }
  }, [focusApres, focusCellule, lignes])

  // ----- Ajout / suppression -------------------------------------------------
  const ajouter = useCallback(
    async (estChapitre: boolean) => {
      if (creationEnCours) return
      setCreationEnCours(true)
      const apresId = selectionId && lignesRef.current.some((l) => l.id === selectionId) ? selectionId : null
      try {
        const res = await creerLigneDE(projetId, { apresId, estChapitre })
        if (!res.success) {
          toast.error(res.error)
          return
        }
        const nouvelle = res.data
        setLignes((prev) => {
          const i = apresId ? prev.findIndex((l) => l.id === apresId) : -1
          const copie = [...prev]
          copie.splice(i >= 0 ? i + 1 : copie.length, 0, nouvelle)
          return copie
        })
        setSelectionId(nouvelle.id)
        setFocusApres(nouvelle.id)
      } finally {
        setCreationEnCours(false)
      }
    },
    [creationEnCours, projetId, selectionId],
  )

  const ligneSelectionnee = indexSelection >= 0 ? lignes[indexSelection] : null

  const supprimer = useCallback(async () => {
    if (!ligneSelectionnee) return
    const id = ligneSelectionnee.id
    const index = lignesRef.current.findIndex((l) => l.id === id)
    setConfirmerSuppression(false)
    annuler(id)
    const avant = lignesRef.current
    setLignes((prev) => prev.filter((l) => l.id !== id))
    const suivante = avant[index + 1] ?? avant[index - 1]
    setSelectionId(suivante?.id ?? null)
    const res = await supprimerLigneDE(projetId, id)
    if (!res.success) {
      toast.error(res.error)
      setLignes(avant)
    } else {
      toast.success(ligneSelectionnee.estChapitre ? 'Chapitre supprimé' : 'Ligne supprimée')
    }
  }, [annuler, ligneSelectionnee, projetId])

  // ----- Glisser-déposer -----------------------------------------------------
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const surDebutGlisser = useCallback((e: DragStartEvent) => {
    setActiveId(String(e.active.id))
    setSelectionId(String(e.active.id))
  }, [])

  const surFinGlisser = useCallback(
    async (e: DragEndEvent) => {
      setActiveId(null)
      const { active, over } = e
      if (!over || active.id === over.id) return
      const avant = lignesRef.current
      const ancien = avant.findIndex((l) => l.id === active.id)
      const nouveau = avant.findIndex((l) => l.id === over.id)
      if (ancien < 0 || nouveau < 0) return
      const reordonnees = arrayMove(avant, ancien, nouveau)
      setLignes(reordonnees)
      const res = await reorderLignesDE(
        projetId,
        reordonnees.map((l) => l.id),
      )
      if (!res.success) {
        toast.error(res.error)
        setLignes(avant)
      }
    },
    [projetId],
  )

  const ligneActive = indexActif >= 0 ? lignes[indexActif] : null

  // Garde la sélection visible si elle disparaît (ex. après suppression).
  useEffect(() => {
    if (selectionId && !lignes.some((l) => l.id === selectionId)) setSelectionId(null)
  }, [lignes, selectionId])

  return (
    <div className="space-y-3">
      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="page-titre mr-2">Détail Estimatif</h2>
        <Button size="sm" onClick={() => ajouter(false)} disabled={creationEnCours}>
          <Plus /> Ligne
        </Button>
        <Button size="sm" variant="outline" className="btn-secondaire" onClick={() => ajouter(true)} disabled={creationEnCours}>
          <FolderPlus /> Chapitre
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => setConfirmerSuppression(true)}
          disabled={!ligneSelectionnee}
          title={ligneSelectionnee ? 'Supprimer la ligne sélectionnée' : 'Sélectionnez une ligne'}
        >
          <Trash2 /> Supprimer
        </Button>
        <Button size="sm" variant="outline" className="btn-toolbar" onClick={() => toutEnregistrer()} title="Enregistrer maintenant (Ctrl+S)">
          <Save /> Enregistrer
        </Button>
        <Button size="sm" variant="outline" className="btn-secondaire" onClick={() => setExportOuvert(true)} disabled={lignes.length === 0}>
          <FileDown /> Export PDF
        </Button>
        <div className="ml-auto flex items-center gap-4">
          <IndicateurSauvegarde statut={statut} />
          <span className="text-xs text-vinci-texte-secondaire">
            {lignes.length - nbChapitres} ligne{lignes.length - nbChapitres > 1 ? 's' : ''} · {nbChapitres} chapitre{nbChapitres > 1 ? 's' : ''}
          </span>
        </div>
      </div>
      <p className="text-xs text-vinci-texte-secondaire">
        Les ajouts se font après la ligne sélectionnée (ou en fin de tableau). Entrée / flèches : ligne suivante ou précédente · Tab : cellule
        suivante · glisser la poignée pour réordonner.
      </p>

      {lignes.length === 0 ? (
        <div className="carte flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-vinci-texte-secondaire">Le détail estimatif est vide.</p>
          <div className="flex gap-2">
            <Button onClick={() => ajouter(true)} disabled={creationEnCours}>
              <FolderPlus /> Créer un premier chapitre
            </Button>
            <Button variant="outline" className="btn-secondaire" onClick={() => ajouter(false)} disabled={creationEnCours}>
              <Plus /> Ajouter une ligne
            </Button>
          </div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restreindreVertical]}
          onDragStart={surDebutGlisser}
          onDragEnd={surFinGlisser}
          onDragCancel={() => setActiveId(null)}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <div
              ref={scrollRef}
              className="relative overflow-auto rounded-md border border-vinci-gris-bordure"
              style={{ height: 'max(420px, calc(100vh - 290px))' }}
            >
              <table className="table-vinci min-w-[820px] table-fixed">
                <colgroup>
                  <col style={{ width: 34 }} />
                  <col style={{ width: 96 }} />
                  <col />
                  <col style={{ width: 72 }} />
                  <col style={{ width: 112 }} />
                  <col style={{ width: 120 }} />
                  <col style={{ width: 148 }} />
                  <col style={{ width: 8 }} />
                </colgroup>
                <thead>
                  <tr style={{ height: HAUTEUR_ENTETE }}>
                    <th aria-label="Déplacer" />
                    <th>Code</th>
                    <th>Désignation</th>
                    <th>Unité</th>
                    <th className="num">Quantité</th>
                    <th className="num">PU HT</th>
                    <th className="num">Montant HT</th>
                    <th />
                  </tr>
                </thead>
                <tbody onKeyDown={surToucheTableau}>
                  {rendu.map((r) => {
                    if (r.type === 'espace') {
                      return (
                        <tr key={r.cle} aria-hidden style={{ height: r.hauteur }}>
                          <td colSpan={NB_COLONNES} className="!border-0 !p-0" />
                        </tr>
                      )
                    }
                    const ligne = lignes[r.index]
                    if (!ligne) return null
                    return (
                      <LigneSortable
                        key={ligne.id}
                        ligne={ligne}
                        index={r.index}
                        selectionnee={ligne.id === selectionId}
                        sousTotal={ligne.estChapitre ? sousTotaux.get(ligne.id) ?? 0 : 0}
                        onChamp={modifierChamp}
                        onFocusCellule={surFocusCellule}
                      />
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ height: HAUTEUR_PIED }}>
                    <td colSpan={6} className="sticky bottom-0 z-10 text-right uppercase tracking-wide">
                      Total général HT
                    </td>
                    <td className="num sticky bottom-0 z-10 whitespace-nowrap">{formatMontant(total)}</td>
                    <td className="sticky bottom-0 z-10" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </SortableContext>
          <DragOverlay dropAnimation={null}>
            {ligneActive ? <ApercuGlisser ligne={ligneActive} sousTotal={sousTotaux.get(ligneActive.id) ?? 0} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Dialogs au niveau racine (jamais imbriqués dans un Sheet) */}
      <Dialog open={confirmerSuppression} onOpenChange={setConfirmerSuppression}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ligneSelectionnee?.estChapitre ? 'Supprimer le chapitre ?' : 'Supprimer la ligne ?'}</DialogTitle>
            <DialogDescription>
              {ligneSelectionnee ? (
                <>
                  <span className="font-medium text-black">
                    {[ligneSelectionnee.code, ligneSelectionnee.designation].filter(Boolean).join(' — ') || '(ligne sans désignation)'}
                  </span>
                  <br />
                  {ligneSelectionnee.estChapitre
                    ? 'Les lignes du chapitre sont conservées (elles rejoindront le chapitre précédent).'
                    : 'Les quantités saisies dans les situations pour cette ligne seront également supprimées.'}
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="btn-secondaire" onClick={() => setConfirmerSuppression(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={supprimer}>
              <Trash2 /> Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ExportDEDialog open={exportOuvert} onOpenChange={setExportOuvert} lignes={lignes} nomProjet={nomProjet} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Ligne triable
// ---------------------------------------------------------------------------

type LigneProps = {
  ligne: LigneDEClient
  index: number
  selectionnee: boolean
  sousTotal: number
  onChamp: (id: string, champ: Champ, valeur: string | number) => void
  onFocusCellule: (id: string, col: number) => void
}

const LigneSortable = memo(function LigneSortable({ ligne, index, selectionnee, sousTotal, onChamp, onFocusCellule }: LigneProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: ligne.id })
  const style: CSSProperties = {
    height: HAUTEUR_LIGNE,
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : undefined,
    position: 'relative',
    zIndex: isDragging ? 1 : undefined,
  }
  const pair = index % 2 === 1
  const chap = ligne.estChapitre
  const nav = (col: number) => ({
    'data-nav-ligne': index,
    'data-nav-col': col,
    onFocus: () => onFocusCellule(ligne.id, col),
  })
  const td = '!px-1 !py-0'

  return (
    <tr
      ref={setNodeRef}
      style={style}
      data-selected={selectionnee}
      className={cn(
        chap
          ? '!bg-vinci-bleu-tres-clair font-bold text-vinci-bleu-fonce'
          : selectionnee
            ? '!bg-vinci-bleu-tres-clair text-vinci-bleu-fonce'
            : pair
              ? '!bg-vinci-gris-clair'
              : '!bg-white',
      )}
    >
      <td
        className={cn(
          td,
          'text-center',
          selectionnee ? 'shadow-[inset_3px_0_0_#E20025]' : chap ? 'shadow-[inset_3px_0_0_#004489]' : undefined,
        )}
      >
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          tabIndex={-1}
          className="inline-flex h-7 w-6 cursor-grab touch-none items-center justify-center rounded-sm text-vinci-gris hover:bg-vinci-gris-bordure hover:text-vinci-bleu active:cursor-grabbing"
          aria-label="Déplacer la ligne"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className={td}>
        <CelluleTexte valeur={ligne.code} onValeur={(v) => onChamp(ligne.id, 'code', v)} maxLength={50} {...nav(0)} />
      </td>
      {chap ? (
        <>
          <td className={td} colSpan={4}>
            <CelluleTexte
              valeur={ligne.designation}
              onValeur={(v) => onChamp(ligne.id, 'designation', v)}
              className="font-bold uppercase"
              placeholder="Intitulé du chapitre"
              maxLength={1000}
              {...nav(1)}
            />
          </td>
          <td className={cn(td, 'num whitespace-nowrap !pr-2')} title="Sous-total du chapitre">
            {formatMontant(sousTotal)}
          </td>
        </>
      ) : (
        <>
          <td className={td}>
            <CelluleTexte
              valeur={ligne.designation}
              onValeur={(v) => onChamp(ligne.id, 'designation', v)}
              placeholder="Désignation"
              maxLength={1000}
              {...nav(1)}
            />
          </td>
          <td className={td}>
            <CelluleTexte valeur={ligne.unite} onValeur={(v) => onChamp(ligne.id, 'unite', v)} maxLength={20} className="text-center" {...nav(2)} />
          </td>
          <td className={td}>
            <CelluleNombre valeur={ligne.quantite} onValeur={(v) => onChamp(ligne.id, 'quantite', v)} decimales={2} {...nav(3)} />
          </td>
          <td className={td}>
            <CelluleNombre valeur={ligne.prixUnitaire} onValeur={(v) => onChamp(ligne.id, 'prixUnitaire', v)} decimales={2} {...nav(4)} />
          </td>
          <td className={cn(td, 'num whitespace-nowrap !pr-2')}>{formatNombreFR(montantLigne(ligne))}</td>
        </>
      )}
      <td className={td} />
    </tr>
  )
})

/** Aperçu flottant pendant le glisser-déposer (DragOverlay rend hors du <table>). */
function ApercuGlisser({ ligne, sousTotal }: { ligne: LigneDEClient; sousTotal: number }) {
  return (
    <div
      className={cn(
        'flex cursor-grabbing items-center gap-3 rounded-sm border border-vinci-bleu px-2 text-[14px] shadow-lg',
        ligne.estChapitre ? 'bg-vinci-bleu-tres-clair font-bold text-vinci-bleu-fonce' : 'bg-white',
      )}
      style={{ height: HAUTEUR_LIGNE }}
    >
      <GripVertical className="h-4 w-4 shrink-0 text-vinci-bleu" />
      <span className="w-20 shrink-0 truncate">{ligne.code}</span>
      <span className="min-w-0 flex-1 truncate">{ligne.designation || '(sans désignation)'}</span>
      <span className="num shrink-0">{formatMontant(ligne.estChapitre ? sousTotal : montantLigne(ligne))}</span>
    </div>
  )
}
