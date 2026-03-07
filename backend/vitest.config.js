import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // Set env vars before ANY module loads — env.js validates at import time
    env: {
      NODE_ENV:    'test',
      MONGODB_URI: 'mongodb://localhost:27017/pulse_test',
      JWT_SECRET:  'test-secret-must-be-at-least-32-characters!!',
      FRONTEND_URL: 'http://localhost:3000',
    },
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/services/**', 'src/lib/**'],
      exclude: ['src/lib/jwt.js'],
    },
  },
})
