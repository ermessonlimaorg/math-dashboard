import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const logs = await prisma.syncLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const stats = await prisma.syncLog.aggregate({
      _count: { id: true },
      _sum: {
        questionsCount: true,
        stepsCount: true,
        attemptsCount: true,
        feedbacksCount: true,
      },
    })

    const successCount = await prisma.syncLog.count({
      where: { status: 'success' },
    })

    const errorCount = await prisma.syncLog.count({
      where: { status: 'error' },
    })

    return NextResponse.json({
      logs,
      stats: {
        totalSyncs: stats._count.id,
        successCount,
        errorCount,
        totalQuestions: stats._sum.questionsCount ?? 0,
        totalSteps: stats._sum.stepsCount ?? 0,
        totalAttempts: stats._sum.attemptsCount ?? 0,
        totalFeedbacks: stats._sum.feedbacksCount ?? 0,
      },
    })
  } catch (e: any) {
    return new NextResponse(e?.message || 'Erro ao buscar logs', { status: 500 })
  }
}
