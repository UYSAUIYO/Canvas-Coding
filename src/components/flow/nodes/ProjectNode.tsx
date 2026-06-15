'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'

function ProjectNode({ data, selected }: NodeProps) {
  return (
    <div
      className={`min-w-[180px] rounded-lg border-2 bg-white shadow-md transition-shadow ${
        selected ? 'border-blue-500 shadow-lg' : 'border-blue-200'
      }`}
    >
      <div className="flex items-center gap-2 rounded-t-lg bg-blue-50 px-3 py-2">
        <span className="text-lg">📦</span>
        <span className="text-sm font-semibold text-blue-700">{data.label as string}</span>
      </div>
      <div className="px-3 py-2">
        <p className="text-xs text-gray-500">项目元信息</p>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-blue-500" />
    </div>
  )
}

export default memo(ProjectNode)
