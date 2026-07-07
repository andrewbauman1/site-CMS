import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDrafts } from '@/lib/drafts'
import { DraftsClient } from '@/components/drafts/DraftsClient'

export default async function DraftsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return <div>Please sign in</div>
  }

  const drafts = await getDrafts(session.user.id)

  return <DraftsClient initialDrafts={drafts} />
}
