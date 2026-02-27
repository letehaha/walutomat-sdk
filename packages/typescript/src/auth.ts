import { createSign } from 'node:crypto';

/**
 * Sign a Walutomat API request using RSA-SHA256.
 *
 * The signed payload is `timestamp + endpointPath + bodyOrQuery` where:
 * - `endpointPath` is the full API path (e.g. `/api/v2.0.0/account/history`)
 * - For GET: `bodyOrQuery` is the query string **including** the leading `?`
 * - For POST: `bodyOrQuery` is the URL-encoded form body (no `?`)
 */
export function signRequest({
  timestamp,
  endpointPath,
  bodyOrQuery,
  privateKey,
}: {
  timestamp: string;
  endpointPath: string;
  bodyOrQuery: string;
  privateKey: string;
}): string {
  const signer = createSign('SHA256');
  signer.update(timestamp + endpointPath + bodyOrQuery);
  return signer.sign(privateKey, 'base64');
}

/**
 * Returns a UTC timestamp in ISO 8601 format without milliseconds,
 * matching the format expected by the Walutomat API: `2024-01-15T12:34:56Z`.
 */
export function getTimestamp(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}
