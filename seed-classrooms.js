const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const count = await prisma.classRoom.count();
  console.log("Classrooms count:", count);
  if (count === 0) {
    console.log("Seeding classrooms...");
    await prisma.classRoom.createMany({
      data: [
         { name: "Kelas 1 Room A", level: "SD", grade: 1 },
         { name: "Kelas 1 Room B", level: "SD", grade: 1 },
         { name: "Kelas 2 Room A", level: "SD", grade: 2 },
         { name: "Kelas 7 Room A", level: "SMP", grade: 7 },
         { name: "Kelas 10 MIPA 1", level: "SMA", grade: 10 },
         { name: "Kelas 12 IPS 2", level: "SMA", grade: 12 }
      ]
    });
    console.log("Seeded classrooms.");
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
