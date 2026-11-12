/**
 * Sources et versions de référence de la Boîte à outils.
 * Mettre à jour DATE_MAJ et les versions à chaque révision du contenu.
 */

/** Date de dernière mise à jour du contenu juridique de la Boîte à outils (ISO). */
export const DATE_MAJ = '2026-11-12'

/** Mention de version affichée en tête de chaque outil. */
export const MENTION_VERSION_CCAG =
  'CCAG Travaux 2021, version consolidée au 12/11/2026 (dernière modification identifiée : arrêté du 29 décembre 2022)'

export type Source = { texte: string; version: string; url?: string; aVerifier?: boolean }

export const VERSION_CCAG_2021 =
  'CCAG Travaux 2021 — arrêté du 30 mars 2021 (JORF du 1er avril 2021), modifié par les arrêtés du 30 septembre 2021 et du 29 décembre 2022'

export const SRC = {
  ccag2021: {
    texte: 'CCAG Travaux 2021 (arrêté du 30 mars 2021, NOR ECOM2106871A)',
    version:
      'Version consolidée intégrant l’arrêté du 30/09/2021 (art. 3.8.1, 12.4.3, 12.4.4…) et l’arrêté du 29/12/2022 (art. 18.1.1, 50.2.1) — aucune modification postérieure identifiée au 12/11/2026, à confirmer sur Légifrance',
    url: 'https://www.legifrance.gouv.fr/jorf/id/JORFSCTA000043310430',
  },
  ccag2021Daj: {
    texte: 'DAJ — CCAG et commentaires (economie.gouv.fr)',
    version: 'Page consultée le 12/11/2026',
    url: 'https://www.economie.gouv.fr/daj',
  },
  ccag2009: {
    texte: 'CCAG Travaux 2009 (arrêté du 8 septembre 2009)',
    version: 'Version modifiée par l’arrêté du 3 mars 2014 (consultations engagées à compter du 01/04/2014) ; abrogé par l’arrêté du 30 mars 2021 mais toujours applicable aux marchés qui s’y réfèrent',
  },
  cccg: {
    texte: 'CCCG Travaux SNCF — « Procédure de DGD (CCCG Travaux) »',
    version: 'Édition à vérifier dans le marché (non identifiable sur le document fourni)',
    aVerifier: true,
  },
  ccp: {
    texte: 'Code de la commande publique (paiement, avance, garanties)',
    version: 'Version en vigueur — art. R2191-3, R2191-7, R2191-32 à R2191-35 (décret n° 2024-1251 du 30/12/2024), R2192-10, R2192-11, R2192-31 à R2192-36, D2192-35',
    url: 'https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000037701019',
  },
  bce: {
    texte: 'Taux directeurs de la BCE (opérations principales de refinancement) — Banque de France',
    version: 'Exemple : 2,40 % au 1er juillet 2026 (taux moratoire 2e semestre 2026 : 10,40 %) ; 2,65 % depuis le 16/09/2026 — à vérifier pour le semestre concerné',
    url: 'https://www.banque-france.fr/fr/les-taux-monetaires-directeurs',
    aVerifier: true,
  },
  codeCivil: {
    texte: 'Code civil — art. 1792 à 1792-6 (responsabilité des constructeurs)',
    version: 'Version en vigueur',
    url: 'https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006070721',
  },
  codeAssurances: {
    texte: 'Code des assurances — art. L241-1 à L243-9 (assurance construction obligatoire), L211-1',
    version: 'Version en vigueur',
    url: 'https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006073984',
  },
  spinetta: {
    texte: 'Loi n° 78-12 du 4 janvier 1978 relative à la responsabilité et à l’assurance dans le domaine de la construction (« loi Spinetta »)',
    version: 'Version en vigueur',
    url: 'https://www.legifrance.gouv.fr',
  },
  ffbCcrd: {
    texte: 'FFB — « Chantier supérieur à 15 millions d’euros : ayez le réflexe assurance »',
    version: 'Page consultée le 12/11/2026',
    url: 'https://www.ffbatiment.fr/gestion-entreprise/comptabilite-banque-assurances/mes-assurances-professionnelles/dossier-ba/ayez-le-reflexe-assurance-avant-de-remettre-votre-prix',
  },
  autresCodes: {
    texte: 'Aide à la décision : C. civ. art. 1253 (troubles anormaux du voisinage, loi n° 2024-346 du 15/04/2024), 2224, 2226, 2241 ; C. assur. art. L113-2, L114-1, L124-3 ; CSS art. R441-3 ; C. com. art. R622-24',
    version: 'Versions en vigueur — certains délais signalés « à vérifier » dans la fiche',
    url: 'https://www.legifrance.gouv.fr',
    aVerifier: true,
  },
  sousTraitance: {
    texte: 'Loi n° 75-1334 du 31 décembre 1975 relative à la sous-traitance',
    version: 'Version en vigueur',
    url: 'https://www.legifrance.gouv.fr',
  },
} satisfies Record<string, Source>

export const SOURCES_PAR_OUTIL: Record<string, Source[]> = {
  'modeles-courriers': [SRC.ccag2021, SRC.ccp],
  'procedure-dgd': [SRC.ccag2021, SRC.ccag2009, SRC.cccg, SRC.ccag2021Daj],
  'delais-cles': [SRC.ccag2021, SRC.ccp, SRC.bce, SRC.codeCivil],
  calculateurs: [SRC.ccag2021, SRC.ccp, SRC.bce],
  assurances: [SRC.codeAssurances, SRC.codeCivil, SRC.spinetta, SRC.ccag2021, SRC.ffbCcrd, SRC.sousTraitance, SRC.autresCodes],
  lexique: [SRC.ccag2021, SRC.ccp],
}
