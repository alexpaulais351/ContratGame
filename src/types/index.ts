export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string }

export type StatutSituation = 'brouillon' | 'validee'
export type StatutPrixNouveau = 'a_venir' | 'en_cours' | 'accepte' | 'refuse'
export type StatutCourrier = 'brouillon' | 'envoye'
export type DecisionFournisseur = 'go' | 'no_go' | 'en_attente'
