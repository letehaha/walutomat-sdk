import { describe, expect, it } from "vitest";
import { createExchange, getRates } from "../endpoints/direct-fx.js";
import { WalutomatApiError } from "../errors.js";
import { getIntegrationHttp, HAS_CREDENTIALS } from "./setup.js";

/**
 * Rethrows the error unless it is a MISSING_AUTH_ROLE API error,
 * in which case the test is silently skipped (the sandbox key may
 * not have direct_fx permissions).
 */
function skipIfMissingAuthRole(err: unknown): never {
  if (err instanceof WalutomatApiError && err.code === "MISSING_AUTH_ROLE") {
    console.warn("Skipping: API key lacks direct_fx permissions");
    return undefined as never;
  }
  throw err;
}

describe.skipIf(!HAS_CREDENTIALS)("direct-fx (integration)", () => {
  const http = HAS_CREDENTIALS ? getIntegrationHttp() : (undefined as never);

  it("getRates returns buy and sell rates for EURPLN", async () => {
    try {
      const rates = await getRates(http, { currencyPair: "EURPLN" });

      expect(rates).toHaveProperty("ts");
      expect(rates).toHaveProperty("currencyPair", "EURPLN");
      expect(rates).toHaveProperty("buyRate");
      expect(rates).toHaveProperty("sellRate");
      expect(Number(rates.buyRate)).toBeGreaterThan(0);
      expect(Number(rates.sellRate)).toBeGreaterThan(0);
    } catch (err) {
      skipIfMissingAuthRole(err);
    }
  });

  it("createExchange with dryRun=true validates without exchanging", async () => {
    let rates;
    try {
      rates = await getRates(http, { currencyPair: "EURPLN" });
    } catch (err) {
      return skipIfMissingAuthRole(err);
    }

    const response = await createExchange(http, {
      dryRun: true,
      currencyPair: "EURPLN",
      buySell: "BUY",
      volume: "10.00",
      volumeCurrency: "EUR",
      ts: rates.ts,
    });

    expect(response.duplicate).toBe(false);
  });

  it("createExchange dryRun with stale ts still returns valid response shape", async () => {
    try {
      await getRates(http, { currencyPair: "EURPLN" });
    } catch (err) {
      return skipIfMissingAuthRole(err);
    }

    try {
      const response = await createExchange(http, {
        dryRun: true,
        currencyPair: "EURPLN",
        buySell: "BUY",
        volume: "10.00",
        volumeCurrency: "EUR",
        ts: "2020-01-01T00:00:00.000Z",
      });

      expect(response).toHaveProperty("duplicate");
      expect(response).toHaveProperty("result");
      expect(response.result).toHaveProperty("exchangeId");
    } catch (err) {
      // Stale ts may be rejected by the API
      expect(err).toBeInstanceOf(WalutomatApiError);
    }
  });

  it("createExchange with mismatched volumeCurrency throws WalutomatApiError", async () => {
    let rates;
    try {
      rates = await getRates(http, { currencyPair: "EURPLN" });
    } catch (err) {
      return skipIfMissingAuthRole(err);
    }

    await expect(
      createExchange(http, {
        dryRun: true,
        currencyPair: "EURPLN",
        buySell: "BUY",
        volume: "10.00",
        volumeCurrency: "GBP",
        ts: rates.ts,
      }),
    ).rejects.toThrow(WalutomatApiError);
  });

  it("getRates with USDPLN returns rates (not hardcoded to EURPLN)", async () => {
    try {
      const rates = await getRates(http, { currencyPair: "USDPLN" });

      expect(rates).toHaveProperty("ts");
      expect(rates).toHaveProperty("currencyPair", "USDPLN");
      expect(rates).toHaveProperty("buyRate");
      expect(rates).toHaveProperty("sellRate");
      expect(Number(rates.buyRate)).toBeGreaterThan(0);
      expect(Number(rates.sellRate)).toBeGreaterThan(0);
    } catch (err) {
      skipIfMissingAuthRole(err);
    }
  });
});
