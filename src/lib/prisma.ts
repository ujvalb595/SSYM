import { PrismaClient, Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function purgePrismaCache() {
  if (globalForPrisma.prisma) {
    try {
      globalForPrisma.prisma.$disconnect?.();
    } catch {
      // ignore
    }
    delete globalForPrisma.prisma;
  }
  try {
    Object.keys(require.cache).forEach((key) => {
      if (key.includes(".prisma") || key.includes("@prisma")) {
        delete require.cache[key];
      }
    });
  } catch {
    // ignore
  }
}

function getFreshPrismaClient(): PrismaClient {
  let instance = globalForPrisma.prisma;

  if (instance) {
    const hasPostView = "postView" in instance;
    let hasImageInEnum = false;

    try {
      hasImageInEnum = !!Prisma.UserScalarFieldEnum.image;
    } catch {
      // ignore
    }

    if (!hasPostView || !hasImageInEnum) {
      purgePrismaCache();
      instance = undefined;
    }
  }

  if (!instance) {
    purgePrismaCache();
    instance = new PrismaClient();

    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = instance;
    }
  }

  return instance!;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getFreshPrismaClient();
    const value = Reflect.get(client, prop);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

export { Prisma };
