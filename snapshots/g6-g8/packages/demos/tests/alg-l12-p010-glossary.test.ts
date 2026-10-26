import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {inflateSync} from 'node:zlib';
import {
  P010_GLOSSARY_CLOSE_POLICY,
  P010_GLOSSARY_MAIN_FRAME_COUNT,
  P010_GLOSSARY_SOURCE_SHA256,
  P010_GLOSSARY_TERMS,
  initialP010GlossaryState,
  reduceP010Glossary,
  requestP010Glossary,
} from '../src/alg-l12-p010-glossary';

type Matrix = [number, number, number, number, number, number];
type Bounds = [number, number, number, number];
interface Pin {path: string; bytes: number; sha256: string}
interface Button {
  characterId: number;
  literalKey: string;
  instances: Array<{instanceId: string; firstFrame: number; lastFrameExclusive: number; depth: number}>;
  placements: Array<{instanceId: string; matrix: Matrix}>;
  statePlacements: Array<{characterId: number; matrix: Matrix; states: {hitTest: boolean}}>;
  as: Pin;
}
interface Geometry {
  sourceSha256: string;
  sourceEntryCondition: {mainFrameCount: number};
  textDefinitions: Array<{
    characterId: number;
    runs: Array<{
      sourceTextId: string; text: string;
      glyphs: Array<{glyphOrdinalInRun: number; unicode: string; inkBoundsInTextDefinitionTwips: Bounds | null}>;
    }>;
  }>;
  textInstances: Array<{
    instanceId: string; characterId: number;
    firstPose: {matrix: Matrix}; events: Array<{matrix?: Matrix}>;
  }>;
  runInstanceVisibilitySummary: Array<{
    instanceId: string; sourceTextId: string;
    firstAllInkBoundsContainedAndFullOpacityFrame: number;
  }>;
}

const audit = '../../../migrations/shared-alg001-l12-p010/audit/';
const read = (path: string) => readFileSync(new URL(path, import.meta.url));
const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const evidencePins = [
  ['source-input.swf', 'a846950547f7c3ab7b0445dfc2118d534565ffd352b6e9687ba8211e5d4a3fcd'],
  ['source-text-catalog.json', '0926104d8e08a517807e389ccdd4a13cef5081c9229afed4900f424f8fe561d1'],
  ['source-behavior.json', 'c584ad267cbca359c3196e7e5ca5cb54426124b864f45261ca4286c804d2cbd3'],
  ['source-keyterms.json', '9f524c88c59e9a3ce3a1e39e5461bb4b3c9c5b93e13c0d03daa60c2baeb41c07'],
  ['typography-source-geometry-v1.json', '2fb18d047c60819c8508e4414a7d4a193b62cd1f40df1cbf19cb56b2d43b1bcd'],
] as const;
const behavior = JSON.parse(read(`${audit}source-behavior.json`).toString()) as {
  sourceSha256: string; main: {frameCount: number}; buttons: Button[];
};
const geometry = JSON.parse(read(`${audit}typography-source-geometry-v1.json`).toString()) as Geometry;
const catalog = JSON.parse(read(`${audit}source-text-catalog.json`).toString()) as {
  shapeDefinitions: Array<{characterId: number; sourceTagOffset: number}>;
};
const keyterms = JSON.parse(read(`${audit}source-keyterms.json`).toString()) as {
  sourceSha256: string; uniqueLiteralKeyCount: number; buttonInstanceCount: number;
  explicitCaseCrosswalks: Array<{from: string; to: string}>;
  sources: Array<{records: Array<{literalKey: string; lookup: {from: string; to: string; genericCaseNormalizationAllowed: boolean}}>}>;
};

/** Read the actual DefineShape RECT rather than assuming an invisible hit box. */
function sourceHitBounds(characterId: number): Bounds {
  const source = read(`${audit}source-input.swf`);
  assert.equal(source.subarray(0, 3).toString(), 'CWS');
  const swf = Buffer.concat([source.subarray(0, 8), inflateSync(source.subarray(8))]);
  assert.equal(swf.length, source.readUInt32LE(4));
  const shape = catalog.shapeDefinitions.find(item => item.characterId === characterId)!;
  assert.ok(shape);
  const header = swf.readUInt16LE(shape.sourceTagOffset);
  assert.equal(header >> 6, 2);
  const body = shape.sourceTagOffset + ((header & 63) === 63 ? 6 : 2);
  assert.equal(swf.readUInt16LE(body), characterId);
  let bit = (body + 2) * 8;
  const bits = (count: number, signed = false) => {
    let value = 0;
    for (let index = 0; index < count; index++, bit++) value = value * 2 + ((swf[bit >> 3] >> (7 - (bit & 7))) & 1);
    return signed && value >= 2 ** (count - 1) ? value - 2 ** count : value;
  };
  const count = bits(5);
  const [left, right, top, bottom] = Array.from({length: 4}, () => bits(count, true));
  return [left, top, right, bottom];
}

function transformPoint(matrix: Matrix, x: number, y: number): [number, number] {
  const [a, b, c, d, tx, ty] = matrix;
  return [a * x + c * y + tx, b * x + d * y + ty];
}

function transformBounds(matrix: Matrix, bounds: Bounds): Bounds {
  const points = [
    transformPoint(matrix, bounds[0], bounds[1]), transformPoint(matrix, bounds[2], bounds[1]),
    transformPoint(matrix, bounds[0], bounds[3]), transformPoint(matrix, bounds[2], bounds[3]),
  ];
  return [Math.min(...points.map(p => p[0])), Math.min(...points.map(p => p[1])),
    Math.max(...points.map(p => p[0])), Math.max(...points.map(p => p[1]))];
}

function deriveTextSpan(button: Button, instanceId: string) {
  const hit = button.statePlacements.filter(item => item.states.hitTest);
  assert.equal(hit.length, 1);
  const placement = button.placements.filter(item => item.instanceId === instanceId);
  assert.equal(placement.length, 1);
  const bounds = transformBounds(placement[0].matrix, transformBounds(hit[0].matrix, sourceHitBounds(hit[0].characterId)));
  const candidates: Array<{sourceTextInstanceId: string; sourceTextId: string; spanStart: number; spanEnd: number}> = [];
  for (const instance of geometry.textInstances) {
    const definition = geometry.textDefinitions.find(item => item.characterId === instance.characterId)!;
    let matrix = instance.firstPose.matrix;
    for (const event of instance.events) if (event.matrix) matrix = event.matrix;
    for (const run of definition.runs) {
      const inside = run.glyphs.filter(glyph => {
        if (!/^[A-Za-z]$/.test(glyph.unicode) || !glyph.inkBoundsInTextDefinitionTwips) return false;
        const box = glyph.inkBoundsInTextDefinitionTwips;
        // These source geometry boxes already include the DefineText matrix.
        const [x, y] = transformPoint(matrix, (box[0] + box[2]) / 2, (box[1] + box[3]) / 2);
        return x >= bounds[0] && x <= bounds[2] && y >= bounds[1] && y <= bounds[3];
      });
      if (!inside.length) continue;
      const first = inside[0].glyphOrdinalInRun;
      const last = inside[inside.length - 1].glyphOrdinalInRun;
      const spanStart = run.glyphs.slice(0, first).map(glyph => glyph.unicode).join('').length;
      const spanEnd = run.glyphs.slice(0, last + 1).map(glyph => glyph.unicode).join('').length;
      assert.match(run.text.slice(spanStart, spanEnd), /^[A-Za-z]+(?: [A-Za-z]+)*$/);
      assert.equal(inside.length, run.text.slice(spanStart, spanEnd).replaceAll(' ', '').length);
      candidates.push({sourceTextInstanceId: instance.instanceId, sourceTextId: run.sourceTextId, spanStart, spanEnd});
    }
  }
  assert.equal(candidates.length, 1, `unique letter-span geometry for ${instanceId}`);
  return candidates[0];
}

test('P010 exact SWF/AS keys, button instances and geometric lexical spans match source evidence', () => {
  for (const [path, digest] of evidencePins) assert.equal(sha256(read(`${audit}${path}`)), digest, path);
  assert.equal(P010_GLOSSARY_SOURCE_SHA256, behavior.sourceSha256);
  assert.equal(P010_GLOSSARY_SOURCE_SHA256, geometry.sourceSha256);
  assert.equal(P010_GLOSSARY_SOURCE_SHA256, keyterms.sourceSha256);
  assert.equal(P010_GLOSSARY_MAIN_FRAME_COUNT, behavior.main.frameCount);
  assert.equal(P010_GLOSSARY_MAIN_FRAME_COUNT, geometry.sourceEntryCondition.mainFrameCount);
  assert.equal(behavior.buttons.length, 9);
  assert.equal(keyterms.uniqueLiteralKeyCount, 9);
  assert.equal(keyterms.buttonInstanceCount, 10);
  assert.equal(P010_GLOSSARY_TERMS.length, 10);
  assert.equal(new Set(P010_GLOSSARY_TERMS.map(term => term.instanceId)).size, 10);
  assert.deepEqual(keyterms.explicitCaseCrosswalks, [{from: 'length', to: 'Length'}]);
  const derived = behavior.buttons.flatMap(button => button.instances.map(instance => {
    const span = deriveTextSpan(button, instance.instanceId);
    const visibility = geometry.runInstanceVisibilitySummary.filter(item =>
      item.instanceId === span.sourceTextInstanceId && item.sourceTextId === span.sourceTextId);
    assert.equal(visibility.length, 1);
    assert.ok(instance.firstFrame < visibility[0].firstAllInkBoundsContainedAndFullOpacityFrame);
    assert.equal(instance.lastFrameExclusive, 466);
    const lookups = keyterms.sources.map(source => source.records.filter(record => record.literalKey === button.literalKey));
    assert.ok(lookups.every(records => records.length === 1));
    assert.ok(lookups.every(records => records[0].lookup.from === button.literalKey && records[0].lookup.genericCaseNormalizationAllowed === false));
    assert.equal(lookups[0][0].lookup.to, lookups[1][0].lookup.to);
    const script = read(`../../../${button.as.path}`);
    assert.equal(script.length, button.as.bytes);
    assert.equal(sha256(script), button.as.sha256);
    assert.equal(script.toString().replaceAll('\r\n', '\n'),
      `on(release){\n   _global.KeyAttribute = "${button.literalKey}";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}\n`);
    return {instanceId: instance.instanceId, characterId: button.characterId,
      sourceKeyAttribute: button.literalKey, dictionaryLookupKey: lookups[0][0].lookup.to,
      ...span, firstReadableFrame: visibility[0].firstAllInkBoundsContainedAndFullOpacityFrame};
  })).sort((left, right) => Number(left.instanceId.split('/')[1].slice(6)) - Number(right.instanceId.split('/')[1].slice(6)));
  assert.deepEqual(P010_GLOSSARY_TERMS, derived);
  assert.match(P010_GLOSSARY_CLOSE_POLICY, /^stay-paused-until-explicit-resume/);
  assert.match(P010_GLOSSARY_CLOSE_POLICY, /original-parity-pending/);
});

for (const term of P010_GLOSSARY_TERMS) {
  test(`P010 ${term.instanceId} accepts its complete-run boundary and rejects repeats`, () => {
    const button = behavior.buttons.find(item => item.characterId === term.characterId)!;
    const instance = button.instances.find(item => item.instanceId === term.instanceId)!;
    for (const frame of [1, instance.firstFrame, term.firstReadableFrame - 1]) {
      assert.equal(requestP010Glossary(frame, term.instanceId, false), null);
    }
    for (const frame of [term.firstReadableFrame, term.firstReadableFrame + 1, 465]) {
      assert.deepEqual(requestP010Glossary(frame, term.instanceId, false), {...term, requestedAtFrame: frame});
    }
    assert.equal(requestP010Glossary(term.firstReadableFrame, term.instanceId, true), null);
  });
}

test('two spans in length, width stay independent while sharing the complete-run boundary', () => {
  const length = P010_GLOSSARY_TERMS.find(term => term.sourceKeyAttribute === 'length')!;
  const width = P010_GLOSSARY_TERMS.find(term => term.sourceKeyAttribute === 'Width')!;
  assert.equal(length.sourceTextId, width.sourceTextId);
  assert.equal(length.sourceTextInstanceId, width.sourceTextInstanceId);
  assert.equal(length.firstReadableFrame, 86);
  assert.equal(width.firstReadableFrame, 86);
  assert.ok(length.spanEnd < width.spanStart);
  const run = geometry.textDefinitions.flatMap(definition => definition.runs).find(item => item.sourceTextId === length.sourceTextId)!;
  assert.equal(run.text, 'length, width');
  assert.equal(run.text.slice(length.spanStart, length.spanEnd), 'length');
  assert.equal(run.text.slice(width.spanStart, width.spanEnd), 'width');
  assert.equal(length.sourceKeyAttribute, 'length');
  assert.equal(length.dictionaryLookupKey, 'Length');
});

test('reused Position definition requires its exact instance and its own text boundary', () => {
  const positions = P010_GLOSSARY_TERMS.filter(term => term.characterId === 24);
  assert.equal(positions.length, 2);
  assert.notEqual(positions[0].instanceId, positions[1].instanceId);
  assert.notEqual(positions[0].sourceTextId, positions[1].sourceTextId);
  assert.equal(requestP010Glossary(58, positions[0].instanceId, false)?.sourceTextId, 'character-20/run-5');
  assert.equal(requestP010Glossary(58, positions[1].instanceId, false), null);
  assert.equal(requestP010Glossary(195, positions[1].instanceId, false)?.sourceTextId, 'character-36/run-2');
  assert.equal(requestP010Glossary(465, 24 as unknown as string, false), null);
});

test('invalid frames, unknown or malformed instances and pending flags fail closed', () => {
  const instanceId = P010_GLOSSARY_TERMS[0].instanceId;
  for (const frame of [0, -1, 466, 17.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(requestP010Glossary(frame, instanceId, false), null);
  }
  for (const value of ['', 'Point', '24', 'sprite-96/depth-4/generation-2', ' sprite-96/depth-4/generation-1', 22, undefined, null]) {
    assert.equal(requestP010Glossary(465, value as string, false), null);
  }
  for (const pending of [true, undefined, null, 0, 1, 'false']) {
    assert.equal(requestP010Glossary(17, instanceId, pending as boolean), null);
  }
});

test('pending rejects every subsequent button without mutating or storing transport state', () => {
  const initial = Object.freeze(initialP010GlossaryState());
  assert.equal(reduceP010Glossary(initial, {kind: 'request', frame: 16, instanceId: P010_GLOSSARY_TERMS[0].instanceId}), initial);
  const opened = Object.freeze(reduceP010Glossary(initial, {kind: 'request', frame: 17, instanceId: P010_GLOSSARY_TERMS[0].instanceId}));
  assert.equal(initial.pending, null);
  assert.deepEqual(Object.keys(opened), ['pending']);
  for (const term of P010_GLOSSARY_TERMS) {
    assert.equal(reduceP010Glossary(opened, {kind: 'request', frame: 465, instanceId: term.instanceId}), opened);
  }
});

test('close, Replay and navigation clear pending and emit no resume, including source frame 465', () => {
  for (const term of P010_GLOSSARY_TERMS) {
    const opened = Object.freeze(reduceP010Glossary(initialP010GlossaryState(), {
      kind: 'request', frame: 465, instanceId: term.instanceId,
    }));
    assert.equal(opened.pending?.instanceId, term.instanceId);
    for (const kind of ['close', 'replay', 'navigation'] as const) {
      const cleared = reduceP010Glossary(opened, {kind});
      assert.deepEqual(cleared, {pending: null});
      assert.deepEqual(Object.keys(cleared), ['pending']);
      assert.equal(opened.pending?.requestedAtFrame, 465);
      assert.equal(reduceP010Glossary(cleared, {kind}), cleared);
    }
  }
});
