'use client'

import { Button } from '@/components/ui/button'
import { Download, X, FileText, Loader2 } from 'lucide-react'
import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface PromptPanelProps {
  isOpen: boolean
  onClose: () => void
  generating: boolean
  genProgress: number
  genStatus: string
  genOutput: string
  onDownloadMd: () => void
}

export default function PromptPanel({
  isOpen,
  onClose,
  generating,
  genProgress,
  genStatus,
  genOutput,
  onDownloadMd,
}: PromptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [genOutput])

  if (!isOpen) return null

  return (
    <div className="flex h-full w-1/2 shrink-0 flex-col border-l bg-white">
      {/* 头部 */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium text-gray-700">Prompt 输出</span>
          {generating && (
            <Loader2 className="ml-1 h-3 w-3 animate-spin text-blue-500" />
          )}
        </div>
        <div className="flex items-center gap-2">
          {genOutput && !generating && (
            <Button
              size="sm"
              variant="outline"
              onClick={onDownloadMd}
            >
              <Download className="mr-1 h-3 w-3" />
              导出 MD
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 进度条 */}
      {generating && (
        <div className="shrink-0 border-b px-4 py-2">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-gray-500">{genStatus}</span>
            <span className="text-gray-400">{genProgress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${genProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* 状态提示（无输出时） */}
      {!generating && genStatus && !genOutput && (
        <div className="px-4 py-3 text-sm text-gray-500">{genStatus}</div>
      )}

      {/* 内容区 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-gray-50 p-4"
      >
        {genOutput ? (
          <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-gray-900 prose-h1:text-xl prose-h1:border-b prose-h1:pb-2 prose-h2:text-lg prose-h2:mt-6 prose-h3:text-base prose-p:text-gray-700 prose-p:leading-relaxed prose-li:text-gray-700 prose-code:rounded prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-xs prose-code:text-pink-600 prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-a:text-blue-600 prose-strong:text-gray-900 prose-blockquote:border-l-blue-400 prose-blockquote:bg-blue-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-table:border-collapse prose-th:border prose-th:border-gray-300 prose-th:bg-gray-100 prose-th:px-3 prose-th:py-1.5 prose-td:border prose-td:border-gray-300 prose-td:px-3 prose-td:py-1.5 prose-hr:my-4 prose-hr:border-gray-200">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {genOutput}
            </ReactMarkdown>
          </div>
        ) : (
          !generating && (
            <div className="flex h-full flex-col items-center justify-center text-gray-400">
              <FileText className="mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">点击「生成 Prompt」按钮开始生成</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}
