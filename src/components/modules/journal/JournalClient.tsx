'use client'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { CalendarRange, FileDown, GanttChart, Plus, Tags } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { VINCI } from '@/lib/design-tokens'
import { cn } from '@/lib/utils'
import { basculerAffichageFrise, supprimerEvenement } from '@/actions/journal'
import { CategoriesDialog } from './CategoriesDialog'
import { EvenementDialog } from './EvenementDialog'
import { ExportFriseDialog } from './ExportFriseDialog'
import { FriseRendu } from './FriseRendu'
import { JournalOnglets } from './JournalOnglets'
import { ListeEvenements } from './ListeEvenements'
import { PeriodesDialog, type CiblePeriodes } from './PeriodesDialog'
import { calculerFrise } from './placements'
import type { PeriodeDTO } from './periodes'
import { COULEURS_SANS_CATEGORIE, SANS_CATEGORIE, jourFR, type CategorieDTO, type EvenementDTO } from './types'

type Props = {
  projetId: string
  nomProjet: string
  categories: CategorieDTO[]
  evenements: EvenementDTO[]
  periodes: PeriodeDTO[]
}

export function JournalClient({ projetId, nomProjet, categories, evenements: initial, periodes: periodesInitiales }: Props) {
  const [evenements, setEvenements] = useState(initial)
  useEffect(() => setEvenements(initial), [initial])
  const [periodes, setPeriodes] = useState(periodesInitiales)
  useEffect(() => setPeriodes(periodesInitiales), [periodesInitiales])
  const [periodesOuvert, setPeriodesOuvert] = useState(false)
  const [ciblePeriodes, setCiblePeriodes] = useState<CiblePeriodes>({ mode: 'liste' })

  const [filtres, setFiltres] = useState<string[]>([])
  const [edition, setEdition] = useState<{ ouvert: boolean; evenement: EvenementDTO | null }>({ ouvert: false, evenement: null })
  const [categoriesOuvert, setCategoriesOuvert] = useState(false)
  const [exportOuvert, setExportOuvert] = useState(false)
  const [aSupprimer, setASupprimer] = useState<EvenementDTO | null>(null)
  const [pending, start] = useTransition()

  const cleCategorie = (e: EvenementDTO) => (e.categorieId && categories.some((c) => c.id === e.categorieId) ? e.categorieId : SANS_CATEGORIE)
  const aSansCategorie = evenements.some((e) => cleCategorie(e) === SANS_CATEGORIE)

  const filtres_ = useMemo(() => new Set(filtres), [filtres])
  const visibles = useMemo(
    () =>
      evenements
        .filter((e) => filtres_.size === 0 || filtres_.has(e.categorieId && categories.some((c) => c.id === e.categorieId) ? e.categorieId : SANS_CATEGORIE))
        .sort((a, b) => (a.jour < b.jour ? 1 : a.jour > b.jour ? -1 : 0)),
    [evenements, filtres_, categories],
  )
  const surFrise = useMemo(() => visibles.filter((e) => e.afficherFrise), [visibles])
  const periodesFrise = useMemo(() => periodes.filter((p) => p.afficherFrise), [periodes])
  const disposition = useMemo(
    () =>
      calculerFrise(
        surFrise.map((e) => ({ id: e.id, jour: e.jour, titre: e.titre, description: e.description })),
        { periodes: periodesFrise.map((p) => ({ id: p.id, debut: p.debut, fin: p.fin })) },
      ),
    [surFrise, periodesFrise],
  )
  const fenetre = useMemo(() => {
    const jours = [...surFrise.map((e) => e.jour), ...periodesFrise.flatMap((p) => [p.debut, p.fin])].sort()
    return jours.length ? { min: jours[0], max: jours[jours.length - 1] } : null
  }, [surFrise, periodesFrise])

  const ouvrirPeriodes = (cible: CiblePeriodes) => {
    setCiblePeriodes(cible)
    setPeriodesOuvert(true)
  }

  function basculerFiltre(cle: string) {
    setFiltres((f) => (f.includes(cle) ? f.filter((x) => x !== cle) : [...f, cle]))
  }

  function basculerFrise(ev: EvenementDTO, afficher: boolean) {
    setEvenements((l) => l.map((e) => (e.id === ev.id ? { ...e, afficherFrise: afficher } : e)))
    start(async () => {
      const r = await basculerAffichageFrise(projetId, ev.id, afficher)
      if (!r.success) {
        toast.error(r.error)
        setEvenements((l) => l.map((e) => (e.id === ev.id ? { ...e, afficherFrise: !afficher } : e)))
      }
    })
  }

  function confirmerSuppression() {
    if (!aSupprimer) return
    const ev = aSupprimer
    start(async () => {
      const r = await supprimerEvenement(projetId, ev.id)
      if (!r.success) return void toast.error(r.error)
      setEvenements((l) => l.filter((e) => e.id !== ev.id))
      setASupprimer(null)
      toast.success('Événement supprimé')
    })
  }

  const ouvrirEdition = (evenement: EvenementDTO | null) => setEdition({ ouvert: true, evenement })

  const puces = [
    ...categories.map((c) => ({ cle: c.id, nom: c.nom, couleurs: c, nb: evenements.filter((e) => e.categorieId === c.id).length })),
    ...(aSansCategorie
      ? [{ cle: SANS_CATEGORIE, nom: 'Sans catégorie', couleurs: COULEURS_SANS_CATEGORIE, nb: evenements.filter((e) => cleCategorie(e) === SANS_CATEGORIE).length }]
      : []),
  ]

  return (
    <div className="space-y-4">
      <JournalOnglets projetId={projetId} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="page-titre">Journal du chantier</h2>
          <p className="text-sm text-vinci-texte-secondaire">
            {evenements.length} événement{evenements.length > 1 ? 's' : ''} · {surFrise.length} sur la frise
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="btn-toolbar" onClick={() => setCategoriesOuvert(true)}>
            <Tags /> Catégories
          </Button>
          <Button variant="outline" className="btn-toolbar" onClick={() => ouvrirPeriodes({ mode: 'liste' })}>
            <GanttChart /> Périodes{periodes.length > 0 ? ` (${periodes.length})` : ''}
          </Button>
          <Button
            variant="outline"
            className="btn-secondaire"
            onClick={() => setExportOuvert(true)}
            disabled={surFrise.length === 0 && periodesFrise.length === 0}
          >
            <FileDown /> Exporter la frise (PDF)
          </Button>
          <Button onClick={() => ouvrirEdition(null)}>
            <Plus /> Nouvel événement
          </Button>
        </div>
      </div>

      {/* Filtres par catégorie (chips cliquables) */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFiltres([])}
          className={cn(
            'rounded-full border px-3 py-1 text-xs font-semibold',
            filtres.length === 0 ? 'border-vinci-bleu bg-vinci-bleu text-white' : 'border-vinci-gris-bordure bg-white text-black hover:border-vinci-bleu',
          )}
        >
          Toutes
        </button>
        {puces.map((p) => {
          const actif = filtres_.has(p.cle)
          return (
            <button
              key={p.cle}
              type="button"
              onClick={() => basculerFiltre(p.cle)}
              aria-pressed={actif}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors"
              style={
                actif
                  ? { background: p.couleurs.couleurBg, borderColor: p.couleurs.couleurBorder, color: p.couleurs.couleurText, boxShadow: `inset 0 0 0 1px ${p.couleurs.couleurBorder}` }
                  : { background: VINCI.blanc, borderColor: VINCI.grisBordure, color: VINCI.texteSecondaire }
              }
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.couleurs.couleurPoint }} />
              {p.nom}
              <span className="opacity-70">({p.nb})</span>
            </button>
          )
        })}
      </div>

      {/* Frise chronologique */}
      <section className="carte p-0">
        <div className="flex items-center justify-between border-b border-vinci-gris-bordure px-4 py-2">
          <h3 className="inline-flex items-center gap-2 font-bold text-vinci-bleu">
            <CalendarRange className="h-4 w-4" /> Frise chronologique
          </h3>
          {fenetre && (
            <span className="text-xs text-vinci-texte-secondaire">
              {jourFR(fenetre.min)} → {jourFR(fenetre.max)}
            </span>
          )}
        </div>
        {surFrise.length === 0 && periodesFrise.length === 0 ? (
          <p className="p-6 text-center text-sm text-vinci-texte-secondaire">
            Aucun événement à afficher sur la frise (cochez « Frise » dans la liste ou ajustez les filtres).
          </p>
        ) : (
          <div className="overflow-x-auto">
            <FriseRendu
              disposition={disposition}
              evenements={surFrise}
              categories={categories}
              periodes={periodesFrise}
              onSelect={(ev) => ouvrirEdition(ev)}
              onSelectPeriode={(p) => ouvrirPeriodes({ mode: 'edition', periode: p })}
            />
          </div>
        )}
      </section>

      {/* Liste des événements */}
      <section className="carte overflow-x-auto p-0">
        <ListeEvenements
          projetId={projetId}
          evenements={visibles}
          categories={categories}
          surligne={edition.ouvert ? edition.evenement?.id ?? null : null}
          onModifier={(ev) => ouvrirEdition(ev)}
          onSupprimer={setASupprimer}
          onBasculerFrise={basculerFrise}
        />
      </section>

      {/* Dialogs — tous au même niveau (jamais imbriqués) */}
      <EvenementDialog
        open={edition.ouvert}
        onOpenChange={(o) => setEdition((e) => ({ ...e, ouvert: o }))}
        projetId={projetId}
        categories={categories}
        evenement={edition.evenement}
      />
      <CategoriesDialog open={categoriesOuvert} onOpenChange={setCategoriesOuvert} projetId={projetId} categories={categories} evenements={evenements} />
      <PeriodesDialog
        open={periodesOuvert}
        onOpenChange={setPeriodesOuvert}
        projetId={projetId}
        periodes={periodes}
        cible={ciblePeriodes}
        onPeriodesChange={setPeriodes}
      />
      <ExportFriseDialog
        open={exportOuvert}
        onOpenChange={setExportOuvert}
        projetId={projetId}
        nomProjet={nomProjet}
        evenements={surFrise}
        categories={categories}
        periodes={periodesFrise}
      />
      <Dialog open={!!aSupprimer} onOpenChange={(o) => !o && setASupprimer(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-vinci-bleu">Supprimer l&apos;événement ?</DialogTitle>
            <DialogDescription>
              « {aSupprimer?.titre} » du {aSupprimer ? jourFR(aSupprimer.jour) : ''} sera supprimé avec ses pièces jointes. Les lignes de fiche écart
              importées depuis cet événement sont conservées.
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
