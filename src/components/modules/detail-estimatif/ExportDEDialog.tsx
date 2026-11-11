'use client'
import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useExportPDF } from '@/hooks/useExportPDF'
import { useProfilStore } from '@/stores/profil'
import { formatDateFR } from '@/lib/utils'
import type { LigneDEClient } from './types'

type Props = {
  open: boolean
  onOpenChange: (o: boolean) => void
  lignes: LigneDEClient[]
  nomProjet: string
}

export type OptionsExportDE = {
  sousTotaux: boolean
  recapitulatif: boolean
  paysage: boolean
}

/** Dialog d'options d'export PDF du DE (placé au niveau racine de la page). */
export function ExportDEDialog({ open, onOpenChange, lignes, nomProjet }: Props) {
  const { exportAvecGuard, isExporting } = useExportPDF()
  const profil = useProfilStore((s) => s.profil)
  const [options, setOptions] = useState<OptionsExportDE>({ sousTotaux: true, recapitulatif: true, paysage: false })
  const aDesChapitres = lignes.some((l) => l.estChapitre)

  const exporter = () =>
    exportAvecGuard(async () => {
      const [{ DocumentDetailEstimatif }, { genererEtTelechargerPDF }, { nomFichierSur }] = await Promise.all([
        import('@/lib/pdf/detail-estimatif'),
        import('@/lib/pdf/telecharger'),
        import('@/lib/pdf/format'),
      ])
      const date = formatDateFR(new Date()).split('/').reverse().join('-')
      await genererEtTelechargerPDF(
        <DocumentDetailEstimatif lignes={lignes} nomProjet={nomProjet} profil={profil} options={options} />,
        `Detail_Estimatif_${nomFichierSur(nomProjet)}_${date}.pdf`,
      )
      onOpenChange(false)
    })

  const option = (cle: keyof OptionsExportDE, libelle: string, aide: string, desactive = false) => (
    <div className="flex items-start gap-3">
      <Checkbox
        id={`export-de-${cle}`}
        checked={options[cle]}
        disabled={desactive}
        onCheckedChange={(v) => setOptions((o) => ({ ...o, [cle]: v === true }))}
        className="mt-0.5"
      />
      <div className="grid gap-0.5">
        <Label htmlFor={`export-de-${cle}`} className={desactive ? 'text-vinci-texte-secondaire' : undefined}>
          {libelle}
        </Label>
        <span className="text-xs text-vinci-texte-secondaire">{aide}</span>
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={(o) => !isExporting && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exporter le Détail Estimatif en PDF</DialogTitle>
          <DialogDescription>{lignes.length} lignes · en-tête société de votre profil</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          {option('sousTotaux', 'Inclure les sous-totaux de chapitres', 'Une ligne de sous-total à la fin de chaque chapitre.', !aDesChapitres)}
          {option('recapitulatif', 'Récapitulatif par chapitre', 'Tableau de synthèse en fin de document (montant et % du total).', !aDesChapitres)}
          {option('paysage', 'Format paysage', 'Plus de place pour les désignations longues.')}
        </div>
        <DialogFooter>
          <Button variant="outline" className="btn-secondaire" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Annuler
          </Button>
          <Button onClick={exporter} disabled={isExporting}>
            {isExporting ? <Loader2 className="animate-spin" /> : <FileDown />}
            {isExporting ? 'Génération…' : 'Exporter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
