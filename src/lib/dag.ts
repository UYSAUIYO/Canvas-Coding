import type { WorkflowNode, WorkflowEdge } from '@canvas/shared/types'

/**
 * 使用 DFS 检测有向图中是否存在环
 */
export function hasCycle(nodes: WorkflowNode[], edges: WorkflowEdge[]): boolean {
  const adj = new Map<string, string[]>()
  for (const e of edges) {
    const list = adj.get(e.source) ?? []
    list.push(e.target)
    adj.set(e.source, list)
  }

  const WHITE = 0
  const GRAY = 1
  const BLACK = 2
  const color = new Map<string, number>()

  for (const node of nodes) {
    color.set(node.id, WHITE)
  }

  function dfs(u: string): boolean {
    color.set(u, GRAY)
    for (const v of adj.get(u) ?? []) {
      const c = color.get(v)
      if (c === GRAY) return true
      if (c === WHITE && dfs(v)) return true
    }
    color.set(u, BLACK)
    return false
  }

  for (const node of nodes) {
    if (color.get(node.id) === WHITE && dfs(node.id)) {
      return true
    }
  }
  return false
}
