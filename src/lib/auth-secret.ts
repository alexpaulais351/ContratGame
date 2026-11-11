// Clé de signature des sessions (JWT).
// AUTH_SECRET si défini ; sinon dérivée de DATABASE_URL (déjà secrète, côté serveur uniquement),
// pour n'avoir qu'une seule variable d'environnement à configurer au déploiement.
const PREFIXE = 'conduc-rail-auth:'

function source(): string {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('AUTH_SECRET ou DATABASE_URL doit être défini')
  return PREFIXE + url
}

function hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Version asynchrone (Edge / middleware, Web Crypto). */
export async function getAuthSecret(): Promise<string> {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET
  const data = new TextEncoder().encode(source())
  return hex(await crypto.subtle.digest('SHA-256', data))
}
