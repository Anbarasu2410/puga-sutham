const { Redis } = require("@upstash/redis");
require("dotenv").config({ path: ".env.local" });

async function clearCache() {
    const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    console.log("Clearing Upstash Redis cache...");
    await redis.del("firms:fires");
    await redis.del("meteo:wind:9.851:78.219");
    console.log("Cache cleared successfully!");
}

clearCache();
