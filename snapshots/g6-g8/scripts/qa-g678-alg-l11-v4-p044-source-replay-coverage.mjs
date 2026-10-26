#!/usr/bin/env node
// Supplemental actual Q10/Q24 and bounded all24 coverage, using source Replay only.
// Local engineering QA only. Requires a separate coordinator V4 activation/server GO.
// No injected loader/host/state/clock, forced click, hidden-overflow scrolling, or audio opt-in.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SELF = 'scripts/qa-g678-alg-l11-v4-p044-source-replay-coverage.mjs';
const BASE = 'http://127.0.0.1:3324';
const HOST = '[data-lesson-player][data-current-animation-id]';
const RUNTIME = `${HOST} .runtime-shell[data-runtime-transport]`;
const STAGE = `${HOST} .runtime-stage[data-animation-module]`;
const CAL = 'catalog/product-bridge-calibrations/';
const V4 = `${CAL}g678-current-js-377-page-registration-v4`;
const REGISTRY = 'packages/demos/private-current-js-registry.json';
const COMPANION = `${CAL}g678-alg-l11-two-page-companion-successor-v1.fragment.json`;
const RUN = 'work/g678-shared-page-factory/g678-alg-l11-two-page-companion-successor-v1/run-manifest.json';
const GLOSSARY = 'catalog/g678-alg-l11-instructional-successor-glossary-v1.json';
const PINS = Object.freeze({
  [COMPANION]: '85bee4ae75e8e316d774e2c8097bf346633932be8916f28691c6bd011b66843a',
  [RUN]: 'c10c543e107f6b8688cb250f131f332f4cbcbc7110bc4f9581f1aa0b77bc75e8',
  'catalog/g678-alg-l11-p034-companion-candidate-v1.json': '870b69564a97ec18cd4d1e20e214336d7cb40e2fbef1f96c2d3c59c3ff7d720a',
  'catalog/g678-alg-l11-p044-companion-candidate-v1.json': '6ed521391b2a770dcb010383162811485e840fdb58e902ea973b977f221f7fb8',
  [GLOSSARY]: 'e213b095f0ebebad447162ebdd94bc07e95bfeb6f31f8705db5f6ac0c37efc88',
});
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => `${JSON.stringify(value, null, 2)}\n`;
const readJson = async file => JSON.parse(await readFile(path.resolve(ROOT, file), 'utf8'));
const binding = async file => {const bytes = await readFile(path.resolve(ROOT, file));
  return {path: file, bytes: bytes.length, sha256: hash(bytes)};};
const pageId = number => `shared-alg001-l11-p${String(number).padStart(3, '0')}`;
const rootSelector = number => `${STAGE} [data-p0${number}-companion-successor="v1"]`;
const treeSelector = number => `${HOST} [data-p0${number}-action-tree="true"]`;
const ui = (page, key) => page.locator(`${HOST} button[data-responsive-focus-key="${key}"]:visible`).first();

export const MAX_ROUNDS = 12;
export const CASES = Object.freeze([
  {name: 'p044-370-en-source-replay', number: 44, locale: 'en', width: 370, height: 844, touch: true, motion: 'reduce', kind: 'source-replay-coverage'},
  {name: 'p044-1440-es-source-replay', number: 44, locale: 'es', width: 1440, height: 1000, touch: false, motion: 'no-preference', kind: 'source-replay-coverage'},
]);
export const CONTROL_MATRIX = Object.freeze({scope: 'Supplemental source Replay and normal answering/review only; previous V2 support matrix is not retested here.'});
export function observedCoverage(answered, reviewed) {
  const unique = values => {for (const value of values) assert.ok(Number.isSafeInteger(value) && value >= 1 && value <= 24);
    return [...new Set(values)].sort((a, b) => a - b);};
  const a = unique(answered), r = unique(reviewed), all = Array.from({length: 24}, (_, i) => i + 1);
  return {answered: a, reviewed: r, missingAnswering: all.filter(q => !a.includes(q)),
    missingReview: all.filter(q => !r.includes(q)), targetAnswering: [10, 24].filter(q => a.includes(q)),
    targetReview: [10, 24].filter(q => r.includes(q)), all24ObservedAndReviewed: a.length === 24 && r.length === 24};
}
export function viewportCapacity(viewportHeight, chromeBottom) {
  assert.ok(Number.isFinite(viewportHeight) && viewportHeight > 0 && Number.isFinite(chromeBottom) && chromeBottom >= 0);
  const top = Math.ceil(chromeBottom) + 16, height = viewportHeight - top - 24;
  assert.ok(height >= 100, 'Visible fixed/sticky chrome leaves no bounded target viewport');
  return {top, height};
}
export function parseArgs(args) {
  const values = {};
  for (let index = 0; index < args.length; index += 2) {
    assert.ok(['--run', '--registry-sha256', '--freeze-sha256', '--fragment-sha256', '--activation-sha256', '--only-case'].includes(args[index]), `Unknown argument ${args[index]}`);
    assert.equal(values[args[index]], undefined, 'Duplicate argument');
    assert.ok(args[index + 1], 'Missing argument value'); values[args[index]] = args[index + 1];
  }
  assert.match(values['--run'] ?? '', /^[a-z0-9-]+$/u);
  for (const key of ['registry', 'freeze', 'fragment', 'activation']) assert.match(values[`--${key}-sha256`] ?? '', /^[a-f0-9]{64}$/u);
  if (values['--only-case']) assert.ok(CASES.some(c => c.name === values['--only-case']), 'Unknown bounded case');
  return values;
}
export function networkAllowed(raw, websocket = false) {
  const url = new URL(raw);
  if (websocket) return url.origin === 'ws://127.0.0.1:3324' && url.pathname.startsWith('/_next/');
  return url.origin === BASE && (/^\/(?:en\/|es\/)?migration-status\/g678-calibration(?:\/shared-alg001-l11-p\d{3})?$/u.test(url.pathname) ||
    /^\/(?:_next\/|flash-assets\/)/u.test(url.pathname) || ['/favicon.ico', '/learning-theme-bootstrap.js', '/__nextjs_original-stack-frames'].includes(url.pathname));
}
export function assertSourceVectorCount(number, phase, count) {
  // The sealed p044 SourcePlane results branch deliberately contains text only.
  // Every question/review still requires actual source SVG subtrees.
  if (number === 44 && phase === 'results') assert.equal(count, 0);
  else assert.ok(count > 0, 'Missing instructional source SVG subtrees');
}
export function expectedSourceRating(correct) {
  assert.ok(Number.isSafeInteger(correct) && correct >= 0 && correct <= 10);
  // Exact gradeAlgL11Advanced3Assessment source boundaries. This later runner
  // maintenance does not alter the preserved V2 witness (which exercised 5/10).
  return correct <= 3 ? 'Unsatisfactory' : correct <= 6 ? 'Partially Proficient' : correct <= 8 ? 'Proficient' : 'Advanced';
}
async function generatedConstant(file, name) {
  const source = await readFile(path.join(ROOT, file), 'utf8');
  const marker = `export const ${name} = `, start = source.indexOf(marker), end = source.lastIndexOf(' as const;');
  assert.ok(start >= 0 && end > start, `Expected JSON-only generated constant: ${file}`);
  return JSON.parse(source.slice(start + marker.length, end));
}
export function validateActivatedV4({registry, fragment, freeze, activation, companion, runBinding, registryBinding}) {
  assert.equal(fragment.freeze.path, `${V4}.json`);
  assert.equal(fragment.calibration.freezeManifest, `${V4}.json`);
  assert.deepEqual(registry.calibrations.find(c => c.calibrationId === fragment.calibration.calibrationId), fragment.calibration);
  assert.equal(fragment.calibration.entries.length, 377);
  assert.equal(freeze.selectedPages.length, 377);
  assert.equal(freeze.productCalibrationPassed, false);
  assert.equal(activation.registryChanged, true);
  assert.equal(activation.registrationCount, 377);
  assert.deepEqual(activation.proposed.registry, registryBinding);
  assert.equal(activation.productCalibrationPassed ?? activation.acceptanceEffects?.productCalibrationPassed, false);
  for (const number of [34, 44]) {
    const id = pageId(number), entry = fragment.calibration.entries.find(e => e.key === id);
    const member = companion.entries.find(e => e.key === id), selected = freeze.selectedPages.find(e => e.animationId === id);
    assert.ok(entry && member && selected, `Missing V4 member ${id}`);
    assert.equal(entry.module, `./modules/g678-alg-l11-two-page-companion-successor-p0${number}`);
    assert.deepEqual(entry.artifacts.module, member.moduleFile);
    assert.deepEqual(entry.artifacts.timeline, member.timeline);
    assert.deepEqual(entry.artifacts.memberManifest, member.memberManifest);
    assert.deepEqual(entry.artifacts.sourceRun, runBinding);
    assert.deepEqual(selected.runtime.rendererBinding, entry.artifacts);
    const {rendererBinding, ...runtime} = selected.runtime;
    assert.deepEqual(runtime, member.runtimeContract);
    assert.equal(selected.sourceSha256, member.source.sha256);
    assert.equal(selected.assetId, `swf-${member.source.sha256}`);
    assert.equal(selected.productCalibrationPassed, false);
    assert.ok(JSON.stringify(selected).includes(`alg-l11-p0${number}-math-companion`), 'V4 page has no exact companion descriptor suffix');
  }
}

async function main(args) {
  const options = parseArgs(args), selectedCases = options['--only-case'] ? CASES.filter(c => c.name === options['--only-case']) : CASES;
  const output = `output/playwright/g678-alg-l11-v4-p044-source-replay-coverage-${options['--run']}`;
  const save = (name, bytes) => writeFile(path.join(ROOT, output, name), bytes, {flag: 'wx'});
  const files = new Set([SELF, 'scripts/qa-g678-alg-l11-v4-p044-source-replay-coverage.test.mjs', REGISTRY, `${V4}.json`, `${V4}.fragment.json`, `${V4}.activation.json`, ...Object.keys(PINS),
    'packages/demos/src/registry.local-only.generated.ts', 'packages/demos/src/registry.local-only.metadata.generated.ts',
    'apps/web/app/globals.css', 'apps/web/components/descriptor-driven-whole-lesson-player.tsx',
    'apps/web/components/legacy-responsive-lesson-shell.tsx', 'apps/web/components/animation-runtime.tsx',
    'apps/web/lib/load-animation-module.client.ts', 'apps/web/lib/g678-calibration-product-bridge.server.ts',
    'apps/web/lib/g678-math-companion-authority.server.ts', 'packages/demos/src/contract.ts',
    'packages/demos/src/runtime.ts', 'packages/demos/src/lesson-host-contract.ts',
    'packages/demos/src/g678-alg-l11-p033-instructional-candidate.tsx',
    'packages/demos/src/g678-alg-l11-advanced3-tranche-d-state.ts',
  ]);
  for (const [file, expected] of Object.entries(PINS)) assert.equal((await binding(file)).sha256, expected, `Sealed authority drift: ${file}`);
  for (const [key, file] of [['registry', REGISTRY], ['freeze', `${V4}.json`], ['fragment', `${V4}.fragment.json`], ['activation', `${V4}.activation.json`]])
    assert.equal((await binding(file)).sha256, options[`--${key}-sha256`], `Explicit V4 activation pin mismatch: ${file}`);
  const [registry, fragment, freeze, activation, companion, run, glossary] = await Promise.all([
    REGISTRY, `${V4}.fragment.json`, `${V4}.json`, `${V4}.activation.json`, COMPANION, RUN, GLOSSARY].map(readJson));
  validateActivatedV4({registry, fragment, freeze, activation, companion, runBinding: await binding(RUN), registryBinding: await binding(REGISTRY)});
  const checked = new Map();
  async function checkBinding(expected) {
    assert.ok(expected && typeof expected.path === 'string' && /^[a-f0-9]{64}$/u.test(expected.sha256));
    const actual = await binding(expected.path);
    assert.equal(actual.bytes, expected.bytes, `Bound byte size drift: ${expected.path}`);
    assert.equal(actual.sha256, expected.sha256, `Bound SHA drift: ${expected.path}`);
    files.add(expected.path); checked.set(expected.path, actual);
  }
  await checkBinding(fragment.freeze);
  await checkBinding(run.outputInventory);
  for (const dependency of run.codeDependencyClosure) await checkBinding(dependency);
  for (const number of [34, 44]) {
    const candidate = await readJson(`catalog/g678-alg-l11-p0${number}-companion-candidate-v1.json`);
    for (const dependency of candidate.files) await checkBinding(dependency);
    const entry = companion.entries.find(e => e.key === pageId(number));
    for (const key of ['moduleFile', 'timeline', 'memberManifest']) await checkBinding(entry[key]);
  }
  const inputFiles = [...files].sort(), inputs = await Promise.all(inputFiles.map(binding));
  const literals34 = await generatedConstant('packages/demos/src/generated/g678-alg-l11-p034-learner-math-v1.ts', 'G678_ALG_L11_P034_LEARNER_MATH');
  const literals44 = await generatedConstant('packages/demos/src/generated/g678-alg-l11-p044-literal-content-v1.ts', 'G678_ALG_L11_P044_LITERAL_CONTENT');
  const source = await generatedConstant('packages/demos/src/generated/g678-alg-l11-tranche-d-instructional-visuals-v1.ts', 'G678_ALG_L11_D_INSTRUCTIONAL_VISUALS');
  assert.equal(literals34.length, 24); assert.equal(literals44.length, 24); assert.equal(source.questions.length, 24);
  const answerKey = new Map(source.questions.map(q => [q.number, q.correctOption]));
  for (const value of answerKey.values()) assert.ok([1, 2, 3, 4].includes(value));
  const sourceVectors = new Map([...source.cards.map(c => c.visual), ...source.questions.flatMap(q => [q.prompt, ...q.choices.map(c => c.visual)])].map(v => [v.sha256, v.svg]));
  for (const [sha256, svg] of sourceVectors) assert.equal(hash(svg), sha256, 'Generated SVG custody does not match its declared SHA');
  const lessonPages = freeze.selectedPages.filter(p => p.stableLessonKey === 'shared-alg001-l11').sort((a, b) => a.globalPageOrdinal - b.globalPageOrdinal);
  // The 377-page freeze does not necessarily contain all 44 Lesson 11 pages.
  // The actual course map must nevertheless expose the full source-ordered 44.
  await mkdir(path.join(ROOT, output));
  await save('qa-runner-source.mjs', await readFile(path.join(ROOT, SELF)));
  await save('inputs.before.json', json(inputs));
  const evidence = {schemaVersion: 1, artifactType: 'actual-my-lesson-v4-p044-bounded-source-replay-question-coverage', createdAt: new Date().toISOString(),
    output, exactOrigin: BASE, requestedCases: selectedCases, expectedCaseCount: selectedCases.length, fullMatrixCount: CASES.length,
    inputs, sealedBindingsRechecked: [...checked.values()], visibleControlMatrix: CONTROL_MATRIX, maximumSourceReplayRoundsPerLayout: MAX_ROUNDS, targetQuestions: [10, 24], records: [], network: [], errors: [],
    boundary: 'Official registered V4 My Lesson only. No test loader, injected host/state, virtual clock, forced/hidden click, hidden-overflow scroll, source-audio opt-in, or external request.',
    clock: 'Actual browser wall clock; native source Replay/resampling and normal answer/review controls only. No seed or state injection.',
    localRouteQaPassed: false, productCalibrationPassed: false, authoritativeOriginalRuntime: false, visualFidelityAccepted: false,
    audioIntegratedByThisQa: false, audioAccepted: false, humanVisualAccepted: false, screenReaderHumanAccepted: false,
    ownerAccepted: false, strictComplete: false, releaseEligible: false, released: false, published: false};
  let browser, activePage, activeRecord, step = 'launch';
  const onInterrupt = () => {evidence.interrupted = true; evidence.status = 'actual-v4-p044-source-replay-coverage-interrupted';
    if (browser) void browser.close().catch(() => {});};
  process.once('SIGINT', onInterrupt);
  const screenshot = async (page, record, label) => {
    const file = `${record.name}-${String(record.screenshots.length + 1).padStart(2, '0')}-${label}.png`;
    const bytes = await page.screenshot({fullPage: true}); await save(file, bytes);
    const result = {path: `${output}/${file}`, bytes: bytes.length, sha256: hash(bytes)}; record.screenshots.push(result); return result;
  };
  const state = async page => page.evaluate(({HOST, RUNTIME, STAGE}) => {
    const host = document.querySelector(HOST), runtime = document.querySelector(RUNTIME), stage = document.querySelector(STAGE);
    const root = stage?.querySelector('[data-p034-companion-successor], [data-p044-companion-successor]');
    const attr = (node, name) => node?.getAttribute(name), num = (node, name) => Number(attr(node, name));
    return {active: attr(host, 'data-current-animation-id'), sourceId: attr(host, 'data-current-placement-id'), ordinal: num(host, 'data-current-page'),
      lang: attr(host?.querySelector('.lesson-shell2'), 'lang'), availability: attr(host, 'data-renderer-availability'),
      module: attr(stage, 'data-animation-module'), frame: num(stage, 'data-flash-frame'), domain: attr(stage, 'data-flash-frame-domain'),
      scenario: attr(stage, 'data-runtime-scenario'), mathLanguage: attr(stage, 'data-flash-lang'),
      paused: attr(runtime, 'data-runtime-paused'), held: attr(runtime, 'data-runtime-interactive-stop-held'),
      resolved: num(runtime, 'data-runtime-interactive-stop-resolved-count'), complete: attr(runtime, 'data-runtime-playback-complete'),
      replay: num(runtime, 'data-runtime-replay'), hostFeedback: attr(host, 'data-lesson-host-practice-feedback-active'),
      attempted: num(host, 'data-lesson-host-fq-attempted'), correct: num(host, 'data-lesson-host-fq-correct'),
      awarded: num(host, 'data-lesson-host-fq-points-awarded'), possible: num(host, 'data-lesson-host-fq-points-possible'),
      level: num(root, 'data-source-level'), phase: attr(root, 'data-feedback-phase') ?? attr(root, 'data-assessment-phase'),
      gate: attr(root, 'data-host-feedback-gate') ?? attr(root, 'data-host-score-gate'),
      pairs: num(root, 'data-source-completed-pair-count'), score: num(root, 'data-source-score'),
      revealing: num(root, 'data-source-revealing-pair-count'), feedbackFrame: num(root, 'data-source-feedback-frame'),
      elapsed: num(root, 'data-source-feedback-elapsed'), ack: attr(root, 'data-host-acknowledged-source-questions')?.split(',').filter(Boolean) ?? [],
      selection: attr(root, 'data-random-selection')?.split(',').filter(Boolean).map(Number) ?? [],
      question: Number(host?.querySelector('[data-p044-action-tree] [data-source-question]')?.getAttribute('data-source-question')?.slice(1)),
      testLoader: Boolean(document.querySelector('[data-test-loader]'))};
  }, {HOST, RUNTIME, STAGE});
  const waitState = (page, predicate, argument = {}, timeout = 15000) => page.waitForFunction(predicate, {HOST, RUNTIME, STAGE, ...argument}, {timeout});
  const trace = async (page, record, label) => {record.trace.push({step: label, at: new Date().toISOString(), state: await state(page)});
    console.log(json({case: record.name, step: label}).trim());};

  async function ready(page, number, locale) {
    const id = pageId(number);
    await waitState(page, ({HOST, STAGE, id}) => document.querySelector(HOST)?.getAttribute('data-hydrated') === 'true' &&
      document.querySelector(HOST)?.getAttribute('data-current-animation-id') === id &&
      document.querySelector(STAGE)?.getAttribute('data-animation-module') === id, {id});
    if ([34, 44].includes(number)) {
      await page.locator(`${rootSelector(number)}[${number === 34 ? 'data-host-feedback-gate' : 'data-host-score-gate'}="ready"]`).waitFor();
      await page.locator(`${treeSelector(number)}[data-companion-placement="portal"]`).waitFor();
    }
    const s = await state(page); assert.equal(s.testLoader, false); assert.equal(s.active, id); assert.equal(s.sourceId, id);
    assert.equal(s.availability, 'registered'); assert.equal(s.lang, locale); assert.equal(s.mathLanguage, 'en');
    const expected = lessonPages.find(p => p.animationId === id);
    assert.ok(expected); assert.equal(s.domain, expected.runtime.frameDomain); assert.equal(s.scenario, expected.runtime.scenario);
    if (locale === 'es') assert.match(await page.locator(HOST).innerText(), /contenido fuente en inglés/u);
    return s;
  }
  async function geometry(page, record, label, number = record.number) {
    const g = await page.locator(treeSelector(number)).evaluate((tree, {STAGE, HOST, number}) => {
      const box = node => {const r = node.getBoundingClientRect(); return {left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height};};
      const stage = document.querySelector(STAGE), host = document.querySelector(HOST), slot = tree.closest('[data-page-interaction-companion-host]');
      const plane = stage.querySelector(`[data-p0${number}-source-plane]`);
      const measurable = [...tree.querySelectorAll('button, [data-visible-prompt], [data-literal-choice], [data-literal-graph-description], .p034-math-companion__expression, .p044-math-companion__result, [role="status"] p')];
      const elements = measurable.filter(node => {const s = getComputedStyle(node), b = box(node); return s.display !== 'none' && s.visibility !== 'hidden' && b.width > 0 && b.height > 0;}).map(node => {
        const b = box(node), s = getComputedStyle(node), clips = [];
        for (let ancestor = node.parentElement; ancestor && ancestor !== document.body; ancestor = ancestor.parentElement) {
          const a = box(ancestor), style = getComputedStyle(ancestor);
          if ((['clip', 'hidden'].includes(style.overflowX) && (b.left < a.left - 1 || b.right > a.right + 1)) ||
            (['clip', 'hidden'].includes(style.overflowY) && (b.top < a.top - 1 || b.bottom > a.bottom + 1)))
            clips.push({tag: ancestor.tagName, className: String(ancestor.className), box: a, overflowX: style.overflowX, overflowY: style.overflowY, scrollTop: ancestor.scrollTop, scrollLeft: ancestor.scrollLeft});
        }
        return {tag: node.tagName, text: node.textContent, label: node.getAttribute('aria-label'), box: b,
          fontSize: parseFloat(s.fontSize), scrollWidth: node.scrollWidth, clientWidth: node.clientWidth,
          math: node.matches('[data-visible-prompt], [data-literal-choice], [data-literal-graph-description], .p034-math-companion__expression, .p044-math-companion__result'), clips};
      });
      const grid = tree.querySelector('.p034-math-companion__cards, .p044-math-companion__choices');
      const svgIds = [...host.querySelectorAll('svg[id], svg [id]')], byId = new Map();
      for (const node of svgIds) {const array = byId.get(node.id) ?? []; array.push(node); byId.set(node.id, array);}
      const references = [], badReferences = [];
      for (const svg of host.querySelectorAll('svg')) for (const node of [svg, ...svg.querySelectorAll('*')]) for (const attribute of node.attributes) {
        const refs = [...attribute.value.matchAll(/url\(#([^)]*)\)/gu)].map(m => m[1]);
        if (['href', 'xlink:href'].includes(attribute.name) && attribute.value.startsWith('#')) refs.push(attribute.value.slice(1));
        for (const id of refs) {const targets = byId.get(id) ?? [], valid = targets.length === 1 && targets[0].closest('svg') === svg;
          references.push(id); if (!valid) badReferences.push({id, count: targets.length});}
      }
      return {viewport: innerWidth, documentWidth: document.documentElement.scrollWidth, tree: box(tree), stage: box(stage), plane: box(plane),
        slot: slot ? {id: slot.id, box: box(slot), insideStage: stage.contains(slot), marker: slot.dataset.pageInteractionCompanionHost} : null,
        actionTreeCount: host.querySelectorAll(`[data-p0${number}-action-tree]`).length,
        fallbackCount: host.querySelectorAll(`[data-p0${number}-standalone-fallback]`).length,
        sourceButtons: plane.querySelectorAll('button, [role="button"], input').length, language: tree.lang,
        gridGap: grid ? parseFloat(getComputedStyle(grid).gap) : null, elements,
        svg: {copies: host.querySelectorAll('svg').length, ids: svgIds.length, referenceCount: references.length,
          duplicateIds: [...byId].filter(([, nodes]) => nodes.length > 1).map(([id]) => id), badReferences}};
    }, {STAGE, HOST, number});
    record.geometry.push({label, ...g});
    assert.equal(g.actionTreeCount, 1); assert.equal(g.fallbackCount, 0); assert.equal(g.sourceButtons, 0);
    assert.ok(g.slot); assert.equal(g.slot.marker, 'true'); assert.equal(g.slot.insideStage, false);
    assert.ok(g.slot.id.endsWith(`-alg-l11-p0${number}-math-companion`), 'Exact source-bound companion slot suffix');
    assert.ok(g.tree.top >= g.stage.bottom - 1, 'Companion must be below, outside fixed stage');
    assert.ok(Math.abs(g.plane.width / g.plane.height - 4 / 3) < .02, 'Source plane must remain 4:3');
    assert.equal(g.language, 'en'); assert.ok(g.documentWidth <= g.viewport + 1, 'Horizontal overflow');
    assert.deepEqual(g.svg.duplicateIds, [], 'Duplicate SVG IDs'); assert.deepEqual(g.svg.badReferences, [], 'Cross-SVG or missing references');
    if (g.gridGap !== null) assert.ok(g.gridGap >= 8, 'Math choice spacing below 8px');
    assert.ok(g.elements.length >= 2);
    for (const e of g.elements) {
      assert.deepEqual(e.clips, [], `Clipped visible math/control: ${e.label ?? e.text}`);
      if (e.tag === 'BUTTON') {assert.ok(e.box.width >= 44 && e.box.height >= 44, 'Target below 44px'); assert.ok(e.scrollWidth <= e.clientWidth + 1, 'Button text overflow');}
      if (e.math) assert.ok(e.fontSize >= 20, `Math below 20px: ${e.text}`);
    }
    // Compare actual parsed SVG subtrees, not merely data-* claims. p044's
    // declared per-instance identifier rewrite is reversed; geometry is not.
    const vectorNodes = await page.locator(number === 34 ? `${STAGE} [data-source-art-card]` : `${HOST} [data-source-svg-instance]`).evaluateAll((nodes, number) => nodes.map(node => {
      const svg = number === 34 ? node.querySelector('[data-source-fade-tick] svg') : node.querySelector('svg');
      return {sha256: node.getAttribute('data-source-vector-sha256'), instance: node.getAttribute('data-source-svg-instance'), raw: svg?.outerHTML};
    }), number);
    const vectorState = await state(page);
    assertSourceVectorCount(number, vectorState.phase, vectorNodes.length);
    if (number === 44 && vectorState.phase === 'results') {
      const result = page.locator(`${treeSelector(44)} .p044-math-companion__result`);
      assert.equal(await result.isVisible(), true);
      assert.equal(await result.textContent(), `Score: ${vectorState.correct} / 10`);
      const rating = page.locator(`${treeSelector(44)} [role="status"] p`).nth(1);
      assert.equal(await rating.isVisible(), true);
      assert.equal(await rating.textContent(), expectedSourceRating(vectorState.correct));
    }
    const serialized = await page.evaluate(items => items.map(item => {
      const template = document.createElement('template'); template.innerHTML = item.expected;
      let actual = item.raw;
      if (item.instance) {
        const prefix = `${item.instance}-`;
        actual = actual.replace(/\bid="([^"]+)"/gu, (whole, id) => id.startsWith(prefix) ? `id="${id.slice(prefix.length)}"` : whole)
          .replace(/(xlink:href|href)="#([^"]+)"/gu, (whole, attribute, id) => id.startsWith(prefix) ? `${attribute}="#${id.slice(prefix.length)}"` : whole)
          .replace(/url\(#([^)]*)\)/gu, (whole, id) => id.startsWith(prefix) ? `url(#${id.slice(prefix.length)})` : whole);
      }
      return {sha256: item.sha256, actual, expected: template.content.querySelector('svg').outerHTML};
    }), vectorNodes.map(node => {assert.ok(node.raw && sourceVectors.has(node.sha256), 'Unknown or absent actual source SVG');
      return {...node, expected: sourceVectors.get(node.sha256)};}));
    g.svg.subtreeCustody = serialized.map(item => {
      assert.equal(item.actual, item.expected, `Rendered source SVG subtree drift: ${item.sha256}`);
      return {sourceSha256: item.sha256, parsedBrowserSubtreeSha256: hash(item.actual)};
    });
    return g;
  }
  // Inspect clip ancestors before permitting native Playwright focus/click. Only
  // document scrolling is used, never element.scrollIntoView/hidden scrollTop.
  async function act(page, record, locator, input = record.touch ? 'touch' : 'mouse') {
    await locator.waitFor({state: 'visible'}); assert.equal(await locator.count(), 1); assert.equal(await locator.isDisabled(), false);
    const check = await locator.evaluate(node => {
      const b = node.getBoundingClientRect(), clips = [];
      for (let a = node.parentElement; a && a !== document.body; a = a.parentElement) {
        const s = getComputedStyle(a), r = a.getBoundingClientRect();
        if (['hidden', 'clip'].includes(s.overflowX) && (b.left < r.left - 1 || b.right > r.right + 1) ||
            ['hidden', 'clip'].includes(s.overflowY) && (b.top < r.top - 1 || b.bottom > r.bottom + 1)) clips.push(String(a.className));
      }
      return {clips, documentY: scrollY + b.top, height: b.height, inert: Boolean(node.closest('[inert]')), hidden: Boolean(node.closest('[aria-hidden="true"]'))};
    });
    record.actions.push({at: new Date().toISOString(), input, label: await locator.getAttribute('aria-label') ?? await locator.innerText(), before: check});
    assert.deepEqual(check.clips, [], 'Refuse to auto-reveal a clipped action'); assert.equal(check.inert, false); assert.equal(check.hidden, false);
    await page.evaluate(({y, height}) => window.scrollTo({top: Math.max(0, y - Math.max(16, (innerHeight - Math.min(height, innerHeight - 32)) / 2)), behavior: 'instant'}), {y: check.documentY, height: check.height});
    const hit = await locator.evaluate(node => {const b = node.getBoundingClientRect(), x = b.left + b.width / 2, y = Math.max(1, Math.min(innerHeight - 1, b.top + Math.min(b.height, innerHeight - 32) / 2));
      return {x, y, visible: x >= 0 && x < innerWidth && y >= b.top && y < b.bottom && node.contains(document.elementFromPoint(x, y))};});
    assert.equal(hit.visible, true, 'Control center occluded before native activation');
    if (input === 'touch') await locator.tap({position: await locator.evaluate((node, hit) => {const b = node.getBoundingClientRect(); return {x: hit.x - b.left, y: hit.y - b.top};}, hit)});
    else if (['Enter', 'Space'].includes(input)) {await locator.focus(); await page.keyboard.press(input);}
    else await locator.click({position: await locator.evaluate((node, hit) => {const b = node.getBoundingClientRect(); return {x: hit.x - b.left, y: hit.y - b.top};}, hit)});
  }
  async function pause(page, record, desired) {
    if ((await state(page)).paused !== String(desired)) await act(page, record, ui(page, 'pause'));
    await waitState(page, ({RUNTIME, desired}) => document.querySelector(RUNTIME)?.getAttribute('data-runtime-paused') === String(desired), {desired});
  }
  async function reset(page, record, origin, entryLevel = 1) {
    const before = await state(page);
    await geometry(page, record, `before-${origin}-replay`);
    const control = origin === 'footer' ? ui(page, 'replay') : page.locator(treeSelector(record.number)).getByRole('button', {name: 'Replay', exact: true});
    await act(page, record, control);
    await waitState(page, ({STAGE, HOST, number}) => {
      const root = document.querySelector(`${STAGE} [data-p0${number}-companion-successor]`), host = document.querySelector(HOST);
      return number === 34 ? root?.getAttribute('data-host-feedback-gate') === 'ready' && root?.getAttribute('data-source-score') === '0' && root?.getAttribute('data-source-completed-pair-count') === '0' && host?.getAttribute('data-lesson-host-practice-feedback-active') === 'false' :
        root?.getAttribute('data-host-score-gate') === 'ready' && root?.getAttribute('data-host-acknowledged-source-questions') === '' && host?.getAttribute('data-lesson-host-fq-attempted') === '0';
    }, {number: record.number});
    const after = await ready(page, record.number, record.locale);
    assert.equal(after.resolved, 0); assert.notEqual(after.complete, 'true');
    if (record.number === 34) {assert.equal(after.level, entryLevel); assert.equal(after.revealing, 0); assert.equal(after.phase, 'choosing');}
    else {assert.equal(after.awarded, 0); assert.equal(after.possible, 0); assert.equal(after.correct, 0);}
    record.trace.push({step: `${origin}-replay-real-host-reset`, before, after});
  }
  async function literals(page, record) {
    const tree = page.locator(treeSelector(record.number));
    if (record.number === 34) {
      const actual = await tree.locator('[data-source-card-id]').evaluateAll(nodes => nodes.map(n => ({id: n.dataset.sourceCardId, text: n.querySelector('.p034-math-companion__expression').textContent, spoken: n.getAttribute('aria-label')})));
      assert.equal(actual.length, 12);
      for (const a of actual) {const expected = literals34.find(l => l.cardId === a.id); assert.ok(expected); assert.equal(a.text, expected.expression); assert.equal(a.spoken, expected.spoken);}
    } else {
      const s = await state(page), expected = literals44.find(l => l.number === s.question); assert.ok(expected);
      assert.equal(await tree.locator('[data-visible-prompt]').textContent(), expected.prompt);
      assert.equal(await tree.locator('[data-spoken-prompt]').textContent(), expected.promptSpoken);
      const description = tree.locator('[data-literal-graph-description]'); assert.equal(await description.count() ? await description.textContent() : null, expected.promptGraphDescription);
      const actual = await tree.locator('[data-source-instance-name]').evaluateAll(nodes => nodes.map(n => ({id: n.dataset.sourceInstanceName, character: Number(n.dataset.sourceCharacterId), text: n.querySelector('[data-literal-choice]').textContent, label: n.getAttribute('aria-label')})));
      assert.equal(actual.length, 4);
      expected.choices.forEach((c, index) => assert.deepEqual(actual[index], {id: c.sourceInstanceName, character: c.sourceCharacterId, text: c.text, label: `${String.fromCharCode(65 + index)}. ${c.spoken}`}));
    }
    record.accessibility.push(await tree.ariaSnapshot());
  }
  async function viewportQuestion(page, record, round, phase, question) {
    const tree = page.locator(treeSelector(44)), content = tree.locator('[data-source-question]');
    const liveChrome = () => page.evaluate(() => [...document.querySelectorAll('header, .lesson-shell2__learning-nav, .skip-link')]
      .map(node => {const style = getComputedStyle(node), b = node.getBoundingClientRect();
        return {tag: node.tagName, className: String(node.className), position: style.position, visible: style.visibility !== 'hidden' && style.display !== 'none',
          top: b.top, bottom: b.bottom, width: b.width, height: b.height};})
      .filter(item => item.visible && ['fixed', 'sticky'].includes(item.position) && item.top >= -1 && item.top <= 20 && item.bottom > 0 && item.width > innerWidth / 2));
    const initialChrome = await liveChrome();
    const capacity = viewportCapacity(record.height, Math.max(0, ...initialChrome.map(item => item.bottom)));
    const questionHeight = await content.evaluate(node => node.getBoundingClientRect().height);
    const parts = questionHeight <= capacity.height
      ? [{name: 'whole-question', locator: content}]
      : [{name: 'prompt', locator: tree.locator('[data-literal-prompt]')},
        ...(await tree.locator('[data-literal-graph-description]').count()
          ? [{name: 'prompt-graph-description', locator: tree.locator('[data-literal-graph-description]')},
             {name: 'prompt-graph', locator: tree.locator('[data-source-question] > .p044-math-companion__graphic')}] : []),
        ...[1, 2, 3, 4].map(option => ({name: 'choice-' + option,
          locator: tree.locator('[data-source-instance-name="A' + question + 'Opt' + option + '"]')}))];
    for (const part of parts) {
      await part.locator.waitFor({state: 'visible'});
      const before = await part.locator.evaluate(node => {const b = node.getBoundingClientRect(); return {top: b.top + scrollY, height: b.height};});
      let chrome = await liveChrome(), camera = viewportCapacity(record.height, Math.max(0, ...chrome.map(item => item.bottom)));
      for (let positionAttempt = 0; positionAttempt < 2; positionAttempt++) {
        assert.ok(before.height <= camera.height, 'A single screenshot part exceeds the unobstructed viewport; report the gap rather than crop silently');
        await page.evaluate(({top, offset}) => window.scrollTo({top: Math.max(0, top - offset), behavior: 'instant'}), {top: before.top, offset: camera.top});
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        chrome = await liveChrome();
        const settled = viewportCapacity(record.height, Math.max(0, ...chrome.map(item => item.bottom)));
        if (settled.top === camera.top) break;
        camera = settled;
      }
      const view = await part.locator.evaluate(node => {
        const b = node.getBoundingClientRect(), points = [[b.left + 5, b.top + 5], [b.right - 5, b.top + 5],
          [b.left + b.width / 2, b.top + b.height / 2], [b.left + 5, b.bottom - 5], [b.right - 5, b.bottom - 5]];
        return {viewport: {width: innerWidth, height: innerHeight}, scrollY, box: {left: b.left, right: b.right, top: b.top, bottom: b.bottom, width: b.width, height: b.height},
          points: points.map(([x, y]) => {const hit = document.elementFromPoint(x, y); return {x, y, unobstructed: node.contains(hit),
            hit: hit ? {tag: hit.tagName, className: String(hit.className), id: hit.id, text: hit.textContent?.slice(0, 150)} : null};}),
          target: {tag: node.tagName, className: String(node.className)},
          noModal: !node.closest('[inert]'), language: node.closest('[lang]')?.getAttribute('lang')};
      });
      const filename = record.name + '-round-' + round + '-Q' + question + '-' + phase + '-' + part.name + '-viewport.png';
      const bytes = await page.screenshot({fullPage: false}); await save(filename, bytes);
      const capture = {path: output + '/' + filename, bytes: bytes.length, sha256: hash(bytes), capture: 'actual-viewport-only',
        questionId: pageId(44) + '-q' + question, round, phase, part: part.name, chrome, camera,
        unobstructedChecksPassed: view.points.every(p => p.unobstructed) && view.box.top >= camera.top - 1 && view.box.bottom <= record.height - 20, view};
      record.screenshots.push(capture); record.missingQuestionViewports.push(capture);
      assert.ok(view.box.top >= camera.top - 1 && view.box.bottom <= record.height - 20, 'Target part is not fully within unobstructed viewport');
      assert.ok(view.points.every(p => p.unobstructed), 'Target viewport is obscured by actual chrome/content');
      assert.equal(view.noModal, true); assert.equal(view.language, 'en');
    }
  }
  async function assessment(page, record) {
    record.rounds = []; record.missingQuestionViewports = [];
    const answered = [], reviewed = [];
    await geometry(page, record, 'initial-before-any-focus'); await literals(page, record);
    await screenshot(page, record, 'initial-source-and-companion');
    for (let roundIndex = 0; roundIndex < MAX_ROUNDS; roundIndex++) {
      const roundNumber = roundIndex + 1, start = await state(page);
      assert.equal(start.gate, 'ready'); assert.equal(start.phase, 'answering');
      assert.equal(start.attempted, 0); assert.deepEqual(start.ack, []); assert.equal(start.resolved, 0);
      assert.equal(start.selection.length, 10); assert.equal(new Set(start.selection).size, 10);
      const round = {number: roundNumber, startedAt: new Date().toISOString(), sourceReplay: start.replay,
        observedSelection: start.selection, answers: [], reviews: [], status: 'running'};
      record.rounds.push(round);
      for (let index = 0; index < 10; index++) {
        step = record.name + '-round-' + roundNumber + '-answer-' + (index + 1);
        await geometry(page, record, step); await literals(page, record);
        const before = await state(page), question = before.question, correct = answerKey.get(question);
        assert.equal(question, start.selection[index]); assert.notEqual(before.complete, 'true');
        if ([10, 24].includes(question)) await viewportQuestion(page, record, roundNumber, 'answering', question);
        const option = index % 2 ? correct : correct % 4 + 1;
        await act(page, record, page.locator(treeSelector(44) + ' [data-source-instance-name="A' + question + 'Opt' + option + '"]'),
          record.touch ? 'touch' : index % 2 ? 'Space' : 'Enter');
        await waitState(page, ({HOST, count}) => Number(document.querySelector(HOST)?.getAttribute('data-lesson-host-fq-attempted')) === count, {count: index + 1});
        await waitState(page, ({STAGE, count}) => (document.querySelector(STAGE + ' [data-p044-companion-successor]')?.getAttribute('data-host-acknowledged-source-questions')?.split(',').filter(Boolean).length ?? 0) === count, {count: index + 1});
        const after = await state(page);
        assert.deepEqual(after.ack, start.selection.slice(0, index + 1).map(q => pageId(44) + '-q' + q));
        assert.equal(after.possible, index + 1); assert.equal(after.awarded, Math.floor((index + 1) / 2));
        assert.equal(after.correct, Math.floor((index + 1) / 2));
        if (index < 9) {assert.equal(after.resolved, 0); assert.notEqual(after.complete, 'true');}
        answered.push(question); round.answers.push({question, questionId: pageId(44) + '-q' + question, option, before, after});
      }
      await page.locator(rootSelector(44) + '[data-assessment-phase="results"]').waitFor();
      await waitState(page, ({RUNTIME}) => document.querySelector(RUNTIME)?.getAttribute('data-runtime-interactive-stop-resolved-count') === '1' &&
        document.querySelector(RUNTIME)?.getAttribute('data-runtime-playback-complete') === 'true');
      const done = await state(page);
      assert.equal(done.attempted, 10); assert.equal(done.awarded, 5); assert.equal(done.possible, 10);
      await geometry(page, record, 'round-' + roundNumber + '-results'); await screenshot(page, record, 'round-' + roundNumber + '-results-5-of-10');
      await act(page, record, page.locator(treeSelector(44)).getByRole('button', {name: 'Review answers', exact: true}));
      for (let index = 0; index < 10; index++) {
        step = record.name + '-round-' + roundNumber + '-review-' + (index + 1);
        await geometry(page, record, step); await literals(page, record);
        const before = await state(page), question = before.question;
        assert.equal(question, round.answers[index].question);
        assert.equal(await page.locator(treeSelector(44) + ' [data-review-selected="true"]').count(), 1);
        assert.equal(await page.locator(treeSelector(44) + ' [data-review-correct="true"]').count(), 1);
        assert.equal(await page.locator(STAGE + ' [data-source-art-selected="true"]').count(), 1);
        assert.equal(await page.locator(STAGE + ' [data-source-art-correct="true"]').count(), 1);
        if ([10, 24].includes(question)) await viewportQuestion(page, record, roundNumber, 'review', question);
        const selected = page.locator(treeSelector(44) + ' [data-review-selected="true"]');
        assert.equal(await selected.getAttribute('data-source-instance-name'), 'A' + question + 'Opt' + round.answers[index].option);
        const sourceCorrect = page.locator(treeSelector(44) + ' [data-review-correct="true"]');
        assert.equal(await sourceCorrect.getAttribute('data-source-instance-name'), 'A' + question + 'Opt' + answerKey.get(question));
        await act(page, record, page.locator(treeSelector(44)).getByRole('button', {name: index < 9 ? 'Next review' : 'Finish review', exact: true}),
          record.touch ? 'touch' : index % 2 ? 'Space' : 'Enter');
        const after = await state(page);
        assert.equal(after.attempted, 10); assert.equal(after.awarded, 5); assert.deepEqual(after.ack, done.ack); assert.equal(after.resolved, 1);
        reviewed.push(question); round.reviews.push({question, questionId: pageId(44) + '-q' + question, before, after});
      }
      round.status = 'passed'; round.completedAt = new Date().toISOString();
      record.coverage = observedCoverage(answered, reviewed);
      round.cumulativeCoverage = record.coverage;
      await trace(page, record, 'round-' + roundNumber + '-ten-host-acks-and-review-no-rescore');
      console.log(json({case: record.name, round: roundNumber, actuallyAnswered: record.coverage.answered.length,
        actuallyReviewed: record.coverage.reviewed.length, missingAnswering: record.coverage.missingAnswering, missingReview: record.coverage.missingReview}).trim());
      if (record.coverage.all24ObservedAndReviewed || roundNumber === MAX_ROUNDS) break;
      await reset(page, record, 'source');
      assert.equal((await state(page)).replay, start.replay + 1, 'Actual source Replay did not advance its own runtime epoch');
    }
    record.coverage = observedCoverage(answered, reviewed);
  }
  try {
    browser = await chromium.launch({headless: true}); evidence.browser = {version: browser.version(), executable: await binding(chromium.executablePath())};
    for (const config of selectedCases) {
      activeRecord = {...config, status: 'running', startedAt: new Date().toISOString(), trace: [], actions: [], geometry: [], accessibility: [], support: [], screenshots: [], errors: []};
      evidence.records.push(activeRecord); const record = activeRecord; step = `${record.name}-navigation`;
      const context = await browser.newContext({viewport: {width: config.width, height: config.height}, hasTouch: config.touch, reducedMotion: config.motion, serviceWorkers: 'block'});
      await context.route('**/*', async route => {const request = route.request(), raw = request.url(), allowed = networkAllowed(raw);
        evidence.network.push({case: config.name, url: raw, method: request.method(), allowed, external: new URL(raw).origin !== BASE});
        if (allowed) await route.continue(); else await route.abort('blockedbyclient');});
      await context.routeWebSocket('**/*', socket => {const raw = socket.url(), allowed = networkAllowed(raw, true);
        evidence.network.push({case: config.name, url: raw, method: 'WEBSOCKET', allowed, external: new URL(raw).origin !== 'ws://127.0.0.1:3324'});
        if (allowed) socket.connectToServer(); else socket.close();});
      activePage = await context.newPage(); const page = activePage; page.setDefaultTimeout(15000);
      const onError = error => {record.errors.push(error); evidence.errors.push({case: record.name, error});};
      page.on('pageerror', error => onError(error.message)); page.on('console', message => {if (message.type() === 'error') onError(message.text());});
      page.on('response', response => {if (response.status() >= 400) onError(`HTTP ${response.status()} ${response.url()}`);});
      const response = await page.goto(BASE + '/' + config.locale + '/migration-status/g678-calibration/' + pageId(44), {waitUntil: 'networkidle', timeout: 45000});
      assert.equal(response.status(), 200); assert.match(response.headers()['x-robots-tag'] ?? await page.locator('meta[name="robots"]').getAttribute('content') ?? '', /noindex/u);
      await ready(page, 44, config.locale); await assessment(page, record);
      record.final = await state(page); record.completedAt = new Date().toISOString();
      assert.deepEqual(record.errors, []); assert.equal(evidence.network.some(n => n.case === record.name && !n.allowed), false);
      record.status = record.coverage.all24ObservedAndReviewed ? 'passed' : 'bounded-sampling-gap'; await save(`${record.name}.json`, json(record)); await context.close();
      console.log(json({case: record.name, status: record.status, coverage: record.coverage, productCalibrationPassed: false}).trim());
    }
    evidence.status = 'actual-v4-p044-source-replay-coverage-passed';
  } catch (error) {
    evidence.status = 'actual-v4-p044-source-replay-coverage-failed'; evidence.failure = {step, message: error.message, stack: error.stack};
    if (activeRecord) {activeRecord.status = 'failed'; activeRecord.failure = evidence.failure;}
    if (activePage && !activePage.isClosed()) {
      try {evidence.failure.state = await state(activePage); await screenshot(activePage, activeRecord, 'failed-state');
        await save(`${activeRecord.name}-failure.html`, await activePage.content());} catch (captureError) {evidence.failure.captureError = captureError.message;}
    }
    console.error(json(evidence.failure));
  } finally {
    if (browser) await browser.close();
    process.removeListener('SIGINT', onInterrupt);
    try {evidence.inputsAfter = await Promise.all(inputFiles.map(binding)); assert.deepEqual(evidence.inputsAfter, inputs); evidence.inputsUnchanged = true;}
    catch (error) {evidence.inputsUnchanged = false; evidence.inputRecheckError = error.message; evidence.status = 'actual-v4-p044-source-replay-coverage-failed';}
    evidence.actualQuestionUnion = observedCoverage(evidence.records.flatMap(r => r.coverage?.answered ?? []), evidence.records.flatMap(r => r.coverage?.reviewed ?? []));
    evidence.boundedSamplingGap = evidence.records.some(r => r.status === 'bounded-sampling-gap');
    evidence.externalRequestCount = evidence.network.filter(n => n.external).length;
    evidence.blockedSameOriginCount = evidence.network.filter(n => !n.allowed && !n.external).length;
    evidence.localRouteQaPassed = !evidence.interrupted && evidence.status === 'actual-v4-p044-source-replay-coverage-passed' && evidence.records.length === selectedCases.length && evidence.records.every(r => r.status === 'passed') && evidence.inputsUnchanged && evidence.errors.length === 0 && evidence.network.every(n => n.allowed);
    if (!evidence.localRouteQaPassed) evidence.status = evidence.boundedSamplingGap && evidence.errors.length === 0 && evidence.inputsUnchanged ? 'actual-v4-p044-source-replay-coverage-bounded-gap' : 'actual-v4-p044-source-replay-coverage-failed';
    evidence.fullSupplementalLayoutMatrixPassed = evidence.localRouteQaPassed && selectedCases.length === CASES.length;
    evidence.finishedAt = new Date().toISOString(); await save('evidence.json', json(evidence));
    console.log(json({output, status: evidence.status, cases: evidence.records.length, fullSupplementalLayoutMatrixPassed: evidence.fullSupplementalLayoutMatrixPassed,
      productCalibrationPassed: false, externalRequestCount: evidence.externalRequestCount, blockedSameOriginCount: evidence.blockedSameOriginCount}));
  }
  process.exitCode = evidence.localRouteQaPassed ? 0 : 1;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.slice(2).join(' ') === '--help') console.log('After separate coordinator V4 activation/server GO only: node scripts/qa-g678-alg-l11-v4-p044-source-replay-coverage.mjs --run <exclusive-name> --registry-sha256 <sha> --freeze-sha256 <sha> --fragment-sha256 <sha> --activation-sha256 <sha> [--only-case <exact-case-name>]');
  else await main(process.argv.slice(2));
}
