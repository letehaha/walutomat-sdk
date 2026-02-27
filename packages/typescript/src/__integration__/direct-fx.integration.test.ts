import { describe, expect, it } from 'vitest';
import { createExchange, getRates } from '../endpoints/direct-fx.js';
import { WalutomatApiError } from '../errors.js';
import { getIntegrationHttp, HAS_CREDENTIALS } from './setup.js';

describe.skipIf(!HAS_CREDENTIALS)('direct-fx (integration)', () => {
  const http = HAS_CREDENTIALS ? getIntegrationHttp() : (undefined as never);

  it('getRates returns buy and sell rates for EURPLN', async () => {
    try {
      const rates = await getRates(http, { currencyPair: 'EURPLN' });

      expect(rates).toHaveProperty('ts');
      expect(rates).toHaveProperty('currencyPair', 'EURPLN');
      expect(rates).toHaveProperty('buyRate');
      expect(rates).toHaveProperty('sellRate');
      expect(Number(rates.buyRate)).toBeGreaterThan(0);
      expect(Number(rates.sellRate)).toBeGreaterThan(0);
    } catch (err) {
      // API key may not have direct_fx permissions yet
      if (err instanceof WalutomatApiError && err.code === 'MISSING_AUTH_ROLE') {
        console.warn('Skipping: API key lacks direct_fx permissions');
        return;
      }
      throw err;
    }
  });

  it('createExchange with dryRun=true validates without exchanging', async () => {
    let rates;
    try {
      rates = await getRates(http, { currencyPair: 'EURPLN' });
    } catch (err) {
      if (err instanceof WalutomatApiError && err.code === 'MISSING_AUTH_ROLE') {
        console.warn('Skipping: API key lacks direct_fx permissions');
        return;
      }
      throw err;
    }

    const response = await createExchange(http, {
      dryRun: true,
      currencyPair: 'EURPLN',
      buySell: 'BUY',
      volume: '10.00',
      volumeCurrency: 'EUR',
      ts: rates.ts,
    });

    expect(response.duplicate).toBe(false);
  });
});
