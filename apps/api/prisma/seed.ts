import "dotenv/config";

import { PrismaClient, UserRole } from "@prisma/client";

import { hashPassword } from "../src/lib/password.js";

const prisma = new PrismaClient();
const demoPassword = "FieldAssist123!";

const seed = async (): Promise<void> => {
  const passwordHash = await hashPassword(demoPassword);

  await prisma.user.upsert({
    where: {
      email: "technician@fieldassist.local",
    },
    update: {
      fullName: "Mara Ionescu",
      passwordHash,
      role: UserRole.TECHNICIAN,
    },
    create: {
      email: "technician@fieldassist.local",
      fullName: "Mara Ionescu",
      passwordHash,
      role: UserRole.TECHNICIAN,
    },
  });

  await prisma.user.upsert({
    where: {
      email: "supervisor@fieldassist.local",
    },
    update: {
      fullName: "Alex Stan",
      passwordHash,
      role: UserRole.SUPERVISOR,
    },
    create: {
      email: "supervisor@fieldassist.local",
      fullName: "Alex Stan",
      passwordHash,
      role: UserRole.SUPERVISOR,
    },
  });
};

seed()
  .then(async () => {
    await prisma.$disconnect();
    console.info("Seeded demo users:");
    console.info("- technician@fieldassist.local / FieldAssist123!");
    console.info("- supervisor@fieldassist.local / FieldAssist123!");
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
