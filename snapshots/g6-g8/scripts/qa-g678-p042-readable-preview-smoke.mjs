#!/usr/bin/env node
// Initial actual 378 My Lesson browser check, not product calibration.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'http://127.0.0.1:3324';
const args = process.argv.slice(2);
assert.ok(args.length === 4 && args[0] === '--run' && /^[a-z0-9-]+$/u.test(args[1]) &&
  args[2] === '--registry-sha256' && /^[a-f0-9]{64}$/u.test(args[3]), 'Exact run and activated registry hash required');
const OUTPUT = `output/playwright/g678-p042-readable-preview-smoke-${args[1]}`;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const binding = async file => {const bytes = await readFile(path.resolve(ROOT, file)); return {path: file, bytes: bytes.length, sha256: digest(bytes)};};
const paths = ['scripts/qa-g678-p042-readable-preview-smoke.mjs',
  'packages/demos/private-current-js-registry.json', 'packages/demos/src/registry.local-only.generated.ts',
  'packages/demos/src/registry.local-only.metadata.generated.ts',
  'catalog/product-bridge-calibrations/g678-current-js-378-page-registration-v1.json',
  'catalog/product-bridge-calibrations/g678-current-js-378-page-registration-v1.fragment.json',
  'catalog/product-bridge-calibrations/g678-current-js-378-page-registration-v1.activation.json',
  'apps/web/lib/g678-calibration-product-bridge.server.ts', 'apps/web/lib/g678-math-companion-authority.server.ts',
  'apps/web/lib/g678-nms-l01-p042-companion-authority.server.ts',
  'apps/web/components/descriptor-driven-whole-lesson-player.tsx', 'apps/web/components/legacy-responsive-lesson-shell.tsx',
  'apps/web/components/animation-runtime.tsx', 'apps/web/app/globals.css',
  'packages/demos/src/contract.ts', 'packages/demos/src/runtime.ts',
  'packages/demos/src/g678-alg-l11-p034-companion-candidate.tsx', 'packages/demos/src/g678-alg-l11-p044-companion-candidate.tsx',
  'packages/demos/src/g678-nms-l01-p042-readable-companion-candidate.tsx',
  'packages/demos/src/g678-nms-l01-p042-candidate.tsx',
  'packages/demos/src/generated/g678-nms-l01-p042-source-visual-v1.ts',
  'packages/demos/src/modules/g678-nms-l01-readable-current-js-p042.tsx',
  'packages/demos/src/timelines/g678-nms-l01-readable-current-js-p042.ts'];
const inputs = await Promise.all(paths.map(binding));
assert.equal(inputs[1].sha256, args[3]);
const registry = JSON.parse(await readFile(path.join(ROOT, paths[1]), 'utf8'));
const calibration = registry.calibrations.find(c => c.calibrationId === 'g678-16-page-product-calibration-v1');
assert.equal(calibration.freezeManifest, paths[4]); assert.equal(calibration.entries.length, 378);
assert.equal(calibration.freezeManifestSha256, inputs[4].sha256);
const fragment = JSON.parse(await readFile(path.join(ROOT, paths[5]), 'utf8'));
assert.deepEqual(fragment.calibration, calibration);
const activation = JSON.parse(await readFile(path.join(ROOT, paths[6]), 'utf8'));
assert.equal(activation.registrationCount, 378); assert.equal(activation.preservedPageCount, 377);
assert.deepEqual(activation.changedModuleIds, ['shared-nms002-l01-p042']);
assert.equal(activation.proposed.registry.sha256, args[3]);
assert.ok(Object.values(activation.acceptanceEffects).every(value => value === false));
await mkdir(path.join(ROOT, OUTPUT));
const save = (file, data) => writeFile(path.join(ROOT, OUTPUT, file), data, {flag: 'wx'});
await save('runner-source.mjs', await readFile(fileURLToPath(import.meta.url)));
const evidence = {artifactType: 'g678-p042-readable-private-preview-smoke-v1', generatedAt: new Date().toISOString(),
  story: 'Exact378 registry, admitted official loader, one new native p042 readable companion and preserved p034/p044 slots',
  inputs, routes: [], errors: [], network: [], browserSmokeOnly: true,
  productCalibrationPassed: false, originalRuntimeAccepted: false, visualFidelityAccepted: false,
  audioAccepted: false, humanAccepted: false, ownerAccepted: false, strictComplete: false, released: false, published: false};
const cases = [null, 'shared-alg001-l11-p034', 'shared-alg001-l11-p044', 'shared-nms002-l01-p042'];
const browser = await chromium.launch({headless: true});
try {
  for (const id of cases) {
    const name = id?.slice(-4) ?? 'home';
    const context = await browser.newContext({viewport: {width: 1440, height: 1000}, reducedMotion: 'reduce', serviceWorkers: 'block'});
    await context.route('**/*', route => {
      const url = new URL(route.request().url()), allowed = url.origin === BASE;
      evidence.network.push({url: url.href, method: route.request().method(), allowed});
      return allowed ? route.continue() : route.abort('blockedbyclient');
    });
    await context.routeWebSocket('**/*', socket => {
      const url = new URL(socket.url());
      const allowed = url.origin === 'ws://127.0.0.1:3324' && url.pathname.startsWith('/_next/');
      evidence.network.push({url: socket.url(), method: 'WEBSOCKET', allowed});
      if (allowed) socket.connectToServer(); else socket.close();
    });
    const page = await context.newPage();
    page.on('pageerror', error => evidence.errors.push({id, error: error.message}));
    page.on('console', message => {if (message.type() === 'error') evidence.errors.push({id, error: message.text()});});
    try {
      const route = id ? `/en/migration-status/g678-calibration/${id}` : '/en?screen=lessons';
      const record = {path: route}; evidence.routes.push(record);
      const response = await page.goto(BASE + route, {waitUntil: 'networkidle', timeout: 90000});
      assert.equal(response.status(), 200); record.httpStatus = response.status();
      await page.waitForFunction(() => document.body.innerText.trim().length > 100);
      assert.equal(await page.locator('[data-nextjs-dialog], .vite-error-overlay').count(), 0);
      if (id) {
        await page.locator(`[data-lesson-player][data-current-animation-id="${id}"][data-hydrated="true"]`).waitFor();
        const p042 = name === 'p042';
        const selector = p042 ? '[data-p042-readable-content="true"]' : `[data-${name}-action-tree="true"]`;
        const companion = page.locator(`${selector}[data-companion-placement="portal"]`);
        await companion.waitFor();
        record.presentation = await companion.evaluate(element => {
          const slot = element.closest('[data-page-interaction-companion-host="true"]');
          const box = element.getBoundingClientRect();
          const source = document.querySelector('[data-p042-readable-source-plane="true"]');
          return {slotId: slot?.id, ownColumn: slot?.parentElement === element.closest('.lesson-shell2__learning-column'),
            insideRuntimeStage: Boolean(element.closest('.runtime-stage')), nativeWidth: box.width, nativeHeight: box.height,
            language: element.lang, nativeButtons: element.querySelectorAll('button').length,
            title: element.querySelector('h2')?.textContent,
            steps: [...element.querySelectorAll('ol > li')].map(li => ({text: li.textContent, fontSize: getComputedStyle(li).fontSize,
              lineHeight: getComputedStyle(li).lineHeight})),
            sourceSvg: source?.querySelector('svg')?.getAttribute('viewBox'),
            sourceSeparate: source ? !element.contains(source) && !source.contains(element) : null};
        });
        const expectedSuffix = p042 ? 'nms-l01-p042-readable-companion' : `alg-l11-${name}-math-companion`;
        assert.ok(record.presentation.slotId?.endsWith(expectedSuffix));
        assert.equal(record.presentation.ownColumn, true); assert.equal(record.presentation.insideRuntimeStage, false);
        assert.equal(record.presentation.language, 'en');
        assert.ok(record.presentation.nativeWidth > 300 && record.presentation.nativeHeight > 100);
        assert.equal(record.presentation.nativeButtons, p042 ? 0 : name === 'p034' ? 15 : 5);
        assert.equal(await page.locator(selector).count(), 1);
        assert.equal(await page.locator('[data-lesson-player]').getAttribute('data-unavailable-pages'), p042 ? '36' : '0');
        if (p042) {
          assert.equal(record.presentation.title, 'Positive & Negative Numbers: Test Skills');
          assert.deepEqual(record.presentation.steps, ['Restate the question.', 'Organize the information.', 'Solve the problem.', 'Check your answer.']
            .map(text => ({text, fontSize: '20px', lineHeight: '30px'})));
          assert.equal(record.presentation.sourceSeparate, true); assert.equal(record.presentation.sourceSvg, '0 0 800 600');
          assert.equal(await page.locator('[data-p042-readable-fallback]').count(), 0);
        }
        record.robots = response.headers()['x-robots-tag'] ?? ''; assert.match(record.robots, /noindex/u);
      }
      const screenshot = `${name}-actual.png`;
      await save(screenshot, await page.screenshot({fullPage: true}));
      record.screenshot = await binding(`${OUTPUT}/${screenshot}`); record.status = 'passed';
      console.log(JSON.stringify({route, status: record.status}));
    } catch (error) {
      await save(`failure-${name}.png`, await page.screenshot({fullPage: true})); throw error;
    } finally {await context.close();}
  }
  assert.deepEqual(evidence.errors, []); assert.ok(evidence.network.every(request => request.allowed));
  assert.deepEqual(await Promise.all(paths.map(binding)), inputs, 'Critical inputs changed during initial verification');
  evidence.inputsUnchanged = true; evidence.status = 'passed';
} catch (error) {evidence.status = 'failed'; evidence.failure = error.message; process.exitCode = 1;}
finally {
  await browser.close(); await save('evidence.json', JSON.stringify(evidence, null, 2) + '\n');
  console.log(JSON.stringify({status: evidence.status, evidence: await binding(`${OUTPUT}/evidence.json`)}));
}
