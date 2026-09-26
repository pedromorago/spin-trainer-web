import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/domain/**/*.js'],
      exclude: ['src/**/__tests__/**'],
      thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 }
    }
  }
});
