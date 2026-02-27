import type { ApiError } from './types/common.js';

/**
 * Thrown when the API returns `{ success: false }` (HTTP 200 but business error).
 */
export class WalutomatApiError extends Error {
  readonly errors: ApiError[];

  constructor({ errors }: { errors: ApiError[] }) {
    const first = errors[0];
    super(first?.description ?? 'Unknown Walutomat API error');
    this.name = 'WalutomatApiError';
    this.errors = errors;
  }

  /** The error key of the first error (e.g. "INSUFFICIENT_FUNDS"). */
  get code(): string | undefined {
    return this.errors[0]?.key;
  }
}

/**
 * Thrown on HTTP-level failures (non-200 status, network errors, etc.).
 */
export class WalutomatHttpError extends Error {
  readonly statusCode: number;
  readonly responseBody: string;

  constructor({ statusCode, responseBody }: { statusCode: number; responseBody: string }) {
    super(`HTTP ${statusCode}: ${responseBody.slice(0, 200)}`);
    this.name = 'WalutomatHttpError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}
