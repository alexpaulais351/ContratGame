-- Liste de diffusion du chantier (module « Diffusion ») : contacts du projet utilisés comme destinataires / copies des courriers.
-- CreateTable
CREATE TABLE "ContactDiffusion" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "organisation" TEXT NOT NULL,
    "civilite" TEXT,
    "prenom" TEXT,
    "nom" TEXT,
    "fonction" TEXT,
    "role" TEXT NOT NULL,
    "email" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "destinataireParDefaut" BOOLEAN NOT NULL DEFAULT false,
    "copieParDefaut" BOOLEAN NOT NULL DEFAULT false,
    "diffusionCR" BOOLEAN NOT NULL DEFAULT true,
    "commentaire" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactDiffusion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactDiffusion_projetId_ordre_idx" ON "ContactDiffusion"("projetId", "ordre");

-- AddForeignKey
ALTER TABLE "ContactDiffusion" ADD CONSTRAINT "ContactDiffusion_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE CASCADE ON UPDATE CASCADE;



-- Sécurité Supabase : table accessible uniquement par Prisma (rôle propriétaire), jamais via l'API PostgREST.
ALTER TABLE "ContactDiffusion" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON "ContactDiffusion" FROM anon, authenticated;
  END IF;
END $$;
