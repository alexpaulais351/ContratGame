import type { PrismaClient } from '@prisma/client'
import { DECISIONS, criteresDuGabarit, type BidCompData, type DecisionFournisseur } from '../../src/lib/matrice-bidcomp'

type Valeur = { note?: number; texte?: string; bool?: boolean; montant?: number; commentaire?: string; majeure?: boolean; negociable?: boolean }

/**
 * Démo : matrice « Fourniture de traverses béton » avec 3 fournisseurs notés :
 *  - Préfa Rail Sud → GO (meilleur score)
 *  - Béton Voies Industrie → en attente (score sous le seuil, points négociables)
 *  - Eurotraverse Import → NO GO (non-conformité majeure : pas d'homologation SNCF Réseau)
 */
export async function seedMatrice(prisma: PrismaClient, projetId: string) {
  const fournisseurs: {
    nom: string
    refOffre: string
    dateOffre: string
    paysFabrication: string
    incoterm: string
    montantOffre: number
    decision: DecisionFournisseur
    valeurs: Record<string, Valeur>
  }[] = [
    {
      nom: 'Préfa Rail Sud',
      refOffre: 'PRS-2026-0412',
      dateOffre: '2026-03-02',
      paysFabrication: 'France',
      incoterm: 'DAP',
      montantOffre: 1_184_500,
      decision: 'go',
      valeurs: {
        "Validité de l'offre": { texte: '90 jours' },
        "Complétude de l'offre": { note: 3 },
        'Respect du cahier des charges': { note: 3 },
        'Variante proposée': { bool: false },
        'Niveau de prix': { note: 2, commentaire: 'Prix unitaire 82,50 € / traverse, +3 % vs budget' },
        'Conditions de paiement': { texte: '45 jours fin de mois' },
        'Délai de paiement conforme LME': { bool: true },
        'Révision / actualisation des prix': { texte: 'Ferme et non révisable' },
        'Garanties financières (caution, retenue)': { note: 3 },
        'Acceptation des pénalités': { note: 3 },
        'Délai de fabrication': { texte: '6 semaines' },
        'Délai de livraison': { note: 3 },
        'Capacité de production': { note: 3 },
        'Compatibilité avec le planning travaux': { note: 3 },
        "Acceptation des conditions générales d'achat": { note: 3 },
        'Limitation de responsabilité': { note: 2 },
        'Attestations d’assurance (RC, décennale)': { bool: true },
        'Attestations URSSAF / Kbis à jour': { bool: true },
        'Conformité Sapin II / devoir de vigilance': { note: 3 },
        'Certification ISO 9001': { bool: true },
        'Certification ISO 45001 / MASE': { bool: true },
        'Agrément / homologation SNCF Réseau': { note: 3, commentaire: 'Traverses M450 homologuées' },
        'Plan d’assurance qualité (PAQ)': { note: 3 },
        'Prévention / accidentologie': { note: 2 },
        'Conformité aux spécifications techniques': { note: 3 },
        "Fiches techniques / PV d'essais": { note: 3 },
        'Références similaires': { note: 3 },
        'Assistance technique / SAV': { note: 2 },
        'Bilan carbone produit (FDES / EPD)': { note: 2 },
        'Certification ISO 14001': { bool: true },
        'Part de matériaux recyclés': { texte: '15 % granulats recyclés' },
        'Distance de transport / logistique bas carbone': { note: 3 },
        'Engagements sociaux (insertion, égalité)': { note: 2 },
        Fourniture: { montant: 1_072_500 },
        'Transport / livraison': { montant: 98_000 },
        'Emballage / conditionnement': { montant: 14_000 },
        'Option 1 – Stockage sur site': { montant: 18_500 },
        'Option 2 – Livraison fractionnée': { montant: 9_800 },
      },
    },
    {
      nom: 'Béton Voies Industrie',
      refOffre: 'BVI/OF/26-118',
      dateOffre: '2026-03-05',
      paysFabrication: 'France',
      incoterm: 'FCA',
      montantOffre: 1_096_000,
      decision: 'en_attente',
      valeurs: {
        "Validité de l'offre": { texte: '60 jours' },
        "Complétude de l'offre": { note: 2 },
        'Respect du cahier des charges': { note: 2 },
        'Variante proposée': { bool: true },
        'Niveau de prix': { note: 3 },
        'Conditions de paiement': { texte: '30 jours date de facture' },
        'Délai de paiement conforme LME': { bool: true },
        'Révision / actualisation des prix': { texte: 'Indexée acier + ciment', negociable: true, commentaire: 'Demander prix ferme' },
        'Garanties financières (caution, retenue)': { note: 2 },
        'Acceptation des pénalités': { note: 1, negociable: true, commentaire: 'Plafond de pénalités à 2 % : à renégocier' },
        'Délai de fabrication': { texte: '10 semaines' },
        'Délai de livraison': { note: 1, negociable: true, commentaire: 'Livraison départ usine (FCA) : transport à organiser' },
        'Capacité de production': { note: 2 },
        'Compatibilité avec le planning travaux': { note: 2 },
        "Acceptation des conditions générales d'achat": { note: 2 },
        'Limitation de responsabilité': { note: 1 },
        'Attestations d’assurance (RC, décennale)': { bool: true },
        'Attestations URSSAF / Kbis à jour': { bool: true },
        'Conformité Sapin II / devoir de vigilance': { note: 2 },
        'Certification ISO 9001': { bool: true },
        'Certification ISO 45001 / MASE': { bool: false },
        'Agrément / homologation SNCF Réseau': { note: 2, commentaire: 'Homologation en cours de renouvellement' },
        'Plan d’assurance qualité (PAQ)': { note: 2 },
        'Prévention / accidentologie': { note: 2 },
        'Conformité aux spécifications techniques': { note: 2 },
        "Fiches techniques / PV d'essais": { note: 2 },
        'Références similaires': { note: 2 },
        'Assistance technique / SAV': { note: 2 },
        'Bilan carbone produit (FDES / EPD)': { note: 1 },
        'Certification ISO 14001': { bool: false },
        'Part de matériaux recyclés': { texte: 'Non communiqué' },
        'Distance de transport / logistique bas carbone': { note: 2 },
        'Engagements sociaux (insertion, égalité)': { note: 2 },
        Fourniture: { montant: 1_041_000 },
        'Emballage / conditionnement': { montant: 55_000 },
        'Transport / livraison': { montant: 112_000, commentaire: 'Estimation interne (FCA)' },
        'Option 1 – Stockage sur site': { montant: 24_000 },
      },
    },
    {
      nom: 'Eurotraverse Import',
      refOffre: 'ETI-Q-2026-031',
      dateOffre: '2026-03-09',
      paysFabrication: 'Pologne',
      incoterm: 'DDP',
      montantOffre: 978_000,
      decision: 'no_go',
      valeurs: {
        "Validité de l'offre": { texte: '30 jours' },
        "Complétude de l'offre": { note: 2 },
        'Respect du cahier des charges': { note: 2 },
        'Variante proposée': { bool: false },
        'Niveau de prix': { note: 3, commentaire: 'Offre la moins-disante (-15 % vs budget)' },
        'Conditions de paiement': { texte: '30 % à la commande' },
        'Délai de paiement conforme LME': { bool: false, negociable: true },
        'Révision / actualisation des prix': { texte: 'Ferme' },
        'Garanties financières (caution, retenue)': { note: 1 },
        'Acceptation des pénalités': { note: 2 },
        'Délai de fabrication': { texte: '8 semaines' },
        'Délai de livraison': { note: 2 },
        'Capacité de production': { note: 3 },
        'Compatibilité avec le planning travaux': { note: 2 },
        "Acceptation des conditions générales d'achat": { note: 2 },
        'Limitation de responsabilité': { note: 2 },
        'Attestations d’assurance (RC, décennale)': { bool: true },
        'Attestations URSSAF / Kbis à jour': { bool: false },
        'Conformité Sapin II / devoir de vigilance': { note: 2 },
        'Certification ISO 9001': { bool: true },
        'Certification ISO 45001 / MASE': { bool: true },
        'Agrément / homologation SNCF Réseau': {
          note: 1,
          majeure: true,
          commentaire: 'Traverses non homologuées SNCF Réseau : rédhibitoire',
        },
        'Plan d’assurance qualité (PAQ)': { note: 2 },
        'Prévention / accidentologie': { note: 2 },
        'Conformité aux spécifications techniques': { note: 2 },
        "Fiches techniques / PV d'essais": { note: 2 },
        'Références similaires': { note: 1 },
        'Assistance technique / SAV': { note: 1 },
        'Bilan carbone produit (FDES / EPD)': { note: 2 },
        'Certification ISO 14001': { bool: true },
        'Part de matériaux recyclés': { texte: '5 %' },
        'Distance de transport / logistique bas carbone': { note: 1 },
        'Engagements sociaux (insertion, égalité)': { note: 2 },
        Fourniture: { montant: 862_000 },
        'Transport / livraison': { montant: 86_000 },
        'Frais de douane': { montant: 0 },
        'Emballage / conditionnement': { montant: 30_000 },
      },
    },
  ]

  const bidComp: BidCompData = {
    version: 1,
    typologieAchat: 'Fourniture',
    dateEtablissement: '2026-03-12',
    synthese: {
      opportunites:
        "Préfa Rail Sud : usine à 120 km du chantier (DAP), stock tampon possible sur site (option 1), traverses homologuées.\nBéton Voies Industrie : prix le plus compétitif parmi les offres conformes, variante d'approvisionnement proposée.",
      risques:
        "Béton Voies Industrie : délai de fabrication de 10 semaines incompatible avec la fenêtre travaux de mai sans engagement ferme ; prix indexés.\nEurotraverse Import : absence d'homologation SNCF Réseau (non-conformité majeure), acompte de 30 % à la commande.",
      recommandation:
        "Retenir Préfa Rail Sud (meilleur score, aucune non-conformité). Négocier une remise de 2 % sur la fourniture pour revenir au budget théorique et intégrer l'option de stockage sur site.",
    },
    fournisseurRecommandeId: null,
  }

  const matrice = await prisma.matriceDecisionnelle.create({
    data: {
      projetId,
      titre: 'Fourniture de traverses béton',
      acheteur: 'Claire Martin',
      site: 'LGV Sud — base travaux de Nîmes',
      familleAchats: 'Matériaux voie ferrée',
      budgetTheorique: 1_150_000,
      devise: 'EUR',
      seuilGo: 70,
      statut: 'en_cours',
      bidComp,
      criteres: { create: criteresDuGabarit() },
      fournisseurs: {
        create: fournisseurs.map((f, i) => ({
          nom: f.nom,
          rang: i + 1,
          refOffre: f.refOffre,
          dateOffre: new Date(f.dateOffre),
          paysFabrication: f.paysFabrication,
          incoterm: f.incoterm,
          montantOffre: f.montantOffre,
          decision: f.decision,
          couleurDecision: DECISIONS[f.decision].couleur,
        })),
      },
    },
    include: { criteres: true, fournisseurs: true },
  })

  const parLibelle = new Map(matrice.criteres.map((c) => [c.libelle, c]))
  const notations = fournisseurs.flatMap((f) => {
    const fid = matrice.fournisseurs.find((x) => x.nom === f.nom)!.id
    return Object.entries(f.valeurs).flatMap(([libelle, v]) => {
      const c = parLibelle.get(libelle)
      if (!c) return []
      return [
        {
          critereId: c.id,
          fournisseurId: fid,
          note: v.note ?? null,
          valeurTexte: v.montant !== undefined ? String(v.montant) : (v.texte ?? null),
          valeurBool: v.bool ?? null,
          commentaire: v.commentaire ?? null,
          estNonConformiteMajeure: v.majeure ?? false,
          estNonConformiteNegociable: v.negociable ?? false,
        },
      ]
    })
  })
  await prisma.notationCritere.createMany({ data: notations })

  const reco = matrice.fournisseurs.find((x) => x.nom === 'Préfa Rail Sud')!
  await prisma.matriceDecisionnelle.update({
    where: { id: matrice.id },
    data: { bidComp: { ...bidComp, fournisseurRecommandeId: reco.id } },
  })
}
