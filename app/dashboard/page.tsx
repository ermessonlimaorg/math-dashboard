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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Painel</h1>
        <p className="text-sm text-gray-500">Resumo das questões sincronizadas e classificadas pela IA.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Questões" value={data.questionsCount} />
        <MetricCard title="Usuários únicos" value={data.uniqueUsers} />
        <MetricCard title="Pendentes de IA" value={data.pendingClassify} />
      </div>
      <DashboardCharts />
      {!data.dbHealthy && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg p-3">
          Não foi possível conectar ao banco. Algumas informações podem não aparecer.
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="mb-3 font-semibold text-gray-900">Últimas questões</div>
        <div className="divide-y">
          {data.latest.map((q) => {
            const user = q.attempts[0]
            const topic = q.topic || q.aiTopic || 'Matemática'
            return (
              <Link
                key={q.id}
                href={`/questions/${q.id}`}
                className="block py-3 hover:bg-gray-50 transition rounded-lg -mx-2 px-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{q.title}</div>
                    <div className="text-xs text-gray-500">
                      {user?.studentName ?? 'Sem nome'} {user?.appUserId ? `(${user.appUserId})` : ''}
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="px-2 py-1 rounded-full bg-orange-50 text-orange-700">{topic}</span>
                    {typeof q.aiScore === 'number' && (
                      <span className="px-2 py-1 rounded-full bg-green-50 text-green-700">IA: {q.aiScore}</span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-700 mt-2 line-clamp-2">{q.content}</p>
                <div className="text-xs text-gray-400 mt-1">{new Date(q.createdAt).toLocaleString('pt-BR')}</div>
              </Link>
            )
          })}
          {data.latest.length === 0 && (
            <div className="py-6 text-center text-sm text-gray-500">Nenhuma questão cadastrada ainda.</div>
          )}
        </div>
      </div>


    </div>
  )
}
