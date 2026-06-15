import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await params;

    const existing = await prisma.agent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "智能体不存在" }, { status: 404 });
    }
    if (existing.isBuiltIn) {
      return NextResponse.json(
        { error: "内置智能体不可修改" },
        { status: 403 }
      );
    }
    if (existing.userId !== userId) {
      return NextResponse.json({ error: "无权修改" }, { status: 403 });
    }

    const body = await request.json();
    const agent = await prisma.agent.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        icon: body.icon,
        instructions: body.instructions,
        model: body.model,
        nodeType: body.nodeType,
      },
    });

    return NextResponse.json(agent);
  } catch (error) {
    console.error("Update agent error:", error);
    return NextResponse.json({ error: "更新智能体失败" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await params;

    const existing = await prisma.agent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "智能体不存在" }, { status: 404 });
    }
    if (existing.isBuiltIn) {
      return NextResponse.json(
        { error: "内置智能体不可删除" },
        { status: 403 }
      );
    }
    if (existing.userId !== userId) {
      return NextResponse.json({ error: "无权删除" }, { status: 403 });
    }

    await prisma.agent.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete agent error:", error);
    return NextResponse.json({ error: "删除智能体失败" }, { status: 500 });
  }
}
