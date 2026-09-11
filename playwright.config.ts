import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 3000);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;

/**
 * End-to-end configuration.
 *
 * Runs against a real server with a real database — these tests are the check
 * that the storefront works, not that a mock returns what it was told to.
 *
 * Set PLAYWRIGHT_BASE_URL to point at an already-running instance; otherwise
 * the dev server is started for the run.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  // A real database sits behind every page; give assertions room under load.
  expect: { timeout: 10_000 },
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  // Every page hits a real database; a high worker count only adds contention.
  workers: 2,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // CI images often ship their own Chromium. Point at it rather than
    // downloading a second copy.
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH,
          args: ['--no-sandbox', '--disable-dev-shm-usage'],
        }
      : undefined,
  },

  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      // A phone-sized Chromium rather than a WebKit device profile: what these
      // tests check is the responsive layout and touch behaviour, and this runs
      // on any image that has Chromium without a second browser download.
      name: 'mobile',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      },
    },
  ],

  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
