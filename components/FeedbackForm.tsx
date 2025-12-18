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
    if (questionId && evaluatedLocal.has(questionId)) {
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
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-1.5">
          <label className="label">Questão (opcional)</label>
          <select
            value={questionId}
            onChange={e => setQuestionId(e.target.value)}
            className="input"
          >
            <option value="">Feedback geral (nenhuma questão)</option>
            {questions.map(q => (
              <option key={q.id} value={q.id} disabled={evaluatedLocal.has(q.id)}>
                {q.title} {evaluatedLocal.has(q.id) ? '(já avaliada)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="label">Nota (1-5)</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`p-1 rounded-lg transition-colors ${rating >= star ? 'text-amber-500' : 'text-slate-300 hover:text-slate-400'}`}
              >
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="label">Comentários (opcional)</label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Deixe seu comentário aqui..."
          className="input min-h-[120px] resize-y"
        />
      </div>
      <div className="flex justify-end">
        <button
          onClick={submit}
          className="btn-primary"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
          Enviar feedback
        </button>
      </div>
    </div>
  )
}
