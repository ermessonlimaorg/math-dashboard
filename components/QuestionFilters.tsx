'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

export type Question = {
  id: string
  title: string
  topic: string
  createdAt: string
  attempts?: { appUserId: string | null; studentName: string | null }[]
}

export default function QuestionFilters() {
  const [data, setData] = useState<Question[]>([])
  const [q, setQ] = useState('')
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setLoading(true)
    fetch('/api/questions')
      .then((r) => r.json())
      .then((j) => setData(j.items))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return data.filter((row) => {
      if (q && !(`${row.title} ${row.topic}`.toLowerCase().includes(q.toLowerCase()))) return false
      if (topic && row.topic !== topic) return false
      return true
    })
  }, [data, q, topic])

  const topics = useMemo(() => Array.from(new Set(data.map(d => d.topic))).sort(), [data])
  const groups = useMemo(() => {
    const map: Record<string, { label: string; items: Question[] }> = {}
    filtered.forEach(row => {
      const headAttempt = row.attempts?.[0]
      const key = headAttempt?.appUserId || 'sem-id'
      const label = headAttempt?.studentName
        ? `${headAttempt.studentName} (${headAttempt.appUserId ?? 'sem ID'})`
        : headAttempt?.appUserId || 'Sem identificação'
      if (!map[key]) map[key] = { label, items: [] }
      map[key].items.push(row)
    })
    return Object.entries(map).map(([key, value]) => ({ key, ...value }))
  }, [filtered])

  const toggleGroup = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleDelete(id: string) {
    setDeleteId(id)
  }

  async function confirmDelete() {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/questions/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Falha ao excluir')
      }
      setData(prev => prev.filter(q => q.id !== deleteId))
      setDeleteId(null)
    } catch (e: any) {
      alert(e?.message || 'Erro ao excluir')
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div data-tour="questions-filters" className="card p-4 md:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Filtros</h3>
            <p className="text-sm text-slate-500">Refine por título ou tópico.</p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            {filtered.length} resultado(s)
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="label">Busca</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Digite título, tópico..."
                className="input pl-10"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="label">Tópico</label>
            <select
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="input"
            >
              <option value="">Todos</option>
              {topics.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="space-y-4">
        {groups.map(group => {
          const isOpen = expanded[group.key] === true
          return (
            <div key={group.key} className="card overflow-hidden">
              <button
                onClick={() => toggleGroup(group.key)}
                className="w-full px-4 py-3 md:px-5 md:py-4 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-md shadow-orange-500/20">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <span className="font-medium text-slate-900">{group.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">{group.items.length} questão(ões)</span>
                  <svg className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </button>

              {isOpen && (
                <div className="divide-y divide-slate-100">
                  {group.items.map((row) => (
                    <div key={row.id} className="p-4 md:p-5 hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <Link href={`/questions/${row.id}`} className="text-sm font-semibold text-orange-600 hover:text-orange-700 hover:underline">
                            {row.title}
                          </Link>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="inline-flex px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                              {row.topic}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(row.createdAt).toLocaleString('pt-BR')}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(row.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-sm font-medium transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                  {group.items.length === 0 && (
                    <div className="p-8 text-center text-sm text-slate-500">Nenhum resultado</div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {groups.length === 0 && !loading && (
        <div className="card p-8 md:p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <p className="text-sm text-slate-500">Nenhum resultado encontrado</p>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Confirmar exclusão</h3>
                <p className="text-sm text-slate-600 mt-1">Esta ação não pode ser desfeita. Os dados vinculados não serão recuperados.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
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
    </div>
  )
}
