import { describe, expect, it } from "vitest";
import {
  getActiveOrders,
  getBestOffers,
  getBestOffersDetailed,
  getOrder,
  submitOrder,
  closeOrder,
} from "../endpoints/market-fx.js";
import { getIntegrationHttp, HAS_CREDENTIALS } from "./setup.js";

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
      currencyPair: "EURPLN",
      buySell: "BUY",
      volume: "10.00",
      volumeCurrency: "EUR",
      limitPrice: "3.0000",
    });

    expect(submitted).toHaveProperty("orderId");

    const closed = await closeOrder(http, { orderId: submitted.orderId });

    expect(closed).toHaveProperty("orderId", submitted.orderId);
    expect(closed).toHaveProperty("status");
  });
});
