'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal, flushSync } from 'react-dom'
import { FileDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { VINCI } from '@/lib/design-tokens'
import { useExportPDF } from '@/hooks/useExportPDF'
import { useProfilStore } from '@/stores/profil'
import { nomFichierSur } from '@/lib/pdf/format'
import { FriseRendu } from './FriseRendu'
import { chargerFichier } from './fichiers'
import type { MiseEnPageFrise, ImageJointe, ItemLegende } from './export-frise'
import { COULEURS_SANS_CATEGORIE, jourFR, type CategorieDTO, type EvenementDTO } from './types'

type Props = {
  open: boolean
  onOpenChange: (o: boolean) => void
  projetId: string
  nomProjet: string
  /** événements actuellement affichés sur la frise (filtres appliqués) */
  evenements: EvenementDTO[]
  categories: CategorieDTO[]
}

type RenduExport = { miseEnPage: MiseEnPageFrise; evenements: EvenementDTO[] }

export function ExportFriseDialog({ open, onOpenChange, projetId, nomProjet, evenements, categories }: Props) {
  const { exportAvecGuard, isExporting } = useExportPDF()
  const profil = useProfilStore((s) => s.profil)
  const [debut, setDebut] = useState('')
  const [fin, setFin] = useState('')
  const [rendu, setRendu] = useState<RenduExport | null>(null)
  const noeud = useRef<HTMLDivElement>(null)

  const bornes = useMemo(() => {
    const jours = evenements.map((e) => e.jour).sort()
    return { min: jours[0] ?? '', max: jours[jours.length - 1] ?? '' }
  }, [evenements])

  // pré-remplissage min / max à l'ouverture
  useEffect(() => {
    if (!open) return
    setDebut(bornes.min)
    setFin(bornes.max)
  }, [open, bornes])

  const periodeValide = !!debut && !!fin && debut <= fin
  const dansPeriode = useMemo(
    () => (periodeValide ? evenements.filter((e) => e.jour >= debut && e.jour <= fin) : []),
    [evenements, debut, fin, periodeValide],
  )
  const nbImages = dansPeriode.reduce((n, e) => n + e.fichiers.filter((f) => f.type.startsWith('image/')).length, 0)

  function legende(evs: EvenementDTO[]): ItemLegende[] {
    const items: ItemLegende[] = categories.filter((c) => evs.some((e) => e.categorieId === c.id))
    if (evs.some((e) => !categories.some((c) => c.id === e.categorieId))) items.push({ nom: 'Sans catégorie', ...COULEURS_SANS_CATEGORIE })
    return items
  }

  function exporter() {
    void exportAvecGuard(async () => {
      if (!periodeValide || dansPeriode.length === 0) {
        toast.error('Aucun événement dans la période')
        return
      }
      const evs = dansPeriode
      const { calculerMiseEnPage, genererFrisePDF } = await import('./export-frise')
      const miseEnPage = calculerMiseEnPage(
        evs.map((e) => ({ id: e.id, jour: e.jour, titre: e.titre, description: e.description })),
        legende(evs),
        debut,
        fin,
      )
      // Re-rendu synchrone de la frise filtrée, étalée et recadrée
      flushSync(() => setRendu({ miseEnPage, evenements: evs }))
      try {
        await new Promise<void>((r) => requestAnimationFrame(() => r()))
        if (!noeud.current) throw new Error('Rendu de la frise indisponible')
        await genererFrisePDF({
          noeud: noeud.current,
          miseEnPage,
          nomProjet,
          nomFichierProjet: nomFichierSur(nomProjet),
          profil,
          debut,
          fin,
          chargerImages: async () => {
            const res: ImageJointe[] = []
            for (const e of evs) {
              for (const f of e.fichiers.filter((x) => x.type.startsWith('image/'))) {
                try {
                  res.push({ jour: e.jour, titreEvenement: e.titre, nom: f.nom, dataUrl: await chargerFichier(projetId, f.id) })
                } catch {
                  toast.error(`Pièce jointe illisible : ${f.nom}`)
                }
              }
            }
            return res
          },
        })
        toast.success('Frise exportée')
        onOpenChange(false)
      } finally {
        setRendu(null)
      }
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !isExporting && onOpenChange(o)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-vinci-bleu">Exporter la frise en PDF</DialogTitle>
            <DialogDescription>A4 paysage, frise étalée sur toute la largeur de la page, pièces jointes images en annexe.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="exp-debut">Du</Label>
              <Input id="exp-debut" type="date" value={debut} max={fin || undefined} onChange={(e) => setDebut(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="exp-fin">Au</Label>
              <Input id="exp-fin" type="date" value={fin} min={debut || undefined} onChange={(e) => setFin(e.target.value)} />
            </div>
          </div>
          <div className="rounded-sm border border-vinci-gris-bordure bg-vinci-bleu-tres-clair px-3 py-2 text-sm text-vinci-bleu-fonce">
            {!periodeValide ? (
              'Période invalide'
            ) : (
              <>
                <strong>{dansPeriode.length}</strong> événement{dansPeriode.length > 1 ? 's' : ''} du {jourFR(debut)} au {jourFR(fin)}
                {nbImages > 0 && (
                  <>
                    {' '}
                    · {nbImages} image{nbImages > 1 ? 's' : ''} jointe{nbImages > 1 ? 's' : ''} en annexe
                  </>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" className="btn-secondaire" onClick={() => onOpenChange(false)} disabled={isExporting}>
              Annuler
            </Button>
            <Button onClick={exporter} disabled={isExporting || !periodeValide || dansPeriode.length === 0}>
              {isExporting ? <Loader2 className="animate-spin" /> : <FileDown />}
              {isExporting ? 'Export en cours…' : 'Exporter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Frise d'export : rendue hors flux (sous le voile du Dialog) le temps de la capture */}
      {rendu &&
        createPortal(
          <div aria-hidden style={{ position: 'fixed', left: 0, top: 0, zIndex: 1, pointerEvents: 'none', background: VINCI.blanc }}>
            <FriseRendu
              ref={noeud}
              disposition={rendu.miseEnPage.disposition}
              evenements={rendu.evenements}
              categories={categories}
              recadrage={{ debutX: rendu.miseEnPage.disposition.contenuGauche, finX: rendu.miseEnPage.disposition.contenuDroite }}
            />
          </div>,
          document.body,
        )}
    </>
  )
}
