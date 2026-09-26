import { Metadata } from 'next'
import AdminPageContainer from './AdminPageContainer'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Admin Portal | UperAI',
  description: 'UperAI Administrator Management & Telemetry Dashboard',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminPage() {
  return <AdminPageContainer />
}
