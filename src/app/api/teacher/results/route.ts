import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    const role = cookieStore.get("role")?.value;

    if (!userId || role === "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch exams created by this teacher or shared with them
    const exams = await prisma.exam.findMany({
      where: role === "ADMIN" ? {} : {
        OR: [
          { createdById: userId },
          { sharedWith: { some: { id: userId } } }
        ]
      },
      include: {
        subject: { select: { name: true } },
        classRooms: { select: { level: true, grade: true, name: true } },
        attempts: {
          where: { endTime: { not: null } },
          include: {
            student: { select: { name: true, classRoom: { select: { level: true, grade: true, name: true } } } }
          },
          orderBy: { endTime: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // We can compute average scores here or let frontend do it
    const enhancedExams = exams.map(exam => {
      const validAttempts = exam.attempts.filter(a => typeof a.score === 'number');
      const avgScore = validAttempts.length > 0
        ? validAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / validAttempts.length
        : null;

      return {
        ...exam,
        avgScore: avgScore ? Math.round(avgScore * 10) / 10 : null,
        totalAttempts: validAttempts.length
      };
    });

    return NextResponse.json({ results: enhancedExams });
  } catch (error) {
    console.error("Teacher results error:", error);
    return NextResponse.json({ error: "Failed to fetch teacher results" }, { status: 500 });
  }
}
