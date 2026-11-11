// Configuration partagée de la navigation projet (2 onglets).
// Tout nouveau module DOIT être déclaré ici.
export type ModuleProjet = {
  key: string
  label: string
  /** chemin relatif à /projets/[id]/ */
  href: string
  /** false = non masquable (Infos) */
  toggleable: boolean
}

export type OngletProjet = {
  key: 'contractuel' | 'financier'
  label: string
  modules: ModuleProjet[]
}

export const ONGLETS_PROJET: OngletProjet[] = [
  {
    key: 'contractuel',
    label: 'Gestion Contractuelle',
    modules: [
      { key: 'infos', label: 'Infos', href: 'infos', toggleable: false },
      { key: 'courriers', label: 'Courriers', href: 'courriers', toggleable: true },
      { key: 'sous-traitants', label: 'Sous-traitants', href: 'sous-traitants', toggleable: true },
      { key: 'journal', label: 'Journal', href: 'suivi/journal', toggleable: true },
    ],
  },
  {
    key: 'financier',
    label: 'Gestion Financière',
    modules: [
      { key: 'detail-estimatif', label: 'Détail Estimatif', href: 'detail-estimatif', toggleable: true },
      { key: 'situations', label: 'Situations', href: 'suivi/situations', toggleable: true },
      { key: 'prix-nouveaux', label: 'Prix Nouveaux', href: 'suivi/prix-nouveaux', toggleable: true },
      { key: 'suivi-st', label: 'Suivi ST', href: 'suivi/sous-traitants', toggleable: true },
      { key: 'matrice', label: 'Matrice', href: 'matrice', toggleable: true },
    ],
  },
]

export const TOUS_MODULES: ModuleProjet[] = ONGLETS_PROJET.flatMap((o) => o.modules)

export function modulesVisibles(modulesMasques: unknown): ModuleProjet[] {
  const masques = Array.isArray(modulesMasques) ? (modulesMasques as string[]) : []
  return TOUS_MODULES.filter((m) => !m.toggleable || !masques.includes(m.key))
}

/** Retrouve le module actif à partir du chemin (après /projets/[id]/) */
export function moduleDepuisChemin(sousChemin: string): { onglet: OngletProjet; module: ModuleProjet } | null {
  // le plus long préfixe gagne (suivi/sous-traitants vs sous-traitants)
  let meilleur: { onglet: OngletProjet; module: ModuleProjet } | null = null
  for (const onglet of ONGLETS_PROJET) {
    for (const mod of onglet.modules) {
      if (sousChemin === mod.href || sousChemin.startsWith(mod.href + '/')) {
        if (!meilleur || mod.href.length > meilleur.module.href.length) meilleur = { onglet, module: mod }
      }
    }
  }
  return meilleur
}
