'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { CallBackProps, Step } from 'react-joyride'

const Joyride = dynamic(() => import('react-joyride'), { ssr: false })

const steps: Step[] = [
  {
    target: 'body',
    content: (
      <div className="text-center">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Bem-vindo ao MathDash!</h3>
        <p className="text-slate-600">
          Vamos fazer um tour rápido para você conhecer todas as funcionalidades da plataforma.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="sidebar-dashboard"]',
    content: (
      <div>
        <h3 className="font-bold text-slate-900 mb-2">Painel Principal</h3>
        <p className="text-slate-600">
          Aqui você vê um resumo geral: total de questões, usuários únicos e questões pendentes de classificação.
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="sidebar-questions"]',
    content: (
      <div>
        <h3 className="font-bold text-slate-900 mb-2">Questões</h3>
        <p className="text-slate-600">
          Gerencie todas as questões de matemática. Veja detalhes, edite e acompanhe as classificações da IA.
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="sidebar-feedback"]',
    content: (
      <div>
        <h3 className="font-bold text-slate-900 mb-2">Feedbacks</h3>
        <p className="text-slate-600">
          Visualize os feedbacks enviados pelos usuários sobre as questões e a plataforma.
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="sidebar-avaliacao"]',
    content: (
      <div>
        <h3 className="font-bold text-slate-900 mb-2">Avaliação IA</h3>
        <p className="text-slate-600">
          Use a inteligência artificial para avaliar e classificar questões automaticamente.
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="metrics"]',
    content: (
      <div>
        <h3 className="font-bold text-slate-900 mb-2">Métricas</h3>
        <p className="text-slate-600">
          Acompanhe os números importantes: questões cadastradas, usuários ativos e pendências.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="help-button"]',
    content: (
      <div className="text-center">
        <h3 className="font-bold text-slate-900 mb-2">Precisa de ajuda?</h3>
        <p className="text-slate-600">
          Clique neste botão a qualquer momento para ver este tour novamente!
        </p>
      </div>
    ),
    placement: 'left',
  },
]

const tourStyles = {
  options: {
    primaryColor: '#f97316',
    zIndex: 10000,
    arrowColor: '#fff',
    backgroundColor: '#fff',
    overlayColor: 'rgba(0, 0, 0, 0.7)',
    textColor: '#334155',
  },
  tooltip: {
    borderRadius: 16,
    padding: 20,
  },
  tooltipContent: {
    padding: '8px 4px',
  },
  buttonNext: {
    backgroundColor: '#f97316',
    borderRadius: 12,
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
  },
  buttonBack: {
    color: '#64748b',
    marginRight: 10,
    fontSize: 14,
  },
  buttonSkip: {
    color: '#94a3b8',
    fontSize: 14,
  },
  buttonClose: {
    display: 'none',
  },
  spotlight: {
    borderRadius: 16,
  },
}

interface OnboardingTourProps {
  run: boolean
  onFinish: () => void
}

export default function OnboardingTour({ run, onFinish }: OnboardingTourProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCallback = (data: CallBackProps) => {
    const { status } = data
    if (status === 'finished' || status === 'skipped') {
      onFinish()
      localStorage.setItem('mathdash-tour-completed', 'true')
    }
  }

  if (!mounted) return null

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      disableOverlayClose
      callback={handleCallback}
      styles={tourStyles}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Finalizar',
        next: 'Próximo',
        skip: 'Pular tour',
      }}
    />
  )
}
