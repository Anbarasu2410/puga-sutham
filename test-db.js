const { createClient } = require("@libsql/client");
const { readFileSync } = require("fs");

async function main() {
    const dbUrl = process.env.TURSO_DATABASE_URL || "file:local.db";
    const dbToken = process.env.TURSO_AUTH_TOKEN;

    console.log(`Connecting to: ${dbUrl}`);

    const db = createClient({
        url: dbUrl,
        authToken: dbToken,
    });

    try {
        const schema = readFileSync("schema.sql", "utf8");
        const statements = schema.split(";").filter(s => s.trim().length > 0);

        for (const stmt of statements) {
            await db.execute(stmt);
        }
        console.log("Schema applied successfully.");

        const res = await db.execute("SELECT sqlite_version();");
        console.log("Connection successful! SQLite Version:", res.rows[0][0]);
    } catch (error) {
        console.error("Database connection/setup failed:", error);
    }
}

main();
