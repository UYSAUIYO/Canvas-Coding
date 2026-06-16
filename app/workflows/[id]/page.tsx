'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { type Node, type Edge } from '@xyflow/react'
import type { NodeType } from '@canvas/shared/types'
import Canvas from '@/components/flow/Canvas'
import Toolbox from '@/components/flow/Toolbox'
import AiSidebar from '@/components/flow/AiSidebar'
import PromptPanel from '@/components/flow/PromptPanel'
import { Button } from '@/components/ui/button'
import { Settings, Sparkles, PanelRightClose, PanelRightOpen } from 'lucide-react'

interface ProgressEvent {
  type: string
  nodeId?: string
  nodeLabel?: string
  nodeType?: string
  output?: string
  text?: string
  stepIndex?: number
  totalSteps?: number
  progress?: number
  error?: string
  layerIndex?: number
  totalLayers?: number
  nodeCount?: number
  nodeLabels?: string[]
}

export default function WorkflowEditorPage() {
  const params = useParams()
  const router = useRouter()
  const workflowId = params.id as string

  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [loading, setLoading] = useState(true)

  // 生成状态
  const [generating, setGenerating] = useState(false)
  const [genProgress, setGenProgress] = useState(0)
  const [genStatus, setGenStatus] = useState('')
  const [genOutput, setGenOutput] = useState('')
  const genOutputRef = useRef('')

  // 面板开关
  const [promptPanelOpen, setPromptPanelOpen] = useState(false)
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false)

  // 一键导出 Markdown
  const handleDownloadMd = useCallback(() => {
    const content = genOutputRef.current || genOutput
    if (!content) return
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prompt-${workflowId.slice(0, 8)}-${Date.now().toString(36)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [workflowId, genOutput])

  // AI 生成节点回调
  const handleNodesGenerated = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    setNodes(newNodes)
    setEdges(newEdges)
  }, [])

  // 构建 Provider 信息
  const getProviderBody = useCallback(() => {
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
  }, [])

  const handleGenerate = useCallback(async () => {
    // 打开 Prompt 面板
    setPromptPanelOpen(true)
    setGenerating(true)
    setGenProgress(0)
    setGenStatus('准备中...')
    setGenOutput('')
    genOutputRef.current = ''

    const apiKey = localStorage.getItem('llm_api_key')
    if (!apiKey && !localStorage.getItem('llm_anthropic_key') && !localStorage.getItem('llm_google_key')) {
      setGenStatus('请先在设置页面配置 API Key')
      setGenerating(false)
      return
    }

    try {
      const res = await fetch(`/api/workflows/${workflowId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...getProviderBody(),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        setGenStatus(`错误: ${err.error}`)
        setGenerating(false)
        return
      }

      const reader = res.body?.getReader()
      if (!reader) {
        setGenStatus('无法读取响应流')
        setGenerating(false)
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const event: ProgressEvent = JSON.parse(line.slice(6))

            switch (event.type) {
              case 'layer-start':
                setGenStatus(`第 ${event.layerIndex! + 1}/${event.totalLayers} 层 · 并行生成 ${event.nodeCount} 个节点: ${(event.nodeLabels ?? []).join(', ')}`)
                break
              case 'node-start':
                genOutputRef.current += `\n\n## ${event.nodeLabel}\n\n`
                setGenOutput(genOutputRef.current)
                setGenStatus(`正在生成: ${event.nodeLabel}`)
                break
              case 'node-chunk':
                genOutputRef.current += event.text || ''
                setGenOutput(genOutputRef.current)
                break
              case 'node-complete':
                setGenProgress(event.progress ?? 0)
                break
              case 'complete':
                setGenOutput(event.output || genOutputRef.current)
                setGenProgress(100)
                setGenStatus('生成完成!')
                setGenerating(false)
                break
              case 'error':
                setGenStatus(`错误: ${event.error}`)
                setGenerating(false)
                break
            }
          }
        }
      }
    } catch (err) {
      setGenStatus(`错误: ${err instanceof Error ? err.message : '未知错误'}`)
      setGenerating(false)
    }
  }, [workflowId])

  useEffect(() => {
    fetch(`/api/workflows/${workflowId}`)
      .then((res) => res.json())
      .then((data) => {
        const loadedNodes: Node[] = (data.nodes ?? []).map((n: { id: string; type: string; label: string; positionX: number; positionY: number; config: unknown }) => ({
          id: n.id,
          type: n.type,
          position: { x: n.positionX, y: n.positionY },
          data: { label: n.label, config: (n.config as Record<string, unknown>) ?? {} },
        }))
        const loadedEdges: Edge[] = (data.edges ?? []).map((e: { id: string; sourceNodeId: string; targetNodeId: string; label?: string }) => ({
          id: e.id,
          source: e.sourceNodeId,
          target: e.targetNodeId,
          label: e.label,
        }))
        setNodes(loadedNodes)
        setEdges(loadedEdges)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [workflowId])

  const onDragStart = useCallback((event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow-type', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-400">加载中...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      {/* 顶部工具栏 */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b bg-white px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
            ← 返回
          </Button>
          <span className="text-sm font-medium text-gray-700">工作流编辑器</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-purple-300 text-purple-600 hover:bg-purple-50"
            onClick={() => setAiSidebarOpen(!aiSidebarOpen)}
          >
            <Sparkles className="mr-1 h-3 w-3" />
            AI 设计
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.push('/dashboard/settings')}
          >
            <Settings className="mr-1 h-3 w-3" />
            设置
          </Button>
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={generating || nodes.length === 0}
          >
            {generating ? `生成中 ${genProgress}%` : '生成 Prompt'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            title={promptPanelOpen ? '隐藏输出面板' : '显示输出面板'}
            onClick={() => setPromptPanelOpen(!promptPanelOpen)}
          >
            {promptPanelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {/* 主体区域 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧工具箱 */}
        <Toolbox onDragStart={onDragStart} />

        {/* 中间画布 */}
        <div className="flex-1 min-w-0">
          <Canvas
            workflowId={workflowId}
            initialNodes={nodes}
            initialEdges={edges}
          />
        </div>

        {/* 右侧 Prompt 输出面板 (50% 宽度) */}
        <PromptPanel
          isOpen={promptPanelOpen}
          onClose={() => setPromptPanelOpen(false)}
          generating={generating}
          genProgress={genProgress}
          genStatus={genStatus}
          genOutput={genOutput}
          onDownloadMd={handleDownloadMd}
        />

        {/* AI 设计侧边栏（浮在最右侧） */}
        <AiSidebar
          workflowId={workflowId}
          nodes={nodes}
          edges={edges}
          isOpen={aiSidebarOpen}
          onClose={() => setAiSidebarOpen(false)}
          onNodesGenerated={handleNodesGenerated}
        />
      </div>
    </div>
  )
}
