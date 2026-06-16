'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'

function ModuleNode({ data, selected }: NodeProps) {
  return (
    <div
      className={`min-w-[180px] rounded-lg border-2 bg-white shadow-md transition-shadow ${
        selected ? 'border-purple-500 shadow-lg' : 'border-purple-200'
      }`}
    >
      <div className="flex items-center gap-2 rounded-t-lg bg-purple-50 px-3 py-2">
        <span className="text-lg">🧩</span>
        <span className="text-sm font-semibold text-purple-700">{data.label as string}</span>
      </div>
      <div className="px-3 py-2">
        <p className="text-xs text-gray-500">功能模块</p>
      </div>
      <Handle type="target" position={Position.Left} className="!bg-purple-500" />
      <Handle type="source" position={Position.Right} className="!bg-purple-500" />
    </div>
  )
}

export default memo(ModuleNode)
