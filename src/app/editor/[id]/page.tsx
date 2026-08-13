'use client'

import PublicEditorProfilePage from '@/app/editors/[handle]/page'

export default function SingleEditorPage({ params }: { params?: { id?: string; handle?: string } }) {
  return <PublicEditorProfilePage params={params} />
}
