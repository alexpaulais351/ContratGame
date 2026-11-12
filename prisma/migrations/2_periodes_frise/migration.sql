-- Périodes de la frise chronologique du journal (barres sur une plage de dates)
-- CreateTable
CREATE TABLE "PeriodeFrise" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "sousTitre" TEXT,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "couleur" TEXT NOT NULL DEFAULT 'bleu',
    "afficherFrise" BOOLEAN NOT NULL DEFAULT true,
    "zoneFond" BOOLEAN NOT NULL DEFAULT false,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PeriodeFrise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PeriodeFrise_projetId_idx" ON "PeriodeFrise"("projetId");

-- AddForeignKey
ALTER TABLE "PeriodeFrise" ADD CONSTRAINT "PeriodeFrise_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
