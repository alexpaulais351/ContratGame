import { redirect } from 'next/navigation'
import { Clock, LogOut, ShieldAlert } from 'lucide-react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deconnexion } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = { title: 'Compte en attente — Contrat Game' }

const TEXTES: Record<string, { titre: string; corps: string }> = {
  en_attente: {
    titre: 'Compte en attente de validation',
    corps:
      "Votre compte a bien été créé. L'administrateur doit l'accepter avant que vous puissiez accéder à l'outil et à vos projets. Vous pourrez vous connecter normalement une fois la demande acceptée.",
  },
  refuse: {
    titre: 'Demande de compte refusée',
    corps: "L'administrateur n'a pas accepté cette demande de compte. Aucune donnée n'est accessible. Contactez l'administrateur si vous pensez qu'il s'agit d'une erreur.",
  },
  suspendu: {
    titre: 'Compte suspendu',
    corps: "L'accès de ce compte a été suspendu par l'administrateur. Aucune donnée n'est accessible tant que le compte n'est pas réactivé.",
  },
}

export default async function CompteEnAttentePage({ searchParams }: { searchParams: { nouveau?: string } }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true, statut: true } })
  if (!user) redirect('/login')
  if (user.statut === 'approuve') redirect('/accueil')
  const texte = TEXTES[user.statut] ?? TEXTES.en_attente
  const bloque = user.statut !== 'en_attente'

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 pt-4">
      <Card className={bloque ? 'border-vinci-rouge' : 'border-vinci-bleu'}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${bloque ? 'text-vinci-rouge-fonce' : 'text-vinci-bleu'}`}>
            {bloque ? <ShieldAlert className="h-5 w-5" aria-hidden /> : <Clock className="h-5 w-5" aria-hidden />}
            {texte.titre}
          </CardTitle>
          <CardDescription>
            Compte : <strong>{user.email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {searchParams.nouveau && user.statut === 'en_attente' && (
            <p role="status" className="rounded-md border border-vinci-bleu-clair bg-vinci-bleu-tres-clair px-3 py-2 text-sm text-vinci-bleu-fonce">
              Votre demande a été transmise à l&apos;administrateur.
            </p>
          )}
          <p>{texte.corps}</p>
          <form action={deconnexion}>
            <Button type="submit" variant="outline" size="lg" className="btn-secondaire">
              <LogOut />
              Se déconnecter
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
