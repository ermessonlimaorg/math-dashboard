'use client'
import dynamic from 'next/dynamic'
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })
export default function EChart({ option, height = 300 }: { option: any; height?: number }) {
  return <ReactECharts option={option} style={{ height }} />
}
