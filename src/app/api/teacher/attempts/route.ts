import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();
    const role = cookieStore.get("role")?.value;
    if (role === "STUDENT") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, score } = body;

    if (!id || typeof score !== "number") {
      return NextResponse.json({ error: "Missing attempt ID or valid score" }, { status: 400 });
    }

    const updated = await prisma.examAttempt.update({
      where: { id },
      data: { score }
    });

    return NextResponse.json({ success: true, attempt: updated });
  } catch (error) {
    console.error("Edit Attempt Error:", error);
    return NextResponse.json({ error: "Failed to update attempt score" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const cookieStore = await cookies();
    const role = cookieStore.get("role")?.value;
    if (role === "STUDENT") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Missing attempt ID" }, { status: 400 });

    await prisma.examAttempt.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete Attempt Error:", error);
    return NextResponse.json({ error: "Failed to delete attempt" }, { status: 500 });
  }
}
