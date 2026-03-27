const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const result = await prisma.exam.updateMany({
    data: { status: 'PUBLISHED' }
  });
  console.log(`Updated ${result.count} drafts to PUBLISHED`);
}

fix().catch(console.error).finally(() => prisma.$disconnect());
