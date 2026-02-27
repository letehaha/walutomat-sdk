import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => ({
  test: {
    include: ['src/__integration__/**/*.test.ts'],
    testTimeout: 15_000,
    env: loadEnv(mode, process.cwd(), ''),
  },
}));
