import 'server-only'

import { PrismaClient } from "@/lib/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
    pool: Pool | undefined;
};

function createPrismaClient(): PrismaClient {
    const url = process.env.DATABASE_URL;
    if (!url) {
        throw new Error("DATABASE_URL is not defined in environment variables");
    }

    const pool = new Pool({ connectionString: url });
    const adapter = new PrismaPg(pool);

    return new PrismaClient({
        adapter,
        log: ["error"],
    });
}

// Lazy initialization - only create client when actually accessed
function getPrismaClient(): PrismaClient {
    if (globalForPrisma.prisma) {
        return globalForPrisma.prisma;
    }
    
    // During build, if DATABASE_URL is not set, create a proxy that throws on use
    if (!process.env.DATABASE_URL) {
        // Return a proxy that will throw when any method is called
        // This allows the build to complete but will fail at runtime
        return new Proxy({} as PrismaClient, {
            get() {
                throw new Error("DATABASE_URL is not defined. Prisma client cannot be initialized.");
            }
        });
    }
    
    const client = createPrismaClient();
    globalForPrisma.prisma = client;
    return client;
}

// Use a getter to defer initialization until first access
export const prisma = new Proxy({} as PrismaClient, {
    get(_target, prop) {
        const client = getPrismaClient();
        return (client as any)[prop];
    }
});

if (process.env.NODE_ENV !== "production") {
    // Initialize in development to avoid repeated initialization
    if (process.env.DATABASE_URL) {
        globalForPrisma.prisma = getPrismaClient();
    }
}

export default prisma;
