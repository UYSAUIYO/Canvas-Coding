import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { resolveModel } from "@/lib/model-provider";
import { streamText } from "ai";
import { z } from "zod";

// 节点类型对应的中文默认标签
const TYPE_LABELS: Record<string, string> = {
  project: "项目配置",
  module: "功能模块",
  generate: "代码生成",
  validate: "质量约束",
  condition: "条件分支",
  output: "输出配置",
  "data-model": "数据模型",
  api: "API 端点",
  env: "环境配置",
  test: "测试策略",
  example: "代码示例",
};

// JSON 校验：label 可选，缺失时自动生成；id 可选，用于增量编辑时复用已有节点
const nodeSchema = z.object({
  type: z.enum([
    "project", "module", "generate", "validate", "condition",
    "output", "data-model", "api", "env", "test", "example",
  ]),
  label: z.string().optional(),
  config: z.record(z.unknown()),
  id: z.string().optional(),
});

const autoLayoutSchema = z.object({
  nodes: z.array(nodeSchema),
  edges: z.array(
    z.object({
      sourceIndex: z.number().int().min(0),
      targetIndex: z.number().int().min(0),
      label: z.string().optional(),
    })
  ),
});

function generateId(): string {
  return (
    Math.random().toString(36).substring(2, 10) +
    Date.now().toString(36)
  );
}

/** 自动补全缺失的 label */
function ensureLabel(node: z.infer<typeof nodeSchema>): string {
  if (node.label && node.label.trim()) return node.label.trim();
  // 尝试从 config.name 获取
  if (typeof node.config?.name === "string" && node.config.name.trim()) {
    return node.config.name.trim();
  }
  // 尝试从 config.description 截取
  if (typeof node.config?.description === "string" && node.config.description.trim()) {
    return node.config.description.trim().slice(0, 20);
  }
  // 回退到类型默认标签
  return TYPE_LABELS[node.type] ?? node.type;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await params;

    const body = await request.json();
    const description = body.description as string;
    const context = body.context as string | undefined;
    const history = body.history as Array<{role: string, content: string}> | undefined;
    const hasExistingNodes = body.hasExistingNodes as boolean | undefined;
    const llmApiKey =
      body.llmApiKey || process.env.OPENAI_API_KEY;
    const llmBaseUrl =
      body.llmBaseUrl ||
      process.env.OPENAI_BASE_URL ||
      "https://api.openai.com/v1";
    const llmModel =
      body.llmModel || process.env.LLM_MODEL || "gpt-5.5";
    const anthropicKey =
      body.anthropicKey || process.env.ANTHROPIC_API_KEY;
    const googleKey =
      body.googleKey || process.env.GOOGLE_API_KEY;
    const selectedProvider =
      body.selectedProvider as string | undefined;
    const customProvider =
      body.customProvider as Record<string, unknown> | undefined;

    const model = resolveModel({
      model: llmModel,
      selectedProvider,
      openaiKey: llmApiKey,
      openaiBaseUrl: llmBaseUrl,
      anthropicKey,
      googleKey,
      customProvider: customProvider as Parameters<typeof resolveModel>[0]["customProvider"],
    });

    if (!description || description.trim().length < 5) {
      return NextResponse.json(
        { error: "请提供至少 5 个字的项目描述" },
        { status: 400 }
      );
    }

    const workflow = await prisma.workflow.findUnique({
      where: { id, userId },
    });

    if (!workflow || workflow.deletedAt) {
      return NextResponse.json(
        { error: "工作流不存在" },
        { status: 404 }
      );
    }

    // === SSE 流式 Agent Loop ===
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: Record<string, unknown>) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          // Phase 1: LLM 流式生成方案
          const isEditing = !!(hasExistingNodes && context)
          send({
            type: "planning",
            message: isEditing
              ? "AI 正在分析现有工作流和你的修改需求..."
              : "AI 正在分析需求，拆解工作流节点...",
          });

          const BASE_PROMPT = `你是一个专业的软件工程工作流设计师。用户会描述一个项目需求，你需要将其拆解为可视化节点图。

## 可用节点类型及配置字段

1. **project** — 项目信息
   config: { name, language, framework, description }
2. **module** — 功能模块
   config: { name, description, interfaceSignature, dependencies }
3. **generate** — 代码生成
   config: { description, codeStyle, filePathTemplate, dependencies }
4. **data-model** — 数据模型
   config: { name, fields: [{name, type, description, constraints}], description }
5. **api** — API 端点
   config: { method: "GET"|"POST"|"PUT"|"PATCH"|"DELETE", path, description, requestBody, responseBody }
6. **env** — 环境配置
   config: { variables: [{key, description, defaultValue}] }
7. **test** — 测试策略
   config: { framework, coverageTarget, style, focus: string[] }
8. **example** — 代码示例
   config: { code, language, caption }
9. **validate** — 质量约束
   config: { type: "lint"|"type-safety"|"performance"|"security", rules: string[], severity: "error"|"warning" }
10. **condition** — 条件分支
    config: { expression, branchA, branchB }
11. **output** — 输出配置
    config: { format: "markdown"|"json"|"yaml", templateMapping }

## JSON 格式
每个节点对象必须包含：
- "type": 节点类型（上述11种之一）
- "label": 中文标签（简短描述该节点做什么）
- "config": 根据类型填写的配置对象

每条边对象必须包含：
- "sourceIndex": 源节点在 nodes 数组中的下标
- "targetIndex": 目标节点在 nodes 数组中的下标
- "label": 边的标签（可选）

## 连线规则
- project 在最前面，output 在最后面
- 数据流：project → modules → generate/data-model/api → validate/test → output
- env 和 example 可连到任意节点
- condition 可有两条输出分支

## 要求
- 至少 5 个节点，最多 15 个
- 每个节点必须有 label（中文）
- ⚠️ 只输出一个合法的 JSON 对象，不要包含 markdown 代码块、解释或其他任何文字。直接输出 JSON。`;

          const EDIT_INSTRUCTION = `

## 增量编辑模式
画布上已有节点。你需要基于现有结构进行修改，而不是从零重建。
- 对于需要**保留**的节点：请在其 JSON 中加上 "id": "原始id" 字段，这样系统会原地更新它
- 对于需要**新增**的节点：不要包含 "id" 字段，系统会为新节点生成 ID
- 对于需要**删除**的节点：直接不要出现在输出中
- 输出完整的最终节点图（保留 + 新增），不要只输出变更部分`;

          const systemPrompt = isEditing
            ? BASE_PROMPT + EDIT_INSTRUCTION
            : BASE_PROMPT;

          // 构建 prompt
          let userPrompt = `请根据以下项目需求，生成完整的工作流节点图：\n\n${description}`;

          if (isEditing) {
            userPrompt = `## 当前画布状态\n${context}\n\n## 对话历史\n${history?.map(m => `${m.role}: ${m.content}`).join('\n') || "（无历史）"}\n\n## 用户修改需求\n${description}\n\n请基于上述画布状态和对话历史，理解用户意图，输出修改后的完整节点图。保留需要保留的节点并复用其 id，新增必要的节点。`;
          }

          const { textStream } = streamText({
            model,
            system: systemPrompt,
            prompt: userPrompt,
          });

          let fullText = "";
          for await (const chunk of textStream) {
            fullText += chunk;
            // 流式发送文本块，前端可以显示进度
            send({ type: "text-chunk", text: chunk });
          }

          // Phase 2: 解析 JSON
          send({ type: "parsing", message: "正在解析节点图..." });

          let object: z.infer<typeof autoLayoutSchema>;
          try {
            const jsonMatch = fullText.match(/```(?:json)?\s*([\s\S]*?)```/);
            const jsonStr = jsonMatch ? jsonMatch[1].trim() : fullText.trim();
            const raw = JSON.parse(jsonStr);
            object = autoLayoutSchema.parse(raw);
          } catch (parseError) {
            console.error("Failed to parse LLM JSON output:", parseError);
            send({ type: "error", error: "AI 返回的内容格式不正确，请重试" });
            controller.close();
            return;
          }

          send({
            type: "plan-ready",
            nodeCount: object.nodes.length,
            edgeCount: object.edges.length,
          });
          console.log(`[auto-layout] plan-ready sent, nodes=${object.nodes.length}, edges=${object.edges.length}`);

          // Phase 3: 增量保存 - 不再全量删除，而是按需更新/创建/删除
          console.log("[auto-layout] Phase 3: saving nodes...");

          // 收集 AI 输出中的节点 ID
          const aiNodeIds = new Set<string>();
          const nodeIdMap: Record<number, string> = {};

          // 先获取已有节点的位置信息（保留旧位置）
          const existingNodes = await prisma.workflowNode.findMany({
            where: { workflowId: id },
          });
          const existingNodeMap = new Map(existingNodes.map(n => [n.id, n]));

          const COL_GAP = 300;
          const ROW_GAP = 150;
          const COLS = 3;

          for (let i = 0; i < object.nodes.length; i++) {
            const n = object.nodes[i];

            // 如果 AI 指定了已有的 id 且该节点存在 → 更新
            if (n.id && existingNodeMap.has(n.id)) {
              const nodeId = n.id;
              aiNodeIds.add(nodeId);
              nodeIdMap[i] = nodeId;
              const label = ensureLabel(n);
              const existing = existingNodeMap.get(nodeId)!;

              const updated = await prisma.workflowNode.update({
                where: { id: nodeId },
                data: {
                  type: n.type,
                  label,
                  config: n.config as object,
                  // 保留原有位置
                  positionX: existing.positionX,
                  positionY: existing.positionY,
                },
              });

              console.log(`[auto-layout] updated node ${i + 1}/${object.nodes.length}: ${label} (id:${nodeId})`);
              send({
                type: "node",
                index: i,
                total: object.nodes.length,
                node: {
                  id: updated.id,
                  type: updated.type,
                  position: { x: updated.positionX, y: updated.positionY },
                  data: { label: updated.label, config: updated.config ?? {} },
                },
              });
            } else {
              // 新节点或 AI 指定的 id 不存在 → 创建
              const nodeId = generateId();
              aiNodeIds.add(nodeId);
              nodeIdMap[i] = nodeId;
              const col = i % COLS;
              const row = Math.floor(i / COLS);
              const label = ensureLabel(n);

              const created = await prisma.workflowNode.create({
                data: {
                  id: nodeId,
                  workflowId: id,
                  type: n.type,
                  label,
                  positionX: 100 + col * COL_GAP,
                  positionY: 100 + row * ROW_GAP,
                  config: n.config as object,
                },
              });

              console.log(`[auto-layout] created node ${i + 1}/${object.nodes.length}: ${label}`);
              send({
                type: "node",
                index: i,
                total: object.nodes.length,
                node: {
                  id: created.id,
                  type: created.type,
                  position: { x: created.positionX, y: created.positionY },
                  data: { label: created.label, config: created.config ?? {} },
                },
              });
            }
          }

          // 删除不在 AI 输出中的旧节点（及其关联边）
          const nodeIdsToDelete = existingNodes
            .map(n => n.id)
            .filter(id => !aiNodeIds.has(id));

          if (nodeIdsToDelete.length > 0) {
            console.log(`[auto-layout] deleting ${nodeIdsToDelete.length} removed nodes`);
            await prisma.workflowEdge.deleteMany({
              where: {
                workflowId: id,
                OR: [
                  { sourceNodeId: { in: nodeIdsToDelete } },
                  { targetNodeId: { in: nodeIdsToDelete } },
                ],
              },
            });
            await prisma.workflowNode.deleteMany({
              where: { id: { in: nodeIdsToDelete } },
            });
          }

          // Phase 5: 保存边 — 先清空旧边，再创建新边
          console.log("[auto-layout] Phase 5: saving edges...");
          await prisma.workflowEdge.deleteMany({ where: { workflowId: id } });

          for (let j = 0; j < object.edges.length; j++) {
            const e = object.edges[j];
            const sourceId = nodeIdMap[e.sourceIndex];
            const targetId = nodeIdMap[e.targetIndex];
            if (!sourceId || !targetId) continue;

            const edgeId = generateId();
            await prisma.workflowEdge.create({
              data: {
                id: edgeId,
                workflowId: id,
                sourceNodeId: sourceId,
                targetNodeId: targetId,
                label: e.label ?? null,
              },
            });

            console.log(`[auto-layout] sending edge ${j + 1}/${object.edges.length}`);
            send({
              type: "edge",
              index: j,
              total: object.edges.length,
              edge: {
                id: edgeId,
                source: sourceId,
                target: targetId,
                label: e.label ?? undefined,
              },
            });
          }

          // Phase 6: 完成
          send({
            type: "complete",
            nodeCount: object.nodes.length,
            edgeCount: object.edges.length,
          });

          controller.close();
        } catch (err) {
          console.error("Auto layout error:", err);
          send({
            type: "error",
            error: err instanceof Error ? err.message : "自动生成失败",
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Auto layout error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "自动生成失败",
      },
      { status: 500 }
    );
  }
}
