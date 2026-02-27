import { describe, expect, it } from 'vitest';
import { createMockHttp } from '../test-utils.js';
import { getBalances, getHistory, getHistoryIterator, getHistoryMt940 } from './account.js';

describe('account endpoints', () => {
  describe('getBalances', () => {
    it('calls GET /account/balances', async () => {
      const http = createMockHttp();
      http.get.mockResolvedValue([{ currency: 'PLN', balanceTotal: '100.00' }]);

      const result = await getBalances(http);

      expect(http.get).toHaveBeenCalledWith({ endpoint: '/account/balances' });
      expect(result).toEqual([{ currency: 'PLN', balanceTotal: '100.00' }]);
    });
  });

  describe('getHistory', () => {
    it('calls GET /account/history with no params', async () => {
      const http = createMockHttp();
      http.get.mockResolvedValue([]);

      await getHistory(http);

      expect(http.get).toHaveBeenCalledWith({
        endpoint: '/account/history',
        params: undefined,
      });
    });

    it('passes all filter params', async () => {
      const http = createMockHttp();
      http.get.mockResolvedValue([]);

      await getHistory(http, {
        dateFrom: '2024-01-01T00:00:00Z',
        dateTo: '2024-02-01T00:00:00Z',
        currencies: ['PLN', 'EUR'],
        operationType: 'DIRECT_FX',
        itemLimit: 50,
        continueFrom: 12345,
        sortOrder: 'ASC',
      });

      expect(http.get).toHaveBeenCalledWith({
        endpoint: '/account/history',
        params: {
          dateFrom: '2024-01-01T00:00:00Z',
          dateTo: '2024-02-01T00:00:00Z',
          currencies: ['PLN', 'EUR'],
          operationType: 'DIRECT_FX',
          operationDetailedType: undefined,
          itemLimit: 50,
          continueFrom: 12345,
          sortOrder: 'ASC',
        },
      });
    });
  });

  describe('getHistoryIterator', () => {
    it('paginates through multiple pages', async () => {
      const http = createMockHttp();

      const page1 = [
        { historyItemId: 1, amount: '10.00' },
        { historyItemId: 2, amount: '20.00' },
      ];
      const page2 = [{ historyItemId: 3, amount: '30.00' }];

      http.get
        .mockResolvedValueOnce(page1)
        .mockResolvedValueOnce(page2);

      const items: unknown[] = [];
      for await (const item of getHistoryIterator(http, { itemLimit: 2 })) {
        items.push(item);
      }

      expect(items).toHaveLength(3);
      expect(http.get).toHaveBeenCalledTimes(2);

      // Second call should use continueFrom from last item of page 1
      const secondCall = http.get.mock.calls[1]![0] as { params: { continueFrom: number } };
      expect(secondCall.params.continueFrom).toBe(2);
    });

    it('stops on empty response', async () => {
      const http = createMockHttp();
      http.get.mockResolvedValue([]);

      const items: unknown[] = [];
      for await (const item of getHistoryIterator(http)) {
        items.push(item);
      }

      expect(items).toHaveLength(0);
      expect(http.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('getHistoryMt940', () => {
    it('calls GET /account/history/mt940 with required dateFrom', async () => {
      const http = createMockHttp();
      http.get.mockResolvedValue(':20:ST-WT...');

      const result = await getHistoryMt940(http, {
        dateFrom: '2024-01-01',
        currencies: ['EUR'],
      });

      expect(http.get).toHaveBeenCalledWith({
        endpoint: '/account/history/mt940',
        params: {
          dateFrom: '2024-01-01',
          dateTo: undefined,
          currencies: ['EUR'],
        },
      });
      expect(result).toBe(':20:ST-WT...');
    });
  });
});
