import type { ModuleConfig } from '@canvas/shared/types'

/**
 * 渲染模块定义 Prompt 片段
 */
export function renderModulePrompt(config: ModuleConfig, index: number): string {
  const lines: string[] = []

  lines.push(`### ${index}. ${config.name || '未命名模块'}`)
  lines.push('')

  if (config.description) {
    lines.push(config.description)
    lines.push('')
  }

  if (config.dependencies && config.dependencies.length > 0) {
    lines.push(`**依赖模块**：${config.dependencies.join('、')}`)
    lines.push('')
  }

  if (config.interfaceSignature) {
    lines.push('**接口签名**：')
    lines.push('')
    lines.push('```typescript')
    lines.push(config.interfaceSignature)
    lines.push('```')
    lines.push('')
  }

  return lines.join('\n')
}
