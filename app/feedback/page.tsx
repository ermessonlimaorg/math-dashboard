import prisma from '@/lib/prisma'
import FeedbackForm from '@/components/FeedbackForm'
import FeedbackList from '@/components/FeedbackList'

async function getStats() {
  const [count, avg] = await Promise.all([
    prisma.feedback.count(),
    prisma.feedback.aggregate({ _avg: { rating: true } })
  ])
  return { count, avgRating: Number(avg._avg.rating || 0).toFixed(2) }
}

export default async function FeedbackPage() {
  const s = await getStats()

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Feedbacks</h1>
        <p className="text-sm md:text-base text-slate-500 mt-1">Gerencie os feedbacks recebidos dos usuários.</p>
      </div>

      <div data-tour="feedback-stats" className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        <div className="card card-hover p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Total de feedbacks</p>
              <p className="mt-2 text-2xl md:text-3xl font-bold text-slate-900">{s.count}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="card card-hover p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Nota média</p>
              <p className="mt-2 text-2xl md:text-3xl font-bold text-slate-900">{s.avgRating}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div data-tour="feedback-form" className="card">
        <div className="p-4 md:p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Enviar feedback</h2>
        </div>
        <div className="p-4 md:p-6">
          <FeedbackForm />
        </div>
      </div>

      <div data-tour="feedback-list" className="card">
        <div className="p-4 md:p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Feedbacks recentes</h2>
        </div>
        <FeedbackList />
      </div>
    </div>
  )
}
