import prisma from '@/lib/prisma'
import MetricCard from '@/components/cards/MetricCard'
import Link from 'next/link'
import DashboardCharts from '@/components/DashboardCharts'

async function getDashboardData() {
  try {
    const [questionsCount, latest] = await Promise.all([
      prisma.question.count(),
      prisma.question.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          content: true,
          topic: true,
          difficulty: true,
          aiTopic: true,
          aiDifficulty: true,
          aiScore: true,
          createdAt: true,
          attempts: { select: { appUserId: true, studentName: true }, take: 1, orderBy: { createdAt: 'desc' } },
        },
      }),
    ])

    const uniqueUsers = await prisma.attempt.groupBy({
      by: ['appUserId'],
      where: { appUserId: { not: null } },
      _count: { _all: true },
    })

    const pendingClassify = await prisma.question.count({
      where: { OR: [{ topic: null }, { difficulty: null }, { aiTopic: null }, { aiDifficulty: null }] },
    })

    return {
      questionsCount,
      latest,
      uniqueUsers: uniqueUsers.length,
      pendingClassify,
      dbHealthy: true,
    }
  } catch (e) {
    return {
      questionsCount: 0,
      latest: [],
      uniqueUsers: 0,
      pendingClassify: 0,
      dbHealthy: false,
    }
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Painel</h1>
        <p className="text-sm md:text-base text-slate-500 mt-1">Resumo das questões sincronizadas e classificadas pela IA.</p>
      </div>

      <div data-tour="metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <MetricCard title="Questões" value={data.questionsCount} icon="questions" />
        <MetricCard title="Usuários únicos" value={data.uniqueUsers} icon="users" />
        <MetricCard title="Pendentes de IA" value={data.pendingClassify} icon="pending" />
      </div>

      <div data-tour="charts">
        <DashboardCharts />
      </div>

      {!data.dbHealthy && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Não foi possível conectar ao banco. Algumas informações podem não aparecer.</span>
        </div>
      )}

      <div data-tour="recent-questions" className="card">
        <div className="p-4 md:p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Últimas questões</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {data.latest.map((q) => {
            const user = q.attempts[0]
            const topic = q.topic || q.aiTopic || 'Matemática'
            return (
              <Link
                key={q.id}
                href={`/questions/${q.id}`}
                className="block p-4 md:p-5 hover:bg-slate-50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{q.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {user?.studentName ?? 'Sem nome'} {user?.appUserId ? `(${user.appUserId})` : ''}
                    </div>
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">{q.content}</p>
                    <div className="text-xs text-slate-400 mt-2">{new Date(q.createdAt).toLocaleString('pt-BR')}</div>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
                    <span className="inline-flex px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-100 to-rose-100 text-orange-700 text-xs font-medium">
                      {topic}
                    </span>
                    {typeof q.aiScore === 'number' && (
                      <span className="inline-flex px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                        IA: {q.aiScore}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
          {data.latest.length === 0 && (
            <div className="p-8 md:p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm text-slate-500">Nenhuma questão cadastrada ainda.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
