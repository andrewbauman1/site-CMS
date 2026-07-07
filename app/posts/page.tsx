import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPosts } from '@/lib/posts'
import { PostsClient } from '@/components/posts/PostsClient'

export default async function PostsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return <div>Please sign in</div>
  }

  const posts = await getPosts(session.accessToken)

  return <PostsClient initialPosts={posts} />
}
