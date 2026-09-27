import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!redisUrl || !redisToken) {
    console.warn("Upstash Redis credentials are not set. Caching will fail unless testing offline with mock.");
}

export const redis = new Redis({
    url: redisUrl || "",
    token: redisToken || "",
});
