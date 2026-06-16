import type { TestConfig } from '@canvas/shared/types'

/**
 * 渲染测试策略 Prompt 片段
 */
export function renderTestPrompt(config: TestConfig): string {
  const lines: string[] = []

  lines.push('## 测试策略')
  lines.push('')

  if (config.framework) {
    lines.push(`**测试框架**：${config.framework}`)
  }

  if (config.coverageTarget) {
    lines.push(`**覆盖率目标**：${config.coverageTarget}%`)
  }

  if (config.style) {
    lines.push(`**测试风格**：${config.style}`)
  }

  if (config.focus.length > 0) {
    lines.push('')
    lines.push('**关注点**：')
    for (const f of config.focus) {
      lines.push(`- ${f}`)
    }
  }

  lines.push('')
  return lines.join('\n')
}
