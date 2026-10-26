#!/usr/bin/env node

import {mkdir, writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const base = process.env.HELP_MATH_G678_QA_BASE_URL ??
  'http://127.0.0.1:3318';
const animationId = 'shared-alg001-l06-p040';
const output = 'output/playwright/g678-pure-linear-calibration';
await mkdir(output, {recursive: true});

const browser = await chromium.launch({headless: true});
const page = await browser.newPage({viewport: {width: 1440, height: 1100}});
const evidence = {
  schemaVersion: 1,
  artifactType: 'g678-pure-linear-browser-calibration-v1',
  animationId,
  startedAt: new Date().toISOString(),
  consoleErrors: [],
  pageErrors: [],
  assetResponses: [],
};
page.on('console', (message) => {
  if (message.type() === 'error') evidence.consoleErrors.push(message.text());
});
page.on('pageerror', (error) => evidence.pageErrors.push(String(error)));
page.on('response', (response) => {
  if (!response.url().includes(`/flash-assets/g678-local/${animationId}/`)) {
    return;
  }
  evidence.assetResponses.push({
    url: response.url(),
    status: response.status(),
    corp: response.headers()['cross-origin-resource-policy'] ?? null,
  });
});

try {
  await page.goto(
    `${base}/en/migration-status/g678-calibration/${animationId}`,
    {waitUntil: 'domcontentloaded'},
  );
  await page.waitForFunction((id) =>
    document.querySelector(`canvas[data-course-canvas="${id}"]`)
      ?.getAttribute('data-render-state') === 'ready', animationId,
  {timeout: 30_000});
  const stage = page.locator('.runtime-stage');
  const shell = page.locator('.runtime-shell');
  const frame = async () => Number(await stage.getAttribute('data-flash-frame'));
  const replay = page.getByRole('button', {name: 'Replay', exact: true}).first();

  // Asset preparation can take longer than the first natural pass. Product
  // Replay gives the observed run an exact ready-at-frame-one starting point.
  await replay.click();
  await page.waitForFunction(() => Number(
    document.querySelector('.runtime-stage')?.getAttribute('data-flash-frame'),
  ) < 10);
  evidence.readyStart = {
    frame: await frame(),
    playbackComplete: await shell.getAttribute('data-runtime-playback-complete'),
    canvasState: await page.locator(`canvas[data-course-canvas="${animationId}"]`)
      .getAttribute('data-render-state'),
  };
  await page.waitForFunction(() => {
    const current = Number(document.querySelector('.runtime-stage')
      ?.getAttribute('data-flash-frame'));
    return current >= 80 && current < 189;
  }, {timeout: 15_000});
  evidence.midpoint = {
    frame: await frame(),
    playbackComplete: await shell.getAttribute('data-runtime-playback-complete'),
  };
  await page.screenshot({path: `${output}/midpoint.png`, fullPage: true});

  await page.waitForFunction(() =>
    document.querySelector('.runtime-stage')?.getAttribute(
      'data-flash-frame') === '189', {timeout: 15_000});
  await page.waitForFunction(() =>
    document.querySelector('.runtime-shell')?.getAttribute(
      'data-runtime-playback-complete') === 'true');
  evidence.naturalEnd = {
    frame: await frame(),
    playbackComplete: await shell.getAttribute('data-runtime-playback-complete'),
  };
  await page.screenshot({path: `${output}/natural-end.png`, fullPage: true});

  await replay.click();
  await page.waitForFunction(() => Number(
    document.querySelector('.runtime-stage')?.getAttribute('data-flash-frame'),
  ) < 10);
  const replayStart = await frame();
  await page.waitForTimeout(700);
  evidence.replay = {
    startFrame: replayStart,
    progressedFrame: await frame(),
    playbackComplete: await shell.getAttribute('data-runtime-playback-complete'),
  };
  evidence.audioBoundary = {
    productAudioEnabled: await shell.getAttribute('data-product-audio-enabled'),
    audioAvailable: await shell.getAttribute('data-audio-available'),
    audioAccepted: false,
  };
  evidence.finishedAt = new Date().toISOString();
  await writeFile(`${output}/evidence.json`,
    `${JSON.stringify(evidence, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
} finally {
  await browser.close();
}
