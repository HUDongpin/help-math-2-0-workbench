#!/usr/bin/env node
// Run only after the coordinating task has activated the exact local successor
// and completed its first browser gut-check. No server or activation is started.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'http://127.0.0.1:3324';
const IDS = [6,8,9,10,11,14,19,20,21,25,26,27,28,29,30,31,32,33,34,40,41,42,44]
  .map(n => `shared-alg001-l11-p${String(n).padStart(3, '0')}`);
const HOST = '[data-lesson-player][data-current-animation-id]';
const RUNTIME = `${HOST} .runtime-shell[data-runtime-transport]`;
const STAGE = `${HOST} .runtime-stage[data-animation-module]`;
const FREEZE = 'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v2.json';
const FRAGMENT = 'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v2.fragment.json';
const REGISTRY = 'packages/demos/private-current-js-registry.json';
const args = process.argv.slice(2);
assert.ok((args.length === 4 || args.length === 5 && ['--probe-only', '--guided-only'].includes(args[4])) && args[0] === '--run' && /^[a-z0-9-]+$/u.test(args[1]) &&
  args[2] === '--activated-registry-sha256' && /^[a-f0-9]{64}$/u.test(args[3]),
'usage after coordinator GO: script --run <exclusive-name> --activated-registry-sha256 <exact-approved-sha> [--probe-only|--guided-only]');
const PROBE_ONLY = args[4] === '--probe-only';
const GUIDED_ONLY = args[4] === '--guided-only';
const OUTPUT = `output/playwright/g678-alg-l11-instructional-successor-my-lesson-${args[1]}`;
const out = path.join(ROOT, OUTPUT);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => `${JSON.stringify(value, null, 2)}\n`;
const readJson = async file => JSON.parse(await readFile(path.join(ROOT, file), 'utf8'));
const binding = async file => {const b = await readFile(path.resolve(ROOT, file));
  return {path: file, bytes: b.length, sha256: hash(b)};};
const save = (file, data) => writeFile(path.join(out, file), data, {flag: 'wx'});
const wrap = body => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:ffdec="https://www.free-decompiler.com/flash" viewBox="0 0 800 600">${body}</svg>`;
const pinned = async (file, sha256) => assert.equal((await binding(file)).sha256, sha256, `${file}: expected activation binding drift`);
await pinned(FREEZE, '4b11e46779f6c042c4a36ebb5b6e5eece1af3dc5b1b88796865abf01cb36bef6');
await pinned(FRAGMENT, '45089cc9b93ffa4e612111be251bcabcbfe8919bc024faf8e41e3a954c9bb230');
await pinned(REGISTRY, args[3]);
assert.notEqual(args[3], 'bdae8f916495a80d13dd1e02282c21f6de25a8f45247ddb1207b410fc68b9212', 'Predecessor registry is not activated successor');
const freeze = await readJson(FREEZE), fragment = await readJson(FRAGMENT), registry = await readJson(REGISTRY);
const calibration = registry.calibrations.find(c => c.calibrationId === freeze.calibrationId);
assert.deepEqual(calibration, fragment.calibration, 'Official registry does not contain exact prepared calibration');
const pages = new Map(freeze.selectedPages.map(p => [p.animationId, p]));
const run = await readJson('work/g678-shared-page-factory/g678-alg-l11-instructional-successor-current-js-v1/run-manifest.json');
const inventory = await readJson(run.outputInventory.path);
const memberInputs = (await Promise.all(inventory.files.filter(f => f.path.endsWith('/member-manifest.json')).map(f => readJson(f.path))))
  .flatMap(member => member.instructionalInputs ?? []);
const critical = [FREEZE, FRAGMENT, REGISTRY,
  'scripts/qa-g678-alg-l11-instructional-successor-my-lesson.mjs',
  'apps/web/lib/g678-calibration-product-bridge.server.ts',
  'apps/web/lib/load-animation-module.client.ts',
  'apps/web/i18n/routing.ts',
  'apps/web/components/descriptor-driven-whole-lesson-player.tsx',
  'apps/web/components/legacy-responsive-lesson-shell.tsx',
  'apps/web/components/animation-runtime.tsx',
  'apps/web/app/globals.css',
  'apps/web/public/learning-theme-bootstrap.js',
  'packages/demos/src/registry.local-only.generated.ts',
  'packages/demos/src/registry.local-only.metadata.generated.ts',
  'catalog/g678-alg-l11-instructional-successor-glossary-v1.json',
  'catalog/g678-alg-l11-behavior10-tranche-b-audit-v1.json',
  ...run.codeDependencyClosure.map(f => f.path), ...inventory.files.map(f => f.path), ...memberInputs.map(f => f.path)];
const inputFiles = [...new Set(critical)];
const inputs = await Promise.all(inputFiles.map(binding));
for (const file of inventory.files) assert.deepEqual(await binding(file.path), file);
for (const file of memberInputs) assert.deepEqual(await binding(file.path), file);
const sourceGlossary = await readJson('catalog/g678-alg-l11-instructional-successor-glossary-v1.json');
const terms = sourceGlossary.existingLessonReconciliation.mergedGlossaryEntries;
assert.equal(terms.length, 43);
const bAudit = await readJson('catalog/g678-alg-l11-behavior10-tranche-b-audit-v1.json');
const vectors = new Map();
for (const id of IDS) {
  const n = Number(id.slice(-3));
  if (n <= 25) vectors.set(id, await readJson(`work/g678-shared-page-factory/g678-alg-l11-tranche-a-vector-bundles-v${[6,9,10].includes(n) ? 4 : 6}/${id}.json`));
  else if (![33,34,44].includes(n)) vectors.set(id, await readJson(`work/g678-shared-page-factory/g678-alg-l11-b-instructional-visuals-v${n >= 40 ? 4 : 3}/${id}/vector-bundle.json`));
}
async function generatedData(file) {
  const text = await readFile(path.join(ROOT, file), 'utf8');
  return JSON.parse(text.slice(text.indexOf('= ') + 2).replace(/ as const;\s*$/u, ''));
}
const dData = await generatedData('packages/demos/src/generated/g678-alg-l11-tranche-d-instructional-visuals-v1.ts');
const controller = await generatedData('packages/demos/src/generated/g678-alg-l11-p033-instructional-sequence-v1.ts');
await mkdir(out);
await save('inputs.json', json(inputs));
await save('qa-runner-source.mjs', await readFile(fileURLToPath(import.meta.url)));
const records = [], network = [], errors = [];
const evidence = {artifactType: 'g678-alg-l11-successor-real-my-lesson-route-qa-v1',
  generatedAt: new Date().toISOString(), output: OUTPUT, baseUrl: BASE, inputs,
  scope: PROBE_ONLY ? 'first-real-footer-replay-probe-only' : GUIDED_ONLY ? 'p040-source-guided-stops-only'
    : 'exact23-desktop-mobile-plus-representative-product-host-flows',
  boundary: 'official-activated-loader-real-source-ordered-descriptor-modern-lesson-host; no test loader, module injection or browser state fixture',
  records, network, errors, productCalibrationPassed: false, engineeringPreviewReady: false,
  authoritativeOriginalRuntime: false, audioAccepted: false, visualFidelityAccepted: false,
  humanVisualAccepted: false, ownerAccepted: false, strictComplete: false, releaseEligible: false, published: false,
  remainingBlockers: ['source-audio-lifecycle-and-listening-acceptance-pending',
    'typed-memory-host-fq-score-and-reset-not-implemented-in-this-frozen-successor',
    'full-original-runtime-fidelity-and-human-owner-acceptance-pending']};
const browser = await chromium.launch({headless: true});
evidence.browser = {version: browser.version(), executable: await binding(chromium.executablePath())};

function root(page, id) {
  const n = Number(id.slice(-3));
  const marker = n <= 25 ? [6,9,10].includes(n) ? '[data-a-special-source-visual]' : '[data-instructional-successor]'
    : [33,34,44].includes(n) ? '[data-source-content-successor]' : '[data-vector-successor]';
  return page.locator(`${STAGE} ${marker}[data-animation-id="${id}"]`);
}
async function snapshot(page) {
  return page.evaluate(({HOST, RUNTIME, STAGE}) => {
    const host = document.querySelector(HOST), runtime = document.querySelector(RUNTIME), stage = document.querySelector(STAGE);
    return {active: host?.getAttribute('data-current-animation-id'), ordinal: host?.getAttribute('data-current-page'),
      hydrated: host?.getAttribute('data-hydrated'), frame: Number(stage?.getAttribute('data-flash-frame')),
      domain: stage?.getAttribute('data-flash-frame-domain'), scenario: stage?.getAttribute('data-runtime-scenario'),
      module: stage?.getAttribute('data-animation-module'), paused: runtime?.getAttribute('data-runtime-paused'),
      held: runtime?.getAttribute('data-runtime-interactive-stop-held'), resolved: runtime?.getAttribute('data-runtime-interactive-stop-resolved-count'),
      complete: runtime?.getAttribute('data-runtime-playback-complete'), replay: runtime?.getAttribute('data-runtime-replay'),
      hostFeedback: host?.getAttribute('data-lesson-host-practice-feedback-active'),
      phase: document.querySelector(`${STAGE} [data-vector-successor]`)?.getAttribute('data-phase'),
      explanationFrame: document.querySelector(`${STAGE} [data-vector-successor]`)?.getAttribute('data-explanation-child-frame'),
      hostScore: {attempted: host?.getAttribute('data-lesson-host-fq-attempted'), correct: host?.getAttribute('data-lesson-host-fq-correct')},
      bodyWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth,
      reducedMotionNote: (() => {const note = document.querySelector(`${RUNTIME} .reduced-motion-note`);
        if (!note) return null; const box = note.getBoundingClientRect(); const source = stage?.getBoundingClientRect();
        return {text: note.textContent, box: {x: box.x, y: box.y, width: box.width, height: box.height},
          overlapsStage: Boolean(source && box.width * box.height > 10 && box.left < source.right && box.right > source.left && box.top < source.bottom && box.bottom > source.top)};})(),
      unexpectedTestLoader: Boolean(document.querySelector('[data-test-loader]'))};
  }, {HOST, RUNTIME, STAGE});
}
async function ready(page, id, motion = 'reduce') {
  await page.waitForFunction(({host, stage, id}) => document.querySelector(host)?.getAttribute('data-hydrated') === 'true' &&
    document.querySelector(host)?.getAttribute('data-current-animation-id') === id &&
    document.querySelector(stage)?.getAttribute('data-animation-module') === id, {host: HOST, stage: STAGE, id});
  if (IDS.includes(id)) {await root(page, id).waitFor(); assert.equal(await root(page, id).count(), 1);}
  if (IDS.includes(id) && motion === 'reduce') {
    const runtime = pages.get(id).runtime;
    const firstStop = runtime.interactiveStops.filter(stop => stop.frameDomain === runtime.frameDomain)
      .sort((left, right) => left.stopFrame - right.stopFrame)[0];
    // The runtime holds at the first unresolved source stop, even when the
    // requested reduced-motion frame lies later. It must not skip a game/quiz.
    const frame = Math.min(runtime.reducedMotionFrame, firstStop?.stopFrame ?? runtime.reducedMotionFrame);
    await page.waitForFunction(({stage, frame}) =>
      Number(document.querySelector(stage)?.getAttribute('data-flash-frame')) === frame, {stage: STAGE, frame});
  }
  const s = await snapshot(page);
  assert.equal(s.unexpectedTestLoader, false);
  assert.equal(s.active, id);
  if (IDS.includes(id)) {assert.equal(s.domain, pages.get(id).runtime.frameDomain); assert.equal(s.scenario, pages.get(id).runtime.scenario);}
  return s;
}
async function activate(page, locator, input = 'mouse') {
  await locator.waitFor({state: 'visible'});
  assert.equal(await locator.count(), 1, 'Source control missing or ambiguous');
  assert.notEqual(await locator.getAttribute('aria-disabled'), 'true');
  assert.equal(await locator.isDisabled(), false);
  if (input === 'mouse') await locator.click(); else {await locator.focus(); await page.keyboard.press(input);}
}
const ui = (page, key) => page.locator(`${HOST} button[data-responsive-focus-key="${key}"]:visible`).first();
async function shot(page, name) {const bytes = await page.screenshot({fullPage: true});
  await save(`${name}.png`, bytes); return {path: `${OUTPUT}/${name}.png`, bytes: bytes.length, sha256: hash(bytes)};}
async function hostReplay(page, id, motion = 'reduce') {
  const prior = await page.locator(STAGE).elementHandle();
  await activate(page, ui(page, 'replay'));
  await page.waitForFunction(element => !element.isConnected, prior);
  await prior.dispose();
  const state = await ready(page, id, motion); assert.equal(state.hostFeedback, 'false');
  assert.equal(state.resolved, '0'); return state;
}
async function courseMap(page, id) {
  const button = page.locator(`${HOST} button[data-course-map-trigger]:visible`).first();
  if (await button.getAttribute('aria-expanded') !== 'true') await button.click();
  const mapId = await button.getAttribute('aria-controls');
  assert.ok(mapId?.endsWith('-course-map'));
  const map = page.locator(`${HOST} [id="${mapId}"] .lesson-shell2__map-content`).first();
  await map.waitFor({state: 'visible'});
  const rows = await map.locator('button[data-placement-id]').evaluateAll(nodes => nodes.map(n =>
    ({id: n.getAttribute('data-placement-id'), available: n.getAttribute('data-renderer-availability')})));
  assert.deepEqual(rows.map(row => row.id), Array.from({length: 44}, (_, i) => `shared-alg001-l11-p${String(i + 1).padStart(3, '0')}`));
  assert.ok(rows.every(row => row.available === 'registered'));
  const close = page.locator(`${HOST} [data-course-map-close-control]:visible`);
  if (await close.count()) await close.first().click(); else await button.click();
  assert.equal((await snapshot(page)).active, id); return rows;
}
async function compareSvg(page, locator, expected, name) {
  assert.equal(await locator.count(), 1, `${name}: expected one actual SVG`);
  const result = await locator.evaluate((svg, expected) => {
    const document = new DOMParser().parseFromString(expected, 'image/svg+xml');
    if (document.querySelector('parsererror')) throw Error('Expected source SVG cannot parse');
    const tree = node => node.nodeType === 3 ? node.textContent.trim() || null : node.nodeType === 1 ? {
      tag: node.localName,
      attrs: [...node.attributes].map(a => [a.name.toLowerCase(), a.value]).filter(([key]) => !key.startsWith('xmlns')).sort(([a], [b]) => a.localeCompare(b)),
      children: [...node.childNodes].map(tree).filter(v => v !== null),
    } : null;
    const children = n => [...n.childNodes].map(tree).filter(v => v !== null);
    const box = svg.getBoundingClientRect();
    const viewport = element => Object.fromEntries(['viewBox', 'width', 'height', 'preserveAspectRatio'].map(key => [key, element.getAttribute(key)]));
    return {actual: children(svg), expected: children(document.documentElement), html: svg.outerHTML,
      actualViewport: viewport(svg), expectedViewport: viewport(document.documentElement),
      primitiveCount: svg.querySelectorAll('path,text,line,polyline,polygon,circle,ellipse,rect,image,use').length,
      box: {x: box.x, y: box.y, width: box.width, height: box.height}};
  }, expected);
  assert.deepEqual(result.actual, result.expected, `${name}: actual source SVG projection differs`);
  for (const [key, expectedValue] of Object.entries(result.expectedViewport)) if (expectedValue !== null)
    assert.equal(result.actualViewport[key], expectedValue, `${name}: source ${key} projection differs`);
  assert.ok(result.primitiveCount > 0 && result.box.width > 0 && result.box.height > 0);
  await save(`${name}.svg`, result.html);
  return {path: `${OUTPUT}/${name}.svg`, bytes: Buffer.byteLength(result.html), sha256: hash(result.html),
    primitiveCount: result.primitiveCount, box: result.box};
}
async function visibleContent(page, id, name) {
  const n = Number(id.slice(-3)), element = root(page, id), state = await snapshot(page);
  const proofs = [];
  if (n <= 25) {
    const v = vectors.get(id), body = v.frameBodies[v.frameBodyIndices[state.frame - 1]];
    let clarification = n === 8 && state.frame === 68 ? '<line data-maintained-diagram-clarification="open-interval-negative3-positive3" aria-label="The interval between −3 and 3, excluding both endpoints" stroke="#000" stroke-linecap="butt" stroke-width="1.5" x1="436.10" x2="553.00" y1="282.95" y2="282.95"></line>' : '';
    proofs.push(await compareSvg(page, element.locator('[data-instructional-layer="source-vectors"] > svg').first(),
      wrap(`<defs>${v.definitions.join('')}</defs><g>${v.rootBody}${body}</g>${clarification}`), `${name}-main`));
    assert.equal(await element.locator('[data-source-swf-sha256]').getAttribute('data-source-swf-sha256'), pages.get(id).sourceSha256);
  } else if (![33,34,44].includes(n)) {
    const v = vectors.get(id), body = v.frameBodies[v.frameBodyIndices[state.frame - 1]];
    proofs.push(await compareSvg(page, element.locator('[aria-label="Source instructional animation"] > svg'),
      wrap(`<defs>${v.definitions.join('')}</defs><rect width="800" height="600" fill="${v.stage.background}"/>${v.rootBody}${body}`), `${name}-main`));
  } else if (n === 33) {
    const frame = controller.frames[state.frame - 1];
    assert.equal(await element.getAttribute('data-source-frame-sha256'), frame.sha256);
    proofs.push(await compareSvg(page, element.locator('[role="img"][aria-label^="Source game instructions"] > svg'),
      wrap(`<defs>${controller.definitions}</defs>${frame.group}`), `${name}-main`));
  } else if (n === 34) {
    const level = Number(await element.locator('[data-source-level]').getAttribute('data-source-level'));
    const cards = dData.cards.filter(c => c.level === level);
    assert.equal(cards.length, 12);
    for (const card of cards) proofs.push(await compareSvg(page,
      element.locator(`[data-source-card-id="${card.id}"] [data-source-vector-sha256="${card.visual.sha256}"] > svg`), card.visual.svg,
      `${name}-${card.id}`));
  } else {
    const q = Number((await element.locator('[data-source-question]').getAttribute('data-source-question')).slice(1));
    const question = dData.questions[q - 1];
    for (const [label, art] of [['prompt', question.prompt], ...question.choices.map(c => [`option-${c.option}`, c.visual])])
      proofs.push(await compareSvg(page, element.locator(`[data-source-vector-sha256="${art.sha256}"] > svg`), art.svg, `${name}-q${q}-${label}`));
  }
  return {state, sourceAssetId: pages.get(id).assetId, sourceSha256: pages.get(id).sourceSha256, proofs};
}
async function glossary(page, id, locale, record, prefix) {
  await activate(page, root(page, id).getByRole('button', {name: 'Define Solve', exact: true}));
  const overlay = page.locator(`${HOST} [data-glossary-entry-id="solve"]`);
  await overlay.waitFor();
  const solve = terms.find(e => e.id === 'solve');
  assert.equal(await overlay.locator('h2').innerText(), solve.labels[locale]);
  assert.ok((await overlay.innerText()).includes(solve.definitions[locale]));
  assert.equal(await overlay.getAttribute('data-source-sha256'), solve.source[locale].sha256);
  await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('data-runtime-paused') === 'true', RUNTIME);
  const before = await snapshot(page); await page.waitForTimeout(180); assert.equal((await snapshot(page)).frame, before.frame);
  record.glossary = {entryId: 'solve', locale, definition: solve.definitions[locale], pausedFrame: before.frame,
    screenshot: await shot(page, `${prefix}-glossary-${locale}`)};
  await activate(page, overlay.getByRole('button', {name: locale === 'es' ? 'Cerrar y continuar' : 'Close and continue', exact: true}), 'Enter');
  await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('data-runtime-paused') === 'false', RUNTIME);
  await activate(page, ui(page, 'key-terms'));
  const panel = page.locator(`${HOST} [data-key-terms-authority="source-bound-g678-bilingual-keyterms-xml"]:visible`);
  await panel.waitFor();
  const entries = await panel.locator('dl > div').evaluateAll(nodes => nodes.map(n => ({label: n.querySelector('dt')?.textContent, definition: n.querySelector('dd')?.textContent})));
  assert.equal(entries.length, 43);
  // Distinct source IDs may share a translated label (Spanish "Expresión"
  // names both expression and sentence). Compare complete rows with counts.
  const ordered = rows => [...rows].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  assert.deepEqual(ordered(entries), ordered(terms.map(entry => ({label: entry.labels[locale], definition: entry.definitions[locale]}))));
  const text = await panel.innerText(); assert.ok(text.includes('43')); assert.ok(text.includes(locale === 'es' ? 'L1KTS01.xml' : 'L1KTE01.xml'));
  assert.ok(!/VB003|ELKTEG4|ELKTSG4/u.test(text));
  record.keyTerms = {locale, entries, screenshot: await shot(page, `${prefix}-keyterms-${locale}`)};
  await page.getByRole('button', {name: locale === 'es' ? 'Cerrar herramienta' : 'Close tool', exact: true}).click();
}
async function choices(page, id, record) {
  const element = root(page, id), n = Number(id.slice(-3));
  const a = n <= 25, v = vectors.get(id), source = bAudit.members.find(m => m.animationId === id);
  const correct = a ? v.choiceControls.find(c => c.correct).slot : source.answerVisibleGeometryCrosswalk.correct.visibleLabel;
  const wrong = a ? v.choiceControls.find(c => !c.correct).slot : source.answerVisibleGeometryCrosswalk.rows.find(c => !c.correct).visibleLabel;
  const hit = label => a ? element.locator(`polygon[data-choice-slot="${label}"]`) : element.getByRole('button', {name: `Answer ${label}`, exact: true});
  await activate(page, hit(wrong));
  await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('data-lesson-host-practice-feedback-active') === 'true', HOST);
  record.wrong = await snapshot(page); assert.equal(record.wrong.held, 'true');
  record.feedbackScreenshot = await shot(page, `${record.name}-feedback`);
  await activate(page, element.getByRole('button', {name: 'Try again', exact: true}), 'Enter');
  await activate(page, hit(correct), 'Space');
  await activate(page, element.getByRole('button', {name: 'Continue', exact: true}));
  await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('data-runtime-interactive-stop-held') === 'false', RUNTIME);
  record.correct = await snapshot(page); assert.equal(record.correct.hostFeedback, 'false');
  await hostReplay(page, id);
  await activate(page, hit(wrong));
  await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('data-lesson-host-practice-feedback-active') === 'true', HOST);
  record.activeFeedbackReplay = await hostReplay(page, id);
}
async function specialChoice(page, record) {
  const element = root(page, 'shared-alg001-l11-p006');
  await activate(page, element.getByRole('button', {name: '10y⁵', exact: true}));
  await element.locator('[data-source-control-id="BtnClose"]').waitFor();
  record.wrong = await snapshot(page); assert.equal(record.wrong.hostFeedback, 'true');
  await activate(page, element.getByRole('button', {name: 'Close explanation', exact: true}), 'Enter');
  await activate(page, element.getByRole('button', {name: 'x ≥ 5', exact: true}), 'Space');
  await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('data-runtime-interactive-stop-held') === 'false', RUNTIME);
  record.correct = await snapshot(page); assert.equal(record.correct.hostFeedback, 'false');
}
async function matching(page, record) {
  const id = 'shared-alg001-l11-p034', element = root(page, id);
  const level = Number(await element.locator('[data-source-level]').getAttribute('data-source-level'));
  const cards = dData.cards.filter(c => c.level === level);
  const first = cards[0], wrong = cards.find(c => c.pairId !== first.pairId);
  for (const c of [first, wrong]) await activate(page, element.locator(`[data-source-card-id="${c.id}"]`));
  await element.locator('[data-feedback-phase="wrong-feedback"]').waitFor();
  await activate(page, element.getByRole('button', {name: 'Continue', exact: true}));
  for (let pair = 1; pair <= 6; pair++) {
    const matches = cards.filter(c => c.pairId === pair);
    assert.equal((await snapshot(page)).held, 'true');
    for (const [i, card] of matches.entries()) await activate(page, element.locator(`[data-source-card-id="${card.id}"]`), i ? 'Enter' : 'mouse');
    await element.locator('[data-feedback-phase="correct-feedback"]').waitFor();
    await activate(page, element.getByRole('button', {name: 'Continue', exact: true}));
  }
  await element.locator('[data-feedback-phase="complete"]').waitFor();
  await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('data-runtime-interactive-stop-held') === 'false', RUNTIME);
  record.completedLevel = level; record.completed = await snapshot(page);
  record.resultScreenshot = await shot(page, `${record.name}-matching-result`);
  await hostReplay(page, id); await element.locator('[data-feedback-phase="choosing"]').waitFor();
}
async function quiz(page, record) {
  const element = root(page, 'shared-alg001-l11-p044');
  const selection = await element.locator('[data-random-selection]').getAttribute('data-random-selection');
  for (let i = 0; i < 10; i++) {
    assert.equal((await snapshot(page)).held, 'true');
    const q = Number((await element.locator('[data-source-question]').getAttribute('data-source-question')).slice(1));
    const question = dData.questions[q - 1], option = i === 0 ? question.correctOption % 4 + 1 : question.correctOption;
    await activate(page, element.locator(`[data-source-instance-name="A${q}Opt${option}"]`), i % 2 ? 'Enter' : 'mouse');
  }
  await element.getByText('Score: 9 / 10', {exact: true}).waitFor();
  record.localScoreOnly = await snapshot(page); assert.equal(record.localScoreOnly.hostScore.attempted, '0');
  await activate(page, element.getByRole('button', {name: 'Review answers', exact: true}));
  assert.equal(await element.locator('[data-review-selected="true"]').count(), 1);
  assert.equal(await element.locator('[data-review-correct="true"]').count(), 1);
  record.reviewScreenshot = await shot(page, `${record.name}-quiz-review`);
  await hostReplay(page, 'shared-alg001-l11-p044');
  const replaySelection = await element.locator('[data-random-selection]').getAttribute('data-random-selection');
  assert.equal(replaySelection.split(',').length, 10);
  assert.equal(await element.getByRole('button', {name: 'Review answers', exact: true}).count(), 0);
  record.footerReplaySelection = {before: selection, after: replaySelection,
    changed: selection !== replaySelection, note: 'Footer remount reset is checked; a new random seed is not invented as a requirement.'};
}
async function guided(page, record) {
  const id = 'shared-alg001-l11-p040', element = root(page, id);
  const explanations = await readJson(`work/g678-shared-page-factory/g678-alg-l11-b-guided-explanation-vectors-v1/${id}/explanation-bundle.json`);
  const started = Date.now();
  if ((await snapshot(page)).paused === 'true') await activate(page, ui(page, 'pause'));
  const source = bAudit.members.find(m => m.animationId === id);
  record.clock = 'Actual browser wall-clock Date/performance/RAF; no clock overrides, virtual advancement, frame seek or module replacement';
  record.guidedStops = [];
  for (const [index, stop] of pages.get(id).runtime.interactiveStops.slice(0, 4).entries()) {
    await page.waitForFunction(({stage, runtime, frame}) => Number(document.querySelector(stage)?.getAttribute('data-flash-frame')) === frame &&
      document.querySelector(runtime)?.getAttribute('data-runtime-interactive-stop-held') === 'true' &&
      document.querySelector(`${stage} [data-vector-successor]`)?.getAttribute('data-phase') === 'guided-stop',
    {stage: STAGE, runtime: RUNTIME, frame: stop.stopFrame}, {timeout: 45_000});
    assert.equal((await snapshot(page)).frame, stop.stopFrame); assert.equal((await snapshot(page)).held, 'true');
    assert.equal((await snapshot(page)).phase, 'guided-stop');
    process.stdout.write(`${JSON.stringify({case: record.name, step: 'actual-wall-clock-source-stop-held', frame: stop.stopFrame})}\n`);
    const branch = explanations.branches.find(branch => branch.mainFrame === stop.stopFrame);
    if (branch) {
      await activate(page, element.getByRole('button', {name: 'Show the explanation for this answer', exact: true}));
      await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('data-explanation-child-frame') === '15',
        `${STAGE} [data-vector-successor]`, {timeout: 10_000});
      await element.getByRole('button', {name: 'Close explanation', exact: true}).waitFor();
      record.explanationScreenshots ??= [];
      record.explanationScreenshots.push({sourceBranch: branch.name, mainFrame: branch.mainFrame,
        screenshot: await shot(page, `${record.name}-guided-explanation-${stop.stopFrame}`)});
      await activate(page, element.getByRole('button', {name: 'Close explanation', exact: true}), 'Enter');
      await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('data-explanation-child-frame') === 'none',
        `${STAGE} [data-vector-successor]`, {timeout: 10_000});
      assert.equal((await snapshot(page)).explanationFrame, 'none');
      assert.equal((await snapshot(page)).phase, 'guided-stop');
    }
    const authored = element.getByRole('button', {name: 'Continue the guided solution', exact: true});
    await activate(page, await authored.count() ? authored : element.locator('[data-maintained-empty-source-hit-adapter]'));
    await page.waitForFunction(({selector, count}) => Number(document.querySelector(selector)?.getAttribute('data-runtime-interactive-stop-resolved-count')) === count,
      {selector: RUNTIME, count: index + 1}, {timeout: 10_000});
    const resolved = await snapshot(page);
    assert.equal(Number(resolved.resolved), index + 1, `Source guided stop ${stop.stopFrame} was not resolved by its actual control`);
    record.guidedStops.push({sourceStop: stop.stopFrame, state: resolved});
    process.stdout.write(`${JSON.stringify({case: record.name, step: 'actual-source-control-resolved', frame: stop.stopFrame, resolved: index + 1})}\n`);
  }
  const frame = source.sourceStateMachine.quizFrame;
  await page.waitForFunction(({stage, runtime, frame}) => Number(document.querySelector(stage)?.getAttribute('data-flash-frame')) === frame &&
    document.querySelector(runtime)?.getAttribute('data-runtime-interactive-stop-held') === 'true' &&
    document.querySelector(`${stage} [data-vector-successor]`)?.getAttribute('data-phase') === 'choosing',
  {stage: STAGE, runtime: RUNTIME, frame}, {timeout: 15_000});
  assert.equal((await snapshot(page)).frame, frame);
  assert.equal((await snapshot(page)).held, 'true'); assert.equal((await snapshot(page)).phase, 'choosing');
  record.finalQuiz = await snapshot(page); record.finalQuizScreenshot = await shot(page, `${record.name}-guided-final-quiz`);
  record.wallClockElapsedMs = Date.now() - started;
}

async function runCase(name, id, viewport, motion, locale, exercise) {
  const context = await browser.newContext({viewport, reducedMotion: motion, serviceWorkers: 'block'});
  const page = await context.newPage(); page.setDefaultTimeout(20_000);
  const record = {name, animationId: id, viewport, motion, locale, status: 'running', requests: [], errors: []}; records.push(record);
  page.on('pageerror', error => record.errors.push(error.message));
  page.on('console', message => {if (message.type() === 'error') record.errors.push(message.text());});
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    const allowed = url.origin === BASE && ['GET', 'HEAD', 'POST'].includes(request.method()) &&
      (/^\/(?:(?:en|es)\/)?migration-status\/g678-calibration\/shared-alg001-l11-p\d{3}$/u.test(url.pathname) ||
        url.pathname.startsWith('/_next/') || url.pathname.startsWith('/flash-assets/') ||
        url.pathname === '/favicon.ico' || url.pathname === '/learning-theme-bootstrap.js' ||
        url.pathname === '/__nextjs_original-stack-frames');
    const row = {case: name, url: request.url(), method: request.method(), allowed}; network.push(row); record.requests.push(row);
    if (!allowed) {errors.push(`Blocked unexpected request: ${request.method()} ${request.url()}`); return route.abort();}
    return route.continue();
  });
  await context.routeWebSocket('**/*', socket => {
    const url = new URL(socket.url()), allowed = url.origin === 'ws://127.0.0.1:3324' && url.pathname.startsWith('/_next/');
    const row = {case: name, url: socket.url(), method: 'WEBSOCKET', allowed}; network.push(row); record.requests.push(row);
    if (!allowed) {errors.push(`Blocked unexpected WebSocket: ${socket.url()}`); socket.close();}
    else socket.connectToServer();
  });
  page.on('response', response => {if (response.status() >= 400) record.errors.push(`HTTP ${response.status()} ${response.url()}`);});
  try {
    const response = await page.goto(`${BASE}/${locale}/migration-status/g678-calibration/${id}`, {waitUntil: 'domcontentloaded'});
    assert.equal(response.status(), 200);
    record.ready = await ready(page, id, motion);
    if (motion === 'no-preference' && record.ready.paused !== 'true') {
      await activate(page, ui(page, 'pause'));
      await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('data-runtime-paused') === 'true', RUNTIME);
    }
    assert.equal(record.ready.bodyWidth <= viewport.width + 2, true, 'Page has horizontal overflow');
    record.sourceContent = await visibleContent(page, id, name);
    record.screenshot = await shot(page, name);
    if (exercise) await exercise(page, record);
    assert.deepEqual(record.errors, []); assert.ok(record.requests.every(request => request.allowed));
    record.status = 'passed'; record.final = await snapshot(page);
  } catch (error) {
    record.status = 'failed'; record.error = error.stack ?? String(error);
    record.failureState = await snapshot(page).catch(() => null);
    record.failureScreenshot = await shot(page, `${name}-failure`).catch(() => null);
    await save(`${name}-failure.html`, await page.content().catch(() => ''));
  } finally {await save(`${name}.json`, json(record)); await context.close();
    process.stdout.write(`${JSON.stringify({case: name, status: record.status, error: record.error?.split('\n')[0]})}\n`);}
  if (record.status !== 'passed') throw Error(`Stopped at first failed boundary: ${name}`);
  return record;
}
try {
  if (GUIDED_ONLY) {
    await runCase('desktop-p040-natural-guided', 'shared-alg001-l11-p040', {width: 1440, height: 1000}, 'no-preference', 'en', guided);
  } else {
  const first = await runCase('first-p026-real-footer-replay-probe', 'shared-alg001-l11-p026', {width: 1440, height: 1000}, 'reduce', 'en', async (page, record) => {
    const id = 'shared-alg001-l11-p026';
    const source = bAudit.members.find(m => m.animationId === id);
    const wrong = source.answerVisibleGeometryCrosswalk.rows.find(c => !c.correct).visibleLabel;
    await activate(page, root(page, id).getByRole('button', {name: `Answer ${wrong}`, exact: true}));
    await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('data-lesson-host-practice-feedback-active') === 'true', HOST);
    record.feedbackBeforeActualFooterReplay = await snapshot(page);
    record.actualFooterReplay = await hostReplay(page, id);
  });
  assert.equal(first.status, 'passed', 'First actual My Lesson footer-Replay probe failed; preserve evidence and stop for coordinator diagnosis');
  if (!PROBE_ONLY) {
  for (const [layout, viewport] of [['desktop', {width: 1440, height: 1000}], ['mobile', {width: 390, height: 844}]]) {
    const routeOrder = ['shared-alg001-l11-p009', ...IDS.filter(id => id !== 'shared-alg001-l11-p009')];
    for (const id of routeOrder) await runCase(`${layout}-${id}`, id, viewport, 'reduce', 'en', async (page, record) => {
      record.courseMap = await courseMap(page, id);
      const n = Number(id.slice(-3));
      await activate(page, ui(page, 'previous')); await ready(page, `shared-alg001-l11-p${String(n - 1).padStart(3, '0')}`);
      await activate(page, ui(page, 'next')); await ready(page, id);
      record.hostReplay = await hostReplay(page, id);
      if ([6,8,26,34,44].includes(n)) {
        await activate(page, ui(page, 'pause'));
        await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('data-runtime-paused') === 'true', RUNTIME);
        record.paused = await snapshot(page);
        const controls = await root(page, id).locator('button,[role="button"]').evaluateAll(nodes => nodes.filter(e => e.getBoundingClientRect().width > 0)
          .map(e => ({name: e.getAttribute('aria-label') ?? e.textContent, disabled: e.hasAttribute('disabled') || e.getAttribute('aria-disabled') === 'true'})));
        assert.ok(controls.every(control => control.disabled), 'A source control remained enabled while the actual host was paused');
        record.pausedControls = controls;
        await activate(page, ui(page, 'pause'));
        await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('data-runtime-paused') === 'false', RUNTIME);
      }
      if (id.endsWith('p008') || id.endsWith('p026')) await choices(page, id, record);
      if (id.endsWith('p006')) await specialChoice(page, record);
      if (id.endsWith('p009')) await glossary(page, id, 'en', record, record.name);
      if (id.endsWith('p033')) {
        await activate(page, root(page, id).getByRole('button', {name: 'Level 2', exact: true}), 'Space');
        await activate(page, root(page, id).getByRole('button', {name: 'Start', exact: true}), 'Enter');
        await ready(page, 'shared-alg001-l11-p034');
        assert.equal(await root(page, 'shared-alg001-l11-p034').locator('[data-source-level]').getAttribute('data-source-level'), '2');
        record.actualHostHandoff = await snapshot(page);
      }
      if (id.endsWith('p034')) await matching(page, record);
      if (id.endsWith('p044')) await quiz(page, record);
    });
    await runCase(`${layout}-spanish-glossary`, 'shared-alg001-l11-p009', viewport, 'reduce', 'es',
      async (page, record) => {
        await glossary(page, 'shared-alg001-l11-p009', 'es', record, record.name);
        const before = await snapshot(page);
        const link = page.locator(`${HOST} a[data-responsive-focus-key="language-en"]:visible`).first();
        await link.waitFor(); const href = await link.getAttribute('href'), target = new URL(href, BASE);
        assert.equal(target.origin, BASE); assert.ok(/^\/(?:en\/)?migration-status\/g678-calibration\/shared-alg001-l11-p\d{3}$/u.test(target.pathname));
        await link.click(); await page.waitForURL(url => url.pathname === target.pathname);
        await page.waitForFunction(host => document.querySelector(host)?.getAttribute('data-hydrated') === 'true', HOST);
        await page.locator(`${HOST} a[data-modern-language-switch][data-responsive-focus-key="language-es"]:visible`).waitFor();
        record.languageSwitch = {before, declaredHref: href, landingUrl: page.url(), landing: await snapshot(page),
          boundary: 'Actual reviewer control navigation observed; preserving p009 is not asserted or inferred.',
          screenshot: await shot(page, `${record.name}-language-switch-landing`)};
      });
  }
  await runCase('desktop-p040-natural-guided', 'shared-alg001-l11-p040', {width: 1440, height: 1000}, 'no-preference', 'en', guided);
  }
  }
} finally {
  await browser.close();
  evidence.inputsUnchanged = JSON.stringify(await Promise.all(inputFiles.map(binding))) === JSON.stringify(inputs);
  evidence.status = records.length === (PROBE_ONLY || GUIDED_ONLY ? 1 : 50) && records.every(record => record.status === 'passed') && errors.length === 0 && evidence.inputsUnchanged
    ? PROBE_ONLY ? 'real-footer-replay-probe-passed-full-route-qa-not-run' : GUIDED_ONLY ? 'real-guided-route-probe-passed-full-route-qa-not-run'
      : 'real-my-lesson-route-checks-passed-with-independent-gates-pending'
    : 'failed-preserved-for-diagnosis';
  await save('evidence.json', json(evidence));
}
process.stdout.write(`${JSON.stringify({output: OUTPUT, status: evidence.status, passed: records.filter(r => r.status === 'passed').length,
  failed: records.filter(r => r.status === 'failed').length, productCalibrationPassed: false})}\n`);
if (evidence.status.startsWith('failed')) process.exitCode = 1;
