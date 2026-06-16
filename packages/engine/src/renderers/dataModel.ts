import type { DataModelConfig } from '@canvas/shared/types'

/**
 * 渲染数据模型 Prompt 片段
 */
export function renderDataModelPrompt(config: DataModelConfig): string {
  const lines: string[] = []

  lines.push('## 数据模型')
  lines.push('')

  if (config.name) {
    lines.push(`**实体名称**：${config.name}`)
    lines.push('')
  }

  if (config.description) {
    lines.push(config.description)
    lines.push('')
  }

  if (config.fields.length > 0) {
    lines.push('| 字段 | 类型 | 描述 | 约束 |')
    lines.push('|------|------|------|------|')
    for (const field of config.fields) {
      lines.push(`| ${field.name} | ${field.type} | ${field.description || '-'} | ${field.constraints || '-'} |`)
    }
    lines.push('')
  }

  return lines.join('\n')
}
