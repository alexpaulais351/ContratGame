export type CompteDTO = {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  nbProjets: number
  createdAt: string
}

export type ProjetChoixDTO = { id: string; nom: string }
