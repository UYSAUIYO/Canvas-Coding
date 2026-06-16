// ============================================================
// @canvas/shared — 共享类型定义
// ============================================================

/** 工作流节点类型 */
export type NodeType =
  | 'project'
  | 'module'
  | 'generate'
  | 'validate'
  | 'condition'
  | 'output'
  | 'data-model'
  | 'api'
  | 'env'
  | 'test'
  | 'example'

/** 项目节点配置 */
export interface ProjectConfig {
  name: string
  language: string
  framework: string
  description: string
}

/** 模块节点配置 */
export interface ModuleConfig {
  name: string
  description: string
  dependencies: string[]
  interfaceSignature: string
}

/** 代码生成节点配置 */
export interface GenerateConfig {
  description: string
  codeStyle: string
  filePathTemplate: string
  dependencies: string
}

/** 验证节点配置 */
export interface ValidateConfig {
  type: 'lint' | 'type-safety' | 'performance' | 'security'
  rules: string[]
  severity: 'error' | 'warning'
}

/** 条件分支节点配置 */
export interface ConditionConfig {
  expression: string
  branchA: string
  branchB: string
}

/** 输出节点配置 */
export interface OutputConfig {
  format: 'markdown' | 'json' | 'yaml'
  templateMapping: Record<string, string>
}

/** 数据模型节点配置 */
export interface DataModelConfig {
  name: string
  fields: Array<{
    name: string
    type: string
    description: string
    constraints: string
  }>
  description: string
}

/** API 端点节点配置 */
export interface ApiConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  description: string
  requestBody: string
  responseBody: string
}

/** 环境配置节点配置 */
export interface EnvConfig {
  variables: Array<{
    key: string
    description: string
    defaultValue: string
  }>
}

/** 测试策略节点配置 */
export interface TestConfig {
  framework: string
  coverageTarget: number
  style: string
  focus: string[]
}

/** 代码示例节点配置 */
export interface ExampleConfig {
  code: string
  language: string
  caption: string
}

/** 节点配置联合类型 */
export type NodeConfig =
  | ProjectConfig
  | ModuleConfig
  | GenerateConfig
  | ValidateConfig
  | ConditionConfig
  | OutputConfig
  | DataModelConfig
  | ApiConfig
  | EnvConfig
  | TestConfig
  | ExampleConfig

/** 工作流节点 (前端 React Flow 兼容) */
export interface WorkflowNode {
  id: string
  type: NodeType
  position: { x: number; y: number }
  data: {
    label: string
    config: NodeConfig
  }
}

/** 工作流边 */
export interface WorkflowEdge {
  id: string
  source: string
  target: string
  label?: string
}

/** DAG 上下文（渲染时传递给下游节点） */
export interface RenderContext {
  nodes: Record<string, string>
  edges: Array<{ from: string; to: string }>
}

/** Prompt 生成结果 */
export interface GenerateResult {
  prompt: string
  structured: Record<string, unknown>
  nodeCount: number
  timestamp: string
}

/** 工作流数据库记录 */
export interface WorkflowRecord {
  id: string
  userId: string
  name: string
  description: string | null
  thumbnail: string | null
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}
