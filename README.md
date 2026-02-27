# Walutomat SDK

Unofficial SDK clients for the [Walutomat API v2.0.0](https://api.walutomat.pl/v2.0.0/).

Walutomat is a Polish peer-to-peer currency exchange platform operated by Currency One. This SDK provides typed clients for their REST API, covering wallet management, transfers, direct FX, and the P2P market order book.

## Packages

| Package                                          | Description                                |
| ------------------------------------------------ | ------------------------------------------ |
| [`packages/typescript`](packages/typescript)     | TypeScript client library                  |
| [`packages/api-explorer`](packages/api-explorer) | Interactive API docs (OpenAPI + Scalar UI) |

## Prerequisites

- A Walutomat account with API access enabled
- An RSA 4096-bit key pair (for signed endpoints)

### Generate RSA keys

```bash
openssl genrsa -out private.key 4096
openssl rsa -in private.key -pubout -out public.key
```

Upload `public.key` in the Walutomat User Panel under **Additional services > API Key**. Keep `private.key` safe — the SDK uses it to sign requests.

## TypeScript SDK

Zero dependencies. Uses native `fetch` and `node:crypto`.

### Install

```bash
cd packages/typescript
bun install
```

### Usage

```typescript
import { createClient } from "walutomat-sdk";
import { readFileSync } from "node:fs";

const client = createClient({
  apiKey: "your-api-key",
  privateKey: readFileSync("./private.key", "utf-8"),
  // sandbox: true,  // use api.walutomat.dev
});

// Wallet balances
const balances = await client.account.getBalances();

// Exchange rates + execute a direct exchange
const rate = await client.directFx.getRates({ currencyPair: "EURPLN" });
const { result } = await client.directFx.exchange({
  submitId: crypto.randomUUID(),
  currencyPair: "EURPLN",
  buySell: "BUY",
  volume: "100.00",
  volumeCurrency: "EUR",
  ts: rate.ts,
});

// P2P market order book (no auth required)
const offers = await client.marketFx.getBestOffers({ currencyPair: "EURPLN" });

// Auto-paginate through operation history
for await (const item of client.account.getHistoryIterator()) {
  console.log(item.operationAmount, item.currency);
}
```

### Tree-shakeable imports

For smaller bundles, import individual endpoint functions instead of the full client:

```typescript
import { createHttpClient } from "walutomat-sdk";
import { getBalances } from "walutomat-sdk/account";
import { getBestOffers } from "walutomat-sdk/market-fx";

const http = createHttpClient({ apiKey: "...", privateKey: "..." });
const balances = await getBalances(http);
```

### API coverage

| Group         | Endpoints                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Account**   | `getBalances`, `getHistory`, `getHistoryIterator`, `getHistoryMt940`                                               |
| **Transfers** | `getTransferStatus`, `createInternalTransfer`, `createIbanTransfer`, `createSepaTransfer`, `createNonIbanTransfer` |
| **Direct FX** | `getRates`, `createExchange`                                                                                       |
| **Market FX** | `getBestOffers`, `getBestOffersDetailed`, `getActiveOrders`, `getOrder`, `submitOrder`, `closeOrder`               |

### Error handling

```typescript
import { WalutomatApiError, WalutomatHttpError } from "walutomat-sdk/errors";

try {
  await client.transfers.createIban({
    /* ... */
  });
} catch (err) {
  if (err instanceof WalutomatApiError) {
    // API returned success: false
    console.error(err.errors);
  } else if (err instanceof WalutomatHttpError) {
    // HTTP error (429, 500, network failure, etc.)
    console.error(err.statusCode, err.responseBody);
  }
}
```

### Testing

```bash
cd packages/typescript

# Unit tests
bun run test

# Integration tests (requires .env with credentials)
bun run test:integration
```

## API Explorer

Interactive API documentation powered by [Scalar](https://scalar.com/) with a local signing proxy that lets you try all 16 endpoints directly from the browser.

### Setup

```bash
cd packages/api-explorer

# Create .env with your credentials
cp .env.example .env
# Edit .env — set WALUTOMAT_API_KEY and WALUTOMAT_PRIVATE_KEY_PATH

bun start
# Open http://localhost:3333
```

The signing proxy runs on `localhost:3333` and handles RSA signature computation, so Scalar's "Try it" feature works for every endpoint — including authenticated ones that require `X-API-Signature`.

### How the proxy works

Scalar sends requests to `http://localhost:3333/proxy/api/v2.0.0/...`. The proxy:

1. Reads your API key and private key from `.env`
2. Computes `X-API-Timestamp` and `X-API-Signature` headers
3. Forwards the signed request to the real Walutomat API
4. Returns the response with CORS headers

### Keeping the spec in sync

The OpenAPI spec (`packages/api-explorer/openapi.json`) is covered by a drift-detection test in the TypeScript package. Running `bun run test` checks that:

- Every endpoint path + HTTP method in the source code has a matching entry in the spec
- Response schema field names match the TypeScript interfaces
- Enum values match the TypeScript union types

If you add or change an endpoint in the SDK, the test will fail until you update the spec.

## Authentication details

The Walutomat API uses two-layer auth on all endpoints (except `GET /market_fx/best_offers`):

1. **`X-API-Key`** — your API key
2. **`X-API-Signature`** + **`X-API-Timestamp`** — RSA SHA-256 signature of `timestamp + endpointPath + bodyOrQuery`

Both the signature and timestamp must always be provided together. The SDK handles this automatically when you provide a `privateKey`.

## License

[MIT](LICENSE)
