import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getStories } from '@/lib/stories'
import { StoriesClient } from '@/components/stories/StoriesClient'

export default async function StoriesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return <div>Please sign in</div>
  }

  const { stories, sha } = await getStories(session.accessToken)

  return <StoriesClient initialStories={stories} initialSha={sha} />
}
