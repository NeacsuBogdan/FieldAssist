type AppErrorCode =
  | "BAD_REQUEST"
  | "CONFLICT"
  | "FORBIDDEN"
  | "INTERNAL_SERVER_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "VALIDATION_ERROR";

export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly statusCode: number;

  public constructor(code: AppErrorCode, message: string, statusCode: number) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class UnauthorizedError extends AppError {
  public constructor(message = "Authentication is required.") {
    super("UNAUTHORIZED", message, 401);
  }
}

export class ForbiddenError extends AppError {
  public constructor(
    message = "You do not have permission to access this resource.",
  ) {
    super("FORBIDDEN", message, 403);
  }
}

export class ConflictError extends AppError {
  public constructor(
    message = "The requested action conflicts with the current resource state.",
  ) {
    super("CONFLICT", message, 409);
  }
}

export class BadRequestError extends AppError {
  public constructor(message = "The request payload is invalid.") {
    super("BAD_REQUEST", message, 400);
  }
}

export class NotFoundError extends AppError {
  public constructor(message = "The requested resource was not found.") {
    super("NOT_FOUND", message, 404);
  }
}
