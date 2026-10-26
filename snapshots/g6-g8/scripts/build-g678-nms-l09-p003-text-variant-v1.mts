#!/usr/bin/env -S tsx
// Private P003 source-drawing variant. No generated JavaScript is edited by hand.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir, readFile, realpath, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parse} from 'acorn';

import {collectSwfTextSourceCatalog} from './lib/swf-text-source-catalog.mjs';
import {SOURCE, validateP003TextSource} from
  './audit-g678-nms-l09-p003-source.mjs';
import {NMS_L09_P003_TEXT_BINDING} from
  '../packages/demos/src/timelines/shared-nms002-l09-p003-source-text';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SAFE_PATH = path.join(ROOT,
  'work/g678-shared-page-factory/g678-nms-l09-p003-root-held-candidate-v1/canvas-renderer.js');
const OUTPUT = '/Volumes/American Dream/hudongpin/g678-p003-text-variant-20260923-v5';
const SAFE_SHA = 'b3ca4454098121e236876cdf89882bef55752ae44c220976ecc032f4a01e43da';
const CATALOG_SHA = 'facf9a75ef86498c2ab6a4dc5a1ff516cea4b96f3734ffdfad6c8b6e013e52be';
const NEW_REGISTRY = 'HELP_MATH_P003_TEXT_CANDIDATES';
const OUTLINE = Object.freeze({
  instanceId: 'root:298:1:249/sprite-249:1:1:248',
  characterId: 248,
  definitionSha256: '4a2c1b232656caa4fd274d8541368e799bf0232ee560f04cdf5e1ea5cf6d05d7',
  rootParentEventSha256: '76dc4939f0a8c604261bedc2c439f1362cb4bdefa5fb69874e1362d6d1c3b9b7',
  childEventSha256: '032ec9abf59daa5e07433c08b23ab654bf3aa9efd81f3e0c74eb77decdc300d9',
});
const HASH = bytes => createHash('sha256').update(bytes).digest('hex');

function visit(node, callback, frame = null) {
  if (!node || typeof node !== 'object') return;
  const activeFrame = node.type === 'SwitchCase' && node.test?.type ===
    'Literal' && typeof node.test.value === 'number' ? node.test.value + 1 :
    frame;
  if (node.type) callback(node, activeFrame);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(item =>
      visit(item, callback, activeFrame));
    else if (value && typeof value === 'object')
      visit(value, callback, activeFrame);
  }
}

function number(node) {
  if (node?.type === 'Literal' && typeof node.value === 'number') return node.value;
  if (node?.type === 'UnaryExpression' && node.operator === '-')
    return -number(node.argument);
  throw new Error('nonliteral FFDec placement matrix');
}

function matrixKey(matrix) {
  assert(Array.isArray(matrix) && matrix.length === 6 &&
    matrix.every(Number.isFinite));
  return matrix.map(value => Math.round(value * 1e6) / 1e6).join(',');
}

function sourceBindings(catalog) {
  const timelines = new Map(catalog.timelines.map(item => [item.timelineId, item]));
  const definitions = new Map(catalog.textDefinitions.map(item =>
    [item.characterId, item]));
  const mapped = new Map();
  for (const block of NMS_L09_P003_TEXT_BINDING.blocks.slice(0, 9)) {
    const instance = block.instance;
    assert(instance && instance.path.length >= 1,
      'P003 text block requires exact source instance');
    const leaf = instance.path.at(-1);
    const timeline = timelines.get(leaf.timelineId);
    const source = timeline?.instances.find(item =>
      item.depth === leaf.depth && item.generation === leaf.generation &&
      item.characterId === leaf.characterId);
    assert(source, `source instance missing: ${instance.id}`);
    const event = timeline.events.find(item =>
      item.eventId === source.createdByEventId);
    assert(event?.matrix, `source matrix missing: ${instance.id}`);
    const definition = definitions.get(leaf.characterId);
    assert.deepEqual(block.sourceTextIds,
      definition.runs.map(run => run.sourceTextId),
    `incomplete source runs: ${instance.id}`);
    const scale = leaf.timelineId === 'root' ? 1 / 20 : 1;
    const key = `${leaf.timelineId}|text${leaf.characterId}|${matrixKey(
      event.matrix.map(value => value * scale))}`;
    assert(!mapped.has(key), `ambiguous text placement: ${key}`);
    mapped.set(key, {instanceId: instance.id,
      expectedCalls: source.lastFrameExclusive - source.firstFrame,
      calls: 0});
  }
  assert.equal(mapped.size, 9);
  return mapped;
}

function sourceOverlayBindings(catalog) {
  const expected = [
    [590, 228, '4b8a4e800210ed6d606e705afcfde849c93dc6c91d3a6c6018af46a9bb92c512'],
    [592, 228, '4b8a4e800210ed6d606e705afcfde849c93dc6c91d3a6c6018af46a9bb92c512'],
    [594, 228, '4b8a4e800210ed6d606e705afcfde849c93dc6c91d3a6c6018af46a9bb92c512'],
    [615, 239, '63a0876a38ac2f03427c2ba33afd4e0b3aee2790977a4f6417b6d2d211bc8cc0'],
    [617, 239, '63a0876a38ac2f03427c2ba33afd4e0b3aee2790977a4f6417b6d2d211bc8cc0'],
    [619, 239, '63a0876a38ac2f03427c2ba33afd4e0b3aee2790977a4f6417b6d2d211bc8cc0'],
  ];
  const timeline = catalog.timelines.find(item =>
    item.timelineId === 'sprite-246');
  const mapped = new Map();
  const framesById = {};
  const blocks = NMS_L09_P003_TEXT_BINDING.blocks.slice(9);
  assert.equal(blocks.length, expected.length,
    'P003 source emphasis binding count drift');
  for (let index = 0; index < blocks.length; index++) {
    const [frame, characterId, sourceTagSha256] = expected[index];
    const block = blocks[index];
    const leaf = block.instance.path.at(-1);
    const source = timeline?.instances.find(item =>
      item.depth === leaf.depth && item.generation === leaf.generation &&
      item.characterId === leaf.characterId);
    const definition = catalog.textDefinitions.find(item =>
      item.characterId === characterId);
    assert.equal(definition?.sourceTagSha256, sourceTagSha256);
    assert.deepEqual(block.sourceTextIds,
      definition.runs.map(run => run.sourceTextId));
    assert.equal(source?.characterId, characterId);
    assert.equal(source.firstFrame, frame);
    assert.equal(source.lastFrameExclusive, frame + 1);
    const event = timeline.events.find(item =>
      item.eventId === source.createdByEventId);
    assert(event?.matrix, `P003 emphasis matrix missing: ${block.id}`);
    const key = `${frame}|text${characterId}|${matrixKey(event.matrix)}`;
    assert(!mapped.has(key), `ambiguous P003 emphasis: ${key}`);
    mapped.set(key, {instanceId: block.instance.id, calls: 0});
    framesById[block.instance.id] = frame;
  }
  return {mapped, framesById};
}

function sourceEmphasisShapes(catalog) {
  const definitions = [
    [227, 'e3ae06c54d5d1bd13c2184540448dc033b510b87309041dba007d3448d770d14'],
    [238, '2f479292414130622f5bc3e216a6198511533b2ce9c41ef48dff3490637e0959'],
  ];
  assert.deepEqual(NMS_L09_P003_TEXT_BINDING.blocks[3].sourceShapeIds,
    [227], 'P003 tank emphasis shape binding drift');
  assert.deepEqual(NMS_L09_P003_TEXT_BINDING.blocks[4].sourceShapeIds,
    [238], 'P003 addend emphasis shape binding drift');
  for (const [characterId, sourceTagSha256] of definitions)
    assert.equal(catalog.shapeDefinitions.find(item =>
      item.characterId === characterId)?.sourceTagSha256,
    sourceTagSha256, `P003 emphasis shape definition drift: ${characterId}`);
  const expected = [
    [590, 227, 282, 1], [592, 227, 285, 1], [594, 227, 285, 2],
    [615, 238, 285, 3], [617, 238, 285, 4], [619, 238, 285, 5],
  ];
  const timeline = catalog.timelines.find(item =>
    item.timelineId === 'sprite-246');
  const mapped = new Map();
  const framesById = {};
  for (const [frame, characterId, depth, generation] of expected) {
    const instance = timeline?.instances.find(item =>
      item.depth === depth && item.generation === generation &&
      item.characterId === characterId);
    assert.equal(instance?.firstFrame, frame);
    assert.equal(instance.lastFrameExclusive, frame + 1);
    const event = timeline.events.find(item =>
      item.eventId === instance.createdByEventId);
    assert(event?.matrix, 'P003 emphasis shape matrix missing');
    const id = `root:1:1:246/sprite-246:${depth}:${generation}:${characterId}`;
    const key = `${frame}|shape${characterId}|${matrixKey(event.matrix)}`;
    assert(!mapped.has(key), `ambiguous P003 emphasis shape: ${key}`);
    mapped.set(key, {instanceId: id, calls: 0});
    framesById[id] = frame;
  }
  return {mapped, framesById};
}

function validateTitleOutline(catalog) {
  assert.deepEqual(NMS_L09_P003_TEXT_BINDING.blocks[0].sourceShapeIds,
    [OUTLINE.characterId], 'P003 title outline semantic binding drift');
  const shape = catalog.shapeDefinitions.find(item =>
    item.characterId === OUTLINE.characterId);
  assert.equal(shape?.sourceTagSha256, OUTLINE.definitionSha256,
    'P003 outline definition drift');
  const root = catalog.timelines.find(item => item.timelineId === 'root');
  const child = catalog.timelines.find(item =>
    item.timelineId === 'sprite-249');
  const parentInstance = root?.instances.find(item =>
    item.depth === 298 && item.generation === 1 && item.characterId === 249);
  const childInstance = child?.instances.find(item =>
    item.depth === 1 && item.generation === 1 &&
    item.characterId === OUTLINE.characterId);
  assert(parentInstance && childInstance, 'P003 title outline source path drift');
  const parentEvent = root.events.find(item =>
    item.eventId === parentInstance.createdByEventId);
  const childEvent = child.events.find(item =>
    item.eventId === childInstance.createdByEventId);
  assert.equal(parentEvent?.sourceTagSha256, OUTLINE.rootParentEventSha256);
  assert.equal(childEvent?.sourceTagSha256, OUTLINE.childEventSha256);
  assert.equal(parentEvent?.name?.text, 'Mc_page_Title');
  assert.equal(parentInstance.firstFrame, 6);
  assert.equal(parentInstance.lastFrameExclusive, 11);
  assert.equal(childInstance.firstFrame, 1);
  assert.equal(childInstance.lastFrameExclusive, 2);
  assert.equal(matrixKey(parentEvent.matrix.map(value => value / 20)),
    '0.05,0,0,0.05,400,43.6');
  assert.equal(matrixKey(childEvent.matrix), '1,0,0,1,0,0');
  return OUTLINE.instanceId;
}

function editsApplied(source, edits) {
  let cursor = 0, output = '';
  for (const edit of edits.sort((a, b) => a.start - b.start || a.end - b.end)) {
    assert(edit.start >= cursor && edit.end >= edit.start,
      'overlapping P003 text transformation');
    output += source.slice(cursor, edit.start) + edit.value;
    cursor = edit.end;
  }
  return output + source.slice(cursor);
}

export async function writeCandidateExclusive(files, check = false) {
  for (const [file, bytes] of files) {
    if (check) {
      assert((await readFile(file)).equals(bytes), `P003 variant drift: ${file}`);
      continue;
    }
    await mkdir(path.dirname(file), {recursive: true});
    try {await writeFile(file, bytes, {flag: 'wx'});}
    catch (error) {
      if (error.code !== 'EEXIST') throw error;
      assert((await readFile(file)).equals(bytes),
        `P003 output collision: ${file}`);
    }
  }
}

export function buildP003TextVariant(safeJavascript, catalog) {
  assert.equal(HASH(safeJavascript), SAFE_SHA, 'P003 safe JavaScript drift');
  assert.equal(HASH(JSON.stringify(catalog)), CATALOG_SHA,
    'P003 text catalog drift');
  assert.equal(NMS_L09_P003_TEXT_BINDING.sourceSwfSha256, SOURCE.sha256);
  const bindings = sourceBindings(catalog);
  const overlays = sourceOverlayBindings(catalog);
  const emphasisShapes = sourceEmphasisShapes(catalog);
  const outlineId = validateTitleOutline(catalog);
  const ids = [...bindings.values(), ...overlays.mapped.values()].map(item =>
    item.instanceId);
  const ast = parse(safeJavascript, {ecmaVersion: 2022, sourceType: 'script'});
  const iife = ast.body[0]?.expression?.callee;
  assert.equal(iife?.type, 'FunctionExpression');
  assert.equal(iife.body.body[0]?.directive, 'use strict');
  const functions = new Map(iife.body.body.filter(item =>
    item.type === 'FunctionDeclaration').map(item => [item.id.name, item]));
  assert(functions.has('main') && functions.has('sprite246'));
  const edits = [];
  const matched = new Set();
  let outlineCalls = 0;
  let parentCalls = 0;
  for (const [name, fn] of functions) {
    visit(fn.body, (node, frame) => {
      if (node.type !== 'CallExpression' || node.callee.name !== 'place' ||
          node.arguments[0]?.type !== 'Literal') return;
      const objectName = node.arguments[0].value;
      if (objectName === 'sprite249' && name === 'main') {
        assert.equal(node.arguments.length, 9);
        assert.equal(matrixKey(node.arguments[3].elements.map(number)),
          '0.05,0,0,0.05,400,43.6');
        parentCalls++;
      }
      if (objectName === 'shape248') {
        assert.equal(name, 'sprite249',
          'P003 outline used outside source-bound title sprite');
        assert.equal(node.arguments.length, 9);
        assert.equal(matrixKey(node.arguments[3].elements.map(number)),
          '1,0,0,1,0,0');
        outlineCalls++;
        edits.push({start: node.callee.start, end: node.callee.end,
          value: '__p003PlaceBound'});
        edits.push({start: node.arguments[0].start, end: node.arguments[0].start,
          value: `${JSON.stringify(outlineId)},`});
      }
      if (objectName === 'shape227' || objectName === 'shape238') {
        assert.equal(name, 'sprite246',
          'P003 emphasis shape used outside source-bound main sprite');
        assert.equal(node.arguments.length, 9);
        const key = `${frame}|${objectName}|${matrixKey(
          node.arguments[3].elements.map(number))}`;
        const binding = emphasisShapes.mapped.get(key);
        assert(binding, `unbound P003 emphasis shape call: ${key}`);
        binding.calls++;
        edits.push({start: node.callee.start, end: node.callee.end,
          value: '__p003PlaceBound'});
        edits.push({start: node.arguments[0].start, end: node.arguments[0].start,
          value: `${JSON.stringify(binding.instanceId)},`});
      }
      if (objectName === 'text228' || objectName === 'text239') {
        assert.equal(name, 'sprite246',
          'P003 emphasis used outside source-bound main sprite');
        assert.equal(node.arguments.length, 9);
        const key = `${frame}|${objectName}|${matrixKey(
          node.arguments[3].elements.map(number))}`;
        const binding = overlays.mapped.get(key);
        assert(binding, `unbound P003 emphasis draw call: ${key}`);
        binding.calls++;
        matched.add(binding.instanceId);
        edits.push({start: node.callee.start, end: node.callee.end,
          value: '__p003PlaceBound'});
        edits.push({start: node.arguments[0].start, end: node.arguments[0].start,
          value: `${JSON.stringify(binding.instanceId)},`});
        return;
      }
      if (!/^text(?:105|106|107|110|111|232|247)$/.test(objectName)) return;
      assert(name === 'main' || name === 'sprite246',
        `bound P003 text in unexpected timeline: ${name}`);
      const timelineId = name === 'main' ? 'root' : 'sprite-246';
      assert.equal(node.arguments.length, 9);
      const matrixNode = node.arguments[3];
      assert.equal(matrixNode.type, 'ArrayExpression');
      const key = `${timelineId}|${objectName}|${matrixKey(
        matrixNode.elements.map(number))}`;
      const binding = bindings.get(key);
      assert(binding, `unbound generated source text call: ${key}`);
      binding.calls++;
      matched.add(binding.instanceId);
      edits.push({start: node.callee.start, end: node.callee.end,
        value: '__p003PlaceBound'});
      edits.push({start: node.arguments[0].start, end: node.arguments[0].start,
        value: `${JSON.stringify(binding.instanceId)},`});
    });
  }
  for (const binding of bindings.values())
    assert.equal(binding.calls, binding.expectedCalls,
      `generated text call count drift: ${binding.instanceId}`);
  for (const binding of overlays.mapped.values())
    assert.equal(binding.calls, 1,
      `generated emphasis draw call drift: ${binding.instanceId}`);
  for (const binding of emphasisShapes.mapped.values())
    assert.equal(binding.calls, 1,
      `generated emphasis shape call drift: ${binding.instanceId}`);
  assert.equal(matched.size, 15);
  assert.equal(parentCalls, 5, 'P003 root title-sprite call count drift');
  assert.equal(outlineCalls, 1, 'P003 outlined-title draw call drift');
  const exactIds = JSON.stringify(ids);
  const shapeIds = [outlineId, ...[...emphasisShapes.mapped.values()].map(item =>
    item.instanceId)];
  const wrapper = `\nvar __p003TextRequest = null;\n` +
    `var __p003TextIds = Object.freeze(${exactIds});\n` +
    `var __p003OverlayFrames = Object.freeze(${JSON.stringify(overlays.framesById)});\n` +
    `var __p003ShapeIds = Object.freeze(${JSON.stringify(shapeIds)});\n` +
    `var __p003ShapeFrames = Object.freeze(${JSON.stringify(emphasisShapes.framesById)});\n` +
    `function __p003PlaceBound(id,obj,target,ctx,matrix,ctrans,blend,frame,ratio,time){\n` +
    ` if(__p003TextRequest && __p003TextRequest.requested.has(id)){\n` +
    `  __p003TextRequest.seen.add(id);return undefined;\n` +
    ` }\n return place(obj,target,ctx,matrix,ctrans,blend,frame,ratio,time);\n}\n` +
    `function __p003RenderWithText(target,request){\n` +
    ` var text=request&&request.text;var ids=text&&text.suppressInstanceIds;` +
    `var outlineIds=text&&text.suppressShapeInstanceIds;\n` +
    ` if(__p003TextRequest||!text||text.status!=="ready"||` +
    `text.animationId!==${JSON.stringify(NMS_L09_P003_TEXT_BINDING.animationId)}||` +
    `text.sourceSwfSha256!==${JSON.stringify(SOURCE.sha256)}||` +
    `text.bindingVersion!==${JSON.stringify(NMS_L09_P003_TEXT_BINDING.version)}||` +
    `!Array.isArray(ids)||ids.length!==__p003TextIds.length||` +
    `new Set(ids).size!==ids.length||__p003TextIds.some(function(id){return !ids.includes(id);})||` +
    `text.frame!==request.frame||!Array.isArray(outlineIds)||` +
    `outlineIds.length!==__p003ShapeIds.length||` +
    `new Set(outlineIds).size!==outlineIds.length||` +
    `__p003ShapeIds.some(function(id){return !outlineIds.includes(id);}))` +
    `throw new Error("P003 exact text and outline snapshot required");\n` +
    ` var active={requested:new Set([...ids,...outlineIds]),seen:new Set()};` +
    `__p003TextRequest=active;\n` +
    ` try {var state=render(target,request);` +
    `var expected=__p003TextIds.filter(function(id){` +
    `if(id===${JSON.stringify(NMS_L09_P003_TEXT_BINDING.blocks[8].instance.id)})` +
    `return state.localFrame>=591;` +
    `var overlayFrame=__p003OverlayFrames[id];` +
    `return overlayFrame===undefined||overlayFrame===state.localFrame;});` +
    `expected.push(...__p003ShapeIds.filter(function(id){` +
    `var shapeFrame=__p003ShapeFrames[id];` +
    `return shapeFrame===undefined||shapeFrame===state.localFrame;}));` +
    `if(expected.length!==active.seen.size||expected.some(function(id){return !active.seen.has(id);}))` +
    `throw new Error("P003 requested source text draw site missing");` +
    `return {state:state,suppressedInstanceIds:Array.from(active.seen),` +
    `claimBoundary:{candidateOnly:true,originalRuntimeEvidence:false,typographyComplete:false}};` +
    `}finally{__p003TextRequest=null;}\n}\n`;
  edits.push({start: iife.body.body[0].end, end: iife.body.body[0].end,
    value: wrapper});
  const assignment = 'registry["course-shared-nms002-l09-p003"] = Object.freeze({metadata: METADATA, ready: ready, resolveFrameState: resolveFrameState, render: render});';
  const registrationStart = safeJavascript.lastIndexOf(assignment);
  assert(registrationStart >= 0 && safeJavascript.indexOf(assignment) ===
    registrationStart, 'P003 registry assignment drift');
  edits.push({start: registrationStart, end: registrationStart + assignment.length,
    value: assignment.replace('render: render}',
      'render: render, renderWithText: __p003RenderWithText}')});
  let code = editsApplied(safeJavascript, edits);
  assert.equal(code.split('HELP_MATH_CANVAS_ASSETS').length, 3,
    'P003 registry namespace drift');
  code = code.replaceAll('HELP_MATH_CANVAS_ASSETS', NEW_REGISTRY);
  parse(code, {ecmaVersion: 2022, sourceType: 'script'});
  return {code, matchedCallCount: [...bindings.values()].reduce((sum, item) =>
    sum + item.calls, 0) + outlineCalls +
    [...overlays.mapped.values()].reduce((sum, item) => sum + item.calls, 0) +
    [...emphasisShapes.mapped.values()].reduce((sum, item) => sum + item.calls, 0),
  boundInstances: ids, boundOutlineInstance: outlineId,
  boundEmphasisShapeInstances: shapeIds.slice(1)};
}

async function run(check) {
  const sourceRoot = process.env.HELP_MATH_G678_SOURCE_ROOT;
  assert(sourceRoot && path.isAbsolute(sourceRoot) &&
    await realpath(sourceRoot) === sourceRoot,
  'real absolute HELP_MATH_G678_SOURCE_ROOT required');
  const swf = await readFile(path.join(sourceRoot, SOURCE.path));
  const textAudit = validateP003TextSource(swf);
  assert.equal(textAudit.sourceCatalogContentSha256, CATALOG_SHA);
  const catalog = collectSwfTextSourceCatalog(swf);
  const safe = await readFile(SAFE_PATH, 'utf8');
  const variant = buildP003TextVariant(safe, catalog);
  const scriptBytes = await readFile(fileURLToPath(import.meta.url));
  const bindingBytes = Buffer.from(JSON.stringify(NMS_L09_P003_TEXT_BINDING,
    null, 2) + '\n');
  const variantBytes = Buffer.from(variant.code);
  const manifest = {schemaVersion: 1,
    kind: 'g678-p003-unregistered-exact-text-suppression-candidate-v1',
    sourceSwfSha256: SOURCE.sha256, sourceCatalogContentSha256: CATALOG_SHA,
    sourceTextAudit: textAudit,
    inputSafeJavascriptSha256: SAFE_SHA,
    generatorSha256: HASH(scriptBytes),
    bindingSha256: HASH(bindingBytes),
    boundInstances: variant.boundInstances,
    boundOutlineInstance: variant.boundOutlineInstance,
    boundEmphasisShapeInstances: variant.boundEmphasisShapeInstances,
    matchedGeneratedDrawCalls: variant.matchedCallCount,
    output: {bytes: variantBytes.length, sha256: HASH(variantBytes)},
    claimBoundary: {localOnly: true, registered: false,
      originalRuntimeEvidence: false, nativeTypographyComplete: false,
      audioAccepted: false, humanOrOwnerAccepted: false}};
  const files = [
    [path.join(OUTPUT, 'canvas-renderer-with-text.js'), variantBytes],
    [path.join(OUTPUT, 'binding.json'), bindingBytes],
    [path.join(OUTPUT, 'manifest.json'),
      Buffer.from(JSON.stringify(manifest, null, 2) + '\n')],
  ];
  const outputStat = await stat(path.dirname(OUTPUT));
  assert(outputStat.isDirectory(), 'expected external candidate volume missing');
  await writeCandidateExclusive(files, check);
  process.stdout.write(JSON.stringify({output: OUTPUT, ...manifest.output,
    boundInstances: manifest.boundInstances.length,
    matchedGeneratedDrawCalls: manifest.matchedGeneratedDrawCalls,
    check, registered: false}) + '\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) ===
    path.resolve(process.argv[1]))
  run(process.argv.includes('--check')).catch(error => {
    process.stderr.write(`${error.stack ?? error}\n`);
    process.exitCode = 1;
  });
