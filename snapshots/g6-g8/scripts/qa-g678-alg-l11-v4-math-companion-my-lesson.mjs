#!/usr/bin/env node
// Local engineering QA only. Requires a separate coordinator V4 activation/server GO.
// No injected loader/host/state/clock, forced click, hidden-overflow scrolling, or audio opt-in.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SELF = 'scripts/qa-g678-alg-l11-v4-math-companion-my-lesson.mjs';
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

export const CASES = Object.freeze([
  ...[370, 390, 1440].flatMap(width => ['en', 'es'].flatMap(locale => [34, 44].map(number => ({
    name: `p0${number}-${width}-${locale}`, number, locale, width, height: width < 500 ? 844 : 1000,
    touch: width < 500, motion: width < 500 ? 'reduce' : 'no-preference', kind: 'full',
  })))),
  ...[370, 390, 1440].map(width => ({name: `p033-level2-handoff-${width}`, number: 34, locale: 'en',
    width, height: width < 500 ? 844 : 1000, touch: width < 500, motion: 'reduce', kind: 'handoff'})),
]);
export const CONTROL_MATRIX = Object.freeze({
  mobile: {help: 'test-naturally-visible-control', 'key-terms': 'test-naturally-visible-control', map: 'test-naturally-visible-control'},
  desktop: {help: 'not-exposed-by-existing-focus-policy-not-tested', 'key-terms': 'test-naturally-visible-control', map: 'test-naturally-visible-control'},
  modalRule: 'Require inert learning content only when the actual host declares modal support. Nonmodal rail must still pause and disable math actions.',
});
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
  const output = `output/playwright/g678-alg-l11-v4-math-companion-my-lesson-${options['--run']}`;
  const save = (name, bytes) => writeFile(path.join(ROOT, output, name), bytes, {flag: 'wx'});
  const files = new Set([SELF, 'scripts/qa-g678-alg-l11-v4-math-companion-my-lesson.test.mjs', REGISTRY, `${V4}.json`, `${V4}.fragment.json`, `${V4}.activation.json`, ...Object.keys(PINS),
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
  const evidence = {schemaVersion: 1, artifactType: 'actual-my-lesson-v4-two-math-companion-engineering-qa', createdAt: new Date().toISOString(),
    output, exactOrigin: BASE, requestedCases: selectedCases, expectedCaseCount: selectedCases.length, fullMatrixCount: CASES.length,
    inputs, sealedBindingsRechecked: [...checked.values()], visibleControlMatrix: CONTROL_MATRIX, records: [], network: [], errors: [],
    boundary: 'Official registered V4 My Lesson only. No test loader, injected host/state, virtual clock, forced/hidden click, hidden-overflow scroll, source-audio opt-in, or external request.',
    clock: 'Actual browser wall clock for every feedback sequence; prefers-reduced-motion only changes authored visual presentation.',
    localRouteQaPassed: false, productCalibrationPassed: false, authoritativeOriginalRuntime: false, visualFidelityAccepted: false,
    audioIntegratedByThisQa: false, audioAccepted: false, humanVisualAccepted: false, screenReaderHumanAccepted: false,
    ownerAccepted: false, strictComplete: false, releaseEligible: false, released: false, published: false};
  let browser, activePage, activeRecord, step = 'launch';
  const onInterrupt = () => {evidence.interrupted = true; evidence.status = 'actual-v4-route-engineering-qa-interrupted';
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
  async function support(page, record) {
    for (const key of record.width < 500 ? ['help', 'key-terms', 'map'] : ['key-terms', 'map']) {
      step = `${record.name}-${key}`; await pause(page, record, false); await geometry(page, record, `before-${key}`);
      const before = await state(page), trigger = ui(page, key); assert.equal(await trigger.isVisible(), true);
      const panelId = await trigger.getAttribute('aria-controls'); assert.ok(panelId); await act(page, record, trigger);
      const panel = page.locator(`[id=${JSON.stringify(panelId)}]`); await panel.waitFor({state: 'visible'});
      await waitState(page, ({RUNTIME}) => document.querySelector(RUNTIME)?.getAttribute('data-runtime-paused') === 'true');
      const modal = await page.locator(`${HOST} .lesson-shell2`).getAttribute('data-support-modal-open') === 'true';
      const blocked = await page.locator(treeSelector(record.number)).evaluate(tree => ({placement: tree.dataset.companionPlacement,
        inert: Boolean(tree.closest('[inert]')), enabled: [...tree.querySelectorAll('button')].filter(b => !b.disabled).length,
        trees: document.querySelectorAll('[data-p034-action-tree], [data-p044-action-tree]').length}));
      assert.equal(blocked.placement, 'portal'); assert.equal(blocked.trees, 1); assert.equal(blocked.enabled, 0);
      if (modal) assert.equal(blocked.inert, true, 'Modal did not make companion inert');
      if (key === 'key-terms') {
        const terms = panel.locator('[data-key-terms-authority="source-bound-g678-bilingual-keyterms-xml"]'); await terms.waitFor();
        const pairs = await terms.locator('dl > div').evaluateAll(nodes => nodes.map(n => [n.querySelector('dt')?.textContent?.trim(), n.querySelector('dd')?.textContent?.trim()]));
        const expected = glossary.existingLessonReconciliation.mergedGlossaryEntries.map(e => [e.labels[record.locale], e.definitions[record.locale]]);
        assert.equal(pairs.length, 43); assert.deepEqual(pairs.map(JSON.stringify).sort(), expected.map(JSON.stringify).sort());
        assert.match(await terms.innerText(), new RegExp(record.locale === 'es' ? 'L1KTS01' : 'L1KTE01'));
      }
      if (key === 'map') {
        const pages = await panel.locator('button[data-placement-id]').evaluateAll(nodes => nodes.map(n => ({id: n.dataset.placementId, availability: n.dataset.rendererAvailability})));
        assert.deepEqual(pages.map(p => p.id), Array.from({length: 44}, (_, i) => pageId(i + 1)));
        assert.ok(pages.every(p => p.availability === 'registered'));
      }
      // Real keyboard traversal, not programmatic focusing of an inert child.
      if (modal) for (let index = 0; index < 8; index++) {
        await page.keyboard.press(index % 2 ? 'Shift+Tab' : 'Tab');
        assert.equal(await page.evaluate(() => Boolean(document.activeElement?.closest('[data-p034-action-tree], [data-p044-action-tree], [data-p034-standalone-fallback], [data-p044-standalone-fallback]'))), false);
      }
      await screenshot(page, record, `${key}-${modal ? 'modal' : 'rail'}`);
      const close = key === 'map' ? page.locator(`${HOST} [data-course-map-close-control]:visible`).first() : panel.getByRole('button', {name: record.locale === 'es' ? 'Cerrar herramienta' : 'Close tool', exact: true});
      await act(page, record, close);
      await waitState(page, ({HOST, key}) => document.querySelector(HOST)?.contains(document.activeElement) && document.activeElement?.getAttribute('data-responsive-focus-key') === key, {key});
      await waitState(page, ({RUNTIME}) => document.querySelector(RUNTIME)?.getAttribute('data-runtime-paused') === 'false');
      const after = await state(page); assert.equal(after.phase, before.phase); assert.equal(after.question || 0, before.question || 0);
      assert.equal(after.pairs, before.pairs); assert.equal(after.attempted, before.attempted); assert.deepEqual(after.ack, before.ack);
      record.support.push({key, declaredModal: modal, blocked, focusRestored: true, before, after});
      await geometry(page, record, `after-${key}`);
    }
  }
  async function pair(page, record, level, pairId, input) {
    await act(page, record, page.locator(`${treeSelector(34)} [data-source-card-id="level-${level}-Mc${pairId}_1"]`), input);
    await act(page, record, page.locator(`${treeSelector(34)} [data-source-card-id="level-${level}-Mc${pairId}_2"]`), input);
  }
  async function choosing(page) {await page.locator(`${rootSelector(34)}[data-feedback-phase="choosing"][data-host-feedback-gate="ready"]`).waitFor({timeout: 15000});}
  async function matching(page, record, entryLevel = 1) {
    await geometry(page, record, 'initial-before-any-focus'); await literals(page, record); await screenshot(page, record, 'initial-literal-source');
    await support(page, record);
    const input = record.touch ? 'touch' : 'Enter';
    step = `${record.name}-wrong-feedback-pause`;
    await act(page, record, page.locator(`${treeSelector(34)} [data-source-card-id="level-${entryLevel}-Mc1_1"]`), input);
    await act(page, record, page.locator(`${treeSelector(34)} [data-source-card-id="level-${entryLevel}-Mc2_1"]`), record.touch ? 'touch' : 'Space');
    await waitState(page, ({HOST}) => document.querySelector(HOST)?.getAttribute('data-lesson-host-practice-feedback-active') === 'true');
    await pause(page, record, true); await page.waitForTimeout(100); const held = await state(page);
    assert.equal(held.score, -2); assert.equal(held.pairs, 0); assert.equal(held.hostFeedback, 'true');
    await page.waitForTimeout(550); const heldAfter = await state(page);
    assert.equal(heldAfter.elapsed, held.elapsed); assert.equal(heldAfter.feedbackFrame, held.feedbackFrame); assert.equal(heldAfter.pairs, 0);
    await screenshot(page, record, 'wrong-paused'); await pause(page, record, false); await choosing(page);
    assert.equal((await state(page)).hostFeedback, 'false'); await trace(page, record, 'wrong-source-terminal-cleared-host-feedback');
    step = `${record.name}-footer-replay-active-feedback`;
    await pair(page, record, entryLevel, 1, input);
    assert.equal((await state(page)).hostFeedback, 'true'); await reset(page, record, 'footer', entryLevel);
    step = `${record.name}-source-replay-active-feedback`;
    await pair(page, record, entryLevel, 1, record.touch ? 'touch' : 'Space');
    assert.equal((await state(page)).hostFeedback, 'true'); await reset(page, record, 'source', entryLevel);
    const level = entryLevel === 1 ? 2 : entryLevel;
    if (entryLevel === 1) await act(page, record, page.locator(treeSelector(34)).getByRole('button', {name: 'Level 2', exact: true}));
    await literals(page, record); await geometry(page, record, 'level2-before-pairs'); await screenshot(page, record, 'level2-literals');
    for (let pairId = 1; pairId <= 6; pairId++) {
      step = `${record.name}-real-time-pair-${pairId}`;
      const before = await state(page); assert.equal(before.resolved, 0); assert.notEqual(before.complete, 'true');
      await pair(page, record, level, pairId, record.touch ? 'touch' : pairId % 2 ? 'Enter' : 'Space');
      const active = await state(page); assert.equal(active.hostFeedback, 'true'); assert.equal(active.pairs, pairId - 1);
      if (pairId === 1) {
        await pause(page, record, true); await page.waitForTimeout(100); const heldCorrect = await state(page);
        await page.waitForTimeout(550); assert.equal((await state(page)).elapsed, heldCorrect.elapsed);
        await screenshot(page, record, 'correct-paused'); await pause(page, record, false);
      }
      if (pairId < 6) await choosing(page); else await page.locator(`${rootSelector(34)}[data-feedback-phase="complete"]`).waitFor({timeout: 15000});
      assert.equal((await state(page)).pairs, pairId); assert.equal((await state(page)).hostFeedback, 'false');
      await trace(page, record, `pair-${pairId}-source-terminal`);
    }
    await waitState(page, ({RUNTIME}) => document.querySelector(RUNTIME)?.getAttribute('data-runtime-interactive-stop-resolved-count') === '1' && document.querySelector(RUNTIME)?.getAttribute('data-runtime-playback-complete') === 'true');
    const done = await state(page); assert.equal(done.score, 60); assert.equal(done.pairs, 6); assert.equal(done.level, level);
    await geometry(page, record, 'completed-reveal'); await screenshot(page, record, 'completed');
    await reset(page, record, 'footer', entryLevel);
  }
  async function assessment(page, record) {
    await geometry(page, record, 'initial-before-any-focus'); await literals(page, record); await screenshot(page, record, 'initial-literal-source');
    await support(page, record);
    const answer = async (index, expectedCount) => {
      await geometry(page, record, `question-${index + 1}-before-action`); await literals(page, record);
      const before = await state(page), correct = answerKey.get(before.question), option = index % 2 ? correct : correct % 4 + 1;
      await act(page, record, page.locator(`${treeSelector(44)} [data-source-instance-name="A${before.question}Opt${option}"]`), record.touch ? 'touch' : index % 2 ? 'Space' : 'Enter');
      await waitState(page, ({HOST, count}) => Number(document.querySelector(HOST)?.getAttribute('data-lesson-host-fq-attempted')) === count, {count: expectedCount});
      await waitState(page, ({STAGE, count}) => (document.querySelector(`${STAGE} [data-p044-companion-successor]`)?.getAttribute('data-host-acknowledged-source-questions')?.split(',').filter(Boolean).length ?? 0) === count, {count: expectedCount});
      const after = await state(page); assert.deepEqual(after.ack, after.selection.slice(0, expectedCount).map(q => `${pageId(44)}-q${q}`));
      assert.equal(after.possible, expectedCount); assert.equal(after.awarded, Math.floor(expectedCount / 2)); assert.equal(after.correct, Math.floor(expectedCount / 2));
      if (expectedCount < 10) {assert.equal(after.resolved, 0); assert.notEqual(after.complete, 'true');}
      await trace(page, record, `typed-score-ack-${expectedCount}`); return before;
    };
    await answer(0, 1); await reset(page, record, 'footer');
    await answer(0, 1); await reset(page, record, 'source');
    const answers = [];
    for (let index = 0; index < 10; index++) {
      step = `${record.name}-actual-score-${index + 1}`;
      if (index === 0) {
        await pause(page, record, true);
        assert.equal(await page.locator(`${treeSelector(44)} [data-source-instance-name]:disabled`).count(), 4);
        const held = await state(page); await page.waitForTimeout(550); assert.deepEqual((await state(page)).ack, held.ack); await pause(page, record, false);
      }
      answers.push(await answer(index, index + 1));
    }
    await page.locator(`${rootSelector(44)}[data-assessment-phase="results"]`).waitFor();
    await waitState(page, ({RUNTIME}) => document.querySelector(RUNTIME)?.getAttribute('data-runtime-interactive-stop-resolved-count') === '1' && document.querySelector(RUNTIME)?.getAttribute('data-runtime-playback-complete') === 'true');
    const done = await state(page); assert.equal(done.attempted, 10); assert.equal(done.awarded, 5); assert.equal(done.possible, 10);
    await screenshot(page, record, 'ten-ack-results');
    await act(page, record, page.locator(treeSelector(44)).getByRole('button', {name: 'Review answers', exact: true}));
    for (let index = 0; index < 10; index++) {
      step = `${record.name}-review-${index + 1}`;
      await geometry(page, record, `review-${index + 1}`); await literals(page, record);
      assert.equal((await state(page)).question, answers[index].question);
      assert.equal(await page.locator(`${treeSelector(44)} [data-review-selected="true"]`).count(), 1);
      assert.equal(await page.locator(`${treeSelector(44)} [data-review-correct="true"]`).count(), 1);
      assert.equal(await page.locator(`${STAGE} [data-source-art-selected="true"]`).count(), 1);
      assert.equal(await page.locator(`${STAGE} [data-source-art-correct="true"]`).count(), 1);
      const next = page.locator(treeSelector(44)).getByRole('button', {name: index < 9 ? 'Next review' : 'Finish review', exact: true});
      if (index === 0) {await pause(page, record, true); assert.equal(await next.isDisabled(), true); await page.waitForTimeout(350); await pause(page, record, false); await screenshot(page, record, 'source-literal-review');}
      await act(page, record, next, record.touch ? 'touch' : index % 2 ? 'Space' : 'Enter');
      const current = await state(page); assert.equal(current.attempted, 10); assert.equal(current.awarded, 5); assert.deepEqual(current.ack, done.ack); assert.equal(current.resolved, 1);
    }
    await trace(page, record, 'ten-review-items-no-host-rescore'); await reset(page, record, 'source');
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
      const initialNumber = config.kind === 'handoff' ? 33 : config.number;
      const response = await page.goto(`${BASE}/${config.locale}/migration-status/g678-calibration/${pageId(initialNumber)}`, {waitUntil: 'networkidle', timeout: 45000});
      assert.equal(response.status(), 200); assert.match(response.headers()['x-robots-tag'] ?? await page.locator('meta[name="robots"]').getAttribute('content') ?? '', /noindex/u);
      await ready(page, initialNumber, config.locale);
      if (config.kind === 'handoff') {
        const root = page.locator(`${STAGE} [data-source-content-successor="p033-instructional-sequence-v1"]`);
        await page.locator(`${STAGE} [data-source-main-frame="605"]`).waitFor();
        await act(page, record, root.getByRole('button', {name: 'Level 2', exact: true}), config.touch ? 'touch' : 'Enter');
        await act(page, record, root.getByRole('button', {name: 'Start', exact: true}), config.touch ? 'touch' : 'Space');
        await ready(page, 34, config.locale); assert.equal((await state(page)).level, 2);
        await geometry(page, record, 'source-handoff-level2-before-focus'); await literals(page, record); await screenshot(page, record, 'actual-level2-handoff');
        await pair(page, record, 2, 1, config.touch ? 'touch' : 'Enter'); await choosing(page);
        assert.equal((await state(page)).pairs, 1); await trace(page, record, 'source-handoff-level2-pair-ack');
        await reset(page, record, 'source', 2); await pair(page, record, 2, 1, config.touch ? 'touch' : 'Space'); await reset(page, record, 'footer', 2);
      } else if (config.number === 34) await matching(page, record); else await assessment(page, record);
      record.final = await state(page); record.completedAt = new Date().toISOString();
      assert.deepEqual(record.errors, []); assert.equal(evidence.network.some(n => n.case === record.name && !n.allowed), false);
      record.status = 'passed'; await save(`${record.name}.json`, json(record)); await context.close();
      console.log(json({case: record.name, status: 'passed', productCalibrationPassed: false}).trim());
    }
    evidence.status = 'actual-v4-route-engineering-qa-passed';
  } catch (error) {
    evidence.status = 'actual-v4-route-engineering-qa-failed'; evidence.failure = {step, message: error.message, stack: error.stack};
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
    catch (error) {evidence.inputsUnchanged = false; evidence.inputRecheckError = error.message; evidence.status = 'actual-v4-route-engineering-qa-failed';}
    evidence.externalRequestCount = evidence.network.filter(n => n.external).length;
    evidence.blockedSameOriginCount = evidence.network.filter(n => !n.allowed && !n.external).length;
    evidence.localRouteQaPassed = !evidence.interrupted && evidence.status === 'actual-v4-route-engineering-qa-passed' && evidence.records.length === selectedCases.length && evidence.records.every(r => r.status === 'passed') && evidence.inputsUnchanged && evidence.errors.length === 0 && evidence.network.every(n => n.allowed);
    if (!evidence.localRouteQaPassed) evidence.status = 'actual-v4-route-engineering-qa-failed';
    evidence.full15CaseMatrixPassed = evidence.localRouteQaPassed && selectedCases.length === CASES.length;
    evidence.finishedAt = new Date().toISOString(); await save('evidence.json', json(evidence));
    console.log(json({output, status: evidence.status, cases: evidence.records.length, full15CaseMatrixPassed: evidence.full15CaseMatrixPassed,
      productCalibrationPassed: false, externalRequestCount: evidence.externalRequestCount, blockedSameOriginCount: evidence.blockedSameOriginCount}));
  }
  process.exitCode = evidence.localRouteQaPassed ? 0 : 1;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.slice(2).join(' ') === '--help') console.log('After separate coordinator V4 activation/server GO only: node scripts/qa-g678-alg-l11-v4-math-companion-my-lesson.mjs --run <exclusive-name> --registry-sha256 <sha> --freeze-sha256 <sha> --fragment-sha256 <sha> --activation-sha256 <sha> [--only-case <exact-case-name>]');
  else await main(process.argv.slice(2));
}
