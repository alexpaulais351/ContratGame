import { redirect } from 'next/navigation'
export default function ProjetIndex({ params }: { params: { id: string } }) {
  redirect(`/projets/${params.id}/infos`)
}
