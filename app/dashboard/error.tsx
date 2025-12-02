'use client'
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded">
      <div className="font-semibold">Something went wrong</div>
      <div className="text-sm">{error.message}</div>
      <button onClick={reset} className="mt-2 text-sm underline">Try again</button>
    </div>
  )
}
