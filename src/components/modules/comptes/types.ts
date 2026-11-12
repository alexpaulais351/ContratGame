export type CompteDTO = {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  statut: 'en_attente' | 'approuve' | 'refuse' | 'suspendu'
  entreprise: string | null
  nbProjets: number
  createdAt: string
}

export type ProjetChoixDTO = { id: string; nom: string }
