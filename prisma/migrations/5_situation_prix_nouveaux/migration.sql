-- Prix nouveaux (OS reçu) intégrés aux situations de travaux : avancement cumulé par situation.
CREATE TABLE "LigneSituationPN" (
    "id" TEXT NOT NULL,
    "situationId" TEXT NOT NULL,
    "prixNouveauId" TEXT NOT NULL,
    "avancement" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "montantBase" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "LigneSituationPN_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LigneSituationPN_situationId_prixNouveauId_key" ON "LigneSituationPN"("situationId", "prixNouveauId");

ALTER TABLE "LigneSituationPN" ADD CONSTRAINT "LigneSituationPN_situationId_fkey" FOREIGN KEY ("situationId") REFERENCES "Situation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LigneSituationPN" ADD CONSTRAINT "LigneSituationPN_prixNouveauId_fkey" FOREIGN KEY ("prixNouveauId") REFERENCES "PrixNouveau"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Sécurité Supabase : accès uniquement via Prisma, jamais via l'API PostgREST.
ALTER TABLE "LigneSituationPN" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON "LigneSituationPN" FROM anon, authenticated;
  END IF;
END $$;
