import type { HttpClient } from '../http-client.js';
import type { CreateExchangeParams, ExchangeRate, ExchangeResult, GetRatesParams } from '../types/index.js';

/** Get current buy/sell exchange rate for a currency pair. */
export async function getRates(http: HttpClient, params: GetRatesParams): Promise<ExchangeRate> {
  return http.get<ExchangeRate>({
    endpoint: '/direct_fx/rates',
    params: { currencyPair: params.currencyPair },
  });
}

/**
 * Execute a direct currency exchange at the rate provided by Currency One.
 *
 * The `ts` param must come from a prior `getRates` response and is valid
 * for 10 minutes from publication.
 */
export async function createExchange(
  http: HttpClient,
  params: CreateExchangeParams,
): Promise<{ result: ExchangeResult; duplicate: boolean }> {
  return http.postWithDuplicate<ExchangeResult>({
    endpoint: '/direct_fx/exchanges',
    body: {
      dryRun: params.dryRun,
      submitId: params.submitId,
      currencyPair: params.currencyPair,
      buySell: params.buySell,
      volume: params.volume,
      volumeCurrency: params.volumeCurrency,
      ts: params.ts,
    },
  });
}
