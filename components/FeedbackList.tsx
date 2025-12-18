'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'

type Feedback = {
  id: string
  rating: number
  comment: string | null
  studentName: string | null
  appUserId: string | null
  createdAt: string
  questionId: string | null
  question?: { title: string | null }
}

type ParsedAI = {
  score?: number | null
  resumo?: string
  sugestoes?: string[]
}

function parseAiComment(comment: string | null | undefined): ParsedAI | null {
  if (!comment) return null
  let text = comment.trim()
  if (text.startsWith('```')) {
    text = text.replace(/^```(json)?/i, '').replace(/```$/i, '').trim()
  }
  try {
    const obj = JSON.parse(text)
    return {
      score: typeof obj.score === 'number' ? obj.score : null,
      resumo: typeof obj.resumo === 'string' ? obj.resumo : undefined,
      sugestoes: Array.isArray(obj.sugestoes) ? obj.sugestoes.filter(Boolean) : undefined,
    }
  } catch {
    return null
  }
}

export default function FeedbackList() {
  const [items, setItems] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/feedback')
      const json = await res.json()
      setItems(json.items || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const handler = () => load()
    window.addEventListener('feedback-updated', handler)
    return () => window.removeEventListener('feedback-updated', handler)
  }, [load])

  const itemPendingDelete = useMemo(
    () => items.find((f) => f.id === pendingDelete) || null,
    [items, pendingDelete]
  )

  async function confirmDelete() {
    if (!pendingDelete) return
    try {
      const res = await fetch(`/api/feedback/${pendingDelete}`, { method: 'DELETE' })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Falha ao excluir')
      }
      const deletedQuestionId = itemPendingDelete?.questionId
      setPendingDelete(null)
      await load()
      window.dispatchEvent(new CustomEvent('feedback-updated', { detail: { questionId: deletedQuestionId, action: 'delete' } }))
      toast.success('Feedback excluído')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao excluir')
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <div className="divide-y divide-slate-100">
        {items.length === 0 ? (
          <div className="p-8 md:p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <p className="text-sm text-slate-500">Nenhum feedback ainda.</p>
          </div>
        ) : (
          items.map((f) => (
            <div key={f.id} className="p-4 md:p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
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
                    {f.questionId && (
                      <Link href={`/questions/${f.questionId}`} className="text-sm text-orange-600 hover:text-orange-700 hover:underline">
                        {f.question?.title || 'Ver questão'}
                      </Link>
                    )}
                  </div>
                  {(f.studentName || f.appUserId) && (
                    <div className="text-xs text-slate-500 mt-1">
                      Aluno: {f.studentName ?? '—'} {f.appUserId ? `(${f.appUserId})` : ''}
                    </div>
                  )}
                  {(() => {
                    const ai = parseAiComment(f.comment)
                    if (ai) {
                      return (
                        <div className="mt-3 space-y-2">
                          {typeof ai.score === 'number' && (
                            <span className="inline-flex px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                              Score IA: {ai.score}
                            </span>
                          )}
                          {ai.resumo && <p className="text-sm text-slate-600">{ai.resumo}</p>}
                          {ai.sugestoes?.length ? (
                            <ul className="space-y-1">
                              {ai.sugestoes.map((s, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                                  <svg className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {s}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      )
                    }
                    return f.comment ? <p className="text-sm text-slate-600 mt-2">{f.comment}</p> : null
                  })()}
                  <div className="text-xs text-slate-400 mt-2">{new Date(f.createdAt).toLocaleString('pt-BR')}</div>
                </div>
                <button
                  onClick={() => setPendingDelete(f.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-sm font-medium transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {itemPendingDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Excluir feedback</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Tem certeza que deseja excluir este feedback? Esta ação não pode ser desfeita.
                </p>
                {itemPendingDelete.question?.title && (
                  <p className="text-sm text-slate-500 mt-2">
                    Questão: {itemPendingDelete.question.title}
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setPendingDelete(null)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-white bg-rose-600 hover:bg-rose-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
