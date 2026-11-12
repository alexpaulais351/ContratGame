import Link from 'next/link'
import { formatMontant } from '@/lib/utils'
import { libelleMois } from '@/lib/mois'
import { BarreAvancement } from './BarreAvancement'
import type { SyntheseTDB } from './donnees'

export function TableauProjets({ synthese }: { synthese: SyntheseTDB }) {
  const { projets, totaux } = synthese
  return (
    <div className="overflow-x-auto rounded-md border border-vinci-gris-bordure">
      <table className="table-vinci">
        <thead>
          <tr>
            <th>Projet</th>
            <th className="text-right">Montant DE</th>
            <th className="text-right">Réalisé</th>
            <th>Avancement</th>
            <th className="text-right">PN acceptés</th>
            <th className="text-right">ST facturé / total</th>
            <th className="text-center">Courriers brouillon</th>
            <th>Dernière situation</th>
          </tr>
        </thead>
        <tbody>
          {projets.map((p) => (
            <tr key={p.id}>
              <td>
                <Link href={`/projets/${p.id}/infos`} className="font-bold text-vinci-bleu hover:underline">
                  {p.nom}
                </Link>
                {p.numeroAffaire && <div className="text-xs text-vinci-texte-secondaire">Affaire {p.numeroAffaire}</div>}
              </td>
              <td className="num">{formatMontant(p.montantDE)}</td>
              <td className="num">{formatMontant(p.realise)}</td>
              <td><BarreAvancement pct={p.pct} /></td>
              <td className="num">{formatMontant(p.pnAccepte)}</td>
              <td className="num">
                {formatMontant(p.stFacture)}
                <span className="text-vinci-texte-secondaire"> / {formatMontant(p.stTotal)}</span>
              </td>
              <td className="text-center">
                {p.courriersBrouillon > 0 ? (
                  <span className="inline-block min-w-6 rounded-sm bg-vinci-jaune-clair px-2 font-bold text-vinci-orange">{p.courriersBrouillon}</span>
                ) : (
                  <span className="text-vinci-gris">0</span>
                )}
              </td>
              <td className="whitespace-nowrap">
                {p.derniereSituation ? (
                  <>
                    <span className="font-medium">n° {p.derniereSituation.numero}</span>
                    <span className="text-vinci-texte-secondaire"> – {libelleMois(p.derniereSituation.mois, p.derniereSituation.annee)}</span>
                  </>
                ) : (
                  <span className="text-vinci-gris">Aucune</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>Total ({totaux.nbProjets} projet{totaux.nbProjets > 1 ? 's' : ''})</td>
            <td className="num">{formatMontant(totaux.montantDE)}</td>
            <td className="num">{formatMontant(totaux.realise)}</td>
            <td><BarreAvancement pct={totaux.pct} /></td>
            <td className="num">{formatMontant(totaux.pnAccepte)}</td>
            <td className="num">{formatMontant(totaux.stFacture)} / {formatMontant(totaux.stTotal)}</td>
            <td className="text-center">{totaux.courriersBrouillon}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
