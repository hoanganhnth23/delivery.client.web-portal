import { defineConfig, devices } from '@playwright/test';

const webPort = Number(process.env.E2E_WEB_PORT ?? 5173);
const webURL = `http://127.0.0.1:${webPort}`;
const isLive = process.env.E2E_LIVE === 'true';
// Specs that need a real backend; mocked projects never run them.
const liveSpecs = ['**/live-smoke.spec.ts', '**/live-order-journey.spec.ts'];

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Running a long E2E matrix concurrently is needlessly heavy on local
  // runners and can make browsers exit or time out mid-suite. Keep the fast
  // single-engine default, but use the same conservative concurrency as CI
  // for coverage and explicit cross-browser jobs.
  workers: process.env.CI || process.env.E2E_ALL_BROWSERS === 'true' || process.env.E2E_COVERAGE === 'true' ? 2 : undefined,
  reporter: [
    ['line'],
    ['json', { outputFile: process.env.E2E_JSON_REPORT ?? 'test-results/e2e.json' }],
    ['html', { outputFolder: process.env.E2E_HTML_REPORT ?? 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? webURL,
    trace: isLive ? 'off' : 'retain-on-failure',
    screenshot: isLive ? 'off' : 'only-on-failure',
    video: isLive ? 'off' : 'retain-on-failure',
    locale: 'vi-VN',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: liveSpecs },
    ...(process.env.E2E_ALL_BROWSERS === 'true'
      ? [
        { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testIgnore: liveSpecs },
        { name: 'webkit', use: { ...devices['Desktop Safari'] }, testIgnore: liveSpecs },
      ]
      : []),
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] }, grep: /@mobile/, testIgnore: liveSpecs },
    ...(isLive
      ? [{ name: 'live-chromium', use: { ...devices['Desktop Chrome'] }, testMatch: liveSpecs }]
      : []),
  ],
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${webPort}`,
    url: webURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
