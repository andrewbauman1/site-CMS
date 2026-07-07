import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDashboardData } from '@/lib/dashboard'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await getDashboardData(session.accessToken)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Failed to fetch dashboard stats:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
