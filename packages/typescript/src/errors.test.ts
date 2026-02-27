import { describe, expect, it } from 'vitest';
import { WalutomatApiError, WalutomatHttpError } from './errors.js';

describe('WalutomatApiError', () => {
  it('uses the first error description as message', () => {
    const err = new WalutomatApiError({
      errors: [
        { key: 'INSUFFICIENT_FUNDS', description: 'Not enough money' },
        { key: 'OTHER', description: 'Something else' },
      ],
    });

    expect(err.message).toBe('Not enough money');
    expect(err.name).toBe('WalutomatApiError');
  });

  it('exposes .code from the first error key', () => {
    const err = new WalutomatApiError({
      errors: [{ key: 'INVALID_CURRENCY', description: 'Bad currency' }],
    });

    expect(err.code).toBe('INVALID_CURRENCY');
  });

  it('handles empty errors array', () => {
    const err = new WalutomatApiError({ errors: [] });

    expect(err.message).toBe('Unknown Walutomat API error');
    expect(err.code).toBeUndefined();
  });

  it('is an instance of Error', () => {
    const err = new WalutomatApiError({
      errors: [{ key: 'X', description: 'Y' }],
    });

    expect(err).toBeInstanceOf(Error);
  });
});

describe('WalutomatHttpError', () => {
  it('includes status code in message', () => {
    const err = new WalutomatHttpError({
      statusCode: 429,
      responseBody: 'Too many requests',
    });

    expect(err.message).toBe('HTTP 429: Too many requests');
    expect(err.statusCode).toBe(429);
    expect(err.responseBody).toBe('Too many requests');
    expect(err.name).toBe('WalutomatHttpError');
  });

  it('truncates long response bodies in message', () => {
    const longBody = 'x'.repeat(500);
    const err = new WalutomatHttpError({ statusCode: 500, responseBody: longBody });

    expect(err.message.length).toBeLessThan(220);
    expect(err.responseBody).toBe(longBody);
  });
});
