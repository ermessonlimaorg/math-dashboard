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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Avaliação com IA</h1>
        <p className="text-sm text-gray-500">Escolha um usuário, selecione uma questão e envie para a IA avaliar.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Usuário</label>
            <select
              value={selectedUser}
              onChange={e => { setSelectedUser(e.target.value); setSelectedQuestion(''); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
            >
              <option value="">{loadingList ? 'Carregando...' : 'Selecione'}</option>
              {userOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-sm font-semibold text-gray-700">Questão</label>
            <select
              value={selectedQuestion}
              onChange={e => {
                setSelectedQuestion(e.target.value)
                setResult(null)
                setSuggestion(null)
                setAnswer('')
              }}
              disabled={!selectedUser || questionOptions.length === 0}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value="">{selectedUser ? 'Selecione a questão' : 'Selecione um usuário'}</option>
              {questionOptions.map(q => (
                <option key={q.id} value={q.id}>{q.title}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedQuestionObj && (
          <div className="rounded-lg border border-orange-100 bg-orange-50 px-4 py-3 space-y-1">
            <div className="text-sm font-semibold text-orange-800">Enunciado</div>
            <div className="text-sm text-orange-900 whitespace-pre-wrap">{selectedQuestionObj.content}</div> 
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">Resposta do aluno (opcional)</label>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
            placeholder="Cole a resposta do aluno para receber feedback específico..."
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleEval}
            disabled={loading || !selectedQuestionObj}
            className="px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-semibold hover:bg-orange-500 disabled:opacity-60"
          >
            {loading ? 'Avaliando...' : 'Avaliar com IA'}
          </button>
          <button
            onClick={() => handleSuggest()}
            disabled={suggestLoading || !selectedQuestionObj}
            className="ml-3 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 disabled:opacity-60"
          >
            {suggestLoading ? 'Gerando...' : 'Sugerir nova questão'}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-lg font-semibold text-gray-900">Avaliação da IA</div>
            {typeof result.score === 'number' && (
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-sm font-semibold">
                  Score: {result.score}
                </div>
                <div className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                  {result.score >= 85
                    ? 'Excelente'
                    : result.score >= 70
                    ? 'Boa'
                    : result.score >= 50
                    ? 'Mediana'
                    : 'Precisa melhorar'}
                </div>
              </div>
            )}
          </div>

          {result.resumo && (
            <div className="space-y-1">
              <div className="text-sm font-semibold text-gray-800">Resumo</div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{result.resumo}</p>
            </div>
          )}

          {result.sugestoes?.length ? (
            <div className="space-y-1">
              <div className="text-sm font-semibold text-gray-800">Sugestões</div>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                {result.sugestoes.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      {suggestion && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
          <div className="text-lg font-semibold text-gray-900">Sugestão de nova questão</div>
          {suggestion.question && (
            <div className="space-y-1">
              <div className="text-sm font-semibold text-gray-800">Enunciado sugerido</div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{suggestion.question}</p>
            </div>
          )}
          {suggestion.rationale && (
            <div className="space-y-1">
              <div className="text-sm font-semibold text-gray-800">Por que essa sugestão?</div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{suggestion.rationale}</p>
            </div>
          )}
          {suggestion.imageBase64 && (
            <div>
              <div className="text-sm font-semibold text-gray-800 mb-1">Imagem de apoio</div>
              <div className="w-full max-w-md rounded-lg border overflow-hidden bg-gray-50">
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
