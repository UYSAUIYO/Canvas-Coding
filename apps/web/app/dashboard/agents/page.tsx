"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { NODE_TYPES } from "@canvas/shared/constants";

interface AgentItem {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  instructions: string;
  model: string;
  isBuiltIn: boolean;
  nodeType: string | null;
  createdAt: string;
  updatedAt: string;
}

const MODEL_OPTIONS = [
  { value: "gpt-5.5", label: "GPT-5.5" },
  { value: "gpt-5.5-instant", label: "GPT-5.5 Instant" },
  { value: "gpt-5.4", label: "GPT-5.4" },
  { value: "gpt-5.4-mini", label: "GPT-5.4 Mini" },
  { value: "o3", label: "o3 (Reasoning)" },
  { value: "o4-mini", label: "o4 Mini" },
  { value: "claude-fable-5", label: "Claude Fable 5" },
  { value: "claude-opus-4-8", label: "Claude Opus 4.8" },
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
  { value: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
  { value: "gemini-3.5-flash", label: "Gemini 3.5 Flash" },
  { value: "gemini-3.1-pro", label: "Gemini 3.1 Pro" },
  { value: "gemini-3-flash", label: "Gemini 3 Flash" },
  { value: "deepseek-chat", label: "DeepSeek V3" },
  { value: "deepseek-reasoner", label: "DeepSeek R1" },
];

export default function AgentsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editAgent, setEditAgent] = useState<AgentItem | null>(null);
  const [deleteAgent, setDeleteAgent] = useState<AgentItem | null>(null);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formIcon, setFormIcon] = useState("🤖");
  const [formInstructions, setFormInstructions] = useState("");
  const [formModel, setFormModel] = useState("gpt-5.5");
  const [formNodeType, setFormNodeType] = useState("");

  const loadAgents = useCallback(async () => {
    const res = await fetch("/api/agents");
    const data = await res.json();
    if (Array.isArray(data)) setAgents(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const resetForm = () => {
    setFormName("");
    setFormDesc("");
    setFormIcon("🤖");
    setFormInstructions("");
    setFormModel("gpt-5.5");
    setFormNodeType("");
  };

  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const openEdit = (agent: AgentItem) => {
    setFormName(agent.name);
    setFormDesc(agent.description ?? "");
    setFormIcon(agent.icon);
    setFormInstructions(agent.instructions);
    setFormModel(agent.model);
    setFormNodeType(agent.nodeType ?? "");
    setEditAgent(agent);
  };

  const handleCreate = async () => {
    const res = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formName,
        description: formDesc || null,
        icon: formIcon || "🤖",
        instructions: formInstructions,
        model: formModel,
        nodeType: formNodeType || null,
      }),
    });
    if (res.ok) {
      setCreateOpen(false);
      loadAgents();
    }
  };

  const handleUpdate = async () => {
    if (!editAgent) return;
    const res = await fetch(`/api/agents/${editAgent.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formName,
        description: formDesc || null,
        icon: formIcon || "🤖",
        instructions: formInstructions,
        model: formModel,
        nodeType: formNodeType || null,
      }),
    });
    if (res.ok) {
      setEditAgent(null);
      loadAgents();
    }
  };

  const handleDelete = async () => {
    if (!deleteAgent) return;
    const res = await fetch(`/api/agents/${deleteAgent.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setDeleteAgent(null);
      loadAgents();
    }
  };

  const getNodeTypeLabel = (nodeType: string | null) => {
    if (!nodeType) return null;
    const info = NODE_TYPES.find((t) => t.type === nodeType);
    return info ? `${info.icon} ${info.label}` : nodeType;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">智能体管理</h1>
            <p className="mt-1 text-sm text-gray-500">
              管理用于 Prompt 生成的 AI 智能体
            </p>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" /> 新建智能体
        </Button>
      </div>

      <Separator className="mb-6" />

      {loading ? (
        <p className="text-sm text-gray-400">加载中...</p>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="mb-2 text-lg text-gray-500">还没有智能体</p>
          <p className="mb-4 text-sm text-gray-400">
            请先运行种子脚本初始化内置智能体
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id} className="group relative">
              <CardHeader className="pr-10">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{agent.icon}</span>
                  <CardTitle className="text-base">{agent.name}</CardTitle>
                </div>
                {agent.description && (
                  <p className="text-sm text-gray-500">{agent.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{agent.model}</Badge>
                  {agent.isBuiltIn && <Badge>内置</Badge>}
                  {agent.nodeType && (
                    <Badge variant="outline">
                      {getNodeTypeLabel(agent.nodeType)}
                    </Badge>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-gray-400">
                  {agent.instructions.slice(0, 100)}...
                </p>
              </CardContent>

              {/* 三点菜单（仅自定义） */}
              {!agent.isBuiltIn && (
                <div className="absolute right-2 top-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100">
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(agent)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        编辑
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteAgent(agent)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* 创建/编辑对话框 */}
      <Dialog
        open={createOpen || !!editAgent}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            setEditAgent(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editAgent ? "编辑智能体" : "新建智能体"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <Label>名称 *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="我的智能体"
              />
            </div>
            <div>
              <Label>描述</Label>
              <Input
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="简要描述智能体的用途"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>图标</Label>
                <Input
                  value={formIcon}
                  onChange={(e) => setFormIcon(e.target.value)}
                  placeholder="🤖"
                />
              </div>
              <div>
                <Label>模型</Label>
                <Select value={formModel} onValueChange={(v) => setFormModel(v ?? "gpt-5.5")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODEL_OPTIONS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>绑定节点类型（可选）</Label>
              <Select
                value={formNodeType}
                onValueChange={(v) => setFormNodeType(v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="通用（不绑定）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">通用（不绑定）</SelectItem>
                  {NODE_TYPES.map((nt) => (
                    <SelectItem key={nt.type} value={nt.type}>
                      {nt.icon} {nt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>System Prompt *</Label>
              <Textarea
                value={formInstructions}
                onChange={(e) => setFormInstructions(e.target.value)}
                rows={8}
                placeholder="你是一个...&#10;输出要求：&#10;1. ..."
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateOpen(false);
                setEditAgent(null);
              }}
            >
              取消
            </Button>
            <Button
              onClick={editAgent ? handleUpdate : handleCreate}
              disabled={!formName.trim() || !formInstructions.trim()}
            >
              {editAgent ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog
        open={!!deleteAgent}
        onOpenChange={(open) => !open && setDeleteAgent(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            确定要删除「{deleteAgent?.name}」吗？此操作不可撤销。
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAgent(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
