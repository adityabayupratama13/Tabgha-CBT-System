import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get("subjectId");

  try {
    const questions = await prisma.question.findMany({
      where: subjectId ? { subjectId } : undefined,
      orderBy: { createdAt: "asc" }
    });
    return NextResponse.json({ questions });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { text, type, mediaUrl, mediaType, subjectId, options } = await req.json();
    if (!text || !subjectId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const question = await prisma.question.create({
      data: {
        text,
        type: type || "MULTIPLE_CHOICE",
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        subjectId,
        options: options || null,
      }
    });
    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, text, type, mediaUrl, mediaType, options } = await req.json();
    if (!id || !text) return NextResponse.json({ error: "Missing id or text" }, { status: 400 });

    const question = await prisma.question.update({
      where: { id },
      data: {
        text,
        type: type || undefined,
        mediaUrl,
        mediaType,
        options: options || null,
      }
    });
    return NextResponse.json({ question }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await prisma.question.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
  }
}
