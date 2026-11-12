import type { PrismaClient } from '@prisma/client'

type Projet = NonNullable<Awaited<ReturnType<PrismaClient['projet']['findUnique']>>>

type CourrierDef = {
  reference: string
  type: string
  objet: (nom: string) => string
  /** null = brouillon (pas de date d'envoi) */
  dateEnvoi: string | null
  destinataire: (p: Projet) => string
  modeEnvoi: string
  lieu: string
  copies: string
  signataireNom: string
  signataireFonction: string
  corps: (p: Projet) => string
}

const nomMoa = (p: Projet) => [p.moaPrenom, p.moaNom].filter(Boolean).join(' ') || 'Maître d’ouvrage'
const moa = (p: Projet) => `${nomMoa(p)}\n${p.moaAdresse ?? ''}`.trim()
const moe = () => 'Cabinet d’architecture Exemple\nÀ l’attention de Monsieur Laurent Girard, Architecte, chef de projet\n8 rue des Architectes\n99000 Saint-Exemple'
const ref = (p: Projet) => `Marché n° ${p.numeroCommande ?? '………'} – Affaire ${p.numeroAffaire ?? '………'}`
const FORMULE = 'Dans l’attente de votre retour, nous vous prions d’agréer, Madame, Monsieur, l’expression de nos salutations distinguées.'

const COURRIERS: CourrierDef[] = [
  {
    reference: 'CR-2026-001',
    type: 'reserves',
    objet: (nom) => `${nom} – Émission de réserves`,
    dateEnvoi: '2026-03-12',
    destinataire: moa,
    modeEnvoi: 'lrar',
    lieu: 'Lyon',
    copies: 'Entreprise générale — équipe travaux (Jean Dupont) ; Service contrats',
    signataireNom: 'Jean Dupont',
    signataireFonction: 'Directeur de projet',
    corps: (p) => `Madame, Monsieur,

Dans le cadre de l’opération « ${p.name} » (${ref(p)}), nous avons pris connaissance de votre ordre de service daté du 2 mars 2026 relatif à la modification du phasage des travaux.

Après examen, nous formulons les réserves suivantes :

1. Les nouvelles contraintes d’accès et de phasage du chantier ne sont pas compatibles avec le planning contractuel.
2. Les incidences financières de cette modification n'ont pas été chiffrées.
3. Les délais d'approvisionnement des matériaux et équipements ne permettent pas le respect de la nouvelle date de démarrage.

Nous nous réservons le droit de présenter toute réclamation complémentaire. Nous vous remercions de nous faire part de votre position sous quinze (15) jours.

${FORMULE}`,
  },
  {
    reference: 'CR-2026-002',
    type: 'accuse_reception',
    objet: () => 'Accusé de réception de l’ordre de service n°2 – Modification du phasage',
    dateEnvoi: '2026-01-28',
    destinataire: moe,
    modeEnvoi: 'main_propre',
    lieu: 'Saint-Exemple',
    copies: 'Ville de Saint-Exemple (Claire Moreau) ; Entreprise générale — équipe travaux (Jean Dupont)',
    signataireNom: 'Jean Dupont',
    signataireFonction: 'Directeur de projet',
    corps: (p) => `Madame, Monsieur,

Nous accusons réception de l’ordre de service n°2 du 27 janvier 2026, relatif à la modification de l’ordre d’intervention des bâtiments A et B, pour l’opération « ${p.name} » (${ref(p)}).

Nous en avons pris connaissance et procédons à l’analyse de ses conséquences sur le planning d’exécution, l’installation de chantier et les approvisionnements.

Cet accusé de réception ne vaut pas acceptation de son contenu. Nous vous communiquerons nos observations et, le cas échéant, nos réserves dans les meilleurs délais, après examen avec nos sous-traitants concernés.

${FORMULE}`,
  },
  {
    reference: 'CR-2026-003',
    type: 'constat',
    objet: () => 'Constat contradictoire – Réseaux enterrés non conformes aux plans (zone B)',
    dateEnvoi: null,
    destinataire: moe,
    modeEnvoi: 'mail',
    lieu: 'Saint-Exemple',
    copies: 'Ville de Saint-Exemple (Claire Moreau) ; Prévention Sécurité Chantiers (Thomas Rey) ; Terrassements du Centre (Julie Arnaud)',
    signataireNom: 'Jean Dupont',
    signataireFonction: 'Directeur de projet',
    corps: (p) => `Madame, Monsieur,

Lors des terrassements de la zone B de l’opération « ${p.name} » (${ref(p)}), situé ${p.adresseChantier ?? '………'}, nos équipes ont mis au jour des réseaux enterrés (conduite d’eau Ø150 et fourreaux électriques) dont le tracé et la profondeur ne correspondent pas aux plans de récolement communiqués.

Ces réseaux interfèrent avec l’emprise des fondations du bâtiment B et ont nécessité l’arrêt des travaux dans le secteur concerné.

Nous vous invitons à assister ou à vous faire représenter à un constat contradictoire sur site, le ……… à ……… h, afin de relever la nature, la position et l’état de ces ouvrages.

À défaut de présence de votre part, le constat sera réputé contradictoire et vous sera notifié, accompagné des photographies et relevés réalisés. Nous vous demandons par ailleurs de nous indiquer les mesures de dévoiement que vous entendez prescrire.

${FORMULE}`,
  },
  {
    reference: 'CR-2026-004',
    type: 'mise_en_demeure',
    objet: () => 'Mise en demeure – Lot terrassements : retards et moyens insuffisants (zone B)',
    dateEnvoi: '2026-05-13',
    destinataire: () => 'Terrassements du Centre\nÀ l’attention de Madame Julie Arnaud',
    modeEnvoi: 'lrar',
    lieu: 'Saint-Exemple',
    copies: 'Entreprise générale — équipe travaux (Jean Dupont) ; Service contrats ; Cabinet d’architecture Exemple (Laurent Girard)',
    signataireNom: 'Jean Dupont',
    signataireFonction: 'Directeur de projet',
    corps: (p) => `Madame,

Par la présente, et en référence au contrat de sous-traitance du lot terrassements relatif à l’opération « ${p.name} » (${ref(p)}), situé ${p.adresseChantier ?? '………'}, nous constatons que vous n’avez pas satisfait à vos obligations contractuelles en matière de délais et de moyens.

Malgré nos relances des 21 avril et 5 mai 2026 consignées aux comptes rendus de chantier, la situation demeure inchangée :

1. Les terrassements de la zone B accusent un retard de trois semaines sur le planning contractuel.
2. Les moyens mis en œuvre (une seule pelle sur les deux prévues, effectif réduit de moitié) ne permettent pas de rattraper ce retard.
3. L’évacuation des déblais n’est pas assurée au rythme nécessaire, ce qui encombre la plateforme.

En conséquence, nous vous mettons en demeure de renforcer vos moyens conformément à votre offre et de remettre un planning de rattrapage dans un délai de huit (8) jours à compter de la réception du présent courrier.

À défaut, nous nous réservons le droit de faire exécuter ces prestations par une entreprise de notre choix à vos frais et risques, d’appliquer les pénalités prévues au contrat et de faire valoir tous nos droits.

Le présent courrier vaut mise en demeure au sens des stipulations contractuelles.

${FORMULE}`,
  },
  {
    reference: 'CR-2026-005',
    type: 'prix_nouveau',
    objet: () => 'Demande de prix nouveau – Fondations spéciales zone B (sol de mauvaise portance)',
    dateEnvoi: '2026-06-24',
    destinataire: moa,
    modeEnvoi: 'lrar',
    lieu: 'Lyon',
    copies: 'Cabinet d’architecture Exemple (Laurent Girard) ; Entreprise générale — équipe travaux (Jean Dupont) ; Service contrats',
    signataireNom: 'Jean Dupont',
    signataireFonction: 'Directeur de projet',
    corps: (p) => `Madame, Monsieur,

Dans le cadre de l’opération « ${p.name} » (${ref(p)}), les sondages complémentaires réalisés lors des fouilles de la zone B ont révélé la présence de poches d’argile molle sur une profondeur de 2,50 m, non signalées à l’étude géotechnique de la phase de consultation.

Ces conditions de sol imposent des fondations renforcées (puits en gros béton et longrines complémentaires) en substitution des semelles filantes prévues au marché. Ces prestations ne correspondent à aucun prix du bordereau :

– Désignation : puits de fondation en gros béton, longrines de redressement
– Quantités estimées : 46 puits d’une profondeur moyenne de 2,50 m ; 118 ml de longrines
– Justification : sujétions imprévues du sol, avis du bureau d’études structure du 17 juin 2026

Nous vous transmettons en pièce jointe le mémoire justificatif et la proposition de prix nouveau correspondante, d’un montant de 86 400 € HT, ainsi qu’une incidence estimée de deux (2) semaines sur le planning.

Nous vous demandons de bien vouloir valider ce prix nouveau par ordre de service ou avenant, et nous réservons le droit de compléter la présente réclamation.

${FORMULE}`,
  },
  {
    reference: 'CR-2026-006',
    type: 'prolongation_delai',
    objet: (nom) => `${nom} – Demande de prolongation de délai (+3 semaines)`,
    dateEnvoi: '2026-09-15',
    destinataire: moa,
    modeEnvoi: 'lrar',
    lieu: 'Lyon',
    copies: 'Cabinet d’architecture Exemple (Laurent Girard) ; Entreprise générale — équipe travaux (Jean Dupont)',
    signataireNom: 'Jean Dupont',
    signataireFonction: 'Directeur de projet',
    corps: (p) => `Madame, Monsieur,

Dans le cadre de l’opération « ${p.name} » (${ref(p)}), nous vous informons que l’exécution des travaux est impactée par les événements suivants :

– la découverte de réseaux enterrés non répertoriés en zone B et l’arrêt des travaux qui en a résulté (constat du 8 avril 2026) ;
– les intempéries exceptionnelles du printemps, dûment constatées, représentant 14 jours d’arrêt ;
– la pénurie d’aciers pour béton armé, avec un retard de livraison de quatre semaines attesté par nos fournisseurs.

Ces événements, qui ne nous sont pas imputables, ont entraîné un retard estimé à vingt et un (21) jours calendaires sur le chemin critique du planning.

Nous sollicitons en conséquence une prolongation du délai contractuel de trois (3) semaines, portant la date d’achèvement des travaux du 18 décembre 2026 au 8 janvier 2027.

Nous joignons à ce courrier l’analyse détaillée de l’impact planning et restons à votre disposition pour vous la présenter. Nous vous remercions de bien vouloir nous notifier votre accord.

${FORMULE}`,
  },
  {
    reference: 'CR-2026-007',
    type: 'transmission',
    objet: () => 'Transmission du DOE partiel – Lots gros œuvre et plomberie',
    dateEnvoi: '2026-11-06',
    destinataire: moe,
    modeEnvoi: 'mail',
    lieu: 'Saint-Exemple',
    copies: 'Ville de Saint-Exemple (Claire Moreau) ; Entreprise générale — équipe travaux (Jean Dupont)',
    signataireNom: 'Jean Dupont',
    signataireFonction: 'Directeur de projet',
    corps: (p) => `Madame, Monsieur,

Veuillez trouver ci-joint, pour l’opération « ${p.name} » (${ref(p)}), le dossier des ouvrages exécutés (DOE) partiel comprenant :

– les plans de récolement du gros œuvre et des fondations (indice B) ;
– les fiches techniques et notices d’entretien des équipements de plomberie et de chauffage (indice A) ;
– les procès-verbaux d’essais des réseaux d’eau et les certificats de conformité (indice A) ;
– les plans EXE à jour des cloisons et des faux plafonds (indice C).

Ces documents sont transmis pour : ☒ information  ☒ visa  ☐ approbation  ☐ exécution.

Les DOE des lots électricité, menuiseries et peinture vous seront remis avant les opérations préalables à la réception. Nous vous remercions de bien vouloir nous retourner un exemplaire visé dans les meilleurs délais.

${FORMULE}`,
  },
  {
    reference: 'CR-2026-008',
    type: 'libre',
    objet: (nom) => `${nom} – Organisation de la réception des travaux`,
    dateEnvoi: null,
    destinataire: moa,
    modeEnvoi: 'simple',
    lieu: 'Lyon',
    copies: 'Cabinet d’architecture Exemple (Laurent Girard) ; Prévention Sécurité Chantiers (Thomas Rey)',
    signataireNom: 'Jean Dupont',
    signataireFonction: 'Directeur de projet',
    corps: (p) => `Madame, Monsieur,

L’achèvement des travaux de l’opération « ${p.name} » (${ref(p)}) approchant, nous vous proposons l’organisation suivante pour la réception.

Les opérations préalables à la réception (OPR) se sont tenues le 10 novembre 2026 et ont donné lieu à l’établissement d’une liste de réserves, dont la levée est en cours. Nous proposons de tenir la réception le vendredi 11 décembre 2026 à 9 h 30, sur site, en présence de la maîtrise d’ouvrage, de la maîtrise d’œuvre, du coordonnateur SPS et des entreprises concernées.

Afin de préparer cette réunion, nous vous remercions de bien vouloir nous confirmer la date retenue et la liste des participants. Nous vous transmettrons au plus tard cinq jours avant la réception le DOE complet ainsi que l’état d’avancement de la levée des réserves.

${FORMULE}`,
  },
]

async function creerCourrier(prisma: PrismaClient, projet: Projet, d: CourrierDef, categorieId: string | null) {
  const dateEnvoi = d.dateEnvoi ? new Date(`${d.dateEnvoi}T12:00:00.000Z`) : null
  const objet = d.objet(projet.name)
  const courrier = await prisma.courrierChantier.create({
    data: {
      projetId: projet.id,
      reference: d.reference,
      objet,
      type: d.type,
      dateEnvoi,
      statut: dateEnvoi ? 'envoye' : 'brouillon',
      destinataire: d.destinataire(projet),
      expediteur: 'Contrat Game – Direction de projet',
      lieu: d.lieu,
      modeEnvoi: d.modeEnvoi,
      copies: d.copies,
      signataireNom: d.signataireNom,
      signataireFonction: d.signataireFonction,
      corps: d.corps(projet),
    },
  })
  if (dateEnvoi && categorieId) {
    // Un événement « Contrat » existe déjà ce jour-là dans le journal d'exemple (ex. mise en demeure,
    // prolongation de délai) : on le rattache au courrier plutôt que de créer un doublon.
    const existant = await prisma.evenementChantier.findFirst({
      where: { projetId: projet.id, date: dateEnvoi, categorieId, courrierId: null },
    })
    if (existant) {
      await prisma.evenementChantier.update({ where: { id: existant.id }, data: { courrierId: courrier.id, source: 'courrier' } })
      return
    }
    await prisma.evenementChantier.create({
      data: {
        projetId: projet.id,
        date: dateEnvoi,
        titre: `Courrier ${d.reference} : ${objet}`,
        categorie: 'Contrat',
        categorieId,
        afficherFrise: true,
        source: 'courrier',
        courrierId: courrier.id,
      },
    })
  }
}

async function categorieContrat(prisma: PrismaClient, projetId: string) {
  const cat = await prisma.categorieEvenement.findUnique({ where: { projetId_nom: { projetId, nom: 'Contrat' } } })
  return cat?.id ?? null
}

export async function seedCourriers(prisma: PrismaClient, projetId: string) {
  const projet = await prisma.projet.findUnique({ where: { id: projetId } })
  if (!projet) return
  const catId = await categorieContrat(prisma, projetId)
  await prisma.courrierChantier.deleteMany({ where: { projetId, reference: { in: COURRIERS.map((c) => c.reference) } } })
  for (const d of COURRIERS) await creerCourrier(prisma, projet, d, catId)
}

/** Projet existant : ajoute les courriers de démo absents (par référence) et leur événement de journal. Renvoie le nombre ajouté. */
export async function completerCourriersExemple(prisma: PrismaClient, projetId: string): Promise<number> {
  const projet = await prisma.projet.findUnique({ where: { id: projetId } })
  if (!projet) return 0
  const existantes = new Set(
    (await prisma.courrierChantier.findMany({ where: { projetId }, select: { reference: true } })).map((c) => c.reference),
  )
  const catId = await categorieContrat(prisma, projetId)
  let n = 0
  for (const d of COURRIERS) {
    if (existantes.has(d.reference)) continue
    await creerCourrier(prisma, projet, d, catId)
    n++
  }
  return n
}
