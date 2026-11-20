import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: { browserName: 'chromium', channel: 'chromium', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'root-desktop', use: { baseURL: 'http://127.0.0.1:4173/', viewport: { width: 1440, height: 900 } } },
    { name: 'nested-desktop', use: { baseURL: 'http://127.0.0.1:4173/demo-repo/', viewport: { width: 1280, height: 800 } } },
    { name: 'mobile', use: { baseURL: 'http://127.0.0.1:4173/', viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' } },
  ],
  webServer: { command: 'npm run build && node scripts/serve-dist.mjs', url: 'http://127.0.0.1:4173/', reuseExistingServer: !process.env.CI },
});
