import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new NextResponse('OPENAI_API_KEY não configurada.', { status: 500 });
  }

  try {
    const body = await req.json();
    const { question, answer, topic, difficulty, questionId } = body as {
      question: string;
      answer?: string;
      topic?: string;
      difficulty?: string;
      questionId?: string;
    };

    if (!question || typeof question !== 'string') {
      return new NextResponse('Informe o enunciado da questão.', { status: 400 });
    }

    const system = `
Você é um avaliador pedagógico focado em séries iniciais do ensino fundamental (1º ao 5º ano).
Avalie se a questão está clara, adequada e bem calibrada para esse nível.
Responda em JSON com campos: score (0-100), resumo (string curta), sugestoes (array de strings).
Considere tópicos e dificuldade se fornecidos e mantenha o nível de exigência adequado às séries iniciais.
`;

    const user = `
Questão: ${question}
${answer ? `Resposta do aluno: ${answer}` : ''}
${topic ? `Tópico: ${topic}` : ''}
${difficulty ? `Dificuldade: ${difficulty}` : ''}
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new NextResponse(errorText || 'Erro ao consultar o modelo', {
        status: response.status,
      });
    }

    const json = await response.json();
    const text = json.choices?.[0]?.message?.content || '{}';
    const cleaned = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    let parsed: any = {};
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { score: null, resumo: cleaned, sugestoes: [] };
    }

    // persiste avaliação da IA se houver questionId
    if (questionId) {
      const scoreNumber = typeof parsed.score === 'number' ? parsed.score : null;
      const rating = scoreNumber !== null ? Math.max(1, Math.min(5, Math.round(scoreNumber / 20))) : 3;
      const commentParts: string[] = [];
      if (parsed.resumo) commentParts.push(String(parsed.resumo));
      if (Array.isArray(parsed.sugestoes) && parsed.sugestoes.length) {
        commentParts.push(`Sugestões: ${parsed.sugestoes.join('; ')}`);
      }
      const comment = commentParts.join(' | ');

      await prisma.question.update({
        where: { id: questionId },
        data: {
          aiScore: scoreNumber,
          lastAiEvaluatedAt: new Date(),
        },
      });

      await prisma.feedback.create({
        data: {
          questionId,
          rating,
          comment: comment || null,
          appUserId: null,
          studentName: 'IA',
        },
      });
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    return new NextResponse(error?.message || 'Erro ao avaliar', { status: 500 });
  }
}
