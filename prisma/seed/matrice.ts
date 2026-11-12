import type { PrismaClient } from '@prisma/client'
import { DECISIONS, criteresDuGabarit, type BidCompData, type DecisionFournisseur } from '../../src/lib/matrice-bidcomp'

type Valeur = { note?: number; texte?: string; bool?: boolean; montant?: number; commentaire?: string; majeure?: boolean; negociable?: boolean }

/**
 * Démo : matrice « Fourniture de menuiseries extérieures aluminium » avec 3 fournisseurs notés :
 *  - Alu Façades Industrie → GO (meilleur score)
 *  - Menuiseries du Nord → en attente (score sous le seuil, points négociables)
 *  - EuroAlu Import → NO GO (non-conformité majeure : absence d'Avis Technique / certification NF)
 */
type FournisseurDef = {
  nom: string
  refOffre: string
  dateOffre: string
  paysFabrication: string
  incoterm: string
  montantOffre: number
  decision: DecisionFournisseur
  valeurs: Record<string, Valeur>
}

type MatriceDef = {
  titre: string
  acheteur: string
  site: string
  familleAchats: string
  budgetTheorique: number
  seuilGo: number
  statut: 'brouillon' | 'en_cours' | 'finalisee'
  bidComp: BidCompData
  fournisseurs: FournisseurDef[]
  recommande?: string
}

const CRITERES = criteresDuGabarit()

/** Valeurs par défaut : toutes les notes à `noteDefaut`, tous les oui/non à « oui », puis surcharges. */
function base(noteDefaut: number, over: Record<string, Valeur>): Record<string, Valeur> {
  const out: Record<string, Valeur> = {}
  for (const c of CRITERES) {
    if (c.type === 'note_1_3') out[c.libelle] = { note: noteDefaut }
    else if (c.type === 'booleen') out[c.libelle] = { bool: true }
  }
  return { ...out, ...over }
}

function defMenuiseries(): MatriceDef {
  const fournisseurs: FournisseurDef[] = [
    {
      nom: 'Alu Façades Industrie',
      refOffre: 'AFI-2026-0412',
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
        'Niveau de prix': { note: 2, commentaire: 'Prix moyen 1 850 € / m² de menuiserie posée, +3 % vs budget' },
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
        'Certification / Avis Technique': { note: 3, commentaire: 'Avis Technique CSTB en cours de validité, certification NF' },
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
      nom: 'Menuiseries du Nord',
      refOffre: 'MDN/OF/26-118',
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
        'Révision / actualisation des prix': { texte: 'Indexée aluminium', negociable: true, commentaire: 'Demander prix ferme' },
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
        'Certification / Avis Technique': { note: 2, commentaire: 'Avis Technique en cours de renouvellement' },
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
      nom: 'EuroAlu Import',
      refOffre: 'EAI-Q-2026-031',
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
        'Certification / Avis Technique': {
          note: 1,
          majeure: true,
          commentaire: 'Aucun Avis Technique ni certification NF : rédhibitoire',
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
        "Alu Façades Industrie : usine à 120 km du chantier (DAP), stockage tampon possible sur site (option 1), Avis Technique valide.\nMenuiseries du Nord : prix le plus compétitif parmi les offres conformes, variante de vitrage proposée.",
      risques:
        "Menuiseries du Nord : délai de fabrication de 10 semaines incompatible avec la fenêtre de pose de mai sans engagement ferme ; prix indexés.\nEuroAlu Import : absence d'Avis Technique / certification NF (non-conformité majeure), acompte de 30 % à la commande.",
      recommandation:
        "Retenir Alu Façades Industrie (meilleur score, aucune non-conformité). Négocier une remise de 2 % sur la fourniture pour revenir au budget théorique et intégrer l'option de stockage sur site.",
    },
    fournisseurRecommandeId: null,
  }
  return {
    titre: 'Fourniture de menuiseries extérieures aluminium',
    acheteur: 'Claire Martin',
    site: 'Groupe scolaire Les Tilleuls — Saint-Exemple',
    familleAchats: 'Menuiseries extérieures et façades',
    budgetTheorique: 1_150_000,
    seuilGo: 70,
    statut: 'en_cours',
    bidComp,
    fournisseurs,
    recommande: 'Alu Façades Industrie',
  }
}

function defBeton(): MatriceDef {
  const fournisseurs: FournisseurDef[] = [
    {
      nom: 'Béton du Val',
      refOffre: 'BDV-26-0087',
      dateOffre: '2026-01-14',
      paysFabrication: 'France',
      incoterm: 'DAP',
      montantOffre: 412_000,
      decision: 'go',
      valeurs: base(3, {
        "Validité de l'offre": { texte: '120 jours' },
        'Niveau de prix': { note: 2, commentaire: 'Prix du m³ C25/30 XC2 : 118 € HT, conforme au budget' },
        'Conditions de paiement': { texte: '45 jours fin de mois' },
        'Révision / actualisation des prix': { texte: 'Ferme jusqu’au 30/06/2026, puis indice BT21' },
        'Délai de fabrication': { texte: 'Livraison à J+2 sur commande' },
        'Prévention / accidentologie': { note: 2 },
        'Bilan carbone produit (FDES / EPD)': { note: 2, commentaire: 'FDES disponible, ciment CEM III proposé en option' },
        'Part de matériaux recyclés': { texte: '10 % de granulats recyclés' },
        Fourniture: { montant: 372_000 },
        'Transport / livraison': { montant: 34_000 },
        'Autres frais': { montant: 6_000, commentaire: 'Adjuvants hiver' },
        'Option 1 – Stockage sur site': { montant: 0 },
        'Option 3 – Extension de garantie': { montant: 4_500 },
      }),
    },
    {
      nom: 'Centrale Béton Régionale',
      refOffre: 'CBR/2026/0215',
      dateOffre: '2026-01-16',
      paysFabrication: 'France',
      incoterm: 'DAP',
      montantOffre: 398_500,
      decision: 'en_attente',
      valeurs: base(2, {
        "Validité de l'offre": { texte: '60 jours' },
        'Niveau de prix': { note: 3, commentaire: 'Offre la moins-disante des offres conformes' },
        'Conditions de paiement': { texte: '30 jours date de facture' },
        'Révision / actualisation des prix': { texte: 'Révisable mensuellement', negociable: true, commentaire: 'Demander un prix ferme sur 6 mois' },
        'Acceptation des pénalités': { note: 1, negociable: true, commentaire: 'Refuse les pénalités pour retard de livraison' },
        'Délai de livraison': { note: 2 },
        'Certification ISO 45001 / MASE': { bool: false },
        'Délai de fabrication': { texte: 'Livraison à J+3 sur commande' },
        'Part de matériaux recyclés': { texte: 'Non communiqué' },
        Fourniture: { montant: 361_000 },
        'Transport / livraison': { montant: 31_500 },
        'Autres frais': { montant: 6_000 },
      }),
    },
    {
      nom: 'BétonExpress Sud',
      refOffre: 'BXS-0412-26',
      dateOffre: '2026-01-20',
      paysFabrication: 'France',
      incoterm: 'FCA',
      montantOffre: 372_000,
      decision: 'no_go',
      valeurs: base(2, {
        "Validité de l'offre": { texte: '30 jours' },
        'Niveau de prix': { note: 3, commentaire: 'Offre très basse (-10 % vs budget)' },
        'Conditions de paiement': { texte: 'Paiement à 15 jours' },
        'Délai de paiement conforme LME': { bool: true },
        'Capacité de production': { note: 1, majeure: true, commentaire: 'Une seule centrale, pas de capacité de secours pour les coulées de dalle > 150 m³' },
        'Délai de livraison': { note: 1 },
        'Certification / Avis Technique': { note: 1, majeure: true, commentaire: 'Certification NF-Béton non à jour : non-conformité majeure' },
        'Certification ISO 9001': { bool: false },
        'Références similaires': { note: 1 },
        'Délai de fabrication': { texte: 'Livraison à J+5' },
        Fourniture: { montant: 345_000 },
        'Transport / livraison': { montant: 27_000 },
      }),
    },
  ]
  return {
    titre: 'Béton prêt à l’emploi',
    acheteur: 'Claire Martin',
    site: 'Groupe scolaire Les Tilleuls — Saint-Exemple',
    familleAchats: 'Gros œuvre — matériaux',
    budgetTheorique: 410_000,
    seuilGo: 70,
    statut: 'finalisee',
    bidComp: {
      version: 1,
      typologieAchat: 'Fourniture',
      dateEtablissement: '2026-01-26',
      synthese: {
        opportunites:
          'Béton du Val : centrale à 12 km du chantier, FDES disponibles, bonne réactivité sur les coulées hivernales.\nCentrale Béton Régionale : prix inférieur de 3 % à celui du retenu, marge de négociation sur les pénalités.',
        risques:
          'BétonExpress Sud : capacité de production insuffisante pour les grandes coulées et certification NF non à jour (écartée).\nCentrale Béton Régionale : révision mensuelle des prix et refus des pénalités de retard.',
        recommandation:
          'Retenir Béton du Val (GO) : offre complète et conforme, prix dans le budget. Prix ferme jusqu’au 30 juin 2026 ; commande-cadre à émettre avant le démarrage des fondations.',
      },
      fournisseurRecommandeId: null,
    },
    fournisseurs,
    recommande: 'Béton du Val',
  }
}

function defGrue(): MatriceDef {
  const fournisseurs: FournisseurDef[] = [
    {
      nom: 'Levage Services Exemple',
      refOffre: 'LSE-2026-233',
      dateOffre: '2026-02-09',
      paysFabrication: 'France',
      incoterm: 'DAP',
      montantOffre: 86_400,
      decision: 'en_attente',
      valeurs: base(3, {
        "Validité de l'offre": { texte: '60 jours' },
        'Niveau de prix': { note: 2, commentaire: 'Location mensuelle 4 800 €, grue 40 m de flèche, 1,6 t en pointe' },
        'Conditions de paiement': { texte: '45 jours fin de mois' },
        'Délai de livraison': { note: 3 },
        'Compatibilité avec le planning travaux': { note: 2, negociable: true, commentaire: 'Montage possible dès le 19/01 sous réserve de la plateforme' },
        Fourniture: { montant: 67_200, commentaire: '14 mois de location' },
        'Transport / livraison': { montant: 9_800 },
        'Autres frais': { montant: 5_400, commentaire: 'Montage / démontage' },
        'Option 1 – Stockage sur site': { montant: 4_000, commentaire: 'Lest supplémentaire' },
      }),
    },
    {
      nom: 'Grues & Levage du Rhône',
      refOffre: 'GLR/26/0178',
      dateOffre: '2026-02-11',
      paysFabrication: 'France',
      incoterm: 'EXW',
      montantOffre: 79_900,
      decision: 'en_attente',
      valeurs: base(2, {
        "Validité de l'offre": { texte: '45 jours' },
        'Niveau de prix': { note: 3 },
        'Conditions de paiement': { texte: '30 jours date de facture' },
        'Acceptation des pénalités': { note: 1, negociable: true },
        'Certification ISO 45001 / MASE': { bool: false, negociable: true },
        'Prévention / accidentologie': { note: 1 },
        Fourniture: { montant: 63_000 },
        'Transport / livraison': { montant: 12_900, commentaire: 'Transport exceptionnel facturé en sus' },
        'Autres frais': { montant: 4_000 },
      }),
    },
    {
      nom: 'TourLoc Europe',
      refOffre: 'TLE-IN-0092',
      dateOffre: '2026-02-12',
      paysFabrication: 'Allemagne',
      incoterm: 'FCA',
      montantOffre: 0,
      decision: 'en_attente',
      valeurs: {
        "Validité de l'offre": { texte: 'Offre en attente de chiffrage définitif' },
        "Complétude de l'offre": { note: 1, majeure: true, commentaire: 'Dossier incomplet : note de calcul de la grue manquante' },
      },
    },
  ]
  return {
    titre: 'Location de grue à tour',
    acheteur: 'Claire Martin',
    site: 'Groupe scolaire Les Tilleuls — Saint-Exemple',
    familleAchats: 'Installations de chantier — matériel',
    budgetTheorique: 85_000,
    seuilGo: 70,
    statut: 'brouillon',
    bidComp: {
      version: 1,
      typologieAchat: 'Location',
      dateEtablissement: '2026-02-16',
      synthese: {
        opportunites:
          'Levage Services Exemple : montage rapide et opérateur dédié inclus. Grues & Levage du Rhône : prix de location le plus bas.',
        risques:
          'Grues & Levage du Rhône : absence de MASE et accidentologie à surveiller. TourLoc Europe : dossier incomplet, délai d’importation incertain.',
        recommandation: 'Analyse en cours : attendre le complément de TourLoc Europe et renégocier les pénalités avant décision.',
      },
      fournisseurRecommandeId: null,
    },
    fournisseurs,
  }
}

async function creerMatrice(prisma: PrismaClient, projetId: string, def: MatriceDef) {
  const matrice = await prisma.matriceDecisionnelle.create({
    data: {
      projetId,
      titre: def.titre,
      acheteur: def.acheteur,
      site: def.site,
      familleAchats: def.familleAchats,
      budgetTheorique: def.budgetTheorique,
      devise: 'EUR',
      seuilGo: def.seuilGo,
      statut: def.statut,
      bidComp: def.bidComp,
      criteres: { create: criteresDuGabarit() },
      fournisseurs: {
        create: def.fournisseurs.map((f, i) => ({
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
  const notations = def.fournisseurs.flatMap((f) => {
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

  if (def.recommande) {
    const reco = matrice.fournisseurs.find((x) => x.nom === def.recommande)
    if (reco) {
      await prisma.matriceDecisionnelle.update({
        where: { id: matrice.id },
        data: { bidComp: { ...def.bidComp, fournisseurRecommandeId: reco.id } },
      })
    }
  }
}

/** Projet neuf : crée les 3 matrices de démo. */
export async function seedMatrice(prisma: PrismaClient, projetId: string) {
  for (const def of [defMenuiseries(), defBeton(), defGrue()]) await creerMatrice(prisma, projetId, def)
}

/** Projet existant : ajoute les matrices de démo absentes (par titre), sans rien modifier. Renvoie le nombre ajouté. */
export async function completerMatricesExemple(prisma: PrismaClient, projetId: string): Promise<number> {
  const existants = new Set((await prisma.matriceDecisionnelle.findMany({ where: { projetId }, select: { titre: true } })).map((m) => m.titre))
  let n = 0
  for (const def of [defMenuiseries(), defBeton(), defGrue()]) {
    if (existants.has(def.titre)) continue
    await creerMatrice(prisma, projetId, def)
    n++
  }
  return n
}
