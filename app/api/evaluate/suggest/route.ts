import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

type Suggestion = {
  question?: string
  rationale?: string
  imagePrompt?: string
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return new NextResponse('OPENAI_API_KEY não configurada.', { status: 500 })

  try {
    const body = await req.json()
    const { question, topic, difficulty, forceImage } = body as {
      question: string
      topic?: string
      difficulty?: string
      forceImage?: boolean
    }

    if (!question || typeof question !== 'string') {
      return new NextResponse('Informe o enunciado atual.', { status: 400 })
    }

    const system = `
Você cria novas questões de matemática para séries iniciais (1º ao 5º ano).
Sugira uma nova questão baseada na original, clara e apropriada para esse nível.
Responda APENAS em JSON com campos:
{ "question": "nova questão", "rationale": "por que é adequada/como melhora", "imagePrompt": "descrição visual simples (opcional)", "imageModel": "gpt-image-1" }
`

    const user = `
Questão original: ${question}
${topic ? `Tópico: ${topic}` : ''}
${difficulty ? `Dificuldade: ${difficulty}` : ''}
`

    const completion = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.4,
      }),
    })

    if (!completion.ok) {
      const err = await completion.text()
      return new NextResponse(err || 'Erro ao sugerir questão', { status: completion.status })
    }

    const completionJson = await completion.json()
    const rawText = completionJson.choices?.[0]?.message?.content || '{}'
    const cleaned = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
    let suggested: Suggestion = {}
    try {
      suggested = JSON.parse(cleaned)
    } catch {
      suggested = { question: cleaned }
    }

    let imageBase64: string | null = null
    let imagePrompt: string | undefined = suggested.imagePrompt
    let imageModelAlt: string | undefined
    let imageError: string | undefined
    const imageModel = (suggested as any)?.imageModel || 'gpt-image-1'

    if (suggested.imagePrompt || forceImage) {
      if (!suggested.imagePrompt && forceImage) {
        imagePrompt = `Ilustre de forma simples e lúdica: ${suggested.question || question}`
      }
      try {
        const imgRes = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: imageModel,
            prompt: imagePrompt || suggested.imagePrompt,
            size: '1024x1024',
          }),
        })
        if (imgRes.ok) {
          const imgJson = await imgRes.json()
          // a API da OpenAI v1 retorna base64 em 'b64_json' por padrão
          imageBase64 = imgJson.data?.[0]?.b64_json || null
          imageModelAlt = imgJson.data?.[0]?.revised_prompt
        } else {
          const errText = await imgRes.text()
          let parsedErr: any
          try {
            parsedErr = JSON.parse(errText)
          } catch {
            parsedErr = null
          }
          const msg = parsedErr?.error?.message || errText || 'Falha ao gerar imagem'
          imageError = msg.includes('must be verified')
            ? 'Conta não verificada para gerar imagens. Verifique sua organização no OpenAI.'
            : msg
        }
      } catch (err: any) {
        imageBase64 = null
        imageError = err?.message || 'Erro ao gerar imagem'
      }
    }

    return NextResponse.json({
      question: suggested.question,
      rationale: suggested.rationale,
      imagePrompt,
      imageAlt: imageModelAlt,
      imageBase64,
      imageError,
    })
  } catch (e: any) {
    return new NextResponse(e?.message || 'Erro ao sugerir questão', { status: 500 })
  }
}
