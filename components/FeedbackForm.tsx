'use client'

import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

type Question = { id: string; title: string }

export default function FeedbackForm() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [questionId, setQuestionId] = useState<string>('')
  const [evaluatedLocal, setEvaluatedLocal] = useState<Set<string>>(new Set())
  const [rating, setRating] = useState<number>(5)
  const [comment, setComment] = useState<string>('')
  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true

    ;(async () => {
      try {
        const stored = typeof window !== 'undefined' ? window.localStorage.getItem('feedback-evaluated') : null
        if (stored) {
          try {
            const parsed: string[] = JSON.parse(stored)
            setEvaluatedLocal(new Set(parsed))
          } catch {
            setEvaluatedLocal(new Set())
          }
        }

        const res = await fetch('/api/questions')
        const j = await res.json()
        const items = j.items || []
        setQuestions(items)
        const available = items.find((q: Question) => !evaluatedLocal.has(q.id))
        if (!questionId && available) setQuestionId(available.id)
      } catch {
        setQuestions([])
      }
    })()
  }, [evaluatedLocal, questionId])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { questionId?: string; action?: string } | undefined
      if (detail?.action === 'delete' && detail.questionId) {
        setEvaluatedLocal((prev) => {
          const next = new Set(prev)
          next.delete(detail.questionId!)
          window.localStorage.setItem('feedback-evaluated', JSON.stringify(Array.from(next)))
          return next
        })
      }
    }
    window.addEventListener('feedback-updated', handler as EventListener)
    return () => window.removeEventListener('feedback-updated', handler as EventListener)
  }, [])

  async function submit() {
    if (!questionId) {
      toast.error('Selecione uma questão.')
      return
    }
    if (evaluatedLocal.has(questionId)) {
      toast.error('Esta questão já recebeu feedback.')
      return
    }

    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: questionId || undefined, rating, comment })
    })
    if (res.ok) {
      toast.success('Feedback enviado')
      setComment('')
      if (questionId) {
          setEvaluatedLocal(prev => {
            const next = new Set(prev).add(questionId)
            window.localStorage.setItem('feedback-evaluated', JSON.stringify(Array.from(next)))
            return next
          })
          window.dispatchEvent(new CustomEvent('feedback-updated', { detail: { questionId, action: 'create' } }))
      }
    } else {
      toast.error('Falha ao enviar')
    }
  }

  return (
    <div className="bg-white rounded shadow-sm p-4 space-y-3">
      <div className="font-medium">Enviar feedback</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div>
          <label className="text-xs text-gray-500">Questão (opcional)</label>
          <select
            value={questionId}
            onChange={e => {
              const id = e.target.value
              setQuestionId(id)
            }}
            className="block border rounded px-3 py-2 w-full"
          >
            <option value="" disabled>
              Selecione uma questão
            </option>
            {questions.map(q => (
              <option key={q.id} value={q.id} disabled={evaluatedLocal.has(q.id)}>
                {q.title} {evaluatedLocal.has(q.id) ? '(já avaliada)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">Nota</label>
          <input type="number" min={1} max={5} value={rating} onChange={e => setRating(Number(e.target.value))}
                 className="block border rounded px-3 py-2 w-full"/>
        </div>
        <div>
          <button
            onClick={submit}
            disabled={!questionId}
            className={`rounded px-4 py-2 ${questionId ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
          >
            Enviar
          </button>
        </div>
      </div>
      <textarea value={comment} onChange={e => setComment(e.target.value)}
        placeholder="Comentários" className="w-full border rounded px-3 py-2 h-24 font-mono text-sm" />
    </div>
  )
}
