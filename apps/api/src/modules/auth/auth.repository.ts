import type { PrismaClient } from "@prisma/client";

import type { AuthUserRepository } from "./auth.types.js";

export const createAuthRepository = (
  prisma: PrismaClient,
): AuthUserRepository => ({
  findByEmail: async (email) =>
    prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        email: true,
        fullName: true,
        id: true,
        passwordHash: true,
        role: true,
      },
    }),
  findById: async (id) =>
    prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        email: true,
        fullName: true,
        id: true,
        passwordHash: true,
        role: true,
      },
    }),
});
