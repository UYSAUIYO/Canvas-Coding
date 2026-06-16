import type { ApiConfig } from '@canvas/shared/types'

/**
 * 渲染 API 端点 Prompt 片段
 */
export function renderApiPrompt(config: ApiConfig): string {
  const lines: string[] = []

  lines.push('## API 端点')
  lines.push('')

  lines.push(`**方法**：\`${config.method}\``)
  lines.push(`**路径**：\`${config.path}\``)
  lines.push('')

  if (config.description) {
    lines.push(config.description)
    lines.push('')
  }

  if (config.requestBody) {
    lines.push('**请求体**：')
    lines.push('')
    lines.push('```json')
    lines.push(config.requestBody)
    lines.push('```')
    lines.push('')
  }

  if (config.responseBody) {
    lines.push('**响应体**：')
    lines.push('')
    lines.push('```json')
    lines.push(config.responseBody)
    lines.push('```')
    lines.push('')
  }

  return lines.join('\n')
}
