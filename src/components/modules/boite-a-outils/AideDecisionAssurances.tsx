'use client'
import Link from 'next/link'
import { AlertTriangle, ArrowRight, ClipboardList, Compass, Download, FileText, FolderOpen, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useExportPDF } from '@/hooks/useExportPDF'
import { useProfilStore } from '@/stores/profil'
import {
  AVERTISSEMENT_AIDE, MOMENTS, PROBLEMES, ROLES, TYPES_OUVRAGE, type GarantieMobilisable, type Recommandation, type Situation,
} from '@/lib/assurances/aide-decision'
import { LIBELLE_NATURE } from '@/lib/boite-a-outils/assurances'

const SELECT = 'h-11 w-full rounded-md border border-vinci-gris-bordure bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-vinci-bleu'

export function libelleNatureGarantie(n: GarantieMobilisable['nature']): string {
  return n === 'responsabilite' ? 'Responsabilité (sans assurance dédiée)' : LIBELLE_NATURE[n]
}

function Badge({ nature }: { nature: GarantieMobilisable['nature'] }) {
  const cls =
    nature === 'obligatoire'
      ? 'bg-vinci-rouge text-white'
      : nature === 'facultative'
        ? 'border border-vinci-gris-bordure bg-vinci-gris-clair text-black'
        : nature === 'garantie_legale'
          ? 'border border-vinci-vert bg-vinci-vert-clair text-black'
          : 'border border-vinci-orange bg-vinci-orange-clair text-black'
  return <span className={cn('inline-block rounded-sm px-1.5 py-0.5 text-[11px] font-bold uppercase', cls)}>{libelleNatureGarantie(nature)}</span>
}

type Props = { situation: Situation; onChange: (s: Situation) => void; reco: Recommandation }

export function AideDecisionAssurances({ situation: s, onChange, reco: r }: Props) {
  const profil = useProfilStore((st) => st.profil)
  const { exportAvecGuard, isExporting } = useExportPDF()
  const maj = <K extends keyof Situation>(k: K, v: Situation[K]) => onChange({ ...s, [k]: v })
  const groupes = [...new Set(PROBLEMES.map((p) => p.groupe))]

  const exporter = () =>
    exportAvecGuard(async () => {
      const [{ FicheAideDecisionPDF }, { genererEtTelechargerPDF }, { nomFichierSur }] = await Promise.all([
        import('@/lib/pdf/aide-decision-assurances'), import('@/lib/pdf/telecharger'), import('@/lib/pdf/format'),
      ])
      await genererEtTelechargerPDF(<FicheAideDecisionPDF situation={s} reco={r} profil={profil} />, `Fiche_assurance_${nomFichierSur(r.titre)}`)
    })

  return (
    <section className="carte space-y-5" aria-labelledby="aide-decision">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="aide-decision" className="flex items-center gap-2 text-lg font-bold text-vinci-bleu">
            <Compass className="h-5 w-5" aria-hidden /> Aide à la décision : quelle garantie mobiliser ?
          </h3>
          <p className="text-sm text-vinci-texte-secondaire">Décrivez la situation en 3 étapes ; la fiche se met à jour instantanément.</p>
        </div>
        <Button onClick={exporter} disabled={isExporting}>
          <Download className="mr-1 h-4 w-4" /> {isExporting ? 'Export…' : 'Exporter la fiche en PDF'}
        </Button>
      </div>

      <ol className="grid gap-4 lg:grid-cols-3">
        <li className="space-y-2 rounded-md border border-vinci-gris-bordure p-3">
          <p className="text-xs font-bold uppercase text-vinci-rouge">Étape 1 · Problématique</p>
          <Label htmlFor="ad-probleme" className="sr-only">Problématique rencontrée</Label>
          <select id="ad-probleme" className={SELECT} value={s.probleme} onChange={(e) => maj('probleme', e.target.value as Situation['probleme'])}>
            {groupes.map((g) => (
              <optgroup key={g} label={g}>
                {PROBLEMES.filter((p) => p.groupe === g).map((p) => (
                  <option key={p.cle} value={p.cle}>{p.libelle}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </li>
        <li className="space-y-2 rounded-md border border-vinci-gris-bordure p-3">
          <p className="text-xs font-bold uppercase text-vinci-rouge">Étape 2 · Moment</p>
          <Label htmlFor="ad-moment" className="sr-only">Moment d’apparition</Label>
          <select id="ad-moment" className={SELECT} value={s.moment} onChange={(e) => maj('moment', e.target.value as Situation['moment'])}>
            {MOMENTS.map((m) => (
              <option key={m.cle} value={m.cle}>{m.libelle}</option>
            ))}
          </select>
        </li>
        <li className="space-y-2 rounded-md border border-vinci-gris-bordure p-3">
          <p className="text-xs font-bold uppercase text-vinci-rouge">Étape 3 · Contexte (facultatif)</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div>
              <Label htmlFor="ad-role" className="text-xs">Vous êtes</Label>
              <select id="ad-role" className={SELECT} value={s.role} onChange={(e) => maj('role', e.target.value as Situation['role'])}>
                {ROLES.map((x) => <option key={x.cle} value={x.cle}>{x.libelle}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="ad-ouvrage" className="text-xs">Type d’ouvrage</Label>
              <select id="ad-ouvrage" className={SELECT} value={s.ouvrage} onChange={(e) => maj('ouvrage', e.target.value as Situation['ouvrage'])}>
                {TYPES_OUVRAGE.map((x) => <option key={x.cle} value={x.cle}>{x.libelle}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="ad-do" className="text-xs">DO souscrite ?</Label>
              <select id="ad-do" className={SELECT} value={s.doSouscrite} onChange={(e) => maj('doSouscrite', e.target.value as Situation['doSouscrite'])}>
                <option value="inconnu">Je ne sais pas</option><option value="oui">Oui</option><option value="non">Non</option>
              </select>
            </div>
            <div>
              <Label htmlFor="ad-trc" className="text-xs">TRC souscrite ?</Label>
              <select id="ad-trc" className={SELECT} value={s.trcSouscrite} onChange={(e) => maj('trcSouscrite', e.target.value as Situation['trcSouscrite'])}>
                <option value="inconnu">Je ne sais pas</option><option value="oui">Oui</option><option value="non">Non</option>
              </select>
            </div>
          </div>
        </li>
      </ol>

      <article className="space-y-4 rounded-md border-2 border-vinci-bleu p-4" aria-live="polite">
        <h4 className="text-lg font-bold text-vinci-bleu-fonce">Recommandation — {r.titre}</h4>

        {r.alertes.map((a) => (
          <p key={a} className="flex items-start gap-2 rounded-md border border-vinci-jaune border-l-4 bg-vinci-jaune-clair px-3 py-2 text-sm font-semibold">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-vinci-orange" aria-hidden /> {a}
          </p>
        ))}

        <div>
          <p className="mb-2 text-sm font-bold">Garanties / assurances mobilisables</p>
          <ul className="space-y-2">
            {r.garanties.map((g, i) => (
              <li
                key={g.cle}
                className={cn('rounded-md border p-2.5', g.principale ? 'border-vinci-bleu bg-vinci-bleu-tres-clair' : 'border-vinci-gris-bordure bg-white')}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-vinci-bleu text-xs font-bold text-white">{i + 1}</span>
                  <span className="font-bold text-vinci-bleu-fonce">{g.libelle}</span>
                  <Badge nature={g.nature} />
                  {g.principale && <span className="text-[11px] font-bold uppercase text-vinci-rouge">en priorité</span>}
                </div>
                <p className="mt-1 pl-8 text-[13px]">{g.commentaire}</p>
              </li>
            ))}
          </ul>
        </div>

        {r.pourquoi.length > 0 && (
          <div>
            <p className="mb-1 text-sm font-bold">Pourquoi ?</p>
            <ul className="list-disc space-y-1 pl-5 text-[13px]">{r.pourquoi.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        )}

        {r.quiContreQui.length > 0 && (
          <div>
            <p className="mb-1 flex items-center gap-1 text-sm font-bold"><Users className="h-4 w-4" aria-hidden /> Qui agit, contre qui ?</p>
            <ul className="space-y-1 text-[13px]">
              {r.quiContreQui.map((q) => (
                <li key={q.qui + q.contre} className="flex flex-wrap items-center gap-1">
                  <strong>{q.qui}</strong> <ArrowRight className="h-3.5 w-3.5 text-vinci-rouge" aria-label="contre" /> <strong>{q.contre}</strong>
                  <span className="text-vinci-texte-secondaire">— {q.comment}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <p className="mb-1 flex items-center gap-1 text-sm font-bold"><ClipboardList className="h-4 w-4" aria-hidden /> Étapes à suivre</p>
          <ol className="list-decimal space-y-1.5 pl-5 text-[13px]">
            {r.etapes.map((e) => (
              <li key={e.texte}>
                {e.texte}
                {e.delai && <span className="ml-1 rounded-sm bg-vinci-jaune-clair px-1 font-semibold">Délai : {e.delai}</span>}
                {e.source && <span className="ml-1 text-xs text-vinci-texte-secondaire">({e.source})</span>}
                {e.aVerifier && <span className="ml-1 text-xs font-semibold text-vinci-orange">à vérifier</span>}
              </li>
            ))}
          </ol>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-1 flex items-center gap-1 text-sm font-bold"><FolderOpen className="h-4 w-4" aria-hidden /> Documents à réunir</p>
            <ul className="list-disc space-y-0.5 pl-5 text-[13px]">{r.documents.map((d) => <li key={d}>{d}</li>)}</ul>
          </div>
          {r.pieges.length > 0 && (
            <div>
              <p className="mb-1 flex items-center gap-1 text-sm font-bold text-vinci-rouge"><AlertTriangle className="h-4 w-4" aria-hidden /> Pièges fréquents</p>
              <ul className="list-disc space-y-0.5 pl-5 text-[13px]">{r.pieges.map((d) => <li key={d}>{d}</li>)}</ul>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-vinci-gris-bordure pt-3">
          {r.courriers.map((c) => (
            <Button key={c.type} asChild variant="outline" className="btn-secondaire">
              <Link href={`/boite-a-outils/modeles-courriers?modele=${c.type}`}>
                <FileText className="mr-1 h-4 w-4" aria-hidden /> Préparer le courrier : {c.libelle}
              </Link>
            </Button>
          ))}
          {r.courriers.length === 0 && <span className="text-xs text-vinci-texte-secondaire">Pas de modèle de courrier dédié pour ce cas.</span>}
        </div>

        <p className="text-xs italic text-vinci-texte-secondaire">{AVERTISSEMENT_AIDE}</p>
      </article>
    </section>
  )
}
