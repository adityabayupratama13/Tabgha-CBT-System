import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(req: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await context.params;
    const { name, email, level, username, newPassword, classRoomId } = await req.json();
    
    let updateData: any = { name, email, level, username, classRoomId: classRoomId || null };

    if (newPassword && newPassword.trim().length > 0) {
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const user = await prisma.user.update({
      where: { id: resolvedParams.id },
      data: updateData,
      select: { id: true, username: true, name: true, role: true, level: true, email: true }
    });

    return NextResponse.json({ 
      message: "User updated successfully", 
      user 
    }, { status: 200 });
  } catch (err: any) {
    console.error("API Error updating user:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await context.params;
    // Only delete if it's not the master admin
    const userTarget = await prisma.user.findUnique({ where: { id: resolvedParams.id } });
    if (userTarget?.username === 'admin') {
       return NextResponse.json({ error: "Cannot delete master admin" }, { status: 403 });
    }

    await prisma.user.delete({
      where: { id: resolvedParams.id }
    });

    return NextResponse.json({ message: "User deleted" }, { status: 200 });
  } catch (err: any) {
    console.error("API Error deleting user:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
