import type { Prisma, PrismaClient } from '@prisma/client'

type LigneSeed = [code: string, designation: string, unite: string, quantite: number, prixUnitaire: number]
type ChapitreSeed = { code: string; designation: string; lignes: LigneSeed[] }

/** DE de démo : construction d'un groupe scolaire (montants HT réalistes). */
const CHAPITRES: ChapitreSeed[] = [
  {
    code: '01',
    designation: 'Installations de chantier et travaux préparatoires',
    lignes: [
      ['01.01', 'Installation, entretien et repli de la base vie et des clôtures', 'Ft', 1, 95000],
      ['01.02', 'Grue à tour et moyens de levage (location et exploitation)', 'mois', 10, 7800],
      ['01.03', "Études d'exécution et plans de récolement", 'Ft', 1, 68000],
      ['01.04', 'Constat contradictoire des existants et des avoisinants', 'u', 2, 1500],
    ],
  },
  {
    code: '02',
    designation: 'Terrassements généraux',
    lignes: [
      ['02.01', 'Décapage de la terre végétale et mise en stock', 'm3', 3200, 6.8],
      ['02.02', 'Fouilles en grande masse et en rigoles', 'm3', 7400, 11.5],
      ['02.03', 'Évacuation des terres excédentaires en ISDI', 'm3', 4800, 19.5],
      ['02.04', 'Remblais techniques et plateforme sous dallage', 'm3', 3600, 28.4],
    ],
  },
  {
    code: '03',
    designation: 'Gros œuvre',
    lignes: [
      ['03.01', 'Fondations superficielles : semelles filantes et isolées', 'm3', 640, 285],
      ['03.02', 'Dallage béton armé sur terre-plein, ép. 15 cm', 'm2', 2900, 48.5],
      ['03.03', 'Voiles béton armé banché', 'm3', 780, 345],
      ['03.04', 'Planchers béton armé (prédalles et dalle de compression)', 'm2', 1850, 92],
      ['03.05', 'Poteaux et poutres béton armé', 'm3', 310, 410],
      ['03.06', 'Maçonnerie de blocs et doublages intérieurs', 'm2', 3400, 38.6],
    ],
  },
  {
    code: '04',
    designation: 'Charpente, couverture et menuiseries',
    lignes: [
      ['04.01', 'Charpente métallique de la toiture', 't', 62, 3850],
      ['04.02', 'Couverture en bac acier et étanchéité des toitures-terrasses', 'm2', 2200, 118],
      ['04.03', 'Menuiseries extérieures aluminium à rupture de pont thermique', 'm2', 640, 620],
      ['04.04', 'Façades : isolation thermique par l’extérieur et bardage', 'm2', 2450, 135],
      ['04.05', 'Menuiseries intérieures bois et blocs-portes', 'u', 118, 540],
    ],
  },
  {
    code: '05',
    designation: 'Lots techniques et VRD',
    lignes: [
      ['05.01', 'Plomberie sanitaires et chauffage (pompe à chaleur)', 'Ft', 1, 485000],
      ['05.02', 'Ventilation double flux et désenfumage', 'Ft', 1, 210000],
      ['05.03', 'Électricité courants forts et courants faibles', 'Ft', 1, 380000],
      ['05.04', 'Réseaux enterrés : eaux usées, eaux pluviales, bassin de rétention', 'ml', 1250, 168],
      ['05.05', 'Voiries, parkings et cheminements extérieurs', 'm2', 3800, 74],
      ['05.06', 'Espaces verts et plantations', 'm2', 2600, 22],
    ],
  },
]

/**
 * Données de démo du module Détail Estimatif + Co-traitance :
 * 5 chapitres, 27 lignes, 2 co-traitants (VINCI mandataire + un partenaire lots techniques)
 * et une répartition du PU sur le chapitre 05 (les autres lignes restent à répartir).
 */
export async function seedDetailEstimatif(prisma: PrismaClient, projetId: string) {
  await prisma.ligneDE.deleteMany({ where: { projetId } })
  await prisma.coTraitant.deleteMany({ where: { projetId } })

  const vinci = await prisma.coTraitant.create({
    data: { projetId, nom: 'VINCI Construction France', estMandataire: true, ordre: 0 },
  })
  const partenaire = await prisma.coTraitant.create({
    data: { projetId, nom: 'Entreprise Générale Partenaire', estMandataire: false, ordre: 1 },
  })

  /** Part du partenaire par ligne (le reste du PU va au mandataire). */
  const partPartenaire: Record<string, number> = {
    '05.01': 310000,
    '05.02': 150000,
    '05.03': 380000,
    '05.04': 0,
    '05.05': 0,
    '05.06': 22,
    '04.05': 0,
  }

  const data: Prisma.LigneDECreateManyInput[] = []
  let ordre = 0
  for (const ch of CHAPITRES) {
    data.push({ projetId, code: ch.code, designation: ch.designation, estChapitre: true, ordre: ordre++ })
    for (const [code, designation, unite, quantite, prixUnitaire] of ch.lignes) {
      const part = partPartenaire[code]
      data.push({
        projetId,
        code,
        designation,
        unite,
        quantite,
        prixUnitaire,
        estChapitre: false,
        ordre: ordre++,
        repartition:
          part === undefined ? undefined : { [vinci.id]: Math.round((prixUnitaire - part) * 100) / 100, [partenaire.id]: part },
      })
    }
  }
  await prisma.ligneDE.createMany({ data })
  console.log(`  Détail Estimatif : ${data.length} lignes, 2 co-traitants`)
}
