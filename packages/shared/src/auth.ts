import { z } from "zod";

import { createApiResponseSchema, SuccessFlagSchema } from "./common.js";

export const UserRoleSchema = z.enum(["TECHNICIAN", "SUPERVISOR"]);

export const AuthUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  fullName: z.string().min(1),
  role: UserRoleSchema,
});

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const AuthSessionSchema = z.object({
  token: z.string().min(1),
  user: AuthUserSchema,
});

export const LoginResponseSchema = createApiResponseSchema(AuthSessionSchema);
export const MeResponseSchema = createApiResponseSchema(AuthUserSchema);
export const LogoutResponseSchema = createApiResponseSchema(SuccessFlagSchema);

export type UserRole = z.infer<typeof UserRoleSchema>;
export type AuthUser = z.infer<typeof AuthUserSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type AuthSession = z.infer<typeof AuthSessionSchema>;
