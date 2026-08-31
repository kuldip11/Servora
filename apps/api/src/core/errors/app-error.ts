/**
 * Typed application error hierarchy.
 *
 * Replaces ad-hoc `throw new Error('SOME_CODE')` calls scattered across
 * repositories/services with errors that carry a stable machine-readable
 * `code`, the correct HTTP `statusCode`, and optional `details`.
 *
 * Domain and request failures must use this hierarchy. Plain `Error` is
 * reserved for programming/configuration failures that should surface as 500s.
 */

export enum ErrorCode {
  // Authentication / authorization
  UNAUTHORIZED = "UNAUTHORIZED",
  RATE_LIMITED = "RATE_LIMITED",
  FORBIDDEN = "FORBIDDEN",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  CUSTOMER_SESSION_REQUIRED = "CUSTOMER_SESSION_REQUIRED",

  // Validation
  VALIDATION_FAILED = "VALIDATION_FAILED",
  INVALID_INPUT = "INVALID_INPUT",

  // Domain
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  INVALID_STATE = "INVALID_STATE",
  DOMAIN_RULE_VIOLATION = "DOMAIN_RULE_VIOLATION",
  MISSING_BRANCH = "MISSING_BRANCH",

  // System
  INTERNAL_ERROR = "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
}

export interface AppErrorContext {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown> | undefined;
  cause?: Error | undefined;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details?: Record<string, unknown> | undefined;
  override readonly cause?: Error | undefined;
  readonly timestamp: string;

  constructor(context: AppErrorContext, statusCode = 400) {
    super(context.message);
    this.name = "AppError";
    this.code = context.code;
    this.statusCode = statusCode;
    this.details = context.details;
    this.cause = context.cause;
    this.timestamp = new Date().toISOString();
    // NOTE: do NOT call Object.setPrototypeOf(this, AppError.prototype) here.
    // With a modern target (ES2022) `class ... extends Error` already wires
    // up the prototype chain correctly. Forcing it back to AppError.prototype
    // in this base constructor would run for every subclass too (since their
    // constructors call `super(...)`), which downgrades every subclass
    // instance's prototype to AppError.prototype and breaks
    // `instanceof ValidationError` / `NotFoundError` / etc. for all callers.
  }

  /**
   * Response shape kept intentionally close to the existing
   * `{ success, code, message }` shape used throughout the API today,
   * with an added `details`/`timestamp` for richer debugging.
   */
  toJSON() {
    return {
      success: false as const,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
    };
  }

  static isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown> | undefined) {
    super({ code: ErrorCode.VALIDATION_FAILED, message, details }, 400);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(
    message = "Unauthorized",
    details?: Record<string, unknown> | undefined,
  ) {
    super({ code: ErrorCode.UNAUTHORIZED, message, details }, 401);
    this.name = "UnauthorizedError";
  }
}

export class TooManyRequestsError extends AppError {
  constructor(
    message = "Too many requests",
    details?: Record<string, unknown> | undefined,
  ) {
    super({ code: ErrorCode.RATE_LIMITED, message, details }, 429);
    this.name = "TooManyRequestsError";
  }
}

export class CustomerSessionRequiredError extends AppError {
  constructor(message = "Customer session is required") {
    super({ code: ErrorCode.CUSTOMER_SESSION_REQUIRED, message }, 401);
    this.name = "CustomerSessionRequiredError";
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message = "Forbidden",
    details?: Record<string, unknown> | undefined,
  ) {
    super({ code: ErrorCode.FORBIDDEN, message, details }, 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(
    resource: string,
    id?: string,
    details?: Record<string, unknown> | undefined,
  ) {
    const message = id
      ? `${resource} with id ${id} not found`
      : `${resource} not found`;
    super({ code: ErrorCode.NOT_FOUND, message, details }, 404);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown> | undefined) {
    super({ code: ErrorCode.CONFLICT, message, details }, 409);
    this.name = "ConflictError";
  }
}

export class DomainRuleError extends AppError {
  constructor(message: string, details?: Record<string, unknown> | undefined) {
    super({ code: ErrorCode.DOMAIN_RULE_VIOLATION, message, details }, 422);
    this.name = "DomainRuleError";
  }
}

/**
 * A branch-scoped route was called without a resolved branch (e.g. an
 * OWNER/MANAGER viewing the tenant-wide "all branches" aggregate, on an
 * endpoint that needs one specific branch). Kept as its own class — rather
 * than folding into ValidationError/ForbiddenError — so the response
 * preserves a stable machine-readable `{ code: 'MISSING_BRANCH' }` / 400
 * contract for branch-selection UX.
 */
export class MissingBranchError extends AppError {
  constructor(
    message = "Please select a specific branch.",
    details?: Record<string, unknown> | undefined,
  ) {
    super({ code: ErrorCode.MISSING_BRANCH, message, details }, 400);
    this.name = "MissingBranchError";
  }
}

export class InternalError extends AppError {
  constructor(message = "Internal server error", cause?: Error | undefined) {
    super({ code: ErrorCode.INTERNAL_ERROR, message, cause }, 500);
    this.name = "InternalError";
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = "Service temporarily unavailable") {
    super({ code: ErrorCode.SERVICE_UNAVAILABLE, message }, 503);
    this.name = "ServiceUnavailableError";
  }
}
