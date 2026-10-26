#!/usr/bin/env node

import {mkdir, writeFile} from 'node:fs/promises';

import {chromium} from 'playwright';

const base = process.env.HELP_MATH_G678_QA_BASE_URL ??
  'http://127.0.0.1:3318';
const output = 'output/playwright/g678-advanced16-final';
await mkdir(output, {recursive: true});

const browser = await chromium.launch({headless: true});
const page = await browser.newPage({viewport: {width: 1440, height: 1100}});
const evidence = {
  startedAt: new Date().toISOString(),
  consoleErrors: [],
  pageErrors: [],
  responses: [],
  geo: {},
  nms: {},
  dat: {},
  allLessons: {},
};
page.on('console', (message) => {
  if (message.type() === 'error') evidence.consoleErrors.push(message.text());
});
page.on('pageerror', (error) => evidence.pageErrors.push(String(error)));
page.on('response', (response) => {
  if (!response.url().includes('/flash-assets/g678-local/')) return;
  evidence.responses.push({
    url: response.url(),
    status: response.status(),
    corp: response.headers()['cross-origin-resource-policy'] ?? null,
  });
});

const shell = page.locator('.runtime-shell');
const stage = page.locator('.runtime-stage');
const frame = async () => Number(await stage.getAttribute('data-flash-frame'));
const checkpoint = async () => writeFile(
  `${output}/evidence.partial.json`,
  `${JSON.stringify(evidence, null, 2)}\n`,
  {flag: 'w'},
);

async function goto(animationId, timeout = 30_000) {
  await page.goto(
    `${base}/en/migration-status/g678-calibration/${animationId}`,
    {waitUntil: 'domcontentloaded', timeout},
  );
  await page.locator(`canvas[data-course-canvas="${animationId}"]`).first()
    .waitFor({state: 'attached', timeout});
  await page.waitForFunction((id) =>
    document.querySelector(`canvas[data-course-canvas="${id}"]`)
      ?.getAttribute('data-render-state') === 'ready', animationId, {timeout});
}

async function setRange(value) {
  await page.locator('#shared-geo001-l01-p001-seek')
    .evaluate((element, next) => {
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )?.set;
      setter?.call(element, String(next));
      element.dispatchEvent(new Event('input', {bubbles: true}));
    }, value);
}

async function waitForEnabledButton(prefix, timeout = 8_000) {
  await page.waitForFunction((label) =>
    [...document.querySelectorAll('button')].some((button) =>
      button.textContent?.trim().startsWith(label) && !button.disabled
    ), prefix, {timeout});
}

try {
  // GEO: the outer clock must stop at terminal seek, resume after a
  // nonterminal seek, and clear the terminal hold on product Replay.
  await goto('shared-geo001-l01-p001');
  await page.locator('#shared-geo001-l01-p001-seek')
    .waitFor({timeout: 15_000});
  await setRange(127);
  await page.waitForFunction(() =>
    document.querySelector('.runtime-shell')?.getAttribute(
      'data-runtime-host-seek-held') === 'true');
  const geoTerminal1 = await frame();
  await page.waitForTimeout(700);
  const geoTerminal2 = await frame();
  await setRange(64);
  await page.waitForFunction(() =>
    document.querySelector('.runtime-shell')?.getAttribute(
      'data-runtime-host-seek-held') === 'false');
  const geoResume1 = await frame();
  await page.waitForTimeout(700);
  const geoResume2 = await frame();
  await page.getByRole('button', {name: 'Replay', exact: true}).first().click();
  await page.waitForFunction(() => Number(
    document.querySelector('.runtime-stage')?.getAttribute('data-flash-frame'),
  ) < 20);
  evidence.geo = {
    terminalFrames: [geoTerminal1, geoTerminal2],
    resumedFrames: [geoResume1, geoResume2],
    replayFrame: await frame(),
    seekHeld: await shell.getAttribute('data-runtime-host-seek-held'),
  };
  await page.screenshot({path: `${output}/geo-seek-replay.png`, fullPage: true});
  await checkpoint();

  // NMS: verify a correct branch and the two-wrong-attempt source flow. The
  // wrong feedback domain must hold at frame 22 until explicit dismissal.
  await goto('shared-nms002-l11-p030');
  await page.waitForFunction(() =>
    document.querySelector('.runtime-stage')?.getAttribute(
      'data-flash-frame') === '97', {timeout: 20_000});
  await page.waitForFunction(() =>
    document.querySelector('.runtime-shell')?.getAttribute(
      'data-runtime-interactive-stop-held') === 'true');
  const nmsHeldBefore = await shell.getAttribute(
    'data-runtime-playback-complete');
  await page.getByRole('button', {name: 'Source answer option 1'}).click();
  await page.waitForFunction(() =>
    document.querySelector('[data-feedback-variant-status]')?.getAttribute(
      'data-feedback-variant-status') ===
        'source-host-selected-Mc_Right_Feed1');
  await page.screenshot({
    path: `${output}/nms-right-feedback.png`,
    fullPage: true,
  });
  await page.waitForFunction(() =>
    document.querySelector('.runtime-shell')?.getAttribute(
      'data-runtime-interactive-stop-resolved-count') === '1',
  {timeout: 8_000});
  await page.waitForFunction(() => Number(
    document.querySelector('.runtime-stage')?.getAttribute('data-flash-frame'),
  ) > 97, {timeout: 4_000});
  evidence.nms.correct = {
    heldPlaybackComplete: nmsHeldBefore,
    resolvedCount: await shell.getAttribute(
      'data-runtime-interactive-stop-resolved-count'),
    frame: await frame(),
    held: await shell.getAttribute('data-runtime-interactive-stop-held'),
  };

  await page.reload({waitUntil: 'domcontentloaded'});
  await page.waitForFunction(() =>
    document.querySelector('.runtime-stage')?.getAttribute(
      'data-flash-frame') === '97', {timeout: 20_000});
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    await waitForEnabledButton('AnsBtn2');
    await page.getByRole('button', {name: 'Source answer option 2'}).click();
    await page.waitForFunction(() =>
      document.querySelector('[data-feedback-variant-status]')?.getAttribute(
        'data-feedback-variant-status') ===
          'source-host-selected-Mc_Wrong_Feed1');
    await page.getByRole('button', {name: 'Continue feedback'})
      .waitFor({timeout: 6_000});
    evidence.nms[`wrongAttempt${attempt}`] = {
      pauseFrame: await page.locator('[data-feedback-frame]')
        .getAttribute('data-feedback-frame'),
    };
    await page.getByRole('button', {name: 'Continue feedback'}).click();
  }
  await page.waitForFunction(() =>
    document.querySelector('.runtime-shell')?.getAttribute(
      'data-runtime-interactive-stop-resolved-count') === '1',
  {timeout: 8_000});
  await page.waitForFunction(() => Number(
    document.querySelector('.runtime-stage')?.getAttribute('data-flash-frame'),
  ) > 97, {timeout: 4_000});
  evidence.nms.wrongFinal = {
    frame: await frame(),
    held: await shell.getAttribute('data-runtime-interactive-stop-held'),
  };
  await page.screenshot({
    path: `${output}/nms-two-wrong-resume.png`,
    fullPage: true,
  });
  await checkpoint();

  // DAT: every correct source/target pair must run a source feedback domain;
  // only the fifth completion may release frame 238 to frame 239.
  await goto('shared-dat001-l05-p040');
  await page.waitForFunction(() =>
    document.querySelector('.runtime-stage')?.getAttribute(
      'data-flash-frame') === '238', {timeout: 30_000});
  await page.waitForFunction(() =>
    document.querySelector('.runtime-shell')?.getAttribute(
      'data-runtime-interactive-stop-held') === 'true');
  for (let index = 1; index <= 5; index += 1) {
    await waitForEnabledButton(`Src_${index}`);
    await page.getByRole('button', {name: `Src_${index}`, exact: false}).click();
    await page.getByRole('button', {name: `Tar_${index}`, exact: true}).click();
    await page.waitForFunction(() =>
      document.querySelector('[data-feedback-variant-status]')?.getAttribute(
        'data-feedback-variant-status') ===
          'source-host-selected-Mc_Right_Feed1');
    if (index === 1) {
      await page.screenshot({
        path: `${output}/dat-right-feedback.png`,
        fullPage: true,
      });
    }
  }
  await page.waitForFunction(() =>
    document.querySelector('.runtime-shell')?.getAttribute(
      'data-runtime-interactive-stop-resolved-count') === '1',
  {timeout: 10_000});
  await page.waitForFunction(() => Number(
    document.querySelector('.runtime-stage')?.getAttribute('data-flash-frame'),
  ) > 238, {timeout: 4_000});
  const datResumedFrame = await frame();
  const datResumedPlaybackComplete = await shell.getAttribute(
    'data-runtime-playback-complete');
  await page.waitForFunction(() =>
    document.querySelector('.runtime-stage')?.getAttribute(
      'data-flash-frame') === '254', {timeout: 5_000});
  evidence.dat = {
    resolvedCount: await shell.getAttribute(
      'data-runtime-interactive-stop-resolved-count'),
    resumedFrame: datResumedFrame,
    resumedPlaybackComplete: datResumedPlaybackComplete,
    finalFrame: await frame(),
    held: await shell.getAttribute('data-runtime-interactive-stop-held'),
    finalPlaybackComplete: await shell.getAttribute(
      'data-runtime-playback-complete'),
  };
  await page.screenshot({
    path: `${output}/dat-five-drop-resume.png`,
    fullPage: true,
  });
  await checkpoint();

  // Product inventory remains metadata-only: 16 cards expose 1/N progress,
  // 28 expose 0/N, and no G6-G8 learner link is admitted.
  await page.goto(`${base}/en`, {waitUntil: 'domcontentloaded'});
  await page.waitForTimeout(1_000);
  await page.getByRole('navigation', {name: 'Learning workspace'})
    .getByRole('button', {name: /All lessons 73/u}).click();
  await page.locator('[data-workspace-screen="lessons"]')
    .waitFor({timeout: 10_000});
  await page.getByRole('group', {name: 'Filter by grade'})
    .getByRole('button').last().click();
  const cards = page.locator('[data-workspace-screen="lessons"] article');
  await cards.first().waitFor();
  const texts = await cards.locator('[data-lesson-card-copy] span')
    .allTextContents();
  evidence.allLessons = {
    cards: await cards.count(),
    oneOfN: texts.filter((text) => /^1\/\d+ pages registered$/u.test(text))
      .length,
    zeroOfN: texts.filter((text) => /^0\/\d+ pages registered$/u.test(text))
      .length,
    links: await page.locator('[data-workspace-screen="lessons"] a').count(),
  };
  await page.screenshot({
    path: `${output}/all-lessons-16-28.png`,
    fullPage: true,
  });

  evidence.finishedAt = new Date().toISOString();
  await writeFile(`${output}/evidence.json`,
    `${JSON.stringify(evidence, null, 2)}\n`, {flag: 'w'});
  process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
} finally {
  await browser.close();
}
