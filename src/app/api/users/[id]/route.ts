import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { name, email, level, resetPassword } = await req.json();
    
    let updateData: any = { name, email, level };
    let generatedPassword = null;

    if (resetPassword) {
      generatedPassword = Math.random().toString(36).substring(2, 10);
      updateData.password = await bcrypt.hash(generatedPassword, 10);
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: { id: true, username: true, name: true, role: true, level: true, email: true }
    });

    return NextResponse.json({ 
      message: "User updated successfully", 
      user, 
      newPassword: generatedPassword 
    }, { status: 200 });
  } catch (err: any) {
    console.error("API Error updating user:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    // Only delete if it's not the master admin
    const userTarget = await prisma.user.findUnique({ where: { id: params.id } });
    if (userTarget?.username === 'admin') {
       return NextResponse.json({ error: "Cannot delete master admin" }, { status: 403 });
    }

    await prisma.user.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: "User deleted" }, { status: 200 });
  } catch (err: any) {
    console.error("API Error deleting user:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
