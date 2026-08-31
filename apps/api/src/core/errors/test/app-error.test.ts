import { describe, expect, it } from "vitest";
import {
  AppError,
  ConflictError,
  DomainRuleError,
  ErrorCode,
  ForbiddenError,
  InternalError,
  MissingBranchError,
  NotFoundError,
  ServiceUnavailableError,
  UnauthorizedError,
  ValidationError,
} from "@/core/errors/app-error";

describe("AppError hierarchy", () => {
  it("preserves code, status, details and serializable response shape", () => {
    const error = new ValidationError("Bad input", { field: "name" });
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe(ErrorCode.VALIDATION_FAILED);
    expect(error.statusCode).toBe(400);
    expect(error.toJSON()).toMatchObject({
      success: false,
      code: ErrorCode.VALIDATION_FAILED,
      message: "Bad input",
      details: { field: "name" },
    });
    expect(AppError.isAppError(error)).toBe(true);
  });

  it("maps specialized errors to their stable codes and HTTP statuses", () => {
    const cases = [
      [new UnauthorizedError(), ErrorCode.UNAUTHORIZED, 401],
      [new ForbiddenError(), ErrorCode.FORBIDDEN, 403],
      [new NotFoundError("Order", "1"), ErrorCode.NOT_FOUND, 404],
      [new ConflictError("Conflict"), ErrorCode.CONFLICT, 409],
      [new DomainRuleError("Rule"), ErrorCode.DOMAIN_RULE_VIOLATION, 422],
      [new MissingBranchError(), ErrorCode.MISSING_BRANCH, 400],
      [new InternalError(), ErrorCode.INTERNAL_ERROR, 500],
      [new ServiceUnavailableError(), ErrorCode.SERVICE_UNAVAILABLE, 503],
    ] as const;
    for (const [error, code, status] of cases) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe(code);
      expect(error.statusCode).toBe(status);
    }
  });

  it("formats not-found messages with and without ids", () => {
    expect(new NotFoundError("Tenant").message).toBe("Tenant not found");
    expect(new NotFoundError("Tenant", "abc").message).toBe(
      "Tenant with id abc not found",
    );
  });

  it("preserves cause on internal errors", () => {
    const cause = new Error("db failed");
    expect(new InternalError("Database unavailable", cause).cause).toBe(cause);
  });

  it("rejects non-AppError values from the type guard", () => {
    expect(AppError.isAppError(new Error("x"))).toBe(false);
    expect(AppError.isAppError({ code: ErrorCode.FORBIDDEN })).toBe(false);
  });
});
