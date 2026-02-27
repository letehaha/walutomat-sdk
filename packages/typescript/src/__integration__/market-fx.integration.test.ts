import { describe, expect, it } from 'vitest';
import { getActiveOrders, getBestOffers, getBestOffersDetailed } from '../endpoints/market-fx.js';
import { getIntegrationHttp, HAS_CREDENTIALS } from './setup.js';

describe.skipIf(!HAS_CREDENTIALS)('market-fx (integration)', () => {
  const http = HAS_CREDENTIALS ? getIntegrationHttp() : (undefined as never);

  it('getBestOffers returns bids and asks for EURPLN', async () => {
    const offers = await getBestOffers(http, { currencyPair: 'EURPLN' });

    expect(offers).toHaveProperty('ts');
    expect(offers).toHaveProperty('currencyPair', 'EURPLN');
    expect(Array.isArray(offers.bids)).toBe(true);
    expect(Array.isArray(offers.asks)).toBe(true);
  });

  it('getBestOffersDetailed returns detailed offers', async () => {
    const offers = await getBestOffersDetailed(http, { currencyPair: 'EURPLN', itemLimit: 3 });

    expect(offers).toHaveProperty('currencyPair', 'EURPLN');
    expect(Array.isArray(offers.bids)).toBe(true);
    expect(Array.isArray(offers.asks)).toBe(true);

    if (offers.bids.length > 0) {
      expect(offers.bids[0]).toHaveProperty('valueInOppositeCurrency');
      expect(Array.isArray(offers.bids[0]!.quotes)).toBe(true);
    }
  });

  it('getActiveOrders returns an array', async () => {
    const orders = await getActiveOrders(http, { itemLimit: 5 });

    expect(Array.isArray(orders)).toBe(true);
  });
});
