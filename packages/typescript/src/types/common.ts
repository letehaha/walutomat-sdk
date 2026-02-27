export type Currency =
  | 'AUD'
  | 'BGN'
  | 'CAD'
  | 'CHF'
  | 'CNY'
  | 'CZK'
  | 'DKK'
  | 'EUR'
  | 'GBP'
  | 'HKD'
  | 'HUF'
  | 'ILS'
  | 'JPY'
  | 'MXN'
  | 'NOK'
  | 'NZD'
  | 'PLN'
  | 'RON'
  | 'SEK'
  | 'SGD'
  | 'TRY'
  | 'USD'
  | 'ZAR';

export type MarketCurrencyPair =
  | 'EURGBP'
  | 'EURUSD'
  | 'EURCHF'
  | 'EURPLN'
  | 'GBPUSD'
  | 'GBPCHF'
  | 'GBPPLN'
  | 'USDCHF'
  | 'USDPLN'
  | 'CHFPLN'
  | 'EURSEK'
  | 'EURNOK'
  | 'EURDKK'
  | 'EURCZK'
  | 'CZKPLN'
  | 'DKKPLN'
  | 'NOKPLN'
  | 'SEKPLN'
  | 'AUDPLN'
  | 'BGNPLN'
  | 'CADPLN'
  | 'CNYPLN'
  | 'HKDPLN'
  | 'HUFPLN'
  | 'ILSPLN'
  | 'JPYPLN'
  | 'MXNPLN'
  | 'NZDPLN'
  | 'RONPLN'
  | 'SGDPLN'
  | 'TRYPLN'
  | 'ZARPLN'
  | 'EURAUD'
  | 'EURBGN'
  | 'EURCAD'
  | 'EURCNY'
  | 'EURHKD'
  | 'EURHUF'
  | 'EURILS'
  | 'EURJPY'
  | 'EURMXN'
  | 'EURNZD'
  | 'EURRON'
  | 'EURSGD'
  | 'EURTRY'
  | 'EURZAR';

/**
 * Any currency pair string (e.g. "EURPLN"). Direct FX accepts arbitrary
 * pairs, while Market FX is restricted to {@link MarketCurrencyPair}.
 */
export type CurrencyPair = string;

export type BuySell = 'BUY' | 'SELL';

export type SortOrder = 'ASC' | 'DESC';

export type OperationType = 'PAYIN' | 'PAYOUT' | 'COMMISSION' | 'DIRECT_FX' | 'MARKET_FX' | 'TRANSFER' | 'OTHER';

export type OperationDetailedType =
  | 'PAYIN'
  | 'PAYIN_CARD'
  | 'PAYIN_CARD_FEE'
  | 'PAYIN_FEE'
  | 'PAYIN_PAYPAL'
  | 'PAYIN_PAYPAL_FEE'
  | 'PAYIN_P24'
  | 'PAYIN_P24_FEE'
  | 'PAYIN_P24_BLIK'
  | 'PAYIN_P24_GPAY'
  | 'PAYIN_P24_NOW'
  | 'PAYIN_BLIK'
  | 'PAYIN_BLIK_FEE'
  | 'PAYOUT'
  | 'PAYOUT_FEE'
  | 'PAYOUT_RETURN'
  | 'PAYOUT_FEE_RETURN'
  | 'PAYOUT_POST_FACTUM'
  | 'PAYOUT_REJECT'
  | 'CASH_PAYOUT'
  | 'CASH_PAYOUT_FEE'
  | 'CASH_PAYOUT_RETURN'
  | 'THIRD_PARTY_PAYOUT'
  | 'THIRD_PARTY_PAYOUT_FEE'
  | 'THIRD_PARTY_PAYOUT_REJECT'
  | 'THIRD_PARTY_PAYOUT_REJECT_FEE'
  | 'THIRD_PARTY_PAYOUT_RETURN'
  | 'THIRD_PARTY_PAYOUT_RETURN_FEE'
  | 'PAYMENT_AGENT_PAYOUT'
  | 'PAYMENT_AGENT_PAYOUT_FEE'
  | 'PAYMENT_AGENT_PAYOUT_REJECT'
  | 'PAYMENT_AGENT_PAYOUT_REJECT_FEE'
  | 'PAYMENT_AGENT_PAYOUT_RETURN'
  | 'PAYMENT_AGENT_PAYOUT_RETURN_FEE'
  | 'MARKET_FX'
  | 'MARKET_FX_FEE'
  | 'DIRECT_FX'
  | 'CHARGE_COMPENSATION'
  | 'CUSTOMER_PROFIT'
  | 'WT_PAY'
  | 'INTERNAL'
  | 'MONTHLY_FEE'
  | 'OTHER';

export type TransferPurpose =
  | 'BILLS'
  | 'COMMODITY'
  | 'DONATION_ENTITY'
  | 'DONATION_PERSON'
  | 'FAMILY'
  | 'PREPAYMENT'
  | 'SERVICE'
  | 'PROPERTY'
  | 'OTHER';

export type SourceOfIncome =
  | 'SALARY'
  | 'SAVINGS'
  | 'SCHOLARSHIP'
  | 'INSURANCE'
  | 'INVESTMENTS'
  | 'DONATION'
  | 'BUSINESS_INCOME'
  | 'OTHER';

export type TransferCostInstruction = 'SENDER_VOLUME' | 'RECEIVER_VOLUME';

export interface ApiErrorData {
  key: string;
  value: string;
}

export interface ApiError {
  key: string;
  description: string;
  trace?: string;
  errorData?: ApiErrorData[];
}

/** Raw API envelope. Client methods unwrap `result` automatically. */
export interface ApiResponse<T> {
  success: boolean;
  errors?: ApiError[];
  result: T;
}

export interface ApiResponseWithDuplicate<T> extends ApiResponse<T> {
  duplicate: boolean;
}

export interface WalutomatClientOptions {
  apiKey: string;
  /** PEM-encoded RSA private key (4096 bit). Required for signed endpoints. */
  privateKey?: string;
  /** Use the sandbox environment (api.walutomat.dev). Default: false. */
  sandbox?: boolean;
  /** Override the base URL entirely (e.g. for proxying). */
  baseUrl?: string;
  /** Custom fetch implementation. Defaults to global `fetch`. */
  fetch?: typeof globalThis.fetch;
}
