import base from './playwright.config';

export default {
  ...base,
  testMatch: 'flash-product-pipeline.spec.ts',
  fullyParallel: false,
  workers: 1,
  outputDir: process.env.FLASH_PRODUCT_BROWSER_OUTPUT ?? '/tmp/helpmath-flash-product-browser',
  use: {...base.use, channel: process.env.PLAYWRIGHT_CHANNEL ?? 'chrome'},
};
