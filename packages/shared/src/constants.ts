import type { NodeType } from './types'

// ============================================================
// @canvas/shared — 节点常量配置
// ============================================================

export interface NodeTypeInfo {
  type: NodeType
  label: string
  icon: string
  color: string
  description: string
}

export const NODE_TYPES: NodeTypeInfo[] = [
  {
    type: 'project',
    label: '项目信息',
    icon: 'Package',
    color: '#3B82F6',
    description: '项目元信息：名称、语言、框架',
  },
  {
    type: 'module',
    label: '模块',
    icon: 'Puzzle',
    color: '#8B5CF6',
    description: '拆分功能模块',
  },
  {
    type: 'generate',
    label: '代码生成',
    icon: 'Zap',
    color: '#F59E0B',
    description: '代码生成步骤定义',
  },
  {
    type: 'validate',
    label: '质量约束',
    icon: 'ShieldCheck',
    color: '#10B981',
    description: '代码质量约束规则',
  },
  {
    type: 'condition',
    label: '条件分支',
    icon: 'GitBranch',
    color: '#EF4444',
    description: '条件分支逻辑',
  },
  {
    type: 'output',
    label: '输出配置',
    icon: 'FileOutput',
    color: '#6366F1',
    description: '输出格式与模板配置',
  },
  {
    type: 'data-model',
    label: '数据模型',
    icon: 'Database',
    color: '#06B6D4',
    description: '定义数据实体、字段与关系',
  },
  {
    type: 'api',
    label: 'API 端点',
    icon: 'Globe',
    color: '#EC4899',
    description: '定义 REST/GraphQL 接口',
  },
  {
    type: 'env',
    label: '环境配置',
    icon: 'Key',
    color: '#F97316',
    description: '环境变量与配置项',
  },
  {
    type: 'test',
    label: '测试策略',
    icon: 'FlaskConical',
    color: '#14B8A6',
    description: '测试框架与覆盖率要求',
  },
  {
    type: 'example',
    label: '代码示例',
    icon: 'Code2',
    color: '#8B5CF6',
    description: '参考代码片段作为模板',
  },
]

export function getNodeTypeInfo(type: NodeType): NodeTypeInfo {
  return NODE_TYPES.find((n) => n.type === type) ?? NODE_TYPES[0]
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
}

/** 默认 DAG：一个 Project + 一个 Output */
export function createDefaultDAG(): { nodes: unknown[]; edges: unknown[] } {
  return {
    nodes: [
      {
        id: generateId(),
        type: 'project',
        position: { x: 100, y: 200 },
        data: { label: '新建项目', config: { name: '', language: 'TypeScript', framework: 'Next.js', description: '' } },
      },
      {
        id: generateId(),
        type: 'output',
        position: { x: 500, y: 200 },
        data: { label: '输出', config: { format: 'markdown' } },
      },
    ],
    edges: [],
  }
}
