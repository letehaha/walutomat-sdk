import { describe, expect, it } from 'vitest';
import { createMockHttp } from '../test-utils.js';
import {
  createIbanTransfer,
  createInternalTransfer,
  createNonIbanTransfer,
  createSepaTransfer,
  getTransferStatus,
} from './transfers.js';

describe('transfers endpoints', () => {
  describe('getTransferStatus', () => {
    it('calls GET /transfer with transferId', async () => {
      const http = createMockHttp();
      http.get.mockResolvedValue({ transferId: 'abc', transferStatus: 'SETTLED' });

      const result = await getTransferStatus(http, { transferId: 'abc' });

      expect(http.get).toHaveBeenCalledWith({
        endpoint: '/transfer',
        params: { transferId: 'abc', submitId: undefined },
      });
      expect(result.transferStatus).toBe('SETTLED');
    });

    it('calls GET /transfer with submitId', async () => {
      const http = createMockHttp();
      http.get.mockResolvedValue({ transferStatus: 'NEW' });

      await getTransferStatus(http, { submitId: 'my-submit-id' });

      expect(http.get).toHaveBeenCalledWith({
        endpoint: '/transfer',
        params: { transferId: undefined, submitId: 'my-submit-id' },
      });
    });
  });

  describe('createInternalTransfer', () => {
    it('calls POST /transfer/internal with all params', async () => {
      const http = createMockHttp();
      http.post.mockResolvedValue({ transferId: 'xyz', feeAmount: '0.23' });

      const result = await createInternalTransfer(http, {
        submitId: 'sub-1',
        currency: 'EUR',
        volume: '100.00',
        accountNumber: 'WX1234WX',
        recipientName: 'John',
        transferCostInstruction: 'SENDER_VOLUME',
      });

      const call = http.post.mock.calls[0]![0] as { endpoint: string; body: Record<string, unknown> };
      expect(call.endpoint).toBe('/transfer/internal');
      expect(call.body.volume).toBe('100.00');
      expect(call.body.accountNumber).toBe('WX1234WX');
      expect(result.transferId).toBe('xyz');
    });
  });

  describe('createIbanTransfer', () => {
    it('calls POST /transfer/iban', async () => {
      const http = createMockHttp();
      http.post.mockResolvedValue({ transferId: 'iban-1' });

      await createIbanTransfer(http, {
        volume: '50.00',
        currency: 'PLN',
        accountNumber: 'PL71967221037685356996377436',
        recipientName: 'Jan',
        transferCostInstruction: 'RECEIVER_VOLUME',
        transferPurpose: 'BILLS',
        sourceOfIncome: 'SALARY',
      });

      const call = http.post.mock.calls[0]![0] as { endpoint: string; body: Record<string, unknown> };
      expect(call.endpoint).toBe('/transfer/iban');
      expect(call.body.transferPurpose).toBe('BILLS');
    });
  });

  describe('createSepaTransfer', () => {
    it('calls POST /transfer/iban/sepa', async () => {
      const http = createMockHttp();
      http.post.mockResolvedValue({ transferId: 'sepa-1' });

      await createSepaTransfer(http, {
        volume: '200.00',
        accountNumber: 'DE89370400440532013000',
        recipientName: 'Hans',
        instant: true,
      });

      const call = http.post.mock.calls[0]![0] as { endpoint: string; body: Record<string, unknown> };
      expect(call.endpoint).toBe('/transfer/iban/sepa');
      expect(call.body.instant).toBe(true);
    });
  });

  describe('createNonIbanTransfer', () => {
    it('calls POST /transfer/noniban with country and swift', async () => {
      const http = createMockHttp();
      http.post.mockResolvedValue({ transferId: 'non-1' });

      await createNonIbanTransfer(http, {
        volume: '500.00',
        currency: 'USD',
        country: 'CN',
        swift: 'ICBKCNBJBJM',
        accountNumber: '559970269249',
        recipientName: 'Li',
        recipientAddress: 'CN;CN-HK;Hong Kong;;;',
        transferCostInstruction: 'SENDER_VOLUME',
        transferPurpose: 'PREPAYMENT',
        sourceOfIncome: 'SAVINGS',
        cnaps: '123456789012',
        cnapsTransactionType: 'CGODDR',
      });

      const call = http.post.mock.calls[0]![0] as { endpoint: string; body: Record<string, unknown> };
      expect(call.endpoint).toBe('/transfer/noniban');
      expect(call.body.country).toBe('CN');
      expect(call.body.cnaps).toBe('123456789012');
    });
  });
});
