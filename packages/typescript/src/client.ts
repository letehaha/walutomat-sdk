import { getBalances, getHistory, getHistoryIterator, getHistoryMt940 } from './endpoints/account.js';
import { createExchange, getRates } from './endpoints/direct-fx.js';
import {
  closeOrder,
  getActiveOrders,
  getBestOffers,
  getBestOffersDetailed,
  getOrder,
  submitOrder,
} from './endpoints/market-fx.js';
import {
  createIbanTransfer,
  createInternalTransfer,
  createNonIbanTransfer,
  createSepaTransfer,
  getTransferStatus,
} from './endpoints/transfers.js';
import { createHttpClient } from './http-client.js';
import type { WalutomatClientOptions } from './types/common.js';

/**
 * Convenience wrapper that groups all endpoint functions under namespaces.
 *
 * For tree-shakeable imports, use the individual functions from
 * `walutomat-sdk/account`, `walutomat-sdk/transfers`, etc. instead.
 */
export function createClient(options: WalutomatClientOptions) {
  const http = createHttpClient(options);

  return {
    account: {
      getBalances: () => getBalances(http),
      getHistory: (...args: Parameters<typeof getHistory> extends [any, ...infer R] ? R : never) =>
        getHistory(http, ...args),
      getHistoryIterator: (...args: Parameters<typeof getHistoryIterator> extends [any, ...infer R] ? R : never) =>
        getHistoryIterator(http, ...args),
      getHistoryMt940: (...args: Parameters<typeof getHistoryMt940> extends [any, ...infer R] ? R : never) =>
        getHistoryMt940(http, ...args),
    },
    transfers: {
      getStatus: (...args: Parameters<typeof getTransferStatus> extends [any, ...infer R] ? R : never) =>
        getTransferStatus(http, ...args),
      createInternal: (...args: Parameters<typeof createInternalTransfer> extends [any, ...infer R] ? R : never) =>
        createInternalTransfer(http, ...args),
      createIban: (...args: Parameters<typeof createIbanTransfer> extends [any, ...infer R] ? R : never) =>
        createIbanTransfer(http, ...args),
      createSepa: (...args: Parameters<typeof createSepaTransfer> extends [any, ...infer R] ? R : never) =>
        createSepaTransfer(http, ...args),
      createNonIban: (...args: Parameters<typeof createNonIbanTransfer> extends [any, ...infer R] ? R : never) =>
        createNonIbanTransfer(http, ...args),
    },
    directFx: {
      getRates: (...args: Parameters<typeof getRates> extends [any, ...infer R] ? R : never) =>
        getRates(http, ...args),
      exchange: (...args: Parameters<typeof createExchange> extends [any, ...infer R] ? R : never) =>
        createExchange(http, ...args),
    },
    marketFx: {
      getBestOffers: (...args: Parameters<typeof getBestOffers> extends [any, ...infer R] ? R : never) =>
        getBestOffers(http, ...args),
      getBestOffersDetailed: (
        ...args: Parameters<typeof getBestOffersDetailed> extends [any, ...infer R] ? R : never
      ) => getBestOffersDetailed(http, ...args),
      getActiveOrders: (...args: Parameters<typeof getActiveOrders> extends [any, ...infer R] ? R : never) =>
        getActiveOrders(http, ...args),
      getOrder: (...args: Parameters<typeof getOrder> extends [any, ...infer R] ? R : never) =>
        getOrder(http, ...args),
      submitOrder: (...args: Parameters<typeof submitOrder> extends [any, ...infer R] ? R : never) =>
        submitOrder(http, ...args),
      closeOrder: (...args: Parameters<typeof closeOrder> extends [any, ...infer R] ? R : never) =>
        closeOrder(http, ...args),
    },
  };
}
