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
    // DDL in a transaction, so an unpooled url wins here when one is set.
    // DATABASE_URL_UNPOOLED is what Vercel's Neon integration injects; it does
    // not create DIRECT_URL, and requiring a hand-copied variable next to an
    // auto-provisioned one is how the two end up pointing at different places.
    // || rather than ??: a variable created with an empty value would satisfy
    // ?? and hand Prisma an empty url — which is a real dashboard mistake, and
    // exactly the "Connection url is empty" failure it produces.
    url:
      process.env["DIRECT_URL"] ||
      process.env["DATABASE_URL_UNPOOLED"] ||
      process.env["DATABASE_URL"] ||
      undefined,
    shadowDatabaseUrl: process.env["SHADOW_DATABASE_URL"],
  },
});
