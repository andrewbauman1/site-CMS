import { prisma } from '@/lib/prisma'

export async function getDrafts(userId: string) {
  return prisma.draft.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' }
  })
}
