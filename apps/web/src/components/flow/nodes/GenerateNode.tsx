'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'

function GenerateNode({ data, selected }: NodeProps) {
  return (
    <div
      className={`min-w-[180px] rounded-lg border-2 bg-white shadow-md transition-shadow ${
        selected ? 'border-amber-500 shadow-lg' : 'border-amber-200'
      }`}
    >
      <div className="flex items-center gap-2 rounded-t-lg bg-amber-50 px-3 py-2">
        <span className="text-lg">⚡</span>
        <span className="text-sm font-semibold text-amber-700">{data.label as string}</span>
      </div>
      <div className="px-3 py-2">
        <p className="text-xs text-gray-500">代码生成</p>
      </div>
      <Handle type="target" position={Position.Left} className="!bg-amber-500" />
      <Handle type="source" position={Position.Right} className="!bg-amber-500" />
    </div>
  )
}

export default memo(GenerateNode)
