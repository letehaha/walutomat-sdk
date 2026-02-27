import type { BuySell, Currency, MarketCurrencyPair } from './common.js';

export interface OfferEntry {
  price: string;
  volume: string;
  volumeCurrency?: Currency;
}

export interface BestOffers {
  ts: string;
  currencyPair: MarketCurrencyPair;
  bids: OfferEntry[];
  asks: OfferEntry[];
}

export interface DetailedQuote {
  volume: string;
  valueInOppositeCurrency: string;
  ts: string;
}

export interface DetailedOfferEntry {
  price: string;
  volume: string;
  valueInOppositeCurrency: string;
  quotes: DetailedQuote[];
}

export interface BestOffersDetailed {
  ts?: string;
  currencyPair: MarketCurrencyPair;
  bids: DetailedOfferEntry[];
  asks: DetailedOfferEntry[];
}

export interface GetBestOffersParams {
  currencyPair: MarketCurrencyPair;
}

export interface GetBestOffersDetailedParams {
  currencyPair: MarketCurrencyPair;
  /** How many uniquely priced offers to fetch (default: 10). */
  itemLimit?: number;
}

export type OrderStatus = 'ACTIVE' | 'CLOSED' | 'EXECUTED';

export interface MarketOrder {
  orderId: string;
  submitId: string;
  submitTs: string;
  updateTs: string;
  status: OrderStatus;
  /** Percentage of order completed (0–100). */
  completion: number;
  currencyPair: MarketCurrencyPair;
  buySell: BuySell;
  volume: string;
  volumeCurrency: Currency;
  limitPrice: string;
  soldAmount: string;
  soldCurrency: Currency;
  boughtAmount: string;
  boughtCurrency: Currency;
  commissionAmount: string;
  commissionCurrency: Currency;
  commissionRate: string;
}

export interface GetActiveOrdersParams {
  /** Max items (1–100, default 10). */
  itemLimit?: number;
  /** ISO datetime — fetch orders older than this (for pagination). */
  olderThan?: string;
}

export interface GetOrderParams {
  orderId: string;
}

export interface SubmitOrderParams {
  dryRun?: boolean;
  /** Required when `dryRun` is false. */
  submitId?: string;
  currencyPair: MarketCurrencyPair;
  buySell: BuySell;
  /** e.g. "999.00" */
  volume: string;
  volumeCurrency: Currency;
  /** Limit price (e.g. "4.2456"). */
  limitPrice: string;
}

export interface SubmitOrderResult {
  orderId: string;
}

export interface CloseOrderParams {
  orderId: string;
}
