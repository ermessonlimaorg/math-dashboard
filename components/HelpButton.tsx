'use client'

interface HelpButtonProps {
  onClick: () => void
}

export default function HelpButton({ onClick }: HelpButtonProps) {
  return (
    <button
      onClick={onClick}
      data-tour="help-button"
      className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-gradient-to-br from-orange-500 to-rose-500 text-white rounded-full shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-110 transition-all duration-200 flex items-center justify-center"
      title="Ajuda - Iniciar tour guiado"
      aria-label="Ajuda"
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>
  )
}
