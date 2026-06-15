import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { generatePrompt } from '@canvas/engine'
import type { WorkflowNode, WorkflowEdge } from '@canvas/shared/types'

/**
 * 轻量预览：从请求体接收 nodes + edges（不查数据库，速度更快）
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await params // 保留路由参数兼容
    const body = await request.json()

    if (!body.nodes || !Array.isArray(body.nodes) || body.nodes.length === 0) {
      return NextResponse.json({ error: '预览需要至少一个节点' }, { status: 400 })
    }

    const nodes: WorkflowNode[] = body.nodes.map((n: Record<string, unknown>) => ({
      id: n.id as string,
      type: n.type as WorkflowNode['type'],
      position: (n.position as { x: number; y: number }) ?? { x: 0, y: 0 },
      data: {
        label: (n.data as Record<string, unknown>)?.label as string ?? '',
        config: ((n.data as Record<string, unknown>)?.config ?? {}) as Record<string, unknown>,
      },
    })) as WorkflowNode[]

    const edges: WorkflowEdge[] = (body.edges ?? []).map((e: Record<string, unknown>) => ({
      id: e.id as string,
      source: e.source as string,
      target: e.target as string,
      label: e.label as string | undefined,
    }))

    const result = generatePrompt(nodes, edges)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Preview error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '预览生成失败' },
      { status: 500 },
    )
  }
}
