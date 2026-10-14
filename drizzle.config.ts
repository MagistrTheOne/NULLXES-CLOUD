import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const databaseUrl =
  process.env.DB_MIGRATION_URL || process.env.DATABASE_URL_UNPOOLED;

if (!databaseUrl) {
  throw new Error(
    "Set DB_MIGRATION_URL or DATABASE_URL_UNPOOLED in the local environment before running Drizzle Kit.",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dbCredentials: { url: databaseUrl },
  schemaFilter: ["public"],
  migrations: {
    schema: "drizzle",
    table: "__drizzle_migrations",
  },
});
