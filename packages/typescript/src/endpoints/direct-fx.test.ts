import { describe, expect, it } from 'vitest';
import { createMockHttp } from '../test-utils.js';
import { createExchange, getRates } from './direct-fx.js';

describe('direct-fx endpoints', () => {
  describe('getRates', () => {
    it('calls GET /direct_fx/rates with currencyPair', async () => {
      const http = createMockHttp();
      http.get.mockResolvedValue({
        ts: '2024-01-15T12:00:00Z',
        currencyPair: 'EURPLN',
        buyRate: '4.3200',
        sellRate: '4.3100',
      });

      const result = await getRates(http, { currencyPair: 'EURPLN' });

      expect(http.get).toHaveBeenCalledWith({
        endpoint: '/direct_fx/rates',
        params: { currencyPair: 'EURPLN' },
      });
      expect(result.buyRate).toBe('4.3200');
    });
  });

  describe('createExchange', () => {
    it('calls POST /direct_fx/exchanges and returns duplicate flag', async () => {
      const http = createMockHttp();
      http.postWithDuplicate.mockResolvedValue({
        result: { exchangeId: 'exc-1' },
        duplicate: false,
      });

      const response = await createExchange(http, {
        submitId: 'sub-1',
        currencyPair: 'EURPLN',
        buySell: 'BUY',
        volume: '1000.00',
        volumeCurrency: 'EUR',
        ts: '2024-01-15T12:00:00Z',
      });

      const call = http.postWithDuplicate.mock.calls[0]![0] as {
        endpoint: string;
        body: Record<string, unknown>;
      };
      expect(call.endpoint).toBe('/direct_fx/exchanges');
      expect(call.body.buySell).toBe('BUY');
      expect(call.body.ts).toBe('2024-01-15T12:00:00Z');
      expect(response.result.exchangeId).toBe('exc-1');
      expect(response.duplicate).toBe(false);
    });

    it('passes dryRun flag', async () => {
      const http = createMockHttp();

      await createExchange(http, {
        dryRun: true,
        currencyPair: 'USDPLN',
        buySell: 'SELL',
        volume: '500.00',
        volumeCurrency: 'USD',
        ts: '2024-01-15T12:00:00Z',
      });

      const call = http.postWithDuplicate.mock.calls[0]![0] as { body: Record<string, unknown> };
      expect(call.body.dryRun).toBe(true);
      expect(call.body.submitId).toBeUndefined();
    });
  });
});
