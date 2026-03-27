import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import Papa from "papaparse";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const role = cookieStore.get("role")?.value;
    
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No CSV file uploaded" }, { status: 400 });
    }

    const text = await file.text();
    
    const { data, errors } = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: h => h.trim().toLowerCase(),
    });

    if (errors.length > 0 || data.length === 0) {
      return NextResponse.json({ error: "Invalid CSV format or empty file." }, { status: 400 });
    }

    // Pre-fetch all classrooms to map `level + grade + classname` -> `classRoomId`
    const allRooms = await prisma.classRoom.findMany();
    const roomMap = new Map();
    allRooms.forEach(r => {
      const key = `${r.level}_${r.grade}_${r.name.trim().toLowerCase()}`;
      roomMap.set(key, r.id);
    });

    // Extract existing usernames to avoid duplicates
    const existingUsers = await prisma.user.findMany({ select: { username: true } });
    const existingSet = new Set(existingUsers.map(u => u.username));

    const validUsersToCreate = [];
    let skipped = 0;

    for (const row of data as any[]) {
      // Required fields
      if (!row.name || !row.username || !row.password || !row.role) {
        skipped++;
        continue;
      }

      if (existingSet.has(row.username)) {
        skipped++;
        continue;
      }

      const roleEnum = row.role.trim().toUpperCase();
      if (!["ADMIN", "TEACHER", "STUDENT"].includes(roleEnum)) {
        skipped++;
        continue;
      }

      const levelEnum = row.level ? row.level.trim().toUpperCase() : null;
      let classRoomId = null;

      // Determine Classroom ID if provided
      if (levelEnum && row.grade && row.classname) {
        const key = `${levelEnum}_${row.grade.trim()}_${row.classname.trim().toLowerCase()}`;
        if (roomMap.has(key)) {
          classRoomId = roomMap.get(key);
        }
      }

      const hashedPassword = await bcrypt.hash(row.password.toString().trim(), 10);

      validUsersToCreate.push({
        name: row.name.trim(),
        username: row.username.trim(),
        password: hashedPassword,
        role: roleEnum as "ADMIN" | "TEACHER" | "STUDENT",
        level: ["SD", "SMP", "SMA", "SMK"].includes(levelEnum) ? (levelEnum as "SD" | "SMP" | "SMA" | "SMK") : null,
        classRoomId: classRoomId
      });
      
      existingSet.add(row.username.trim()); // Prevent duplicate inserts within the same CSV
    }

    if (validUsersToCreate.length > 0) {
      await prisma.user.createMany({
        data: validUsersToCreate
      });
    }

    return NextResponse.json({ 
      success: true, 
      imported: validUsersToCreate.length, 
      skipped: skipped 
    });

  } catch (error) {
    console.error("Bulk Import Error:", error);
    return NextResponse.json({ error: "Failed to process the CSV import." }, { status: 500 });
  }
}
