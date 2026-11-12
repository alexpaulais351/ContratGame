'use client'
import { useCallback, useMemo, useState } from 'react'
import {
  ArrowDown, ArrowUp, Building2, Copy, Download, FileSpreadsheet, Mail, Pencil, Plus, Trash2, Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useExportPDF } from '@/hooks/useExportPDF'
import { useProfilStore } from '@/stores/profil'
import {
  creerContactDiffusion, importerMoaDiffusion, importerSousTraitantsDiffusion, majContactDiffusion,
  reorderContactsDiffusion, supprimerContactDiffusion,
} from '@/actions/diffusion'
import {
  CIVILITES, ROLES_DIFFUSION, emailsUniques, grouperParRole, lienMailto, nomComplet, trierContacts,
  type ContactDiffusionDTO, type RoleDiffusion,
} from './contacts'
import { BadgesContact } from './BadgesContact'

const SELECT = 'h-10 w-full rounded-md border border-vinci-gris-bordure bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-vinci-bleu'

/** Équivalent de useTransition acceptant des fonctions async (React 18). */
function useAsyncPending(): [boolean, (fn: () => Promise<unknown>) => void] {
  const [pending, setPending] = useState(false)
  const start = useCallback((fn: () => Promise<unknown>) => {
    setPending(true)
    fn().catch((e) => toast.error(e instanceof Error ? e.message : 'Erreur')).finally(() => setPending(false))
  }, [])
  return [pending, start]
}

type Form = {
  organisation: string; civilite: string; prenom: string; nom: string; fonction: string; role: RoleDiffusion
  email: string; telephone: string; adresse: string
  destinataireParDefaut: boolean; copieParDefaut: boolean; diffusionCR: boolean; commentaire: string
}
const vide = (role: RoleDiffusion = 'moa'): Form => ({
  organisation: '', civilite: '', prenom: '', nom: '', fonction: '', role, email: '', telephone: '', adresse: '',
  destinataireParDefaut: false, copieParDefaut: false, diffusionCR: true, commentaire: '',
})
const versForm = (c: ContactDiffusionDTO): Form => ({
  organisation: c.organisation, civilite: c.civilite ?? '', prenom: c.prenom ?? '', nom: c.nom ?? '', fonction: c.fonction ?? '',
  role: (ROLES_DIFFUSION.some((r) => r.value === c.role) ? c.role : 'autre') as RoleDiffusion,
  email: c.email ?? '', telephone: c.telephone ?? '', adresse: c.adresse ?? '',
  destinataireParDefaut: c.destinataireParDefaut, copieParDefaut: c.copieParDefaut, diffusionCR: c.diffusionCR, commentaire: c.commentaire ?? '',
})

export function ListeDiffusion({ projetId, nomProjet, contacts, aMoa, nbSousTraitants }: {
  projetId: string; nomProjet: string; contacts: ContactDiffusionDTO[]; aMoa: boolean; nbSousTraitants: number
}) {
  const profil = useProfilStore((s) => s.profil)
  const { exportAvecGuard, isExporting } = useExportPDF()
  const [editId, setEditId] = useState<string | 'new' | null>(null)
  const [form, setForm] = useState<Form>(vide())
  const [aSupprimer, setASupprimer] = useState<ContactDiffusionDTO | null>(null)
  const [pending, start] = useAsyncPending()

  const tries = useMemo(() => trierContacts(contacts), [contacts])
  const groupes = useMemo(() => grouperParRole(contacts), [contacts])
  const emailsDiffusion = useMemo(() => emailsUniques(tries.filter((c) => c.diffusionCR)), [tries])
  const mailto = useMemo(() => lienMailto(tries, nomProjet), [tries, nomProjet])
  const moaPresent = contacts.some((c) => c.role === 'moa')

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }))

  function ouvrir(c: ContactDiffusionDTO | null) {
    setForm(c ? versForm(c) : vide(contacts.length === 0 ? 'moa' : 'autre'))
    setEditId(c ? c.id : 'new')
  }

  function enregistrer() {
    const id = editId
    if (!id) return
    start(async () => {
      const r = id === 'new' ? await creerContactDiffusion(projetId, form) : await majContactDiffusion(projetId, id, form)
      if (!r.success) return void toast.error(r.error)
      toast.success(id === 'new' ? 'Contact ajouté' : 'Contact enregistré')
      setEditId(null)
    })
  }

  /** Déplace un contact au sein de son groupe de rôle, puis réécrit l'ordre global. */
  function deplacer(c: ContactDiffusionDTO, delta: number) {
    const groupe = groupes.find((g) => g.contacts.some((x) => x.id === c.id))
    if (!groupe) return
    const i = groupe.contacts.findIndex((x) => x.id === c.id)
    const j = i + delta
    if (j < 0 || j >= groupe.contacts.length) return
    const voisin = groupe.contacts[j]
    const ids = groupes.flatMap((g) => g.contacts.map((x) => x.id))
    const a = ids.indexOf(c.id)
    const b = ids.indexOf(voisin.id)
    ;[ids[a], ids[b]] = [ids[b], ids[a]]
    start(async () => {
      const r = await reorderContactsDiffusion(projetId, ids)
      if (!r.success) toast.error(r.error)
    })
  }

  function supprimer() {
    if (!aSupprimer) return
    const id = aSupprimer.id
    start(async () => {
      const r = await supprimerContactDiffusion(projetId, id)
      if (!r.success) return void toast.error(r.error)
      toast.success('Contact supprimé')
      setASupprimer(null)
    })
  }

  function importerST() {
    start(async () => {
      const r = await importerSousTraitantsDiffusion(projetId)
      if (!r.success) return void toast.error(r.error)
      toast.success(r.data.ajoutes ? `${r.data.ajoutes} sous-traitant(s) ajouté(s)` : 'Tous les sous-traitants sont déjà dans la liste')
    })
  }

  function importerMoa() {
    start(async () => {
      const r = await importerMoaDiffusion(projetId)
      if (!r.success) return void toast.error(r.error)
      toast.success(r.data.ajoutes ? "Maître d'ouvrage ajouté" : "Le maître d'ouvrage est déjà dans la liste")
    })
  }

  async function copierEmails() {
    if (emailsDiffusion.length === 0) return void toast.error('Aucun e-mail dans la liste de diffusion')
    try {
      await navigator.clipboard.writeText(emailsDiffusion.join('; '))
      toast.success(`${emailsDiffusion.length} adresse(s) copiée(s)`)
    } catch {
      toast.error('Copie impossible : autorisez l’accès au presse-papiers')
    }
  }

  const exporterPDF = () =>
    exportAvecGuard(async () => {
      const [{ ListeDiffusionPDF }, { genererEtTelechargerPDF }, { nomFichierSur }] = await Promise.all([
        import('@/lib/pdf/diffusion'), import('@/lib/pdf/telecharger'), import('@/lib/pdf/format'),
      ])
      await genererEtTelechargerPDF(
        <ListeDiffusionPDF contacts={tries} nomProjet={nomProjet} profil={profil} />,
        `Liste_diffusion_${nomFichierSur(nomProjet)}`,
      )
    })

  const exporterExcel = () =>
    exportAvecGuard(async () => {
      const [{ exporterDiffusionExcel }, { nomFichierSur }] = await Promise.all([
        import('./export-excel'), import('@/lib/pdf/format'),
      ])
      await exporterDiffusionExcel(tries, nomProjet, `Liste_diffusion_${nomFichierSur(nomProjet)}.xlsx`)
    })

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-titre">Liste de diffusion</h1>
          <p className="text-sm text-vinci-texte-secondaire">
            Intervenants du chantier : destinataires et copies des courriers, diffusion des comptes rendus et informations chantier.
          </p>
        </div>
        <Button onClick={() => ouvrir(null)}><Plus className="mr-1 h-4 w-4" />Nouveau contact</Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant="outline" className="btn-toolbar" disabled={pending || nbSousTraitants === 0} onClick={importerST}
          title={nbSousTraitants === 0 ? 'Aucun sous-traitant dans le projet' : undefined}>
          <Users className="mr-1 h-4 w-4" />Importer les sous-traitants
        </Button>
        <Button variant="outline" className="btn-toolbar" disabled={pending || !aMoa || moaPresent} onClick={importerMoa}
          title={!aMoa ? "Renseignez le maître d'ouvrage dans l'onglet Infos" : moaPresent ? "Un maître d'ouvrage est déjà dans la liste" : undefined}>
          <Building2 className="mr-1 h-4 w-4" />Importer le MOA
        </Button>
        <span className="mx-1 hidden w-px bg-vinci-gris-bordure sm:block" />
        <Button variant="outline" className="btn-toolbar" disabled={emailsDiffusion.length === 0} onClick={() => void copierEmails()}>
          <Copy className="mr-1 h-4 w-4" />Copier les e-mails{emailsDiffusion.length ? ` (${emailsDiffusion.length})` : ''}
        </Button>
        {mailto ? (
          <Button asChild variant="outline" className="btn-toolbar">
            <a href={mailto}><Mail className="mr-1 h-4 w-4" />Écrire à la liste</a>
          </Button>
        ) : (
          <Button variant="outline" className="btn-toolbar" disabled><Mail className="mr-1 h-4 w-4" />Écrire à la liste</Button>
        )}
        <span className="mx-1 hidden w-px bg-vinci-gris-bordure sm:block" />
        <Button variant="outline" className="btn-toolbar" disabled={isExporting || contacts.length === 0} onClick={exporterPDF}>
          <Download className="mr-1 h-4 w-4" />{isExporting ? 'Export…' : 'Export PDF'}
        </Button>
        <Button variant="outline" className="btn-toolbar" disabled={isExporting || contacts.length === 0} onClick={exporterExcel}>
          <FileSpreadsheet className="mr-1 h-4 w-4" />Export Excel
        </Button>
      </div>

      {contacts.length === 0 ? (
        <div className="carte text-center text-vinci-texte-secondaire">
          <p>La liste de diffusion est vide.</p>
          <p className="mt-1 text-sm">
            Ajoutez les intervenants (maître d&apos;ouvrage, maîtrise d&apos;œuvre, SPS, contrôle, sous-traitants…) : ils seront proposés
            comme destinataires et copies dans les courriers.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-vinci-gris-bordure">
          <table className="table-vinci min-w-[900px]">
            <thead>
              <tr>
                <th>Organisation</th>
                <th>Contact</th>
                <th>Fonction</th>
                <th>E-mail</th>
                <th>Téléphone</th>
                <th>Diffusion</th>
                <th className="w-[150px] text-right">Actions</th>
              </tr>
            </thead>
            {groupes.map((g) => (
              <GroupeRole
                key={g.role}
                label={g.label}
                contacts={g.contacts}
                pending={pending}
                onModifier={ouvrir}
                onSupprimer={setASupprimer}
                onDeplacer={deplacer}
              />
            ))}
          </table>
        </div>
      )}
      {contacts.length > 0 && (
        <p className="mt-2 text-xs text-vinci-texte-secondaire">
          « Écrire à la liste » : destinataires par défaut en « À », autres contacts « Diffusion infos chantier » en copie.
          Les flèches réordonnent les contacts au sein de leur rôle.
        </p>
      )}

      <Dialog open={editId !== null} onOpenChange={(o) => !o && setEditId(null)}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId === 'new' ? 'Nouveau contact' : 'Modifier le contact'}</DialogTitle>
            <DialogDescription>Coordonnées et rôle dans la diffusion des courriers et informations chantier.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
              <div><Label htmlFor="cd-org">Organisation *</Label><Input id="cd-org" value={form.organisation} onChange={(e) => set('organisation', e.target.value)} /></div>
              <div>
                <Label htmlFor="cd-role">Rôle</Label>
                <select id="cd-role" className={SELECT} value={form.role} onChange={(e) => set('role', e.target.value as RoleDiffusion)}>
                  {ROLES_DIFFUSION.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-[130px_1fr_1fr]">
              <div>
                <Label htmlFor="cd-civ">Civilité</Label>
                <select id="cd-civ" className={SELECT} value={form.civilite} onChange={(e) => set('civilite', e.target.value)}>
                  <option value="">—</option>
                  {CIVILITES.map((c) => <option key={c} value={c}>{c}</option>)}
                  {form.civilite && !(CIVILITES as readonly string[]).includes(form.civilite) && <option value={form.civilite}>{form.civilite}</option>}
                </select>
              </div>
              <div><Label htmlFor="cd-prenom">Prénom</Label><Input id="cd-prenom" value={form.prenom} onChange={(e) => set('prenom', e.target.value)} /></div>
              <div><Label htmlFor="cd-nom">Nom</Label><Input id="cd-nom" value={form.nom} onChange={(e) => set('nom', e.target.value)} /></div>
            </div>
            <div><Label htmlFor="cd-fonction">Fonction</Label><Input id="cd-fonction" value={form.fonction} onChange={(e) => set('fonction', e.target.value)} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label htmlFor="cd-email">E-mail</Label><Input id="cd-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
              <div><Label htmlFor="cd-tel">Téléphone</Label><Input id="cd-tel" type="tel" value={form.telephone} onChange={(e) => set('telephone', e.target.value)} /></div>
            </div>
            <div><Label htmlFor="cd-adresse">Adresse postale</Label><Textarea id="cd-adresse" rows={3} value={form.adresse} onChange={(e) => set('adresse', e.target.value)} placeholder={'Rue…\nCode postal Ville'} /></div>
            <fieldset className="space-y-2 rounded-md border border-vinci-gris-bordure p-3">
              <legend className="px-1 text-sm font-bold text-vinci-bleu">Diffusion</legend>
              <label className="flex items-start gap-2 text-sm">
                <Checkbox className="mt-0.5" checked={form.destinataireParDefaut} onCheckedChange={(v) => set('destinataireParDefaut', v === true)} />
                <span>Destinataire par défaut des courriers<span className="block text-xs text-vinci-texte-secondaire">Prérempli comme destinataire d’un nouveau courrier.</span></span>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <Checkbox className="mt-0.5" checked={form.copieParDefaut} onCheckedChange={(v) => set('copieParDefaut', v === true)} />
                <span>Copie par défaut des courriers<span className="block text-xs text-vinci-texte-secondaire">Ajouté aux copies d’un nouveau courrier.</span></span>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <Checkbox className="mt-0.5" checked={form.diffusionCR} onCheckedChange={(v) => set('diffusionCR', v === true)} />
                <span>Diffusion des infos chantier<span className="block text-xs text-vinci-texte-secondaire">Reçoit les comptes rendus et informations (copie des e-mails, « Écrire à la liste »).</span></span>
              </label>
            </fieldset>
            <div><Label htmlFor="cd-com">Commentaire</Label><Textarea id="cd-com" rows={2} value={form.commentaire} onChange={(e) => set('commentaire', e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="btn-secondaire" onClick={() => setEditId(null)}>Annuler</Button>
            <Button disabled={pending || !form.organisation.trim()} onClick={enregistrer}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={aSupprimer !== null} onOpenChange={(o) => !o && setASupprimer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce contact ?</DialogTitle>
            <DialogDescription>
              « {aSupprimer ? [aSupprimer.organisation, nomComplet(aSupprimer)].filter(Boolean).join(' — ') : ''} » sera retiré de la liste de diffusion.
              Les courriers existants ne sont pas modifiés.
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

function GroupeRole({ label, contacts, pending, onModifier, onSupprimer, onDeplacer }: {
  label: string
  contacts: ContactDiffusionDTO[]
  pending: boolean
  onModifier: (c: ContactDiffusionDTO) => void
  onSupprimer: (c: ContactDiffusionDTO) => void
  onDeplacer: (c: ContactDiffusionDTO, delta: number) => void
}) {
  return (
    <>
      <tbody>
        <tr>
          <td colSpan={7} className="bg-vinci-bleu-tres-clair font-bold text-vinci-bleu-fonce">
            {label} <span className="font-normal text-vinci-texte-secondaire">({contacts.length})</span>
          </td>
        </tr>
      </tbody>
      <tbody>
        {contacts.map((c, i) => (
          <tr key={c.id}>
            <td className="font-semibold">
              {c.organisation}
              {c.adresse && <div className="whitespace-pre-line text-xs font-normal text-vinci-texte-secondaire">{c.adresse}</div>}
            </td>
            <td>{nomComplet(c) || <span className="text-vinci-texte-secondaire">—</span>}</td>
            <td>{c.fonction}</td>
            <td>{c.email ? <a className="text-vinci-bleu underline-offset-2 hover:underline" href={`mailto:${c.email}`}>{c.email}</a> : null}</td>
            <td className="whitespace-nowrap">{c.telephone ? <a className="text-vinci-bleu underline-offset-2 hover:underline" href={`tel:${c.telephone.replace(/[^\d+]/g, '')}`}>{c.telephone}</a> : null}</td>
            <td><BadgesContact contact={c} /></td>
            <td>
              <div className="flex justify-end">
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Monter" disabled={i === 0 || pending} onClick={() => onDeplacer(c, -1)}><ArrowUp className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Descendre" disabled={i === contacts.length - 1 || pending} onClick={() => onDeplacer(c, 1)}><ArrowDown className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-vinci-bleu" aria-label="Modifier" onClick={() => onModifier(c)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-vinci-rouge" aria-label="Supprimer" onClick={() => onSupprimer(c)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </>
  )
}
