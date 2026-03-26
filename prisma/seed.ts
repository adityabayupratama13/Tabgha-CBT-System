import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const adminExists = await prisma.user.findUnique({
    where: { username: 'admin' },
  });

  if (adminExists) {
    console.log("Master Admin 'admin' already exists!");
    return;
  }

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: 'password123', // Dalam produksi, password ini harus di-hash (misal menggunakan bcrypt)
      role: 'ADMIN',
      name: 'Master System Administrator',
    },
  })
  
  console.log("Master Admin created successfully:");
  console.log("- Username: admin");
  console.log("- Password: password123");
  console.log("- Role:", admin.role);
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
