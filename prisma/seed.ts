import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import path from "path";
import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: path.resolve(__dirname, "../.env.local") });

// Create adapter for Prisma 7
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 AutiCare Database Setup\n");

  // Verify database connection
  console.log("Verifying database connection...");
  await prisma.$queryRaw`SELECT 1`;
  console.log("✅ Database connection successful!\n");

  // Display table counts for verification
  console.log("Current database state:");
  console.log("─────────────────────────────────────");
  
  const userCount = await prisma.user.count();
  const childCount = await prisma.childProfile.count();
  const noteCount = await prisma.medicalNote.count();
  const supportNoteCount = await prisma.supportNote.count();
  const visitCount = await prisma.videoVisit.count();
  const threadCount = await prisma.messageThread.count();
  
  console.log(`Users:          ${userCount}`);
  console.log(`Child Profiles: ${childCount}`);
  console.log(`Medical Notes:  ${noteCount}`);
  console.log(`Support Notes:  ${supportNoteCount}`);
  console.log(`Video Visits:   ${visitCount}`);
  console.log(`Message Threads: ${threadCount}`);
  console.log("─────────────────────────────────────\n");

  console.log("✅ Database is ready for use!\n");
  console.log("To create users, use the registration flow at /register");
  console.log("All data will be created through the application interface.\n");
}

main()
  .catch((e) => {
    console.error("❌ Database setup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
