import { describe, expect, it } from "vitest";
import {
  getActiveOrders,
  getBestOffers,
  getBestOffersDetailed,
  getOrder,
  submitOrder,
  closeOrder,
} from "../endpoints/market-fx.js";
import { WalutomatApiError } from "../errors.js";
import { getIntegrationHttp, HAS_CREDENTIALS } from "./setup.js";

/** Reusable params for low-limit BUY order that will never fill. */
const LOW_BUY_ORDER = {
  currencyPair: "EURPLN",
  buySell: "BUY",
  volume: "10.00",
  volumeCurrency: "EUR",
  limitPrice: "3.0000",
} as const;

describe.skipIf(!HAS_CREDENTIALS)("market-fx (integration)", () => {
  const http = HAS_CREDENTIALS ? getIntegrationHttp() : (undefined as never);

  it("getBestOffers returns bids and asks for EURPLN", async () => {
    const offers = await getBestOffers(http, { currencyPair: "EURPLN" });

    expect(offers).toHaveProperty("ts");
    expect(offers).toHaveProperty("currencyPair", "EURPLN");
    expect(Array.isArray(offers.bids)).toBe(true);
    expect(Array.isArray(offers.asks)).toBe(true);
  });

  it("getBestOffersDetailed returns detailed offers", async () => {
    const offers = await getBestOffersDetailed(http, {
      currencyPair: "EURPLN",
      itemLimit: 3,
    });

    expect(offers).toHaveProperty("currencyPair", "EURPLN");
    expect(Array.isArray(offers.bids)).toBe(true);
    expect(Array.isArray(offers.asks)).toBe(true);

    if (offers.bids.length > 0) {
      expect(offers.bids[0]).toHaveProperty("valueInOppositeCurrency");
      expect(Array.isArray(offers.bids[0]!.quotes)).toBe(true);
    }
  });

  it("getActiveOrders returns an array", async () => {
    const orders = await getActiveOrders(http, { itemLimit: 5 });

    expect(Array.isArray(orders)).toBe(true);
  });

  it("getOrder returns an array (empty for unknown ID)", async () => {
    const orders = await getOrder(http, {
      orderId: "00000000-0000-0000-0000-000000000000",
    });

    expect(Array.isArray(orders)).toBe(true);
    expect(orders.length).toBe(0);
  });

  it("submitOrder with dryRun=true validates without placing", async () => {
    const result = await submitOrder(http, {
      dryRun: true,
      currencyPair: "EURPLN",
      buySell: "BUY",
      volume: "10.00",
      volumeCurrency: "EUR",
      limitPrice: "4.2000",
    });

    expect(result).toHaveProperty("duplicate");
    expect(result).toHaveProperty("result");
  });

  it("submitOrder + closeOrder lifecycle", async () => {
    const { result: submitted } = await submitOrder(http, {
      submitId: crypto.randomUUID(),
      ...LOW_BUY_ORDER,
    });

    expect(submitted).toHaveProperty("orderId");

    const closed = await closeOrder(http, { orderId: submitted.orderId });

    expect(closed).toHaveProperty("orderId", submitted.orderId);
    expect(closed).toHaveProperty("status");
  });

  it("getBestOffers with GBPPLN works beyond EURPLN", async () => {
    const offers = await getBestOffers(http, { currencyPair: "GBPPLN" });

    expect(offers).toHaveProperty("currencyPair", "GBPPLN");
    expect(Array.isArray(offers.bids)).toBe(true);
    expect(Array.isArray(offers.asks)).toBe(true);
  });

  it("getBestOffersDetailed with itemLimit=1 returns at most 1 bid/ask", async () => {
    const offers = await getBestOffersDetailed(http, {
      currencyPair: "EURPLN",
      itemLimit: 1,
    });

    expect(offers).toHaveProperty("currencyPair", "EURPLN");
    expect(offers.bids.length).toBeLessThanOrEqual(1);
    expect(offers.asks.length).toBeLessThanOrEqual(1);
  });

  it("getActiveOrders with itemLimit=1 respects limit", async () => {
    const orders = await getActiveOrders(http, { itemLimit: 1 });

    expect(Array.isArray(orders)).toBe(true);
    expect(orders.length).toBeLessThanOrEqual(1);
  });

  it("getOrder with invalid UUID format throws WalutomatApiError or returns empty", async () => {
    try {
      const orders = await getOrder(http, { orderId: "not-a-valid-uuid" });
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBe(0);
    } catch (err) {
      expect(err).toBeInstanceOf(WalutomatApiError);
    }
  });

  it("submitOrder with same submitId returns duplicate=true", async () => {
    const submitId = crypto.randomUUID();

    const first = await submitOrder(http, { submitId, ...LOW_BUY_ORDER });

    try {
      expect(first.duplicate).toBe(false);

      const second = await submitOrder(http, { submitId, ...LOW_BUY_ORDER });

      expect(second.duplicate).toBe(true);
    } finally {
      await closeOrder(http, { orderId: first.result.orderId });
    }
  });

  it("closeOrder on already-closed order succeeds idempotently or throws", async () => {
    const { result: submitted } = await submitOrder(http, {
      submitId: crypto.randomUUID(),
      ...LOW_BUY_ORDER,
    });

    await closeOrder(http, { orderId: submitted.orderId });

    // Second close may succeed idempotently or throw
    try {
      await closeOrder(http, { orderId: submitted.orderId });
    } catch (err) {
      expect(err).toBeInstanceOf(WalutomatApiError);
    }
  });
});
