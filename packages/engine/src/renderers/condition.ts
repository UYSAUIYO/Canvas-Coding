import type { ConditionConfig } from '@canvas/shared/types'

/**
 * 渲染条件分支 Prompt 片段
 */
export function renderConditionPrompt(config: ConditionConfig, activeBranch: 'A' | 'B' = 'A'): string {
  const lines: string[] = []

  const branchLabel = activeBranch === 'A' ? (config.branchA || '分支 A') : (config.branchB || '分支 B')

  lines.push('> 条件分支：如 ' + config.expression)
  lines.push('> 当前路径：**' + branchLabel + '**')
  lines.push('')

  return lines.join('\n')
}
