'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

type Daily = { date: string; total: number; avgAiScore: number | null }
type ScoreBucket = { label: string; value: number }

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

export default function DashboardCharts() {
  const [daily, setDaily] = useState<Daily[]>([])
  const [scoreDist, setScoreDist] = useState<ScoreBucket[]>([])
  const [loading, setLoading] = useState(false)
  const isMobile = useIsMobile()

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

  const chartHeight = isMobile ? 220 : 300
  const fontSize = isMobile ? 10 : 11
  const gridConfig = isMobile 
    ? { left: 40, right: 10, top: 30, bottom: 40 }
    : { left: 50, right: 20, top: 40, bottom: 50 }

  const barOption = {
    tooltip: { 
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#334155', fontSize: isMobile ? 11 : 12 },
      confine: true
    },
    grid: gridConfig,
    xAxis: {
      type: 'category',
      data: daily.map((d) => d.date.slice(5)),  
      axisLabel: { fontSize, color: '#64748b', rotate: isMobile ? 45 : 0 },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false }
    },
    yAxis: { 
      type: 'value', 
      min: 0,
      axisLabel: { fontSize, color: '#64748b' },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9' } }
    },
    series: [
      {
        name: 'Questões sincronizadas',
        type: 'bar',
        data: daily.map((d) => d.total),
        itemStyle: { 
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#f97316' },
              { offset: 1, color: '#f43f5e' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: isMobile ? '50%' : '60%'
      },
      {
        name: 'Score médio IA',
        type: 'line',
        yAxisIndex: 0,
        smooth: true,
        data: daily.map((d) => d.avgAiScore),
        itemStyle: { color: '#10b981' },
        lineStyle: { width: isMobile ? 2 : 3 },
        symbol: 'circle',
        symbolSize: isMobile ? 6 : 8
      },
    ],
  }

  const scoreOption = {
    tooltip: { 
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#334155', fontSize: isMobile ? 11 : 12 },
      confine: true
    },
    grid: gridConfig,
    xAxis: {
      type: 'category',
      data: scoreDist.map((b) => b.label),
      axisLabel: { fontSize, color: '#64748b' },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false }
    },
    yAxis: { 
      type: 'value', 
      min: 0,
      axisLabel: { fontSize, color: '#64748b' },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9' } }
    },
    series: [
      {
        name: 'Qtd. de questões',
        type: 'bar',
        data: scoreDist.map((b) => b.value),
        itemStyle: { 
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#8b5cf6' },
              { offset: 1, color: '#6366f1' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: isMobile ? '50%' : '60%'
      },
    ],
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 overflow-hidden">
      <div className="card p-4 md:p-6 overflow-hidden">
        <h3 className="font-semibold text-slate-900 mb-3 md:mb-4 text-sm md:text-base">Questões sincronizadas (últimos 14 dias)</h3>
        {loading ? (
          <div style={{ height: chartHeight }} className="flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <ReactECharts option={barOption} style={{ height: chartHeight, width: '100%' }} notMerge lazyUpdate />
        )}
      </div>
      <div className="card p-4 md:p-6 overflow-hidden">
        <h3 className="font-semibold text-slate-900 mb-3 md:mb-4 text-sm md:text-base">Distribuição de scores da IA</h3>
        {loading ? (
          <div style={{ height: chartHeight }} className="flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : scoreDist.length === 0 ? (
          <div style={{ height: chartHeight }} className="flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <p className="text-sm text-slate-500">Sem dados suficientes.</p>
            </div>
          </div>
        ) : (
          <ReactECharts option={scoreOption} style={{ height: chartHeight, width: '100%' }} notMerge lazyUpdate />
        )}
      </div>
    </div>
  )
}
