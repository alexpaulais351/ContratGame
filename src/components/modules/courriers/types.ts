export type CourrierDTO = {
  id: string
  projetId: string
  reference: string
  objet: string
  type: string
  dateEnvoi: string | null // ISO
  destinataire: string
  expediteur: string
  corps: string
  statut: 'brouillon' | 'envoye'
  lieu: string
  modeEnvoi: string
  copies: string
  signataireNom: string
  signataireFonction: string
  evenementId: string | null
}

export type ContexteProjetDTO = {
  projet: string
  moa: string
  moaAdresse: string
  numeroAffaire: string
  numeroCommande: string
  numeroOTP: string
  adresseChantier: string
}
