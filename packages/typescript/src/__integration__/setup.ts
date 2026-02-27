import { readFileSync } from 'node:fs';
import { createHttpClient } from '../http-client.js';

export function getIntegrationHttp() {
  const apiKey = process.env.WALUTOMAT_API_KEY;
  const privateKeyPath = process.env.WALUTOMAT_PRIVATE_KEY_PATH;
  const privateKeyRaw = process.env.WALUTOMAT_PRIVATE_KEY;

  if (!apiKey) throw new Error('WALUTOMAT_API_KEY is not set');
  if (!privateKeyPath && !privateKeyRaw) throw new Error('WALUTOMAT_PRIVATE_KEY_PATH or WALUTOMAT_PRIVATE_KEY must be set');

  const privateKey = privateKeyRaw ?? readFileSync(privateKeyPath!, 'utf-8');

  return createHttpClient({ apiKey, privateKey });
}

export const HAS_CREDENTIALS = !!(
  process.env.WALUTOMAT_API_KEY &&
  (process.env.WALUTOMAT_PRIVATE_KEY_PATH || process.env.WALUTOMAT_PRIVATE_KEY)
);
