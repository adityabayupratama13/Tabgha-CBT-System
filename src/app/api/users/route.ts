import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, role, level, email } = await req.json();

    if (!name || !role) {
      return NextResponse.json({ error: "Name and Role are required" }, { status: 400 });
    }

    // Generate a random plain password
    const plainPassword = Math.random().toString(36).substring(2, 10);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Create the username sequentially (e.g., student-2049, teacher-12, or just their email if provided)
    // For simplicity, generate a unique id-based username if email isn't provided, 
    // but in a classic CBT, it's often user + random or sequential numbers
    
    // Simplification for the demo:
    const baseUsername = email ? email.split("@")[0].toLowerCase() : `${role.toLowerCase()}-${Math.floor(Math.random() * 10000)}`;
    let finalUsername = baseUsername;
    
    let count = 0;
    while (await prisma.user.findUnique({ where: { username: finalUsername } })) {
      count++;
      finalUsername = `${baseUsername}${count}`;
    }

    const newUser = await prisma.user.create({
      data: {
        username: finalUsername,
        password: hashedPassword,
        name: name,
        role: role,
        level: level || null,
      },
    });

    return NextResponse.json({ 
       message: "User registered successfully", 
       user: { ...newUser, plainPassword } // return plain password once so admin can see it
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
      },
      orderBy: { role: 'asc' }
    });
    return NextResponse.json({ users }, { status: 200 });
  } catch (err: any) {
    console.error("API Error fetching users:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
