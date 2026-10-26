import assert from 'node:assert/strict';
import test from 'node:test';
import {Script} from 'node:vm';
import {readFile, writeFile, mkdtemp, mkdir, rm} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {parse} from 'acorn';
import {maskBody} from './build-g678-alg-l12-p006-mask-candidate.mjs';
import {buildP006Typography, buildP006TypographyFiles, P006_TYPOGRAPHY_ID as ID,
  P006_TYPOGRAPHY_REGISTRY as REGISTRY, P006_TYPOGRAPHY_INSTANCES as INSTANCES} from './build-g678-alg-l12-p006-typography.mjs';

const WORK = `migrations/${ID}`;
const source = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/ALG001/L12/RW/L12RW06.swf';
const sourceBytes = readFileSync(source);
const safeJavascript = readFileSync(`${WORK}/candidate-v2/canvas-renderer.js`, 'utf8');
const input = {sourceBytes, safeJavascript};
const generated = buildP006Typography(input);

function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  if (node.type) visit(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(item => walk(item, visit));
    else if (value && typeof value === 'object') walk(value, visit);
  }
}

/** Test-only leaf dispatch recorder. The original mask, composition, placement and
 * transform execution is retained, so the two real adapter programs can be compared
 * without pretending a Node mock provides raster or original-runtime evidence. */
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
  const context = new Context();
  const attributes = {};
  return {width: 800, height: 600, context, style: {}, attributes,
    getContext: () => context,
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
const plain = value => JSON.parse(JSON.stringify(value));
const requested = (frame, ids = []) => ({frame, lang: 'en', scenario: 'source-static-frame', seed: 0,
  renderScale: 1, text: {suppressInstanceIds: ids}});

test('generation pins candidate and source; output is deterministic with separate registry and source instance lineage', () => {
  const second = buildP006Typography(input);
  assert.equal(second.code, generated.code);
  assert.deepEqual(second.manifest, generated.manifest);
  assert.equal(generated.manifest.globalRegistry, REGISTRY);
  assert.deepEqual(generated.manifest.instrumentedSites, {question: 94, title: 1, underlines: 94, background: 101});
  assert.equal(generated.manifest.originalCandidate, 'candidate-v2');
  assert.deepEqual(generated.manifest.evidence.question.publicFrames, [249, 342]);
  assert.equal(generated.manifest.evidence.title.path[0].instanceId, 'root/depth-65/generation-1');
  assert.equal(generated.manifest.evidence.background.path[1].instanceId, 'sprite-53/depth-17/generation-17');
  assert.deepEqual(generated.manifest.evidence.background.alphaUpdates.map(update => update.multiplyAlpha), [0, 43, 85, 128, 171, 213, 256]);
  assert.equal(generated.manifest.evidence.offstageRootText54.suppressed, false);
  assert.throws(() => buildP006Typography({...input, safeJavascript: `${safeJavascript}\n`}), /candidate hash drift/);
  assert.throws(() => buildP006Typography({...input,
    safeJavascript: readFileSync(`${WORK}/candidate-v1/canvas-renderer.js`, 'utf8')}), /candidate hash drift/);
  const changed = Buffer.from(sourceBytes); changed[100] ^= 1;
  assert.throws(() => buildP006Typography({...input, sourceBytes: changed}), /source hash drift/);
});

test('current v2 mask correction survives typography generation with opaque fill and no obsolete transparent stroke', () => {
  for (const name of ['shape1', 'morphshape43', 'shape52']) {
    const current = maskBody(safeJavascript, name).text;
    const output = maskBody(generated.code, name).text;
    assert.equal(output, current, `current host mask ${name} changed`);
    assert.equal(output.includes('stroke'), false);
    for (const ratio of [0, 1, 32767, 65535]) {
      const calls = [];
      const context = {fill(rule) {calls.push({kind: 'fill', color: this.fillStyle, rule});}};
      const sandbox = {ctx: context, ratio,
        drawPath() {calls.push({kind: 'path'});},
        drawMorphPath() {calls.push({kind: 'morph'});}};
      new Script(`${output}\n${name}(ctx,null,0,ratio,0);`).runInNewContext(sandbox);
      assert.equal(calls.length, 2);
      assert.deepEqual(calls[1], {kind: 'fill', color: 'rgba(255,255,255,1)', rule: 'evenodd'});
    }
  }
});

test('every non-text drawing function and original mask/composition function body stays byte-identical', () => {
  function definitions(code) {
    const found = new Map();
    walk(parse(code, {ecmaVersion: 2022}), node => {
      if (node.type === 'FunctionDeclaration') found.set(node.id.name, code.slice(node.start, node.end));
    });
    return found;
  }
  const before = definitions(safeJavascript), after = definitions(generated.code);
  for (const [name, definition] of before) {
    if (['sprite53', 'sprite56', 'render'].includes(name)) continue;
    assert.equal(after.get(name), definition, `source definition changed: ${name}`);
  }
  const beforeMasks = [...before.get('sprite53').matchAll(/clips\.push|clips\.pop|createCanvas|applyTransforms|destination-in/g)].map(match => match[0]);
  const afterMasks = [...after.get('sprite53').matchAll(/clips\.push|clips\.pop|createCanvas|applyTransforms|destination-in/g)].map(match => match[0]);
  assert.deepEqual(afterMasks, beforeMasks);
});

test('ordinary render preserves actual source draw dispatch, transforms, mask composition and frame state', async () => {
  const {original, variant} = adapters();
  await Promise.all([original.ready(), variant.ready()]);
  for (const frame of [1, 2, 248, 249, 300, 337, 338, 342]) {
    const sourceTarget = canvas(), textTarget = canvas();
    const before = original.render(sourceTarget, requested(frame));
    const after = variant.render(textTarget, requested(frame));
    assert.deepEqual(plain(after), plain(before));
    assert.deepEqual(plain(textTarget.context.paints), plain(sourceTarget.context.paints), `frame ${frame}`);
    assert.deepEqual(plain(textTarget.context.composites), plain(sourceTarget.context.composites), `masks frame ${frame}`);
    assert.deepEqual(textTarget.attributes, sourceTarget.attributes);
  }
});

test('exact title, question, background and source glossary underline requests suppress only mapped occurrences; root text54 and other graphics survive', async () => {
  const {variant} = adapters(); await variant.ready();
  for (const frame of [249, 300, 337, 338, 342]) {
    const baseline = canvas(), changed = canvas();
    variant.renderWithText(baseline, requested(frame));
    const result = variant.renderWithText(changed, requested(frame, [INSTANCES.title, INSTANCES.question, INSTANCES.underlines, INSTANCES.background]));
    assert.deepEqual([...result.suppressedInstanceIds].sort(), [INSTANCES.title, INSTANCES.question, INSTANCES.underlines, INSTANCES.background].sort());
    assert.equal(result.unfulfilledSuppressionIds.length, 0);
    assert.equal(result.diagnostics.length, 0);
    const kept = baseline.context.paints.filter(draw => !['text46', 'shape55', 'shape44', 'shape42'].includes(draw.object));
    assert.deepEqual(plain(changed.context.paints), plain(kept), `only exact target draws change at ${frame}`);
    assert.equal(changed.context.paints.filter(draw => draw.object === 'text54').length, 1, 'offstage root text remains');
    assert.deepEqual(plain(changed.context.composites), plain(baseline.context.composites), 'source mask operations remain');
  }
});

test('question background suppression binds depth17 generation17 only, preserving every earlier generation and its alpha transition', async () => {
  const {variant} = adapters(); await variant.ready();
  for (let frame = 1; frame < 242; frame++) {
    const baseline = canvas(), inspected = canvas();
    variant.renderWithText(baseline, requested(frame));
    const result = variant.renderWithText(inspected, requested(frame, [INSTANCES.background]));
    assert.equal(result.suppressedInstanceIds.length, 0);
    assert.deepEqual([...result.unfulfilledSuppressionIds], [INSTANCES.background]);
    assert.deepEqual(plain(inspected.context.paints), plain(baseline.context.paints), `earlier depth17 generation at frame ${frame}`);
  }
  for (const frame of [242, 243, 244, 245, 246, 247, 248, 249, 337, 338, 342]) {
    const baseline = canvas(), replaced = canvas();
    variant.renderWithText(baseline, requested(frame));
    const result = variant.renderWithText(replaced, requested(frame, [INSTANCES.background]));
    assert.deepEqual([...result.suppressedInstanceIds], [INSTANCES.background]);
    assert.deepEqual(plain(replaced.context.paints), plain(baseline.context.paints.filter(draw => draw.object !== 'shape42')));
    assert.deepEqual(plain(replaced.context.composites), plain(baseline.context.composites), 'mask survives background replacement');
  }
  const target = canvas();
  const wrong = 'root:1:1:53/sprite-53:17:1:42';
  const refused = variant.renderWithText(target, requested(342, [wrong]));
  assert.equal(refused.suppressedInstanceIds.length, 0);
  assert.deepEqual([...refused.unfulfilledSuppressionIds], [wrong]);
  assert.equal(target.context.paints.filter(draw => draw.object === 'shape42').length, 1);
});

test('title is available before question; absent or unknown identities fail closed with complete source retained', async () => {
  const {variant} = adapters(); await variant.ready();
  const before = canvas();
  const titleOnly = variant.renderWithText(before, requested(1, [INSTANCES.title]));
  assert.deepEqual([...titleOnly.suppressedInstanceIds], [INSTANCES.title]);
  assert.equal(before.context.paints.some(draw => draw.object === 'shape55'), false);
  const inactive = variant.renderWithText(canvas(), requested(248, [INSTANCES.question]));
  assert.deepEqual([...inactive.suppressedInstanceIds], []);
  assert.deepEqual([...inactive.unfulfilledSuppressionIds], [INSTANCES.question]);
  const baseline = canvas(), incorrect = canvas();
  variant.renderWithText(baseline, requested(342));
  const wrongIds = ['text46', 'root/depth-3/generation-1>sprite-56/depth-1/generation-1', INSTANCES.title];
  const result = variant.renderWithText(incorrect, requested(342, wrongIds));
  assert.deepEqual([...result.suppressedInstanceIds], [], 'mixed unknown request suppresses nothing');
  assert.deepEqual([...result.unfulfilledSuppressionIds], wrongIds);
  assert.deepEqual(plain(incorrect.context.paints), plain(baseline.context.paints));
});

test('text rendering uses the supplied reusable surface without the ordinary wrapper staging allocation', async () => {
  const {variant, allocations} = adapters(); await variant.ready();
  const target = canvas();
  const start = allocations();
  variant.render(target, requested(342));
  const ordinaryAllocationCount = allocations() - start;
  const next = allocations();
  variant.renderWithText(target, requested(342, [INSTANCES.title, INSTANCES.question, INSTANCES.underlines, INSTANCES.background]));
  assert.equal(allocations() - next, ordinaryAllocationCount - 1, 'only source-required mask buffers remain');
  assert.equal(target.context._savedMatrices.length, 1, 'source transform stack is balanced');
  variant.renderWithText(target, requested(1, [INSTANCES.title]));
  assert.equal(target.context._savedMatrices.length, 1);
  const replay = variant.renderWithText(target, requested(342));
  assert.equal(replay.suppressedInstanceIds.length, 0, 'suppression is scoped to one synchronous render');
  assert.equal(target.context.paints.filter(draw => draw.object === 'text46').length, 1);
  assert.equal(target.context.paints.filter(draw => draw.object === 'shape55').length, 1);
});

test('invalid requests cannot leak suppression; native-only scale, identity, frame and canvas validation stay enforced', async () => {
  const {variant} = adapters(); await variant.ready();
  assert.equal(variant.metadata.animationId, ID);
  assert.deepEqual(plain(variant.metadata.nativeOnlyResolution), {width: 800, height: 600, supportedScales: [1]});
  assert.equal(variant.metadata.resolution, undefined, 'no unverified adaptive resolution claim');
  assert.throws(() => variant.renderWithText(canvas(), requested(0, [INSTANCES.title])), /safe integer/);
  assert.throws(() => variant.renderWithText(canvas(), {...requested(1), renderScale: 2}), /native scale 1/);
  assert.throws(() => variant.renderWithText(canvas(), {...requested(1), lang: 'es'}), /source-proven language/);
  assert.throws(() => variant.renderWithText(canvas(), requested(1, [INSTANCES.title, INSTANCES.title])), /unique suppression/);
  assert.throws(() => variant.renderWithText({...canvas(), width: 1600}, requested(1)), /exactly 800x600/);
  const target = canvas();
  assert.equal(variant.renderWithText(target, requested(342)).suppressedInstanceIds.length, 0);
  assert.equal(target.context.paints.some(draw => draw.object === 'shape55'), true);
});

test('file generation checks exact output hashes and refuses changed-output overwrite, preserving original candidate', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'p006-typography-'));
  try {
    await mkdir(path.join(root, WORK, 'candidate-v2'), {recursive: true});
    const candidate = path.join(root, WORK, 'candidate-v2/canvas-renderer.js');
    await writeFile(candidate, safeJavascript);
    const manifest = await buildP006TypographyFiles({root, source});
    await buildP006TypographyFiles({root, source, check: true});
    const meta = JSON.parse(await readFile(path.join(root, WORK, 'typography-v1/runtime-meta.json')));
    assert.equal(meta.runtimeSha256, manifest.runtimeSha256);
    assert.equal(meta.runtimeBytes, Buffer.byteLength(generated.code));
    assert.equal(await readFile(candidate, 'utf8'), safeJavascript);
    await writeFile(path.join(root, WORK, 'typography-v1/canvas-renderer.js'), 'changed');
    await assert.rejects(buildP006TypographyFiles({root, source, check: true}), /output drift/);
    await assert.rejects(buildP006TypographyFiles({root, source}), /refusing to overwrite changed/);
    assert.equal(await readFile(candidate, 'utf8'), safeJavascript);
  } finally {await rm(root, {recursive: true, force: true});}
});
