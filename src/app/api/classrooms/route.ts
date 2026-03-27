import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const classrooms = await prisma.classRoom.findMany({
      orderBy: [ { level: 'asc' }, { grade: 'asc' }, { name: 'asc' } ]
    });
    return NextResponse.json({ classrooms });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch classrooms" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { level, grade, name } = await req.json();
    if (!level || !grade || !name) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const cr = await prisma.classRoom.create({ data: { level, grade: Number(grade), name } });
    return NextResponse.json({ classroom: cr }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create classroom" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    await prisma.classRoom.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
