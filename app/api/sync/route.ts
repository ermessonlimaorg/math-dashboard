import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { syncPayloadSchema } from '@/lib/zodSchemas'
export const dynamic = 'force-dynamic'

const { SYNC_API_KEY } = process.env

async function ensureQuestionId(externalId: string, map: Map<string, string>) {
  if (map.has(externalId)) return map.get(externalId)!
  const question = await prisma.question.findUnique({
    where: { externalId },
    select: { id: true },
  })
  if (!question) return undefined
  map.set(externalId, question.id)
  return question.id
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = syncPayloadSchema.parse(body)

    if (SYNC_API_KEY) {
      const providedKey = req.headers.get('x-api-key') ?? parsed.apiKey
      if (providedKey !== SYNC_API_KEY) {
        return new NextResponse('Unauthorized', { status: 401 })
      }
    }

    const summary = {
      questions: 0,
      solutionSteps: 0,
      attempts: 0,
      feedbacks: 0,
    }

    const questionIdByExternal = new Map<string, string>()

    if (parsed.questions?.length) {
      for (const question of parsed.questions) {
        const data = {
          title: question.title,
          content: question.content,
          topic: question.topic ?? null,
          difficulty: question.difficulty ?? null,
        }
        const saved = await prisma.question.upsert({
          where: { externalId: question.externalId },
          update: data,
          create: {
            ...data,
            externalId: question.externalId,
          },
        })
        questionIdByExternal.set(question.externalId, saved.id)
        summary.questions += 1
      }
    }

    if (parsed.solutionSteps?.length) {
      for (const step of parsed.solutionSteps) {
        let questionId = step.questionId
        if (!questionId && step.questionExternalId) {
          questionId = await ensureQuestionId(step.questionExternalId, questionIdByExternal)
        }
        if (!questionId) {
          return new NextResponse(`Question not found for solution step ${step.externalId ?? ''}`, {
            status: 400,
          })
        }

        const data = {
          questionId,
          order: step.order,
          content: step.content,
        }

        const where = step.externalId
          ? { externalId: step.externalId }
          : { questionId_order: { questionId, order: step.order } }

        await prisma.solutionStep.upsert({
          where,
          update: data,
          create: {
            ...data,
            externalId: step.externalId ?? undefined,
          },
        })
        summary.solutionSteps += 1
      }
    }

    if (parsed.attempts?.length) {
      for (const attempt of parsed.attempts) {
        let questionId = attempt.questionId
        if (!questionId && attempt.questionExternalId) {
          questionId = await ensureQuestionId(attempt.questionExternalId, questionIdByExternal)
        }
        if (!questionId) {
          return new NextResponse(`Question not found for attempt ${attempt.externalId ?? ''}`, {
            status: 400,
          })
        }

        const data: any = {
          questionId,
          userId: attempt.userId ?? null,
          correct: attempt.correct,
          timeMs: attempt.timeMs,
          attempts: attempt.attempts ?? 1,
          source: attempt.source ?? 'app',
          topic: attempt.topic,
          difficulty: attempt.difficulty,
          appUserId: attempt.appUserId ?? null,
          studentName: attempt.studentName ?? null,
        }
        if (attempt.createdAt) data.createdAt = new Date(attempt.createdAt)

        if (attempt.externalId) {
          await prisma.attempt.upsert({
            where: { externalId: attempt.externalId },
            update: data,
            create: {
              ...data,
              externalId: attempt.externalId,
            },
          })
        } else {
          await prisma.attempt.create({ data })
        }
        summary.attempts += 1
      }
    }

    if (parsed.feedbacks?.length) {
      for (const feedback of parsed.feedbacks) {
        let questionId = feedback.questionId
        if (!questionId && feedback.questionExternalId) {
          questionId = await ensureQuestionId(feedback.questionExternalId, questionIdByExternal)
        }
        const data: any = {
          questionId,
          userId: feedback.userId ?? null,
          rating: feedback.rating,
          comment: feedback.comment ?? null,
          appUserId: feedback.appUserId ?? null,
          studentName: feedback.studentName ?? null,
        }
        if (feedback.createdAt) data.createdAt = new Date(feedback.createdAt)

        if (feedback.externalId) {
          await prisma.feedback.upsert({
            where: { externalId: feedback.externalId },
            update: data,
            create: {
              ...data,
              externalId: feedback.externalId,
            },
          })
        } else {
          await prisma.feedback.create({ data })
        }
        summary.feedbacks += 1
      }
    }

    return NextResponse.json({ ok: true, ...summary })
  } catch (e: any) {
    return new NextResponse(e?.message || 'Invalid payload', { status: 400 })
  }
}
