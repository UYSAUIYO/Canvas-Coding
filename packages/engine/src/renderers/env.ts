import type { EnvConfig } from '@canvas/shared/types'

/**
 * 渲染环境配置 Prompt 片段
 */
export function renderEnvPrompt(config: EnvConfig): string {
  const lines: string[] = []

  lines.push('## 环境变量')
  lines.push('')

  if (config.variables.length > 0) {
    lines.push('| 变量名 | 描述 | 默认值 |')
    lines.push('|--------|------|--------|')
    for (const v of config.variables) {
      lines.push(`| \`${v.key}\` | ${v.description || '-'} | ${v.defaultValue || '-'} |`)
    }
    lines.push('')
  }

  return lines.join('\n')
}
