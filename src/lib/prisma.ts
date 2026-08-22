import { PrismaClient, Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getFreshPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const instance = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  // Always store in global to reuse the connection pool across requests in serverless / Next.js
  globalForPrisma.prisma = instance;

  return instance;
}

export const prisma = getFreshPrismaClient();

export { Prisma };
