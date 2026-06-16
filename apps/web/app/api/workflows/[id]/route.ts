import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getCurrentUserId()
    const { id } = await params
    const workflow = await prisma.workflow.findUnique({
      where: { id, userId },
      include: { nodes: true, edges: true },
    })

    if (!workflow || workflow.deletedAt) {
      return NextResponse.json({ error: '工作流不存在' }, { status: 404 })
    }

    return NextResponse.json(workflow)
  } catch (error) {
    console.error('Get workflow error:', error)
    return NextResponse.json({ error: '获取工作流失败' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getCurrentUserId()
    const { id } = await params

    // 验证所有权
    const existing = await prisma.workflow.findUnique({ where: { id, userId } })
    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: '工作流不存在' }, { status: 404 })
    }
    const body = await request.json()

    // 如果包含 nodes/edges，先删除旧的再创建
    if (body.nodes || body.edges) {
      await prisma.workflowNode.deleteMany({ where: { workflowId: id } })
      await prisma.workflowEdge.deleteMany({ where: { workflowId: id } })

      if (body.nodes) {
        await prisma.workflowNode.createMany({
          data: body.nodes.map((n: { id: string; type: string; data: { label: string; config: unknown }; position: { x: number; y: number } }) => ({
            id: n.id,
            workflowId: id,
            type: n.type,
            label: n.data.label,
            positionX: n.position.x,
            positionY: n.position.y,
            config: n.data.config as object,
          })),
        })
      }

      if (body.edges) {
        await prisma.workflowEdge.createMany({
          data: body.edges.map((e: { id: string; source: string; target: string; label?: string }) => ({
            id: e.id,
            workflowId: id,
            sourceNodeId: e.source,
            targetNodeId: e.target,
            label: e.label ?? null,
          })),
        })
      }
    }

    const workflow = await prisma.workflow.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
      },
      include: { nodes: true, edges: true },
    })

    return NextResponse.json(workflow)
  } catch (error) {
    console.error('Update workflow error:', error)
    return NextResponse.json({ error: '更新工作流失败' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.workflow.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete workflow error:', error)
    return NextResponse.json({ error: '删除工作流失败' }, { status: 500 })
  }
}
