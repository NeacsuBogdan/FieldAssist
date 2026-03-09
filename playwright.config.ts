import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  globalSetup: "./tests/e2e/global-setup.ts",
  outputDir: "test-results",
  reporter: [["list"], ["html", { open: "never" }]],
  testDir: "./tests/e2e",
  testMatch: "*.spec.ts",
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "pnpm --filter @fieldassist/api dev",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      url: "http://localhost:4000/api/v1/health",
    },
    {
      command: "pnpm --filter @fieldassist/web dev -- --host 127.0.0.1 --port 5173",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      url: "http://localhost:5173/login",
    },
  ],
  workers: 1,
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
});
