import { PrismaClient } from "@prisma/client";

export const primaryPrisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
})