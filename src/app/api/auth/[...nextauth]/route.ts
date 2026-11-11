// Handler NextAuth (requis par la librairie — ce n'est pas une API Route métier).
import { handlers } from '@/lib/auth'
export const { GET, POST } = handlers
