'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  type OnConnect,
  type ReactFlowInstance,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { nodeTypes } from './nodes'
import PropertyPanel from './PropertyPanel'
import { hasCycle } from '@/lib/dag'
import type { NodeType } from '@canvas/shared/types'
import { useAutoSave } from '@/hooks/useAutoSave'

interface CanvasProps {
  workflowId: string
  initialNodes: Node[]
  initialEdges: Edge[]
}

export default function Canvas({ workflowId, initialNodes, initialEdges }: CanvasProps) {
  const reactFlowRef = useRef<ReactFlowInstance | null>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)

  // 当外部通过 SSE 等机制批量更新节点/边时，同步到 ReactFlow 内部状态
  const prevInitialNodesRef = useRef(initialNodes)
  const prevInitialEdgesRef = useRef(initialEdges)
  useEffect(() => {
    if (initialNodes !== prevInitialNodesRef.current) {
      prevInitialNodesRef.current = initialNodes
      setNodes(initialNodes)
    }
  }, [initialNodes, setNodes])
  useEffect(() => {
    if (initialEdges !== prevInitialEdgesRef.current) {
      prevInitialEdgesRef.current = initialEdges
      setEdges(initialEdges)
    }
  }, [initialEdges, setEdges])

  // 自动保存
  const saveWorkflow = useCallback(async () => {
    const payload = {
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type as string,
        position: n.position,
        data: n.data,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
      })),
    }
    await fetch(`/api/workflows/${workflowId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  }, [nodes, edges, workflowId])

  useAutoSave(saveWorkflow, [nodes, edges])

  // 连线 (含环路检测)
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      const newEdge: Edge = {
        id: `e-${connection.source}-${connection.target}`,
        source: connection.source!,
        target: connection.target!,
      }

      const tempEdges = [...edges, newEdge]
      const flowNodes = nodes.map((n) => ({
        id: n.id,
        type: (n.type as NodeType) ?? 'project',
        position: { x: n.position.x, y: n.position.y },
        data: { label: String(n.data?.label ?? ''), config: (n.data?.config ?? {}) as Record<string, unknown> },
      }))

      const flowEdges = tempEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label as string | undefined,
      }))

      if (hasCycle(flowNodes as never, flowEdges as never)) {
        alert('不能形成环路！')
        return
      }

      setEdges((eds) => addEdge(connection, eds))
    },
    [edges, nodes, setEdges],
  )

  // 拖入新节点
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const nodeType = event.dataTransfer.getData('application/reactflow-type') as NodeType
      if (!nodeType || !reactFlowRef.current) return

      const position = reactFlowRef.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      const newNode: Node = {
        id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: nodeType,
        position,
        data: { label: getDefaultLabel(nodeType), config: getDefaultConfig(nodeType) },
      }

      setNodes((nds) => [...nds, newNode])
    },
    [setNodes],
  )

  // 选中节点
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  // 更新节点 label/config
  const updateNodeLabel = useCallback(
    (label: string) => {
      if (!selectedNode) return
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedNode.id ? { ...n, data: { ...n.data, label } } : n,
        ),
      )
      setSelectedNode((prev) => (prev ? { ...prev, data: { ...prev.data, label } } : null))
    },
    [selectedNode, setNodes],
  )

  const updateNodeConfig = useCallback(
    (config: Record<string, unknown>) => {
      if (!selectedNode) return
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedNode.id ? { ...n, data: { ...n.data, config } } : n,
        ),
      )
      setSelectedNode((prev) => (prev ? { ...prev, data: { ...prev.data, config } } : null))
    },
    [selectedNode, setNodes],
  )

  const nodeStyle = useMemo(
    () => ({
      selectedNodeId: selectedNode?.id ?? null,
      selectedNodeType: (selectedNode?.type as NodeType) ?? null,
      selectedNodeLabel: String(selectedNode?.data?.label ?? ''),
      selectedNodeConfig: (selectedNode?.data?.config ?? {}) as Record<string, unknown>,
    }),
    [selectedNode],
  )

  return (
    <div className="flex h-full w-full">
      {/* 画布 */}
      <div
        className="flex-1"
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onInit={(instance) => { reactFlowRef.current = instance }}
          nodeTypes={nodeTypes}
          fitView
          deleteKeyCode={['Backspace', 'Delete']}
        >
          <Controls />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <MiniMap
            nodeStrokeWidth={3}
            pannable
            zoomable
            style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}
          />
        </ReactFlow>
      </div>

      {/* 属性面板 */}
      <div className="w-[300px] shrink-0">
        <PropertyPanel
          nodeId={nodeStyle.selectedNodeId}
          nodeType={nodeStyle.selectedNodeType}
          nodeLabel={nodeStyle.selectedNodeLabel}
          config={nodeStyle.selectedNodeConfig}
          onLabelChange={updateNodeLabel}
          onConfigChange={updateNodeConfig}
        />
      </div>
    </div>
  )
}

function getDefaultLabel(type: NodeType): string {
  const labels: Record<NodeType, string> = {
    project: '新建项目',
    module: '新建模块',
    generate: '代码生成',
    validate: '质量约束',
    condition: '条件分支',
    output: '输出',
    'data-model': '数据模型',
    api: 'API 端点',
    env: '环境配置',
    test: '测试策略',
    example: '代码示例',
  }
  return labels[type] ?? '新节点'
}

function getDefaultConfig(type: NodeType): Record<string, unknown> {
  switch (type) {
    case 'project':
      return { name: '', language: 'TypeScript', framework: 'Next.js', description: '' }
    case 'module':
      return { name: '', description: '', dependencies: [], interfaceSignature: '' }
    case 'generate':
      return { description: '', codeStyle: '', filePathTemplate: '', dependencies: '' }
    case 'validate':
      return { type: 'lint', rules: [], severity: 'error' }
    case 'condition':
      return { expression: '', branchA: '分支 A', branchB: '分支 B' }
    case 'output':
      return { format: 'markdown' }
    case 'data-model':
      return { name: '', fields: [{ name: 'id', type: 'string', description: '主键', constraints: '@id' }], description: '' }
    case 'api':
      return { method: 'GET', path: '/api/', description: '', requestBody: '', responseBody: '' }
    case 'env':
      return { variables: [{ key: '', description: '', defaultValue: '' }] }
    case 'test':
      return { framework: 'vitest', coverageTarget: 80, style: '单元测试 + 集成测试', focus: [] }
    case 'example':
      return { code: '', language: 'typescript', caption: '' }
    default:
      return {}
  }
}
