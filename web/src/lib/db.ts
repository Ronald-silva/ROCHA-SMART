import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

/** Erros típicos quando o Neon encerra conexão idle ou o pooler recicla o socket. */
function isRetryableConnectionError(e: unknown): boolean {
  const s = String(e);
  return (
    /kind:\s*Closed/i.test(s) ||
    s.includes("Connection closed") ||
    s.includes("connection closed") ||
    s.includes("ECONNRESET") ||
    s.includes("ETIMEDOUT") ||
    s.includes("Server has closed the connection")
  );
}

function createPrismaClient() {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

  return base.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          let last: unknown;
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              return await query(args);
            } catch (e) {
              last = e;
              if (attempt === 2 || !isRetryableConnectionError(e)) throw e;
              await new Promise((r) => setTimeout(r, 80 * (attempt + 1)));
            }
          }
          throw last;
        },
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
