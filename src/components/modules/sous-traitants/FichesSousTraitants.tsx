'use client'
import { useCallback, useState } from 'react'
import { ArrowDown, ArrowUp, Check, Mail, Pencil, Phone, Plus, Trash2, User } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatDateFR, formatMontant, parseNombreFR, toInputDate } from '@/lib/utils'
import {
  creerAvenant, creerSousTraitant, majAvenant, majSousTraitant, reorderSousTraitants, supprimerAvenant, supprimerSousTraitant,
} from '@/actions/sous-traitants'
import { montantTotalST, type AvenantLite } from './calcul'

/** Équivalent de useTransition acceptant des fonctions async (React 18). */
function useAsyncPending(): [boolean, (fn: () => Promise<unknown>) => void] {
  const [pending, setPending] = useState(false)
  const start = useCallback((fn: () => Promise<unknown>) => {
    setPending(true)
    fn().catch((e) => toast.error(e instanceof Error ? e.message : 'Erreur')).finally(() => setPending(false))
  }, [])
  return [pending, start]
}

export type STFiche = {
  id: string
  nom: string
  contact: string | null
  telephone: string | null
  email: string | null
  paiementDirect: boolean
  montantMarche: number
  montantAS: number
  commentaire: string | null
  avenants: AvenantLite[]
}

type Form = {
  nom: string; contact: string; telephone: string; email: string
  paiementDirect: boolean; montantMarche: string; montantAS: string; commentaire: string
}
const vide: Form = { nom: '', contact: '', telephone: '', email: '', paiementDirect: false, montantMarche: '', montantAS: '', commentaire: '' }
const versForm = (s: STFiche): Form => ({
  nom: s.nom, contact: s.contact ?? '', telephone: s.telephone ?? '', email: s.email ?? '', paiementDirect: s.paiementDirect,
  montantMarche: s.montantMarche ? String(s.montantMarche).replace('.', ',') : '', montantAS: s.montantAS ? String(s.montantAS).replace('.', ',') : '',
  commentaire: s.commentaire ?? '',
})

export function FichesSousTraitants({ projetId, sousTraitants }: { projetId: string; sousTraitants: STFiche[] }) {
  const [editId, setEditId] = useState<string | 'new' | null>(null)
  const [form, setForm] = useState<Form>(vide)
  const [aSupprimer, setASupprimer] = useState<STFiche | null>(null)
  const [pending, start] = useAsyncPending()

  const editing = editId && editId !== 'new' ? sousTraitants.find((s) => s.id === editId) ?? null : null

  function ouvrir(s: STFiche | null) {
    setForm(s ? versForm(s) : vide)
    setEditId(s ? s.id : 'new')
  }

  function enregistrer() {
    const payload = {
      ...form,
      montantMarche: parseNombreFR(form.montantMarche),
      montantAS: parseNombreFR(form.montantAS),
    }
    start(async () => {
      const r = editId === 'new' ? await creerSousTraitant(projetId, payload) : await majSousTraitant(projetId, editId!, payload)
      if (!r.success) return toast.error(r.error)
      toast.success('Enregistré')
      if (editId === 'new') setEditId((r as { data: { id: string } }).data.id)
    })
  }

  function deplacer(i: number, delta: number) {
    const ids = sousTraitants.map((s) => s.id)
    const j = i + delta
    if (j < 0 || j >= ids.length) return
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    start(async () => {
      const r = await reorderSousTraitants(projetId, ids)
      if (!r.success) toast.error(r.error)
    })
  }

  function supprimer() {
    if (!aSupprimer) return
    const id = aSupprimer.id
    start(async () => {
      const r = await supprimerSousTraitant(projetId, id)
      if (!r.success) return toast.error(r.error)
      toast.success('Sous-traitant supprimé')
      setASupprimer(null)
    })
  }

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="page-titre">Sous-traitants</h1>
        <Button onClick={() => ouvrir(null)}><Plus className="mr-1 h-4 w-4" />Nouveau sous-traitant</Button>
      </div>

      {sousTraitants.length === 0 ? (
        <p className="text-vinci-texte-secondaire">Aucun sous-traitant. Ajoutez votre premier sous-traitant.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sousTraitants.map((s, i) => (
            <div key={s.id} className="carte border-l-4 border-l-vinci-bleu">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-bold text-vinci-bleu">{s.nom}</div>
                  {s.paiementDirect && <Badge className="mt-1 bg-vinci-bleu-tres-clair text-vinci-bleu hover:bg-vinci-bleu-tres-clair">Paiement direct</Badge>}
                </div>
                <div className="flex shrink-0">
                  <Button variant="ghost" size="icon" aria-label="Monter" disabled={i === 0 || pending} onClick={() => deplacer(i, -1)}><ArrowUp className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" aria-label="Descendre" disabled={i === sousTraitants.length - 1 || pending} onClick={() => deplacer(i, 1)}><ArrowDown className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-sm text-vinci-texte-secondaire">
                {s.contact && <div className="flex items-center gap-2"><User className="h-3.5 w-3.5" />{s.contact}</div>}
                {s.telephone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{s.telephone}</div>}
                {s.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /><span className="truncate">{s.email}</span></div>}
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                <dt className="text-vinci-texte-secondaire">Marché</dt><dd className="num font-medium">{formatMontant(s.montantMarche)}</dd>
                <dt className="text-vinci-texte-secondaire">Avenants ({s.avenants.length})</dt>
                <dd className="num font-medium">{formatMontant(s.avenants.reduce((t, a) => t + a.montant, 0))}</dd>
                <dt className="font-bold">Total</dt><dd className="num font-bold text-vinci-bleu">{formatMontant(montantTotalST(s.montantMarche, s.avenants))}</dd>
              </dl>
              <div className="mt-3 flex justify-end gap-2">
                <Button variant="outline" size="sm" className="btn-secondaire" onClick={() => ouvrir(s)}><Pencil className="mr-1 h-3.5 w-3.5" />Modifier</Button>
                <Button variant="destructive" size="sm" onClick={() => setASupprimer(s)}><Trash2 className="mr-1 h-3.5 w-3.5" />Supprimer</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={editId !== null} onOpenChange={(o) => !o && setEditId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{editId === 'new' ? 'Nouveau sous-traitant' : 'Fiche sous-traitant'}</SheetTitle>
            <SheetDescription>Informations contractuelles et avenants.</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            <div><Label htmlFor="st-nom">Nom *</Label><Input id="st-nom" value={form.nom} onChange={(e) => set('nom', e.target.value)} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label htmlFor="st-contact">Contact</Label><Input id="st-contact" value={form.contact} onChange={(e) => set('contact', e.target.value)} /></div>
              <div><Label htmlFor="st-tel">Téléphone</Label><Input id="st-tel" value={form.telephone} onChange={(e) => set('telephone', e.target.value)} /></div>
            </div>
            <div><Label htmlFor="st-email">Email</Label><Input id="st-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
            <div className="flex items-center gap-2">
              <Checkbox id="st-pd" checked={form.paiementDirect} onCheckedChange={(c) => set('paiementDirect', c === true)} />
              <Label htmlFor="st-pd">Paiement direct</Label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label htmlFor="st-marche">Montant marché (€)</Label><Input id="st-marche" inputMode="decimal" className="num" value={form.montantMarche} onChange={(e) => set('montantMarche', e.target.value)} /></div>
              <div><Label htmlFor="st-as">Montant AS (€)</Label><Input id="st-as" inputMode="decimal" className="num" value={form.montantAS} onChange={(e) => set('montantAS', e.target.value)} /></div>
            </div>
            <div><Label htmlFor="st-com">Commentaire</Label><Textarea id="st-com" rows={3} value={form.commentaire} onChange={(e) => set('commentaire', e.target.value)} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="btn-secondaire" onClick={() => setEditId(null)}>Fermer</Button>
              <Button disabled={pending || !form.nom.trim()} onClick={enregistrer}>Enregistrer</Button>
            </div>
          </div>

          <div className="mt-6 border-t border-vinci-gris-bordure pt-4">
            <h3 className="mb-2 font-bold text-vinci-bleu">Avenants</h3>
            {editing ? (
              <Avenants projetId={projetId} st={editing} />
            ) : (
              <p className="text-sm text-vinci-texte-secondaire">Enregistrez le sous-traitant pour ajouter des avenants.</p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={aSupprimer !== null} onOpenChange={(o) => !o && setASupprimer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce sous-traitant ?</DialogTitle>
            <DialogDescription>
              « {aSupprimer?.nom} », ses avenants et ses facturations seront définitivement supprimés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="btn-secondaire" onClick={() => setASupprimer(null)}>Annuler</Button>
            <Button variant="destructive" disabled={pending} onClick={supprimer}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

type AvForm = { numero: string; libelle: string; montant: string; date: string }
const avVersForm = (a: AvenantLite): AvForm => ({
  numero: a.numero, libelle: a.libelle, montant: a.montant ? String(a.montant).replace('.', ',') : '', date: toInputDate(a.date),
})

function Avenants({ projetId, st }: { projetId: string; st: STFiche }) {
  const [nouveau, setNouveau] = useState<AvForm>({ numero: `AV${st.avenants.length + 1}`, libelle: '', montant: '', date: '' })
  const [pending, start] = useAsyncPending()
  const payload = (f: AvForm) => ({ ...f, montant: parseNombreFR(f.montant), date: f.date || null })

  function ajouter() {
    start(async () => {
      const r = await creerAvenant(projetId, st.id, payload(nouveau))
      if (!r.success) return toast.error(r.error)
      setNouveau({ numero: `AV${st.avenants.length + 2}`, libelle: '', montant: '', date: '' })
      toast.success('Avenant ajouté')
    })
  }

  return (
    <div className="space-y-3">
      {st.avenants.map((a) => <AvenantLigne key={a.id} projetId={projetId} a={a} />)}
      <div className="rounded-md border border-dashed border-vinci-gris-bordure p-3">
        <div className="mb-2 text-sm font-medium">Nouvel avenant</div>
        <AvChamps f={nouveau} onChange={setNouveau} />
        <div className="mt-2 flex justify-end">
          <Button size="sm" disabled={pending} onClick={ajouter}><Plus className="mr-1 h-4 w-4" />Ajouter</Button>
        </div>
      </div>
      <div className="flex justify-between text-sm font-bold">
        <span>Total (marché + avenants)</span>
        <span className="num text-vinci-bleu">{formatMontant(montantTotalST(st.montantMarche, st.avenants))}</span>
      </div>
    </div>
  )
}

function AvChamps({ f, onChange }: { f: AvForm; onChange: (f: AvForm) => void }) {
  return (
    <div className="grid grid-cols-6 gap-2">
      <Input className="col-span-2" placeholder="N°" aria-label="Numéro" value={f.numero} onChange={(e) => onChange({ ...f, numero: e.target.value })} />
      <Input className="col-span-4" placeholder="Libellé" aria-label="Libellé" value={f.libelle} onChange={(e) => onChange({ ...f, libelle: e.target.value })} />
      <Input className="num col-span-3" inputMode="decimal" placeholder="Montant €" aria-label="Montant" value={f.montant} onChange={(e) => onChange({ ...f, montant: e.target.value })} />
      <Input className="col-span-3" type="date" aria-label="Date" value={f.date} onChange={(e) => onChange({ ...f, date: e.target.value })} />
    </div>
  )
}

function AvenantLigne({ projetId, a }: { projetId: string; a: AvenantLite }) {
  const [f, setF] = useState<AvForm>(avVersForm(a))
  const [confirm, setConfirm] = useState(false)
  const [pending, start] = useAsyncPending()
  const initial = avVersForm(a)
  const dirty = JSON.stringify(f) !== JSON.stringify(initial)

  return (
    <div className="rounded-md border border-vinci-gris-bordure p-3">
      <AvChamps f={f} onChange={setF} />
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-xs text-vinci-texte-secondaire">{a.date ? formatDateFR(a.date) : ''}</span>
        <div className="flex gap-2">
          {confirm ? (
            <>
              <Button size="sm" variant="outline" className="btn-secondaire" onClick={() => setConfirm(false)}>Annuler</Button>
              <Button size="sm" variant="destructive" disabled={pending} onClick={() => start(async () => {
                const r = await supprimerAvenant(projetId, a.id)
                if (!r.success) toast.error(r.error)
              })}>Confirmer la suppression</Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" className="btn-secondaire" disabled={!dirty || pending} onClick={() => start(async () => {
                const r = await majAvenant(projetId, a.id, { ...f, montant: parseNombreFR(f.montant), date: f.date || null })
                if (!r.success) return toast.error(r.error)
                toast.success('Enregistré')
              })}><Check className="mr-1 h-4 w-4" />Enregistrer</Button>
              <Button size="icon" variant="destructive" className="h-8 w-8" aria-label="Supprimer l'avenant" onClick={() => setConfirm(true)}><Trash2 className="h-4 w-4" /></Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
