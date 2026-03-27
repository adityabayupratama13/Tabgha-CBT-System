import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, role, level, email, username, password, classRoomId } = await req.json();

    if (!name || !role || !username || !password) {
      return NextResponse.json({ error: "Name, Role, Username, and Password are required" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username: username,
        password: hashedPassword,
        name: name,
        role: role,
        level: level || null,
        classRoomId: classRoomId || null,
      },
    });

    return NextResponse.json({ 
       message: "User registered successfully", 
       user: { ...newUser, plainPassword: password } // return plain password once so admin can see it
    }, { status: 201 });

  } catch (err: any) {
    console.error("API Error creating user:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        level: true,
        email: true,
        classRoom: {
          select: { id: true, level: true, grade: true, name: true }
        }
      },
      orderBy: { role: 'asc' }
    });
    return NextResponse.json({ users }, { status: 200 });
  } catch (err: any) {
    console.error("API Error fetching users:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
