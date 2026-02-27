import type { HttpClient } from '../http-client.js';
import type { GetHistoryMt940Params, GetHistoryParams, HistoryItem, WalletBalance } from '../types/index.js';

/** Returns balances for all currencies in the wallet. */
export async function getBalances(http: HttpClient): Promise<WalletBalance[]> {
  return http.get<WalletBalance[]>({ endpoint: '/account/balances' });
}

/**
 * Returns wallet operation history with optional filters and pagination.
 *
 * Use `continueFrom` (set to the last `historyItemId` received) to paginate.
 */
export async function getHistory(http: HttpClient, params?: GetHistoryParams): Promise<HistoryItem[]> {
  return http.get<HistoryItem[]>({
    endpoint: '/account/history',
    params: params
      ? {
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
          currencies: params.currencies,
          operationType: params.operationType,
          operationDetailedType: params.operationDetailedType,
          itemLimit: params.itemLimit,
          continueFrom: params.continueFrom,
          sortOrder: params.sortOrder,
        }
      : undefined,
  });
}

/**
 * Async iterator that automatically paginates through all history items.
 *
 * ```ts
 * for await (const item of getHistoryIterator(http, { currencies: ['PLN'] })) {
 *   console.log(item.amount, item.currency);
 * }
 * ```
 */
export async function* getHistoryIterator(
  http: HttpClient,
  params?: Omit<GetHistoryParams, 'continueFrom'>,
): AsyncIterableIterator<HistoryItem> {
  let continueFrom: number | undefined;
  const itemLimit = params?.itemLimit ?? 200;

  while (true) {
    const items = await getHistory(http, { ...params, continueFrom });

    if (items.length === 0) break;

    yield* items;

    continueFrom = items[items.length - 1]!.historyItemId;

    if (items.length < itemLimit) break;
  }
}

/** Returns wallet history in MT940 (SWIFT) format as a string. */
export async function getHistoryMt940(http: HttpClient, params: GetHistoryMt940Params): Promise<string> {
  return http.get<string>({
    endpoint: '/account/history/mt940',
    params: {
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      currencies: params.currencies,
    },
  });
}
