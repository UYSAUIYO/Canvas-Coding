'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, MoreHorizontal, Pencil, Trash2, Bot } from 'lucide-react'

interface WorkflowItem {
  id: string
  name: string
  description: string | null
  updatedAt: string
  nodes: unknown[]
  edges: unknown[]
}

export default function DashboardPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/workflows')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setWorkflows(data)
        } else {
          setError(data?.error || '获取工作流列表失败')
          setWorkflows([])
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const createWorkflow = async () => {
    const res = await fetch('/api/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '未命名工作流' }),
    })
    const data = await res.json()
    router.push(`/workflows/${data.id}`)
  }

  const initials = (session?.user?.name || session?.user?.email || 'U').charAt(0).toUpperCase()

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">我的工作流</h1>
          <p className="mt-1 text-sm text-gray-500">搭建可视化 Prompt 生成管道</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span>{session?.user?.name || session?.user?.email}</span>
          </div>
          <Button onClick={createWorkflow}>+ 新建工作流</Button>
          <Button variant="ghost" size="icon" title="智能体" onClick={() => router.push('/dashboard/agents')}>
            <Bot className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: '/login' })}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator className="mb-6" />

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">加载失败</p>
          <p className="mt-1 text-sm text-red-600">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => { setError(''); setLoading(true); window.location.reload() }}>
            重试
          </Button>
        </div>
      ) : loading ? (
        <p className="text-sm text-gray-400">加载中...</p>
      ) : workflows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="mb-2 text-lg text-gray-500">还没有工作流</p>
          <p className="mb-4 text-sm text-gray-400">点击上方按钮创建第一个</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workflows.map((wf) => (
            <WorfklowCard
              key={wf.id}
              workflow={wf}
              onDeleted={(id: string) => setWorkflows((list) => list.filter((w) => w.id !== id))}
              onUpdated={(updated: WorkflowItem) =>
                setWorkflows((list) =>
                  list.map((w) => (w.id === updated.id ? updated : w)),
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
function WorfklowCard({
  workflow,
  onDeleted,
  onUpdated,
}: {
  workflow: WorkflowItem
  onDeleted: (id: string) => void
  onUpdated: (wf: WorkflowItem) => void
}) {
  const router = useRouter()
  const [renameOpen, setRenameOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [newName, setNewName] = useState(workflow.name)
  const [newDesc, setNewDesc] = useState(workflow.description ?? '')

  const handleRename = useCallback(async () => {
    const res = await fetch(`/api/workflows/${workflow.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    })
    const data = await res.json()
    onUpdated({ ...workflow, name: data.name })
    setRenameOpen(false)
  }, [workflow, newName, onUpdated])

  const handleEdit = useCallback(async () => {
    const res = await fetch(`/api/workflows/${workflow.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: newDesc }),
    })
    const data = await res.json()
    onUpdated({ ...workflow, description: data.description })
    setEditOpen(false)
  }, [workflow, newDesc, onUpdated])

  const handleDelete = useCallback(async () => {
    await fetch(`/api/workflows/${workflow.id}`, { method: 'DELETE' })
    onDeleted(workflow.id)
    setDeleteOpen(false)
  }, [workflow, onDeleted])

  return (
    <>
      <Card
        className="group relative cursor-pointer transition-shadow hover:shadow-md"
        onClick={() => router.push(`/workflows/${workflow.id}`)}
      >
        <CardHeader className="pr-10">
          <CardTitle className="text-base">{workflow.name}</CardTitle>
          {workflow.description && (
            <p className="text-sm text-gray-500">{workflow.description}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{workflow.nodes.length} 个节点</Badge>
            <Badge variant="secondary">{workflow.edges.length} 条连线</Badge>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-gray-400">
            更新于 {new Date(workflow.updatedAt).toLocaleString('zh-CN')}
          </p>
        </CardFooter>

        {/* 三点菜单 */}
        <div className="absolute right-2 top-2" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setNewName(workflow.name); setRenameOpen(true) }}>
                <Pencil className="mr-2 h-4 w-4" />
                重命名
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setNewDesc(workflow.description ?? ''); setEditOpen(true) }}>
                <Pencil className="mr-2 h-4 w-4" />
                编辑描述
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>

      {/* 重命名 Dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名工作流</DialogTitle>
          </DialogHeader>
          <div>
            <Label htmlFor="rename">名称</Label>
            <Input
              id="rename"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRename() }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>取消</Button>
            <Button onClick={handleRename} disabled={!newName.trim()}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑描述 Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑描述</DialogTitle>
          </DialogHeader>
          <div>
            <Label htmlFor="edit-desc">描述</Label>
            <Textarea
              id="edit-desc"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>取消</Button>
            <Button onClick={handleEdit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            确定要删除「{workflow.name}」吗？此操作不可撤销。
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete}>删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
