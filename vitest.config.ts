// config of the tests (npm test): test/*.test.ts(x) run in jsdom, see test/react.test.tsx
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["test/**/*.test.{ts,tsx}"],
  },
});
