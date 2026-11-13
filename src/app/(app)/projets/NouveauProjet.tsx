'use client'
import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { creerProjet } from '@/actions/projets'

export function NouveauProjet({ ouvertParDefaut = false }: { ouvertParDefaut?: boolean }) {
  const [open, setOpen] = useState(ouvertParDefaut)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [pending, start] = useTransition()
  const router = useRouter()

  // Lien « Nouveau projet » du menu (/projets?nouveau=1) : ouvre la fenêtre même si l'on est déjà sur la page.
  useEffect(() => {
    if (ouvertParDefaut) setOpen(true)
  }, [ouvertParDefaut])

  function changerOuverture(o: boolean) {
    setOpen(o)
    // À la fermeture, retire le paramètre pour qu'un nouveau clic sur le lien rouvre la fenêtre.
    if (!o && ouvertParDefaut) router.replace('/projets')
  }

  function valider() {
    start(async () => {
      const res = await creerProjet({ name, description })
      if (!res.success) return void toast.error(res.error)
      setOpen(false)
      router.push(`/projets/${res.data.id}/infos`)
    })
  }

  return (
    <Dialog open={open} onOpenChange={changerOuverture}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Nouveau projet
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau projet</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Nom du projet</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button className="btn-secondaire" variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={valider} disabled={pending || !name.trim()}>
            Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
