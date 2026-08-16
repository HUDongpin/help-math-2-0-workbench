import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

import {expect, test, type Locator, type Page} from '@playwright/test';

/**
 * Product-runtime reachability only.
 *
 * These checks prove that the current JavaScript host can address exact local
 * assets and clean up its own Audio elements. They do not establish original-
 * runtime listening, spoken-language correctness, synchronization, human or
 * Owner acceptance, strict completion, release, or publication.
 */

type SourceScopeMember = Readonly<{
  animationId: string;
  ordinal: number;
  role: string;
}>;

type AudioAsset = Readonly<{
  bytes: number;
  path: string;
  sha256: string;
  state: string;
}>;

type FinalQuizAsset = Readonly<{
  id: string;
  publicPath: string;
}>;

type AudioCandidateReport = Readonly<{
  finalQuiz: Readonly<{assets: readonly FinalQuizAsset[]}>;
  normalCandidates: readonly Readonly<{
    animationId: string;
    embedded: Readonly<{publicPath: string}>;
    spanish: Readonly<{publicPath: string}>;
  }>[];
  stagedAssets: readonly AudioAsset[];
  summary: Readonly<{
    fqMissingPathCount: number;
    fqPresentPathCount: number;
    pageCount: number;
    runtimeAudioCandidatePageCount: number;
    stagedAssetBytes: number;
    stagedAssetCount: number;
  }>;
}>;

type SourceScopeReport = Readonly<{
  members: readonly SourceScopeMember[];
}>;

type AudioHarnessRecord = Readonly<{
  currentTime: number;
  endedCount: number;
  id: number;
  pauseCount: number;
  paused: boolean;
  playCount: number;
  src: string;
  volume: number;
}>;

const PLAYER = [
  '[data-lesson-player="descriptor-driven-whole-lesson-audit"]',
  '[data-hydrated="true"]',
].join('');
const ROOT = 'main.lesson-shell2';
const RUNTIME = '.runtime-shell';
const FQ1 = 'course-g05-l04-fq-001';
const FQ2 = 'course-g05-l04-fq-002';
const FQ3 = 'course-g05-l04-fq-003';
const SERVER_AUDIO_PREFIX = 'apps/web/server-assets';

const audioReport = JSON.parse(readFileSync(fileURLToPath(new URL(
  '../../../reports/g5-l4-current-js-audio-candidates.json',
  import.meta.url,
)), 'utf8')) as AudioCandidateReport;
const sourceScope = JSON.parse(readFileSync(fileURLToPath(new URL(
  '../../../reports/g5-l4-source-scope-freeze.json',
  import.meta.url,
)), 'utf8')) as SourceScopeReport;

const lessonPages = Object.freeze(
  sourceScope.members
    .filter((member) => member.role === 'lesson-page')
    .toSorted((left, right) => left.ordinal - right.ordinal),
);
const exactFqAssetIds = new Set(
  audioReport.finalQuiz.assets.map((asset) => asset.id),
);

function publicAudioPath(asset: AudioAsset) {
  if (!asset.path.startsWith(`${SERVER_AUDIO_PREFIX}/`)) {
    throw new Error(
      `G5 L4 audio escaped the route-served server root: ${asset.path}`,
    );
  }
  return `${asset.path.slice(SERVER_AUDIO_PREFIX.length)}?sha256=${asset.sha256}`;
}

function collectLocal404s(page: Page, baseURL: string) {
  const origin = new URL(baseURL).origin;
  const failures: string[] = [];
  page.on('response', (response) => {
    const url = new URL(response.url());
    if (url.origin === origin && response.status() === 404) {
      failures.push(`${response.request().method()} ${url.pathname}${url.search}`);
    }
  });
  return failures;
}

async function installDeterministicAudioHarness(page: Page) {
  await page.addInitScript(() => {
    const records: Array<{
      audio: EventTarget & {
        currentTime: number;
        paused: boolean;
        pause: () => void;
        volume: number;
      };
      currentTime: number;
      endedCount: number;
      id: number;
      pauseCount: number;
      paused: boolean;
      playCount: number;
      src: string;
      volume: number;
    }> = [];
    let nextId = 1;
    let deferNextPlay = false;
    const deferredPlays = new Map<number, {
      reject: (reason?: unknown) => void;
      resolve: () => void;
    }>();

    class DeterministicAudio extends EventTarget {
      currentTime = 0;
      paused = true;
      volume = 1;
      readonly record: (typeof records)[number];

      constructor(readonly src: string) {
        super();
        this.record = {
          audio: this,
          currentTime: 0,
          endedCount: 0,
          id: nextId,
          pauseCount: 0,
          paused: true,
          playCount: 0,
          src,
          volume: 1,
        };
        nextId += 1;
        records.push(this.record);
      }

      pause() {
        this.paused = true;
        this.record.pauseCount += 1;
        this.sync();
      }

      play() {
        this.paused = false;
        this.record.playCount += 1;
        this.sync();
        if (deferNextPlay) {
          deferNextPlay = false;
          return new Promise<void>((resolve, reject) => {
            deferredPlays.set(this.record.id, {reject, resolve});
          });
        }
        return Promise.resolve();
      }

      sync() {
        this.record.currentTime = this.currentTime;
        this.record.paused = this.paused;
        this.record.volume = this.volume;
      }
    }

    const snapshot = () => records.map((record) => {
      const audio = record.audio;
      record.currentTime = audio.currentTime;
      record.paused = audio.paused;
      record.volume = audio.volume;
      return {
        currentTime: record.currentTime,
        endedCount: record.endedCount,
        id: record.id,
        pauseCount: record.pauseCount,
        paused: record.paused,
        playCount: record.playCount,
        src: record.src,
        volume: record.volume,
      };
    });

    Object.defineProperty(window, 'Audio', {
      configurable: true,
      value: DeterministicAudio,
      writable: true,
    });
    Object.defineProperty(window, '__g5L4AudioHarness', {
      configurable: false,
      value: {
        deferNextPlay() {
          deferNextPlay = true;
        },
        end(id: number) {
          const record = records.find((candidate) => candidate.id === id);
          if (!record) throw new Error(`No deterministic Audio instance ${id}`);
          record.endedCount += 1;
          record.audio.paused = true;
          record.audio.dispatchEvent(new Event('ended'));
        },
        endLast() {
          const record = records.at(-1);
          if (!record) throw new Error('No deterministic Audio instance exists');
          record.endedCount += 1;
          record.audio.paused = true;
          record.audio.dispatchEvent(new Event('ended'));
        },
        rejectLastDeferredNotAllowed() {
          const pending = [...deferredPlays.entries()].at(-1);
          if (!pending) throw new Error('No deferred Audio play exists');
          const [id, deferred] = pending;
          deferredPlays.delete(id);
          deferred.reject(new DOMException('Autoplay blocked', 'NotAllowedError'));
        },
        snapshot,
      },
      writable: false,
    });

    window.localStorage.clear();
    window.sessionStorage.clear();
  });
}

async function audioHarnessSnapshot(page: Page) {
  return page.evaluate(() => (
    window as typeof window & {
      __g5L4AudioHarness: {snapshot: () => AudioHarnessRecord[]};
    }
  ).__g5L4AudioHarness.snapshot());
}

async function endLastAudioNaturally(page: Page) {
  await page.evaluate(() => (
    window as typeof window & {
      __g5L4AudioHarness: {endLast: () => void};
    }
  ).__g5L4AudioHarness.endLast());
}

async function endAudioById(page: Page, id: number) {
  await page.evaluate((audioId) => (
    window as typeof window & {
      __g5L4AudioHarness: {end: (id: number) => void};
    }
  ).__g5L4AudioHarness.end(audioId), id);
}

async function deferNextAudioPlay(page: Page) {
  await page.evaluate(() => (
    window as typeof window & {
      __g5L4AudioHarness: {deferNextPlay: () => void};
    }
  ).__g5L4AudioHarness.deferNextPlay());
}

async function rejectLastDeferredAudioNotAllowed(page: Page) {
  await page.evaluate(() => (
    window as typeof window & {
      __g5L4AudioHarness: {rejectLastDeferredNotAllowed: () => void};
    }
  ).__g5L4AudioHarness.rejectLastDeferredNotAllowed());
}

async function openLesson(
  page: Page,
  path = '/courses/5/4?mode=focus',
) {
  const response = await page.goto(path, {waitUntil: 'domcontentloaded'});
  expect(response?.status()).toBe(200);
  await expect(page.locator(PLAYER)).toBeVisible();
  await expect(page.locator(ROOT)).toHaveAttribute('data-current-js-pages', '54');
  await expect(page.locator(ROOT)).toHaveAttribute(
    'data-release-id',
    'lesson-g05-l04-number-lines',
  );
}

async function selectPageFromMap(page: Page, animationId: string) {
  const root = page.locator(ROOT);
  if (await root.getAttribute('data-map-open') !== 'true') {
    await page.locator('[data-course-map-trigger]:visible').click();
    await expect(root).toHaveAttribute('data-map-open', 'true');
  }
  await page.locator(
    `.lesson-shell2__side-panel--map button[data-animation-id="${animationId}"]`,
  ).click();
  await expect(page.locator(PLAYER)).toHaveAttribute(
    'data-current-animation-id',
    animationId,
  );
}

async function liveControl(page: Page, key: string) {
  const presentation = await page.locator(ROOT).getAttribute(
    'data-modern-control-presentation',
  );
  const surface = presentation === 'true' ? 'modern-wide' : 'legacy';
  return page.locator(
    `[data-responsive-focus-surface="${surface}"] `
    + `[data-responsive-focus-key="${key}"]`,
  );
}

async function expectFqAudioButtonsFollowExactAssets(form: Locator) {
  const buttons = form.locator('button[data-interactive-audio-status]');
  const available = form.locator(
    'button[data-interactive-audio-status="available"]',
  );
  const missing = form.locator(
    'button[data-interactive-audio-status="missing"]',
  );
  await expect(buttons).toHaveCount(5);
  expect(await available.count()).toBeGreaterThan(0);
  expect(await missing.count()).toBeGreaterThan(0);

  for (let index = 0; index < await available.count(); index += 1) {
    const button = available.nth(index);
    const assetId = await button.getAttribute('data-interactive-audio-asset-id');
    expect(assetId).not.toBeNull();
    expect(exactFqAssetIds.has(assetId!)).toBe(true);
    await expect(button).toBeEnabled();
  }
  for (let index = 0; index < await missing.count(); index += 1) {
    const button = missing.nth(index);
    await expect(button).toBeDisabled();
    await expect(button).not.toHaveAttribute('data-interactive-audio-asset-id');
  }
}

test.beforeEach(async ({page}) => {
  await installDeterministicAudioHarness(page);
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const local = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
    if (!local) {
      await route.abort('blockedbyclient');
      return;
    }
    if (url.pathname === '/api/learning-events') {
      await route.fulfill({status: 204});
      return;
    }
    // Production-only Vercel analytics never participates in this local audio
    // contract. If an injected development environment requests it anyway,
    // keep that known tool noise outside the lesson's zero-404 denominator.
    if (url.pathname.startsWith('/_vercel/insights/')) {
      await route.fulfill({status: 204});
      return;
    }
    await route.continue();
  });
});

test('all 54 page animations remain reachable while product audio reports 53/54', async ({
  baseURL,
  page,
}) => {
  test.setTimeout(180_000);
  expect(lessonPages).toHaveLength(54);
  expect(audioReport.summary.pageCount).toBe(54);
  expect(audioReport.summary.runtimeAudioCandidatePageCount).toBe(53);
  const local404s = collectLocal404s(page, baseURL!);
  await page.setViewportSize({height: 720, width: 1280});
  await openLesson(page);

  let audioAvailableCount = 0;
  const observed = new Set<string>();
  for (let index = 0; index < lessonPages.length; index += 1) {
    const member = lessonPages[index]!;
    if (index > 0) {
      await (await liveControl(page, 'next')).click();
    }
    await expect(page.locator(PLAYER)).toHaveAttribute(
      'data-current-animation-id',
      member.animationId,
    );
    await expect(page.locator(
      `.runtime-stage[data-animation-id="${member.animationId}"]`,
    )).toBeVisible({timeout: 15_000});
    const expectedAudio = member.animationId === FQ1 ? 'false' : 'true';
    await expect(page.locator(RUNTIME)).toHaveAttribute(
      'data-audio-available',
      expectedAudio,
    );
    await expect(page.locator(ROOT)).toHaveAttribute(
      'data-audio-available',
      expectedAudio,
    );
    if (expectedAudio === 'true') audioAvailableCount += 1;
    observed.add(member.animationId);
  }

  expect(observed.size).toBe(54);
  expect(audioAvailableCount).toBe(53);
  await page.waitForLoadState('networkidle');
  expect(local404s).toEqual([]);
});

test('all 185 exact MP3 candidates answer hash-bound same-origin range requests', async ({
  baseURL,
  request,
}) => {
  test.setTimeout(120_000);
  expect(audioReport.stagedAssets).toHaveLength(185);
  expect(audioReport.summary.stagedAssetCount).toBe(185);
  expect(audioReport.summary.fqPresentPathCount).toBe(83);
  expect(audioReport.summary.fqMissingPathCount).toBe(97);
  expect(
    audioReport.stagedAssets.reduce((total, asset) => total + asset.bytes, 0),
  ).toBe(audioReport.summary.stagedAssetBytes);
  const origin = new URL(baseURL!).origin;

  for (let offset = 0; offset < audioReport.stagedAssets.length; offset += 8) {
    const batch = audioReport.stagedAssets.slice(offset, offset + 8);
    await Promise.all(batch.map(async (asset) => {
      expect(asset.state).toBe('source-exact');
      const path = publicAudioPath(asset);
      const url = new URL(path, baseURL!);
      expect(url.origin).toBe(origin);
      expect(url.searchParams.getAll('sha256')).toEqual([asset.sha256]);

      const ranged = await request.get(path, {
        headers: {Range: 'bytes=0-31'},
      });
      expect(ranged.status(), path).toBe(206);
      expect(ranged.headers()['content-type'], path).toContain('audio/mpeg');
      expect(ranged.headers()['cache-control'], path)
        .toBe('private, no-store, max-age=0');
      expect(ranged.headers()['accept-ranges'], path).toBe('bytes');
      expect(ranged.headers()['content-length'], path).toBe('32');
      expect(ranged.headers()['x-content-type-options'], path).toBe('nosniff');
      expect(new URL(ranged.url()).origin, path).toBe(origin);

      const full = await request.get(path);
      expect(full.status(), path).toBe(200);
      expect(full.headers()['cache-control'], path)
        .toBe('private, no-store, max-age=0');
      expect(full.headers()['accept-ranges'], path).toBe('bytes');
      expect(full.headers()['content-length'], path).toBe(String(asset.bytes));
      const bytes = await full.body();
      expect(bytes.byteLength, path).toBe(asset.bytes);
      expect(createHash('sha256').update(bytes).digest('hex'), path)
        .toBe(asset.sha256);
      expect(ranged.headers()['content-range'], path).toMatch(
        new RegExp(`^bytes 0-31/${asset.bytes}$`, 'u'),
      );
    }));
  }
});

test('gate-on direct FQ route plays and stops exact interactive audio', async ({
  baseURL,
  page,
}) => {
  test.skip(
    process.env.CURRENT_JS_SHOWCASE_G5_L4_ENABLED !== 'true' ||
      process.env.CURRENT_JS_SHOWCASE_G5_L4_AUDIO_ENABLED !== 'true',
    'Requires both explicit G5 L4 showcase gates.',
  );
  const local404s = collectLocal404s(page, baseURL!);
  const response = await page.goto(`/en/animations/${FQ2}`, {
    waitUntil: 'domcontentloaded',
  });
  expect(response?.status()).toBe(200);

  const runtime = page.locator(RUNTIME);
  await expect(runtime).toHaveAttribute('data-product-audio-enabled', 'true');
  await expect(runtime).toHaveAttribute('data-audio-available', 'true');
  const form = page.locator(
    '[data-current-javascript-question-controls="true"]:visible',
  );
  await expect(form).toBeVisible();
  await expectFqAudioButtonsFollowExactAssets(form);

  const playable = form.locator(
    'button[data-interactive-audio-status="available"]',
  ).first();
  const assetId = await playable.getAttribute('data-interactive-audio-asset-id');
  const exactAsset = audioReport.finalQuiz.assets.find(
    (asset) => asset.id === assetId,
  );
  expect(exactAsset).toBeDefined();

  await playable.click();
  await expect(runtime).toHaveAttribute(
    'data-interactive-audio-playing',
    assetId!,
  );
  let records = await audioHarnessSnapshot(page);
  expect(records.at(-1)).toMatchObject({
    paused: false,
    playCount: 1,
    src: exactAsset!.publicPath,
  });

  await playable.click();
  await expect(runtime).not.toHaveAttribute('data-interactive-audio-playing');
  await expect(playable).toHaveAttribute('aria-pressed', 'false');
  records = await audioHarnessSnapshot(page);
  expect(records.at(-1)).toMatchObject({
    currentTime: 0,
    pauseCount: 1,
    paused: true,
  });

  await page.waitForLoadState('networkidle');
  expect(local404s).toEqual([]);
});

test('gate-off direct FQ route exposes unavailable disabled audio only', async ({
  baseURL,
  page,
}) => {
  test.skip(
    process.env.CURRENT_JS_SHOWCASE_G5_L4_ENABLED !== 'true' ||
      process.env.CURRENT_JS_SHOWCASE_G5_L4_AUDIO_ENABLED === 'true',
    'Requires the animation gate on and independent audio gate off.',
  );
  const local404s = collectLocal404s(page, baseURL!);
  const response = await page.goto(`/en/animations/${FQ2}`, {
    waitUntil: 'domcontentloaded',
  });
  expect(response?.status()).toBe(200);

  const runtime = page.locator(RUNTIME);
  await expect(runtime).toHaveAttribute('data-product-audio-enabled', 'false');
  await expect(runtime).toHaveAttribute('data-audio-available', 'false');
  const form = page.locator(
    '[data-current-javascript-question-controls="true"]:visible',
  );
  await expect(form).toBeVisible();
  const buttons = form.locator('button[data-interactive-audio-status]');
  await expect(buttons).toHaveCount(5);
  await expect(
    form.locator('button[data-interactive-audio-status="missing"]'),
  ).toHaveCount(5);
  for (let index = 0; index < await buttons.count(); index += 1) {
    const button = buttons.nth(index);
    await expect(button).toBeDisabled();
    await expect(button).not.toHaveAttribute('data-interactive-audio-asset-id');
  }
  expect(await audioHarnessSnapshot(page)).toEqual([]);

  await page.waitForLoadState('networkidle');
  expect(local404s).toEqual([]);
});

test('FQ2 and FQ3 expose only exact speakers and clean up play, end, stop, and page change', async ({
  baseURL,
  page,
}) => {
  const local404s = collectLocal404s(page, baseURL!);
  await page.setViewportSize({height: 720, width: 1280});
  await openLesson(page);

  for (const animationId of [FQ2, FQ3]) {
    await selectPageFromMap(page, animationId);
    const form = page.locator(
      '[data-current-javascript-question-controls="true"]:visible',
    );
    await expect(form).toBeVisible();
    await expectFqAudioButtonsFollowExactAssets(form);
  }

  const form = page.locator(
    '[data-current-javascript-question-controls="true"]:visible',
  );
  const playable = form.locator(
    'button[data-interactive-audio-status="available"]',
  ).first();
  const assetId = await playable.getAttribute('data-interactive-audio-asset-id');
  const exactAsset = audioReport.finalQuiz.assets.find(
    (asset) => asset.id === assetId,
  );
  expect(exactAsset).toBeDefined();

  await playable.click();
  await expect(page.locator(RUNTIME)).toHaveAttribute(
    'data-interactive-audio-playing',
    assetId!,
  );
  let records = await audioHarnessSnapshot(page);
  expect(records.at(-1)).toMatchObject({
    paused: false,
    playCount: 1,
    src: exactAsset!.publicPath,
  });

  const pause = await liveControl(page, 'pause');
  await pause.click();
  await expect(page.locator(RUNTIME)).toHaveAttribute('data-runtime-paused', 'true');
  await expect(page.locator(RUNTIME)).not.toHaveAttribute(
    'data-interactive-audio-playing',
  );
  await expect(playable).toHaveAttribute('aria-pressed', 'false');
  await expect(playable).toBeDisabled();
  records = await audioHarnessSnapshot(page);
  expect(records.at(-1)).toMatchObject({paused: true, pauseCount: 1});

  await pause.click();
  await expect(page.locator(RUNTIME)).toHaveAttribute('data-runtime-paused', 'false');
  await expect(playable).toHaveAttribute('aria-pressed', 'false');
  await expect(playable).toBeEnabled();
  await playable.click();
  await expect(page.locator(RUNTIME)).toHaveAttribute(
    'data-interactive-audio-playing',
    assetId!,
  );

  // A deterministic ended event checks state cleanup only; it is not a
  // listening or synchronization assertion.
  await endLastAudioNaturally(page);
  await expect(page.locator(RUNTIME)).not.toHaveAttribute(
    'data-interactive-audio-playing',
  );
  await expect(playable).toHaveAttribute('aria-pressed', 'false');
  records = await audioHarnessSnapshot(page);
  expect(records.at(-1)?.endedCount).toBe(1);

  await playable.click();
  await expect(page.locator(RUNTIME)).toHaveAttribute(
    'data-interactive-audio-playing',
    assetId!,
  );
  await playable.click();
  await expect(page.locator(RUNTIME)).not.toHaveAttribute(
    'data-interactive-audio-playing',
  );
  records = await audioHarnessSnapshot(page);
  expect(records.at(-1)).toMatchObject({currentTime: 0, pauseCount: 1});

  const stoppedRecordId = records.at(-1)!.id;
  await playable.click();
  const changingPageRecordId = (await audioHarnessSnapshot(page)).at(-1)!.id;
  await endAudioById(page, stoppedRecordId);
  await expect(page.locator(RUNTIME)).toHaveAttribute(
    'data-interactive-audio-playing',
    assetId!,
  );
  records = await audioHarnessSnapshot(page);
  expect(records.find((record) => record.id === changingPageRecordId))
    .toMatchObject({paused: false, playCount: 1});
  await (await liveControl(page, 'previous')).click();
  await expect(page.locator(PLAYER)).toHaveAttribute(
    'data-current-animation-id',
    FQ2,
  );
  await expect(page.locator(RUNTIME)).not.toHaveAttribute(
    'data-interactive-audio-playing',
  );
  records = await audioHarnessSnapshot(page);
  expect(records.find((record) => record.id === changingPageRecordId))
    .toMatchObject({currentTime: 0, pauseCount: 1, paused: true});

  await page.waitForLoadState('networkidle');
  expect(local404s).toEqual([]);
});

test.describe('live timeline audio', () => {
  test('English RW002 starts its exact cue, honors shell Stop, and cleans up on page change', async ({
    baseURL,
    page,
  }) => {
    const local404s = collectLocal404s(page, baseURL!);
    await page.setViewportSize({height: 720, width: 1280});
    await openLesson(page);
    await (await liveControl(page, 'next')).click();
    await expect(page.locator(PLAYER)).toHaveAttribute(
      'data-current-animation-id',
      'course-g05-l04-rw-002',
    );
    await deferNextAudioPlay(page);
    await page.emulateMedia({reducedMotion: 'no-preference'});

    const runtime = page.locator(RUNTIME);
    const stage = runtime.locator('.runtime-stage');
    const narration = page.locator(
      '[data-responsive-focus-surface="persistent"] '
      + '[data-responsive-focus-key="narration"]',
    );
    const exactCue = audioReport.normalCandidates.find(
      (candidate) => candidate.animationId === 'course-g05-l04-rw-002',
    )?.embedded.publicPath;
    expect(exactCue).toBeDefined();

    await expect.poll(async () => (
      await audioHarnessSnapshot(page)
    ).filter((record) => record.src === exactCue).length).toBe(1);
    await expect(narration).toHaveAttribute('data-narration-status', 'playing');
    let records = await audioHarnessSnapshot(page);
    const firstCue = records.find((record) => record.src === exactCue)!;
    expect(firstCue).toMatchObject({paused: false, playCount: 1});

    await narration.click();
    await expect(narration).toHaveAttribute('data-narration-status', 'waiting');
    await rejectLastDeferredAudioNotAllowed(page);
    await expect(narration).toHaveAttribute('data-narration-status', 'waiting');
    await expect(runtime.locator('.runtime-audio-controls')).toHaveCount(0);
    const stoppedFrame = Number(await stage.getAttribute('data-flash-frame'));
    await expect.poll(async () =>
      Number(await stage.getAttribute('data-flash-frame')),
    ).toBeGreaterThan(stoppedFrame);
    records = await audioHarnessSnapshot(page);
    expect(records.filter((record) => record.src === exactCue)).toHaveLength(1);
    expect(records.find((record) => record.id === firstCue.id)).toMatchObject({
      currentTime: 0,
      paused: true,
      pauseCount: 1,
    });

    await (await liveControl(page, 'replay')).click();
    await expect.poll(async () => (
      await audioHarnessSnapshot(page)
    ).filter((record) => record.src === exactCue).length).toBe(2);
    records = await audioHarnessSnapshot(page);
    const replayCue = records.filter((record) => record.src === exactCue).at(-1)!;
    expect(replayCue).toMatchObject({paused: false, playCount: 1});

    await (await liveControl(page, 'previous')).click();
    await expect(page.locator(PLAYER)).toHaveAttribute(
      'data-current-animation-id',
      'course-g05-l04-ir-001-a662633d',
    );
    records = await audioHarnessSnapshot(page);
    expect(records.find((record) => record.id === replayCue.id)).toMatchObject({
      currentTime: 0,
      paused: true,
      pauseCount: 1,
    });
    await page.waitForLoadState('networkidle');
    expect(local404s).toEqual([]);
  });
});

test('Spanish ordinary-page narration is manual, volume-bound, and visual-language separate', async ({
  baseURL,
  page,
}) => {
  const local404s = collectLocal404s(page, baseURL!);
  await page.setViewportSize({height: 720, width: 1280});
  await openLesson(page, '/es/courses/5/4?mode=focus');
  await (await liveControl(page, 'next')).click();
  await expect(page.locator(PLAYER)).toHaveAttribute(
    'data-current-animation-id',
    'course-g05-l04-rw-002',
  );

  const runtime = page.locator(RUNTIME);
  await expect(runtime).toHaveAttribute('data-audio-available', 'true');
  await expect(runtime).toHaveAttribute('data-runtime-audio-language', 'es');
  await expect(runtime.locator('.runtime-stage')).toHaveAttribute(
    'data-runtime-language',
    'en',
  );
  const narration = page.locator(
    '[data-responsive-focus-surface="persistent"] '
    + '[data-responsive-focus-key="narration"]',
  );
  await expect(narration).toHaveAttribute('data-narration-status', 'idle');
  await narration.click();
  await expect(narration).toHaveAttribute('data-narration-status', 'playing');
  await expect(runtime).toHaveAttribute('data-host-audio-timeline-paused', 'true');

  const spanishTrack = audioReport.normalCandidates.find(
    (candidate) => candidate.animationId === 'course-g05-l04-rw-002',
  )?.spanish.publicPath;
  expect(spanishTrack).toBeDefined();
  let records = await audioHarnessSnapshot(page);
  expect(records.at(-1)).toMatchObject({
    paused: false,
    playCount: 1,
    src: spanishTrack,
    volume: 0.8,
  });
  const firstTrackRecordId = records.at(-1)!.id;

  const pause = await liveControl(page, 'pause');
  await pause.click();
  await expect(runtime).toHaveAttribute('data-runtime-paused', 'true');
  await expect(narration).toHaveAttribute('data-narration-status', 'idle');
  records = await audioHarnessSnapshot(page);
  expect(records.at(-1)).toMatchObject({paused: true, pauseCount: 1});

  await pause.click();
  await expect(runtime).toHaveAttribute('data-runtime-paused', 'false');
  await expect(narration).toHaveAttribute('data-narration-status', 'idle');
  await narration.click();
  await expect(narration).toHaveAttribute('data-narration-status', 'playing');
  records = await audioHarnessSnapshot(page);
  expect(records.at(-1)).toMatchObject({paused: false, playCount: 1});

  const volume = await liveControl(page, 'volume');
  await volume.fill('0.3');
  await expect(runtime).toHaveAttribute('data-runtime-volume', '0.3');
  records = await audioHarnessSnapshot(page);
  expect(records.at(-1)?.volume).toBeCloseTo(0.3, 5);

  await narration.click();
  await expect(narration).toHaveAttribute('data-narration-status', 'idle');
  await expect(runtime).toHaveAttribute('data-host-audio-timeline-paused', 'false');
  records = await audioHarnessSnapshot(page);
  expect(records.at(-1)).toMatchObject({currentTime: 0, pauseCount: 1});

  await narration.click();
  const replayedTrackRecordId = (await audioHarnessSnapshot(page)).at(-1)!.id;
  await endAudioById(page, firstTrackRecordId);
  await expect(narration).toHaveAttribute('data-narration-status', 'playing');
  records = await audioHarnessSnapshot(page);
  expect(records.find((record) => record.id === replayedTrackRecordId))
    .toMatchObject({paused: false, playCount: 1});
  await narration.click();
  await expect(narration).toHaveAttribute('data-narration-status', 'idle');

  await page.waitForLoadState('networkidle');
  expect(local404s).toEqual([]);
});

test('reduced motion exposes the exact English cue as an on-demand track', async ({
  baseURL,
  page,
}) => {
  const local404s = collectLocal404s(page, baseURL!);
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.setViewportSize({height: 720, width: 1280});
  await openLesson(page);
  await (await liveControl(page, 'next')).click();
  await expect(page.locator(PLAYER)).toHaveAttribute(
    'data-current-animation-id',
    'course-g05-l04-rw-002',
  );

  const runtime = page.locator(RUNTIME);
  await expect(runtime).toHaveAttribute('data-audio-available', 'true');
  await expect(runtime.locator('.reduced-motion-note')).toBeVisible();
  const narration = page.locator(
    '[data-responsive-focus-surface="persistent"] '
    + '[data-responsive-focus-key="narration"]',
  );
  await expect(narration).toHaveAttribute('data-narration-status', 'idle');
  await expect(narration).toBeEnabled();
  await narration.click();
  await expect(narration).toHaveAttribute('data-narration-status', 'playing');

  const englishCue = audioReport.normalCandidates.find(
    (candidate) => candidate.animationId === 'course-g05-l04-rw-002',
  )?.embedded.publicPath;
  expect(englishCue).toBeDefined();
  let records = await audioHarnessSnapshot(page);
  expect(records.at(-1)).toMatchObject({
    paused: false,
    playCount: 1,
    src: englishCue,
    volume: 0.8,
  });

  await narration.click();
  await expect(narration).toHaveAttribute('data-narration-status', 'idle');
  records = await audioHarnessSnapshot(page);
  expect(records.at(-1)).toMatchObject({currentTime: 0, pauseCount: 1});
  await page.waitForLoadState('networkidle');
  expect(local404s).toEqual([]);
});
