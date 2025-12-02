import prisma from '@/lib/prisma'

async function getQuestion(id: string) {
  const q = await prisma.question.findUnique({
    where: { id },
    include: {
      steps: { orderBy: { order: 'asc' } },
      attempts: true,
      feedbacks: true
    }
  })
  return q
}

export default async function QuestionDetail({ params }: { params: { id: string } }) {
  const q = await getQuestion(params.id)
  if (!q) return <div className="text-red-600">Questão não encontrada.</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-black">{q.title}</h1>
        <div className="text-sm text-gray-500">{q.topic}</div>
      </div>

      <div className="bg-white rounded shadow-sm p-4">
        <div className="font-medium mb-1">Questão</div>
        <p className="text-gray-800 whitespace-pre-wrap">{q.content}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* métricas removidas a pedido */}
      </div>

      <div className="bg-white rounded shadow-sm p-4">
        <div className="font-medium mb-2">Solução passo a passo</div>
        <ol className="list-decimal pl-6 space-y-2">
          {q.steps.map(s => (
            <li key={s.id} className="whitespace-pre-wrap">{s.content}</li>
          ))}
        </ol>
      </div>

      <div className="bg-white rounded shadow-sm p-4">
        <div className="font-medium mb-2">Tentativas (app offline)</div>
        {q.attempts.length === 0 ? (
          <div className="text-sm text-gray-500">Nenhuma tentativa ainda.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="text-left px-3 py-2">Aluno</th>
                  <th className="text-left px-3 py-2">Origem</th>
                  <th className="text-left px-3 py-2">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {q.attempts.map(a => (
                  <tr key={a.id} className="border-t">
                    <td className="px-3 py-2">
                      {a.studentName || '—'}
                      {a.appUserId ? <span className="text-xs text-gray-400 ml-2">({a.appUserId})</span> : null}
                    </td>
                    <td className="px-3 py-2">{a.source}</td>
                    <td className="px-3 py-2">{a.createdAt.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded shadow-sm p-4">
        <div className="font-medium mb-2">Feedback dos usuários</div>
        {q.feedbacks.length === 0 ? (
          <div className="text-sm text-gray-500">Nenhum feedback ainda.</div>
        ) : (
          <div className="space-y-3">
            {q.feedbacks.map(f => (
              <div key={f.id} className="border rounded-lg p-3 bg-gray-50">
                <div className="flex items-center justify-between text-sm font-semibold text-gray-900">
                  <span>{'⭐'.repeat(f.rating)}</span>
                  <span className="text-xs text-gray-500">{f.createdAt.toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-700 mt-1">
                  {f.comment || 'Sem comentário adicional.'}
                </p>
                {(f.studentName || f.appUserId) && (
                  <div className="text-xs text-gray-500 mt-2">
                    Aluno: {f.studentName ?? '—'} {f.appUserId ? `(${f.appUserId})` : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
