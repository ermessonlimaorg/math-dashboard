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
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Feedbacks</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow-sm">
          <div className="text-sm text-gray-500">Total de feedbacks</div>
          <div className="text-2xl font-semibold">{s.count}</div>
        </div>
        <div className="bg-white p-4 rounded shadow-sm">
          <div className="text-sm text-gray-500">Nota média</div>
          <div className="text-2xl font-semibold">{s.avgRating}</div>
        </div>
      </div>

      <FeedbackForm />

      <FeedbackList />
    </div>
  )
}
