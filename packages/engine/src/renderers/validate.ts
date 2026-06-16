import type { ValidateConfig } from '@canvas/shared/types'

const severityLabel: Record<string, string> = {
  error: '必须满足',
  warning: '建议满足',
}

/**
 * 渲染质量约束 Prompt 片段
 */
export function renderValidatePrompt(config: ValidateConfig): string {
  const lines: string[] = []

  lines.push('## 质量约束')
  lines.push('')

  if (config.type) {
    const typeLabels: Record<string, string> = {
      lint: '代码规范',
      'type-safety': '类型安全',
      performance: '性能优化',
      security: '安全要求',
    }
    lines.push(`**约束类型**：${typeLabels[config.type] ?? config.type}`)
    lines.push('')
  }

  if (config.rules && config.rules.length > 0) {
    const label = severityLabel[config.severity] ?? '需要满足'
    lines.push(`以下规则**${label}**：`)
    lines.push('')
    for (const rule of config.rules) {
      lines.push(`- ${rule}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}
