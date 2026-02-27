import { getTimestamp, signRequest } from './auth.js';
import { WalutomatApiError, WalutomatHttpError } from './errors.js';
import type { ApiResponse, ApiResponseWithDuplicate } from './types/common.js';

const BASE_URL_PRODUCTION = 'https://api.walutomat.pl';
const BASE_URL_SANDBOX = 'https://api.walutomat.dev';
const API_PATH = '/api/v2.0.0';

export interface HttpClientOptions {
  apiKey: string;
  privateKey?: string;
  sandbox?: boolean;
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
}

type ParamValue = string | number | boolean | string[] | undefined;

export interface HttpClient {
  get<T>(opts: { endpoint: string; params?: Record<string, ParamValue>; signed?: boolean }): Promise<T>;
  post<T>(opts: { endpoint: string; body: Record<string, ParamValue>; signed?: boolean }): Promise<T>;
  postWithDuplicate<T>(opts: {
    endpoint: string;
    body: Record<string, ParamValue>;
    signed?: boolean;
  }): Promise<{ result: T; duplicate: boolean }>;
}

export function createHttpClient(options: HttpClientOptions): HttpClient {
  const { apiKey, privateKey } = options;
  const _fetch = options.fetch ?? globalThis.fetch;

  let baseUrl: string;
  if (options.baseUrl) {
    baseUrl = options.baseUrl.replace(/\/$/, '');
  } else {
    baseUrl = options.sandbox ? BASE_URL_SANDBOX : BASE_URL_PRODUCTION;
  }

  function buildHeaders(path: string, payload: string, signed: boolean): Record<string, string> {
    const headers: Record<string, string> = { 'X-API-Key': apiKey };

    if (signed && privateKey) {
      const timestamp = getTimestamp();
      headers['X-API-Timestamp'] = timestamp;
      headers['X-API-Signature'] = signRequest({
        timestamp,
        endpointPath: path,
        bodyOrQuery: payload,
        privateKey,
      });
    }

    return headers;
  }

  async function unwrap<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const text = await response.text();
      throw new WalutomatHttpError({ statusCode: response.status, responseBody: text });
    }

    const json = (await response.json()) as ApiResponse<T>;

    if (!json.success) {
      throw new WalutomatApiError({ errors: json.errors ?? [] });
    }

    return json.result;
  }

  return {
    async get<T>({
      endpoint,
      params,
      signed = true,
    }: {
      endpoint: string;
      params?: Record<string, ParamValue>;
      signed?: boolean;
    }): Promise<T> {
      const path = API_PATH + endpoint;
      const queryString = buildQueryString(params);
      const url = baseUrl + path + queryString;
      const headers = buildHeaders(path + queryString, '', signed);

      const response = await _fetch(url, { method: 'GET', headers });
      return unwrap<T>(response);
    },

    async post<T>({
      endpoint,
      body,
      signed = true,
    }: {
      endpoint: string;
      body: Record<string, ParamValue>;
      signed?: boolean;
    }): Promise<T> {
      const path = API_PATH + endpoint;
      const bodyString = buildFormBody(body);
      const url = baseUrl + path;
      const headers = buildHeaders(path, bodyString, signed);
      headers['Content-Type'] = 'application/x-www-form-urlencoded';

      const response = await _fetch(url, { method: 'POST', headers, body: bodyString });
      return unwrap<T>(response);
    },

    async postWithDuplicate<T>({
      endpoint,
      body,
      signed = true,
    }: {
      endpoint: string;
      body: Record<string, ParamValue>;
      signed?: boolean;
    }): Promise<{ result: T; duplicate: boolean }> {
      const path = API_PATH + endpoint;
      const bodyString = buildFormBody(body);
      const url = baseUrl + path;
      const headers = buildHeaders(path, bodyString, signed);
      headers['Content-Type'] = 'application/x-www-form-urlencoded';

      const response = await _fetch(url, { method: 'POST', headers, body: bodyString });

      if (!response.ok) {
        const text = await response.text();
        throw new WalutomatHttpError({ statusCode: response.status, responseBody: text });
      }

      const json = (await response.json()) as ApiResponseWithDuplicate<T>;

      if (!json.success) {
        throw new WalutomatApiError({ errors: json.errors ?? [] });
      }

      return { result: json.result, duplicate: json.duplicate };
    },
  };
}

function buildQueryString(params?: Record<string, ParamValue>): string {
  if (!params) return '';

  const parts: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;

    if (Array.isArray(value)) {
      if (value.length > 0) {
        parts.push(`${encodeURIComponent(key)}=${value.map(encodeURIComponent).join(',')}`);
      }
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }

  return parts.length > 0 ? '?' + parts.join('&') : '';
}

function buildFormBody(params: Record<string, ParamValue>): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;

    if (Array.isArray(value)) {
      if (value.length > 0) {
        parts.push(`${encodeURIComponent(key)}=${value.map(encodeURIComponent).join(',')}`);
      }
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }

  return parts.join('&');
}
