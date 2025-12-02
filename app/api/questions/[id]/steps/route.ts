import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { solutionStepSchema } from '@/lib/zodSchemas'
export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const items = await prisma.solutionStep.findMany({
    where: { questionId: params.id },
    orderBy: { order: 'asc' }
  })
  return NextResponse.json({ items })
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const data = solutionStepSchema.parse({ ...body, questionId: params.id })
    const item = await prisma.solutionStep.create({ data: { questionId: params.id, order: data.order, content: data.content, externalId: data.externalId } })
    return NextResponse.json(item, { status: 201 })
  } catch (e: any) {
    return new NextResponse(e.message, { status: 400 })
  }
}
