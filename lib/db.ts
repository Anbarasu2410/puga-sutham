import { createClient } from "@libsql/client";

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

if (!dbUrl) {
  console.warn("TURSO_DATABASE_URL is not set. Database operations will fail unless tested offline if configured.");
}

export const db = createClient({
  url: dbUrl || "file:local.db",
  authToken: dbToken,
});
