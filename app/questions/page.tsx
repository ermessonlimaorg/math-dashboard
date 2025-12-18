import QuestionFilters from '@/components/QuestionFilters'

export default function QuestionsPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Questões</h1>
        <p className="text-sm md:text-base text-slate-500 mt-1">Visualize, filtre e exclua questões sincronizadas do app.</p>
      </div>
      <QuestionFilters />
    </div>
  )
}
