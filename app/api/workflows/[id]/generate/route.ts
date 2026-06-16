import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { resolveModel } from "@/lib/model-provider";
import { streamText } from "ai";

// 11 个内置 Agent 的 System Prompt（与 Mastra agents/index.ts 保持一致）
const BUILTIN_INSTRUCTIONS: Record<string, string> = {
  project: `你是一个资深的项目架构师。根据用户提供的项目配置信息，生成详细的技术方案文档。

输出要求：
1. 技术栈选型理由（为什么选择这个技术栈）
2. 推荐的项目目录结构（tree 格式）
3. 核心架构决策（状态管理、路由、数据流）
4. 开发和部署流程建议
5. 潜在的技术风险与缓解方案

请输出完整、专业的技术方案，markdown 格式。`,
  module: `你是一个资深的模块设计师。根据用户提供的模块信息，生成详细的模块设计文档。

输出要求：
1. 模块职责定义（单一职责原则）
2. 对外接口设计（函数签名/API 接口）
3. 依赖关系图（依赖的其他模块）
4. 数据模型（该模块涉及的数据结构）
5. 错误处理策略
6. 使用示例

请输出完整、可直接编码实现的模块设计，markdown 格式。`,
  generate: `你是一个资深的代码实现专家。根据用户提供的功能描述，生成详细的实现方案。

输出要求：
1. 功能分解（拆分为可独立实现的子功能）
2. 每个子功能的实现步骤（step-by-step）
3. 关键代码骨架（TypeScript）
4. 边界条件和异常处理
5. 性能考虑点

请输出完整、可直接指导开发的实现文档，markdown 格式。`,
  "data-model": `你是一个资深的数据库设计专家。根据用户提供的数据模型字段定义，生成完整的数据库设计方案。

输出要求：
1. 实体关系分析（ER 关系说明）
2. 完整 DDL（CREATE TABLE 语句，MySQL）
3. ORM 模型定义（Prisma Schema）
4. 索引策略（哪些字段需要索引，为什么）
5. 数据迁移策略
6. 常见查询示例（SQL）

请输出完整、可直接执行的数据库设计文档，markdown 格式。`,
  api: `你是一个资深的 API 设计专家。根据用户提供的 API 端点信息，生成完整的 API 设计文档。

输出要求：
1. RESTful 端点完整定义（Method、Path、Description）
2. 请求参数详细说明（Path/Query/Body）
3. 响应格式（成功和错误状态码及 Body Schema）
4. OpenAPI/Swagger 3.0 格式的 API 规范
5. 认证和授权策略
6. 速率限制和缓存策略建议

请输出完整、可直接接入的 API 设计文档，markdown 格式。`,
  env: `你是一个资深的 DevOps 工程师。根据用户提供的环境变量配置，生成完整的环境配置文档。

输出要求：
1. .env.example 文件内容（带注释说明每个变量）
2. 每个变量的详细说明（用途、格式、默认值、是否必填）
3. 敏感变量的安全提醒（API Key、密钥等）
4. 不同环境的配置差异（开发/测试/生产）
5. CI/CD 中的环境变量管理建议

请输出完整、可直接使用的环境配置文档，markdown 格式。`,
  test: `你是一个资深的测试工程师。根据用户提供的测试配置，生成完整的测试策略文档。

输出要求：
1. 测试金字塔规划（单元/集成/E2E 测试比例）
2. 测试用例大纲（关键场景，Given-When-Then 格式）
3. 测试数据准备策略
4. Mock/Stub 策略
5. 覆盖率目标和度量方式
6. CI/CD 中的测试流水线配置建议

请输出完整、可直接执行的测试方案文档，markdown 格式。`,
  example: `你是一个资深的代码规范专家。根据用户提供的示例代码，生成编码风格和最佳实践文档。

输出要求：
1. 命名规范（变量/函数/类/文件命名规则）
2. 代码组织结构（import 顺序、文件拆分原则）
3. 常见模式提取（从示例代码中识别设计模式）
4. 最佳实践清单（Do's and Don'ts）
5. Lint/Format 工具配置建议

请输出完整、可作为团队规范的风格指南，markdown 格式。`,
  validate: `你是一个资深的代码质量专家。根据用户提供的验证规则，生成详细的约束和检查文档。

输出要求：
1. 每条规则的详细说明（约束条件、边界值）
2. 错误消息设计（用户友好的错误提示）
3. 校验时机（前端/后端/数据库层）
4. 校验失败的处理流程
5. 自动校验的 CI/CD 集成方案

请输出完整、可直接实现的校验方案文档，markdown 格式。`,
  condition: `你是一个资深的系统分析专家。根据用户提供的条件分支配置，生成详细的逻辑分析文档。

输出要求：
1. 每个分支的执行条件（明确的判断标准）
2. 边界情况分析（空值、异常值、并发场景）
3. 备选方案对比（不同分支策略的优劣）
4. 默认分支的处理策略
5. 条件逻辑的可测试性分析

请输出完整、覆盖所有边界的条件分析文档，markdown 格式。`,
  output: `你是一个资深的技术文档撰写专家。接收各个模块的设计输出，整合为一份完整、连贯的工程项目文档。

输出要求：
1. 文档标题和概述（项目简介）
2. 所有章节按逻辑顺序排列
3. 章节之间的过渡段落（确保连贯性）
4. 格式化目录
5. 术语一致性检查
6. 最终检查清单（所有需求是否覆盖）

请输出一份完整、专业、可直接交付的工程项目 Prompt 文档，markdown 格式。`,
};

/**
 * 按依赖深度分层：同一层内无依赖关系的节点可并行执行
 */
function computeLayers(
  nodes: { id: string; type: string; label: string; config: Record<string, unknown> }[],
  edges: { source: string; target: string }[]
) {
  const processed = new Set<string>();
  const layers: typeof nodes[] = [];

  while (processed.size < nodes.length) {
    // 当前层的节点：所有上游节点都已被处理
    const layer = nodes.filter(
      (n) =>
        !processed.has(n.id) &&
        edges
          .filter((e) => e.target === n.id)
          .every((e) => processed.has(e.source))
    );
    if (layer.length === 0) break; // 环检测
    layers.push(layer);
    layer.forEach((n) => processed.add(n.id));
  }
  return layers;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const llmApiKey = body.llmApiKey || process.env.OPENAI_API_KEY;
    const llmBaseUrl = body.llmBaseUrl || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    const llmModel = body.llmModel || process.env.LLM_MODEL || "gpt-5.5";
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

    if (!llmApiKey && !anthropicKey && !googleKey) {
      return NextResponse.json(
        { error: "请至少配置一个 Provider 的 API Key" },
        { status: 400 }
      );
    }

    const workflow = await prisma.workflow.findUnique({
      where: { id, userId },
      include: { nodes: true, edges: true },
    });

    if (!workflow || workflow.deletedAt) {
      return NextResponse.json({ error: "工作流不存在" }, { status: 404 });
    }

    if (workflow.nodes.length === 0) {
      return NextResponse.json({ error: "工作流中没有节点" }, { status: 400 });
    }

    // 构建节点和边
    const nodes = workflow.nodes.map((n: { id: string; type: string; label: string; positionX: number; positionY: number; config: unknown }) => ({
      id: n.id,
      type: n.type,
      label: n.label,
      config: (n.config as Record<string, unknown>) ?? {},
    }));

    const edges = workflow.edges.map((e: { id: string; sourceNodeId: string; targetNodeId: string; label: string | null }) => ({
      source: e.sourceNodeId,
      target: e.targetNodeId,
    }));

    // 分层：同层节点可并行执行
    const layers = computeLayers(nodes, edges);
    const upstreamOutputs: Record<string, string> = {};
    const totalCount = nodes.length;
    let completedCount = 0;
    const flatSorted: typeof nodes = [];

    // SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: object) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          for (let layerIdx = 0; layerIdx < layers.length; layerIdx++) {
            const layer = layers[layerIdx];

            // 通知前端当前层开始
            send({
              type: "layer-start",
              layerIndex: layerIdx,
              totalLayers: layers.length,
              nodeCount: layer.length,
              nodeLabels: layer.map((n) => n.label),
            });

            // 同层节点并行执行 + 流式输出
            await Promise.all(layer.map(async (node) => {
              send({
                type: "node-start",
                nodeId: node.id,
                nodeLabel: node.label,
                nodeType: node.type,
                stepIndex: completedCount,
                totalSteps: totalCount,
              });

              // 获取上游上下文
              const upstreamIds = edges
                .filter((e) => e.target === node.id)
                .map((e) => e.source);

              let contextPrefix = "";
              if (upstreamIds.length > 0) {
                const upstreamTexts = upstreamIds
                  .filter((uid) => upstreamOutputs[uid])
                  .map((uid) => upstreamOutputs[uid]);
                if (upstreamTexts.length > 0) {
                  contextPrefix =
                    "## 上游节点的输出\n\n" +
                    upstreamTexts.join("\n\n---\n\n") +
                    "\n\n---\n\n";
                }
              }

              // 获取 Agent instructions
              let instructions = BUILTIN_INSTRUCTIONS[node.type] || "";
              const agentId = node.config.agentId as string | undefined;
              if (agentId) {
                const agent = await prisma.agent.findUnique({
                  where: { id: agentId },
                });
                if (agent) {
                  instructions = agent.instructions;
                }
              }

              const prompt = `${contextPrefix}## 当前节点：${node.label}

节点类型: ${node.type}
节点配置: ${JSON.stringify(node.config, null, 2)}

请根据上述配置和上下游上下文，生成该节点对应的详细实现方案。`;

              // streamText: 流式输出，前端实时看到内容
              const { textStream } = streamText({
                model,
                system: instructions,
                prompt,
              });

              let fullText = "";
              for await (const chunk of textStream) {
                fullText += chunk;
                send({
                  type: "node-chunk",
                  nodeId: node.id,
                  nodeLabel: node.label,
                  text: chunk,
                });
              }

              upstreamOutputs[node.id] = `## ${node.label}\n\n${fullText}`;
              flatSorted.push(node);
              completedCount++;

              send({
                type: "node-complete",
                nodeId: node.id,
                nodeLabel: node.label,
                nodeType: node.type,
                stepIndex: completedCount,
                totalSteps: totalCount,
                progress: Math.round((completedCount / totalCount) * 100),
              });
            }));
          }

          // 聚合最终结果
          let finalOutput: string;
          const lastNode = flatSorted[flatSorted.length - 1];
          if (lastNode && lastNode.type === "output") {
            finalOutput = upstreamOutputs[lastNode.id] || "";
          } else {
            finalOutput = flatSorted
              .map((n) => upstreamOutputs[n.id])
              .filter(Boolean)
              .join("\n\n---\n\n");
          }

          send({
            type: "complete",
            output: finalOutput,
            progress: 100,
          });

          controller.close();
        } catch (err) {
          send({
            type: "error",
            error: err instanceof Error ? err.message : "生成失败",
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
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Prompt 生成失败" },
      { status: 500 }
    );
  }
}
