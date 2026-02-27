import type { HttpClient } from '../http-client.js';
import type {
  CreateIbanTransferParams,
  CreateInternalTransferParams,
  CreateNonIbanTransferParams,
  CreateSepaTransferParams,
  GetTransferParams,
  TransferCreationResult,
  TransferDetails,
} from '../types/index.js';

/** Learn transfer status and details by `transferId` or `submitId`. */
export async function getTransferStatus(http: HttpClient, params: GetTransferParams): Promise<TransferDetails> {
  return http.get<TransferDetails>({
    endpoint: '/transfer',
    params: {
      transferId: params.transferId,
      submitId: params.submitId,
    },
  });
}

/** Request an internal transfer between Currency One wallets. */
export async function createInternalTransfer(
  http: HttpClient,
  params: CreateInternalTransferParams,
): Promise<TransferCreationResult> {
  return http.post<TransferCreationResult>({
    endpoint: '/transfer/internal',
    body: {
      dryRun: params.dryRun,
      submitId: params.submitId,
      currency: params.currency,
      volume: params.volume,
      title: params.title,
      accountNumber: params.accountNumber,
      recipientName: params.recipientName,
      recipientAddress: params.recipientAddress,
      transferCostInstruction: params.transferCostInstruction,
    },
  });
}

/** Request a transfer to an IBAN destination. */
export async function createIbanTransfer(
  http: HttpClient,
  params: CreateIbanTransferParams,
): Promise<TransferCreationResult> {
  return http.post<TransferCreationResult>({
    endpoint: '/transfer/iban',
    body: {
      dryRun: params.dryRun,
      submitId: params.submitId,
      volume: params.volume,
      currency: params.currency,
      title: params.title,
      accountNumber: params.accountNumber,
      recipientName: params.recipientName,
      recipientAddress: params.recipientAddress,
      faster: params.faster,
      transferCostInstruction: params.transferCostInstruction,
      additionalRemittanceInformation: params.additionalRemittanceInformation,
      transferPurpose: params.transferPurpose,
      sourceOfIncome: params.sourceOfIncome,
    },
  });
}

/** Request a SEPA or SEPA Instant transfer. */
export async function createSepaTransfer(
  http: HttpClient,
  params: CreateSepaTransferParams,
): Promise<TransferCreationResult> {
  return http.post<TransferCreationResult>({
    endpoint: '/transfer/iban/sepa',
    body: {
      dryRun: params.dryRun,
      submitId: params.submitId,
      volume: params.volume,
      title: params.title,
      accountNumber: params.accountNumber,
      recipientName: params.recipientName,
      recipientAddress: params.recipientAddress,
      instant: params.instant,
      additionalRemittanceInformation: params.additionalRemittanceInformation,
      transferPurpose: params.transferPurpose,
      sourceOfIncome: params.sourceOfIncome,
    },
  });
}

/** Request a transfer to a non-IBAN destination (specific countries). */
export async function createNonIbanTransfer(
  http: HttpClient,
  params: CreateNonIbanTransferParams,
): Promise<TransferCreationResult> {
  return http.post<TransferCreationResult>({
    endpoint: '/transfer/noniban',
    body: {
      dryRun: params.dryRun,
      submitId: params.submitId,
      volume: params.volume,
      currency: params.currency,
      title: params.title,
      country: params.country,
      swift: params.swift,
      accountNumber: params.accountNumber,
      recipientName: params.recipientName,
      recipientAddress: params.recipientAddress,
      faster: params.faster,
      transferCostInstruction: params.transferCostInstruction,
      transferPurpose: params.transferPurpose,
      sourceOfIncome: params.sourceOfIncome,
      additionalRemittanceInformation: params.additionalRemittanceInformation,
      cnaps: params.cnaps,
      cnapsTransactionType: params.cnapsTransactionType,
    },
  });
}
