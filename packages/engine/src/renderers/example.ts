import type { ExampleConfig } from '@canvas/shared/types'

/**
 * 渲染代码示例 Prompt 片段
 */
export function renderExamplePrompt(config: ExampleConfig): string {
  const lines: string[] = []

  lines.push('## 代码示例参考')
  lines.push('')

  if (config.caption) {
    lines.push(config.caption)
    lines.push('')
  }

  if (config.code) {
    const lang = config.language || 'typescript'
    lines.push('```' + lang)
    lines.push(config.code)
    lines.push('```')
    lines.push('')
  }

  return lines.join('\n')
}
