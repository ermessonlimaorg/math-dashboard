import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

function formatDay(date: Date) {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

export async function GET() {
  try {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - 13) // últimas 14 datas (incluindo hoje)

    const questions = await prisma.question.findMany({
      where: {
        OR: [
          { lastAiEvaluatedAt: { gte: start } },
          { AND: [{ lastAiEvaluatedAt: null }, { createdAt: { gte: start } }] },
        ],
      },
      select: { createdAt: true, lastAiEvaluatedAt: true, aiScore: true },
    })

    const dailyMap: Record<string, number> = {}
    const scoreMap: Record<string, { sum: number; count: number }> = {}
    const scoreBuckets: Record<string, number> = {
      '0-49': 0,
      '50-69': 0,
      '70-84': 0,
      '85-100': 0,
    }

    // preenche datas vazias para manter eixo contínuo
    for (let i = 0; i < 14; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const key = formatDay(d)
      dailyMap[key] = 0
      scoreMap[key] = { sum: 0, count: 0 }
    }

    questions.forEach((q) => {
      const refDate = q.lastAiEvaluatedAt ?? q.createdAt
      const key = formatDay(refDate)
      dailyMap[key] = (dailyMap[key] || 0) + 1
      if (typeof q.aiScore === 'number') {
        scoreMap[key] = {
          sum: (scoreMap[key]?.sum || 0) + q.aiScore,
          count: (scoreMap[key]?.count || 0) + 1,
        }

        if (q.aiScore <= 49) scoreBuckets['0-49'] += 1
        else if (q.aiScore <= 69) scoreBuckets['50-69'] += 1
        else if (q.aiScore <= 84) scoreBuckets['70-84'] += 1
        else scoreBuckets['85-100'] += 1
      }
    })

    const dailyCounts = Object.entries(dailyMap).map(([date, total]) => ({
      date,
      total,
      avgAiScore:
        scoreMap[date]?.count ? Number((scoreMap[date].sum / scoreMap[date].count).toFixed(1)) : null,
    }))

    const scoreDistribution = Object.entries(scoreBuckets).map(([label, value]) => ({ label, value }))

    return NextResponse.json({ dailyCounts, scoreDistribution })
  } catch (e: any) {
    return NextResponse.json({ dailyCounts: [], scoreDistribution: [], error: e?.message }, { status: 200 })
  }
}
