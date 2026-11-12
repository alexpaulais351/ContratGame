'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, BookOpen, Download, Eye, FileDown, Save, Send, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ajouterAuJournal, majCourrier, marquerEnvoye, supprimerCourrier } from '@/actions/courriers'
import { MODELES_COURRIERS, MODES_ENVOI, libelleModeEnvoi } from '@/lib/courriers-templates'
import { formatDateFR, toInputDate } from '@/lib/utils'
import { useExportPDF } from '@/hooks/useExportPDF'
import { useProfilStore } from '@/stores/profil'
import { BadgeStatutCourrier } from './BadgeStatut'
import type { CourrierDTO } from './types'

const SELECT = 'h-10 w-full rounded-md border border-vinci-gris-bordure bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-vinci-bleu'

type Champs = Omit<CourrierDTO, 'id' | 'projetId' | 'evenementId'>

export function EditeurCourrier({ initial, nomProjet }: { initial: CourrierDTO; nomProjet: string }) {
  const router = useRouter()
  const profil = useProfilStore((s) => s.profil)
  const { exportAvecGuard, isExporting } = useExportPDF()
  const { id, projetId } = initial
  const [form, setForm] = useState<Champs>({
    reference: initial.reference, objet: initial.objet, type: initial.type, dateEnvoi: initial.dateEnvoi,
    destinataire: initial.destinataire, expediteur: initial.expediteur, corps: initial.corps, statut: initial.statut,
    lieu: initial.lieu, modeEnvoi: initial.modeEnvoi, copies: initial.copies,
    signataireNom: initial.signataireNom, signataireFonction: initial.signataireFonction,
  })
  const [evenementId, setEvenementId] = useState(initial.evenementId)
  const [etat, setEtat] = useState<'idle' | 'dirty' | 'saving' | 'saved'>('idle')
  const [apercu, setApercu] = useState(false)
  const [dlgEnvoi, setDlgEnvoi] = useState(false)
  const [dlgSuppr, setDlgSuppr] = useState(false)
  const [dateEnvoi, setDateEnvoi] = useState(toInputDate(new Date()))
  const [creerEvt, setCreerEvt] = useState(true)
  const [busy, setBusy] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dernier = useRef(form)
  const dirty = useRef(false)

  const sauver = useCallback(async (): Promise<boolean> => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    if (!dirty.current) return true
    dirty.current = false
    setEtat('saving')
    const res = await majCourrier(projetId, id, dernier.current)
    if (!res.success) {
      dirty.current = true
      setEtat('dirty')
      toast.error(res.error)
      return false
    }
    setEtat(dirty.current ? 'dirty' : 'saved')
    return true
  }, [projetId, id])

  const maj = <K extends keyof Champs>(k: K, v: Champs[K]) => {
    const suivant = { ...dernier.current, [k]: v }
    dernier.current = suivant
    setForm(suivant)
    dirty.current = true
    setEtat('dirty')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => void sauver(), 500)
  }

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const exporter = () =>
    exportAvecGuard(async () => {
      await sauver()
      const [{ CourrierPDF }, { genererEtTelechargerPDF }, { nomFichierSur }] = await Promise.all([
        import('@/lib/pdf/courrier'), import('@/lib/pdf/telecharger'), import('@/lib/pdf/format'),
      ])
      await genererEtTelechargerPDF(
        <CourrierPDF courrier={form} profil={profil} nomProjet={nomProjet} />,
        `Courrier_${nomFichierSur(form.reference || 'sans_ref')}`
      )
    })

  const exporterWord = () =>
    exportAvecGuard(async () => {
      await sauver()
      const [{ telechargerCourrierWord }, { nomFichierSur }] = await Promise.all([
        import('@/lib/word/courrier-docx'), import('@/lib/pdf/format'),
      ])
      await telechargerCourrierWord(form, profil, `Courrier_${nomFichierSur(form.reference || 'sans_ref')}`)
    })

  const ouvrirEnvoi = async () => {
    if (!(await sauver())) return
    setDateEnvoi(toInputDate(form.dateEnvoi ?? new Date()))
    setCreerEvt(true)
    setDlgEnvoi(true)
  }

  const confirmerEnvoi = async () => {
    setBusy(true)
    const res = await marquerEnvoye(projetId, id, { dateEnvoi, creerEvenement: creerEvt })
    setBusy(false)
    if (!res.success) return void toast.error(res.error)
    dernier.current = { ...dernier.current, statut: 'envoye', dateEnvoi: res.data.dateEnvoi }
    setForm(dernier.current)
    setEvenementId(res.data.evenementId)
    setDlgEnvoi(false)
    toast.success(creerEvt ? 'Courrier marqué envoyé et ajouté au Journal' : 'Courrier marqué envoyé')
    router.refresh()
  }

  const versJournal = async () => {
    if (!(await sauver())) return
    const res = await ajouterAuJournal(projetId, id)
    if (!res.success) return void toast.error(res.error)
    setEvenementId(res.data.evenementId)
    toast.success('Événement ajouté au Journal')
  }

  const supprimer = async () => {
    setBusy(true)
    const res = await supprimerCourrier(projetId, id)
    if (!res.success) { setBusy(false); return void toast.error(res.error) }
    toast.success('Courrier supprimé')
    router.push(`/projets/${projetId}/courriers`)
  }

  const envoye = form.statut === 'envoye'
  const dateAffichee = form.dateEnvoi ? formatDateFR(form.dateEnvoi) : formatDateFR(new Date())

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="btn-toolbar"><Link href={`/projets/${projetId}/courriers`}><ArrowLeft className="mr-1 h-4 w-4" />Courriers</Link></Button>
          <h1 className="page-titre">{form.reference || 'Courrier'}</h1>
          <BadgeStatutCourrier statut={form.statut} />
          <span className="text-xs text-vinci-texte-secondaire" aria-live="polite">
            {etat === 'saving' ? 'Enregistrement…' : etat === 'saved' ? 'Enregistré' : etat === 'dirty' ? 'Modifications non enregistrées' : ''}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="btn-toolbar" onClick={() => void sauver()}><Save className="mr-1 h-4 w-4" />Enregistrer</Button>
          <Button variant="outline" className="btn-toolbar" onClick={() => setApercu(true)}><Eye className="mr-1 h-4 w-4" />Aperçu</Button>
          <Button variant="outline" className="btn-toolbar" onClick={exporter} disabled={isExporting}><Download className="mr-1 h-4 w-4" />{isExporting ? 'Export…' : 'Export PDF'}</Button>
          <Button variant="outline" className="btn-toolbar" onClick={exporterWord} disabled={isExporting}><FileDown className="mr-1 h-4 w-4" />Exporter en Word</Button>
          {!envoye && <Button onClick={ouvrirEnvoi}><Send className="mr-1 h-4 w-4" />Marquer envoyé</Button>}
          <Button variant="destructive" onClick={() => setDlgSuppr(true)}><Trash2 className="mr-1 h-4 w-4" />Supprimer</Button>
        </div>
      </div>

      {envoye && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md border border-vinci-gris-bordure bg-vinci-bleu-tres-clair px-4 py-2 text-sm">
          <span className="flex items-center gap-2 text-vinci-bleu-fonce">
            <BookOpen className="h-4 w-4" />
            {evenementId ? 'Un événement lié existe dans le Journal.' : 'Aucun événement lié dans le Journal.'}
          </span>
          {evenementId ? (
            <Link className="font-semibold text-vinci-bleu underline" href={`/projets/${projetId}/suivi/journal`}>Voir le Journal</Link>
          ) : (
            <Button size="sm" variant="outline" className="btn-secondaire" onClick={versJournal}>Ajouter au Journal</Button>
          )}
        </div>
      )}

      <div className="carte space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="ref">Référence</Label>
            <Input id="ref" value={form.reference} onChange={(e) => maj('reference', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <select id="type" className={SELECT} value={form.type} onChange={(e) => maj('type', e.target.value)}>
              {MODELES_COURRIERS.map((m) => <option key={m.type} value={m.type}>{m.label}</option>)}
              {!MODELES_COURRIERS.some((m) => m.type === form.type) && <option value={form.type}>Autre</option>}
            </select>
          </div>
          <div>
            <Label htmlFor="mode">Mode d’envoi</Label>
            <select id="mode" className={SELECT} value={form.modeEnvoi} onChange={(e) => maj('modeEnvoi', e.target.value)}>
              <option value="">—</option>
              {MODES_ENVOI.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <Label htmlFor="objet">Objet</Label>
          <Input id="objet" value={form.objet} onChange={(e) => maj('objet', e.target.value)} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="dest">Destinataire (adresse)</Label>
            <Textarea id="dest" rows={4} value={form.destinataire} onChange={(e) => maj('destinataire', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="exp">Expéditeur</Label>
            <Textarea id="exp" rows={4} value={form.expediteur} onChange={(e) => maj('expediteur', e.target.value)} />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <Label htmlFor="lieu">Lieu</Label>
            <Input id="lieu" value={form.lieu} onChange={(e) => maj('lieu', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="statut">Statut</Label>
            <select id="statut" className={SELECT} value={form.statut} onChange={(e) => maj('statut', e.target.value as 'brouillon' | 'envoye')}>
              <option value="brouillon">Brouillon</option>
              <option value="envoye">Envoyé</option>
            </select>
          </div>
          <div>
            <Label htmlFor="date">Date d’envoi</Label>
            <Input id="date" type="date" value={toInputDate(form.dateEnvoi)} onChange={(e) => maj('dateEnvoi', e.target.value || null)} />
          </div>
          <div>
            <Label htmlFor="copies">Copies</Label>
            <Input id="copies" value={form.copies} onChange={(e) => maj('copies', e.target.value)} />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="sigNom">Signataire (nom)</Label>
            <Input id="sigNom" value={form.signataireNom} onChange={(e) => maj('signataireNom', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="sigFonc">Signataire (fonction)</Label>
            <Input id="sigFonc" value={form.signataireFonction} onChange={(e) => maj('signataireFonction', e.target.value)} />
          </div>
        </div>
        <div>
          <Label htmlFor="corps">Corps du courrier</Label>
          <Textarea id="corps" rows={22} value={form.corps} onChange={(e) => maj('corps', e.target.value)} className="font-mono text-[13px] leading-relaxed" />
        </div>
      </div>

      <Dialog open={apercu} onOpenChange={setApercu}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader><DialogTitle>Aperçu du courrier</DialogTitle><DialogDescription>Rendu indicatif ; l’export PDF applique l’en-tête société.</DialogDescription></DialogHeader>
          <div className="border-t-8 border-vinci-bleu bg-white p-6 text-[13px] leading-relaxed shadow-inner">
            <div className="mb-4 border-b border-vinci-gris-bordure pb-3">
              <div className="font-bold text-vinci-bleu">{profil?.nomSociete}</div>
              <div className="whitespace-pre-line text-xs text-vinci-texte-secondaire">{profil?.adresseSociete}</div>
            </div>
            <div className="mb-5 ml-auto w-1/2 whitespace-pre-line">{form.destinataire}</div>
            <div className="mb-3 text-right">{form.lieu ? `${form.lieu}, le ${dateAffichee}` : `Le ${dateAffichee}`}</div>
            {form.reference && <div>Réf. : {form.reference}</div>}
            {form.modeEnvoi && <div className="font-semibold">{libelleModeEnvoi(form.modeEnvoi)}</div>}
            <div className="my-3 font-bold">Objet : {form.objet}</div>
            <div className="whitespace-pre-wrap">{form.corps}</div>
            <div className="mt-6 text-right">
              <div className="font-bold">{form.signataireNom}</div>
              <div>{form.signataireFonction}</div>
            </div>
            {form.copies && <div className="mt-4 text-xs text-vinci-texte-secondaire">Copies : {form.copies}</div>}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dlgEnvoi} onOpenChange={setDlgEnvoi}>
        <DialogContent>
          <DialogHeader><DialogTitle>Marquer le courrier comme envoyé</DialogTitle><DialogDescription>{form.reference} – {form.objet}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="dateEnvoi">Date d’envoi</Label>
              <Input id="dateEnvoi" type="date" value={dateEnvoi} onChange={(e) => setDateEnvoi(e.target.value)} />
            </div>
            <label className="flex items-start gap-2 text-sm">
              <Checkbox checked={creerEvt} onCheckedChange={(v) => setCreerEvt(v === true)} className="mt-0.5" />
              <span>
                {evenementId ? 'Mettre à jour l’événement lié dans le Journal' : 'Créer un événement dans le Journal'}
                <span className="block text-xs text-vinci-texte-secondaire">Catégorie « Contrat », affiché sur la frise.</span>
              </span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" className="btn-secondaire" onClick={() => setDlgEnvoi(false)}>Annuler</Button>
            <Button onClick={confirmerEnvoi} disabled={busy || !dateEnvoi}>Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dlgSuppr} onOpenChange={setDlgSuppr}>
        <DialogContent>
          <DialogHeader><DialogTitle>Supprimer ce courrier ?</DialogTitle><DialogDescription>Cette action est définitive. L’événement du Journal éventuellement lié sera conservé.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="btn-secondaire" onClick={() => setDlgSuppr(false)}>Annuler</Button>
            <Button variant="destructive" onClick={supprimer} disabled={busy}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
