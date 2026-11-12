'use client'
import { useEffect, useState, useTransition } from 'react'
import { ArrowLeft, Check, Eye, EyeOff, Pencil, Plus, Trash2, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { creerPeriode, modifierPeriode, supprimerPeriode } from '@/actions/periodes'
import { TEINTES_PERIODE, couleursPeriode, sousTitreAffiche, sousTitreAuto, type ClePeriode, type PeriodeDTO } from './periodes'
import { jourFR } from './types'

/** Ce que le Dialog affiche à l'ouverture : la liste, un formulaire vierge ou une période à modifier. */
export type CiblePeriodes = { mode: 'liste' } | { mode: 'nouvelle' } | { mode: 'edition'; periode: PeriodeDTO }

type Props = {
  open: boolean
  onOpenChange: (o: boolean) => void
  projetId: string
  periodes: PeriodeDTO[]
  cible: CiblePeriodes
  /** mise à jour locale immédiate (la page est aussi revalidée côté serveur) */
  onPeriodesChange: (maj: (l: PeriodeDTO[]) => PeriodeDTO[]) => void
}

type Formulaire = {
  titre: string
  sousTitre: string
  debut: string
  fin: string
  couleur: ClePeriode
  afficherFrise: boolean
  zoneFond: boolean
}

const VIDE: Formulaire = { titre: '', sousTitre: '', debut: '', fin: '', couleur: 'bleu', afficherFrise: true, zoneFond: false }

function depuis(p: PeriodeDTO): Formulaire {
  return {
    titre: p.titre,
    sousTitre: p.sousTitre ?? '',
    debut: p.debut,
    fin: p.fin,
    couleur: (TEINTES_PERIODE.some((t) => t.cle === p.couleur) ? p.couleur : 'bleu') as ClePeriode,
    afficherFrise: p.afficherFrise,
    zoneFond: p.zoneFond,
  }
}

function trier(l: PeriodeDTO[]) {
  return [...l].sort((a, b) => a.debut.localeCompare(b.debut) || a.fin.localeCompare(b.fin) || a.titre.localeCompare(b.titre, 'fr'))
}

/** Pastille de couleur d'une période (aperçu de la barre). */
function Pastille({ cle, className }: { cle: string; className?: string }) {
  const c = couleursPeriode(cle)
  return <span className={cn('inline-block h-4 w-7 shrink-0 rounded-[5px] border-2', className)} style={{ background: c.fond, borderColor: c.bordure }} />
}

/** Gestion des périodes de la frise (barres horizontales sur une plage de dates). */
export function PeriodesDialog({ open, onOpenChange, projetId, periodes, cible, onPeriodesChange }: Props) {
  const [vue, setVue] = useState<'liste' | 'formulaire'>('liste')
  const [editionId, setEditionId] = useState<string | null>(null)
  const [f, setF] = useState<Formulaire>(VIDE)
  const [aConfirmer, setAConfirmer] = useState<string | null>(null)
  const [pending, start] = useTransition()

  // état initial à chaque ouverture
  useEffect(() => {
    if (!open) return
    setAConfirmer(null)
    if (cible.mode === 'liste') {
      setVue('liste')
      setEditionId(null)
    } else {
      const p = cible.mode === 'edition' ? cible.periode : null
      setEditionId(p?.id ?? null)
      setF(p ? depuis(p) : VIDE)
      setVue('formulaire')
    }
  }, [open, cible])

  function ouvrirFormulaire(p: PeriodeDTO | null) {
    setEditionId(p?.id ?? null)
    setF(p ? depuis(p) : VIDE)
    setVue('formulaire')
  }

  const maj = (champ: Partial<Formulaire>) => setF((x) => ({ ...x, ...champ }))
  const datesValides = !!f.debut && !!f.fin && f.fin >= f.debut
  const auto = datesValides ? sousTitreAuto(f.debut, f.fin) : ''
  const valide = !!f.titre.trim() && datesValides

  function enregistrer() {
    if (!valide) return
    const data = { ...f, titre: f.titre.trim(), sousTitre: f.sousTitre.trim() || null }
    start(async () => {
      const r = editionId ? await modifierPeriode(projetId, editionId, data) : await creerPeriode(projetId, data)
      if (!r.success) return void toast.error(r.error)
      const p = r.data
      onPeriodesChange((l) => trier(editionId ? l.map((x) => (x.id === p.id ? p : x)) : [...l, p]))
      toast.success(editionId ? 'Période modifiée' : `Période « ${p.titre} » ajoutée`)
      setVue('liste')
      setEditionId(null)
    })
  }

  function supprimer(id: string) {
    start(async () => {
      const r = await supprimerPeriode(projetId, id)
      if (!r.success) return void toast.error(r.error)
      onPeriodesChange((l) => l.filter((x) => x.id !== id))
      setAConfirmer(null)
      if (editionId === id) {
        setVue('liste')
        setEditionId(null)
      }
      toast.success('Période supprimée')
    })
  }

  function basculerAffichage(p: PeriodeDTO) {
    const data = { ...p, afficherFrise: !p.afficherFrise }
    onPeriodesChange((l) => l.map((x) => (x.id === p.id ? data : x)))
    start(async () => {
      const r = await modifierPeriode(projetId, p.id, data)
      if (!r.success) {
        toast.error(r.error)
        onPeriodesChange((l) => l.map((x) => (x.id === p.id ? p : x)))
      }
    })
  }

  const apercu = couleursPeriode(f.couleur)
  const enEdition = periodes.find((p) => p.id === editionId)

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        {vue === 'liste' ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-vinci-bleu">Périodes de la frise</DialogTitle>
              <DialogDescription>
                Bandeaux affichés en haut de la frise sur une plage de dates (période de préparation, délais contractuels, phases…). Les périodes qui se
                chevauchent s&apos;empilent sur des rangées distinctes.
              </DialogDescription>
            </DialogHeader>

            {periodes.length === 0 ? (
              <p className="rounded-sm border border-dashed border-vinci-gris-bordure p-6 text-center text-sm text-vinci-texte-secondaire">
                Aucune période. Ajoutez-en une pour la voir apparaître sur la frise.
              </p>
            ) : (
              <ul className="divide-y divide-vinci-gris-bordure rounded-sm border border-vinci-gris-bordure">
                {periodes.map((p) => (
                  <li key={p.id} className={cn('flex items-center gap-3 px-3 py-2', !p.afficherFrise && 'opacity-60')}>
                    <Pastille cle={p.couleur} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-vinci-bleu-fonce">{p.titre}</div>
                      <div className="truncate text-xs text-vinci-texte-secondaire">
                        {jourFR(p.debut)} → {jourFR(p.fin)}
                        {p.sousTitre ? ` · ${p.sousTitre}` : ` · ${sousTitreAffiche(p).split(' · ')[0]}`}
                        {p.zoneFond ? ' · zone teintée' : ''}
                      </div>
                    </div>
                    {aConfirmer === p.id ? (
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline" className="btn-secondaire h-8" onClick={() => setAConfirmer(null)} disabled={pending}>
                          Annuler
                        </Button>
                        <Button size="sm" variant="destructive" className="h-8" onClick={() => supprimer(p.id)} disabled={pending}>
                          Supprimer
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-0.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-vinci-bleu"
                          title={p.afficherFrise ? 'Masquer de la frise' : 'Afficher sur la frise'}
                          onClick={() => basculerAffichage(p)}
                          disabled={pending}
                        >
                          {p.afficherFrise ? <Eye /> : <EyeOff />}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-vinci-bleu" title="Modifier" onClick={() => ouvrirFormulaire(p)}>
                          <Pencil />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-vinci-rouge hover:bg-vinci-rouge-tres-clair hover:text-vinci-rouge-fonce"
                          title="Supprimer"
                          onClick={() => setAConfirmer(p.id)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <DialogFooter>
              <Button variant="outline" className="btn-secondaire" onClick={() => onOpenChange(false)}>
                Fermer
              </Button>
              <Button onClick={() => ouvrirFormulaire(null)}>
                <Plus /> Nouvelle période
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-vinci-bleu">{editionId ? 'Modifier la période' : 'Nouvelle période'}</DialogTitle>
              <DialogDescription>La barre couvre exactement la plage de dates (début et fin incluses).</DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="per-titre">Titre</Label>
                <Input id="per-titre" value={f.titre} onChange={(e) => maj({ titre: e.target.value })} placeholder="Ex. Période de préparation" maxLength={120} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="per-debut">Date de début</Label>
                  <Input id="per-debut" type="date" value={f.debut} max={f.fin || undefined} onChange={(e) => maj({ debut: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="per-fin">Date de fin</Label>
                  <Input id="per-fin" type="date" value={f.fin} min={f.debut || undefined} onChange={(e) => maj({ fin: e.target.value })} />
                </div>
              </div>
              {!!f.debut && !!f.fin && f.fin < f.debut && <p className="text-xs font-semibold text-vinci-rouge">La date de fin doit être postérieure ou égale à la date de début.</p>}
              <div className="space-y-1">
                <Label htmlFor="per-sous">Sous-titre (facultatif)</Label>
                <div className="flex gap-2">
                  <Input
                    id="per-sous"
                    value={f.sousTitre}
                    onChange={(e) => maj({ sousTitre: e.target.value })}
                    placeholder={auto ? `Automatique : ${auto}` : 'Ex. Dp-T0 · 3 mois · 30/07 → 30/10/2026'}
                    maxLength={160}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="btn-toolbar shrink-0"
                    title="Remplir avec le sous-titre automatique"
                    disabled={!auto}
                    onClick={() => maj({ sousTitre: auto })}
                  >
                    <Wand2 /> Auto
                  </Button>
                </div>
                <p className="text-xs text-vinci-texte-secondaire">Laissé vide, la frise affiche la durée et les dates (mises à jour si les dates changent).</p>
              </div>
              <div className="space-y-1">
                <Label>Couleur</Label>
                <div className="flex flex-wrap gap-2">
                  {TEINTES_PERIODE.map((t) => {
                    const c = couleursPeriode(t.cle)
                    const actif = t.cle === f.couleur
                    return (
                      <button
                        key={t.cle}
                        type="button"
                        title={t.libelle}
                        aria-label={t.libelle}
                        aria-pressed={actif}
                        onClick={() => maj({ couleur: t.cle })}
                        className={cn('flex h-9 w-12 items-center justify-center rounded-md border-2', actif && 'ring-2 ring-vinci-bleu ring-offset-2')}
                        style={{ background: c.fond, borderColor: c.bordure }}
                      >
                        {actif && <Check className="h-4 w-4" style={{ color: c.bordure }} />}
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-vinci-texte-secondaire">{TEINTES_PERIODE.find((t) => t.cle === f.couleur)?.libelle}</p>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox checked={f.afficherFrise} onCheckedChange={(v) => maj({ afficherFrise: v === true })} />
                  Afficher sur la frise
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox checked={f.zoneFond} onCheckedChange={(v) => maj({ zoneFond: v === true })} />
                  Teinter la zone derrière la frise
                </label>
              </div>

              {/* Aperçu de la barre */}
              <div className="rounded-sm border border-vinci-gris-bordure bg-vinci-gris-clair p-3">
                <div className="mb-1 text-xs font-semibold text-vinci-texte-secondaire">Aperçu</div>
                <div
                  className="flex h-9 flex-col items-center justify-center overflow-hidden rounded-lg px-2 text-center"
                  style={{ background: apercu.fond, border: `1.5px solid ${apercu.bordure}`, color: apercu.texte }}
                >
                  <div className="w-full truncate text-[11px] font-bold leading-[15px] tracking-wide">{(f.titre.trim() || 'Titre de la période').toLocaleUpperCase('fr-FR')}</div>
                  <div className="w-full truncate text-[10px] leading-[13px] opacity-90">{f.sousTitre.trim() || auto || 'durée · dates'}</div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:justify-between">
              <div className="flex gap-2">
                <Button variant="outline" className="btn-secondaire" onClick={() => setVue('liste')} disabled={pending}>
                  <ArrowLeft /> Liste
                </Button>
                {enEdition &&
                  (aConfirmer === enEdition.id ? (
                    <Button variant="destructive" onClick={() => supprimer(enEdition.id)} disabled={pending}>
                      Confirmer la suppression
                    </Button>
                  ) : (
                    <Button variant="outline" className="btn-toolbar text-vinci-rouge" onClick={() => setAConfirmer(enEdition.id)} disabled={pending}>
                      <Trash2 /> Supprimer
                    </Button>
                  ))}
              </div>
              <Button onClick={enregistrer} disabled={pending || !valide}>
                <Check /> {editionId ? 'Enregistrer' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
