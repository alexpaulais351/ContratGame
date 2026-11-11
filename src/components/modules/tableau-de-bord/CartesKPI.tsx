import { Briefcase, FileSpreadsheet, TrendingUp, Lightbulb, Users } from 'lucide-react'
import { formatMontant, formatNombreFR } from '@/lib/utils'
import type { SyntheseTDB } from './donnees'

function Ligne({ label, valeur, fort }: { label: string; valeur: string; fort?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-vinci-texte-secondaire">{label}</span>
      <span className={fort ? 'num font-bold text-vinci-bleu' : 'num font-medium'}>{valeur}</span>
    </div>
  )
}

function Carte({ titre, icone, accent, children }: { titre: string; icone: React.ReactNode; accent: string; children: React.ReactNode }) {
  return (
    <div className={`carte border-l-4 ${accent}`}>
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-vinci-texte-secondaire">
        {icone}
        {titre}
      </div>
      {children}
    </div>
  )
}

export function CartesKPI({ totaux }: { totaux: SyntheseTDB['totaux'] }) {
  const pctST = totaux.stTotal > 0 ? (totaux.stFacture / totaux.stTotal) * 100 : 0
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <Carte titre="Projets" icone={<Briefcase className="h-4 w-4 text-vinci-bleu" />} accent="border-l-vinci-bleu">
        <div className="tabular-nums text-3xl font-bold text-vinci-bleu">{totaux.nbProjets}</div>
        <div className="mt-1 text-xs text-vinci-texte-secondaire">
          {totaux.courriersBrouillon} courrier{totaux.courriersBrouillon > 1 ? 's' : ''} en brouillon
        </div>
      </Carte>
      <Carte titre="Détail estimatif" icone={<FileSpreadsheet className="h-4 w-4 text-vinci-bleu" />} accent="border-l-vinci-bleu">
        <div className="tabular-nums text-2xl font-bold text-vinci-bleu">{formatMontant(totaux.montantDE)}</div>
        <div className="mt-1 text-xs text-vinci-texte-secondaire">Montant total des DE</div>
      </Carte>
      <Carte titre="Réalisé (situations)" icone={<TrendingUp className="h-4 w-4 text-vinci-vert" />} accent="border-l-vinci-vert">
        <div className="tabular-nums text-2xl font-bold text-vinci-bleu">{formatMontant(totaux.realise)}</div>
        <div className="mt-2 h-2 overflow-hidden rounded-sm bg-vinci-gris-bordure">
          <div className="h-full bg-vinci-vert" style={{ width: `${Math.min(100, totaux.pct)}%` }} />
        </div>
        <div className="mt-1 text-xs text-vinci-texte-secondaire">Avancement global : {formatNombreFR(totaux.pct, 1)} %</div>
      </Carte>
      <Carte titre="Prix nouveaux" icone={<Lightbulb className="h-4 w-4 text-vinci-jaune" />} accent="border-l-vinci-jaune">
        <div className="space-y-1">
          <Ligne label="Présenté" valeur={formatMontant(totaux.pnPresente)} />
          <Ligne label="Pondéré" valeur={formatMontant(totaux.pnPondere)} />
          <Ligne label="Accepté" valeur={formatMontant(totaux.pnAccepte)} fort />
        </div>
      </Carte>
      <Carte titre="Sous-traitance" icone={<Users className="h-4 w-4 text-vinci-orange" />} accent="border-l-vinci-orange">
        <div className="space-y-1">
          <Ligne label="Marchés + avenants" valeur={formatMontant(totaux.stTotal)} />
          <Ligne label={`Facturé (${formatNombreFR(pctST, 1)} %)`} valeur={formatMontant(totaux.stFacture)} fort />
          <Ligne label="Reste à facturer" valeur={formatMontant(totaux.stReste)} />
        </div>
      </Carte>
    </div>
  )
}
