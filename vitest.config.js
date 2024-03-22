import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: '.',
    include: ['./test/node/**/*.js', './custom/test/node/**/*.js'],
    testTimeout: 20000,
  },
});
