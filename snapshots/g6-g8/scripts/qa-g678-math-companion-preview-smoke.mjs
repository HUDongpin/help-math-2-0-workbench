#!/usr/bin/env node
// Initial real-browser V4 server verification, not product calibration.
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
const OUTPUT = `output/playwright/g678-math-companion-preview-smoke-${args[1]}`;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const binding = async file => {const bytes = await readFile(path.resolve(ROOT, file)); return {path: file, bytes: bytes.length, sha256: digest(bytes)};};
const paths = ['scripts/qa-g678-math-companion-preview-smoke.mjs',
  'packages/demos/private-current-js-registry.json', 'packages/demos/src/registry.local-only.generated.ts',
  'packages/demos/src/registry.local-only.metadata.generated.ts',
  'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v4.json',
  'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v4.fragment.json',
  'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v4.activation.json',
  'apps/web/lib/g678-calibration-product-bridge.server.ts', 'apps/web/lib/g678-math-companion-authority.server.ts',
  'apps/web/components/descriptor-driven-whole-lesson-player.tsx', 'apps/web/components/legacy-responsive-lesson-shell.tsx',
  'apps/web/components/animation-runtime.tsx', 'apps/web/app/globals.css',
  'packages/demos/src/contract.ts', 'packages/demos/src/runtime.ts',
  'packages/demos/src/g678-alg-l11-p034-companion-candidate.tsx', 'packages/demos/src/g678-alg-l11-p044-companion-candidate.tsx'];
const inputs = await Promise.all(paths.map(binding));
assert.equal(inputs.find(input => input.path === paths[1]).sha256, args[3]);
const registry = JSON.parse(await readFile(path.join(ROOT, paths[1]), 'utf8'));
const calibration = registry.calibrations.find(c => c.calibrationId === 'g678-16-page-product-calibration-v1');
assert.equal(calibration.freezeManifest, paths[4]); assert.equal(calibration.entries.length, 377);
assert.equal(calibration.freezeManifestSha256, inputs.find(input => input.path === paths[4]).sha256);
await mkdir(path.join(ROOT, OUTPUT));
const save = (file, data) => writeFile(path.join(ROOT, OUTPUT, file), data, {flag: 'wx'});
await save('runner-source.mjs', await readFile(fileURLToPath(import.meta.url)));
const evidence = {artifactType: 'g678-math-companion-private-preview-smoke-v1', generatedAt: new Date().toISOString(),
  story: 'Exact V4 registry → admitted server descriptor → official module loader → marked native math companion outside fixed source plane',
  inputs, routes: [], errors: [], network: [], browserSmokeOnly: true,
  productCalibrationPassed: false, audioAccepted: false, humanAccepted: false, ownerAccepted: false, strictComplete: false, published: false};
const browser = await chromium.launch({headless: true});
try {
  for (const pageNumber of [null, '034', '044']) {
    const context = await browser.newContext({viewport: {width: 1440, height: 1000}, reducedMotion: 'reduce', serviceWorkers: 'block'});
    await context.route('**/*', route => {
      const url = new URL(route.request().url()), allowed = url.origin === BASE;
      evidence.network.push({url: url.href, method: route.request().method(), allowed});
      return allowed ? route.continue() : route.abort('blockedbyclient');
    });
    await context.routeWebSocket('**/*', socket => {
      const allowed = socket.url().startsWith('ws://127.0.0.1:3324/_next/');
      evidence.network.push({url: socket.url(), method: 'WEBSOCKET', allowed});
      if (allowed) socket.connectToServer(); else socket.close();
    });
    const page = await context.newPage();
    page.on('pageerror', error => evidence.errors.push({page: pageNumber, error: error.message}));
    page.on('console', message => {if (message.type() === 'error') evidence.errors.push({page: pageNumber, error: message.text()});});
    try {
      const id = pageNumber ? `shared-alg001-l11-p${pageNumber}` : null;
      const route = id ? `/en/migration-status/g678-calibration/${id}` : '/en?screen=lessons';
      const record = {path: route}; evidence.routes.push(record);
      const response = await page.goto(BASE + route, {waitUntil: 'networkidle', timeout: 90000});
      assert.equal(response.status(), 200); record.httpStatus = response.status();
      await page.waitForFunction(() => document.body.innerText.trim().length > 100);
      assert.equal(await page.locator('[data-nextjs-dialog], .vite-error-overlay').count(), 0);
      if (id) {
        await page.locator(`[data-lesson-player][data-current-animation-id="${id}"][data-hydrated="true"]`).waitFor();
        const companion = page.locator(`[data-p${pageNumber}-action-tree="true"][data-companion-placement="portal"]`);
        await companion.waitFor();
        record.presentation = await companion.evaluate(element => {
          const slot = element.closest('[data-page-interaction-companion-host="true"]');
          const box = element.getBoundingClientRect();
          return {slotId: slot?.id, insideRuntimeStage: Boolean(element.closest('.runtime-stage')),
            nativeWidth: box.width, nativeHeight: box.height, language: element.lang,
            nativeButtons: element.querySelectorAll('button').length,
            stageAspect: getComputedStyle(document.querySelector('.lesson-shell2__stage')).aspectRatio};
        });
        assert.ok(record.presentation.slotId?.endsWith(`alg-l11-p${pageNumber}-math-companion`));
        assert.equal(record.presentation.insideRuntimeStage, false);
        assert.equal(record.presentation.language, 'en');
        assert.ok(record.presentation.nativeWidth > 300 && record.presentation.nativeHeight > 200);
        assert.ok(record.presentation.nativeButtons >= (pageNumber === '034' ? 15 : 5));
        assert.equal(await page.locator(`[data-p${pageNumber}-action-tree="true"]`).count(), 1);
        assert.equal(await page.locator('[data-lesson-player]').getAttribute('data-unavailable-pages'), '0');
        record.robots = response.headers()['x-robots-tag'] ?? '';
        assert.match(record.robots, /noindex/u);
      }
      const name = pageNumber ? `p${pageNumber}-actual-companion.png` : 'lessons.png';
      await save(name, await page.screenshot({fullPage: true}));
      record.screenshot = await binding(`${OUTPUT}/${name}`); record.status = 'passed';
      console.log(JSON.stringify({route, status: record.status}));
    } catch (error) {
      await save(`failure-${pageNumber ?? 'home'}.png`, await page.screenshot({fullPage: true}));
      throw error;
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
