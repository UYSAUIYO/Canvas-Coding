import type { ProjectConfig } from '@canvas/shared/types'

/**
 * 渲染项目元信息 Prompt 片段
 */
export function renderProjectPrompt(config: ProjectConfig): string {
  const lines: string[] = []

  lines.push('## 项目概览')
  lines.push('')

  if (config.name) {
    lines.push(`**项目名称**：${config.name}`)
  }
  if (config.language) {
    lines.push(`**编程语言**：${config.language}`)
  }
  if (config.framework) {
    lines.push(`**框架**：${config.framework}`)
  }
  if (config.description) {
    lines.push('')
    lines.push(config.description)
  }

  return lines.join('\n')
}
