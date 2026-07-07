import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getNotes } from '@/lib/notes'
import { NotesClient } from '@/components/notes/NotesClient'

export default async function NotesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return <div>Please sign in</div>
  }

  const notes = await getNotes(session.accessToken)

  return <NotesClient initialNotes={notes} />
}
