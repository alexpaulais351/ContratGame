'use client'
import { memo, useCallback, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ArrowDown, ArrowUp, Crown, CornerDownRight, Plus, Trash2, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn, formatMontant, formatNombreFR } from '@/lib/utils'
import {
  creerCoTraitant,
  reorderCoTraitants,
  repartirResteAuMandataire,
  supprimerCoTraitant,
  updateCoTraitant,
  updateRepartitionLigneDE,
} from '@/actions/detail-estimatif'
import { CelluleNombre, CelluleTexte } from './Cellules'
import { IndicateurSauvegarde } from './IndicateurSauvegarde'
import { useAutoSave, useRaccourciSauvegarde } from './useAutoSave'
import { arrondi2, montantLigne, sommeRepartition, totalGeneral, type CoTraitantClient, type LigneDEClient, type Repartition } from './types'

const HAUTEUR_LIGNE = 36
const HAUTEUR_ENTETE = 40
const HAUTEUR_PIED = 50
const TOLERANCE = 0.005

type Props = { projetId: string; lignes: LigneDEClient[]; cotraitantsInitiaux: CoTraitantClient[] }

export function Cotraitance({ projetId, lignes: lignesInitiales, cotraitantsInitiaux }: Props) {
  const [lignes, setLignes] = useState(lignesInitiales)
  const [cotraitants, setCotraitants] = useState(cotraitantsInitiaux)
  const [nouveauNom, setNouveauNom] = useState('')
  const [aSupprimer, setASupprimer] = useState<CoTraitantClient | null>(null)
  const [occupe, setOccupe] = useState(false)
  const [selectionId, setSelectionId] = useState<string | null>(null)
  const lignesRef = useRef(lignes)
  lignesRef.current = lignes

  // ----- Auto-save (répartitions + noms des co-traitants) --------------------
  const saveLignes = useAutoSave(
    useCallback((id: string, patch: Record<string, unknown>) => updateRepartitionLigneDE(projetId, id, patch.repartition), [projetId]),
  )
  const saveCt = useAutoSave(
    useCallback(
      async (id: string, patch: Record<string, unknown>) => {
        const res = await updateCoTraitant(projetId, id, patch)
        return res.success ? { success: true as const, data: undefined } : res
      },
      [projetId],
    ),
  )
  const { toutEnregistrer: flushLignes, planifier: planifierLigne } = saveLignes
  const { toutEnregistrer: flushCt } = saveCt
  const toutEnregistrer = useCallback(() => flushLignes() + flushCt(), [flushLignes, flushCt])
  useRaccourciSauvegarde(toutEnregistrer)
  const statut =
    saveLignes.statut === 'erreur' || saveCt.statut === 'erreur'
      ? 'erreur'
      : saveLignes.statut === 'enCours' || saveCt.statut === 'enCours'
        ? 'enCours'
        : saveLignes.statut === 'attente' || saveCt.statut === 'attente'
          ? 'attente'
          : saveLignes.statut === 'ok' || saveCt.statut === 'ok'
            ? 'ok'
            : 'idle'

  // ----- Calculs ------------------------------------------------------------
  const ctIds = useMemo(() => cotraitants.map((c) => c.id), [cotraitants])
  const mandataire = cotraitants.find((c) => c.estMandataire) ?? null
  const totalDE = useMemo(() => totalGeneral(lignes), [lignes])
  const totaux = useMemo(() => {
    const parCt = new Map<string, number>(ctIds.map((id) => [id, 0]))
    let nbEcarts = 0
    for (const l of lignes) {
      if (l.estChapitre) continue
      for (const id of ctIds) parCt.set(id, (parCt.get(id) ?? 0) + l.quantite * (l.repartition?.[id] ?? 0))
      if (ctIds.length > 0 && Math.abs(l.prixUnitaire - sommeRepartition(l.repartition, ctIds)) > TOLERANCE) nbEcarts++
    }
    parCt.forEach((v, k) => parCt.set(k, arrondi2(v)))
    const reparti = arrondi2(Array.from(parCt.values()).reduce((a, b) => a + b, 0))
    return { parCt, reparti, nonReparti: arrondi2(totalDE - reparti), nbEcarts }
  }, [ctIds, lignes, totalDE])
  const pct = (m: number) => (totalDE ? formatNombreFR((m / totalDE) * 100, 1) + ' %' : '—')

  // ----- Co-traitants : CRUD ------------------------------------------------
  const ajouterCt = async () => {
    const nom = nouveauNom.trim()
    if (!nom) return
    setOccupe(true)
    const res = await creerCoTraitant(projetId, { nom })
    setOccupe(false)
    if (!res.success) return toast.error(res.error)
    setCotraitants(res.data)
    setNouveauNom('')
  }

  const renommerCt = (id: string, nom: string) => {
    setCotraitants((prev) => prev.map((c) => (c.id === id ? { ...c, nom } : c)))
    if (nom.trim()) saveCt.planifier(id, 'nom', nom.trim())
  }

  const definirMandataire = async (id: string) => {
    setCotraitants((prev) => prev.map((c) => ({ ...c, estMandataire: c.id === id })))
    const res = await updateCoTraitant(projetId, id, { estMandataire: true })
    if (!res.success) return toast.error(res.error)
    setCotraitants(res.data)
  }

  const deplacerCt = async (index: number, delta: number) => {
    const cible = index + delta
    if (cible < 0 || cible >= cotraitants.length) return
    const avant = cotraitants
    const copie = [...cotraitants]
    ;[copie[index], copie[cible]] = [copie[cible], copie[index]]
    setCotraitants(copie)
    const res = await reorderCoTraitants(
      projetId,
      copie.map((c) => c.id),
    )
    if (!res.success) {
      toast.error(res.error)
      setCotraitants(avant)
    }
  }

  const confirmerSuppressionCt = async () => {
    if (!aSupprimer) return
    const id = aSupprimer.id
    setASupprimer(null)
    saveCt.annuler(id)
    const res = await supprimerCoTraitant(projetId, id)
    if (!res.success) return toast.error(res.error)
    setCotraitants(res.data)
    setLignes((prev) =>
      prev.map((l) => {
        if (!l.repartition || !(id in l.repartition)) return l
        const rep = { ...l.repartition }
        delete rep[id]
        return { ...l, repartition: rep }
      }),
    )
    toast.success('Co-traitant supprimé')
  }

  // ----- Répartition --------------------------------------------------------
  const modifierPart = useCallback(
    (ligneId: string, ctId: string, valeur: number) => {
      const ligne = lignesRef.current.find((l) => l.id === ligneId)
      if (!ligne) return
      const rep: Repartition = { ...(ligne.repartition ?? {}), [ctId]: valeur }
      setLignes((prev) => prev.map((l) => (l.id === ligneId ? { ...l, repartition: rep } : l)))
      planifierLigne(ligneId, 'repartition', rep)
    },
    [planifierLigne],
  )

  const mandataireId = mandataire?.id ?? null
  const resteAuMandataire = useCallback(
    (ligneId: string) => {
      if (!mandataireId) return
      const ligne = lignesRef.current.find((l) => l.id === ligneId)
      if (!ligne) return
      const autres = ctIds.filter((id) => id !== mandataireId)
      const sommeAutres = autres.reduce((s, id) => s + (ligne.repartition?.[id] ?? 0), 0)
      modifierPart(ligneId, mandataireId, Math.round((ligne.prixUnitaire - sommeAutres) * 10000) / 10000)
    },
    [ctIds, mandataireId, modifierPart],
  )

  const resteAuMandataireTout = async () => {
    if (!mandataire) return
    setOccupe(true)
    flushLignes() // les envois en attente partent avant (actions sérialisées)
    const res = await repartirResteAuMandataire(projetId)
    setOccupe(false)
    if (!res.success) return toast.error(res.error)
    const maj = new Map(res.data.map((r) => [r.id, r.repartition]))
    setLignes((prev) => prev.map((l) => (maj.has(l.id) ? { ...l, repartition: maj.get(l.id)! } : l)))
    toast.success(res.data.length > 0 ? `${res.data.length} ligne(s) complétée(s) au profit de ${mandataire.nom}` : 'Toutes les lignes sont déjà réparties')
  }

  // ----- Virtualisation + navigation clavier --------------------------------
  const scrollRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: lignes.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => HAUTEUR_LIGNE,
    overscan: 15,
    paddingStart: HAUTEUR_ENTETE,
    scrollPaddingStart: HAUTEUR_ENTETE,
    scrollPaddingEnd: HAUTEUR_PIED,
    getItemKey: (i) => lignesRef.current[i]?.id ?? i,
  })
  const items = virtualizer.getVirtualItems()
  const paddingHaut = items[0] ? items[0].start - HAUTEUR_ENTETE : 0
  const paddingBas = items.length ? virtualizer.getTotalSize() - items[items.length - 1].end : 0

  const focusCellule = useCallback(
    (ligne: number, col: number) => {
      virtualizer.scrollToIndex(ligne, { align: 'auto' })
      let essais = 0
      const tenter = () => {
        const el = scrollRef.current?.querySelector<HTMLInputElement>(`input[data-nav-ligne="${ligne}"][data-nav-col="${col}"]`)
        if (el) el.focus()
        else if (essais++ < 10) requestAnimationFrame(tenter)
      }
      requestAnimationFrame(tenter)
    },
    [virtualizer],
  )

  const ligneEditable = (i: number, sens: 1 | -1): number | null => {
    for (let j = i + sens; j >= 0 && j < lignesRef.current.length; j += sens) if (!lignesRef.current[j].estChapitre) return j
    return null
  }

  const surTouche = (e: KeyboardEvent<HTMLTableSectionElement>) => {
    const cible = e.target as HTMLElement
    if (cible.tagName !== 'INPUT') return
    const ligne = Number(cible.dataset.navLigne)
    const col = Number(cible.dataset.navCol)
    if (!Number.isFinite(ligne) || !Number.isFinite(col)) return
    const nbCol = ctIds.length
    let dest: [number, number] | null = null
    if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const sens = e.key === 'ArrowUp' || (e.key === 'Enter' && e.shiftKey) ? -1 : 1
      const j = ligneEditable(ligne, sens)
      if (j !== null) dest = [j, col]
      e.preventDefault()
    } else if (e.key === 'Tab') {
      e.preventDefault()
      if (e.shiftKey) {
        if (col > 0) dest = [ligne, col - 1]
        else {
          const j = ligneEditable(ligne, -1)
          if (j !== null) dest = [j, nbCol - 1]
        }
      } else if (col < nbCol - 1) dest = [ligne, col + 1]
      else {
        const j = ligneEditable(ligne, 1)
        if (j !== null) dest = [j, 0]
      }
    }
    if (dest) focusCellule(dest[0], dest[1])
  }

  const nbColonnes = 6 + cotraitants.length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="page-titre mr-2">Co-traitance</h2>
        <IndicateurSauvegarde statut={statut} />
      </div>

      {/* Co-traitants du groupement */}
      <section className="carte space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-bold text-vinci-bleu">Membres du groupement</h3>
            <p className="text-xs text-vinci-texte-secondaire">Un seul mandataire. L&apos;ordre définit l&apos;ordre des colonnes de répartition.</p>
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              void ajouterCt()
            }}
          >
            <Input value={nouveauNom} onChange={(e) => setNouveauNom(e.target.value)} placeholder="Nom du co-traitant" className="h-9 w-56" maxLength={200} />
            <Button type="submit" size="sm" disabled={occupe || !nouveauNom.trim()}>
              <Plus /> Ajouter
            </Button>
          </form>
        </div>

        {cotraitants.length === 0 ? (
          <p className="py-4 text-center text-sm text-vinci-texte-secondaire">
            Aucun co-traitant déclaré. Ajoutez le mandataire du groupement puis ses partenaires.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-vinci min-w-[640px]">
              <thead>
                <tr>
                  <th className="w-20">Ordre</th>
                  <th>Co-traitant</th>
                  <th className="w-36">Rôle</th>
                  <th className="num w-40">Montant réparti HT</th>
                  <th className="num w-24">% du DE</th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {cotraitants.map((c, i) => (
                  <tr key={c.id}>
                    <td className="!py-0.5">
                      <div className="flex gap-0.5">
                        <Button size="icon" variant="ghost" className="h-7 w-7" disabled={i === 0} onClick={() => deplacerCt(i, -1)} aria-label="Monter">
                          <ArrowUp />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          disabled={i === cotraitants.length - 1}
                          onClick={() => deplacerCt(i, 1)}
                          aria-label="Descendre"
                        >
                          <ArrowDown />
                        </Button>
                      </div>
                    </td>
                    <td className="!py-0.5">
                      <CelluleTexte valeur={c.nom} onValeur={(v) => renommerCt(c.id, v)} maxLength={200} className="font-medium" />
                    </td>
                    <td className="!py-0.5">
                      {c.estMandataire ? (
                        <Badge className="gap-1 border-transparent bg-vinci-bleu text-white hover:bg-vinci-bleu">
                          <Crown className="h-3 w-3" /> Mandataire
                        </Badge>
                      ) : (
                        <Button size="sm" variant="outline" className="btn-toolbar h-7 px-2 text-xs" onClick={() => definirMandataire(c.id)}>
                          Désigner mandataire
                        </Button>
                      )}
                    </td>
                    <td className="num">{formatMontant(totaux.parCt.get(c.id) ?? 0)}</td>
                    <td className="num">{pct(totaux.parCt.get(c.id) ?? 0)}</td>
                    <td className="!py-0.5 text-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-vinci-rouge hover:bg-vinci-rouge-tres-clair hover:text-vinci-rouge-fonce"
                        onClick={() => setASupprimer(c)}
                        aria-label={`Supprimer ${c.nom}`}
                      >
                        <Trash2 />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="text-right">
                    Total réparti{totaux.nonReparti !== 0 ? ` · non réparti : ${formatMontant(totaux.nonReparti)}` : ''}
                  </td>
                  <td className="num">{formatMontant(totaux.reparti)}</td>
                  <td className="num">{pct(totaux.reparti)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* Répartition du PU par ligne */}
      {cotraitants.length > 0 && (
        <section className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-bold text-vinci-bleu">Répartition des prix unitaires</h3>
            {totaux.nbEcarts > 0 ? (
              <span className="rounded-sm bg-vinci-rouge-tres-clair px-2 py-0.5 text-xs font-medium text-vinci-rouge">
                {totaux.nbEcarts} ligne{totaux.nbEcarts > 1 ? 's' : ''} avec écart
              </span>
            ) : (
              <span className="rounded-sm bg-vinci-vert-clair px-2 py-0.5 text-xs font-medium text-vinci-vert">Toutes les lignes sont réparties</span>
            )}
            <Button
              size="sm"
              variant="outline"
              className="btn-secondaire ml-auto"
              onClick={resteAuMandataireTout}
              disabled={!mandataire || occupe || totaux.nbEcarts === 0}
              title={mandataire ? `Affecter à ${mandataire.nom} le reste non réparti de chaque ligne` : 'Désignez un mandataire'}
            >
              <Wand2 /> Répartir le reste au mandataire
            </Button>
          </div>

          {lignes.length === 0 ? (
            <p className="carte text-center text-sm text-vinci-texte-secondaire">Le détail estimatif est vide.</p>
          ) : (
            <div
              ref={scrollRef}
              className="overflow-auto rounded-md border border-vinci-gris-bordure"
              style={{ height: 'max(380px, calc(100vh - 420px))' }}
            >
              <table className="table-vinci table-fixed" style={{ minWidth: 640 + cotraitants.length * 130 }}>
                <colgroup>
                  <col style={{ width: 84 }} />
                  <col />
                  <col style={{ width: 56 }} />
                  <col style={{ width: 96 }} />
                  <col style={{ width: 104 }} />
                  {cotraitants.map((c) => (
                    <col key={c.id} style={{ width: 130 }} />
                  ))}
                  <col style={{ width: 120 }} />
                </colgroup>
                <thead>
                  <tr style={{ height: HAUTEUR_ENTETE }}>
                    <th>Code</th>
                    <th>Désignation</th>
                    <th>Unité</th>
                    <th className="num">Quantité</th>
                    <th className="num">PU HT</th>
                    {cotraitants.map((c) => (
                      <th key={c.id} className="num truncate" title={c.nom}>
                        {c.estMandataire && <Crown className="mr-1 inline h-3 w-3 align-[-1px]" />}
                        {c.nom}
                      </th>
                    ))}
                    <th className="num">Écart</th>
                  </tr>
                </thead>
                <tbody onKeyDown={surTouche}>
                  {paddingHaut > 0 && (
                    <tr aria-hidden style={{ height: paddingHaut }}>
                      <td colSpan={nbColonnes} className="!border-0 !p-0" />
                    </tr>
                  )}
                  {items.map((it) => {
                    const l = lignes[it.index]
                    if (!l) return null
                    return (
                      <LigneRepartition
                        key={l.id}
                        ligne={l}
                        index={it.index}
                        cotraitants={cotraitants}
                        mandataireId={mandataireId}
                        selectionnee={l.id === selectionId}
                        onPart={modifierPart}
                        onReste={resteAuMandataire}
                        onSelect={setSelectionId}
                      />
                    )
                  })}
                  {paddingBas > 0 && (
                    <tr aria-hidden style={{ height: paddingBas }}>
                      <td colSpan={nbColonnes} className="!border-0 !p-0" />
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ height: HAUTEUR_PIED }}>
                    <td colSpan={4} className="sticky bottom-0 z-10 text-right uppercase tracking-wide">
                      Montants HT
                    </td>
                    <td className="num sticky bottom-0 z-10 whitespace-nowrap">
                      {formatMontant(totalDE)}
                      <div className="text-[11px] font-normal">DE</div>
                    </td>
                    {cotraitants.map((c) => (
                      <td key={c.id} className="num sticky bottom-0 z-10 whitespace-nowrap">
                        {formatMontant(totaux.parCt.get(c.id) ?? 0)}
                        <div className="text-[11px] font-normal">{pct(totaux.parCt.get(c.id) ?? 0)}</div>
                      </td>
                    ))}
                    <td className="num sticky bottom-0 z-10 whitespace-nowrap">
                      {formatMontant(totaux.nonReparti)}
                      <div className="text-[11px] font-normal">non réparti</div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>
      )}

      <Dialog open={!!aSupprimer} onOpenChange={(o) => !o && setASupprimer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le co-traitant ?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-black">{aSupprimer?.nom}</span> sera retiré du groupement et ses parts de prix unitaires seront
              effacées de toutes les lignes.
              {aSupprimer?.estMandataire ? ' Le premier co-traitant restant deviendra mandataire.' : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="btn-secondaire" onClick={() => setASupprimer(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmerSuppressionCt}>
              <Trash2 /> Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

type LigneRepProps = {
  ligne: LigneDEClient
  index: number
  cotraitants: CoTraitantClient[]
  mandataireId: string | null
  selectionnee: boolean
  onPart: (ligneId: string, ctId: string, valeur: number) => void
  onReste: (ligneId: string) => void
  onSelect: (id: string) => void
}

const LigneRepartition = memo(function LigneRepartition({
  ligne,
  index,
  cotraitants,
  mandataireId,
  selectionnee,
  onPart,
  onReste,
  onSelect,
}: LigneRepProps) {
  if (ligne.estChapitre) {
    return (
      <tr style={{ height: HAUTEUR_LIGNE }} className="!bg-vinci-bleu-tres-clair font-bold text-vinci-bleu-fonce">
        <td className="truncate shadow-[inset_3px_0_0_#004489]">{ligne.code}</td>
        <td colSpan={4 + cotraitants.length + 1} className="truncate uppercase">
          {ligne.designation}
        </td>
      </tr>
    )
  }
  const somme = sommeRepartition(
    ligne.repartition,
    cotraitants.map((c) => c.id),
  )
  const ecart = arrondi2(ligne.prixUnitaire - somme)
  const enEcart = Math.abs(ecart) > TOLERANCE
  return (
    <tr
      style={{ height: HAUTEUR_LIGNE }}
      className={cn(
        enEcart ? '!bg-vinci-rouge-tres-clair' : selectionnee ? '!bg-vinci-bleu-tres-clair' : index % 2 ? '!bg-vinci-gris-clair' : '!bg-white',
      )}
      onFocusCapture={() => onSelect(ligne.id)}
    >
      <td className={cn('truncate', selectionnee && 'shadow-[inset_3px_0_0_#E20025]')}>{ligne.code}</td>
      <td className="truncate" title={ligne.designation}>
        {ligne.designation}
      </td>
      <td className="text-center">{ligne.unite}</td>
      <td className="num">{formatNombreFR(ligne.quantite)}</td>
      <td className="num font-medium" title={`Montant ${formatMontant(montantLigne(ligne))}`}>
        {formatNombreFR(ligne.prixUnitaire)}
      </td>
      {cotraitants.map((c, col) => (
        <td key={c.id} className="!px-1 !py-0">
          <CelluleNombre
            valeur={ligne.repartition?.[c.id] ?? 0}
            onValeur={(v) => onPart(ligne.id, c.id, v)}
            data-nav-ligne={index}
            data-nav-col={col}
            aria-label={`Part ${c.nom}`}
          />
        </td>
      ))}
      <td className="!py-0 !pr-1">
        <div className="flex items-center justify-end gap-1">
          <span className={cn('num', enEcart ? 'font-bold text-vinci-rouge' : 'text-vinci-texte-secondaire')}>
            {enEcart ? formatNombreFR(ecart) : '✓'}
          </span>
          {enEcart && mandataireId ? (
            <button
              type="button"
              onClick={() => onReste(ligne.id)}
              className="inline-flex h-6 w-6 items-center justify-center rounded-sm text-vinci-bleu hover:bg-vinci-bleu-tres-clair"
              title="Affecter le reste au mandataire"
              aria-label="Affecter le reste au mandataire"
            >
              <CornerDownRight className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  )
})
