// config of the browser tests (npm run e2e / xx e2e): e2e/*.spec.ts run against the real demo pages
// (index.html, demo/react/index.html) and pages from e2e/fixtures/, served as static files exactly like on github pages.
// One time setup of the browser: npx playwright install chromium
import { defineConfig, devices } from "@playwright/test";

const PORT = 4287;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "list" : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // generated files (vanilla-tabs.js, vanilla-tabs.esm.js, demo/react/main.js) are not in git
    command: `/bin/bash transpile.sh && python3 -m http.server ${PORT} 2> /dev/null`,
    url: `http://localhost:${PORT}/index.html`,
    reuseExistingServer: false,
    stdout: "ignore",
    stderr: "pipe",
  },
});
