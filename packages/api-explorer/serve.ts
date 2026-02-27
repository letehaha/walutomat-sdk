import { createSign } from "node:crypto";
import { readFileSync } from "node:fs";

const PORT = 3333;
const API_PATH = "/api/v2.0.0";
const WALUTOMAT_BASE = process.env.WALUTOMAT_BASE_URL ?? "https://api.walutomat.pl";

const apiKey = process.env.WALUTOMAT_API_KEY ?? "";
const privateKeyPath = process.env.WALUTOMAT_PRIVATE_KEY_PATH ?? "";
const privateKey = privateKeyPath ? readFileSync(privateKeyPath, "utf-8") : "";

if (!apiKey || !privateKey) {
  console.warn(
    "WARNING: WALUTOMAT_API_KEY or WALUTOMAT_PRIVATE_KEY_PATH not set.\n" +
      "The signing proxy won't work. Create a .env file — see .env.example.\n",
  );
}

const html = await Bun.file(new URL("index.html", import.meta.url)).text();
const spec = await Bun.file(new URL("openapi.json", import.meta.url)).text();

function getTimestamp(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function sign(timestamp: string, endpointPath: string, bodyOrQuery: string): string {
  const signer = createSign("SHA256");
  signer.update(timestamp + endpointPath + bodyOrQuery);
  return signer.sign(privateKey, "base64");
}

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type, x-api-key, x-api-signature, x-api-timestamp",
};

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // --- Static files ---
    if (url.pathname === "/openapi.json") {
      return new Response(spec, {
        headers: { "content-type": "application/json", ...CORS_HEADERS },
      });
    }

    // --- Signing proxy: /proxy/api/v2.0.0/... ---
    if (url.pathname.startsWith("/proxy" + API_PATH)) {
      if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
      }

      const endpoint = url.pathname.slice("/proxy".length); // e.g. /api/v2.0.0/account/balances
      const queryString = url.search; // includes leading "?"

      const headers: Record<string, string> = {
        "X-API-Key": apiKey,
      };

      let targetUrl: string;
      let body: string | undefined;

      if (req.method === "GET") {
        // Signature payload: timestamp + path+query + ""
        const sigPath = endpoint + queryString;
        const timestamp = getTimestamp();
        if (privateKey) {
          headers["X-API-Timestamp"] = timestamp;
          headers["X-API-Signature"] = sign(timestamp, sigPath, "");
        }
        targetUrl = WALUTOMAT_BASE + endpoint + queryString;
      } else {
        // POST — read form body
        body = await req.text();
        headers["Content-Type"] = "application/x-www-form-urlencoded";
        const timestamp = getTimestamp();
        if (privateKey) {
          headers["X-API-Timestamp"] = timestamp;
          headers["X-API-Signature"] = sign(timestamp, endpoint, body);
        }
        targetUrl = WALUTOMAT_BASE + endpoint;
      }

      const upstream = await fetch(targetUrl, {
        method: req.method,
        headers,
        body,
      });

      const responseBody = await upstream.text();
      return new Response(responseBody, {
        status: upstream.status,
        headers: {
          "content-type": upstream.headers.get("content-type") ?? "application/json",
          ...CORS_HEADERS,
        },
      });
    }

    // --- HTML fallback ---
    return new Response(html, {
      headers: { "content-type": "text/html" },
    });
  },
});

console.log(`API Explorer running at http://localhost:${PORT}`);
if (apiKey && privateKey) {
  console.log(`Signing proxy active at http://localhost:${PORT}/proxy${API_PATH}/...`);
} else {
  console.log("Signing proxy disabled (missing credentials)");
}
