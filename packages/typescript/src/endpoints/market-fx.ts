import type { HttpClient } from '../http-client.js';
import type {
  BestOffers,
  BestOffersDetailed,
  CloseOrderParams,
  GetActiveOrdersParams,
  GetBestOffersDetailedParams,
  GetBestOffersParams,
  GetOrderParams,
  MarketOrder,
  SubmitOrderParams,
  SubmitOrderResult,
} from '../types/index.js';

/** Get 10 best bids and asks for a currency pair (no auth required). */
export async function getBestOffers(http: HttpClient, params: GetBestOffersParams): Promise<BestOffers> {
  return http.get<BestOffers>({
    endpoint: '/market_fx/best_offers',
    params: { currencyPair: params.currencyPair },
    signed: false,
  });
}

/** Get a more detailed list of best bids and asks. */
export async function getBestOffersDetailed(
  http: HttpClient,
  params: GetBestOffersDetailedParams,
): Promise<BestOffersDetailed> {
  return http.get<BestOffersDetailed>({
    endpoint: '/market_fx/best_offers/detailed',
    params: {
      currencyPair: params.currencyPair,
      itemLimit: params.itemLimit,
    },
  });
}

/** Get active orders, ordered by most recently submitted. */
export async function getActiveOrders(http: HttpClient, params?: GetActiveOrdersParams): Promise<MarketOrder[]> {
  return http.get<MarketOrder[]>({
    endpoint: '/market_fx/orders/active',
    params: params
      ? {
          itemLimit: params.itemLimit,
          olderThan: params.olderThan,
        }
      : undefined,
  });
}

/** Get a specific order by ID. Returns an array (empty if not found). */
export async function getOrder(http: HttpClient, params: GetOrderParams): Promise<MarketOrder[]> {
  return http.get<MarketOrder[]>({
    endpoint: '/market_fx/orders',
    params: { orderId: params.orderId },
  });
}

/** Submit a new buy/sell order to the Walutomat P2P market. */
export async function submitOrder(
  http: HttpClient,
  params: SubmitOrderParams,
): Promise<{ result: SubmitOrderResult; duplicate: boolean }> {
  return http.postWithDuplicate<SubmitOrderResult>({
    endpoint: '/market_fx/orders',
    body: {
      dryRun: params.dryRun,
      submitId: params.submitId,
      currencyPair: params.currencyPair,
      buySell: params.buySell,
      volume: params.volume,
      volumeCurrency: params.volumeCurrency,
      limitPrice: params.limitPrice,
    },
  });
}

/** Withdraw an active order from the market. */
export async function closeOrder(http: HttpClient, params: CloseOrderParams): Promise<MarketOrder> {
  return http.post<MarketOrder>({
    endpoint: '/market_fx/orders/close',
    body: { orderId: params.orderId },
  });
}
