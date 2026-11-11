import { createHash } from 'node:crypto'

/** Version synchrone (runtime Node) — même résultat que getAuthSecret(). */
export function getAuthSecretSync(): string {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('AUTH_SECRET ou DATABASE_URL doit être défini')
  return createHash('sha256').update('conduc-rail-auth:' + url).digest('hex')
}
