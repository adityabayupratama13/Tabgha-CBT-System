import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const studentCount = await prisma.user.count({ where: { role: "STUDENT" } });
    const teacherCount = await prisma.user.count({ where: { role: "TEACHER" } });
    const examCount = await prisma.exam.count({ where: { status: "ACTIVE" } });
    
    return NextResponse.json({ studentCount, teacherCount, examCount }, { status: 200 });
  } catch (err: any) {
    console.error("API Error fetching stats:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
