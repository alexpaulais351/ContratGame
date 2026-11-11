'use client'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supprimerProjet } from '@/actions/projets'

export function ZoneDanger({ projetId, nomProjet }: { projetId: string; nomProjet: string }) {
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()

  function supprimer() {
    start(async () => {
      // en cas de succès, l'action redirige vers /projets
      const res = await supprimerProjet(projetId)
      if (res && !res.success) toast.error(res.error)
    })
  }

  return (
    <section className="carte space-y-3 border-vinci-rouge">
      <h2 className="font-bold text-vinci-rouge">Zone de danger</h2>
      <p className="text-sm text-vinci-texte-secondaire">
        La suppression du projet est définitive : toutes ses données (détail estimatif, situations, courriers, journal…) seront perdues.
      </p>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Supprimer le projet
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le projet ?</DialogTitle>
            <DialogDescription>
              Vous allez supprimer définitivement « {nomProjet} ». Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="btn-secondaire" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={supprimer} disabled={pending}>
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
