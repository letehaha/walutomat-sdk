import { describe, expect, it } from 'vitest';
import { getBalances, getHistory, getHistoryMt940 } from '../endpoints/account.js';
import { getIntegrationHttp, HAS_CREDENTIALS } from './setup.js';

describe.skipIf(!HAS_CREDENTIALS)('account (integration)', () => {
  const http = HAS_CREDENTIALS ? getIntegrationHttp() : (undefined as never);

  it('getBalances returns an array of balances', async () => {
    const balances = await getBalances(http);

    expect(Array.isArray(balances)).toBe(true);
    expect(balances.length).toBeGreaterThan(0);

    const first = balances[0]!;
    expect(first).toHaveProperty('currency');
    expect(first).toHaveProperty('balanceTotal');
    expect(first).toHaveProperty('balanceAvailable');
    expect(first).toHaveProperty('balanceReserved');
  });

  it('getHistory returns an array of history items', async () => {
    const items = await getHistory(http, { itemLimit: 5 });

    expect(Array.isArray(items)).toBe(true);

    if (items.length > 0) {
      const first = items[0]!;
      expect(first).toHaveProperty('historyItemId');
      expect(first).toHaveProperty('transactionId');
      expect(first).toHaveProperty('ts');
      expect(first).toHaveProperty('operationAmount');
      expect(first).toHaveProperty('balanceAfter');
      expect(first).toHaveProperty('currency');
      expect(first).toHaveProperty('operationType');
      expect(Array.isArray(first.operationDetails)).toBe(true);
    }
  });

  it('getHistory with currency filter returns only matching currencies', async () => {
    const items = await getHistory(http, { currencies: ['PLN'], itemLimit: 10 });

    for (const item of items) {
      expect(item.currency).toBe('PLN');
    }
  });

  it('getHistoryMt940 returns an MT940 string', async () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dateFrom = thirtyDaysAgo.toISOString().split('T')[0]!;

    const mt940 = await getHistoryMt940(http, { dateFrom });

    expect(typeof mt940).toBe('string');
  });
});
