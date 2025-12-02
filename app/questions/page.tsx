import QuestionFilters from '@/components/QuestionFilters'

export default function QuestionsPage() {
  return (
    <div className="space-y-2 md:space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Questões</h1>
          <p className="text-sm text-gray-500">Visualize, filtre e exclua questões sincronizadas do app.</p>
        </div>
      </div>
      <QuestionFilters />
    </div>
  )
}
