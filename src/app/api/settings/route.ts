import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    let settings = await prisma.systemSetting.findUnique({ where: { id: "global" } });
    if (!settings) {
      settings = await prisma.systemSetting.create({
         data: { id: "global", schoolName: "Tabgha Academic", activeTerm: "UTS_1" }
      });
    }
    return NextResponse.json({ settings }, { status: 200 });
  } catch (err: any) {
    console.error("API Error fetching settings:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { schoolName, activeTerm } = await req.json();
    const settings = await prisma.systemSetting.upsert({
      where: { id: "global" },
      update: { schoolName, activeTerm },
      create: { id: "global", schoolName: activeTerm }
    });
    return NextResponse.json({ settings, message: "Settings updated successfully" }, { status: 200 });
  } catch (err: any) {
    console.error("API Error updating settings:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
