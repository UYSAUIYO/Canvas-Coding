import type { WorkflowNode, WorkflowEdge } from '@canvas/shared/types'

/**
 * Kahn 拓扑排序 + 环路检测
 * 返回拓扑排序后的节点 ID 列表，若有环则抛出错误
 */
export function topologicalSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] {
  const inDegree = new Map<string, number>()
  const adj = new Map<string, string[]>()

  for (const node of nodes) {
    inDegree.set(node.id, 0)
    adj.set(node.id, [])
  }

  for (const edge of edges) {
    const list = adj.get(edge.source) ?? []
    list.push(edge.target)
    adj.set(edge.source, list)
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1)
  }

  const queue: string[] = []
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id)
  }

  const result: string[] = []

  while (queue.length > 0) {
    // 优先 Project 节点（确保工程信息最先渲染）
    queue.sort((a, b) => {
      const nodeA = nodes.find((n) => n.id === a)
      const nodeB = nodes.find((n) => n.id === b)
      if (nodeA?.type === 'project') return -1
      if (nodeB?.type === 'project') return 1
      return 0
    })
    const u = queue.shift()!
    result.push(u)

    for (const v of adj.get(u) ?? []) {
      const newDegree = (inDegree.get(v) ?? 1) - 1
      inDegree.set(v, newDegree)
      if (newDegree === 0) queue.push(v)
    }
  }

  if (result.length !== nodes.length) {
    throw new Error('DAG 中存在环路，请检查连线')
  }

  return result
}

/**
 * 深度优先环路检测（备用）
 */
export function hasCycle(nodes: WorkflowNode[], edges: WorkflowEdge[]): boolean {
  try {
    topologicalSort(nodes, edges)
    return false
  } catch {
    return true
  }
}
