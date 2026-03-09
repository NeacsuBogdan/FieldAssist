import { z } from "zod";

export const createApiResponseSchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    data: schema,
  });

export const SuccessFlagSchema = z.object({
  success: z.literal(true),
});

export type ApiResponse<T> = {
  data: T;
};
