-- Tickets : demandes des utilisateurs à l'administrateur.
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "auteurId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categorie" TEXT NOT NULL DEFAULT 'amelioration',
    "priorite" TEXT NOT NULL DEFAULT 'normale',
    "statut" TEXT NOT NULL DEFAULT 'nouveau',
    "page" TEXT,
    "reponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Ticket_statut_createdAt_idx" ON "Ticket"("statut", "createdAt");
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Sécurité Supabase : accès uniquement via Prisma, jamais via l'API PostgREST.
ALTER TABLE "Ticket" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON "Ticket" FROM anon, authenticated;
  END IF;
END $$;
