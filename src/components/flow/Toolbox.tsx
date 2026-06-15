'use client'

import { useState, useCallback, useRef } from 'react'
import type { NodeType } from '@canvas/shared/types'
import { NODE_TYPES } from '@canvas/shared/constants'

interface ToolboxProps {
  onDragStart: (event: React.DragEvent, nodeType: NodeType) => void
}

export default function Toolbox({ onDragStart }: ToolboxProps) {
  const [isGrid, setIsGrid] = useState(false)
  const [width, setWidth] = useState(220)
  const isResizing = useRef(false)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isResizing.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMouseMove = (ev: MouseEvent) => {
      if (!isResizing.current) return
      const newWidth = Math.min(400, Math.max(160, ev.clientX))
      setWidth(newWidth)
    }
    const onMouseUp = () => {
      isResizing.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [])

  return (
    <div className="relative flex h-full shrink-0" style={{ width }}>
      <div className="flex h-full flex-col bg-white p-3 w-full">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-700">节点工具箱</h2>
            <p className="text-xs text-gray-400">拖拽到画布添加节点</p>
          </div>
          <button
            onClick={() => setIsGrid((v) => !v)}
            title={isGrid ? '切换为列表' : '切换为网格'}
            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            {isGrid ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="2" y1="3" x2="14" y2="3" />
                <line x1="2" y1="8" x2="14" y2="8" />
                <line x1="2" y1="13" x2="14" y2="13" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="2" width="5.5" height="5.5" rx="1" />
                <rect x="8.5" y="2" width="5.5" height="5.5" rx="1" />
                <rect x="2" y="8.5" width="5.5" height="5.5" rx="1" />
                <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" />
              </svg>
            )}
          </button>
        </div>
        <div
          className={
            isGrid
              ? 'grid flex-1 grid-cols-2 content-start gap-2 overflow-y-auto'
              : 'flex flex-1 flex-col gap-2 overflow-y-auto'
          }
        >
          {NODE_TYPES.map((info) => (
            <div
              key={info.type}
              draggable
              onDragStart={(e) => onDragStart(e, info.type)}
              className={
                isGrid
                  ? 'flex cursor-grab flex-col items-center gap-1 rounded-lg border-2 border-gray-100 p-2 transition-all hover:border-gray-300 hover:shadow-sm active:cursor-grabbing'
                  : 'flex cursor-grab items-center gap-2 rounded-lg border-2 border-gray-100 px-3 py-2.5 transition-all hover:border-gray-300 hover:shadow-sm active:cursor-grabbing'
              }
              style={{ borderLeftColor: isGrid ? 'transparent' : info.color, borderLeftWidth: isGrid ? '2px' : '3px', borderTopColor: isGrid ? info.color : 'transparent', borderTopWidth: isGrid ? '3px' : '2px' }}
            >
              <span className={isGrid ? 'text-xl' : 'text-base'}>{info.icon}</span>
              <div className={isGrid ? 'text-center' : ''}>
                <p className="text-sm font-medium text-gray-800">{info.label}</p>
                {!isGrid && <p className="text-xs text-gray-400">{info.description}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 拖拽手柄 */}
      <div
        onMouseDown={onMouseDown}
        className="absolute -right-1 top-0 z-10 h-full w-2 cursor-col-resize"
      />
    </div>
  )
}
