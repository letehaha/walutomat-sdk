import { vi } from 'vitest';
import type { HttpClient } from './http-client.js';

export function createMockHttp() {
  return {
    get: vi.fn().mockResolvedValue(undefined),
    post: vi.fn().mockResolvedValue(undefined),
    postWithDuplicate: vi.fn().mockResolvedValue({ result: undefined, duplicate: false }),
  } satisfies { [K in keyof HttpClient]: ReturnType<typeof vi.fn> };
}
