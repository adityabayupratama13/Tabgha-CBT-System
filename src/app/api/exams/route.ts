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

    let exams;
    if (role === "ADMIN" || !userId) {
      exams = await prisma.exam.findMany({
        include: {
          subject: true,
          classRooms: true,
          createdBy: { select: { id: true, name: true } },
          sharedWith: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      exams = await prisma.exam.findMany({
        where: {
          OR: [
            { createdById: userId },
            { sharedWith: { some: { id: userId } } }
          ]
        },
        include: {
          subject: true,
          classRooms: true,
          createdBy: { select: { id: true, name: true } },
          sharedWith: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    return NextResponse.json({ exams });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch exams" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    const { title, term, level, subjectId, durationMin, status, sharedWithIds, classRoomIds } = await req.json();
    if (!title || !subjectId || !durationMin) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const ex = await prisma.exam.create({
      data: {
        title,
        term,
        level,
        subjectId,
        durationMin: Number(durationMin),
        status: status || 'DRAFT',
        createdById: userId ?? undefined,
        classRooms: classRoomIds?.length 
          ? { connect: classRoomIds.map((id: string) => ({ id })) }
          : undefined,
        sharedWith: sharedWithIds?.length
          ? { connect: sharedWithIds.map((id: string) => ({ id })) }
          : undefined,
      },
      include: {
        subject: true,
        classRooms: true,
        createdBy: { select: { id: true, name: true } },
        sharedWith: { select: { id: true, name: true } },
      }
    });
    return NextResponse.json({ exam: ex }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create exam" }, { status: 500 });
  }
}
