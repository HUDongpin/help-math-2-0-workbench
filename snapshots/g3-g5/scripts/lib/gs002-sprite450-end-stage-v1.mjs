import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export const GS002_BASE_SHA256 = '6f5352b19af6ff2de5b8ad943518fcee5baa4603b745864b5cc6f9402554d333';
export const GS002_EFFECTIVE_SHA256 = 'fe27cea192b26e24e6ecb94c8b06472c4a9b5db67c6adcc8a1fc6ead45632eb2';
export const GS002_BASE_BYTES = 18740628;
export const GS002_EFFECTIVE_BYTES = 9036623;
export const GS002_ASSET_PATH = 'courses/course-g03-l01-gs-002/canvas-renderer.js';
export const GS002_SWF_SHA256 = '0365097ba05bae67b5a8a01689d9b0cb7c71f542f689ac59b26ff203657dc908';
export const GS002_IR_SHA256 = 'd9e46c3d545d7a7a49d6935e67f9c8f620ff20f51cbf767161505e91e0873f56';
export const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const PARAMETERS = ['ctx', 'ctrans', 'frame', 'ratio', 'time', 'clips'];
const LOCALS = ['ccanvas', 'cctx', 'ms', 'nctx', 'o'];
const PREFIX = '\n\tctx.save();\n\tctx.transform(1,0,0,1,1900.9,388.35);\n\tvar clips = [];\n\tvar frame_cnt = 775;\n\tframe = frame % frame_cnt;\n\t';
const SUFFIX = '\n\tctx.restore();\n';
const ROOT_RANGE = [5914974, 18720456];
const ROOT_SHA = '50fbf16820397f32661808f6557903b9f30dc676e24fc03444b355f5fab00a48';
const BEFORE_SHA = '33a539aa0bb61a9e5cddd8840b71ea15a08d268988abf2ee47e0f14b693fc9a0';
const AFTER_SHA = '12ef5acfa331870a4d768912d74c9994767c1d67e6f75df6e8b5cf42d47c2b6c';
const helperName = index => '__hmGs002Sprite450Frame' + String(index).padStart(3, '0');

function keys(record, allowed, label) {
  assert(record && typeof record === 'object' && !Array.isArray(record), label + ' must be a record');
  assert.equal(Object.getPrototypeOf(record), Object.prototype, label + ' must be a plain JSON record');
  const actual = Reflect.ownKeys(record);
  assert(actual.every(key => typeof key === 'string'), label + ' rejects symbol fields');
  assert.deepEqual(actual.sort(), [...allowed].sort(), label + ' has missing or unknown fields');
  assert(Object.values(Object.getOwnPropertyDescriptors(record)).every(d => Object.hasOwn(d, 'value')), label + ' rejects accessors');
}

function array(value, length, label) {
  assert(Array.isArray(value) && value.length === length, label + ' length');
  assert.equal(Object.getPrototypeOf(value), Array.prototype, label + ' must be a plain JSON array');
  assert.deepEqual(Reflect.ownKeys(value), [...Array.from({length}, (_, i) => String(i)), 'length'], label + ' rejects holes or extra fields');
  assert(Object.values(Object.getOwnPropertyDescriptors(value)).every(d => Object.hasOwn(d, 'value')), label + ' rejects accessors');
}

function interval(value, length, label) {
  array(value, 2, label);
  const [start, end] = value;
  assert(Number.isSafeInteger(start) && Number.isSafeInteger(end) && start >= 0 && start < end && end <= length, label);
}

// This is a portable end-stage emitter for ONE immutable source and IR. It uses
// only Node built-ins, retains original source slices and has no parser, npm,
// workspace path, filesystem, browser or product-writing dependency.
export function generateGs002EndStage(baseBytes, ir) {
  assert(Buffer.isBuffer(baseBytes), 'Base must be bytes');
  assert.equal(baseBytes.length, GS002_BASE_BYTES, 'Unexpected base size');
  assert.equal(digest(baseBytes), GS002_BASE_SHA256, 'Unrecognized base renderer');
  const source = baseBytes.toString('utf8');
  assert(Buffer.from(source, 'utf8').equals(baseBytes), 'UTF-8 source roundtrip failed');

  keys(ir, ['schemaVersion', 'kind', 'animationId', 'source', 'root', 'parameters', 'locals', 'groups', 'cases', 'output'], 'Closed IR');
  keys(ir.source, ['bytes', 'sha256', 'swfSha256'], 'IR source');
  keys(ir.root, ['name', 'range', 'headerRange', 'switchRange', 'sha256', 'beforeSha256', 'afterSha256', 'prefixSha256', 'suffixSha256'], 'IR root');
  keys(ir.output, ['bytes', 'sha256'], 'IR output');
  array(ir.parameters, 6, 'IR parameters'); array(ir.locals, 5, 'IR locals');
  array(ir.groups, 182, 'IR groups'); array(ir.cases, 775, 'IR cases');
  interval(ir.root.range, source.length, 'Root range');
  interval(ir.root.headerRange, source.length, 'Header range');
  interval(ir.root.switchRange, source.length, 'Switch range');
  for (const group of ir.groups) {
    keys(group, ['index', 'firstCase', 'bodyRange', 'bodySha256', 'bodyBytes'], 'IR group');
    interval(group.bodyRange, source.length, 'Group body range');
  }
  for (const row of ir.cases) {
    keys(row, ['ordinal', 'group', 'caseRange', 'bodyRange', 'caseSha256'], 'IR case');
    interval(row.caseRange, source.length, 'Case range'); interval(row.bodyRange, source.length, 'Case body range');
  }
  assert.equal(ir.schemaVersion, 1); assert.equal(ir.kind, 'gs002-sprite450-exact-body-ir-v1');
  assert.equal(ir.animationId, 'course-g03-l01-gs-002');
  assert.deepEqual(ir.source, {bytes: GS002_BASE_BYTES, sha256: GS002_BASE_SHA256, swfSha256: GS002_SWF_SHA256});
  assert.deepEqual(ir.output, {bytes: GS002_EFFECTIVE_BYTES, sha256: GS002_EFFECTIVE_SHA256});
  assert.deepEqual(ir.parameters, PARAMETERS); assert.deepEqual(ir.locals, LOCALS);
  // Pin the exact reviewed JSON serialization, including all range/mapping data.
  // Unknown replacement expressions and altered mappings cannot enter the emitter.
  assert.equal(digest(JSON.stringify(ir, null, 2) + '\n'), GS002_IR_SHA256, 'IR is not the exact reviewed extraction');
  assert.equal(ir.root.name, 'sprite450'); assert.deepEqual(ir.root.range, ROOT_RANGE);
  assert.deepEqual(ir.root.headerRange, [5914974, 5915022]);
  assert.deepEqual(ir.root.switchRange, [5915143, 18720438]);
  assert.equal(ir.root.sha256, ROOT_SHA); assert.equal(ir.root.beforeSha256, BEFORE_SHA); assert.equal(ir.root.afterSha256, AFTER_SHA);
  assert.equal(ir.root.prefixSha256, digest(PREFIX)); assert.equal(ir.root.suffixSha256, digest(SUFFIX));
  const [rootStart, rootEnd] = ir.root.range, [switchStart, switchEnd] = ir.root.switchRange;
  const before = source.slice(0, rootStart), after = source.slice(rootEnd), header = source.slice(...ir.root.headerRange);
  assert.equal(digest(source.slice(rootStart, rootEnd)), ROOT_SHA);
  assert.equal(header, 'function sprite450(ctx,ctrans,frame,ratio,time){');
  assert.equal(source.slice(ir.root.headerRange[1], switchStart), PREFIX);
  assert.equal(source.slice(switchEnd, rootEnd - 1), SUFFIX); assert.equal(source[rootEnd - 1], '}');
  assert.equal(Buffer.byteLength(before), 5914974); assert.equal(digest(before), BEFORE_SHA);
  assert.equal(Buffer.byteLength(after), 20172); assert.equal(digest(after), AFTER_SHA);
  assert(!source.includes('__hmGs002Sprite450Frame'), 'Helper namespace collision');
  const groups = ir.groups.map((group, index) => {
    assert.equal(group.index, index);
    assert(Number.isSafeInteger(group.firstCase) && group.firstCase >= 0 && group.firstCase < 775);
    const body = source.slice(...group.bodyRange);
    assert.equal(digest(body), group.bodySha256); assert.equal(Buffer.byteLength(body), group.bodyBytes);
    return {body, firstCase: group.firstCase};
  });
  assert.equal(new Set(ir.groups.map(group => group.bodySha256)).size, 182, 'Exact groups must be distinct');
  assert.equal(ir.groups.reduce((sum, group) => sum + group.bodyBytes, 0), 3012248);
  let previousEnd = switchStart, weightedBodyBytes = 0;
  const dispatch = [source.slice(switchStart, ir.cases[0].caseRange[0])];
  for (const [ordinal, row] of ir.cases.entries()) {
    assert.equal(row.ordinal, ordinal);
    assert(Number.isSafeInteger(row.group) && row.group >= 0 && row.group < 182);
    const [start, end] = row.caseRange, [bodyStart, bodyEnd] = row.bodyRange;
    assert(start >= previousEnd && bodyStart > start && bodyEnd < end);
    const gap = source.slice(previousEnd, start);
    assert(ordinal === 0 ? gap === 'switch(frame){\n\t\t' : /^\s*$/.test(gap), 'Unexpected switch gap');
    const label = source.slice(start, bodyStart);
    assert(new RegExp('^case ' + ordinal + ':\\s+$').test(label), 'Original case label mismatch');
    assert.equal(source.slice(bodyEnd, end), 'break;');
    assert.equal(source.slice(bodyStart, bodyEnd), groups[row.group].body, 'Case-to-body mapping changed');
    assert.equal(digest(source.slice(start, end)), row.caseSha256);
    weightedBodyBytes += ir.groups[row.group].bodyBytes;
    const nextStart = ir.cases[ordinal + 1]?.caseRange[0] ?? switchEnd;
    dispatch.push(label + `ctx = ${helperName(row.group)}(${PARAMETERS.join(',')});\n\t\t\t`
      + source.slice(bodyEnd, end) + source.slice(end, nextStart));
    previousEnd = end;
  }
  assert.equal(weightedBodyBytes, 12788338);
  assert(/^\s*\}$/.test(source.slice(previousEnd, switchEnd)), 'Unexpected switch suffix');
  for (const [index, group] of groups.entries()) {
    const firstCase = ir.cases.findIndex(row => row.group === index);
    assert(firstCase >= 0 && firstCase === group.firstCase);
    assert.deepEqual(ir.groups[index].bodyRange, ir.cases[firstCase].bodyRange);
  }
  const helpers = groups.map((group, index) => `function ${helperName(index)}(${PARAMETERS.join(',')}) {\n\t${group.body}return ctx;\n}\n`).join('\n');
  const main = header + PREFIX + dispatch.join('') + SUFFIX + '}';
  const output = Buffer.from(before + '/* gs002-exact-body-split-dedup-v1: exact audited case bodies; work-only prototype. */\n'
    + helpers + '\n' + main + after);
  assert.equal(output.length, GS002_EFFECTIVE_BYTES, 'Effective output size mismatch');
  assert.equal(digest(output), GS002_EFFECTIVE_SHA256, 'Effective output differs from the reviewed prototype');
  return output;
}
