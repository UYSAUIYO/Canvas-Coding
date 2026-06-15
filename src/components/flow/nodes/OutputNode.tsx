'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'

function OutputNode({ data, selected }: NodeProps) {
  return (
    <div
      className={`min-w-[180px] rounded-lg border-2 bg-white shadow-md transition-shadow ${
        selected ? 'border-indigo-500 shadow-lg' : 'border-indigo-200'
      }`}
    >
      <div className="flex items-center gap-2 rounded-t-lg bg-indigo-50 px-3 py-2">
        <span className="text-lg">📄</span>
        <span className="text-sm font-semibold text-indigo-700">{data.label as string}</span>
      </div>
      <div className="px-3 py-2">
        <p className="text-xs text-gray-500">输出配置</p>
      </div>
      <Handle type="target" position={Position.Left} className="!bg-indigo-500" />
    </div>
  )
}

export default memo(OutputNode)
