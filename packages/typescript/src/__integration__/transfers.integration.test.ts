import { describe, expect, it } from "vitest";
import {
  createIbanTransfer,
  createInternalTransfer,
  createSepaTransfer,
  createNonIbanTransfer,
  getTransferStatus,
} from "../endpoints/transfers.js";
import { WalutomatApiError } from "../errors.js";
import { getIntegrationHttp, HAS_CREDENTIALS } from "./setup.js";

describe.skipIf(!HAS_CREDENTIALS)("transfers (integration)", () => {
  const http = HAS_CREDENTIALS ? getIntegrationHttp() : (undefined as never);

  it("getTransferStatus returns details or throws for unknown ID", async () => {
    try {
      const result = await getTransferStatus(http, {
        submitId: "00000000-0000-0000-0000-000000000000",
      });

      expect(result).toHaveProperty("transferId");
      expect(result).toHaveProperty("status");
    } catch (err) {
      expect(err).toBeInstanceOf(WalutomatApiError);
    }
  });

  it("createIbanTransfer with dryRun=true returns fee info or validation error", async () => {
    try {
      const result = await createIbanTransfer(http, {
        dryRun: true,
        volume: "10.00",
        currency: "PLN",
        accountNumber: "PL61109010140000071219812874",
        recipientName: "Test Recipient",
        transferCostInstruction: "SENDER_VOLUME",
      });

      expect(result).toHaveProperty("feeAmount");
      expect(result).toHaveProperty("feeCurrency");
    } catch (err) {
      expect(err).toBeInstanceOf(WalutomatApiError);
    }
  });

  it("createInternalTransfer with dryRun=true validates without transferring", async () => {
    try {
      const result = await createInternalTransfer(http, {
        dryRun: true,
        volume: "10.00",
        currency: "PLN",
        accountNumber: "WX0000000000WX",
        recipientName: "Test Recipient",
        transferCostInstruction: "SENDER_VOLUME",
      });

      expect(result).toHaveProperty("feeAmount");
      expect(result).toHaveProperty("feeCurrency");
    } catch (err) {
      expect(err).toBeInstanceOf(WalutomatApiError);
    }
  });

  it("createSepaTransfer with dryRun=true validates without transferring", async () => {
    try {
      const result = await createSepaTransfer(http, {
        dryRun: true,
        volume: "10.00",
        accountNumber: "DE89370400440532013000",
        recipientName: "Test Recipient",
      });

      expect(result).toHaveProperty("feeAmount");
      expect(result).toHaveProperty("feeCurrency");
    } catch (err) {
      expect(err).toBeInstanceOf(WalutomatApiError);
    }
  });

  it("createNonIbanTransfer with dryRun=true validates without transferring", async () => {
    try {
      const result = await createNonIbanTransfer(http, {
        dryRun: true,
        volume: "100.00",
        currency: "USD",
        country: "AU",
        swift: "ANZBAU3M",
        accountNumber: "000123456789",
        recipientName: "Test Recipient",
        recipientAddress: "AU;NSW;Sydney;2000;George St;1;1",
        transferCostInstruction: "SENDER_VOLUME",
        transferPurpose: "OTHER",
        sourceOfIncome: "SALARY",
      });

      expect(result).toHaveProperty("feeAmount");
      expect(result).toHaveProperty("feeCurrency");
    } catch (err) {
      expect(err).toBeInstanceOf(WalutomatApiError);
    }
  });

  it("getTransferStatus with bogus transferId throws WalutomatApiError", async () => {
    await expect(
      getTransferStatus(http, {
        transferId: "not-a-real-uuid",
        submitId: "also-not-real",
      }),
    ).rejects.toThrow(WalutomatApiError);
  });

  it("createIbanTransfer dryRun with invalid IBAN throws WalutomatApiError", async () => {
    await expect(
      createIbanTransfer(http, {
        dryRun: true,
        volume: "10.00",
        currency: "PLN",
        accountNumber: "INVALIDIBAN",
        recipientName: "Test Recipient",
        transferCostInstruction: "SENDER_VOLUME",
      }),
    ).rejects.toThrow(WalutomatApiError);
  });

  it("createIbanTransfer dryRun with faster=true validates fast transfer path", async () => {
    try {
      const result = await createIbanTransfer(http, {
        dryRun: true,
        volume: "10.00",
        currency: "PLN",
        accountNumber: "PL61109010140000071219812874",
        recipientName: "Test Recipient",
        transferCostInstruction: "SENDER_VOLUME",
        faster: true,
      });

      expect(result).toHaveProperty("feeAmount");
      expect(result).toHaveProperty("feeCurrency");
    } catch (err) {
      expect(err).toBeInstanceOf(WalutomatApiError);
    }
  });

  it("createSepaTransfer dryRun with instant=true validates SEPA Instant path", async () => {
    try {
      const result = await createSepaTransfer(http, {
        dryRun: true,
        volume: "10.00",
        accountNumber: "DE89370400440532013000",
        recipientName: "Test Recipient",
        instant: true,
      });

      expect(result).toHaveProperty("feeAmount");
      expect(result).toHaveProperty("feeCurrency");
    } catch (err) {
      expect(err).toBeInstanceOf(WalutomatApiError);
    }
  });

  it("createNonIbanTransfer dryRun with CNY/CN missing CNAPS throws WalutomatApiError", async () => {
    await expect(
      createNonIbanTransfer(http, {
        dryRun: true,
        volume: "100.00",
        currency: "CNY",
        country: "CN",
        swift: "BKCHCNBJ",
        accountNumber: "6222021234567890",
        recipientName: "Test Recipient",
        recipientAddress: "CN;Beijing;Beijing;100000;Main St;1;1",
        transferCostInstruction: "SENDER_VOLUME",
        transferPurpose: "OTHER",
        sourceOfIncome: "SALARY",
      }),
    ).rejects.toThrow(WalutomatApiError);
  });
});
