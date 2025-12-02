import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { attemptSchema } from '@/lib/zodSchemas'
export const dynamic = 'force-dynamic'

export async function GET() {
  const items = await prisma.attempt.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50
  })
  return NextResponse.json({ items })
}

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const parsed = attemptSchema.parse(json)

    let questionId = parsed.questionId
    if (!questionId && parsed.questionExternalId) {
      const q = await prisma.question.findUnique({ where: { externalId: parsed.questionExternalId } })
      if (!q) return new NextResponse('Question not found for externalId', { status: 400 })
      questionId = q.id
    }
    if (!questionId) return new NextResponse('Missing questionId', { status: 400 })

    const data: any = {
      questionId,
      userId: parsed.userId,
      correct: parsed.correct,
      timeMs: parsed.timeMs,
      attempts: parsed.attempts ?? 1,
      source: parsed.source ?? 'app',
      topic: parsed.topic,
      difficulty: parsed.difficulty,
      appUserId: parsed.appUserId ?? null,
      studentName: parsed.studentName ?? null
    }

    if (parsed.createdAt) data.createdAt = new Date(parsed.createdAt)

    const item = await prisma.attempt.create({ data })
    return NextResponse.json(item, { status: 201 })
  } catch (e: any) {
    return new NextResponse(e.message, { status: 400 })
  }
}
