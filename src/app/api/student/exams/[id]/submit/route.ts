import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: examId } = await params;
    const { answers } = await req.json(); // Record<questionId, answer>
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const attempt = await prisma.examAttempt.findFirst({
      where: { examId, studentId: userId, endTime: null }
    });

    if (!attempt) {
      return NextResponse.json({ error: "No active attempt found" }, { status: 404 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        subject: {
          include: {
            questions: true
          }
        }
      }
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    let correctCount = 0;
    let multipleChoiceCount = 0;

    // Process multiple choice
    for (const q of exam.subject.questions) {
      if (q.type === 'MULTIPLE_CHOICE') {
        multipleChoiceCount++;
        const studentAnswer = answers[q.id];
        if (studentAnswer && Array.isArray(q.options)) {
          const correctOpt = q.options.find((opt: any) => opt.isCorrect);
          if (correctOpt && correctOpt.id === studentAnswer) {
            correctCount++;
          }
        }
      }
    }

    let score = 0;
    if (multipleChoiceCount > 0) {
      score = (correctCount / multipleChoiceCount) * 100;
    }

    // TODO: store raw answers as JSON inside ExamAttempt if we want to save them. Let's add an answers Json field in the schema if needed. Since it's not in the schema currently, we just calculate the score and finalize.

    const finalAttempt = await prisma.examAttempt.update({
      where: { id: attempt.id },
      data: {
        endTime: new Date(),
        score: Math.round(score * 10) / 10 // 1 decimal place
      }
    });

    return NextResponse.json({ success: true, score: finalAttempt.score });
  } catch (error) {
    console.error("Submit exam error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
