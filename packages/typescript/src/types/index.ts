export type {
  Currency,
  MarketCurrencyPair,
  CurrencyPair,
  BuySell,
  SortOrder,
  OperationType,
  OperationDetailedType,
  TransferPurpose,
  SourceOfIncome,
  TransferCostInstruction,
  ApiError,
  ApiErrorData,
  ApiResponse,
  ApiResponseWithDuplicate,
  WalutomatClientOptions,
} from './common.js';

export type { WalletBalance, HistoryItem, OperationDetail, GetHistoryParams, GetHistoryMt940Params } from './account.js';

export type {
  TransferStatus,
  TransferDetails,
  TransferCreationResult,
  GetTransferParams,
  CreateInternalTransferParams,
  CreateIbanTransferParams,
  CreateSepaTransferParams,
  CreateNonIbanTransferParams,
  NonIbanCountry,
  CnapsTransactionType,
} from './transfers.js';

export type { ExchangeRate, GetRatesParams, ExchangeResult, CreateExchangeParams } from './direct-fx.js';

export type {
  OfferEntry,
  BestOffers,
  DetailedQuote,
  DetailedOfferEntry,
  BestOffersDetailed,
  GetBestOffersParams,
  GetBestOffersDetailedParams,
  OrderStatus,
  MarketOrder,
  GetActiveOrdersParams,
  GetOrderParams,
  SubmitOrderParams,
  SubmitOrderResult,
  CloseOrderParams,
} from './market-fx.js';
