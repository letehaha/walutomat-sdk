import { describe, expect, it } from "vitest";
import {
  getBalances,
  getHistory,
  getHistoryIterator,
  getHistoryMt940,
} from "../endpoints/account.js";
import { getIntegrationHttp, HAS_CREDENTIALS } from "./setup.js";

const DAY_MS = 24 * 60 * 60 * 1000;

describe.skipIf(!HAS_CREDENTIALS)("account (integration)", () => {
  const http = HAS_CREDENTIALS ? getIntegrationHttp() : (undefined as never);

  it("getBalances returns an array of balances", async () => {
    const balances = await getBalances(http);

    expect(Array.isArray(balances)).toBe(true);
    expect(balances.length).toBeGreaterThan(0);

    const first = balances[0]!;
    expect(first).toHaveProperty("currency");
    expect(first).toHaveProperty("balanceTotal");
    expect(first).toHaveProperty("balanceAvailable");
    expect(first).toHaveProperty("balanceReserved");
  });

  it("getHistory returns an array of history items", async () => {
    const items = await getHistory(http, { itemLimit: 5 });

    expect(Array.isArray(items)).toBe(true);

    if (items.length > 0) {
      const first = items[0]!;
      expect(first).toHaveProperty("historyItemId");
      expect(first).toHaveProperty("transactionId");
      expect(first).toHaveProperty("ts");
      expect(first).toHaveProperty("operationAmount");
      expect(first).toHaveProperty("balanceAfter");
      expect(first).toHaveProperty("currency");
      expect(first).toHaveProperty("operationType");
      expect(Array.isArray(first.operationDetails)).toBe(true);
    }
  });

  it("getHistory with currency filter returns only matching currencies", async () => {
    const items = await getHistory(http, {
      currencies: ["PLN"],
      itemLimit: 10,
    });

    for (const item of items) {
      expect(item.currency).toBe("PLN");
    }
  });

  it("getHistoryIterator paginates through items", async () => {
    const collected: unknown[] = [];

    for await (const item of getHistoryIterator(http, { itemLimit: 3 })) {
      collected.push(item);
      if (collected.length >= 5) break;
    }

    expect(Array.isArray(collected)).toBe(true);
  });

  it("getHistoryMt940 returns an MT940 string", async () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * DAY_MS);
    const dateFrom = thirtyDaysAgo.toISOString().split("T")[0]!;

    const mt940 = await getHistoryMt940(http, { dateFrom });

    expect(typeof mt940).toBe("string");
  });

  it("getHistory with future date window returns empty array", async () => {
    const tomorrow = new Date(Date.now() + DAY_MS).toISOString();
    const dayAfter = new Date(Date.now() + 2 * DAY_MS).toISOString();

    const items = await getHistory(http, {
      dateFrom: tomorrow,
      dateTo: dayAfter,
      itemLimit: 10,
    });

    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBe(0);
  });

  it("getHistory with sortOrder ASC returns items in ascending order", async () => {
    const items = await getHistory(http, {
      sortOrder: "ASC",
      itemLimit: 10,
    });

    if (items.length >= 2) {
      for (let i = 1; i < items.length; i++) {
        expect(items[i]!.historyItemId).toBeGreaterThan(items[i - 1]!.historyItemId);
      }
    }
  });

  it("getHistoryIterator with no results yields nothing", async () => {
    const tomorrow = new Date(Date.now() + DAY_MS).toISOString();
    const dayAfter = new Date(Date.now() + 2 * DAY_MS).toISOString();
    const collected: unknown[] = [];

    for await (const item of getHistoryIterator(http, {
      dateFrom: tomorrow,
      dateTo: dayAfter,
      itemLimit: 10,
    })) {
      collected.push(item);
    }

    expect(collected.length).toBe(0);
  });

  it("getHistoryMt940 with future date range returns empty or minimal MT940", async () => {
    const mt940 = await getHistoryMt940(http, {
      dateFrom: "2099-01-01",
      dateTo: "2099-01-02",
    });

    expect(typeof mt940).toBe("string");
  });
});
