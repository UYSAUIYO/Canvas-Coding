import { z } from 'zod'

// ============================================================
// @canvas/shared — Zod 校验 Schema
// ============================================================

export const projectConfigSchema = z.object({
  name: z.string().min(1, '项目名不能为空'),
  language: z.string().min(1, '编程语言不能为空'),
  framework: z.string().optional().default(''),
  description: z.string().optional().default(''),
})

export const moduleConfigSchema = z.object({
  name: z.string().min(1, '模块名不能为空'),
  description: z.string().optional().default(''),
  dependencies: z.array(z.string()).optional().default([]),
  interfaceSignature: z.string().optional().default(''),
})

export const generateConfigSchema = z.object({
  description: z.string().min(1, '功能描述不能为空'),
  codeStyle: z.string().optional().default(''),
  filePathTemplate: z.string().optional().default(''),
  dependencies: z.string().optional().default(''),
})

export const validateConfigSchema = z.object({
  type: z.enum(['lint', 'type-safety', 'performance', 'security']),
  rules: z.array(z.string()).min(1, '至少添加一条规则'),
  severity: z.enum(['error', 'warning']).default('error'),
})

export const conditionConfigSchema = z.object({
  expression: z.string().min(1, '条件表达式不能为空'),
  branchA: z.string().optional().default('分支 A'),
  branchB: z.string().optional().default('分支 B'),
})

export const outputConfigSchema = z.object({
  format: z.enum(['markdown', 'json', 'yaml']).default('markdown'),
  templateMapping: z.record(z.string(), z.string()).optional().default({}),
})

export const dataModelConfigSchema = z.object({
  name: z.string().min(1, '数据模型名不能为空'),
  fields: z.array(z.object({
    name: z.string().min(1, '字段名不能为空'),
    type: z.string().min(1, '字段类型不能为空'),
    description: z.string().optional().default(''),
    constraints: z.string().optional().default(''),
  })).min(1, '至少添加一个字段'),
  description: z.string().optional().default(''),
})

export const apiConfigSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('GET'),
  path: z.string().min(1, '路径不能为空'),
  description: z.string().optional().default(''),
  requestBody: z.string().optional().default(''),
  responseBody: z.string().optional().default(''),
})

export const envConfigSchema = z.object({
  variables: z.array(z.object({
    key: z.string().min(1, '变量名不能为空'),
    description: z.string().optional().default(''),
    defaultValue: z.string().optional().default(''),
  })).min(1, '至少添加一个环境变量'),
})

export const testConfigSchema = z.object({
  framework: z.string().optional().default('vitest'),
  coverageTarget: z.number().min(0).max(100).optional().default(80),
  style: z.string().optional().default('单元测试 + 集成测试'),
  focus: z.array(z.string()).optional().default([]),
})

export const exampleConfigSchema = z.object({
  code: z.string().min(1, '代码示例不能为空'),
  language: z.string().optional().default('typescript'),
  caption: z.string().optional().default(''),
})

export const nodeConfigSchema = z.discriminatedUnion('__type', [
  projectConfigSchema.extend({ __type: z.literal('project') }),
  moduleConfigSchema.extend({ __type: z.literal('module') }),
  generateConfigSchema.extend({ __type: z.literal('generate') }),
  validateConfigSchema.extend({ __type: z.literal('validate') }),
  conditionConfigSchema.extend({ __type: z.literal('condition') }),
  outputConfigSchema.extend({ __type: z.literal('output') }),
  dataModelConfigSchema.extend({ __type: z.literal('data-model') }),
  apiConfigSchema.extend({ __type: z.literal('api') }),
  envConfigSchema.extend({ __type: z.literal('env') }),
  testConfigSchema.extend({ __type: z.literal('test') }),
  exampleConfigSchema.extend({ __type: z.literal('example') }),
])

export const workflowNodeSchema = z.object({
  id: z.string(),
  type: z.enum(['project', 'module', 'generate', 'validate', 'condition', 'output', 'data-model', 'api', 'env', 'test', 'example']),
  position: z.object({ x: z.number(), y: z.number() }),
  data: z.object({
    label: z.string(),
    config: z.record(z.unknown()),
  }),
})

export const workflowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
})

export const createWorkflowSchema = z.object({
  name: z.string().min(1).max(100).default('未命名工作流'),
  description: z.string().max(500).optional(),
})

export const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  nodes: z.array(workflowNodeSchema).optional(),
  edges: z.array(workflowEdgeSchema).optional(),
})

export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>
export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>
