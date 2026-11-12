'use client'
import { useId } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { LogIn, UserPlus } from 'lucide-react'
import { connexion, inscription, type EtatForm } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const VIDE: EtatForm = {}

function Champ(props: {
  label: string
  name: string
  type?: string
  autoComplete?: string
  required?: boolean
  minLength?: number
  hint?: string
}) {
  const id = `${useId()}-${props.name}`
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id}>{props.label}</Label>
      <Input
        id={id}
        name={props.name}
        type={props.type ?? 'text'}
        autoComplete={props.autoComplete}
        required={props.required}
        minLength={props.minLength}
        className="h-11 text-base"
      />
      {props.hint && <p className="text-xs text-vinci-bleu-clair">{props.hint}</p>}
    </div>
  )
}

function Retour({ etat }: { etat: EtatForm }) {
  if (etat.error)
    return (
      <p role="alert" className="rounded-md border border-vinci-rouge bg-vinci-rouge-tres-clair px-3 py-2 text-sm text-vinci-rouge-fonce">
        {etat.error}
      </p>
    )
  if (etat.message)
    return (
      <p role="status" className="rounded-md border border-vinci-bleu-clair bg-vinci-bleu-tres-clair px-3 py-2 text-sm text-vinci-bleu-fonce">
        {etat.message}
      </p>
    )
  return null
}

function Envoyer({ icone, texte, texteEnCours }: { icone: React.ReactNode; texte: string; texteEnCours: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="lg" disabled={pending} className="h-12 text-base">
      {icone}
      {pending ? texteEnCours : texte}
    </Button>
  )
}

export function LoginForm({ callbackUrl, ongletInitial }: { callbackUrl: string; ongletInitial: 'connexion' | 'inscription' }) {
  const [etatCo, actionCo] = useFormState(connexion, VIDE)
  const [etatIns, actionIns] = useFormState(inscription, VIDE)

  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle className="text-vinci-bleu">Compte</CardTitle>
        <CardDescription>Connectez-vous, ou créez un compte : votre demande sera transmise à l&apos;administrateur.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={ongletInitial}>
          <TabsList className="mb-2 grid h-auto w-full grid-cols-2 bg-vinci-gris-clair">
            <TabsTrigger value="connexion" className="min-h-10 data-[state=active]:text-vinci-bleu">
              Connexion
            </TabsTrigger>
            <TabsTrigger value="inscription" className="min-h-10 data-[state=active]:text-vinci-bleu">
              Créer un compte
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connexion">
            <form action={actionCo} className="flex flex-col gap-4" aria-label="Connexion">
              <input type="hidden" name="callbackUrl" value={callbackUrl} />
              <Champ label="Adresse e-mail" name="email" type="email" autoComplete="email" required />
              <Champ label="Mot de passe" name="password" type="password" autoComplete="current-password" required />
              <Retour etat={etatCo} />
              <Envoyer icone={<LogIn />} texte="Se connecter" texteEnCours="Connexion…" />
            </form>
          </TabsContent>

          <TabsContent value="inscription">
            <form action={actionIns} className="flex flex-col gap-4" aria-label="Créer un compte">
              <Champ label="Nom complet" name="nom" autoComplete="name" required />
              <Champ label="Entreprise" name="entreprise" autoComplete="organization" required />
              <Champ label="Adresse e-mail" name="email" type="email" autoComplete="email" required />
              <Champ label="Mot de passe" name="password" type="password" autoComplete="new-password" required minLength={8} hint="8 caractères minimum." />
              <Champ label="Confirmation du mot de passe" name="confirmation" type="password" autoComplete="new-password" required minLength={8} />
              <p className="text-xs text-black/70">
                Votre compte sera actif après validation par l&apos;administrateur. Aucune donnée n&apos;est accessible avant.
              </p>
              <Retour etat={etatIns} />
              <Envoyer icone={<UserPlus />} texte="Demander la création du compte" texteEnCours="Envoi de la demande…" />
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
