'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { type Node, type Edge } from '@xyflow/react'
import { Button } from '@/components/ui/button'
import { X, Sparkles, Loader2, Send, ChevronRight } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface AiSidebarProps {
  workflowId: string
  nodes: Node[]
  edges: Edge[]
  isOpen: boolean
  onClose: () => void
  onNodesGenerated: (nodes: Node[], edges: Edge[]) => void
}

/** 从画布提取完整上下文（含节点 ID，供 AI 增量编辑使用） */
function buildContext(nodes: Node[], edges: Edge[]): string {
  if (nodes.length === 0) return '（空画布，从零开始构建）'

  const parts: string[] = []
  parts.push(`## 当前画布已有 ${nodes.length} 个节点 + ${edges.length} 条连线`)

  // 按类型统计
  const typeCount: Record<string, number> = {}
  for (const n of nodes) {
    const t = n.type || 'unknown'
    typeCount[t] = (typeCount[t] || 0) + 1
  }
  parts.push('### 节点类型分布')
  for (const [type, count] of Object.entries(typeCount)) {
    parts.push(`- ${type}: ${count} 个`)
  }

  // 完整节点列表（含 ID，供 AI 复用）
  parts.push('### 现有节点详情（如需保留请复用其 id）')
  for (const n of nodes) {
    const cfg = n.data?.config
    const cfgSummary = cfg
      ? Object.entries(cfg as Record<string, unknown>)
          .filter(([, v]) => v !== undefined && v !== null && v !== '')
          .slice(0, 3)
          .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
          .join(', ')
      : ''
    parts.push(
      `- id:${n.id}  type:${n.type}  label:"${n.data?.label || ''}"` +
        (cfgSummary ? `  config:(${cfgSummary})` : '')
    )
  }

  // 连线
  if (edges.length > 0) {
    parts.push('### 现有连线')
    for (const e of edges) {
      parts.push(`- ${e.source} → ${e.target}${e.label ? ` (${e.label})` : ''}`)
    }
  }

  return parts.join('\n')
}

/** 读取 Provider 配置 */
function getProviderBody() {
  if (typeof localStorage === 'undefined') return {}

  const selectedProvider = localStorage.getItem('llm_selected_provider') || 'openai'
  const customProviders = (() => {
    try { return JSON.parse(localStorage.getItem('llm_custom_providers') || '[]') }
    catch { return [] }
  })()

  let customProvider = undefined
  if (selectedProvider.startsWith('custom:')) {
    const cpId = selectedProvider.replace('custom:', '')
    customProvider = customProviders.find((p: Record<string, unknown>) => p.id === cpId)
  }

  return {
    llmApiKey: localStorage.getItem('llm_api_key') || undefined,
    llmBaseUrl: localStorage.getItem('llm_base_url') || undefined,
    llmModel: localStorage.getItem('llm_model') || undefined,
    anthropicKey: localStorage.getItem('llm_anthropic_key') || undefined,
    googleKey: localStorage.getItem('llm_google_key') || undefined,
    selectedProvider,
    customProvider: customProvider || undefined,
  }
}

export default function AiSidebar({
  workflowId,
  nodes,
  edges,
  isOpen,
  onClose,
  onNodesGenerated,
}: AiSidebarProps) {
  const [input, setInput] = useState('')
  const [generating, setGenerating] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const statusRef = useRef('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, status])

  const handleSend = useCallback(async () => {
    const desc = input.trim()
    if (desc.length < 5) {
      setError('请至少输入 5 个字描述您的需求')
      return
    }

    const providerBody = getProviderBody()
    const apiKey = providerBody.llmApiKey
    if (!apiKey && !providerBody.anthropicKey && !providerBody.googleKey) {
      setError('请先在设置页面配置 API Key')
      return
    }

    // 添加用户消息
    const userMsg: Message = { role: 'user', content: desc, timestamp: Date.now() }
    setMessages(prev => [...prev, userMsg])

    setGenerating(true)
    setError('')
    setStatus('正在连接 AI...')
    statusRef.current = ''
    setInput('')

    const context = buildContext(nodes, edges)
    const hasExistingNodes = nodes.length > 0

    try {
      const res = await fetch(`/api/workflows/${workflowId}/auto-layout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: desc,
          context,
          history: messages.slice(-6),
          hasExistingNodes,
          ...providerBody,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: '请求失败' }))
        setError(data.error || '生成失败')
        setGenerating(false)
        return
      }

      // SSE 流式消费
      const reader = res.body?.getReader()
      if (!reader) {
        setError('无法读取响应流')
        setGenerating(false)
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''
      const collectedNodes: Node[] = []
      const collectedEdges: Edge[] = []
      let aiSummary = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const jsonStr = line.slice(6)
          try {
            const event = JSON.parse(jsonStr) as Record<string, unknown>

            switch (event.type) {
              case 'planning':
              case 'parsing':
                statusRef.current = event.message as string
                setStatus(event.message as string)
                break

              case 'text-chunk':
                statusRef.current += event.text as string
                setStatus(`AI 思考中... ${statusRef.current.slice(-80)}`)
                break

              case 'plan-ready':
                // 不清空画布！收集完毕后一次性替换
                collectedNodes.length = 0
                collectedEdges.length = 0
                aiSummary = `已规划 ${event.nodeCount} 个节点 + ${event.edgeCount} 条连线`
                setStatus(`正在创建节点...`)
                break

              case 'node': {
                const n = event.node as Record<string, unknown>
                const newNode: Node = {
                  id: n.id as string,
                  type: n.type as string,
                  position: n.position as { x: number; y: number },
                  data: n.data as { label: string; config: Record<string, unknown> },
                }
                collectedNodes.push(newNode)
                // 流式显示：把旧节点 + 已收集的新节点一起显示
                // 旧节点中 ID 匹配的会被替换（AI 复用了 ID），不匹配的保留
                const mergedNodes = mergeNodes(nodes, collectedNodes)
                const mergedEdges = mergeEdges(edges, collectedEdges)
                onNodesGenerated(mergedNodes, mergedEdges)
                break
              }

              case 'edge': {
                const e = event.edge as Record<string, unknown>
                const newEdge: Edge = {
                  id: e.id as string,
                  source: e.source as string,
                  target: e.target as string,
                  label: (e.label as string) ?? undefined,
                }
                collectedEdges.push(newEdge)
                const mergedNodes = mergeNodes(nodes, collectedNodes)
                const mergedEdges = mergeEdges(edges, collectedEdges)
                onNodesGenerated(mergedNodes, mergedEdges)
                break
              }

              case 'complete':
                setStatus('')
                setGenerating(false)
                // 最终一次性替换为 AI 的完整输出
                onNodesGenerated([...collectedNodes], [...collectedEdges])
                if (aiSummary) {
                  setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `\u2705 ${aiSummary}`,
                    timestamp: Date.now(),
                  }])
                }
                break

              case 'error':
                setError(event.error as string || '生成失败')
                setGenerating(false)
                break
            }
          } catch {
            // 跳过无法解析的行
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败')
    } finally {
      setGenerating(false)
    }
  }, [input, workflowId, nodes, edges, messages, onNodesGenerated])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  if (!isOpen) return null

  return (
    <aside className="flex w-[380px] shrink-0 flex-col border-l bg-white">
      {/* 标题栏 */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <span className="text-sm font-medium">AI 工作流设计器</span>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* 对话历史 + 状态 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* 画布上下文 */}
        {nodes.length > 0 && (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-2">
            <p className="text-xs font-medium text-blue-700 mb-1">
              <ChevronRight className="inline h-3 w-3" /> 画布上下文
            </p>
            <pre className="text-xs text-blue-600 whitespace-pre-wrap font-mono max-h-[180px] overflow-y-auto">
              {buildContext(nodes, edges)}
            </pre>
          </div>
        )}

        {/* 历史消息 */}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* 生成状态 */}
        {generating && status && (
          <div className="rounded-md border border-purple-200 bg-purple-50 p-2">
            <p className="text-xs text-purple-700 font-mono whitespace-pre-wrap break-all">
              {status}
            </p>
          </div>
        )}

        {/* 错误 */}
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-2">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区 */}
      <div className="shrink-0 border-t p-3 space-y-2">
        <textarea
          className="min-h-[80px] w-full resize-none rounded-md border border-gray-200 bg-white p-2 text-sm outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
          placeholder="描述你的项目需求，或告诉 AI 如何修改当前工作流..."
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setError('')
          }}
          onKeyDown={handleKeyDown}
          disabled={generating}
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSend}
            disabled={generating || input.trim().length < 5}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {generating ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Send className="mr-1 h-3 w-3" />
                发送
              </>
            )}
          </Button>
        </div>
      </div>
    </aside>
  )
}

/**
 * 增量合并：旧节点中不在已收集列表里的保留，
 * 已在收集列表里的用新数据覆盖。
 * 这样流式过程中既有旧节点又有新节点，不会突然全空。
 */
function mergeNodes(oldNodes: Node[], collected: Node[]): Node[] {
  const collectedMap = new Map(collected.map(n => [n.id, n]))
  const merged: Node[] = []
  // 先放旧节点（如果不在收集列表中）
  for (const n of oldNodes) {
    if (!collectedMap.has(n.id)) {
      merged.push(n)
    }
  }
  // 再放所有已收集的节点
  for (const n of collected) {
    merged.push(n)
  }
  return merged
}

function mergeEdges(oldEdges: Edge[], collected: Edge[]): Edge[] {
  const collectedMap = new Map(collected.map(e => [e.id, e]))
  const merged: Edge[] = []
  for (const e of oldEdges) {
    if (!collectedMap.has(e.id)) {
      merged.push(e)
    }
  }
  for (const e of collected) {
    merged.push(e)
  }
  return merged
}
