type AiResult = {
  topic?: string
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD'
  score?: number
}

const SYSTEM_PROMPT = `
Você é um assistente pedagógico para séries iniciais do ensino fundamental (1º ao 5º ano).
Dado um enunciado de matemática, classifique:
- topic: uma palavra curta (ex.: Soma, Frações, Geometria)
- difficulty: EASY | MEDIUM | HARD (sempre relativo às séries iniciais)
- score: 0-100 avaliando clareza/adequação para esse nível.
Retorne apenas JSON { "topic": "...", "difficulty": "...", "score": 85 }.
`

export async function classifyQuestionWithAI(question: string): Promise<AiResult | null> {
  if (!process.env.OPENAI_API_KEY) return null
  if (!question?.trim()) return null

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: question },
        ],
        temperature: 0.2,
      }),
    })

    if (!res.ok) return null
    const json = await res.json()
    const text = json.choices?.[0]?.message?.content || '{}'
    const parsed = JSON.parse(text)
    return {
      topic: parsed.topic,
      difficulty: parsed.difficulty,
      score: typeof parsed.score === 'number' ? parsed.score : undefined,
    }
  } catch {
    return null
  }
}
