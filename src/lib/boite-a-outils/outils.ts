/** Sous-onglets de la Boîte à outils (navigation N2 + cartes de la page d'index). */
export type OutilBoite = { slug: string; label: string; description: string }

export const OUTILS_BOITE: OutilBoite[] = [
  { slug: 'modeles-courriers', label: 'Modèles de courriers', description: 'Courriers types (réserves, mise en demeure, prolongation…) à utiliser dans un projet ou à exporter en Word.' },
  { slug: 'procedure-dgd', label: 'Procédure DGD', description: 'Schéma du décompte général définitif (CCAG Travaux 2021, 2009, CCCG SNCF), délais et calcul des dates limites.' },
  { slug: 'delais-cles', label: 'Délais clés', description: 'Les délais et règles du CCAG Travaux 2021 et du code de la commande publique, filtrables par thème.' },
  { slug: 'calculateurs', label: 'Calculateurs', description: 'Intérêts moratoires, révision de prix, pénalités, retenue de garantie, calcul de dates.' },
  { slug: 'assurances', label: 'Assurances', description: 'Frise des assurances et garanties d’un chantier (DO, RCD, TRC, GPA…) et que faire en cas de sinistre.' },
  { slug: 'lexique', label: 'Lexique', description: 'Les sigles du contractuel BTP : OS, DGD, PDF, OPR, DOE, CCAP…' },
]

export const BASE_BOITE = '/boite-a-outils'
