const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const attempts = await prisma.examAttempt.findMany({
    include: {
      student: { select: { name: true } },
      exam: { select: { title: true } }
    }
  });
  console.log("=== EXAM ATTEMPTS ===");
  attempts.forEach(a => {
    console.log(`[${a.score || 0}] ${a.student.name} - ${a.exam.title} (Ended: ${a.endTime ? 'Yes' : 'No'})`);
  });
}

check().catch(console.error).finally(() => prisma.$disconnect());
