import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await hash("password123", 10);

  await prisma.user.upsert({
    where: { email: "admin@clinic.test" },
    update: {},
    create: {
      email: "admin@clinic.test",
      password,
      name: "Clinic Admin",
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "doctor@clinic.test" },
    update: {},
    create: {
      email: "doctor@clinic.test",
      password,
      name: "Dr. Asha Mehta",
      role: "DOCTOR",
      specialisation: "Cardiology",
      workingHours: JSON.stringify({ start: "09:00", end: "15:00" }),
      slotDuration: 30,
    },
  });

  await prisma.user.upsert({
    where: { email: "patient@clinic.test" },
    update: {},
    create: {
      email: "patient@clinic.test",
      password,
      name: "Riya Sharma",
      role: "PATIENT",
    },
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
