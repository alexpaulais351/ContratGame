import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Activity, Eye, FolderPlus, LogIn, ShieldAlert, UserCheck, UserPlus, Users } from 'lucide-react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { VINCI, VINCI_SECONDAIRE } from '@/lib/design-tokens'
import { dateDuJour, dateHeureParis, PERIODES, periodeDepuis } from '@/lib/activite'
import { cn, formatDateFR } from '@/lib/utils'
import { chargerAnalyse, STATUTS } from '@/components/modules/analyse/donnees'
import { GraphiqueActivite } from '@/components/modules/analyse/GraphiqueActivite'
import { BadgeStatut, BarreProportion, BarresHorizontales, Kpi, MiniBarres, n0, Section, STATUT_LIBELLE } from '@/components/modules/analyse/Elements'

export const metadata = { title: 'Analyse — Contrat Game' }
export const dynamic = 'force-dynamic'

export default async function AnalysePage({ searchParams }: { searchParams: { periode?: string } }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const moi = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true, statut: true } })

  if (moi?.role !== 'admin' || moi.statut !== 'approuve') {
    return (
      <main className="p-6">
        <h1 className="page-titre">Analyse</h1>
        <div className="carte mt-6 flex max-w-xl items-center gap-3 border-l-4 border-l-vinci-rouge bg-vinci-rouge-tres-clair">
          <ShieldAlert className="h-6 w-6 shrink-0 text-vinci-rouge" />
          <p className="font-medium">Accès réservé aux administrateurs.</p>
        </div>
      </main>
    )
  }

  const periode = periodeDepuis(searchParams.periode)
  const a = await chargerAnalyse(periode)
  const { kpi } = a
  const libPeriode = `du ${formatDateFR(dateDuJour(a.debut))} au ${formatDateFR(dateDuJour(a.fin))}`
  const maxPage = Math.max(1, ...a.pages.map((p) => p.vues))
  const maxProjet = Math.max(1, ...a.projetsActifs.map((p) => p.vues))
  const maxProprio = Math.max(1, ...a.projetsParProprietaire.map((p) => p.projets))
  const totalInscriptions = a.inscriptions.reduce((s, m) => s + m.nombre, 0)

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-titre">Analyse</h1>
          <p className="text-sm text-vinci-texte-secondaire">Fréquentation de l&apos;outil, comptes et projets — {libPeriode}.</p>
        </div>
        <nav aria-label="Période" className="flex flex-wrap gap-1 rounded-md border border-vinci-gris-bordure bg-vinci-gris-clair p-1">
          {PERIODES.map((p) => {
            const actif = p.cle === periode.cle
            return (
              <Link
                key={p.cle}
                href={`/analyse?periode=${p.cle}`}
                aria-current={actif ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-10 items-center rounded px-3 text-sm',
                  actif ? 'bg-vinci-bleu font-semibold text-white' : 'text-vinci-bleu hover:bg-vinci-bleu-tres-clair',
                )}
              >
                {p.libelle}
              </Link>
            )
          })}
        </nav>
      </div>

      <section aria-label="Indicateurs clés" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Kpi icon={Users} titre="Visiteurs uniques" valeur={n0(kpi.visiteurs)} detail={`comptes ayant consulté au moins une page`} />
        <Kpi icon={Eye} titre="Pages vues" valeur={n0(kpi.vues)} detail={kpi.visiteurs ? `${n0(Math.round(kpi.vues / kpi.visiteurs))} par visiteur en moyenne` : undefined} />
        <Kpi icon={LogIn} titre="Connexions" valeur={n0(kpi.connexions)} detail="identifiants validés sur la période" />
        <Kpi icon={UserCheck} titre="Comptes actifs" valeur={`${n0(kpi.comptesActifs)} / ${n0(kpi.comptesTotal)}`} detail="comptes validés / total" />
        <Link href="/comptes" className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vinci-bleu">
          <Kpi
            icon={UserPlus}
            titre="Demandes en attente"
            valeur={n0(kpi.demandes)}
            detail={kpi.demandes ? 'à valider dans Comptes →' : 'aucune demande à traiter'}
          />
        </Link>
        <Kpi icon={FolderPlus} titre="Projets créés" valeur={n0(kpi.projetsCrees)} detail={`sur ${n0(kpi.projetsTotal)} projets au total`} />
      </section>

      <Section
        titre={a.granularite === 'jour' ? 'Activité par jour' : 'Activité par semaine'}
        sousTitre="Survolez une colonne pour le détail (pages vues, visiteurs, connexions)."
      >
        {kpi.vues === 0 ? (
          <p className="text-sm text-vinci-texte-secondaire">Aucune page vue sur la période.</p>
        ) : (
          <GraphiqueActivite serie={a.serie} granularite={a.granularite} />
        )}
      </Section>

      <div className="grid gap-5 xl:grid-cols-[3fr_2fr]">
        <Section titre="Pages les plus consultées" sousTitre="Les pages d'un même module sont regroupées tous projets confondus.">
          {a.pages.length === 0 ? (
            <p className="text-sm text-vinci-texte-secondaire">Aucune page vue sur la période.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-vinci min-w-[460px]">
                <thead>
                  <tr>
                    <th>Page</th>
                    <th className="text-right">Vues</th>
                    <th className="text-right">Visiteurs</th>
                    <th className="w-[30%]">Part</th>
                  </tr>
                </thead>
                <tbody>
                  {a.pages.map((p) => (
                    <tr key={p.chemin}>
                      <td>
                        <div className="font-semibold">{p.libelle}</div>
                        <div className="text-[11px] text-vinci-texte-secondaire">
                          {p.rubrique} · <code>{p.chemin}</code>
                        </div>
                      </td>
                      <td className="num text-right">{n0(p.vues)}</td>
                      <td className="num text-right">{n0(p.visiteurs)}</td>
                      <td>
                        <BarreProportion valeur={p.vues} max={maxPage} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <Section titre="Comptes" sousTitre={`${n0(kpi.comptesTotal)} compte${kpi.comptesTotal > 1 ? 's' : ''} au total`}>
          <h3 className="text-sm font-semibold">Par statut</h3>
          <BarresHorizontales
            barres={STATUTS.map((s) => ({ libelle: STATUT_LIBELLE[s].label, valeur: a.parStatut[s], couleur: STATUT_LIBELLE[s].couleur }))}
          />
          <h3 className="mt-2 text-sm font-semibold">Par rôle</h3>
          <BarresHorizontales
            barres={[
              { libelle: 'Administrateur', valeur: a.parRole.admin, couleur: VINCI.bleuFonce },
              { libelle: 'Utilisateur', valeur: a.parRole.user, couleur: VINCI_SECONDAIRE.bleuMoyen.base },
            ]}
          />
          <h3 className="mt-2 text-sm font-semibold">
            Inscriptions par mois <span className="font-normal text-vinci-texte-secondaire">(12 derniers mois · {n0(totalInscriptions)})</span>
          </h3>
          <MiniBarres donnees={a.inscriptions.map((m) => ({ cle: m.mois, libelle: m.libelle, valeur: m.nombre }))} />
        </Section>
      </div>

      <Section titre="Utilisateurs" sousTitre="Triés par dernière activité (visite ou connexion). Pages vues et connexions : sur la période.">
        <div className="overflow-x-auto">
          <table className="table-vinci min-w-[980px]">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Entreprise</th>
                <th>Statut</th>
                <th>Rôle</th>
                <th>Créé le</th>
                <th>Dernière connexion</th>
                <th>Dernière visite</th>
                <th className="text-right">Connexions</th>
                <th className="text-right">Pages vues</th>
                <th className="text-right">Projets</th>
              </tr>
            </thead>
            <tbody>
              {a.comptes.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="font-semibold">{c.nom}</div>
                    <div className="text-[11px] text-vinci-texte-secondaire">{c.email}</div>
                  </td>
                  <td>{c.entreprise || <span className="text-vinci-texte-secondaire">—</span>}</td>
                  <td>
                    <BadgeStatut statut={c.statut} />
                  </td>
                  <td>{c.estAdmin ? <span className="font-semibold text-vinci-bleu">Admin</span> : 'Utilisateur'}</td>
                  <td className="whitespace-nowrap">{formatDateFR(c.creeLe)}</td>
                  <td className="whitespace-nowrap">{dateHeureParis(c.derniereConnexion) || <span className="text-vinci-texte-secondaire">jamais</span>}</td>
                  <td className="whitespace-nowrap">{dateHeureParis(c.derniereVisite) || <span className="text-vinci-texte-secondaire">jamais</span>}</td>
                  <td className="num text-right">{n0(c.connexions)}</td>
                  <td className="num text-right">{n0(c.vues)}</td>
                  <td className="num text-right">{n0(c.projets)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section titre="Projets les plus actifs" sousTitre="Pages vues dans les modules du projet sur la période.">
          {a.projetsActifs.length === 0 ? (
            <p className="text-sm text-vinci-texte-secondaire">Aucune consultation de projet sur la période.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-vinci min-w-[420px]">
                <thead>
                  <tr>
                    <th>Projet</th>
                    <th className="text-right">Vues</th>
                    <th className="text-right">Visiteurs</th>
                    <th>Dernière visite</th>
                    <th className="w-[22%]">Part</th>
                  </tr>
                </thead>
                <tbody>
                  {a.projetsActifs.map((p) => (
                    <tr key={p.id}>
                      <td className="font-semibold">{p.nom ?? <span className="font-normal italic text-vinci-texte-secondaire">Projet supprimé</span>}</td>
                      <td className="num text-right">{n0(p.vues)}</td>
                      <td className="num text-right">{n0(p.visiteurs)}</td>
                      <td className="whitespace-nowrap">{dateHeureParis(p.derniere)}</td>
                      <td>
                        <BarreProportion valeur={p.vues} max={maxProjet} couleur={VINCI_SECONDAIRE.bleuMoyen.base} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <Section titre="Projets par propriétaire" sousTitre={`${n0(kpi.projetsTotal)} projet${kpi.projetsTotal > 1 ? 's' : ''} au total`}>
          {a.projetsParProprietaire.length === 0 ? (
            <p className="text-sm text-vinci-texte-secondaire">Aucun projet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {a.projetsParProprietaire.map((p) => (
                <li key={p.id} className="grid grid-cols-[minmax(8rem,12rem)_1fr_3rem] items-center gap-2 text-sm">
                  <span className="truncate">{p.nom}</span>
                  <BarreProportion valeur={p.projets} max={maxProprio} />
                  <span className="num text-right font-semibold">{n0(p.projets)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <p className="flex items-center gap-2 text-xs text-vinci-texte-secondaire">
        <Activity className="h-3.5 w-3.5" aria-hidden />
        Pages vues agrégées par compte, jour (heure de Paris) et page ; données visibles uniquement par les administrateurs.
      </p>
    </main>
  )
}
