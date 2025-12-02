import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { updateQuestionSchema } from '@/lib/zodSchemas'
export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const q = await prisma.question.findUnique({
    where: { id: params.id },
    include: { steps: { orderBy: { order: 'asc' } }, attempts: true, feedbacks: true }
  })
  if (!q) return new NextResponse('Not found', { status: 404 })
  return NextResponse.json(q)
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const data = updateQuestionSchema.parse(body)
    const item = await prisma.question.update({ where: { id: params.id }, data })
    return NextResponse.json(item)
  } catch (e: any) {
    return new NextResponse(e.message, { status: 400 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.question.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
