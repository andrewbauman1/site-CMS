import { posix } from 'node:path'

export type ContentKind = 'post' | 'note'

const PATTERNS: Record<ContentKind, RegExp> = {
  post: /^_posts\/\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/,
  note: /^_notes\/[\w:-]+-[a-z]{2}\.md$/,
}

const DIRS: Record<ContentKind, string> = {
  post: '_posts/',
  note: '_notes/',
}

export function assertSafeContentPath(path: unknown, kind: ContentKind): string {
  if (typeof path !== 'string' || path.length === 0 || path.length > 200) {
    throw new Error('Invalid path')
  }

  if (!PATTERNS[kind].test(path)) {
    throw new Error('Invalid path')
  }

  const normalized = posix.normalize(path)
  if (normalized !== path || !normalized.startsWith(DIRS[kind])) {
    throw new Error('Invalid path')
  }

  return path
}
