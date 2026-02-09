import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo user
  const hashedPassword = await hash("demo123", 10);
  const user = await prisma.user.upsert({
    where: { email: "demo@offerpulse.io" },
    update: {},
    create: {
      email: "demo@offerpulse.io",
      name: "Demo User",
      password: hashedPassword,
      emailVerified: new Date(),
    },
  });

  console.log("✅ Created user:", user.email);

  // Create demo workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: "demo-workspace" },
    update: {},
    create: {
      name: "Demo Workspace",
      slug: "demo-workspace",
      members: {
        create: {
          userId: user.id,
          role: "owner",
        },
      },
    },
  });

  console.log("✅ Created workspace:", workspace.name);
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
