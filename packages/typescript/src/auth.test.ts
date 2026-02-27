import { generateKeyPairSync } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { getTimestamp, signRequest } from './auth.js';

const { privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048, // smaller for test speed
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

describe('signRequest', () => {
  it('returns a base64-encoded string', () => {
    const result = signRequest({
      timestamp: '2024-01-15T12:00:00Z',
      endpointPath: '/api/v2.0.0/account/balances',
      bodyOrQuery: '',
      privateKey,
    });

    expect(result).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });

  it('produces different signatures for different payloads', () => {
    const base = {
      timestamp: '2024-01-15T12:00:00Z',
      endpointPath: '/api/v2.0.0/account/balances',
      privateKey,
    };

    const sig1 = signRequest({ ...base, bodyOrQuery: '' });
    const sig2 = signRequest({ ...base, bodyOrQuery: '?currencies=PLN' });

    expect(sig1).not.toBe(sig2);
  });

  it('produces deterministic output for same input', () => {
    const args = {
      timestamp: '2024-01-15T12:00:00Z',
      endpointPath: '/api/v2.0.0/direct_fx/rates',
      bodyOrQuery: '?currencyPair=EURPLN',
      privateKey,
    };

    expect(signRequest(args)).toBe(signRequest(args));
  });
});

describe('getTimestamp', () => {
  it('returns ISO 8601 without milliseconds', () => {
    const ts = getTimestamp();

    expect(ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(ts).not.toContain('.');
  });
});
