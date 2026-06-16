import type { OutputConfig } from '@canvas/shared/types'

/**
 * 渲染输出配置 Prompt 片段
 */
export function renderOutputPrompt(config: OutputConfig, fullPrompt: string): string {
  const format = config.format || 'markdown'

  if (format === 'json') {
    return JSON.stringify({ prompt: fullPrompt, format: 'json', timestamp: new Date().toISOString() }, null, 2)
  }

  if (format === 'yaml') {
    const yaml = ['---', `prompt: |`]
    for (const line of fullPrompt.split('\n')) {
      yaml.push(`  ${line}`)
    }
    yaml.push(`format: yaml`)
    yaml.push(`timestamp: ${new Date().toISOString()}`)
    return yaml.join('\n')
  }

  // 默认 Markdown：直接返回，前面拼接标题
  return `# Vibe Coding Prompt\n\n${fullPrompt}`
}
