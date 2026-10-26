import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {SMOKE_GATE, selectSmokeLessons, assessRendererReady, summarizeRendererReady, allSmokeWalksComplete, waitForRendererReady as settle} from './lib/g678-renderer-ready-smoke-v1.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = process.env.G678_ORIGIN ?? 'http://127.0.0.1:3331';
const requested = (process.argv[2] ?? 'all').split(',').map((item) => item.trim()).filter(Boolean);
const locales = (process.env.G678_WALK_LOCALES ?? 'en,es').split(',').map((item) => item.trim()).filter((item) => item === 'en' || item === 'es');
if (locales.length === 0) {
  console.error('G678_WALK_LOCALES must include en or es');
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'catalog/g678-page-only-release-manifest.v1.json'), 'utf8'));
const lessons = selectSmokeLessons(manifest.releases.map((release) => {
  const ids = release.members.map((member) => member.animationId);
  const match = /^shared-([a-z]+\d+)-l(\d+)-p/u.exec(ids[0] ?? '');
  return {module: match?.[1] ?? '', lesson: String(Number(match?.[2] ?? '0')), count: ids.length, ids};
}), requested);
const runId = `${new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')}-${randomUUID()}`;
const outDir = path.join(root, 'output/g678-renderer-ready-smoke', runId);
fs.mkdirSync(outDir, {recursive: true});
const slug = requested.includes('all') ? 'all' : requested.join('_').replaceAll('/', '-');
const logPath = process.env.G678_WALK_LOG ?? path.join(outDir, `walk-${slug}.jsonl`);
const summaryPath = process.env.G678_WALK_SUMMARY ?? path.join(outDir, `summary-${slug}.json`);
if (path.resolve(logPath) === path.resolve(summaryPath)) throw new Error('Walk log and summary must be different new files');
// Reserve both paths before starting a browser; an existing attempt is never overwritten.
fs.closeSync(fs.openSync(logPath, 'wx'));
fs.closeSync(fs.openSync(summaryPath, 'wx'));
// Keep the existing global walk lock shared with older walk invocations.
const lockPath = path.join(root, 'output/g678-course-playback-20261021/walk.lock');
fs.mkdirSync(path.dirname(lockPath), {recursive: true});
if (fs.existsSync(lockPath)) {
  const owner = Number(fs.readFileSync(lockPath, 'utf8'));
  try {
    process.kill(owner, 0);
    console.error(`another lesson walk is already running: ${owner}`);
    process.exit(2);
  } catch {
    // The previous walk exited without clearing its lock.
  }
}
fs.writeFileSync(lockPath, String(process.pid));
process.on('exit', () => {
  try {
    if (fs.readFileSync(lockPath, 'utf8').trim() === String(process.pid)) fs.unlinkSync(lockPath);
  } catch {
    // Another walk may already own the lock.
  }
});
function write(row) {
  fs.appendFileSync(logPath, `${JSON.stringify(row)}\n`);
}

async function waitForOrigin() {
  for (let attempt = 0; attempt < 90; attempt += 1) {
    try {
      const response = await fetch(`${origin}/favicon.ico`, {signal: AbortSignal.timeout(3000)});
      if (response.status < 500) return true;
    } catch {
      // The preview process exits on its own; the next attempt waits for it.
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

async function warmLesson(url) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (!await waitForOrigin()) return false;
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(180000),
        headers: {accept: 'text/html'},
      });
      await response.arrayBuffer();
      if (response.status < 500) return true;
    } catch {
      // A compile can drop the socket. The next attempt waits for the preview.
    }
  }
  return false;
}

async function openLesson(page, url) {
  try {
    await page.goto('about:blank', {timeout: 10000});
  } catch {
    // The previous document may already be gone with the preview.
  }
  if (!await warmLesson(url)) return false;
  try {
    await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 120000});
    return true;
  } catch {
    return false;
  }
}

async function walkLesson(page, lesson, locale, viewport) {
  const errors = [];
  const lazyBackendRequests = {count: 0, maxUrlBytes: 0};
  const onRequest = (request) => {
    const url = new URL(request.url());
    if (url.hostname === '127.0.0.1' && url.pathname.startsWith('/lazy-compilation-using-')) {
      lazyBackendRequests.count += 1;
      lazyBackendRequests.maxUrlBytes = Math.max(lazyBackendRequests.maxUrlBytes, Buffer.byteLength(request.url()));
    }
  };
  const onPageError = (error) => errors.push(String(error));
  const onConsole = (message) => {
    if (message.type() === 'error') errors.push(message.text());
  };
  page.on('pageerror', onPageError);
  page.on('console', onConsole);
  page.on('request', onRequest);
  const observations = [];
  const navigationErrors = [];
  try {
    const url = `${origin}/${locale}/migration-status/g678-course/${lesson.module}/${lesson.lesson}`;
    await page.setViewportSize(viewport);
    if (!await openLesson(page, url)) throw new Error('lesson page did not open');
    for (const [step, expectedAnimationId] of lesson.ids.entries()) {
      let state;
      try {
        state = await settle(page, expectedAnimationId, 45000);
      } catch (error) {
        state = {animationId: '', rendererSignalFound: false, observationError: String(error)};
      }
      const consoleErrors = errors.splice(0, errors.length);
      const observation = {
        kind: 'page', gate: SMOKE_GATE, locale, viewport: viewport.width,
        module: lesson.module, lesson: lesson.lesson, step, expectedAnimationId,
        ...state, ...assessRendererReady(expectedAnimationId, state, consoleErrors), consoleErrors,
      };
      observations.push(observation);
      write(observation);
      if (step === lesson.ids.length - 1) break;
      try {
        const next = page.locator('[data-lesson-nav="action-next"], [data-lesson-nav="footer-next"]').last();
        if (await next.count() === 0 || await next.isDisabled()) throw new Error('PUBLIC_NEXT_UNAVAILABLE');
        await next.click({timeout: 5000});
        await page.waitForFunction((id) => document.querySelector('[data-current-animation-id]')?.getAttribute('data-current-animation-id') === id, lesson.ids[step + 1], {timeout: 8000});
      } catch (error) {
        const failure = {kind: 'navigation', gate: SMOKE_GATE, locale, module: lesson.module, lesson: lesson.lesson, expectedAnimationId: lesson.ids[step + 1], fromAnimationId: expectedAnimationId, failed: true, error: String(error)};
        navigationErrors.push(failure);
        write(failure);
        break;
      }
    }
  } finally {
    page.off('pageerror', onPageError);
    page.off('console', onConsole);
    page.off('request', onRequest);
  }
  const summary = summarizeRendererReady(lesson.ids, observations);
  for (const expectedAnimationId of summary.notRunIds) {
    write({kind: 'page', gate: SMOKE_GATE, locale, module: lesson.module, lesson: lesson.lesson, expectedAnimationId, status: 'not-run', rendererReady: false, failed: true, reasons: ['NOT_REACHED']});
  }
  return {locale, module: lesson.module, lesson: lesson.lesson, ...summary, navigationErrors, lazyBackendRequests,
    complete: summary.complete && navigationErrors.length === 0};
}

const browser = await chromium.launch({channel: 'chrome', headless: true});
const context = await browser.newContext();
const page = await context.newPage();
const summaries = [];
for (const lesson of lessons) {
  for (const locale of locales) {
    try {
      const summary = await walkLesson(page, lesson, locale, {width: 1360, height: 900});
      summaries.push(summary);
      write({kind: 'lesson', ...summary});
      console.log(`${summary.complete ? 'ready' : 'gap'} ${SMOKE_GATE} ${locale} ${lesson.module}/${lesson.lesson} ${summary.rendererReady}/${summary.expected}`);
    } catch (error) {
      const summary = {locale, module: lesson.module, lesson: lesson.lesson, ...summarizeRendererReady(lesson.ids, []), error: String(error)};
      summaries.push(summary);
      write({kind: 'lesson', ...summary});
      console.log(`fail ${locale} ${lesson.module}/${lesson.lesson} ${summary.error}`);
    }
  }
}
const passed = summaries.filter((summary) => summary.complete).length;
fs.writeFileSync(summaryPath, JSON.stringify({
  gate: SMOKE_GATE, scope: 'Renderer-ready diagnostic only; no natural playback, source-action, audio, Scheme A or technical-closure claim.',
  runId, origin, lessons: lessons.length, expectedWalks: lessons.length * locales.length, walks: summaries.length, passed, summaries,
}, null, 2));
console.log(`${SMOKE_GATE}: ${passed}/${summaries.length} walks ready`);
await browser.close();
process.exit(allSmokeWalksComplete(summaries, lessons.length * locales.length) ? 0 : 1);
