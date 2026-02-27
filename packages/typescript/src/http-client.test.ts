import { describe, expect, it, vi } from 'vitest';
import { WalutomatApiError, WalutomatHttpError } from './errors.js';
import { createHttpClient } from './http-client.js';

function mockFetch(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response);
}

describe('createHttpClient', () => {
  describe('get', () => {
    it('calls the correct URL with API key header', async () => {
      const fetch = mockFetch({ success: true, result: [{ currency: 'PLN' }] });
      const http = createHttpClient({ apiKey: 'test-key', fetch });

      const result = await http.get({ endpoint: '/account/balances', signed: false });

      expect(fetch).toHaveBeenCalledOnce();
      const [url, opts] = fetch.mock.calls[0]!;
      expect(url).toBe('https://api.walutomat.pl/api/v2.0.0/account/balances');
      expect(opts.method).toBe('GET');
      expect(opts.headers['X-API-Key']).toBe('test-key');
      expect(result).toEqual([{ currency: 'PLN' }]);
    });

    it('uses sandbox URL when sandbox: true', async () => {
      const fetch = mockFetch({ success: true, result: [] });
      const http = createHttpClient({ apiKey: 'k', sandbox: true, fetch });

      await http.get({ endpoint: '/account/balances', signed: false });

      const [url] = fetch.mock.calls[0]!;
      expect(url).toContain('api.walutomat.dev');
    });

    it('uses custom baseUrl when provided', async () => {
      const fetch = mockFetch({ success: true, result: [] });
      const http = createHttpClient({ apiKey: 'k', baseUrl: 'https://proxy.local/', fetch });

      await http.get({ endpoint: '/account/balances', signed: false });

      const [url] = fetch.mock.calls[0]!;
      expect(url).toBe('https://proxy.local/api/v2.0.0/account/balances');
    });

    it('builds query string from params', async () => {
      const fetch = mockFetch({ success: true, result: [] });
      const http = createHttpClient({ apiKey: 'k', fetch });

      await http.get({
        endpoint: '/account/history',
        params: { currencies: ['PLN', 'EUR'], itemLimit: 50 },
        signed: false,
      });

      const [url] = fetch.mock.calls[0]!;
      expect(url).toContain('?currencies=PLN,EUR&itemLimit=50');
    });

    it('omits undefined params from query string', async () => {
      const fetch = mockFetch({ success: true, result: [] });
      const http = createHttpClient({ apiKey: 'k', fetch });

      await http.get({
        endpoint: '/account/history',
        params: { currencies: undefined, itemLimit: 10 },
        signed: false,
      });

      const [url] = fetch.mock.calls[0]!;
      expect(url).not.toContain('currencies');
      expect(url).toContain('itemLimit=10');
    });

    it('throws WalutomatHttpError on non-OK response', async () => {
      const fetch = mockFetch({ error: 'rate limited' }, 429);
      const http = createHttpClient({ apiKey: 'k', fetch });

      await expect(http.get({ endpoint: '/test', signed: false })).rejects.toThrow(WalutomatHttpError);
    });

    it('throws WalutomatApiError when success is false', async () => {
      const fetch = mockFetch({
        success: false,
        errors: [{ key: 'INVALID_PARAM', description: 'Bad param' }],
      });
      const http = createHttpClient({ apiKey: 'k', fetch });

      await expect(http.get({ endpoint: '/test', signed: false })).rejects.toThrow(WalutomatApiError);
    });
  });

  describe('post', () => {
    it('sends form-urlencoded body', async () => {
      const fetch = mockFetch({ success: true, result: { transferId: 'abc' } });
      const http = createHttpClient({ apiKey: 'k', fetch });

      await http.post({
        endpoint: '/transfer/internal',
        body: { volume: '100.00', currency: 'EUR' },
        signed: false,
      });

      const [, opts] = fetch.mock.calls[0]!;
      expect(opts.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
      expect(opts.body).toBe('volume=100.00&currency=EUR');
    });

    it('omits undefined body values', async () => {
      const fetch = mockFetch({ success: true, result: {} });
      const http = createHttpClient({ apiKey: 'k', fetch });

      await http.post({
        endpoint: '/test',
        body: { a: 'yes', b: undefined, c: 'ok' },
        signed: false,
      });

      const [, opts] = fetch.mock.calls[0]!;
      expect(opts.body).toBe('a=yes&c=ok');
    });
  });

  describe('postWithDuplicate', () => {
    it('returns result and duplicate flag', async () => {
      const fetch = mockFetch({
        success: true,
        duplicate: false,
        result: { exchangeId: 'xyz' },
      });
      const http = createHttpClient({ apiKey: 'k', fetch });

      const response = await http.postWithDuplicate({
        endpoint: '/direct_fx/exchanges',
        body: { currencyPair: 'EURPLN' },
        signed: false,
      });

      expect(response.result).toEqual({ exchangeId: 'xyz' });
      expect(response.duplicate).toBe(false);
    });

    it('returns duplicate: true on repeated submitId', async () => {
      const fetch = mockFetch({
        success: true,
        duplicate: true,
        result: { exchangeId: 'xyz' },
      });
      const http = createHttpClient({ apiKey: 'k', fetch });

      const response = await http.postWithDuplicate({
        endpoint: '/direct_fx/exchanges',
        body: {},
        signed: false,
      });

      expect(response.duplicate).toBe(true);
    });
  });

  describe('signing', () => {
    it('adds signature headers when privateKey is provided', async () => {
      const { generateKeyPairSync } = await import('node:crypto');
      const { privateKey } = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });

      const fetch = mockFetch({ success: true, result: [] });
      const http = createHttpClient({ apiKey: 'k', privateKey, fetch });

      await http.get({ endpoint: '/account/balances' });

      const [, opts] = fetch.mock.calls[0]!;
      expect(opts.headers['X-API-Signature']).toBeDefined();
      expect(opts.headers['X-API-Timestamp']).toBeDefined();
    });

    it('omits signature headers when no privateKey', async () => {
      const fetch = mockFetch({ success: true, result: [] });
      const http = createHttpClient({ apiKey: 'k', fetch });

      await http.get({ endpoint: '/account/balances' });

      const [, opts] = fetch.mock.calls[0]!;
      expect(opts.headers['X-API-Signature']).toBeUndefined();
      expect(opts.headers['X-API-Timestamp']).toBeUndefined();
    });
  });
});
