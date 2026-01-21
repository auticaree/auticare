// Prisma configuration for AutiCare
// Uses .env.local for local development
import path from "path";
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load environment variables from .env.local
config({ path: path.resolve(__dirname, ".env.local") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
