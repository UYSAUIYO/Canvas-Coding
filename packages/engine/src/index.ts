import type {
  WorkflowNode,
  WorkflowEdge,
  ProjectConfig,
  ModuleConfig,
  GenerateConfig,
  ValidateConfig,
  ConditionConfig,
  OutputConfig,
  DataModelConfig,
  ApiConfig,
  EnvConfig,
  TestConfig,
  ExampleConfig,
  GenerateResult,
} from '@canvas/shared/types'
import { topologicalSort } from './dag'
import { buildContext } from './context'
import {
  renderProjectPrompt,
  renderModulePrompt,
  renderGeneratePrompt,
  renderValidatePrompt,
  renderConditionPrompt,
  renderOutputPrompt,
  renderDataModelPrompt,
  renderApiPrompt,
  renderEnvPrompt,
  renderTestPrompt,
  renderExamplePrompt,
} from './renderers'

/**
 * 主入口：将 DAG 渲染为完整的 vibe coding prompt
 */
export function generatePrompt(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
): GenerateResult {
  // 1. 验证 DAG
  if (nodes.length === 0) {
    throw new Error('工作流中没有节点')
  }

  const hasProject = nodes.some((n) => n.type === 'project')
  const hasOutput = nodes.some((n) => n.type === 'output')
  if (!hasProject) {
    throw new Error('工作流必须包含至少一个 Project 节点')
  }
  if (!hasOutput) {
    throw new Error('工作流必须包含至少一个 Output 节点')
  }

  // 2. 拓扑排序
  const sortedIds = topologicalSort(nodes, edges)
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const edgeList = edges.map((e) => ({ from: e.source, to: e.target }))

  // 3. 按序渲染每个节点
  const rendered = new Map<string, string>()
  let moduleIndex = 0

  for (const id of sortedIds) {
    const node = nodeMap.get(id)
    if (!node) continue

    const config = (node.data.config as unknown) as Record<string, unknown>
    const context = buildContext(rendered, edgeList)

    let output = ''

    switch (node.type) {
      case 'project':
        output = renderProjectPrompt(config as unknown as ProjectConfig)
        break

      case 'module':
        moduleIndex++
        output = renderModulePrompt(config as unknown as ModuleConfig, moduleIndex)
        break

      case 'generate':
        output = renderGeneratePrompt(config as unknown as GenerateConfig, context)
        break

      case 'validate':
        output = renderValidatePrompt(config as unknown as ValidateConfig)
        break

      case 'condition':
        output = renderConditionPrompt(config as unknown as ConditionConfig)
        break

      case 'output': {
        // Output 节点最后处理：将前面所有片段合并后格式化
        const fullPrompt = [...rendered.values()].join('\n\n')
        output = renderOutputPrompt(config as unknown as OutputConfig, fullPrompt)
        break
      }

      case 'data-model':
        output = renderDataModelPrompt(config as unknown as DataModelConfig)
        break

      case 'api':
        output = renderApiPrompt(config as unknown as ApiConfig)
        break

      case 'env':
        output = renderEnvPrompt(config as unknown as EnvConfig)
        break

      case 'test':
        output = renderTestPrompt(config as unknown as TestConfig)
        break

      case 'example':
        output = renderExamplePrompt(config as unknown as ExampleConfig)
        break

      default:
        output = `> 未知节点类型: ${node.type}`
    }

    rendered.set(id, output)
  }

  // 4. 聚合最终输出
  const outputNodeId = sortedIds.find((id) => nodeMap.get(id)?.type === 'output')
  const finalPrompt = outputNodeId ? rendered.get(outputNodeId) ?? '' : [...rendered.values()].join('\n\n')

  return {
    prompt: finalPrompt,
    structured: {
      sections: Object.fromEntries(rendered),
      nodeOrder: sortedIds,
    },
    nodeCount: nodes.length,
    timestamp: new Date().toISOString(),
  }
}
