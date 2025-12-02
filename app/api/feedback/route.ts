import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { feedbackSchema } from '@/lib/zodSchemas'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const questionId = url.searchParams.get('questionId') || undefined

  const items = await prisma.feedback.findMany({
    where: questionId ? { questionId } : undefined,
    orderBy: { createdAt: 'desc' },
    take: questionId ? 100 : 50,
  })
  return NextResponse.json({ items })
}

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const parsed = feedbackSchema.parse(json)

    let questionId = parsed.questionId
    if (!questionId && parsed.questionExternalId) {
      const q = await prisma.question.findUnique({ where: { externalId: parsed.questionExternalId } })
      if (!q) return new NextResponse('Question not found for externalId', { status: 400 })
      questionId = q.id
    }

    const item = await prisma.feedback.create({
      data: {
        questionId: questionId ?? null,
        userId: parsed.userId ?? null,
        rating: parsed.rating,
        comment: parsed.comment,
        appUserId: parsed.appUserId ?? null,
        studentName: parsed.studentName ?? null,
        createdAt: parsed.createdAt ? new Date(parsed.createdAt) : undefined
      }
    })
    return NextResponse.json(item, { status: 201 })
  } catch (e: any) {
    return new NextResponse(e.message, { status: 400 })
  }
}
