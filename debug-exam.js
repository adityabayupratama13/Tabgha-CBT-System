const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({ where: { role: 'STUDENT' }, include: { classRoom: true } });
  console.log("=== STUDENTS ===");
  users.forEach(u => console.log(u.name, "| ClassRoom:", u.classRoom?.name || "None"));

  const exams = await prisma.exam.findMany({ include: { classRooms: true } });
  console.log("\n=== EXAMS ===");
  exams.forEach(e => {
    console.log(e.title, "| Status:", e.status);
    console.log("  ClassRooms:", e.classRooms.map(cr => cr.name).join(", ") || "None");
  });
}

check().catch(console.error).finally(() => prisma.$disconnect());
