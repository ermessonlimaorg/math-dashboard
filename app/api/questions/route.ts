import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createQuestionSchema } from '@/lib/zodSchemas'
import { logError, logInfo } from '@/lib/logger'
import { classifyQuestionWithAI } from '@/lib/aiClassify'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get('q') || undefined
  const topic = url.searchParams.get('topic') || undefined
  const difficulty = url.searchParams.get('difficulty') || undefined

  const where: any = {}
  if (q) where.OR = [
    { title: { contains: q, mode: 'insensitive' } },
    { content: { contains: q, mode: 'insensitive' } },
    { topic: { contains: q, mode: 'insensitive' } }
  ]
  if (topic) where.topic = topic
  if (difficulty) where.difficulty = difficulty

  const items = await prisma.question.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      content: true,
      title: true,
      topic: true,
      difficulty: true,
      aiTopic: true,
      aiDifficulty: true,
      aiScore: true,
      createdAt: true,
      attempts: {
        select: { appUserId: true, studentName: true },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  })
  return NextResponse.json({ items })
}

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const parsed = createQuestionSchema.parse(json)
    let aiTopic: string | undefined
    let aiDifficulty: 'EASY' | 'MEDIUM' | 'HARD' | undefined
    let aiScore: number | undefined

    if (!parsed.topic || !parsed.difficulty) {
      const ai = await classifyQuestionWithAI(parsed.content)
      aiTopic = ai?.topic
      aiDifficulty = ai?.difficulty
      aiScore = ai?.score
    }

    const data = {
      title: parsed.title,
      content: parsed.content,
      topic: parsed.topic || aiTopic || 'Matemática',
      difficulty: parsed.difficulty || aiDifficulty,
      aiTopic,
      aiDifficulty,
      aiScore,
      lastAiEvaluatedAt: aiTopic || aiDifficulty || aiScore ? new Date() : null,
      externalId: parsed.externalId,
    }

    const item = parsed.externalId
      ? await prisma.question.upsert({
          where: { externalId: parsed.externalId },
          update: data,
          create: data,
        })
      : await prisma.question.create({ data })
    logInfo('question.create', { id: item.id })
    return NextResponse.json(item, { status: 201 })
  } catch (e: any) {
    logError('question.create.error', { error: e.message })
    return new NextResponse(e.message, { status: 400 })
  }
}
