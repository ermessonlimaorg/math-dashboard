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
    return <div className="text-sm text-gray-500">Carregando feedbacks...</div>
  }

  return (
    <>
      <div className="bg-white rounded shadow-sm p-4">
        <div className="font-medium mb-2">Últimos registros</div>
        {items.length === 0 ? (
          <div className="text-sm text-gray-500">Nenhum feedback.</div>
        ) : (
          <ul className="space-y-2">
            {items.map((f) => (
              <li key={f.id} className="border rounded p-2">
                <div className="text-sm flex items-center justify-between gap-2">
                  <span>
                    Nota: {'⭐'.repeat(f.rating)}{' '}
                    {f.questionId && (
                      <>
                        ·{' '}
                        <Link href={`/questions/${f.questionId}`} className="text-blue-600 hover:underline">
                          {f.question?.title || 'Ver questão'}
                        </Link>
                      </>
                    )}
                  </span>
                  <button
                    onClick={() => setPendingDelete(f.id)}
                    className="text-xs text-red-600 hover:text-red-700 font-semibold"
                  >
                    Excluir
                  </button>
                </div>
                {(f.studentName || f.appUserId) && (
                  <div className="text-xs text-gray-500">
                    Aluno: {f.studentName ?? '—'} {f.appUserId ? `(${f.appUserId})` : ''}
                  </div>
                )}
                {(() => {
                  const ai = parseAiComment(f.comment)
                  if (ai) {
                    return (
                      <div className="mt-1 space-y-1">
                        {typeof ai.score === 'number' && (
                          <div className="inline-block px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
                            Score IA: {ai.score}
                          </div>
                        )}
                        {ai.resumo && <div className="text-sm text-gray-700">{ai.resumo}</div>}
                        {ai.sugestoes?.length ? (
                          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                            {ai.sugestoes.map((s, idx) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    )
                  }
                  return f.comment ? <div className="text-sm text-gray-700">{f.comment}</div> : null
                })()}
                <div className="text-xs text-gray-400">{new Date(f.createdAt).toLocaleString('pt-BR')}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {itemPendingDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold">
                !
              </div>
              <div className="space-y-1">
                <div className="text-lg font-semibold text-gray-900">Excluir feedback</div>
                <div className="text-sm text-gray-600">
                  Tem certeza que deseja excluir este feedback? Esta ação não pode ser desfeita.
                </div>
                <div className="text-sm text-gray-500">
                  {itemPendingDelete.question?.title ? `Questão: ${itemPendingDelete.question.title}` : 'Feedback geral'}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPendingDelete(null)}
                className="px-4 py-2 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 text-sm font-semibold"
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
