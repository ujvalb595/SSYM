import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await bcrypt.hash("Admin@123", 12);
  const memberPasswordHash = await bcrypt.hash("Member@123", 12);

  // 1. Super Admin
  await prisma.user.upsert({
    where: { mobileNumber: "9876543210" },
    update: {},
    create: {
      name: "Super Admin",
      mobileNumber: "9876543210",
      passwordHash: adminPasswordHash,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });

  // 2. Admin User
  await prisma.user.upsert({
    where: { mobileNumber: "9825012345" },
    update: {},
    create: {
      name: "Aarav Patel",
      mobileNumber: "9825012345",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  // 3. Member User
  await prisma.user.upsert({
    where: { mobileNumber: "9825012546" },
    update: {},
    create: {
      name: "Diya Sharma",
      mobileNumber: "9825012546",
      passwordHash: memberPasswordHash,
      role: Role.USER,
      isActive: true,
    },
  });

  console.log("🌱 Database seeded successfully with default accounts.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
