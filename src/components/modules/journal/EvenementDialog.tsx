'use client'
import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { FileText, Mail, Paperclip, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ajouterFichierEvenement, creerEvenement, modifierEvenement, supprimerFichierEvenement } from '@/actions/journal'
import { lireFichierLocal, oublierFichier } from './fichiers'
import { Vignette } from './PiecesJointes'
import { TAILLE_MAX_FICHIER, formatTaille, versJour, type CategorieDTO, type EvenementDTO } from './types'

const AUCUNE = '__aucune__'
const TYPES_ACCEPTES = /^(image\/(png|jpe?g|gif|webp)|application\/pdf)$/

type NouveauFichier = { cle: string; fichier: File; apercu: string | null }

type Props = {
  open: boolean
  onOpenChange: (o: boolean) => void
  projetId: string
  categories: CategorieDTO[]
  /** null = création */
  evenement: EvenementDTO | null
}

export function EvenementDialog({ open, onOpenChange, projetId, categories, evenement }: Props) {
  const [jour, setJour] = useState('')
  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [categorieId, setCategorieId] = useState<string>(AUCUNE)
  const [afficherFrise, setAfficherFrise] = useState(true)
  const [supprimes, setSupprimes] = useState<string[]>([])
  const [nouveaux, setNouveaux] = useState<NouveauFichier[]>([])
  const [pending, start] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setJour(evenement?.jour ?? versJour(new Date()))
    setTitre(evenement?.titre ?? '')
    setDescription(evenement?.description ?? '')
    setCategorieId(evenement?.categorieId ?? AUCUNE)
    setAfficherFrise(evenement?.afficherFrise ?? true)
    setSupprimes([])
    setNouveaux([])
  }, [open, evenement])

  // libère les aperçus locaux à la fermeture / au démontage
  const apercus = useRef<string[]>([])
  useEffect(() => {
    if (open) return
    apercus.current.forEach((u) => URL.revokeObjectURL(u))
    apercus.current.length = 0
  }, [open])
  useEffect(() => {
    const liste = apercus.current
    return () => liste.forEach((u) => URL.revokeObjectURL(u))
  }, [])

  function ajouterFichiers(liste: FileList | null) {
    if (!liste) return
    const ajout: NouveauFichier[] = []
    for (const f of Array.from(liste)) {
      if (!TYPES_ACCEPTES.test(f.type)) {
        toast.error(`${f.name} : seules les images (PNG, JPEG, GIF, WebP) et les PDF sont acceptés`)
        continue
      }
      if (f.size > TAILLE_MAX_FICHIER) {
        toast.error(`${f.name} : ${formatTaille(f.size)} dépasse la limite de 5 Mo`)
        continue
      }
      ajout.push({
        cle: `${f.name}-${f.size}-${f.lastModified}-${Math.random()}`,
        fichier: f,
        apercu: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
      })
      const dernier = ajout[ajout.length - 1].apercu
      if (dernier) apercus.current.push(dernier)
    }
    setNouveaux((n) => [...n, ...ajout])
    if (inputRef.current) inputRef.current.value = ''
  }

  function enregistrer() {
    start(async () => {
      const payload = {
        date: jour,
        titre,
        description: description || null,
        categorieId: categorieId === AUCUNE ? null : categorieId,
        afficherFrise,
      }
      let id = evenement?.id
      if (id) {
        const r = await modifierEvenement(projetId, id, payload)
        if (!r.success) return void toast.error(r.error)
      } else {
        const r = await creerEvenement(projetId, payload)
        if (!r.success) return void toast.error(r.error)
        id = r.data.id
      }
      for (const fid of supprimes) {
        const r = await supprimerFichierEvenement(projetId, fid)
        if (!r.success) toast.error(r.error)
        else oublierFichier(fid)
      }
      // un appel par fichier : chaque requête reste sous la limite de taille des Server Actions
      for (const n of nouveaux) {
        try {
          const contenu = await lireFichierLocal(n.fichier)
          const r = await ajouterFichierEvenement(projetId, id, { nom: n.fichier.name, type: n.fichier.type, contenu, taille: n.fichier.size })
          if (!r.success) toast.error(`${n.fichier.name} : ${r.error}`)
        } catch {
          toast.error(`${n.fichier.name} : lecture impossible`)
        }
      }
      toast.success(evenement ? 'Événement modifié' : 'Événement créé')
      onOpenChange(false)
    })
  }

  const existants = (evenement?.fichiers ?? []).filter((f) => !supprimes.includes(f.id))

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-vinci-bleu">{evenement ? "Modifier l'événement" : 'Nouvel événement'}</DialogTitle>
          <DialogDescription>Événement du journal de chantier, affichable sur la frise chronologique.</DialogDescription>
        </DialogHeader>

        {evenement?.courrierId && (
          <div className="flex items-center gap-2 rounded-sm border border-vinci-gris-bordure bg-vinci-bleu-tres-clair px-3 py-2 text-sm text-vinci-bleu-fonce">
            <Mail className="h-4 w-4 shrink-0" />
            <span>Événement créé depuis un courrier.</span>
            <Link href={`/projets/${projetId}/courriers/${evenement.courrierId}`} className="font-semibold underline">
              Ouvrir le courrier
            </Link>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
          <div className="space-y-1">
            <Label htmlFor="ev-date">Date</Label>
            <Input id="ev-date" type="date" value={jour} onChange={(e) => setJour(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ev-titre">Titre</Label>
            <Input id="ev-titre" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex. Réception du VISA béton" autoFocus />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-1">
            <Label>Catégorie</Label>
            <Select value={categorieId} onValueChange={setCategorieId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={AUCUNE}>Sans catégorie</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.couleurPoint }} />
                      {c.nom}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex h-10 cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={afficherFrise} onCheckedChange={(v) => setAfficherFrise(v === true)} />
            Afficher sur la frise
          </label>
        </div>

        <div className="space-y-1">
          <Label htmlFor="ev-desc">Description</Label>
          <Textarea id="ev-desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Pièces jointes</Label>
            <span className="text-xs text-vinci-texte-secondaire">Images ou PDF, 5 Mo maximum par fichier</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {existants.map((f) => (
              <div key={f.id} className="flex items-center gap-2 rounded-sm border border-vinci-gris-bordure bg-white py-1 pl-1 pr-2 text-xs">
                {f.type.startsWith('image/') ? (
                  <Vignette projetId={projetId} fichier={f} taille={36} />
                ) : (
                  <FileText className="ml-1 h-5 w-5 text-vinci-bleu" />
                )}
                <span className="max-w-[150px] truncate" title={f.nom}>
                  {f.nom}
                </span>
                <span className="text-vinci-texte-secondaire">{formatTaille(f.taille)}</span>
                <button
                  type="button"
                  className="text-vinci-rouge hover:text-vinci-rouge-fonce"
                  title="Retirer"
                  onClick={() => setSupprimes((s) => [...s, f.id])}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {nouveaux.map((n) => (
              <div
                key={n.cle}
                className="flex items-center gap-2 rounded-sm border border-dashed border-vinci-bleu bg-vinci-bleu-tres-clair py-1 pl-1 pr-2 text-xs"
              >
                {n.apercu ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={n.apercu} alt={n.fichier.name} className="h-9 w-9 rounded-sm object-cover" />
                ) : (
                  <FileText className="ml-1 h-5 w-5 text-vinci-bleu" />
                )}
                <span className="max-w-[150px] truncate" title={n.fichier.name}>
                  {n.fichier.name}
                </span>
                <span className="text-vinci-texte-secondaire">{formatTaille(n.fichier.size)}</span>
                <button
                  type="button"
                  className="text-vinci-rouge hover:text-vinci-rouge-fonce"
                  title="Retirer"
                  onClick={() => setNouveaux((l) => l.filter((x) => x.cle !== n.cle))}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/gif,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => ajouterFichiers(e.target.files)}
          />
          <Button type="button" variant="outline" className="btn-toolbar" size="sm" onClick={() => inputRef.current?.click()}>
            <Paperclip /> Ajouter des fichiers
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" className="btn-secondaire" onClick={() => onOpenChange(false)} disabled={pending}>
            Annuler
          </Button>
          <Button onClick={enregistrer} disabled={pending || !titre.trim() || !jour}>
            {pending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
