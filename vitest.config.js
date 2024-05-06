import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: '.',
    include: ['./test/**/*.js', './custom/test/**/*.js'],
    testTimeout: 20000,
  },
});
