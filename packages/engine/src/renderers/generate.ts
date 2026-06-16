import type { GenerateConfig, RenderContext } from '@canvas/shared/types'

/**
 * 渲染代码生成 Prompt 片段
 */
export function renderGeneratePrompt(config: GenerateConfig, context?: RenderContext): string {
  const lines: string[] = []

  lines.push('## 代码生成要求')
  lines.push('')

  if (config.description) {
    lines.push(config.description)
    lines.push('')
  }

  if (config.codeStyle) {
    lines.push(`**代码风格**：${config.codeStyle}`)
    lines.push('')
  }

  if (config.filePathTemplate) {
    lines.push(`**文件路径**：\`${config.filePathTemplate}\``)
    lines.push('')
  }

  if (config.dependencies) {
    lines.push('**依赖要求**：')
    lines.push('')
    lines.push(config.dependencies)
    lines.push('')
  }

  return lines.join('\n')
}
