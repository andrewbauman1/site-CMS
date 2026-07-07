export interface Note {
  path: string
  name: string
  sha: string
  content: string
  tags?: string
  lang?: string
  location?: string
  date?: string
}

export async function getNotes(accessToken: string): Promise<Note[]> {
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO

  if (!owner || !repo) {
    throw new Error('GitHub configuration missing')
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/_notes`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
      }
    }
  )

  if (!response.ok) {
    if (response.status === 404) {
      return []
    }
    throw new Error(`Failed to fetch notes: ${response.status}`)
  }

  const files = await response.json()

  const notes = await Promise.all(
    files.map(async (file: any) => {
      const contentResponse = await fetch(file.url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github+json',
        }
      })

      if (!contentResponse.ok) return null

      const contentData = await contentResponse.json()
      const content = Buffer.from(contentData.content, 'base64').toString('utf-8')

      // Parse frontmatter (YAML-aware)
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
      let metadata: any = {}

      if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1]
        const lines = frontmatter.split('\n')
        let currentKey: string | null = null
        let arrayValues: string[] = []

        lines.forEach((line, index) => {
          // Check if this is an array item (starts with - )
          if (line.trim().startsWith('-')) {
            const value = line.trim().substring(1).trim()
            arrayValues.push(value)

            // If next line doesn't start with -, or this is last line, save the array
            const nextLine = lines[index + 1]
            if (!nextLine || !nextLine.trim().startsWith('-')) {
              if (currentKey) {
                metadata[currentKey] = arrayValues.join(',')
                currentKey = null
                arrayValues = []
              }
            }
          } else if (line.includes(':')) {
            // Regular key: value pair
            const [key, ...valueParts] = line.split(':')
            const value = valueParts.join(':').trim()

            if (key && value) {
              // Has immediate value
              metadata[key.trim()] = value
            } else if (key) {
              // Key with no immediate value (likely followed by array)
              currentKey = key.trim()
              arrayValues = []
            }
          }
        })
      }

      return {
        path: file.path,
        name: file.name,
        sha: file.sha,
        content: content,
        ...metadata
      }
    })
  )

  return notes.filter(Boolean) as Note[]
}
