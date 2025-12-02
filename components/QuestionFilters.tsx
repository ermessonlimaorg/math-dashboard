'use client'

import { useEffect, useMemo, useState } from 'react'

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
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-sm font-semibold text-gray-900">Filtros</div>
            <div className="text-xs text-gray-500">Refine por título ou tópico.</div>
          </div>
          <div className="text-xs text-gray-400">
            {filtered.length} resultado(s)
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs text-gray-500 font-semibold">Busca</label>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Digite título, tópico..."
              className="mt-1 block w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
            />
          </div>
          <div className="min-w-[140px]">
            <label className="text-xs text-gray-500 font-semibold">Tópico</label>
            <select
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="mt-1 block w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
            >
              <option value="">Todos</option>
              {topics.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-500">Carregando...</div>}

      {groups.map(group => {
        const isOpen = expanded[group.key] === true
        return (
          <div key={group.key} className="bg-white rounded shadow-sm overflow-hidden border">
            <button
              onClick={() => toggleGroup(group.key)}
              className="w-full px-3 py-2 bg-gray-100 text-sm font-medium text-gray-700 flex items-center justify-between hover:bg-gray-200"
            >
              <span>{group.label}</span>
              <span className="text-xs text-gray-500">{group.items.length} questão(ões) · {isOpen ? 'Recolher' : 'Expandir'}</span>
            </button>

            {isOpen && (
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-3 py-2">Título</th>
                    <th className="text-left px-3 py-2">Tópico</th>
                    <th className="text-left px-3 py-2">Criada em</th>
                    <th className="text-left px-3 py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                {group.items.map((row) => (
                  <tr key={row.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <a className="text-blue-600 hover:underline" href={`/questions/${row.id}`}>{row.title}</a>
                    </td>
                    <td className="px-3 py-2">{row.topic}</td>
                    <td className="px-3 py-2">{new Date(row.createdAt).toLocaleString('pt-BR')}</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="text-red-600 hover:text-red-700 text-xs font-semibold"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
                {group.items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-gray-500">Nenhum resultado</td>
                  </tr>
                )}
                </tbody>
              </table>
            )}
          </div>
        )
      })}

      {groups.length === 0 && !loading && (
        <div className="bg-white rounded shadow-sm p-6 text-center text-gray-500">
          Nenhum resultado
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 text-xl">
                ×
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">Confirmar exclusão</div>
                <div className="text-sm text-gray-600">Esta ação não pode ser desfeita.</div>
              </div>
            </div>
            <div className="text-sm text-gray-700">
              Tem certeza que deseja excluir esta questão? Os dados vinculados não serão recuperados.
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteId(null)}
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
    </div>
  )
}
