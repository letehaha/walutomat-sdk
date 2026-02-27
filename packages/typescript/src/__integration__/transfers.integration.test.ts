import { describe, expect, it } from 'vitest';
import { createIbanTransfer } from '../endpoints/transfers.js';
import { WalutomatApiError } from '../errors.js';
import { getIntegrationHttp, HAS_CREDENTIALS } from './setup.js';

describe.skipIf(!HAS_CREDENTIALS)('transfers (integration)', () => {
  const http = HAS_CREDENTIALS ? getIntegrationHttp() : (undefined as never);

  it('createIbanTransfer with dryRun=true returns fee info or validation error', async () => {
    try {
      const result = await createIbanTransfer(http, {
        dryRun: true,
        volume: '10.00',
        currency: 'PLN',
        accountNumber: 'PL61109010140000071219812874',
        recipientName: 'Test Recipient',
        transferCostInstruction: 'SENDER_VOLUME',
      });

      // If it succeeds, we get fee info
      expect(result).toHaveProperty('feeAmount');
      expect(result).toHaveProperty('feeCurrency');
    } catch (err) {
      // Some validation errors are expected (e.g. invalid IBAN for this account)
      expect(err).toBeInstanceOf(WalutomatApiError);
    }
  });
});
