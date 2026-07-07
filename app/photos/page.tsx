import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPhotos } from '@/lib/photos'
import { PhotosClient } from '@/components/photos/PhotosClient'
import { Card, CardContent } from '@/components/ui/card'

export default async function PhotosPage() {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Please sign in to view photos</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { photos, sha } = await getPhotos(session.accessToken)

  return <PhotosClient initialPhotos={photos} initialSha={sha} />
}
