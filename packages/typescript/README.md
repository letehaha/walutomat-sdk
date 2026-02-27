# walutomat-sdk

[![CI](https://github.com/letehaha/walutomat-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/letehaha/walutomat-sdk/actions/workflows/ci.yml)
[![Integration tests](https://github.com/letehaha/walutomat-sdk/actions/workflows/integration.yml/badge.svg)](https://github.com/letehaha/walutomat-sdk/actions/workflows/integration.yml)

Unofficial TypeScript client for the [Walutomat API v2.0.0](https://api.walutomat.pl/v2.0.0/).

Zero dependencies — uses native `fetch` and `node:crypto`.

## Installation

```bash
npm install walutomat-sdk
```

Requires Node.js >= 18.

## Quick Start

```typescript
import { WalutomatClient } from 'walutomat-sdk';
import { readFileSync } from 'node:fs';

const client = new WalutomatClient({
  apiKey: 'your-api-key',
  privateKey: readFileSync('./private.key', 'utf-8'),
  // sandbox: true, // use api.walutomat.dev for testing
});

// Check wallet balances
const balances = await client.account.getBalances();
console.log(balances);

// Get operation history
const history = await client.account.getHistory({
  currencies: ['PLN', 'EUR'],
  operationType: 'DIRECT_FX',
  dateFrom: '2024-01-01T00:00:00Z',
});

// Auto-paginate through all history
for await (const item of client.account.getHistoryIterator()) {
  console.log(item.historyItemId, item.amount, item.currency);
}

// Get exchange rate and execute exchange
const rate = await client.directFx.getRates({ currencyPair: 'EURPLN' });
const { result } = await client.directFx.exchange({
  submitId: crypto.randomUUID(),
  currencyPair: 'EURPLN',
  buySell: 'BUY',
  volume: '100.00',
  volumeCurrency: 'EUR',
  ts: rate.ts,
});

// Check P2P market offers
const offers = await client.marketFx.getBestOffers({ currencyPair: 'EURPLN' });
```

## API Coverage

| Group       | Methods                                                                                   |
| ----------- | ----------------------------------------------------------------------------------------- |
| Account     | `getBalances()`, `getHistory()`, `getHistoryIterator()`, `getHistoryMt940()`              |
| Transfers   | `getStatus()`, `createInternal()`, `createIban()`, `createSepa()`, `createNonIban()`      |
| Direct FX   | `getRates()`, `exchange()`                                                                |
| Market FX   | `getBestOffers()`, `getBestOffersDetailed()`, `getActiveOrders()`, `getOrder()`, `submitOrder()`, `closeOrder()` |

## Error Handling

```typescript
import { WalutomatApiError, WalutomatHttpError } from 'walutomat-sdk';

try {
  await client.transfers.createIban({ ... });
} catch (err) {
  if (err instanceof WalutomatApiError) {
    // Business logic error (API returned success: false)
    console.error(err.code, err.message, err.errors);
  } else if (err instanceof WalutomatHttpError) {
    // HTTP-level error (429 rate limit, network failure, etc.)
    console.error(err.statusCode, err.responseBody);
  }
}
```

## Authentication

The Walutomat API uses two-layer auth:

1. **API Key** (`X-API-Key` header) — required for all requests
2. **RSA Signature** (`X-API-Signature` header) — required for sensitive operations (transfers, exchanges)

Generate a 4096-bit RSA key pair:

```bash
openssl genrsa -out private.key 4096
openssl rsa -in private.key -pubout -out public.key
```

Upload `public.key` in the Walutomat User Panel under "Additional services" > "API Key".

## License

MIT
