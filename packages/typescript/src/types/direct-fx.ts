import type { BuySell, Currency, CurrencyPair } from './common.js';

export interface ExchangeRate {
  ts: string;
  currencyPair: CurrencyPair;
  buyRate: string;
  sellRate: string;
}

export interface GetRatesParams {
  currencyPair: CurrencyPair;
}

export interface ExchangeResult {
  exchangeId: string;
}

export interface CreateExchangeParams {
  dryRun?: boolean;
  /** Required when `dryRun` is false. */
  submitId?: string;
  currencyPair: CurrencyPair;
  buySell: BuySell;
  /** e.g. "999.00" */
  volume: string;
  volumeCurrency: Currency;
  /** The `ts` value from a prior {@link ExchangeRate} response. */
  ts: string;
}
