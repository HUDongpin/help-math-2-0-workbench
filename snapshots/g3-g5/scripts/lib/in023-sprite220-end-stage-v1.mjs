import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export const IN023_BASE_SHA256 = '8642ea521833f5b508a724c68774b32717db4679daa0f5e5329801c4b4cb1268';
export const IN023_EFFECTIVE_SHA256 = 'c659e8aa21c29ca98c858c4c45c865faed4434b287fe6d465d5cc8c95610248d';
export const IN023_BASE_BYTES = 21295262;
export const IN023_EFFECTIVE_BYTES = 4835033;
export const IN023_ASSET_PATH = 'courses/course-g03-l04-in-023/canvas-renderer.js';
export const IN023_SWF_SHA256 = '2adb8ed7c095fa5b3be61fa9197642ec23c60baaad051e18750198fe975a598a';
export const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const PARAMETERS = ['ctx', 'ctrans', 'frame', 'ratio', 'time', 'clips'];
const LOCALS = ['ccanvas', 'cctx', 'ms', 'nctx', 'o'];
const PREFIX = '\n\tctx.save();\n\tctx.transform(1,0,0,1,359.4,200.3);\n\tvar clips = [];\n\tvar frame_cnt = 977;\n\tframe = frame % frame_cnt;\n\t';
const SUFFIX = '\n\tctx.restore();\n';
const TABLE = '__hmIn023FrameHandlers';
const DISPATCH = `if (frame === (frame | 0) && frame >= 0 && frame < 977) {\n\t\tctx = ${TABLE}[frame](ctx,ctrans,frame,ratio,time,clips);\n\t}`;
const helperName = (index) => '__hmIn023Body' + String(index).padStart(3, '0');

function keys(record, allowed, label) {
  assert(record && typeof record === 'object' && !Array.isArray(record), label);
  assert.deepEqual(Object.keys(record).sort(), [...allowed].sort(), label + ' has missing or unknown fields');
}

function interval(pair, length, label) {
  assert(Array.isArray(pair) && pair.length === 2, label);
  const [start, end] = pair;
  assert(Number.isInteger(start) && Number.isInteger(end) && start >= 0 && start < end && end <= length, label);
}

// The IR is a compact, reviewed extraction product for this ONE immutable input.
// It contains original source ranges, never replacement source expressions.
export function generateIn023EndStage(baseBytes, ir) {
  assert(Buffer.isBuffer(baseBytes), 'Base must be bytes');
  assert.equal(baseBytes.length, IN023_BASE_BYTES, 'Unexpected base size');
  assert.equal(digest(baseBytes), IN023_BASE_SHA256, 'Unrecognized base renderer');
  const source = baseBytes.toString('utf8');
  assert(Buffer.from(source, 'utf8').equals(baseBytes), 'UTF8 roundtrip mismatch');
  keys(ir, ['schemaVersion', 'kind', 'animationId', 'sourceSha256', 'sourceSwfSha256', 'outputSha256', 'rootRange', 'headerRange', 'switchRange', 'beforeRootSha256', 'afterRootSha256', 'parameters', 'locals', 'groups', 'cases'], 'Closed IR schema');
  assert.equal(ir.schemaVersion, 1);
  assert.equal(ir?.kind, 'in023-sprite220-exact-body-ir-v1');
  assert.equal(ir.animationId, 'course-g03-l04-in-023');
  assert.equal(ir.sourceSha256, IN023_BASE_SHA256);
  assert.equal(ir.sourceSwfSha256, IN023_SWF_SHA256);
  assert.equal(ir.outputSha256, IN023_EFFECTIVE_SHA256);
  assert.deepEqual(ir.parameters, PARAMETERS);
  assert.deepEqual(ir.locals, LOCALS);
  assert.equal(ir.cases.length, 977);
  assert.equal(ir.groups.length, 208);
  interval(ir.rootRange, source.length, 'Root range');
  interval(ir.headerRange, source.length, 'Header range');
  interval(ir.switchRange, source.length, 'Switch range');
  const [rootStart, rootEnd] = ir.rootRange;
  const [switchStart, switchEnd] = ir.switchRange;
  assert.equal(ir.headerRange[0], rootStart);
  assert(ir.headerRange[1] < switchStart && switchStart < switchEnd && switchEnd < rootEnd);
  const header = source.slice(...ir.headerRange);
  assert(/^function\s+sprite220\s*\(\s*ctx\s*,\s*ctrans\s*,\s*frame\s*,\s*ratio\s*,\s*time\s*\)\s*\{$/.test(header));
  assert.equal(source.slice(ir.headerRange[1], switchStart), PREFIX);
  assert.equal(source.slice(switchEnd, rootEnd - 1), SUFFIX);
  assert.equal(source[rootEnd - 1], '}');
  const before = source.slice(0, rootStart), after = source.slice(rootEnd);
  assert.equal(Buffer.byteLength(before) + Buffer.byteLength(after), 196899);
  assert.equal(digest(before), ir.beforeRootSha256);
  assert.equal(digest(after), ir.afterRootSha256);
  assert(!before.includes('__hmIn023Body') && !after.includes('__hmIn023Body'));
  assert(!before.includes(TABLE) && !after.includes(TABLE));

  const groups = ir.groups.map((group, index) => {
    keys(group, ['index', 'firstCase', 'bodyRange', 'bodySha256', 'bodyBytes'], 'Closed group schema');
    assert.equal(group.index, index);
    interval(group.bodyRange, source.length, 'Body range');
    const body = source.slice(...group.bodyRange);
    assert.equal(digest(body), group.bodySha256, 'Original group body changed');
    assert.equal(Buffer.byteLength(body), group.bodyBytes);
    return {body, firstCase: group.firstCase};
  });
  let previousEnd = switchStart;
  const mapping = ir.cases.map((row, ordinal) => {
    keys(row, ['ordinal', 'group', 'caseRange', 'bodyRange'], 'Closed case schema');
    assert.equal(row.ordinal, ordinal);
    assert(Number.isInteger(row.group) && row.group >= 0 && row.group < 208);
    interval(row.caseRange, source.length, 'Case range');
    interval(row.bodyRange, source.length, 'Case body range');
    const [start, end] = row.caseRange;
    assert(start >= previousEnd && row.bodyRange[0] > start && row.bodyRange[1] < end);
    const gap = source.slice(previousEnd, start);
    assert(ordinal === 0 ? /^switch\s*\(\s*frame\s*\)\s*\{\s*$/.test(gap) : /^\s*$/.test(gap));
    const label = source.slice(start, row.bodyRange[0]).match(/^case\s+(\d+):$/);
    assert(label && Number(label[1]) === ordinal, 'Case order/label mismatch');
    assert.equal(source.slice(row.bodyRange[1], end), 'break;');
    assert.equal(source.slice(...row.bodyRange), groups[row.group].body, 'Ordinal body mapping mismatch');
    previousEnd = end;
    return helperName(row.group);
  });
  assert(/^\s*\}$/.test(source.slice(previousEnd, switchEnd)), 'Trailing switch content changed');
  for (const [index, group] of groups.entries()) {
    const first = ir.cases.findIndex((row) => row.group === index);
    assert(first >= 0 && first === group.firstCase);
    assert.deepEqual(ir.groups[index].bodyRange, ir.cases[first].bodyRange);
  }
  const table = `var ${TABLE} = Object.freeze([\n${mapping.map((name) => '\t' + name).join(',\n')}\n]);\n\n`;
  const helpers = groups.map((group, index) => `function ${helperName(index)}(${PARAMETERS.join(',')}) {\n\tvar ${LOCALS.join(',')};${group.body}return ctx;\n}\n`).join('\n');
  const main = header + PREFIX + DISPATCH + SUFFIX + '}';
  const output = Buffer.from(before + '/* in023-exact-body-split-dedup-v1: exact audited case bodies; work-only prototype. */\n' + table + helpers + '\n' + main + after);
  assert.equal(output.length, IN023_EFFECTIVE_BYTES, 'Effective output size mismatch');
  assert.equal(digest(output), IN023_EFFECTIVE_SHA256, 'Effective output differs from reviewed renderer');
  return output;
}
