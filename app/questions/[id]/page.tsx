import prisma from '@/lib/prisma'
import Link from 'next/link'

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

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
  
  if (!q) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Questão não encontrada</h2>
        <p className="text-sm text-slate-500 mb-4">A questão que você está procurando não existe.</p>
        <Link href="/questions" className="btn-secondary">
          Voltar para questões
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <Link href="/questions" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Voltar
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{q.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {q.topic && (
              <span className="inline-flex px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-100 to-rose-100 text-orange-700 text-xs font-medium">
                {q.topic}
              </span>
            )}
            {q.difficulty && (
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                q.difficulty === 'EASY' ? 'bg-emerald-100 text-emerald-700' :
                q.difficulty === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                'bg-rose-100 text-rose-700'
              }`}>
                {q.difficulty === 'EASY' ? 'Fácil' : q.difficulty === 'MEDIUM' ? 'Médio' : 'Difícil'}
              </span>
            )}
            {typeof q.aiScore === 'number' && (
              <span className="inline-flex px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                Score IA: {q.aiScore}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="card p-4 md:p-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Enunciado</h2>
        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{q.content}</p>
      </div>

      {q.steps.length > 0 && (
        <div className="card p-4 md:p-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Solução passo a passo</h2>
          <div className="space-y-4">
            {q.steps.map((s, index) => (
              <div key={s.id} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center text-white text-sm font-semibold shadow-md shadow-orange-500/20">
                  {index + 1}
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-slate-700 whitespace-pre-wrap">{s.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="p-4 md:p-6 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Tentativas</h2>
        </div>
        {q.attempts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <p className="text-sm text-slate-500">Nenhuma tentativa ainda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Aluno</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Origem</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Criado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {q.attempts.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-900">{a.studentName || '—'}</span>
                      {a.appUserId && (
                        <span className="text-xs text-slate-400 ml-2">({a.appUserId})</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs">
                        {a.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(a.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="p-4 md:p-6 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Feedbacks</h2>
        </div>
        {q.feedbacks.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <p className="text-sm text-slate-500">Nenhum feedback ainda.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {q.feedbacks.map(f => (
              <div key={f.id} className="p-4 md:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-4 h-4 ${star <= f.rating ? 'text-amber-500' : 'text-slate-200'}`}
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      ))}
                    </div>
                    {(f.studentName || f.appUserId) && (
                      <span className="text-xs text-slate-500">
                        {f.studentName ?? '—'} {f.appUserId ? `(${f.appUserId})` : ''}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">{formatDate(f.createdAt)}</span>
                </div>
                <p className="text-sm text-slate-600 mt-2">
                  {f.comment || 'Sem comentário adicional.'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
