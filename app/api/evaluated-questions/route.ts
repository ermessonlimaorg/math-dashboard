import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

function qualityLabelFromScore(score: number | null | undefined) {
  if (score === null || score === undefined) return 'sem-avaliação'
  if (score >= 85) return 'excelente'
  if (score >= 70) return 'boa'
  if (score >= 50) return 'mediana'
  return 'precisa melhorar'
}

export async function GET() {
  const questions = await prisma.question.findMany({
    where: {
      OR: [
        { aiScore: { not: null } },
        { aiTopic: { not: null } },
        { aiDifficulty: { not: null } },
        { lastAiEvaluatedAt: { not: null } },
      ],
    },
    orderBy: { lastAiEvaluatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      content: true,
      topic: true,
      difficulty: true,
      aiTopic: true,
      aiDifficulty: true,
      aiScore: true,
      lastAiEvaluatedAt: true,
      createdAt: true,
    },
  })

  const items = questions.map((q) => ({
    id: q.id,
    titulo: q.title,
    enunciado: q.content,
    topicoOriginal: q.topic,
    dificuldadeOriginal: q.difficulty,
    topicoIA: q.aiTopic,
    dificuldadeIA: q.aiDifficulty,
    qualidadeIA: qualityLabelFromScore(q.aiScore),
    scoreIA: q.aiScore,
    avaliadoEm: q.lastAiEvaluatedAt,
    criadoEm: q.createdAt,
  }))

  return NextResponse.json({ items })
}
