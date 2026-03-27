import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        subject: {
          include: {
            questions: true
          }
        }
      }
    });

    if (!exam || exam.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Exam not found or not published" }, { status: 404 });
    }

    // Find or create ExamAttempt
    let attempt = await prisma.examAttempt.findFirst({
      where: { examId: id, studentId: userId }
    });

    if (!attempt) {
      attempt = await prisma.examAttempt.create({
        data: {
          examId: id,
          studentId: userId,
          startTime: new Date()
        }
      });
    } else if (attempt.endTime) {
      return NextResponse.json({ error: "Exam already completed" }, { status: 403 });
    }

    // Strip isCorrect from options
    const safeQuestions = exam.subject.questions.map(q => {
      let safeOptions = q.options;
      if (q.type === 'MULTIPLE_CHOICE' && Array.isArray(q.options)) {
        safeOptions = q.options.map((opt: any) => ({
          id: opt.id,
          text: opt.text,
          mediaUrl: opt.mediaUrl
        })) as any;
      }
      return {
        id: q.id,
        text: q.text,
        type: q.type,
        mediaUrl: q.mediaUrl,
        mediaType: q.mediaType,
        options: safeOptions
      };
    });

    return NextResponse.json({
      exam: {
        id: exam.id,
        title: exam.title,
        durationMin: exam.durationMin,
        subject: { name: exam.subject.name },
        questions: safeQuestions
      },
      attempt: {
        id: attempt.id,
        startTime: attempt.startTime
      }
    });
  } catch (error) {
    console.error("Fetch exam error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
