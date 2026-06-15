'use client'

import { useCallback, useEffect } from 'react'
import type { NodeType } from '@canvas/shared/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import AgentSelector from './AgentSelector'

interface PropertyPanelProps {
  nodeId: string | null
  nodeType: NodeType | null
  nodeLabel: string
  config: Record<string, unknown> | null
  onLabelChange: (label: string) => void
  onConfigChange: (config: Record<string, unknown>) => void
}

export default function PropertyPanel({
  nodeId,
  nodeType,
  nodeLabel,
  config,
  onLabelChange,
  onConfigChange,
}: PropertyPanelProps) {
  if (!nodeId || !nodeType) {
    return (
      <div className="flex h-full items-center justify-center border-l bg-white p-4">
        <p className="text-sm text-gray-400">选中节点以编辑属性</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col border-l bg-white">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-700">属性面板</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="node-label">节点名称</Label>
            <Input
              id="node-label"
              value={nodeLabel}
              onChange={(e) => onLabelChange(e.target.value)}
              className="mt-1"
            />
          </div>
          <AgentSelector
            nodeType={nodeType}
            value={(config?.agentId as string) ?? null}
            onChange={(agentId) => onConfigChange({ ...config ?? {}, agentId })}
          />
          <Separator />
          <ConfigForm
            nodeType={nodeType}
            config={config ?? {}}
            onConfigChange={onConfigChange}
          />
        </div>
      </div>
    </div>
  )
}

function ConfigForm({
  nodeType,
  config,
  onConfigChange,
}: {
  nodeType: NodeType
  config: Record<string, unknown>
  onConfigChange: (config: Record<string, unknown>) => void
}) {
  const updateField = useCallback(
    (field: string, value: unknown) => {
      onConfigChange({ ...config, [field]: value })
    },
    [config, onConfigChange],
  )

  switch (nodeType) {
    case 'project':
      return (
        <>
          <Field label="项目名" field="name" value={config.name as string ?? ''} onChange={updateField} />
          <Field label="编程语言" field="language" value={config.language as string ?? ''} onChange={updateField} />
          <Field label="框架" field="framework" value={config.framework as string ?? ''} onChange={updateField} />
          <Field label="描述" field="description" value={config.description as string ?? ''} onChange={updateField} textarea />
        </>
      )
    case 'module':
      return (
        <>
          <Field label="模块名" field="name" value={config.name as string ?? ''} onChange={updateField} />
          <Field label="职责描述" field="description" value={config.description as string ?? ''} onChange={updateField} textarea />
          <Field label="接口签名" field="interfaceSignature" value={config.interfaceSignature as string ?? ''} onChange={updateField} textarea />
        </>
      )
    case 'generate':
      return (
        <>
          <Field label="功能描述" field="description" value={config.description as string ?? ''} onChange={updateField} textarea />
          <Field label="代码风格" field="codeStyle" value={config.codeStyle as string ?? ''} onChange={updateField} />
          <Field label="文件路径模板" field="filePathTemplate" value={config.filePathTemplate as string ?? ''} onChange={updateField} />
          <Field label="依赖版本" field="dependencies" value={config.dependencies as string ?? ''} onChange={updateField} textarea />
        </>
      )
    case 'validate':
      return (
        <>
          <div>
            <Label>约束类型</Label>
            <Select
              value={config.type as string ?? 'lint'}
              onValueChange={(v) => updateField('type', v)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="选择类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lint">Lint</SelectItem>
                <SelectItem value="type-safety">类型安全</SelectItem>
                <SelectItem value="performance">性能</SelectItem>
                <SelectItem value="security">安全</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>严重级别</Label>
            <Select
              value={config.severity as string ?? 'error'}
              onValueChange={(v) => updateField('severity', v)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="选择级别" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )
    case 'condition':
      return (
        <>
          <Field label="条件表达式" field="expression" value={config.expression as string ?? ''} onChange={updateField} textarea />
          <Field label="分支 A 标签" field="branchA" value={config.branchA as string ?? ''} onChange={updateField} />
          <Field label="分支 B 标签" field="branchB" value={config.branchB as string ?? ''} onChange={updateField} />
        </>
      )
    case 'output':
      return (
        <>
          <div>
            <Label>输出格式</Label>
            <Select
              value={config.format as string ?? 'markdown'}
              onValueChange={(v) => updateField('format', v)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="选择格式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="markdown">Markdown</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="yaml">YAML</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )
    case 'data-model':
      return (
        <>
          <Field label="模型名称" field="name" value={config.name as string ?? ''} onChange={updateField} />
          <Field label="描述" field="description" value={config.description as string ?? ''} onChange={updateField} textarea />
        </>
      )
    case 'api':
      return (
        <>
          <div>
            <Label>请求方法</Label>
            <Select
              value={config.method as string ?? 'GET'}
              onValueChange={(v) => updateField('method', v)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="选择方法" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Field label="路径" field="path" value={config.path as string ?? ''} onChange={updateField} />
          <Field label="描述" field="description" value={config.description as string ?? ''} onChange={updateField} textarea />
          <Field label="请求体示例" field="requestBody" value={config.requestBody as string ?? ''} onChange={updateField} textarea />
          <Field label="响应体示例" field="responseBody" value={config.responseBody as string ?? ''} onChange={updateField} textarea />
        </>
      )
    case 'env':
      return (
        <>
          <div>
            <Label className="mb-1">环境变量</Label>
            <p className="text-xs text-gray-400 mb-2">在下方编辑或通过 JSON 配置</p>
          </div>
        </>
      )
    case 'test':
      return (
        <>
          <Field label="测试框架" field="framework" value={config.framework as string ?? 'vitest'} onChange={updateField} />
          <Field label="覆盖率目标 (%)" field="coverageTarget" value={String(config.coverageTarget ?? 80)} onChange={(f, v) => updateField(f, Number(v))} />
          <Field label="测试风格" field="style" value={config.style as string ?? ''} onChange={updateField} />
        </>
      )
    case 'example':
      return (
        <>
          <Field label="语言" field="language" value={config.language as string ?? 'typescript'} onChange={updateField} />
          <Field label="说明" field="caption" value={config.caption as string ?? ''} onChange={updateField} />
          <Field label="代码" field="code" value={config.code as string ?? ''} onChange={updateField} textarea />
        </>
      )
    default:
      return null
  }
}

function Field({
  label,
  field,
  value,
  onChange,
  textarea,
}: {
  label: string
  field: string
  value: string
  onChange: (field: string, value: string) => void
  textarea?: boolean
}) {
  return (
    <div>
      <Label>{label}</Label>
      {textarea ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          className="mt-1"
          rows={3}
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          className="mt-1"
        />
      )}
    </div>
  )
}
