'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

type Daily = { date: string; total: number; avgAiScore: number | null }
type ScoreBucket = { label: string; value: number }

export default function DashboardCharts() {
  const [daily, setDaily] = useState<Daily[]>([])
  const [scoreDist, setScoreDist] = useState<ScoreBucket[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch('/api/dashboard-metrics')
      .then((r) => r.json())
      .then((j) => {
        setDaily(j.dailyCounts || [])
        setScoreDist(j.scoreDistribution || [])
      })
      .catch(() => {
        setDaily([])
        setScoreDist([])
      })
      .finally(() => setLoading(false))
  }, [])

  const barOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 30, bottom: 40 },
    xAxis: {
      type: 'category',
      data: daily.map((d) => d.date.slice(5)),  
      axisLabel: { fontSize: 10 },
    },
    yAxis: { type: 'value', min: 0 },
    series: [
      {
        name: 'Questões sincronizadas',
        type: 'bar',
        data: daily.map((d) => d.total),
        itemStyle: { color: '#f97316' },
      },
      {
        name: 'Score médio IA',
        type: 'line',
        yAxisIndex: 0,
        smooth: true,
        data: daily.map((d) => d.avgAiScore),
        itemStyle: { color: '#10b981' },
      },
    ],
  }

  const scoreOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 30, bottom: 40 },
    xAxis: {
      type: 'category',
      data: scoreDist.map((b) => b.label),
      axisLabel: { fontSize: 11 },
    },
    yAxis: { type: 'value', min: 0 },
    series: [
      {
        name: 'Qtd. de questões',
        type: 'bar',
        data: scoreDist.map((b) => b.value),
        itemStyle: { color: '#6366f1' },
      },
    ],
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="font-semibold text-gray-900 mb-2">Questões sincronizadas (últimos 14 dias)</div>
        {loading ? (
          <div className="text-sm text-gray-500">Carregando...</div>
        ) : (
          <ReactECharts option={barOption} style={{ height: 300 }} notMerge lazyUpdate />
        )}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="font-semibold text-gray-900 mb-2">Distribuição de scores da IA</div>
        {loading ? (
          <div className="text-sm text-gray-500">Carregando...</div>
        ) : scoreDist.length === 0 ? (
          <div className="text-sm text-gray-500">Sem dados suficientes.</div>
        ) : (
          <ReactECharts option={scoreOption} style={{ height: 300 }} notMerge lazyUpdate />
        )}
      </div>
    </div>
  )
}
