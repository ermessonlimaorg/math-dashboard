'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { CallBackProps, Step } from 'react-joyride'

const Joyride = dynamic(() => import('react-joyride'), { ssr: false })

const dashboardSteps: Step[] = [
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
    target: '[data-tour="metrics"]',
    content: (
      <div>
        <h3 className="font-bold text-slate-900 mb-2">Métricas Rápidas</h3>
        <p className="text-slate-600">
          Veja os números mais importantes: quantas questões existem, quantos usuários únicos e quantas precisam de classificação.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="sidebar-questions"]',
    content: (
      <div>
        <h3 className="font-bold text-slate-900 mb-2">Questões</h3>
        <p className="text-slate-600">
          Clique aqui para gerenciar todas as questões. Você pode filtrar, visualizar detalhes e excluir questões.
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
          Veja os feedbacks dos usuários, envie novos feedbacks e acompanhe a satisfação geral.
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
          Use a inteligência artificial para avaliar questões e obter sugestões de melhoria.
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="help-button"]',
    content: (
      <div className="text-center">
        <h3 className="font-bold text-slate-900 mb-2">Precisa de ajuda?</h3>
        <p className="text-slate-600">
          Clique neste botão a qualquer momento para ver o tour da página atual!
        </p>
      </div>
    ),
    placement: 'left',
  },
]

const questionsSteps: Step[] = [
  {
    target: '[data-tour="questions-header"]',
    content: (
      <div>
        <h3 className="font-bold text-slate-900 mb-2">Página de Questões</h3>
        <p className="text-slate-600">
          Aqui você gerencia todas as questões sincronizadas do aplicativo móvel.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="questions-filters"]',
    content: (
      <div>
        <h3 className="font-bold text-slate-900 mb-2">Filtros de Busca</h3>
        <p className="text-slate-600">
          Use os filtros para encontrar questões por título, tópico ou outros critérios. O contador mostra quantas questões correspondem à busca.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
]

const feedbackSteps: Step[] = [
  {
    target: '[data-tour="feedback-stats"]',
    content: (
      <div>
        <h3 className="font-bold text-slate-900 mb-2">Estatísticas de Feedback</h3>
        <p className="text-slate-600">
          Veja o total de feedbacks recebidos e a nota média dos usuários.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="feedback-form"]',
    content: (
      <div>
        <h3 className="font-bold text-slate-900 mb-2">Enviar Feedback</h3>
        <p className="text-slate-600">
          Use este formulário para enviar um novo feedback. Você pode avaliar questões específicas ou enviar comentários gerais.
        </p>
      </div>
    ),
    placement: 'top',
  },
  {
    target: '[data-tour="feedback-list"]',
    content: (
      <div>
        <h3 className="font-bold text-slate-900 mb-2">Feedbacks Recentes</h3>
        <p className="text-slate-600">
          Veja todos os feedbacks enviados pelos usuários, organizados por data.
        </p>
      </div>
    ),
    placement: 'top',
  },
]

const avaliacaoSteps: Step[] = [
  {
    target: '[data-tour="avaliacao-form"]',
    content: (
      <div>
        <h3 className="font-bold text-slate-900 mb-2">Formulário de Avaliação</h3>
        <p className="text-slate-600">
          Selecione um usuário e uma questão para avaliar. Você também pode incluir a resposta do aluno para um feedback mais específico.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="avaliacao-buttons"]',
    content: (
      <div>
        <h3 className="font-bold text-slate-900 mb-2">Ações de IA</h3>
        <p className="text-slate-600">
          <strong>Avaliar com IA:</strong> Receba uma análise completa da questão.<br/>
          <strong>Sugerir nova questão:</strong> A IA cria uma questão similar para praticar.
        </p>
      </div>
    ),
    placement: 'top',
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
  currentPage: 'dashboard' | 'questions' | 'feedback' | 'avaliacao'
}

export default function OnboardingTour({ run, onFinish, currentPage }: OnboardingTourProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const getSteps = (): Step[] => {
    switch (currentPage) {
      case 'questions':
        return questionsSteps
      case 'feedback':
        return feedbackSteps
      case 'avaliacao':
        return avaliacaoSteps
      case 'dashboard':
      default:
        return dashboardSteps
    }
  }

  const handleCallback = (data: CallBackProps) => {
    const { status } = data
    if (status === 'finished' || status === 'skipped') {
      onFinish()
      if (currentPage === 'dashboard') {
        localStorage.setItem('mathdash-tour-completed', 'true')
      }
    }
  }

  if (!mounted) return null

  return (
    <Joyride
      steps={getSteps()}
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
