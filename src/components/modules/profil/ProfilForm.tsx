'use client'
import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePlus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { changerMotDePasse, sauvegarderProfil } from '@/actions/profil'
import { useProfilStore, type ProfilSociete } from '@/stores/profil'
import { lireLogo } from './logo'

export function ProfilForm({ initial }: { initial: ProfilSociete }) {
  const router = useRouter()
  const setProfil = useProfilStore((s) => s.setProfil)
  const [f, setF] = useState(initial)
  const [pending, start] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  const [ancien, setAncien] = useState('')
  const [nouveau, setNouveau] = useState('')
  const [confirm, setConfirm] = useState('')
  const [pendingMdp, startMdp] = useTransition()

  const set = <K extends keyof ProfilSociete>(k: K, v: ProfilSociete[K]) => setF((p) => ({ ...p, [k]: v }))
  const txt = (k: 'nomSociete' | 'adresseSociete' | 'telSociete' | 'faxSociete' | 'certifications') => ({
    value: f[k] ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(k, e.target.value),
  })

  async function choisirLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      set('logoSociete', await lireLogo(file))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Logo illisible')
    }
  }

  function enregistrer() {
    start(async () => {
      const res = await sauvegarderProfil({
        name: f.nom,
        email: f.email,
        logoSociete: f.logoSociete,
        nomSociete: f.nomSociete ?? '',
        adresseSociete: f.adresseSociete ?? '',
        telSociete: f.telSociete ?? '',
        faxSociete: f.faxSociete ?? '',
        certifications: f.certifications ?? '',
      })
      if (!res.success) return void toast.error(res.error)
      setF(res.data)
      setProfil(res.data)
      router.refresh()
      toast.success('Profil enregistré')
    })
  }

  function modifierMdp() {
    if (nouveau !== confirm) return void toast.error('La confirmation ne correspond pas')
    startMdp(async () => {
      const res = await changerMotDePasse({ ancien, nouveau })
      if (!res.success) return void toast.error(res.error)
      setAncien('')
      setNouveau('')
      setConfirm('')
      toast.success('Mot de passe modifié')
    })
  }

  return (
    <div className="space-y-4">
      <section className="carte space-y-3">
        <h2 className="font-bold text-vinci-bleu">Informations personnelles</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Nom</Label>
            <Input value={f.nom} onChange={(e) => set('nom', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input type="email" value={f.email} onChange={(e) => set('email', e.target.value)} />
          </div>
        </div>
      </section>

      <section className="carte space-y-3">
        <h2 className="font-bold text-vinci-bleu">Société (en-tête des PDF)</h2>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-24 w-40 items-center justify-center rounded-md border border-dashed border-vinci-gris-bordure bg-vinci-gris-clair">
            {f.logoSociete ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={f.logoSociete} alt="Logo société" className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-xs text-vinci-texte-secondaire">Aucun logo</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={choisirLogo} />
            <Button type="button" variant="outline" className="btn-secondaire" onClick={() => fileRef.current?.click()}>
              <ImagePlus /> {f.logoSociete ? 'Remplacer le logo' : 'Ajouter un logo'}
            </Button>
            {f.logoSociete && (
              <Button type="button" variant="outline" className="btn-toolbar" onClick={() => set('logoSociete', null)}>
                <Trash2 /> Supprimer le logo
              </Button>
            )}
            <p className="text-xs text-vinci-texte-secondaire">Image redimensionnée automatiquement (≈ 1 Mo max).</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label>Nom de la société</Label>
            <Input {...txt('nomSociete')} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Adresse</Label>
            <Textarea rows={2} {...txt('adresseSociete')} />
          </div>
          <div className="space-y-1">
            <Label>Téléphone</Label>
            <Input {...txt('telSociete')} />
          </div>
          <div className="space-y-1">
            <Label>Fax</Label>
            <Input {...txt('faxSociete')} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Certifications</Label>
            <Textarea rows={2} {...txt('certifications')} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={enregistrer} disabled={pending || !f.nom.trim() || !f.email.trim()}>
            {pending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </section>

      <section className="carte space-y-3">
        <h2 className="font-bold text-vinci-bleu">Changer le mot de passe</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label>Ancien mot de passe</Label>
            <Input type="password" autoComplete="current-password" value={ancien} onChange={(e) => setAncien(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Nouveau (8 car. min.)</Label>
            <Input type="password" autoComplete="new-password" value={nouveau} onChange={(e) => setNouveau(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Confirmation</Label>
            <Input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button variant="outline" className="btn-secondaire" onClick={modifierMdp} disabled={pendingMdp || !ancien || !nouveau}>
            Modifier le mot de passe
          </Button>
        </div>
      </section>
    </div>
  )
}
