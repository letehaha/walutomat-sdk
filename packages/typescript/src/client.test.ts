import { describe, expect, it, vi } from 'vitest';
import { createClient } from './client.js';

function mockFetch(body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response);
}

describe('createClient', () => {
  it('exposes all endpoint namespaces', () => {
    const client = createClient({ apiKey: 'k', fetch: mockFetch({}) });

    expect(client.account).toBeDefined();
    expect(client.transfers).toBeDefined();
    expect(client.directFx).toBeDefined();
    expect(client.marketFx).toBeDefined();
  });

  it('account.getBalances delegates to the correct endpoint', async () => {
    const fetch = mockFetch({ success: true, result: [{ currency: 'PLN' }] });
    const client = createClient({ apiKey: 'k', fetch });

    const balances = await client.account.getBalances();

    expect(balances).toEqual([{ currency: 'PLN' }]);
    const [url] = fetch.mock.calls[0]!;
    expect(url).toContain('/account/balances');
  });

  it('directFx.getRates delegates to the correct endpoint', async () => {
    const fetch = mockFetch({
      success: true,
      result: { currencyPair: 'EURPLN', buyRate: '4.32' },
    });
    const client = createClient({ apiKey: 'k', fetch });

    const rates = await client.directFx.getRates({ currencyPair: 'EURPLN' });

    expect(rates.buyRate).toBe('4.32');
    const [url] = fetch.mock.calls[0]!;
    expect(url).toContain('/direct_fx/rates');
  });

  it('marketFx.getBestOffers delegates to the correct endpoint', async () => {
    const fetch = mockFetch({
      success: true,
      result: { currencyPair: 'EURPLN', bids: [], asks: [] },
    });
    const client = createClient({ apiKey: 'k', fetch });

    const offers = await client.marketFx.getBestOffers({ currencyPair: 'EURPLN' });

    expect(offers.currencyPair).toBe('EURPLN');
  });
});
