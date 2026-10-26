#!/usr/bin/env node
// Actual registered My Lesson layout only. Never scroll overflow ancestors or
// focus/click a source control: Playwright auto-scrolling can mask clipping.
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
  args[2] === '--activated-registry-sha256' && /^[a-f0-9]{64}$/u.test(args[3]),
'usage after coordinator GO: script --run <exclusive-name> --activated-registry-sha256 <sha>');
const OUTPUT = `output/playwright/g678-alg-l11-instructional-d-visible-layout-${args[1]}`;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const binding = async file => {const b = await readFile(path.resolve(ROOT, file));
  return {path: file, bytes: b.length, sha256: hash(b)};};
const inputFiles = ['scripts/qa-g678-alg-l11-instructional-d-visible-layout.mjs',
  'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v2.fragment.json',
  'packages/demos/private-current-js-registry.json', 'packages/demos/src/registry.local-only.generated.ts',
  'packages/demos/src/registry.local-only.metadata.generated.ts',
  'apps/web/app/globals.css', 'apps/web/components/descriptor-driven-whole-lesson-player.tsx',
  'apps/web/components/legacy-responsive-lesson-shell.tsx', 'apps/web/components/animation-runtime.tsx',
  'apps/web/lib/g678-calibration-product-bridge.server.ts', 'apps/web/lib/load-animation-module.client.ts',
  'packages/demos/src/g678-alg-l11-tranche-d-instructional-candidates.tsx',
  'packages/demos/src/generated/g678-alg-l11-tranche-d-instructional-visuals-v1.ts',
  ...[34,44].flatMap(n => [`packages/demos/src/modules/g678-alg-l11-instructional-successor-p0${n}.tsx`,
    `packages/demos/src/timelines/g678-alg-l11-instructional-successor-p0${n}.ts`])];
const inputs = await Promise.all(inputFiles.map(binding));
assert.equal(inputs.find(f => f.path.endsWith('/private-current-js-registry.json')).sha256, args[3]);
const registry = JSON.parse(await readFile(path.join(ROOT, 'packages/demos/private-current-js-registry.json'), 'utf8'));
const fragmentPath = 'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v2.fragment.json';
assert.equal(inputs.find(f => f.path === fragmentPath).sha256, '45089cc9b93ffa4e612111be251bcabcbfe8919bc024faf8e41e3a954c9bb230');
const fragment = JSON.parse(await readFile(path.join(ROOT, fragmentPath), 'utf8'));
assert.deepEqual(registry.calibrations.find(c => c.calibrationId === fragment.calibration.calibrationId), fragment.calibration);
await mkdir(path.join(ROOT, OUTPUT));
const save = (name, data) => writeFile(path.join(ROOT, OUTPUT, name), data, {flag: 'wx'});
const json = value => `${JSON.stringify(value, null, 2)}\n`;
await save('qa-runner-source.mjs', await readFile(fileURLToPath(import.meta.url)));
const records = [], network = [], errors = [];
const evidence = {artifactType: 'actual-my-lesson-d-visible-layout-regression-v1', inputs,
  generatedAt: new Date().toISOString(), scope: 'p034-p044-initial-desktop-mobile-visible-layout',
  boundary: 'Actual official loader; no test loader, module injection, style override, focus, source click or overflow-ancestor scroll',
  records, network, errors, productCalibrationPassed: false, humanVisualAccepted: false,
  visualFidelityAccepted: false, audioAccepted: false, ownerAccepted: false,
  strictComplete: false, releaseEligible: false, published: false};
const browser = await chromium.launch({headless: true});
evidence.browser = {version: browser.version(), executable: await binding(chromium.executablePath())};
try {
  for (const [layout, viewport] of [['desktop', {width: 1440, height: 1000}], ['mobile', {width: 390, height: 844}]]) {
    for (const number of [34,44]) {
      const id = `shared-alg001-l11-p0${number}`, name = `${layout}-p0${number}`;
      const record = {name, id, viewport, reducedMotion: true, errors: [], status: 'running'};
      records.push(record);
      const context = await browser.newContext({viewport, reducedMotion: 'reduce', serviceWorkers: 'block'});
      await context.route('**/*', async route => {
        const url = new URL(route.request().url());
        const allowed = url.origin === BASE && (/^\/(?:en\/|es\/)?migration-status\/g678-calibration(?:\/shared-alg001-l11-p\d{3})?$/u.test(url.pathname) ||
          /^\/(?:_next\/|flash-assets\/)/u.test(url.pathname) || ['/favicon.ico','/learning-theme-bootstrap.js','/__nextjs_original-stack-frames'].includes(url.pathname));
        network.push({case: name, url: url.href, method: route.request().method(), allowed});
        if (allowed) await route.continue(); else await route.abort('blockedbyclient');
      });
      await context.routeWebSocket('**/*', async socket => {
        const allowed = socket.url().startsWith('ws://127.0.0.1:3324/_next/');
        network.push({case: name, url: socket.url(), method: 'WEBSOCKET', allowed});
        if (allowed) socket.connectToServer(); else socket.close();
      });
      const page = await context.newPage();
      page.on('pageerror', error => {record.errors.push(error.message); errors.push({case: name, error: error.message});});
      try {
        const response = await page.goto(`${BASE}/en/migration-status/g678-calibration/${id}`, {waitUntil: 'networkidle'});
        assert.equal(response.status(), 200);
        const selector = `[data-lesson-player][data-current-animation-id="${id}"][data-hydrated="true"] .runtime-stage [data-source-content-successor][data-animation-id="${id}"]`;
        await page.locator(selector).waitFor();
        record.geometry = await page.locator(selector).evaluate(root => {
          const box = node => {const r = node.getBoundingClientRect();
            return {left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height};};
          const name = node => node.getAttribute('aria-label') || node.getAttribute('data-source-card-id') || node.textContent.trim().slice(0, 100);
          const elements = [...root.querySelectorAll('button, h2, p, [role="img"]')]
            .filter(node => {const style = getComputedStyle(node), b = box(node);
              return style.visibility !== 'hidden' && style.display !== 'none' && b.width > 0 && b.height > 0;});
          return {root: box(root), viewportWidth: innerWidth, documentWidth: document.documentElement.scrollWidth,
            stage: box(root.closest('.lesson-shell2__stage')),
            elements: elements.map(node => {
              const b = box(node), clipping = [];
              for (let ancestor = node.parentElement; ancestor && ancestor !== document.body; ancestor = ancestor.parentElement) {
                const style = getComputedStyle(ancestor), a = box(ancestor);
                const clipX = ['hidden', 'clip'].includes(style.overflowX), clipY = ['hidden', 'clip'].includes(style.overflowY);
                if (clipX && (b.left < a.left - 1 || b.right > a.right + 1) || clipY && (b.top < a.top - 1 || b.bottom > a.bottom + 1))
                  clipping.push({tag: ancestor.tagName, className: ancestor.className, overflowX: style.overflowX,
                    overflowY: style.overflowY, box: a, scrollTop: ancestor.scrollTop, scrollLeft: ancestor.scrollLeft});
              }
              return {tag: node.tagName, label: name(node), box: b, clipping};
            })};
        });
        const png = await page.screenshot({fullPage: true});
        await save(`${name}.png`, png);
        record.screenshot = {path: `${OUTPUT}/${name}.png`, bytes: png.length, sha256: hash(png)};
        record.clipped = record.geometry.elements.filter(e => e.clipping.length > 0);
        assert.ok(record.geometry.elements.filter(e => e.tag === 'BUTTON').length >= (number === 34 ? 15 : 5));
        assert.equal(record.geometry.documentWidth <= viewport.width, true, 'Horizontal page overflow');
        assert.deepEqual(record.clipped.map(e => e.label), [], 'Instructional content or controls clipped by non-user-scrollable ancestor');
        assert.deepEqual(record.errors, []);
        record.status = 'passed';
      } catch (error) {record.status = 'failed'; record.failure = error.message;}
      finally {await context.close();}
      console.log(JSON.stringify({case: name, status: record.status, clippedElements: record.clipped?.length}));
    }
  }
} finally {
  await browser.close();
  const fresh = await Promise.all(inputFiles.map(binding));
  evidence.inputsUnchanged = JSON.stringify(fresh) === JSON.stringify(inputs);
  evidence.status = records.length === 4 && records.every(r => r.status === 'passed') && evidence.inputsUnchanged &&
    errors.length === 0 && network.every(r => r.allowed) ? 'visible-layout-regression-passed' : 'visible-layout-regression-failed';
  await save('evidence.json', json(evidence));
  console.log(JSON.stringify({output: OUTPUT, status: evidence.status, productCalibrationPassed: false}));
}
process.exitCode = evidence.status === 'visible-layout-regression-passed' ? 0 : 1;
