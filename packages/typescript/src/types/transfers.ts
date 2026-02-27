import type { Currency, SourceOfIncome, TransferCostInstruction, TransferPurpose } from './common.js';

export type TransferStatus = 'NEW' | 'PROCESSING' | 'SETTLED' | 'REJECTED' | 'RETURNED' | 'CANCELLED';

export interface TransferDetails {
  transferId: string;
  submitId: string;
  responseTs: string;
  transferStatus: TransferStatus;
  submittedTs: string;
  settledTs?: string;
  currency: Currency;
  volume: string;
  transferTitle: string;
  recipientAccount: string;
  recipientName: string;
}

export interface TransferCreationResult {
  feeAmount: string;
  feeCurrency: Currency;
  transferId: string;
  transferType?: string;
}

export interface GetTransferParams {
  /** UUID of the transfer. If both provided, `transferId` takes precedence. */
  transferId?: string;
  /** Unique sender-assigned ID. */
  submitId?: string;
}

interface BaseTransferParams {
  dryRun?: boolean;
  /** Required when `dryRun` is false. Must be unique per transfer. */
  submitId?: string;
  volume: string;
  currency: Currency;
  title?: string;
  recipientName: string;
  recipientAddress?: string;
  transferCostInstruction: TransferCostInstruction;
}

export interface CreateInternalTransferParams extends BaseTransferParams {
  /** Destination account number (e.g. "WX1234567890WX"). */
  accountNumber: string;
}

export interface CreateIbanTransferParams extends BaseTransferParams {
  /** IBAN with mandatory country code prefix. */
  accountNumber: string;
  faster?: boolean;
  additionalRemittanceInformation?: string;
  transferPurpose?: TransferPurpose;
  sourceOfIncome?: SourceOfIncome;
}

export interface CreateSepaTransferParams {
  dryRun?: boolean;
  submitId?: string;
  volume: string;
  title?: string;
  /** IBAN with mandatory country code prefix. */
  accountNumber: string;
  recipientName: string;
  recipientAddress?: string;
  /** SEPA Instant when true. Default: false. */
  instant?: boolean;
  additionalRemittanceInformation?: string;
  transferPurpose?: TransferPurpose;
  sourceOfIncome?: SourceOfIncome;
}

export type NonIbanCountry =
  | 'KR'
  | 'CN'
  | 'AU'
  | 'CA'
  | 'JP'
  | 'NZ'
  | 'SG'
  | 'TW'
  | 'NG'
  | 'GH'
  | 'VN'
  | 'IN'
  | 'ET'
  | 'ZA'
  | 'GM'
  | 'GN'
  | 'AR'
  | 'BD'
  | 'CL'
  | 'ID'
  | 'MX'
  | 'MY'
  | 'PY'
  | 'QA'
  | 'TH'
  | 'UY'
  | 'LK';

export type CnapsTransactionType = 'CGODDR' | 'CSTRDR' | 'CCDNDR' | 'CCTFDR' | 'COCADR';

export interface CreateNonIbanTransferParams {
  dryRun?: boolean;
  submitId?: string;
  volume: string;
  currency: Currency;
  title?: string;
  country: NonIbanCountry;
  swift: string;
  accountNumber: string;
  recipientName: string;
  /** Required. Format: `CC;province;town;postcode;street;building;flat`. */
  recipientAddress: string;
  faster?: boolean;
  transferCostInstruction: TransferCostInstruction;
  transferPurpose: TransferPurpose;
  sourceOfIncome: SourceOfIncome;
  additionalRemittanceInformation?: string;
  /** Required when currency is CNY and country is CN. */
  cnaps?: string;
  /** Required when currency is CNY and country is CN. */
  cnapsTransactionType?: CnapsTransactionType;
}
