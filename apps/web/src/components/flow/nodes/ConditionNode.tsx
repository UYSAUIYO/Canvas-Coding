'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'

function ConditionNode({ data, selected }: NodeProps) {
  return (
    <div
      className={`min-w-[180px] rounded-lg border-2 bg-white shadow-md transition-shadow ${
        selected ? 'border-red-500 shadow-lg' : 'border-red-200'
      }`}
    >
      <div className="flex items-center gap-2 rounded-t-lg bg-red-50 px-3 py-2">
        <span className="text-lg">🔀</span>
        <span className="text-sm font-semibold text-red-700">{data.label as string}</span>
      </div>
      <div className="px-3 py-2">
        <p className="text-xs text-gray-500">条件分支</p>
      </div>
      <Handle type="target" position={Position.Left} className="!bg-red-500" />
      <Handle type="source" position={Position.Right} className="!bg-red-500" id="branch-a" />
      <Handle type="source" position={Position.Bottom} className="!bg-red-400" id="branch-b" />
    </div>
  )
}

export default memo(ConditionNode)
