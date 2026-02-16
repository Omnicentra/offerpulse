/**
 * Custom error classes for OfferPulse
 * Provides structured error handling with proper error codes
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

// Authentication errors
export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required", details?: Record<string, any>) {
    super(message, "AUTH_REQUIRED", 401, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized access", details?: Record<string, any>) {
    super(message, "UNAUTHORIZED", 403, details);
  }
}

// Validation errors
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, "VALIDATION_ERROR", 400, details);
  }
}

// Resource errors
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    super(message, "NOT_FOUND", 404, { resource, id });
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, "CONFLICT", 409, details);
  }
}

// External service errors
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: Record<string, any>) {
    super(`${service} error: ${message}`, "EXTERNAL_SERVICE_ERROR", 502, {
      service,
      ...details,
    });
  }
}

// Rate limiting
export class RateLimitError extends AppError {
  constructor(message: string = "Rate limit exceeded", details?: Record<string, any>) {
    super(message, "RATE_LIMIT", 429, details);
  }
}

// Database errors
export class DatabaseError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, "DATABASE_ERROR", 500, details);
  }
}

// Scraping errors
export class ScrapingError extends AppError {
  constructor(url: string, message: string, details?: Record<string, any>) {
    super(`Scraping failed for ${url}: ${message}`, "SCRAPING_ERROR", 500, {
      url,
      ...details,
    });
  }
}

// AI errors
export class AIError extends AppError {
  constructor(provider: string, message: string, details?: Record<string, any>) {
    super(`AI ${provider} error: ${message}`, "AI_ERROR", 500, {
      provider,
      ...details,
    });
  }
}

/**
 * Helper to determine if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Convert any error to AppError
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, "INTERNAL_ERROR", 500, {
      originalError: error.name,
    });
  }

  return new AppError("An unknown error occurred", "UNKNOWN_ERROR", 500, {
    error: String(error),
  });
}
