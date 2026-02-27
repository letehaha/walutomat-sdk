import { describe, expect, it } from 'vitest';
import { createMockHttp } from '../test-utils.js';
import {
  closeOrder,
  getActiveOrders,
  getBestOffers,
  getBestOffersDetailed,
  getOrder,
  submitOrder,
} from './market-fx.js';

describe('market-fx endpoints', () => {
  describe('getBestOffers', () => {
    it('calls GET /market_fx/best_offers unsigned', async () => {
      const http = createMockHttp();
      http.get.mockResolvedValue({ currencyPair: 'EURPLN', bids: [], asks: [] });

      await getBestOffers(http, { currencyPair: 'EURPLN' });

      expect(http.get).toHaveBeenCalledWith({
        endpoint: '/market_fx/best_offers',
        params: { currencyPair: 'EURPLN' },
        signed: false,
      });
    });
  });

  describe('getBestOffersDetailed', () => {
    it('calls GET /market_fx/best_offers/detailed with itemLimit', async () => {
      const http = createMockHttp();
      http.get.mockResolvedValue({ currencyPair: 'EURPLN', bids: [], asks: [] });

      await getBestOffersDetailed(http, { currencyPair: 'EURPLN', itemLimit: 5 });

      expect(http.get).toHaveBeenCalledWith({
        endpoint: '/market_fx/best_offers/detailed',
        params: { currencyPair: 'EURPLN', itemLimit: 5 },
      });
    });
  });

  describe('getActiveOrders', () => {
    it('calls GET /market_fx/orders/active with no params', async () => {
      const http = createMockHttp();
      http.get.mockResolvedValue([]);

      await getActiveOrders(http);

      expect(http.get).toHaveBeenCalledWith({
        endpoint: '/market_fx/orders/active',
        params: undefined,
      });
    });

    it('passes pagination params', async () => {
      const http = createMockHttp();
      http.get.mockResolvedValue([]);

      await getActiveOrders(http, { itemLimit: 20, olderThan: '2024-01-01T00:00:00Z' });

      expect(http.get).toHaveBeenCalledWith({
        endpoint: '/market_fx/orders/active',
        params: { itemLimit: 20, olderThan: '2024-01-01T00:00:00Z' },
      });
    });
  });

  describe('getOrder', () => {
    it('calls GET /market_fx/orders with orderId', async () => {
      const http = createMockHttp();
      http.get.mockResolvedValue([{ orderId: 'ord-1', status: 'ACTIVE' }]);

      const result = await getOrder(http, { orderId: 'ord-1' });

      expect(http.get).toHaveBeenCalledWith({
        endpoint: '/market_fx/orders',
        params: { orderId: 'ord-1' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('submitOrder', () => {
    it('calls POST /market_fx/orders with duplicate flag', async () => {
      const http = createMockHttp();
      http.postWithDuplicate.mockResolvedValue({
        result: { orderId: 'new-ord' },
        duplicate: false,
      });

      const response = await submitOrder(http, {
        submitId: 'sub-1',
        currencyPair: 'EURPLN',
        buySell: 'SELL',
        volume: '500.00',
        volumeCurrency: 'EUR',
        limitPrice: '4.2500',
      });

      const call = http.postWithDuplicate.mock.calls[0]![0] as {
        endpoint: string;
        body: Record<string, unknown>;
      };
      expect(call.endpoint).toBe('/market_fx/orders');
      expect(call.body.limitPrice).toBe('4.2500');
      expect(response.result.orderId).toBe('new-ord');
    });
  });

  describe('closeOrder', () => {
    it('calls POST /market_fx/orders/close', async () => {
      const http = createMockHttp();
      http.post.mockResolvedValue({ orderId: 'ord-1', status: 'CLOSED', completion: 67 });

      const result = await closeOrder(http, { orderId: 'ord-1' });

      expect(http.post).toHaveBeenCalledWith({
        endpoint: '/market_fx/orders/close',
        body: { orderId: 'ord-1' },
      });
      expect(result.status).toBe('CLOSED');
    });
  });
});
