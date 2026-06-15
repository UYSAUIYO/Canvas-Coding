import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const userId = await getCurrentUserId()
    const workflows = await prisma.workflow.findMany({
      where: { deletedAt: null, userId },
      orderBy: { updatedAt: 'desc' },
      include: { nodes: true, edges: true },
    })

    return NextResponse.json(workflows)
  } catch (error) {
    console.error('Get workflows error:', error)
    return NextResponse.json({ error: '获取工作流列表失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId()
    const body = await request.json()
    const workflow = await prisma.workflow.create({
      data: {
        name: body.name ?? '未命名工作流',
        description: body.description ?? null,
        userId,
      },
    })

    return NextResponse.json(workflow, { status: 201 })
  } catch (error) {
    console.error('Create workflow error:', error)
    return NextResponse.json({ error: '创建工作流失败' }, { status: 500 })
  }
}
