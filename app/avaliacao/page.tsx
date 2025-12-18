'use client'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

type Question = {
  id: string
  title: string
  content: string
  topic: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  attempts?: { appUserId: string | null; studentName: string | null }[]
}

type Group = { key: string; label: string; items: Question[] }

export default function AvaliacaoPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [selectedQuestion, setSelectedQuestion] = useState<string>('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ score?: number; resumo?: string; sugestoes?: string[] } | null>(null)
  const [suggestion, setSuggestion] = useState<{
    question?: string
    rationale?: string
    imageBase64?: string | null
    imageAlt?: string | null
    imageError?: string | null
  } | null>(null)
  const [suggestLoading, setSuggestLoading] = useState(false)

  useEffect(() => {
    setLoadingList(true)
    fetch('/api/questions')
      .then(res => res.json())
      .then(json => setQuestions(json.items || []))
      .catch(() => setQuestions([]))
      .finally(() => setLoadingList(false))
  }, [])

  const groups = useMemo<Group[]>(() => {
    const map: Record<string, Group> = {}
    questions.forEach(q => {
      const headAttempt = q.attempts?.[0]
      const key = headAttempt?.appUserId || 'sem-id'
      const label = headAttempt?.studentName
        ? `${headAttempt.studentName} (${headAttempt.appUserId ?? 'sem ID'})`
        : headAttempt?.appUserId || 'Sem identificação'
      if (!map[key]) map[key] = { key, label, items: [] }
      map[key].items.push(q)
    })
    return Object.values(map)
  }, [questions])

  const userOptions = useMemo(() => groups.map(g => ({ value: g.key, label: g.label })), [groups])
  const questionOptions = useMemo(() => {
    if (!selectedUser) return []
    return groups.find(g => g.key === selectedUser)?.items || []
  }, [groups, selectedUser])

  const selectedQuestionObj = useMemo(
    () => questionOptions.find(q => q.id === selectedQuestion),
    [questionOptions, selectedQuestion]
  )

  useEffect(() => {
    if (questionOptions.length === 0) {
      setSelectedQuestion('')
    }
  }, [questionOptions.length])

  async function handleEval() {
    if (!selectedQuestionObj) {
      toast.error('Selecione um usuário e uma questão.')
      return
    }

    setLoading(true)
    setResult(null)
    setSuggestion(null)
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: selectedQuestionObj.id,
          question: selectedQuestionObj.content,
          answer: answer || undefined,
          topic: selectedQuestionObj.topic || undefined,
          difficulty: selectedQuestionObj.difficulty || undefined
        })
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || 'Falha na avaliação')
      }
      const json = await res.json()
      setResult(json)
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao avaliar')
    } finally {
      setLoading(false)
    }
  }

  async function handleSuggest() {
    if (!selectedQuestionObj) {
      toast.error('Selecione um usuário e uma questão.')
      return
    }
    setSuggestLoading(true)
    setSuggestion(null)
    try {
      const res = await fetch('/api/evaluate/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: selectedQuestionObj.content,
          topic: selectedQuestionObj.topic,
          difficulty: selectedQuestionObj.difficulty,
        }),
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || 'Falha ao sugerir')
      }
      const json = await res.json()
      setSuggestion({
        question: json.question,
        rationale: json.rationale,
        imageBase64: json.imageBase64,
        imageAlt: json.imageAlt || json.imagePrompt || 'Ilustração da questão',
        imageError: json.imageError || null,
      })
      toast.success('Sugestão gerada')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao sugerir')
    } finally {
      setSuggestLoading(false)
    }
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Avaliação com IA</h1>
        <p className="text-sm md:text-base text-slate-500 mt-1">Escolha um usuário, selecione uma questão e envie para a IA avaliar.</p>
      </div>

      <div data-tour="avaliacao-form" className="card p-4 md:p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="label">Usuário</label>
            <select
              value={selectedUser}
              onChange={e => { setSelectedUser(e.target.value); setSelectedQuestion(''); }}
              className="input"
            >
              <option value="">{loadingList ? 'Carregando...' : 'Selecione'}</option>
              {userOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="label">Questão</label>
            <select
              value={selectedQuestion}
              onChange={e => {
                setSelectedQuestion(e.target.value)
                setResult(null)
                setSuggestion(null)
                setAnswer('')
              }}
              disabled={!selectedUser || questionOptions.length === 0}
              className="input disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              <option value="">{selectedUser ? 'Selecione a questão' : 'Selecione um usuário'}</option>
              {questionOptions.map(q => (
                <option key={q.id} value={q.id}>{q.title}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedQuestionObj && (
          <div className="rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-rose-50 p-4 space-y-2">
            <div className="text-sm font-semibold text-orange-800">Enunciado</div>
            <div className="text-sm text-slate-700 whitespace-pre-wrap">{selectedQuestionObj.content}</div> 
          </div>
        )}

        <div className="space-y-1.5">
          <label className="label">Resposta do aluno (opcional)</label>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            className="input min-h-[120px] resize-y"
            placeholder="Cole a resposta do aluno para receber feedback específico..."
          />
        </div>

        <div data-tour="avaliacao-buttons" className="flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={() => handleSuggest()}
            disabled={suggestLoading || !selectedQuestionObj}
            className="btn-secondary order-2 sm:order-1"
          >
            {suggestLoading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            )}
            {suggestLoading ? 'Gerando...' : 'Sugerir nova questão'}
          </button>
          <button
            onClick={handleEval}
            disabled={loading || !selectedQuestionObj}
            className="btn-primary order-1 sm:order-2"
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611l-.772.129a9.062 9.062 0 01-3.038.007l-.774-.13c-1.718-.294-2.3-2.38-1.067-3.612L16 15.306" />
              </svg>
            )}
            {loading ? 'Avaliando...' : 'Avaliar com IA'}
          </button>
        </div>
      </div>

      {result && (
        <div className="card p-4 md:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Avaliação da IA</h2>
            {typeof result.score === 'number' && (
              <div className="flex items-center gap-2">
                <span className="inline-flex px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 text-white text-sm font-semibold shadow-lg shadow-orange-500/25">
                  Score: {result.score}
                </span>
                <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-medium ${
                  result.score >= 85
                    ? 'bg-emerald-100 text-emerald-700'
                    : result.score >= 70
                    ? 'bg-blue-100 text-blue-700'
                    : result.score >= 50
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-rose-100 text-rose-700'
                }`}>
                  {result.score >= 85
                    ? 'Excelente'
                    : result.score >= 70
                    ? 'Boa'
                    : result.score >= 50
                    ? 'Mediana'
                    : 'Precisa melhorar'}
                </span>
              </div>
            )}
          </div>

          {result.resumo && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-800">Resumo</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{result.resumo}</p>
            </div>
          )}

          {result.sugestoes?.length ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-800">Sugestões</h3>
              <ul className="space-y-2">
                {result.sugestoes.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                    <svg className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      {suggestion && (
        <div className="card p-4 md:p-6 space-y-5">
          <h2 className="text-lg font-semibold text-slate-900">Sugestão de nova questão</h2>
          {suggestion.question && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-800">Enunciado sugerido</h3>
              <div className="rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 p-4">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{suggestion.question}</p>
              </div>
            </div>
          )}
          {suggestion.rationale && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-800">Por que essa sugestão?</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{suggestion.rationale}</p>
            </div>
          )}
          {suggestion.imageBase64 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-800">Imagem de apoio</h3>
              <div className="w-full max-w-md rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/png;base64,${suggestion.imageBase64}`}
                  alt={suggestion.imageAlt || 'Ilustração'}
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
