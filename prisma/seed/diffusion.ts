import type { PrismaClient } from '@prisma/client'
import { cleContact } from '../../src/components/modules/diffusion/contacts'

type ContactDef = {
  organisation: string
  role: string
  civilite?: string
  prenom?: string
  nom?: string
  fonction?: string
  email?: string
  telephone?: string
  adresse?: string
  destinataireParDefaut?: boolean
  copieParDefaut?: boolean
  diffusionCR?: boolean
  commentaire?: string
}

/** Liste de diffusion du projet d'exemple « Groupe scolaire Les Tilleuls » (sous-traitants = prisma/seed/sous-traitants.ts). */
export const CONTACTS_DIFFUSION: ContactDef[] = [
  {
    organisation: 'Ville de Saint-Exemple', role: 'moa', civilite: 'Madame', prenom: 'Claire', nom: 'Moreau',
    fonction: 'Directrice des services techniques', email: 'c.moreau@saint-exemple.example', telephone: '04 90 12 34 56',
    adresse: 'Direction des services techniques\n1 place de la Mairie\n99000 Saint-Exemple', destinataireParDefaut: true,
    commentaire: 'Représentant du pouvoir adjudicateur pour les ordres de service et les décomptes.',
  },
  {
    organisation: 'Cabinet d’architecture Exemple', role: 'moe', civilite: 'Monsieur', prenom: 'Laurent', nom: 'Girard',
    fonction: 'Architecte, chef de projet', email: 'l.girard@archi-exemple.example', telephone: '04 90 22 18 40',
    adresse: '8 rue des Architectes\n99000 Saint-Exemple', copieParDefaut: true,
  },
  {
    organisation: 'Coordination Planning Sud', role: 'opc', civilite: 'Madame', prenom: 'Nadia', nom: 'Ferhat',
    fonction: 'Pilote OPC', email: 'n.ferhat@opc-sud.example', telephone: '06 12 45 78 90',
    adresse: '27 boulevard du Pilotage\n99100 Exemple-Ville',
  },
  {
    organisation: 'Prévention Sécurité Chantiers', role: 'csps', civilite: 'Monsieur', prenom: 'Thomas', nom: 'Rey',
    fonction: 'Coordonnateur SPS niveau 2', email: 't.rey@psc-sps.example', telephone: '06 33 21 09 87',
    adresse: '5 allée de la Sécurité\n99100 Exemple-Ville',
  },
  {
    organisation: 'Bureau de Contrôle Exemple', role: 'controle', civilite: 'Monsieur', prenom: 'Éric', nom: 'Vasseur',
    fonction: 'Contrôleur technique (missions L, S, PS, HAND)', email: 'e.vasseur@controle-exemple.example', telephone: '04 90 55 66 77',
    adresse: '14 rue des Normes\n99000 Saint-Exemple',
  },
  {
    organisation: 'BET Structure Exemple', role: 'bet', civilite: 'Madame', prenom: 'Hélène', nom: 'Costa',
    fonction: 'Ingénieure structure', email: 'h.costa@bet-structure.example', telephone: '04 90 31 42 53',
    adresse: '3 impasse des Calculs\n99000 Saint-Exemple',
  },
  // Sous-traitants (cf. prisma/seed/sous-traitants.ts)
  { organisation: 'Électricité Martin & Fils', role: 'sous_traitant', civilite: 'Monsieur', prenom: 'Marc', nom: 'Martin', fonction: 'Gérant', email: 'm.martin@electricite-martin.example', telephone: '04 91 00 11 22' },
  { organisation: 'Terrassements du Centre', role: 'sous_traitant', civilite: 'Madame', prenom: 'Julie', nom: 'Arnaud', fonction: 'Chargée d’affaires', email: 'contact@terrassements-centre.example', telephone: '04 42 33 44 55', diffusionCR: false, commentaire: 'Intervention terminée en avril.' },
  { organisation: 'Plomberie Chauffage Durand', role: 'sous_traitant', civilite: 'Monsieur', prenom: 'Pierre', nom: 'Durand', fonction: 'Gérant', email: 'p.durand@plomberie-durand.example', telephone: '04 78 55 12 30' },
  { organisation: 'Menuiseries Alu Exemple', role: 'sous_traitant', civilite: 'Madame', prenom: 'Sophie', nom: 'Lambert', fonction: 'Conductrice de travaux', email: 'contact@menuiseries-alu.example', telephone: '04 74 21 67 80' },
  { organisation: 'Peinture & Revêtements du Val', role: 'sous_traitant', civilite: 'Monsieur', prenom: 'Karim', nom: 'Benali', fonction: 'Chef d’entreprise', email: 'k.benali@peinture-val.example', telephone: '04 72 90 45 18' },
  {
    organisation: 'Réseaux Électriques Exemple', role: 'concessionnaire', civilite: 'Monsieur', prenom: 'Olivier', nom: 'Blanc',
    fonction: 'Chargé de raccordement', email: 'raccordement@reseaux-exemple.example', telephone: '09 70 00 00 00',
    adresse: 'Agence raccordement\nBP 120\n99000 Saint-Exemple', diffusionCR: false,
    commentaire: 'Raccordement tarif jaune du groupe scolaire (DT/DICT et branchement).',
  },
  {
    organisation: 'Entreprise générale — équipe travaux', role: 'interne', civilite: 'Monsieur', prenom: 'Jean', nom: 'Dupont',
    fonction: 'Directeur de projet', email: 'j.dupont@entreprise.example', telephone: '06 10 20 30 40', copieParDefaut: true,
  },
  {
    organisation: 'Entreprise générale — équipe travaux', role: 'interne', civilite: 'Madame', prenom: 'Camille', nom: 'Leroy',
    fonction: 'Conductrice de travaux', email: 'c.leroy@entreprise.example', telephone: '06 11 22 33 44',
  },
  {
    organisation: 'Entreprise générale — équipe travaux', role: 'interne', civilite: 'Monsieur', prenom: 'Antoine', nom: 'Petit',
    fonction: 'Chef de chantier', email: 'a.petit@entreprise.example', telephone: '06 55 44 33 22',
  },
]

function donnees(projetId: string, d: ContactDef, ordre: number) {
  return {
    projetId,
    organisation: d.organisation,
    role: d.role,
    civilite: d.civilite ?? null,
    prenom: d.prenom ?? null,
    nom: d.nom ?? null,
    fonction: d.fonction ?? null,
    email: d.email ?? null,
    telephone: d.telephone ?? null,
    adresse: d.adresse ?? null,
    destinataireParDefaut: d.destinataireParDefaut ?? false,
    copieParDefaut: d.copieParDefaut ?? false,
    diffusionCR: d.diffusionCR ?? true,
    commentaire: d.commentaire ?? null,
    ordre,
  }
}

export async function seedDiffusion(prisma: PrismaClient, projetId: string) {
  await prisma.contactDiffusion.deleteMany({ where: { projetId } })
  await prisma.contactDiffusion.createMany({ data: CONTACTS_DIFFUSION.map((d, i) => donnees(projetId, d, i)) })
}

/** Projet existant : ajoute les contacts de démo absents (par organisation + nom), sans rien supprimer. Renvoie le nombre ajouté. */
export async function completerDiffusionExemple(prisma: PrismaClient, projetId: string): Promise<number> {
  const existants = await prisma.contactDiffusion.findMany({
    where: { projetId }, select: { organisation: true, nom: true, ordre: true, destinataireParDefaut: true },
  })
  const cles = new Set(existants.map((c) => cleContact(c.organisation, c.nom)))
  const aDejaDestinataire = existants.some((c) => c.destinataireParDefaut)
  let ordre = existants.reduce((m, c) => Math.max(m, c.ordre), -1) + 1
  const aCreer = []
  for (const d of CONTACTS_DIFFUSION) {
    const cle = cleContact(d.organisation, d.nom)
    if (cles.has(cle)) continue
    cles.add(cle)
    const data = donnees(projetId, d, ordre++)
    // ne pas créer un second destinataire par défaut si l'utilisateur en a déjà choisi un
    if (aDejaDestinataire) data.destinataireParDefaut = false
    aCreer.push(data)
  }
  if (aCreer.length) await prisma.contactDiffusion.createMany({ data: aCreer })
  return aCreer.length
}
