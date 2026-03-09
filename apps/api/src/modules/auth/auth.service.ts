import type { AuthSession, AuthUser, LoginRequest } from "@fieldassist/shared";

import { UnauthorizedError } from "../../lib/errors.js";
import type {
  AuthService,
  AuthTokenClaims,
  AuthUserRecord,
  AuthUserRepository,
} from "./auth.types.js";

type AuthServiceDependencies = {
  signToken: (claims: AuthTokenClaims) => Promise<string>;
  userRepository: AuthUserRepository;
  verifyPassword: (password: string, passwordHash: string) => Promise<boolean>;
};

const toAuthUser = (record: AuthUserRecord): AuthUser => ({
  email: record.email,
  fullName: record.fullName,
  id: record.id,
  role: record.role,
});

export const createAuthService = ({
  signToken,
  userRepository,
  verifyPassword,
}: AuthServiceDependencies): AuthService => ({
  getMe: async (userId) => {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new UnauthorizedError("Your session is no longer valid.");
    }

    return toAuthUser(user);
  },
  login: async (input: LoginRequest): Promise<AuthSession> => {
    const normalizedEmail = input.email.trim().toLowerCase();
    const user = await userRepository.findByEmail(normalizedEmail);

    if (!user) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    const isPasswordValid = await verifyPassword(
      input.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    const authUser = toAuthUser(user);
    const token = await signToken({
      role: authUser.role,
      sub: authUser.id,
    });

    return {
      token,
      user: authUser,
    };
  },
  logout: () =>
    Promise.resolve({
      success: true as const,
    }),
});
