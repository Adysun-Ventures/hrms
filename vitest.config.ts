import { configDefaults, defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // Statement tests use the Node.js native test runner (`node --test`).
      exclude: [...configDefaults.exclude, 'src/statements/**'],
    },
  }),
);
