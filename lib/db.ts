import { createClient } from "@libsql/client/web";

const rawUrl = process.env.TURSO_DATABASE_URL || "";
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!rawUrl) {
  console.warn("TURSO_DATABASE_URL is not set. Database operations will fail unless tested offline if configured.");
}

// Mock DB for build time so Cloudflare doesn't crash on 'file:' in the Edge runtime
let client: any = null;
if (rawUrl && (rawUrl.startsWith("http") || rawUrl.startsWith("libsql") || rawUrl.startsWith("ws"))) {
  client = createClient({ url: rawUrl, authToken });
} else {
  console.warn("Using mock DB client because URL is missing or unsupported in edge runtime.");
  client = {
    execute: async () => ({ rows: [] }),
  };
}

export const db = client;
