'use client'

import { useEffect, useState } from 'react'

type SyncLog = {
  id: string
  status: string
  questionsCount: number
  stepsCount: number
  attemptsCount: number
  feedbacksCount: number
  errorMessage: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

type Stats = {
  totalSyncs: number
  successCount: number
  errorCount: number
  totalQuestions: number
  totalSteps: number
  totalAttempts: number
  totalFeedbacks: number
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Agora mesmo'
  if (diffMins < 60) return `${diffMins} min atrás`
  if (diffHours < 24) return `${diffHours}h atrás`
  if (diffDays < 7) return `${diffDays} dias atrás`
  return formatDate(dateStr)
}

export default function HistoricoPage() {
  const [logs, setLogs] = useState<SyncLog[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/sync-logs')
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.logs || [])
        setStats(data.stats || null)
      })
      .catch(() => {
        setLogs([])
        setStats(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const totalItems = (log: SyncLog) =>
    log.questionsCount + log.stepsCount + log.attemptsCount + log.feedbacksCount

  return (
    <div className="space-y-6 md:space-y-8">
      <div data-tour="historico-header">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Histórico de Sincronizações</h1>
        <p className="text-sm md:text-base text-slate-500 mt-1">
          Acompanhe todas as sincronizações realizadas pelo aplicativo.
        </p>
      </div>

      {stats && (
        <div data-tour="historico-stats" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card p-4">
            <p className="text-sm font-medium text-slate-500">Total de Syncs</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stats.totalSyncs}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm font-medium text-slate-500">Sucesso</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{stats.successCount}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm font-medium text-slate-500">Erros</p>
            <p className="mt-1 text-2xl font-bold text-rose-600">{stats.errorCount}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm font-medium text-slate-500">Questões Sync</p>
            <p className="mt-1 text-2xl font-bold text-orange-600">{stats.totalQuestions}</p>
          </div>
        </div>
      )}

      <div data-tour="historico-list" className="card">
        <div className="p-4 md:p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Sincronizações Recentes</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p>Nenhuma sincronização registrada ainda.</p>
            <p className="text-sm mt-1">As sincronizações aparecerão aqui quando o app enviar dados.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="p-4 md:px-6 hover:bg-slate-50 transition-colors">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        log.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    <div>
                      <p className="font-medium text-slate-900">
                        {totalItems(log)} {totalItems(log) === 1 ? 'item' : 'itens'} sincronizados
                      </p>
                      <p className="text-sm text-slate-500">{formatRelativeTime(log.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        log.status === 'success'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {log.status === 'success' ? 'Sucesso' : 'Erro'}
                    </span>
                    <svg
                      className={`w-5 h-5 text-slate-400 transition-transform ${
                        expandedId === log.id ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {expandedId === log.id && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-slate-500">Questões</p>
                        <p className="font-semibold text-slate-900">{log.questionsCount}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-slate-500">Passos</p>
                        <p className="font-semibold text-slate-900">{log.stepsCount}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-slate-500">Tentativas</p>
                        <p className="font-semibold text-slate-900">{log.attemptsCount}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-slate-500">Feedbacks</p>
                        <p className="font-semibold text-slate-900">{log.feedbacksCount}</p>
                      </div>
                    </div>

                    <div className="text-sm text-slate-500 space-y-1">
                      <p>
                        <span className="font-medium">Data:</span> {formatDate(log.createdAt)}
                      </p>
                      {log.ipAddress && (
                        <p>
                          <span className="font-medium">IP:</span> {log.ipAddress}
                        </p>
                      )}
                      {log.errorMessage && (
                        <p className="text-rose-600">
                          <span className="font-medium">Erro:</span> {log.errorMessage}
                        </p>
                      )}
                    </div>
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
