import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const userId = await getCurrentUserId();

    // 获取内置智能体 + 用户自定义智能体
    const agents = await prisma.agent.findMany({
      where: {
        OR: [{ isBuiltIn: true }, { userId }],
      },
      orderBy: [{ isBuiltIn: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(agents);
  } catch (error) {
    console.error("List agents error:", error);
    return NextResponse.json({ error: "获取智能体列表失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    const body = await request.json();

    if (!body.name || !body.instructions) {
      return NextResponse.json(
        { error: "名称和 System Prompt 不能为空" },
        { status: 400 }
      );
    }

    const agent = await prisma.agent.create({
      data: {
        name: body.name,
        description: body.description ?? null,
        icon: body.icon ?? "🤖",
        instructions: body.instructions,
        model: body.model ?? "gpt-5.5",
        nodeType: body.nodeType ?? null,
        isBuiltIn: false,
        userId,
      },
    });

    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    console.error("Create agent error:", error);
    return NextResponse.json({ error: "创建智能体失败" }, { status: 500 });
  }
}
