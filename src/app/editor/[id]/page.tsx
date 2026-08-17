import { redirect } from 'next/navigation'

export default function SingleEditorPage({ params }: { params?: { id?: string } }) {
  if (params?.id) {
    redirect(`/editors/${params.id}`)
  }
  redirect('/editors')
}
