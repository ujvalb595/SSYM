import { PrismaClient, Prisma } from "@prisma/client";

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getFreshPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  // Set up the pg connection pool for local Node.js routing workaround
  const connectionString = `${process.env.PRISMA_DATABASE_URL}`;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  const instance = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  // Always store in global to reuse the connection pool across requests in serverless / Next.js
  globalForPrisma.prisma = instance;

  return instance;
}

export const prisma = getFreshPrismaClient();

export { Prisma };
