-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "logoSociete" TEXT,
    "nomSociete" TEXT,
    "adresseSociete" TEXT,
    "telSociete" TEXT,
    "faxSociete" TEXT,
    "certifications" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Projet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "moaNom" TEXT,
    "moaPrenom" TEXT,
    "moaAdresse" TEXT,
    "numeroAffaire" TEXT,
    "numeroCommande" TEXT,
    "numeroOTP" TEXT,
    "adresseChantier" TEXT,
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "modulesMasques" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Projet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjetMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',

    CONSTRAINT "ProjetMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneDE" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "code" TEXT NOT NULL DEFAULT '',
    "designation" TEXT NOT NULL DEFAULT '',
    "unite" TEXT NOT NULL DEFAULT '',
    "quantite" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "prixUnitaire" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estChapitre" BOOLEAN NOT NULL DEFAULT false,
    "repartition" JSONB,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LigneDE_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoTraitant" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "estMandataire" BOOLEAN NOT NULL DEFAULT false,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CoTraitant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Situation" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "libelle" TEXT NOT NULL DEFAULT '',
    "annee" INTEGER NOT NULL,
    "mois" INTEGER NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'brouillon',
    "commentaire" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Situation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneSituation" (
    "id" TEXT NOT NULL,
    "situationId" TEXT NOT NULL,
    "ligneDEId" TEXT NOT NULL,
    "quantite" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "prixUnitaire" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "LigneSituation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrixNouveau" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "numero" TEXT NOT NULL DEFAULT '',
    "intitule" TEXT NOT NULL DEFAULT '',
    "dateDevis" TIMESTAMP(3),
    "montantPresente" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "montantAccepte" DOUBLE PRECISION,
    "debourseReel" DOUBLE PRECISION,
    "numeroOS" TEXT,
    "dateOS" TIMESTAMP(3),
    "delaiSupplementaire" TEXT,
    "potentielAcceptation" INTEGER NOT NULL DEFAULT 50,
    "statut" TEXT NOT NULL DEFAULT 'a_venir',
    "commentaire" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PrixNouveau_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SousTraitant" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "contact" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "paiementDirect" BOOLEAN NOT NULL DEFAULT false,
    "montantMarche" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "montantAS" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commentaire" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SousTraitant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvenantSousTraitant" (
    "id" TEXT NOT NULL,
    "sousTraitantId" TEXT NOT NULL,
    "numero" TEXT NOT NULL DEFAULT '',
    "libelle" TEXT NOT NULL DEFAULT '',
    "montant" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3),

    CONSTRAINT "AvenantSousTraitant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacturationSousTraitant" (
    "id" TEXT NOT NULL,
    "sousTraitantId" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "mois" INTEGER NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commentaire" TEXT,

    CONSTRAINT "FacturationSousTraitant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourrierChantier" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "reference" TEXT NOT NULL DEFAULT '',
    "objet" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'autre',
    "dateEnvoi" TIMESTAMP(3),
    "destinataire" TEXT NOT NULL DEFAULT '',
    "expediteur" TEXT NOT NULL DEFAULT '',
    "corps" TEXT NOT NULL DEFAULT '',
    "statut" TEXT NOT NULL DEFAULT 'brouillon',
    "lieu" TEXT,
    "modeEnvoi" TEXT,
    "copies" TEXT,
    "signataireNom" TEXT,
    "signataireFonction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourrierChantier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategorieEvenement" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "couleurBg" TEXT NOT NULL,
    "couleurBorder" TEXT NOT NULL,
    "couleurText" TEXT NOT NULL,
    "couleurPoint" TEXT NOT NULL,
    "estSysteme" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CategorieEvenement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvenementChantier" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "categorie" TEXT NOT NULL DEFAULT '',
    "categorieId" TEXT,
    "afficherFrise" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT,
    "courrierId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvenementChantier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FichierEvenement" (
    "id" TEXT NOT NULL,
    "evenementId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "taille" INTEGER NOT NULL,

    CONSTRAINT "FichierEvenement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneFicheEcart" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "evenementId" TEXT,
    "etude" TEXT NOT NULL DEFAULT '',
    "prevuDCE" TEXT NOT NULL DEFAULT '',
    "phaseTransitoire" TEXT NOT NULL DEFAULT '',
    "exe" TEXT NOT NULL DEFAULT '',
    "impacts" TEXT NOT NULL DEFAULT '',
    "delaisImpactes" TEXT NOT NULL DEFAULT '',
    "coutImpactes" TEXT NOT NULL DEFAULT '',
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "chapitre" TEXT,
    "estChapitre" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LigneFicheEcart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatriceDecisionnelle" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "acheteur" TEXT,
    "site" TEXT,
    "familleAchats" TEXT,
    "budgetTheorique" DOUBLE PRECISION,
    "devise" TEXT NOT NULL DEFAULT 'EUR',
    "seuilGo" DOUBLE PRECISION NOT NULL DEFAULT 60,
    "statut" TEXT NOT NULL DEFAULT 'brouillon',
    "bidComp" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatriceDecisionnelle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FournisseurCandidat" (
    "id" TEXT NOT NULL,
    "matriceId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "rang" INTEGER NOT NULL DEFAULT 0,
    "refOffre" TEXT,
    "dateOffre" TIMESTAMP(3),
    "paysFabrication" TEXT,
    "incoterm" TEXT,
    "montantOffre" DOUBLE PRECISION,
    "decision" TEXT NOT NULL DEFAULT 'en_attente',
    "couleurDecision" TEXT NOT NULL DEFAULT '#F2AB1B',

    CONSTRAINT "FournisseurCandidat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Critere" (
    "id" TEXT NOT NULL,
    "matriceId" TEXT NOT NULL,
    "famille" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "coefficient" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "type" TEXT NOT NULL DEFAULT 'note_1_3',
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Critere_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotationCritere" (
    "id" TEXT NOT NULL,
    "critereId" TEXT NOT NULL,
    "fournisseurId" TEXT NOT NULL,
    "valeurTexte" TEXT,
    "note" INTEGER,
    "valeurBool" BOOLEAN,
    "commentaire" TEXT,
    "estNonConformiteMajeure" BOOLEAN NOT NULL DEFAULT false,
    "estNonConformiteNegociable" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "NotationCritere_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ProjetMember_userId_projetId_key" ON "ProjetMember"("userId", "projetId");

-- CreateIndex
CREATE INDEX "LigneDE_projetId_ordre_idx" ON "LigneDE"("projetId", "ordre");

-- CreateIndex
CREATE UNIQUE INDEX "Situation_projetId_numero_key" ON "Situation"("projetId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "LigneSituation_situationId_ligneDEId_key" ON "LigneSituation"("situationId", "ligneDEId");

-- CreateIndex
CREATE UNIQUE INDEX "FacturationSousTraitant_sousTraitantId_annee_mois_key" ON "FacturationSousTraitant"("sousTraitantId", "annee", "mois");

-- CreateIndex
CREATE UNIQUE INDEX "CategorieEvenement_projetId_nom_key" ON "CategorieEvenement"("projetId", "nom");

-- CreateIndex
CREATE UNIQUE INDEX "NotationCritere_critereId_fournisseurId_key" ON "NotationCritere"("critereId", "fournisseurId");

-- AddForeignKey
ALTER TABLE "ProjetMember" ADD CONSTRAINT "ProjetMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjetMember" ADD CONSTRAINT "ProjetMember_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneDE" ADD CONSTRAINT "LigneDE_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoTraitant" ADD CONSTRAINT "CoTraitant_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Situation" ADD CONSTRAINT "Situation_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneSituation" ADD CONSTRAINT "LigneSituation_situationId_fkey" FOREIGN KEY ("situationId") REFERENCES "Situation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneSituation" ADD CONSTRAINT "LigneSituation_ligneDEId_fkey" FOREIGN KEY ("ligneDEId") REFERENCES "LigneDE"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrixNouveau" ADD CONSTRAINT "PrixNouveau_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SousTraitant" ADD CONSTRAINT "SousTraitant_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvenantSousTraitant" ADD CONSTRAINT "AvenantSousTraitant_sousTraitantId_fkey" FOREIGN KEY ("sousTraitantId") REFERENCES "SousTraitant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturationSousTraitant" ADD CONSTRAINT "FacturationSousTraitant_sousTraitantId_fkey" FOREIGN KEY ("sousTraitantId") REFERENCES "SousTraitant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourrierChantier" ADD CONSTRAINT "CourrierChantier_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategorieEvenement" ADD CONSTRAINT "CategorieEvenement_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvenementChantier" ADD CONSTRAINT "EvenementChantier_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvenementChantier" ADD CONSTRAINT "EvenementChantier_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "CategorieEvenement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvenementChantier" ADD CONSTRAINT "EvenementChantier_courrierId_fkey" FOREIGN KEY ("courrierId") REFERENCES "CourrierChantier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FichierEvenement" ADD CONSTRAINT "FichierEvenement_evenementId_fkey" FOREIGN KEY ("evenementId") REFERENCES "EvenementChantier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneFicheEcart" ADD CONSTRAINT "LigneFicheEcart_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneFicheEcart" ADD CONSTRAINT "LigneFicheEcart_evenementId_fkey" FOREIGN KEY ("evenementId") REFERENCES "EvenementChantier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatriceDecisionnelle" ADD CONSTRAINT "MatriceDecisionnelle_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FournisseurCandidat" ADD CONSTRAINT "FournisseurCandidat_matriceId_fkey" FOREIGN KEY ("matriceId") REFERENCES "MatriceDecisionnelle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Critere" ADD CONSTRAINT "Critere_matriceId_fkey" FOREIGN KEY ("matriceId") REFERENCES "MatriceDecisionnelle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotationCritere" ADD CONSTRAINT "NotationCritere_critereId_fkey" FOREIGN KEY ("critereId") REFERENCES "Critere"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotationCritere" ADD CONSTRAINT "NotationCritere_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "FournisseurCandidat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

