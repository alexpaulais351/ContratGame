'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, FileDown, FileSpreadsheet, Loader2, Plus, TriangleAlert, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  ajouterCritere,
  ajouterFournisseur,
  enregistrerMatrice,
  reordonnerFournisseurs,
  supprimerCritere,
  supprimerFournisseur,
} from '@/actions/matrice'
import { useExportPDF } from '@/hooks/useExportPDF'
import {
  DECISIONS,
  DEVISES,
  STATUTS_MATRICE,
  TYPES_CRITERE,
  TYPOLOGIES_ACHAT,
  libelleSection,
  type BidCompData,
  type StatutMatrice,
  type TypeCritere,
} from '@/lib/matrice-bidcomp'
import { nomFichierSur } from '@/lib/pdf/format'
import { useProfilStore } from '@/stores/profil'
import { cn, formatNombreFR } from '@/lib/utils'
import { BadgeDecision } from './badges'
import type { PatchNotation } from './CelluleNotation'
import { ChampNombre } from './ChampNombre'
import { GrilleMatrice, type PatchCritere, type PatchFournisseur } from './GrilleMatrice'
import { analyserMatrice, cleNotation, formatMontantDevise } from './grille'
import type { CritereVue, EnteteVue, FournisseurVue, MatriceVue, NotationVue } from './types'

type Etat = {
  entete: EnteteVue
  bidComp: BidCompData
  fournisseurs: FournisseurVue[]
  criteres: CritereVue[]
  notations: Record<string, NotationVue>
}

type Sauvegarde = 'idle' | 'attente' | 'enregistrement' | 'ok' | 'erreur'

const SELECT = 'flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm focus:border-vinci-bleu focus:outline-none'

function notationVide(critereId: string, fournisseurId: string): NotationVue {
  return {
    critereId,
    fournisseurId,
    note: null,
    valeurTexte: null,
    valeurBool: null,
    commentaire: null,
    estNonConformiteMajeure: false,
    estNonConformiteNegociable: false,
  }
}

export function EditeurMatrice({ projetId, nomProjet, initiale }: { projetId: string; nomProjet: string; initiale: MatriceVue }) {
  const matriceId = initiale.id
  const [etat, setEtat] = useState<Etat>(() => ({
    entete: {
      titre: initiale.titre,
      acheteur: initiale.acheteur,
      site: initiale.site,
      familleAchats: initiale.familleAchats,
      budgetTheorique: initiale.budgetTheorique,
      devise: initiale.devise,
      seuilGo: initiale.seuilGo,
      statut: initiale.statut,
    },
    bidComp: initiale.bidComp,
    fournisseurs: initiale.fournisseurs,
    criteres: initiale.criteres,
    notations: Object.fromEntries(initiale.notations.map((n) => [cleNotation(n.critereId, n.fournisseurId), n])),
  }))
  const [sauvegarde, setSauvegarde] = useState<Sauvegarde>('idle')

  // ── Auto-save debounced 500 ms ──
  const etatRef = useRef(etat)
  etatRef.current = etat
  const sales = useRef({ entete: false, bidComp: false, f: new Set<string>(), c: new Set<string>(), n: new Set<string>() })
  const saveRef = useRef<NodeJS.Timeout>()
  const enVol = useRef<Promise<unknown>>(Promise.resolve())

  const flush = useCallback(async () => {
    clearTimeout(saveRef.current)
    const s = sales.current
    if (!s.entete && !s.bidComp && !s.f.size && !s.c.size && !s.n.size) return
    const e = etatRef.current
    const payload = {
      entete: s.entete ? { ...e.entete, titre: e.entete.titre.trim() || 'Sans titre' } : undefined,
      bidComp: s.bidComp ? e.bidComp : undefined,
      fournisseurs: s.f.size ? e.fournisseurs.filter((f) => s.f.has(f.id)) : undefined,
      criteres: s.c.size ? e.criteres.filter((c) => s.c.has(c.id)).map((c) => ({ ...c, libelle: c.libelle.trim() || 'Critère' })) : undefined,
      notations: s.n.size ? [...s.n].map((k) => e.notations[k]).filter(Boolean) : undefined,
    }
    sales.current = { entete: false, bidComp: false, f: new Set(), c: new Set(), n: new Set() }
    setSauvegarde('enregistrement')
    const p = enVol.current.then(() => enregistrerMatrice(projetId, matriceId, payload))
    enVol.current = p.catch(() => undefined)
    try {
      const res = await p
      if (!res.success) {
        setSauvegarde('erreur')
        toast.error(`Enregistrement impossible : ${res.error}`)
      } else setSauvegarde('ok')
    } catch {
      setSauvegarde('erreur')
      toast.error('Enregistrement impossible (réseau)')
    }
  }, [projetId, matriceId])

  const planifier = useCallback(() => {
    setSauvegarde('attente')
    clearTimeout(saveRef.current)
    saveRef.current = setTimeout(() => void flush(), 500)
  }, [flush])

  // Ctrl+S : sauvegarde immédiate ; sauvegarde au démontage.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void flush()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      void flush()
    }
  }, [flush])

  // ── Mutations locales ──
  const majEntete = useCallback(
    (patch: Partial<EnteteVue>) => {
      setEtat((e) => ({ ...e, entete: { ...e.entete, ...patch } }))
      sales.current.entete = true
      planifier()
    },
    [planifier],
  )
  const majBidComp = useCallback(
    (patch: Partial<BidCompData>) => {
      setEtat((e) => ({ ...e, bidComp: { ...e.bidComp, ...patch } }))
      sales.current.bidComp = true
      planifier()
    },
    [planifier],
  )
  const majFournisseur = useCallback(
    (id: string, patch: PatchFournisseur) => {
      setEtat((e) => ({
        ...e,
        fournisseurs: e.fournisseurs.map((f) =>
          f.id === id ? { ...f, ...patch, ...(patch.decision ? { couleurDecision: DECISIONS[patch.decision].couleur } : {}) } : f,
        ),
      }))
      sales.current.f.add(id)
      planifier()
    },
    [planifier],
  )
  const majCritere = useCallback(
    (id: string, patch: PatchCritere) => {
      setEtat((e) => ({ ...e, criteres: e.criteres.map((c) => (c.id === id ? { ...c, ...patch } : c)) }))
      sales.current.c.add(id)
      planifier()
    },
    [planifier],
  )
  const majNotation = useCallback(
    (critereId: string, fournisseurId: string, patch: PatchNotation) => {
      const k = cleNotation(critereId, fournisseurId)
      setEtat((e) => {
        const base = e.notations[k] ?? notationVide(critereId, fournisseurId)
        return { ...e, notations: { ...e.notations, [k]: { ...base, ...patch } } }
      })
      sales.current.n.add(k)
      planifier()
    },
    [planifier],
  )

  // ── Calculs ──
  const analyse = useMemo(
    () =>
      analyserMatrice({
        criteres: etat.criteres,
        fournisseurs: etat.fournisseurs,
        notations: Object.values(etat.notations),
        seuilGo: etat.entete.seuilGo,
      }),
    [etat.criteres, etat.fournisseurs, etat.notations, etat.entete.seuilGo],
  )

  // ── Opérations structurelles ──
  const [occupe, setOccupe] = useState(false)
  async function nouveauFournisseur() {
    setOccupe(true)
    await flush()
    const res = await ajouterFournisseur(projetId, matriceId)
    setOccupe(false)
    if (!res.success) return void toast.error(res.error)
    setEtat((e) => ({ ...e, fournisseurs: [...e.fournisseurs, res.data] }))
  }

  const deplacerFournisseur = useCallback(
    (id: string, sens: -1 | 1) => {
      const liste = [...etatRef.current.fournisseurs]
      const i = liste.findIndex((f) => f.id === id)
      const j = i + sens
      if (i < 0 || j < 0 || j >= liste.length) return
      ;[liste[i], liste[j]] = [liste[j], liste[i]]
      const renum = liste.map((f, k) => ({ ...f, rang: k + 1 }))
      setEtat((e) => ({ ...e, fournisseurs: renum }))
      void reordonnerFournisseurs(projetId, matriceId, renum.map((f) => f.id)).then((r) => {
        if (!r.success) toast.error(r.error)
      })
    },
    [projetId, matriceId],
  )

  const [fSupprimer, setFSupprimer] = useState<FournisseurVue | null>(null)
  const [cSupprimer, setCSupprimer] = useState<CritereVue | null>(null)

  async function confirmerSuppressionFournisseur() {
    if (!fSupprimer) return
    const id = fSupprimer.id
    setOccupe(true)
    await flush()
    const res = await supprimerFournisseur(projetId, matriceId, id)
    setOccupe(false)
    if (!res.success) return void toast.error(res.error)
    setEtat((e) => ({
      ...e,
      fournisseurs: e.fournisseurs.filter((f) => f.id !== id),
      notations: Object.fromEntries(Object.entries(e.notations).filter(([, n]) => n.fournisseurId !== id)),
      bidComp: e.bidComp.fournisseurRecommandeId === id ? { ...e.bidComp, fournisseurRecommandeId: null } : e.bidComp,
    }))
    setFSupprimer(null)
  }

  async function confirmerSuppressionCritere() {
    if (!cSupprimer) return
    const id = cSupprimer.id
    setOccupe(true)
    await flush()
    const res = await supprimerCritere(projetId, matriceId, id)
    setOccupe(false)
    if (!res.success) return void toast.error(res.error)
    setEtat((e) => ({
      ...e,
      criteres: e.criteres.filter((c) => c.id !== id),
      notations: Object.fromEntries(Object.entries(e.notations).filter(([, n]) => n.critereId !== id)),
    }))
    setCSupprimer(null)
  }

  const [ajoutCritere, setAjoutCritere] = useState<{ famille: string; libelle: string; type: TypeCritere; coefficient: number } | null>(null)
  const ouvrirAjoutCritere = useCallback((famille: string) => {
    const type: TypeCritere = famille === 'couts' || famille === 'options' ? 'montant' : 'note_1_3'
    setAjoutCritere({ famille, libelle: '', type, coefficient: type === 'note_1_3' ? 1 : 0 })
  }, [])
  async function validerAjoutCritere() {
    if (!ajoutCritere) return
    setOccupe(true)
    await flush()
    const res = await ajouterCritere(projetId, matriceId, ajoutCritere)
    setOccupe(false)
    if (!res.success) return void toast.error(res.error)
    setEtat((e) => {
      // L'action décale l'ordre des critères suivants : on reproduit localement.
      const criteres = e.criteres.map((c) => (c.ordre >= res.data.ordre ? { ...c, ordre: c.ordre + 1 } : c))
      return { ...e, criteres: [...criteres, res.data].sort((a, b) => a.ordre - b.ordre) }
    })
    setAjoutCritere(null)
  }

  // ── Commentaire de cellule ──
  const [commentaire, setCommentaire] = useState<{ critereId: string; fournisseurId: string; texte: string } | null>(null)
  const ouvrirCommentaire = useCallback((critereId: string, fournisseurId: string) => {
    const n = etatRef.current.notations[cleNotation(critereId, fournisseurId)]
    setCommentaire({ critereId, fournisseurId, texte: n?.commentaire ?? '' })
  }, [])

  // ── Exports ──
  const { exportAvecGuard, isExporting } = useExportPDF()
  const profil = useProfilStore((s) => s.profil)
  const vue = (): MatriceVue => {
    const e = etatRef.current
    return { id: matriceId, ...e.entete, bidComp: e.bidComp, fournisseurs: e.fournisseurs, criteres: e.criteres, notations: Object.values(e.notations) }
  }
  const nomFichier = () => `Matrice_${nomFichierSur(etatRef.current.entete.titre || 'BidComp')}`

  function exporterExcel() {
    exportAvecGuard(async () => {
      await flush()
      const { exporterMatriceExcel } = await import('./export-excel')
      await exporterMatriceExcel(vue(), nomProjet, `${nomFichier()}.xlsx`)
    })
  }
  function exporterPDF() {
    exportAvecGuard(async () => {
      await flush()
      const [{ MatriceBidCompPDF }, { genererEtTelechargerPDF }] = await Promise.all([import('@/lib/pdf/matrice-bidcomp'), import('@/lib/pdf/telecharger')])
      await genererEtTelechargerPDF(<MatriceBidCompPDF matrice={vue()} profil={profil} nomProjet={nomProjet} />, `${nomFichier()}.pdf`)
    })
  }

  const { entete, bidComp, fournisseurs } = etat
  const meilleur = fournisseurs.find((f) => f.id === analyse.meilleurId) ?? null
  const ecartBudget = meilleur?.montantOffre != null && entete.budgetTheorique ? meilleur.montantOffre - entete.budgetTheorique : null
  const classementTrie = [...fournisseurs].sort((a, b) => (analyse.scores.get(a.id)?.classement ?? 99) - (analyse.scores.get(b.id)?.classement ?? 99))

  return (
    <div className="space-y-4">
      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Button asChild variant="outline" size="icon" className="btn-toolbar size-9 shrink-0" title="Retour à la liste">
            <Link href={`/projets/${projetId}/matrice`}>
              <ArrowLeft />
            </Link>
          </Button>
          <input
            aria-label="Titre de la matrice"
            className="page-titre min-w-0 flex-1 rounded-sm border border-transparent bg-transparent px-1 outline-none hover:border-vinci-gris-bordure focus:border-vinci-bleu sm:min-w-[360px]"
            value={entete.titre}
            onChange={(e) => majEntete({ titre: e.target.value })}
          />
          <IndicateurSauvegarde etat={sauvegarde} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="btn-toolbar" onClick={nouveauFournisseur} disabled={occupe || fournisseurs.length >= 20}>
            <Plus /> Fournisseur
          </Button>
          <Button variant="outline" className="btn-secondaire" onClick={exporterExcel} disabled={isExporting}>
            <FileSpreadsheet /> Excel
          </Button>
          <Button variant="outline" className="btn-secondaire" onClick={exporterPDF} disabled={isExporting}>
            {isExporting ? <Loader2 className="animate-spin" /> : <FileDown />} PDF
          </Button>
        </div>
      </div>

      {/* En-tête */}
      <section className="carte grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <Champ label="Acheteur">
          <Input value={entete.acheteur ?? ''} onChange={(e) => majEntete({ acheteur: e.target.value || null })} />
        </Champ>
        <Champ label="Site">
          <Input value={entete.site ?? ''} onChange={(e) => majEntete({ site: e.target.value || null })} />
        </Champ>
        <Champ label="Famille d'achats">
          <Input value={entete.familleAchats ?? ''} onChange={(e) => majEntete({ familleAchats: e.target.value || null })} />
        </Champ>
        <Champ label="Typologie d'achat">
          <select className={SELECT} value={bidComp.typologieAchat} onChange={(e) => majBidComp({ typologieAchat: e.target.value })}>
            {bidComp.typologieAchat && !(TYPOLOGIES_ACHAT as readonly string[]).includes(bidComp.typologieAchat) && <option>{bidComp.typologieAchat}</option>}
            {TYPOLOGIES_ACHAT.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Champ>
        <Champ label="Date d'établissement">
          <Input type="date" value={bidComp.dateEtablissement ?? ''} onChange={(e) => majBidComp({ dateEtablissement: e.target.value || null })} />
        </Champ>
        <Champ label="Budget théorique (HT)">
          <ChampNombre
            className="h-9 rounded-md border-input bg-background px-2 text-sm"
            valeur={entete.budgetTheorique}
            onChange={(v) => majEntete({ budgetTheorique: v })}
          />
        </Champ>
        <Champ label="Devise">
          <select className={SELECT} value={entete.devise} onChange={(e) => majEntete({ devise: e.target.value })}>
            {!(DEVISES as readonly string[]).includes(entete.devise) && <option>{entete.devise}</option>}
            {DEVISES.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </Champ>
        <Champ label="Seuil GO (score normalisé %)">
          <ChampNombre
            className="h-9 rounded-md border-input bg-background px-2 text-sm"
            decimales={0}
            suffixe="%"
            valeur={entete.seuilGo}
            onChange={(v) => majEntete({ seuilGo: Math.max(0, Math.min(100, v ?? 0)) })}
          />
        </Champ>
        <Champ label="Statut">
          <select className={SELECT} value={entete.statut} onChange={(e) => majEntete({ statut: e.target.value as StatutMatrice })}>
            {STATUTS_MATRICE.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Champ>
        <div className="flex flex-col justify-end rounded-md bg-vinci-bleu-tres-clair px-3 py-2 text-sm">
          <div className="flex items-center gap-1 text-xs text-vinci-texte-secondaire">
            <Trophy className="size-3.5" /> Meilleure offre
          </div>
          {meilleur ? (
            <>
              <div className="truncate font-bold text-vinci-bleu-fonce">
                {meilleur.nom} · {formatNombreFR(analyse.scores.get(meilleur.id)?.pourcentage ?? 0, 1)} %
              </div>
              {ecartBudget !== null && (
                <div className={cn('text-xs', ecartBudget > 0 ? 'text-vinci-rouge' : 'text-vinci-vert')}>
                  {ecartBudget > 0 ? '+' : ''}
                  {formatMontantDevise(ecartBudget, entete.devise)} vs budget
                </div>
              )}
            </>
          ) : (
            <div className="text-vinci-texte-secondaire">—</div>
          )}
        </div>
      </section>

      {/* Légende */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-vinci-texte-secondaire">
        <span>Notes : 1 insuffisant · 2 acceptable · 3 très satisfaisant</span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-3 rounded-sm border-2 border-vinci-rouge bg-vinci-rouge-tres-clair" /> Non-conformité majeure (élimine l&apos;offre)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-3 rounded-sm border-2 border-vinci-jaune bg-vinci-jaune-clair" /> Non-conformité négociable
        </span>
        <span>Clic droit ou ⋮ sur une cellule pour marquer / commenter</span>
      </div>

      {fournisseurs.length === 0 ? (
        <div className="carte flex flex-col items-center gap-3 py-10 text-center text-vinci-texte-secondaire">
          Aucun fournisseur candidat.
          <Button onClick={nouveauFournisseur} disabled={occupe}>
            <Plus /> Ajouter un fournisseur
          </Button>
        </div>
      ) : (
        <GrilleMatrice
          fournisseurs={fournisseurs}
          criteres={etat.criteres}
          notations={etat.notations}
          analyse={analyse}
          devise={entete.devise}
          seuilGo={entete.seuilGo}
          onFournisseur={majFournisseur}
          onCritere={majCritere}
          onNotation={majNotation}
          onCommentaire={ouvrirCommentaire}
          onAjouterCritere={ouvrirAjoutCritere}
          onSupprimerCritere={setCSupprimer}
          onSupprimerFournisseur={setFSupprimer}
          onDeplacerFournisseur={deplacerFournisseur}
        />
      )}

      {/* Synthèse */}
      <section className="grid gap-4 lg:grid-cols-3">
        <BlocSynthese titre="Opportunités" couleur="border-l-vinci-vert" valeur={bidComp.synthese.opportunites} onChange={(v) => majBidComp({ synthese: { ...bidComp.synthese, opportunites: v } })} />
        <BlocSynthese titre="Risques" couleur="border-l-vinci-rouge" valeur={bidComp.synthese.risques} onChange={(v) => majBidComp({ synthese: { ...bidComp.synthese, risques: v } })} />
        <div className="carte space-y-2 border-l-4 border-l-vinci-bleu">
          <h2 className="font-bold text-vinci-bleu">Recommandation</h2>
          <div className="space-y-1">
            <Label className="text-xs text-vinci-texte-secondaire">Fournisseur recommandé</Label>
            <select
              className={SELECT}
              value={bidComp.fournisseurRecommandeId ?? ''}
              onChange={(e) => majBidComp({ fournisseurRecommandeId: e.target.value || null })}
            >
              <option value="">— Non défini —</option>
              {fournisseurs.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nom}
                </option>
              ))}
            </select>
            {bidComp.fournisseurRecommandeId && analyse.scores.get(bidComp.fournisseurRecommandeId)?.nbNcMajeures ? (
              <p className="flex items-center gap-1 text-xs text-vinci-rouge">
                <TriangleAlert className="size-3.5" /> Ce fournisseur présente une non-conformité majeure.
              </p>
            ) : null}
          </div>
          <Textarea
            rows={5}
            placeholder="Argumentaire de la recommandation…"
            value={bidComp.synthese.recommandation}
            onChange={(e) => majBidComp({ synthese: { ...bidComp.synthese, recommandation: e.target.value } })}
          />
        </div>
      </section>

      {/* Classement récapitulatif */}
      {fournisseurs.length > 0 && (
        <section className="carte">
          <h2 className="mb-2 font-bold text-vinci-bleu">Sélection — récapitulatif</h2>
          <div className="overflow-x-auto">
            <table className="table-vinci">
              <thead>
                <tr>
                  <th className="w-20 text-center">Rang</th>
                  <th>Fournisseur</th>
                  <th className="text-right">Score pondéré</th>
                  <th className="text-right">Score normalisé</th>
                  <th className="text-right">Montant offre</th>
                  <th className="text-center">NC majeures</th>
                  <th>Décision suggérée</th>
                  <th>Décision</th>
                </tr>
              </thead>
              <tbody>
                {classementTrie.map((f) => {
                  const s = analyse.scores.get(f.id)
                  return (
                    <tr key={f.id} data-selected={f.id === bidComp.fournisseurRecommandeId}>
                      <td className="text-center font-bold">{s?.classement ?? '—'}</td>
                      <td className="font-medium">{f.nom}</td>
                      <td className="num">
                        {formatNombreFR(s?.total ?? 0, Number.isInteger(s?.total ?? 0) ? 0 : 1)} / {formatNombreFR(analyse.maximum, 0)}
                      </td>
                      <td className="num font-bold">{formatNombreFR(s?.pourcentage ?? 0, 1)} %</td>
                      <td className="num">{formatMontantDevise(f.montantOffre, entete.devise) || '—'}</td>
                      <td className={cn('text-center', s?.nbNcMajeures ? 'font-bold text-vinci-rouge' : '')}>{s?.nbNcMajeures ?? 0}</td>
                      <td>{s && <BadgeDecision decision={s.decisionSuggeree} />}</td>
                      <td>
                        <BadgeDecision decision={f.decision} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Dialogs (au même niveau, jamais imbriqués) */}
      <Dialog open={!!commentaire} onOpenChange={(o) => !o && setCommentaire(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Commentaire</DialogTitle>
            <DialogDescription>
              {commentaire &&
                `${etat.criteres.find((c) => c.id === commentaire.critereId)?.libelle ?? ''} — ${fournisseurs.find((f) => f.id === commentaire.fournisseurId)?.nom ?? ''}`}
            </DialogDescription>
          </DialogHeader>
          <Textarea rows={5} autoFocus value={commentaire?.texte ?? ''} onChange={(e) => commentaire && setCommentaire({ ...commentaire, texte: e.target.value })} />
          <DialogFooter>
            <Button variant="outline" className="btn-secondaire" onClick={() => setCommentaire(null)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (commentaire) majNotation(commentaire.critereId, commentaire.fournisseurId, { commentaire: commentaire.texte.trim() || null })
                setCommentaire(null)
              }}
            >
              Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!ajoutCritere} onOpenChange={(o) => !o && setAjoutCritere(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau critère</DialogTitle>
            <DialogDescription>Section : {ajoutCritere ? libelleSection(ajoutCritere.famille) : ''}</DialogDescription>
          </DialogHeader>
          {ajoutCritere && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label>Libellé</Label>
                <Input autoFocus value={ajoutCritere.libelle} onChange={(e) => setAjoutCritere({ ...ajoutCritere, libelle: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Type</Label>
                <select
                  className={SELECT}
                  value={ajoutCritere.type}
                  onChange={(e) => {
                    const type = e.target.value as TypeCritere
                    setAjoutCritere({ ...ajoutCritere, type, coefficient: type === 'note_1_3' ? ajoutCritere.coefficient || 1 : 0 })
                  }}
                >
                  {TYPES_CRITERE.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Coefficient</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  disabled={ajoutCritere.type !== 'note_1_3'}
                  value={ajoutCritere.coefficient}
                  onChange={(e) => setAjoutCritere({ ...ajoutCritere, coefficient: Math.max(0, Number(e.target.value) || 0) })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="btn-secondaire" onClick={() => setAjoutCritere(null)}>
              Annuler
            </Button>
            <Button onClick={validerAjoutCritere} disabled={occupe || !ajoutCritere?.libelle.trim()}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!fSupprimer} onOpenChange={(o) => !o && setFSupprimer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le fournisseur ?</DialogTitle>
            <DialogDescription>« {fSupprimer?.nom} » et toutes ses notations seront supprimés.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="btn-secondaire" onClick={() => setFSupprimer(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmerSuppressionFournisseur} disabled={occupe}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!cSupprimer} onOpenChange={(o) => !o && setCSupprimer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le critère ?</DialogTitle>
            <DialogDescription>« {cSupprimer?.libelle} » et ses notations pour tous les fournisseurs seront supprimés.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="btn-secondaire" onClick={() => setCSupprimer(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmerSuppressionCritere} disabled={occupe}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Champ({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-vinci-texte-secondaire">{label}</Label>
      {children}
    </div>
  )
}

function BlocSynthese({ titre, couleur, valeur, onChange }: { titre: string; couleur: string; valeur: string; onChange: (v: string) => void }) {
  return (
    <div className={cn('carte space-y-2 border-l-4', couleur)}>
      <h2 className="font-bold text-vinci-bleu">{titre}</h2>
      <Textarea rows={8} value={valeur} onChange={(e) => onChange(e.target.value)} placeholder={`${titre}…`} />
    </div>
  )
}

function IndicateurSauvegarde({ etat }: { etat: Sauvegarde }) {
  if (etat === 'idle') return null
  return (
    <span
      className={cn('flex shrink-0 items-center gap-1 text-xs', etat === 'erreur' ? 'text-vinci-rouge' : 'text-vinci-texte-secondaire')}
      aria-live="polite"
    >
      {etat === 'ok' && (
        <>
          <Check className="size-3.5 text-vinci-vert" /> Enregistré
        </>
      )}
      {(etat === 'attente' || etat === 'enregistrement') && (
        <>
          <Loader2 className="size-3.5 animate-spin" /> Enregistrement…
        </>
      )}
      {etat === 'erreur' && 'Erreur d’enregistrement'}
    </span>
  )
}
