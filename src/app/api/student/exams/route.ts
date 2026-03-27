import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { classRoomId: true, level: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // If no classroom is assigned, they see nothing or we could fallback. 
    // Here we strictly filter by classRoom match.
    if (!user.classRoomId) {
      return NextResponse.json({ exams: [] });
    }

    const exams = await prisma.exam.findMany({
      where: {
        status: "PUBLISHED",
        classRooms: {
          some: { id: user.classRoomId }
        }
      },
      include: {
        subject: true
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ exams });
  } catch (error) {
    console.error("Student exam fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch student exams" }, { status: 500 });
  }
}
