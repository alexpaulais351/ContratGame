export const metadata = { title: 'Assurances — Contrat Game' }

export default function AssurancesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <header className="sticky top-0 z-30 border-b border-vinci-gris-bordure bg-white">
        <div className="px-4 pb-3 pt-4 lg:px-6">
          <h1 className="page-titre">Assurances</h1>
          <p className="text-xs text-vinci-texte-secondaire">
            Assurances et garanties d’un chantier : qui assure quoi, quand, comment réagir en cas de sinistre.
          </p>
        </div>
      </header>
      <main className="p-4 lg:p-6">{children}</main>
    </div>
  )
}
