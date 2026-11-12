import type { ContactDiffusion } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { trierContacts, type ContactDiffusionDTO } from './contacts'

export function versContactDTO(c: ContactDiffusion): ContactDiffusionDTO {
  return {
    id: c.id, organisation: c.organisation, civilite: c.civilite, prenom: c.prenom, nom: c.nom, fonction: c.fonction,
    role: c.role, email: c.email, telephone: c.telephone, adresse: c.adresse,
    destinataireParDefaut: c.destinataireParDefaut, copieParDefaut: c.copieParDefaut, diffusionCR: c.diffusionCR,
    commentaire: c.commentaire, ordre: c.ordre,
  }
}

/** Contacts de la liste de diffusion d'un projet, triés par rôle (pour les courriers). */
export async function contactsDiffusionProjet(projetId: string): Promise<ContactDiffusionDTO[]> {
  const contacts = await prisma.contactDiffusion.findMany({ where: { projetId }, orderBy: [{ ordre: 'asc' }, { createdAt: 'asc' }] })
  return trierContacts(contacts.map(versContactDTO))
}
