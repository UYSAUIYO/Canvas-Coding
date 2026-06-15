"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AgentOption {
  id: string;
  name: string;
  icon: string;
  isBuiltIn: boolean;
  nodeType: string | null;
}

interface AgentSelectorProps {
  nodeType: string;
  value: string | null;
  onChange: (agentId: string | null) => void;
}

export default function AgentSelector({
  nodeType,
  value,
  onChange,
}: AgentSelectorProps) {
  const [agents, setAgents] = useState<AgentOption[]>([]);

  useEffect(() => {
    fetch("/api/agents")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // 筛选：内置（匹配节点类型）+ 所有自定义
          const filtered = data.filter(
            (a: AgentOption) =>
              (a.isBuiltIn && a.nodeType === nodeType) || !a.isBuiltIn
          );
          setAgents(filtered);
        }
      })
      .catch(console.error);
  }, [nodeType]);

  const builtinAgents = agents.filter((a) => a.isBuiltIn);
  const customAgents = agents.filter((a) => !a.isBuiltIn);

  return (
    <div>
      <Label>生成智能体</Label>
      <Select
        value={value ?? "__default__"}
        onValueChange={(v) => onChange(v === "__default__" ? null : v)}
      >
        <SelectTrigger className="mt-1">
          <SelectValue placeholder="默认内置智能体" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__default__">默认内置智能体</SelectItem>
          {builtinAgents.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.icon} {a.name} (内置)
            </SelectItem>
          ))}
          {customAgents.length > 0 && (
            <>
              <div className="px-2 py-1 text-xs text-gray-400">自定义智能体</div>
              {customAgents.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.icon} {a.name}
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
      <p className="mt-1 text-xs text-gray-400">
        {value
          ? "使用选定的智能体生成"
          : `使用内置「${nodeType}」智能体（推荐）`}
      </p>
    </div>
  );
}
