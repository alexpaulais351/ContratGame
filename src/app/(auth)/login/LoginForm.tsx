'use client'
import { useFormState, useFormStatus } from 'react-dom'
import { connexion } from '@/actions/auth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Connexion…' : 'Se connecter'}
    </Button>
  )
}

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [erreur, action] = useFormState(connexion, null)
  return (
    <form action={action} className="space-y-4 p-6">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="password">Mot de passe</Label>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      {erreur && <p className="rounded-sm bg-vinci-rouge-tres-clair px-3 py-2 text-sm text-vinci-rouge">{erreur}</p>}
      <Submit />
    </form>
  )
}
