import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const attempts = await prisma.examAttempt.findMany({
      where: { studentId: userId, endTime: { not: null } },
      include: {
        exam: { select: { title: true, term: true, level: true, subject: { select: { name: true } } } }
      },
      orderBy: { endTime: 'desc' }
    });

    return NextResponse.json({ results: attempts });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}
