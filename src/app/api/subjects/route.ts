import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function getUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get("userId")?.value ?? null;
  } catch { return null; }
}

async function getRole(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get("role")?.value ?? null;
  } catch { return null; }
}

export async function GET() {
  try {
    const userId = await getUserId();
    const role = await getRole();

    let subjects;
    if (role === "ADMIN" || !userId) {
      // Admin sees all subjects
      subjects = await prisma.subject.findMany({
        include: {
          _count: { select: { questions: true, exams: true } },
          createdBy: { select: { id: true, name: true } },
          sharedWith: { select: { id: true, name: true } },
        },
        orderBy: { name: 'asc' }
      });
    } else {
      // Teacher sees subjects they created OR that were shared with them
      subjects = await prisma.subject.findMany({
        where: {
          OR: [
            { createdById: userId },
            { sharedWith: { some: { id: userId } } }
          ]
        },
        include: {
          _count: { select: { questions: true, exams: true } },
          createdBy: { select: { id: true, name: true } },
          sharedWith: { select: { id: true, name: true } },
        },
        orderBy: { name: 'asc' }
      });
    }

    return NextResponse.json({ subjects });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    const { name, level, sharedWithIds, sourceId } = await req.json();
    if (!name || !level) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const sub = await prisma.subject.create({
      data: {
        name,
        level,
        createdById: userId ?? undefined,
        sharedWith: sharedWithIds?.length
          ? { connect: sharedWithIds.map((id: string) => ({ id })) }
          : undefined,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        sharedWith: { select: { id: true, name: true } },
      }
    });

    if (sourceId) {
      const sourceQuestions = await prisma.question.findMany({ where: { subjectId: sourceId } });
      if (sourceQuestions.length > 0) {
        await prisma.question.createMany({
          data: sourceQuestions.map((q: any) => ({
            text: q.text,
            type: q.type,
            mediaUrl: q.mediaUrl,
            mediaType: q.mediaType,
            options: q.options ? (q.options as any) : undefined,
            subjectId: sub.id
          }))
        });
      }
    }

    return NextResponse.json({ subject: sub }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create subject" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    await prisma.subject.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
