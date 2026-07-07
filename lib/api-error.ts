import { NextResponse } from 'next/server'

export function errorResponse(error: unknown, fallbackMessage: string, status = 500) {
  console.error(fallbackMessage, error)
  return NextResponse.json({ error: fallbackMessage }, { status })
}
