import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const currentUserId = cookieStore.get("userId")?.value ?? null;

    const teachers = await prisma.user.findMany({
      where: {
        role: "TEACHER",
        id: currentUserId ? { not: currentUserId } : undefined
      },
      select: { id: true, name: true, username: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ teachers });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch teachers" }, { status: 500 });
  }
}
