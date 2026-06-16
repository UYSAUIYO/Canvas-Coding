import type { RenderContext } from '@canvas/shared/types'

/**
 * 从已渲染的节点结果构建上下文
 */
export function buildContext(rendered: Map<string, string>, edges: Array<{ from: string; to: string }>): RenderContext {
  const nodes: Record<string, string> = {}
  for (const [id, content] of rendered) {
    nodes[id] = content
  }

  return {
    nodes,
    edges: edges.map((e) => ({ from: e.from, to: e.to })),
  }
}
