import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations must run over a direct connection. Hosted Postgres (Neon,
    // Supabase) puts the runtime behind a connection pooler that cannot execute
    // DDL in a transaction, so DIRECT_URL wins here when it is set.
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
    shadowDatabaseUrl: process.env["SHADOW_DATABASE_URL"],
  },
});
