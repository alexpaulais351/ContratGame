import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Encadré d'avertissement jaune VINCI (#F2AB1B / #FFF7D1). */
export function AlerteJaune({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      role="note"
      className={cn(
        'flex items-start gap-2 rounded-md border border-vinci-jaune border-l-4 bg-vinci-jaune-clair px-3 py-2 text-sm font-semibold text-black',
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-vinci-orange" aria-hidden />
      <div>{children}</div>
    </div>
  )
}
