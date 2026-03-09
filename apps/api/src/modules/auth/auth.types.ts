import type {
  AuthSession,
  AuthUser,
  LoginRequest,
  UserRole,
} from "@fieldassist/shared";

export type AuthContext = {
  role: UserRole;
  userId: string;
};

export type AuthTokenClaims = {
  role: UserRole;
  sub: string;
};

export type AuthUserRecord = AuthUser & {
  passwordHash: string;
};

export interface AuthUserRepository {
  findByEmail(email: string): Promise<AuthUserRecord | null>;
  findById(id: string): Promise<AuthUserRecord | null>;
}

export interface AuthService {
  getMe(userId: string): Promise<AuthUser>;
  login(input: LoginRequest): Promise<AuthSession>;
  logout(): Promise<{
    success: true;
  }>;
}
