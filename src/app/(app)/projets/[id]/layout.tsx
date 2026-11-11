import { getProjetPourPage } from '@/lib/auth-helpers'
import { ProjetNav } from '@/components/layout/ProjetNav'

export default async function ProjetLayout({ children, params }: { children: React.ReactNode; params: { id: string } }) {
  const { projet } = await getProjetPourPage(params.id)
  return (
    <div className="flex min-h-screen flex-col">
      <ProjetNav projetId={projet.id} nomProjet={projet.name} modulesMasques={projet.modulesMasques} />
      <main className="min-w-0 flex-1 p-4 lg:p-6">{children}</main>
    </div>
  )
}
