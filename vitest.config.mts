import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    projects: [
      {
        extends: true,
        test: { name: 'unit', environment: 'node', include: ['tests/unit/**/*.test.ts'] },
      },
      {
        extends: true,
        test: {
          name: 'int',
          environment: 'node',
          include: ['tests/int/**/*.test.ts'],
          // Integration tests share one isolated database; run files one at a time.
          fileParallelism: false,
          testTimeout: 60_000,
          hookTimeout: 180_000,
          setupFiles: ['tests/int/setup-env.ts'],
        },
      },
    ],
  },
})
