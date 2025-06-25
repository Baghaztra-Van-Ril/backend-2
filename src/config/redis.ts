// Contoh: Set dan Get
import { Redis } from "@upstash/redis";
import * as dotenv from "dotenv";
dotenv.config();

export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
