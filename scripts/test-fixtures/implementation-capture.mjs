export function testCaptureGeneratorProvenance(overrides = {}) {
  return {
    schemaVersion: 1,
    script: {
      path: "scripts/capture-animation-keyframes.mjs",
      sha256: "c".repeat(64),
      ...overrides.script,
    },
    playwright: {
      package: "@playwright/test",
      version: "1.61.1",
      packageJsonPath: "node_modules/@playwright/test/package.json",
      packageJsonSha256: "d".repeat(64),
      ...overrides.playwright,
    },
    browser: {
      type: "chromium",
      version: "Chromium fixture 1",
      ...overrides.browser,
    },
    ...Object.fromEntries(
      Object.entries(overrides).filter(([key]) => !["script", "playwright", "browser"].includes(key)),
    ),
  };
}
