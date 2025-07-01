import { PrismaClient } from "@prisma/client";

export const replicaPrisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.REPLICA_DATABASE_URL,
        },
    },
})