import assert from 'node:assert/strict';
import test from 'node:test';
import {Script} from 'node:vm';
import {readFileSync} from 'node:fs';
import {lstat, mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {parse} from 'acorn';
import {buildP005Typography, buildP005TypographyFiles, P005_TYPOGRAPHY_ID as ID,
  P005_TYPOGRAPHY_REGISTRY as REGISTRY, P005_TYPOGRAPHY_TITLE_INSTANCE as TITLE} from './build-g678-alg-l12-p005-typography.mjs';

const WORK = `migrations/${ID}`;
const source = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/ALG001/L12/RW/L12RW05.swf';
const sourceBytes = readFileSync(source);
const safeJavascript = readFileSync(`${WORK}/candidate-v2/canvas-renderer.js`, 'utf8');
const input = {sourceBytes, safeJavascript};
const generated = buildP005Typography(input);
const plain = value => JSON.parse(JSON.stringify(value));

function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  if (node.type) visit(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(child => walk(child, visit));
    else if (value && typeof value === 'object') walk(value, visit);
  }
}

function definitions(code) {
  const found = new Map();
  walk(parse(code, {ecmaVersion: 2022}), node => {
    if (node.type === 'FunctionDeclaration') found.set(node.id.name, code.slice(node.start, node.end));
  });
  return found;
}

/** Leaf dispatch instrumentation keeps the real source placement/transform/mask
 * code. It establishes deterministic draw equivalence, not raster or Flash fidelity. */
function recordLeaves(code) {
  const replacements = [];
  walk(parse(code, {ecmaVersion: 2022}), node => {
    if (node.type === 'FunctionDeclaration' && /^(?:shape|morphshape|text|button)\d+$/.test(node.id.name))
      replacements.push({start: node.body.start, end: node.body.end,
        code: `{ctx.paint(${JSON.stringify(node.id.name)},ctrans);}`});
  });
  let cursor = 0, result = '';
  for (const patch of replacements.sort((a, b) => a.start - b.start)) {
    result += code.slice(cursor, patch.start) + patch.code; cursor = patch.end;
  }
  return result + code.slice(cursor);
}

class Context {
  matrix = [1, 0, 0, 1, 0, 0];
  stack = [];
  paints = [];
  composites = [];
  globalAlpha = 1;
  globalCompositeOperation = 'source-over';
  save() {this.stack.push({matrix: this.matrix.slice(), alpha: this.globalAlpha, composite: this.globalCompositeOperation});}
  restore() {
    const saved = this.stack.pop();
    if (saved) {this.matrix = saved.matrix; this.globalAlpha = saved.alpha; this.globalCompositeOperation = saved.composite;}
  }
  setTransform(...values) {this.matrix = values;}
  transform(a, b, c, d, e, f) {
    const x = this.matrix;
    this.matrix = [x[0] * a + x[2] * b, x[1] * a + x[3] * b,
      x[0] * c + x[2] * d, x[1] * c + x[3] * d,
      x[0] * e + x[2] * f + x[4], x[1] * e + x[3] * f + x[5]];
  }
  fillRect() {this.paints = []; this.composites = [];}
  drawImage(image) {
    if (!image.context) return;
    this.paints.push(...image.context.paints);
    this.composites.push({kind: this.globalCompositeOperation, matrix: this.matrix.slice()}, ...image.context.composites);
  }
  paint(object, transform) {
    this.paints.push({object, matrix: this.matrix.slice(), color: transform.apply([20, 30, 40, 1])});
  }
}

function canvas() {
  const context = new Context(), attributes = {};
  return {width: 800, height: 600, context, style: {}, attributes, getContext: () => context,
    setAttribute: (name, value) => {attributes[name] = String(value);},
    getAttribute: name => attributes[name] ?? null};
}

const originalRecording = recordLeaves(safeJavascript);
const variantRecording = recordLeaves(generated.code);
function adapters() {
  let canvases = 0;
  const sandbox = {document: {createElement(type) {
    if (type === 'img') return {complete: true, naturalWidth: 1, naturalHeight: 1};
    assert.equal(type, 'canvas'); canvases++; return canvas();
  }}};
  new Script(originalRecording).runInNewContext(sandbox);
  new Script(variantRecording).runInNewContext(sandbox);
  return {original: sandbox.HELP_MATH_CANVAS_ASSETS[ID], variant: sandbox[REGISTRY][ID], allocations: () => canvases};
}
const requested = (frame, ids = []) => ({frame, frameDomain: 'sprite-391', rootFrame: 6,
  lang: 'en', scenario: 'source-static-frame', seed: 0, renderScale: 1, text: {suppressInstanceIds: ids}});

test('generator pins source and v2 candidate, has separate registry, and records exact title lineage without treating text393 as its visible instance', () => {
  const second = buildP005Typography(input);
  assert.equal(second.code, generated.code);
  assert.deepEqual(second.manifest, generated.manifest);
  assert.equal(generated.manifest.globalRegistry, REGISTRY);
  assert.deepEqual(generated.manifest.instrumentedSites, {title: 1});
  assert.equal(generated.manifest.originalCandidate, 'candidate-v2');
  assert.equal(generated.manifest.evidence.title.id, TITLE);
  assert.deepEqual(generated.manifest.evidence.title.publicFrames, [1, 968]);
  assert.equal(generated.manifest.evidence.title.path[0].instanceId, 'root/depth-135/generation-1');
  assert.equal(generated.manifest.evidence.title.path[1].instanceId, 'sprite-395/depth-2/generation-1');
  assert.equal(generated.manifest.evidence.text393.suppressed, false);
  assert.equal(generated.manifest.evidence.text393.semanticSubstitutionAsserted, false);
  assert.equal(Object.values(generated.manifest.claimBoundary).every(value => value === false), true);
  assert.throws(() => buildP005Typography({...input, safeJavascript: `${safeJavascript}\n`}), /candidate hash drift/);
  assert.throws(() => buildP005Typography({...input,
    safeJavascript: readFileSync(`${WORK}/candidate-v1/canvas-renderer.js`, 'utf8')}), /candidate hash drift/);
  const changed = Buffer.from(sourceBytes); changed[100] ^= 1;
  assert.throws(() => buildP005Typography({...input, sourceBytes: changed}), /source hash drift/);
});

test('all non-title functions, original mask bodies and wrapper remain byte-identical', () => {
  const before = definitions(safeJavascript), after = definitions(generated.code);
  for (const [name, definition] of before) {
    if (['sprite395', 'render'].includes(name)) continue;
    assert.equal(after.get(name), definition, `source definition changed: ${name}`);
  }
  for (const id of [1, 203]) {
    assert.equal(after.get(`shape${id}`), before.get(`shape${id}`));
    assert.equal(after.get(`shape${id}`).includes('rgba(255,255,255,1)'), true);
  }
  const wrapper = code => code.slice(code.indexOf('var sourceFrameRender = render;'), code.indexOf('var registry = global['));
  assert.equal(wrapper(generated.code), wrapper(safeJavascript));
});

test('ordinary render preserves real source draw dispatch, transforms, masks, frame state and DOM markers', async () => {
  const {original, variant} = adapters();
  await Promise.all([original.ready(), variant.ready()]);
  for (const frame of [1, 2, 24, 25, 338, 500, 677, 967, 968]) {
    const before = canvas(), after = canvas();
    assert.deepEqual(plain(variant.render(after, requested(frame))), plain(original.render(before, requested(frame))));
    assert.deepEqual(plain(after.context.paints), plain(before.context.paints), `draw frame ${frame}`);
    assert.deepEqual(plain(after.context.composites), plain(before.context.composites), `masks frame ${frame}`);
    assert.deepEqual(after.attributes, before.attributes);
  }
});

test('the complete 968-frame draw sweep suppresses exactly one title occurrence, retaining text393 and every other source draw/mask', async () => {
  const {variant} = adapters(); await variant.ready();
  const baseline = canvas(), replaced = canvas();
  for (let frame = 1; frame <= 968; frame++) {
    variant.renderWithText(baseline, requested(frame));
    const result = variant.renderWithText(replaced, requested(frame, [TITLE]));
    assert.deepEqual([...result.suppressedInstanceIds], [TITLE]);
    assert.equal(result.unfulfilledSuppressionIds.length, 0);
    assert.equal(result.diagnostics.length, 0);
    assert.equal(baseline.context.paints.filter(draw => draw.object === 'shape394').length, 1);
    assert.equal(replaced.context.paints.filter(draw => draw.object === 'text393').length, 1);
    assert.deepEqual(plain(replaced.context.paints), plain(baseline.context.paints.filter(draw => draw.object !== 'shape394')), `frame ${frame}`);
    assert.deepEqual(plain(replaced.context.composites), plain(baseline.context.composites), `mask frame ${frame}`);
    assert.deepEqual(replaced.attributes, baseline.attributes);
  }
});

test('wrong-depth, wrong-generation, character-only and mixed unknown requests suppress nothing', async () => {
  const {variant} = adapters(); await variant.ready();
  for (const ids of [['shape394'], ['root:135:1:395/sprite-395:1:1:393'],
    ['root:135:1:395/sprite-395:2:2:394'], [TITLE, 'unknown']]) {
    const baseline = canvas(), refused = canvas();
    variant.renderWithText(baseline, requested(968));
    const result = variant.renderWithText(refused, requested(968, ids));
    assert.equal(result.suppressedInstanceIds.length, 0);
    assert.deepEqual([...result.unfulfilledSuppressionIds], ids);
    assert.deepEqual(plain(refused.context.paints), plain(baseline.context.paints));
  }
});

test('strict text requests reject domain/root/seed/locale/scenario/frame/scale and malformed suppression without leaking state', async () => {
  const {variant} = adapters(); await variant.ready();
  for (const [field, value, message] of [['frameDomain', 'root', /frame domain/], ['rootFrame', 7, /root frame/],
    ['seed', 1, /seed 0/], ['seed', 4294967296, /seed 0/], ['lang', 'es', /source-proven language/],
    ['scenario', 'other', /unsupported scenario/], ['frame', 0, /safe integer/], ['frame', 969, /safe integer/],
    ['frame', 1.5, /safe integer/], ['renderScale', 2, /native scale 1/]])
    assert.throws(() => variant.renderWithText(canvas(), {...requested(1, [TITLE]), [field]: value}), message);
  for (const ids of [[TITLE, TITLE], [42], 'title'])
    assert.throws(() => variant.renderWithText(canvas(), {...requested(1), text: {suppressInstanceIds: ids}}), /unique suppression/);
  assert.throws(() => variant.renderWithText({...canvas(), width: 1600}, requested(1, [TITLE])), /exactly 800x600/);
  assert.throws(() => variant.renderWithText({...canvas(), getContext: () => null}, requested(1, [TITLE])), /context is unavailable/);
  const target = canvas();
  assert.deepEqual([...variant.renderWithText(target, requested(1, [TITLE])).suppressedInstanceIds], [TITLE]);
  assert.equal(variant.renderWithText(target, requested(1)).suppressedInstanceIds.length, 0);
  assert.equal(target.context.paints.filter(draw => draw.object === 'shape394').length, 1);
});

test('text rendering omits only the ordinary wrapper staging allocation and retains balanced source transform/mask state', async () => {
  const {variant, allocations} = adapters(); await variant.ready();
  const target = canvas(), initial = allocations();
  variant.render(target, requested(968));
  const ordinaryAllocations = allocations() - initial, second = allocations();
  variant.renderWithText(target, requested(968, [TITLE]));
  assert.equal(allocations() - second, ordinaryAllocations - 1);
  assert.equal(target.context._savedMatrices.length, 1);
  variant.renderWithText(target, requested(1, [TITLE]));
  assert.equal(target.context._savedMatrices.length, 1);
  variant.render(target, requested(968));
  assert.equal(target.context.paints.filter(draw => draw.object === 'shape394').length, 1);
});

async function temporaryRoot() {
  const root = await realpath(await mkdtemp(path.join(tmpdir(), 'p005-typography-')));
  await mkdir(path.join(root, WORK, 'candidate-v2'), {recursive: true});
  await writeFile(path.join(root, WORK, 'candidate-v2/canvas-renderer.js'), safeJavascript);
  return root;
}

test('physical first write emits only three deterministic outputs, checks them, and never edits the original candidate', async () => {
  const root = await temporaryRoot();
  try {
    await assert.rejects(buildP005TypographyFiles({root, source}), {code: 'ENOENT'});
    const manifest = await buildP005TypographyFiles({root, source, check: false});
    await buildP005TypographyFiles({root, source, check: true});
    const meta = JSON.parse(await readFile(path.join(root, WORK, 'typography-v1/runtime-meta.json'), 'utf8'));
    const evidence = JSON.parse(await readFile(path.join(root, WORK, 'typography-v1/source-evidence.json'), 'utf8'));
    assert.equal(meta.runtimeSha256, manifest.runtimeSha256);
    assert.equal(meta.runtimeBytes, Buffer.byteLength(generated.code));
    assert.equal(evidence.generator.sha256.length, 64);
    assert.equal(await readFile(path.join(root, WORK, 'candidate-v2/canvas-renderer.js'), 'utf8'), safeJavascript);
    await writeFile(path.join(root, WORK, 'typography-v1/canvas-renderer.js'), 'changed');
    await assert.rejects(buildP005TypographyFiles({root, source, check: true}), /output drift/);
    await assert.rejects(buildP005TypographyFiles({root, source, check: false}), /refusing to overwrite changed/);
    assert.equal(await readFile(path.join(root, WORK, 'typography-v1/canvas-renderer.js'), 'utf8'), 'changed');
  } finally {await rm(root, {recursive: true, force: true});}
});

test('preflight drift in one existing output prevents publishing any missing outputs', async () => {
  const root = await temporaryRoot();
  try {
    const out = path.join(root, WORK, 'typography-v1'); await mkdir(out);
    await writeFile(path.join(out, 'runtime-meta.json'), 'foreign');
    await assert.rejects(buildP005TypographyFiles({root, source, check: false}), /refusing to overwrite changed/);
    await assert.rejects(lstat(path.join(out, 'canvas-renderer.js')), {code: 'ENOENT'});
    await assert.rejects(lstat(path.join(out, 'source-evidence.json')), {code: 'ENOENT'});
  } finally {await rm(root, {recursive: true, force: true});}
});

test('symlinked source or output members fail closed before write', async () => {
  const root = await temporaryRoot();
  try {
    const linked = path.join(root, 'source.swf'); await symlink(source, linked);
    await assert.rejects(buildP005TypographyFiles({root, source: linked, check: false}), /physical path without symlinks/);
    const out = path.join(root, WORK, 'typography-v1'); await mkdir(out);
    await symlink(path.join(root, WORK, 'candidate-v2/canvas-renderer.js'), path.join(out, 'canvas-renderer.js'));
    await assert.rejects(buildP005TypographyFiles({root, source, check: false}), /physical path without symlinks/);
    await assert.rejects(lstat(path.join(out, 'runtime-meta.json')), {code: 'ENOENT'});
  } finally {await rm(root, {recursive: true, force: true});}
});

test('a dangling later output symlink is rejected before publishing the earlier runtime', async () => {
  const root = await temporaryRoot();
  try {
    const out = path.join(root, WORK, 'typography-v1'); await mkdir(out);
    await symlink(path.join(root, 'missing.json'), path.join(out, 'runtime-meta.json'));
    await assert.rejects(buildP005TypographyFiles({root, source, check: false}), /physical path without symlinks/);
    await assert.rejects(lstat(path.join(out, 'canvas-renderer.js')), {code: 'ENOENT'});
    await assert.rejects(lstat(path.join(out, 'source-evidence.json')), {code: 'ENOENT'});
  } finally {await rm(root, {recursive: true, force: true});}
});
