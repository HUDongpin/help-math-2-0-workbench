// Work-only G5-specific portable emitter proposal; method reused from the unchanged G3 GS002 emitter.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export const G5L1_GS002_BASE_SHA256 = '625162519b5bfad2c088e1d0a612409a3bc006a3b5b73f0d2a235a70c95d91e5';
export const G5L1_GS002_EFFECTIVE_SHA256 = 'b35265e1c0dd5ce0da39cf89468ddd9a9b4c08895de3b343f3981fb947de35cd';
export const G5L1_GS002_BASE_BYTES = 14818856;
export const G5L1_GS002_EFFECTIVE_BYTES = 7320870;
export const G5L1_GS002_ASSET_PATH = 'courses/course-g05-l01-gs-002/canvas-renderer.js';
export const G5L1_GS002_SWF_SHA256 = 'ea13ae04647f7436f91830dc24019bee011ee7f5f65671baaa6328b2cb233613';
export const G5L1_GS002_IR_SHA256 = 'fc944d58a84c39760968b0ffea1c4254fb4457151e3d07ab789aa7a8c2779500';
export const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const PARAMETERS = ['ctx', 'ctrans', 'frame', 'ratio', 'time', 'clips'];
const LOCALS = ['ccanvas', 'cctx', 'ms', 'nctx', 'o'];
const PREFIX = '\n\tctx.save();\n\tctx.transform(1,0,0,1,1900.9,388.35);\n\tvar clips = [];\n\tvar frame_cnt = 785;\n\tframe = frame % frame_cnt;\n\t';
const SUFFIX = '\n\tctx.restore();\n';
const ROOT_RANGE = [5005616, 14798401];
const ROOT_SHA = '5a4b9d18a8b91bfaf0298351ba73c6bfa85100e3f16891cd097b00e7f2bfc4fd';
const BEFORE_SHA = '7303504527693dd2151be20c1b1988e9a5626236a708438266f9f0cee7fa70ab';
const AFTER_SHA = 'fb7dad61fa973ca400050905d5fb6c8132a12c209297edc44427e43c00e83932';
const helperName = index => '__hmG5L1Gs002Sprite457Frame' + String(index).padStart(3, '0');

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
export function generateG5L1Gs002EndStage(baseBytes, ir) {
  assert(Buffer.isBuffer(baseBytes), 'Base must be bytes');
  assert.equal(baseBytes.length, G5L1_GS002_BASE_BYTES, 'Unexpected base size');
  assert.equal(digest(baseBytes), G5L1_GS002_BASE_SHA256, 'Unrecognized base renderer');
  const source = baseBytes.toString('utf8');
  assert(Buffer.from(source, 'utf8').equals(baseBytes), 'UTF-8 source roundtrip failed');

  keys(ir, ['schemaVersion', 'kind', 'animationId', 'source', 'root', 'parameters', 'locals', 'groups', 'cases', 'output'], 'Closed IR');
  keys(ir.source, ['bytes', 'sha256', 'swfSha256'], 'IR source');
  keys(ir.root, ['name', 'range', 'headerRange', 'switchRange', 'sha256', 'beforeSha256', 'afterSha256', 'prefixSha256', 'suffixSha256'], 'IR root');
  keys(ir.output, ['bytes', 'sha256'], 'IR output');
  array(ir.parameters, 6, 'IR parameters'); array(ir.locals, 5, 'IR locals');
  array(ir.groups, 174, 'IR groups'); array(ir.cases, 785, 'IR cases');
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
  assert.equal(ir.schemaVersion, 1); assert.equal(ir.kind, 'g5l1-gs002-sprite457-exact-body-ir-v1');
  assert.equal(ir.animationId, 'course-g05-l01-gs-002');
  assert.deepEqual(ir.source, {bytes: G5L1_GS002_BASE_BYTES, sha256: G5L1_GS002_BASE_SHA256, swfSha256: G5L1_GS002_SWF_SHA256});
  assert.deepEqual(ir.output, {bytes: G5L1_GS002_EFFECTIVE_BYTES, sha256: G5L1_GS002_EFFECTIVE_SHA256});
  assert.deepEqual(ir.parameters, PARAMETERS); assert.deepEqual(ir.locals, LOCALS);
  // Pin the exact reviewed JSON serialization, including all range/mapping data.
  // Unknown replacement expressions and altered mappings cannot enter the emitter.
  assert.equal(digest(JSON.stringify(ir, null, 2) + '\n'), G5L1_GS002_IR_SHA256, 'IR is not the exact reviewed extraction');
  assert.equal(ir.root.name, 'sprite457'); assert.deepEqual(ir.root.range, ROOT_RANGE);
  assert.deepEqual(ir.root.headerRange, [5005616, 5005664]);
  assert.deepEqual(ir.root.switchRange, [5005785, 14798383]);
  assert.equal(ir.root.sha256, ROOT_SHA); assert.equal(ir.root.beforeSha256, BEFORE_SHA); assert.equal(ir.root.afterSha256, AFTER_SHA);
  assert.equal(ir.root.prefixSha256, digest(PREFIX)); assert.equal(ir.root.suffixSha256, digest(SUFFIX));
  const [rootStart, rootEnd] = ir.root.range, [switchStart, switchEnd] = ir.root.switchRange;
  const before = source.slice(0, rootStart), after = source.slice(rootEnd), header = source.slice(...ir.root.headerRange);
  assert.equal(digest(source.slice(rootStart, rootEnd)), ROOT_SHA);
  assert.equal(header, 'function sprite457(ctx,ctrans,frame,ratio,time){');
  assert.equal(source.slice(ir.root.headerRange[1], switchStart), PREFIX);
  assert.equal(source.slice(switchEnd, rootEnd - 1), SUFFIX); assert.equal(source[rootEnd - 1], '}');
  assert.equal(Buffer.byteLength(before), 5005616); assert.equal(digest(before), BEFORE_SHA);
  assert.equal(Buffer.byteLength(after), 20455); assert.equal(digest(after), AFTER_SHA);
  assert(!source.includes('__hmG5L1Gs002Sprite457Frame'), 'Helper namespace collision');
  const groups = ir.groups.map((group, index) => {
    assert.equal(group.index, index);
    assert(Number.isSafeInteger(group.firstCase) && group.firstCase >= 0 && group.firstCase < 785);
    const body = source.slice(...group.bodyRange);
    assert.equal(digest(body), group.bodySha256); assert.equal(Buffer.byteLength(body), group.bodyBytes);
    return {body, firstCase: group.firstCase};
  });
  assert.equal(new Set(ir.groups.map(group => group.bodySha256)).size, 174, 'Exact groups must be distinct');
  assert.equal(ir.groups.reduce((sum, group) => sum + group.bodyBytes, 0), 2201501);
  let previousEnd = switchStart, weightedBodyBytes = 0;
  const dispatch = [source.slice(switchStart, ir.cases[0].caseRange[0])];
  for (const [ordinal, row] of ir.cases.entries()) {
    assert.equal(row.ordinal, ordinal);
    assert(Number.isSafeInteger(row.group) && row.group >= 0 && row.group < 174);
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
  assert.equal(weightedBodyBytes, 9775421);
  assert(/^\s*\}$/.test(source.slice(previousEnd, switchEnd)), 'Unexpected switch suffix');
  for (const [index, group] of groups.entries()) {
    const firstCase = ir.cases.findIndex(row => row.group === index);
    assert(firstCase >= 0 && firstCase === group.firstCase);
    assert.deepEqual(ir.groups[index].bodyRange, ir.cases[firstCase].bodyRange);
  }
  const helpers = groups.map((group, index) => `function ${helperName(index)}(${PARAMETERS.join(',')}) {\n\t${group.body}return ctx;\n}\n`).join('\n');
  const main = header + PREFIX + dispatch.join('') + SUFFIX + '}';
  const output = Buffer.from(before + '/* g5l1-gs002-exact-body-split-dedup-v1: exact audited case bodies; work-only prototype. */\n'
    + helpers + '\n' + main + after);
  assert.equal(output.length, G5L1_GS002_EFFECTIVE_BYTES, 'Effective output size mismatch');
  assert.equal(digest(output), G5L1_GS002_EFFECTIVE_SHA256, 'Effective output differs from the reviewed prototype');
  return output;
}
