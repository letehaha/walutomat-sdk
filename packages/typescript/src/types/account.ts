import type { Currency, OperationDetailedType, OperationType, SortOrder } from './common.js';

export interface WalletBalance {
  currency: Currency;
  balanceTotal: string;
  balanceAvailable: string;
  balanceReserved: string;
}

/**
 * A single entry in the wallet operation history.
 *
 * The `operationDetails` object varies by {@link OperationType} /
 * {@link OperationDetailedType} — see the Walutomat API docs for the full
 * mapping of which keys appear for each type.
 */
export interface HistoryItem {
  historyItemId: number;
  transactionId: string;
  ts: string;
  operationAmount: string;
  balanceAfter: string;
  currency: Currency;
  operationType: OperationType;
  operationDetailedType: OperationDetailedType;
  operationDetails: OperationDetail[];
}

export interface OperationDetail {
  key: string;
  value: string;
}

export interface GetHistoryParams {
  /** ISO 8601 datetime — only operations on or after this date (inclusive). */
  dateFrom?: string;
  /** ISO 8601 datetime — only operations before this date (exclusive). */
  dateTo?: string;
  /** Filter by currencies. */
  currencies?: Currency[];
  operationType?: OperationType;
  operationDetailedType?: OperationDetailedType;
  /** Max items per page (1–200, default 200). */
  itemLimit?: number;
  /** Resume pagination from the last `historyItemId` received. */
  continueFrom?: number;
  sortOrder?: SortOrder;
}

export interface GetHistoryMt940Params {
  /** Date in YYYY-MM-DD format (required). */
  dateFrom: string;
  /** Date in YYYY-MM-DD format (exclusive upper bound). */
  dateTo?: string;
  currencies?: Currency[];
}
