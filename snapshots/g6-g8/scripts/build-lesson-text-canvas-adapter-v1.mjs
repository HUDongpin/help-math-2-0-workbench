#!/usr/bin/env node
import {readFile, writeFile, mkdir, lstat} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import {parse, version as acornVersion} from "acorn";
import {sha256} from "./lib/swf-text-source-catalog.mjs";
import {readTextSourceAsset} from "./build-lesson-text-source-catalog-v1.mjs";
import {createLessonTextCanvasRuntime} from "./lib/lesson-text-canvas-runtime-v1.mjs";

export const TEXT_CANVAS_BUILDER_VERSION = "1.0.0";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PREFIX = "__hmTextV1";
const assert = (condition, message) => {if (!condition) throw new Error(message);};
const HASH = /^[a-f0-9]{64}$/;
const EMPTY_MATRIX = [1, 0, 0, 1, 0, 0];

function walk(node, visit, parent = null) {
  if (!node || typeof node !== "object") return;
  if (typeof node.type === "string") visit(node, parent);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(item => walk(item, visit, node));
    else if (value && typeof value === "object") walk(value, visit, node);
  }
}

function constant(node) {
  if (node.type === "Literal") return node.value;
  if (node.type === "UnaryExpression" && node.operator === "-") return -constant(node.argument);
  if (node.type === "ArrayExpression") return node.elements.map(constant);
  if (node.type === "ObjectExpression") return Object.fromEntries(node.properties.map(property => {
    assert(property.type === "Property" && !property.computed, "metadata property is not literal");
    return [property.key.name ?? property.key.value, constant(property.value)];
  }));
  throw new Error(`unsupported constant expression ${node.type}`);
}

function sameMatrix(left, right) {
  return Array.isArray(left) && Array.isArray(right) && left.length === 6 && right.length === 6 &&
    left.every((value, index) => Number.isFinite(value) && Math.abs(value - right[index]) <= 1e-9);
}

export function sourceDisplayLists(timeline) {
  const frames = new Map();
  const active = new Map();
  const instances = new Map(timeline.instances.map(instance => [instance.instanceId, instance]));
  let cursor = 0;
  for (let frame = 1; frame <= timeline.declaredFrameCount; frame++) {
    while (cursor < timeline.events.length && timeline.events[cursor].frame <= frame) {
      const event = timeline.events[cursor++];
      if (event.kind === "remove") active.delete(event.depth);
      else if (event.kind === "place") {
        const prior = active.get(event.depth);
        const placement = event.characterId !== undefined
          ? {...(event.move ? prior : {}), matrix: EMPTY_MATRIX, ...event}
          : {...prior, ...event};
        if (event.matrix === undefined && prior && event.move) placement.matrix = prior.matrix;
        const instance = instances.get(event.instanceId);
        if (instance) placement.generation = instance.generation;
        active.set(event.depth, placement);
      }
    }
    frames.set(frame - 1, [...active.values()].sort((a, b) => a.depth - b.depth));
  }
  return frames;
}

function buildTimelinePlan(fn, sourceTimeline) {
  const sites = [];
  let functionReason = null;
  const switches = fn.body.body.filter(node => node.type === "SwitchStatement");
  const frameSwitch = switches.length === 1 && switches[0].discriminant.type === "Identifier" &&
    switches[0].discriminant.name === "frame" ? switches[0] : null;
  if (!frameSwitch) functionReason = "unsupported-timeline-switch";
  const frameCountDeclarations = fn.body.body.filter(statement => statement.type === "VariableDeclaration")
    .flatMap(statement => statement.declarations).filter(item => item.id.name === "frame_cnt");
  if (frameCountDeclarations.length !== 1 ||
      frameCountDeclarations[0].init?.type !== "Literal" ||
      frameCountDeclarations[0].init.value !== sourceTimeline.declaredFrameCount) {
    functionReason = "source-function-frame-count-mismatch";
  }
  for (const statement of fn.body.body) {
    if (statement === frameSwitch) continue;
    const sourceVariables = statement.type === "VariableDeclaration" && statement.declarations.every(item =>
      ["clips", "frame_cnt"].includes(item.id.name));
    const expression = statement.expression;
    const frameModulo = statement.type === "ExpressionStatement" &&
      expression.type === "AssignmentExpression" && expression.left.name === "frame" &&
      expression.right.type === "BinaryExpression" && expression.right.operator === "%" &&
      expression.right.left.name === "frame" && expression.right.right.name === "frame_cnt";
    const contextTransform = statement.type === "ExpressionStatement" &&
      expression.type === "CallExpression" && expression.callee.type === "MemberExpression" &&
      expression.callee.object.name === "ctx" &&
      ["save", "restore", "transform"].includes(expression.callee.property.name);
    if (!sourceVariables && !frameModulo && !contextTransform && statement.type !== "EmptyStatement") {
      functionReason = functionReason ?? "unsupported-timeline-prelude-or-postlude";
    }
  }
  walk(fn.body, (node) => {
    if (node.type === "CallExpression" && node.callee.type === "MemberExpression" &&
        ["clip", "getImageData", "putImageData"].includes(node.callee.property.name)) {
      functionReason = "unsupported-timeline-mask-or-pixel-operation";
    }
    if (["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"].includes(node.type)) {
      functionReason = "nested-function-in-timeline";
    }
    if (node.type === "CallExpression" && node.callee.type === "Identifier" && node.callee.name === "place") {
      sites.push({node, siteId: `${sourceTimeline.timelineId}/site-${sites.length}`});
    }
  });
  const siteByStart = new Map(sites.map(site => [site.node.start, site]));
  const sourceFrames = sourceDisplayLists(sourceTimeline);
  const frames = {};
  for (const switchCase of frameSwitch?.cases ?? []) {
    let frame;
    try {frame = constant(switchCase.test);} catch {continue;}
    if (!Number.isInteger(frame) || frame < 0 || frame >= sourceTimeline.declaredFrameCount) continue;
    const calls = [];
    let reason = functionReason;
    for (const statement of switchCase.consequent) {
      if (statement.type === "BreakStatement" || statement.type === "EmptyStatement") continue;
      if (statement.type === "ExpressionStatement" && statement.expression.type === "CallExpression" &&
          statement.expression.callee.type === "Identifier" && statement.expression.callee.name === "place") {
        calls.push(statement.expression);
      } else reason = reason ?? "nonlinear-or-extra-timeline-statement";
    }
    const active = sourceFrames.get(frame) ?? [];
    if (active.some(item => item.clipDepth !== undefined || item.filters || item.blendMode > 1 ||
        item.visible === 0 || item.cacheAsBitmap)) reason = reason ?? "complex-source-display-list";
    if (calls.length !== active.length) reason = reason ?? "source-draw-count-mismatch";
    const parsed = calls.map(call => {
      try {
        assert(call.arguments.length === 9, "place arity");
        const objectName = constant(call.arguments[0]);
        const characterId = Number(/^(?:text|sprite|shape|morphshape|button|image)(\d+)$/.exec(objectName)?.[1]);
        const matrix = constant(call.arguments[3]);
        const blendMode = constant(call.arguments[5]);
        assert(Number.isInteger(characterId) && matrix.length === 6 && matrix.every(Number.isFinite), "nonliteral placement");
        if (blendMode !== 1) reason = reason ?? "unsupported-blend-mode";
        return {objectName, characterId, matrix, siteId: siteByStart.get(call.start).siteId};
      } catch {reason = reason ?? "nonliteral-placement-arguments"; return null;}
    });
    const scales = [1, 1 / 20].filter(scale => parsed.length === active.length &&
      parsed.every((draw, index) => draw && draw.characterId === active[index].characterId &&
        sameMatrix(draw.matrix, (active[index].matrix ?? EMPTY_MATRIX).map(value => value * scale))));
    if (calls.length && scales.length !== 1) reason = reason ?? "ambiguous-or-unmatched-source-matrix-order";
    const placements = {};
    if (!reason || (reason === "complex-source-display-list" && scales.length === 1)) parsed.forEach((draw, index) => {
      const source = active[index];
      placements[draw.siteId] = {...draw, depth: source.depth, generation: source.generation,
        sourceInstanceId: source.instanceId, sourceEventId: source.eventId};
    });
    frames[String(frame)] = {reason, matrixUnitScale: reason ? null : scales[0] ?? 1,
      siteIds: calls.map(call => siteByStart.get(call.start).siteId), placements};
  }
  return {sites, data: {frameCount: sourceTimeline.declaredFrameCount, frames, functionReason}};
}

function canonicalInstanceId(segments) {
  return segments.map(segment => `${segment.timelineId}/depth-${segment.depth}/generation-${segment.generation}`).join(">");
}

function bindingData(binding, sourceAsset) {
  assert(binding.schemaVersion === 1 && typeof binding.version === "string" && Array.isArray(binding.blocks), "invalid maintained text binding");
  assert(binding.sourceSwfSha256 === sourceAsset.sourceSha256, "binding source SHA mismatch");
  const definitions = new Map(sourceAsset.textDefinitions.map(text => [text.characterId, text]));
  const timelines = new Map(sourceAsset.timelines.map(timeline => [timeline.timelineId, timeline]));
  const entries = {};
  for (const block of binding.blocks) {
    if (!block.instance) continue;
    const instance = block.instance;
    assert(typeof instance.id === "string" && instance.id.length > 0 &&
      Array.isArray(instance.path) && instance.path.length > 0, "invalid binding instance identity");
    for (let i = 0; i < instance.path.length; i++) {
      const segment = instance.path[i];
      assert(Number.isInteger(segment.depth) && Number.isInteger(segment.generation) && Number.isInteger(segment.characterId), "invalid binding instance segment");
      const timeline = timelines.get(segment.timelineId);
      assert(timeline?.instances.some(item => item.depth === segment.depth &&
        item.generation === segment.generation && item.characterId === segment.characterId), "binding instance missing from P1 source");
      if (i > 0) assert(segment.timelineId === `sprite-${instance.path[i - 1].characterId}`, "binding parent-child timeline mismatch");
    }
    const definition = definitions.get(instance.path.at(-1).characterId);
    assert(definition && Array.isArray(block.sourceTextIds), "binding leaf is not a source text definition");
    const expected = (definition.runs ?? [definition]).map(run => run.sourceTextId);
    assert(block.sourceTextIds.every(id => expected.includes(id)), "binding source text id mismatch");
    const key = canonicalInstanceId(instance.path);
    assert(!entries[key] || entries[key].id === instance.id, "one source instance has conflicting binding ids");
    const entry = entries[key] ?? {id: instance.id, sourceTextIds: []};
    entry.sourceTextIds = [...new Set([...entry.sourceTextIds, ...block.sourceTextIds])];
    entry.completeTextReplacement = expected.every(id => entry.sourceTextIds.includes(id));
    entries[key] = entry;
  }
  const ids = Object.values(entries).map(entry => entry.id);
  assert(new Set(ids).size === ids.length, "one binding id names multiple source instances");
  return entries;
}

/** No file mutation; returns a distinct variant and an exact input/output manifest. */
export function buildLessonTextCanvasAdapter({safeJavascript, safeJavascriptPath,
  expectedSafeJavascriptSha256, sourceAsset, sourceCatalogContentSha256, binding,
  bindingSha256, bindingSerialized, variantId}) {
  assert(HASH.test(expectedSafeJavascriptSha256) && sha256(safeJavascript) === expectedSafeJavascriptSha256, "safe JavaScript SHA mismatch");
  assert(HASH.test(sourceCatalogContentSha256) && HASH.test(bindingSha256), "catalog and binding hashes are required");
  assert(sha256(`${JSON.stringify(sourceAsset)}\n`) === sourceCatalogContentSha256,
    "source catalog content hash mismatch");
  assert(typeof bindingSerialized === "string" && sha256(bindingSerialized) === bindingSha256 &&
    JSON.stringify(JSON.parse(bindingSerialized)) === JSON.stringify(binding), "binding content hash mismatch");
  assert(/^(?:apps\/web\/public\/flash-assets\/|(?:apps\/web\/)?public\/current-js-preview-assets\/|current-js-preview-assets\/)/.test(safeJavascriptPath), "safe JavaScript path is outside approved asset roots");
  assert(!safeJavascriptPath.split(/[\\/]/).includes(".."), "safe JavaScript path contains traversal");
  assert(typeof variantId === "string" && /^[a-z0-9][a-z0-9-]+$/.test(variantId), "invalid variant id");
  assert(safeJavascript.startsWith("/* Generated by scripts/build-safe-ffdec-canvas-adapter.mjs. */"), "unsupported safe generator lineage");
  assert(!safeJavascript.includes(PREFIX), "text adapter namespace already present");
  assert(!safeJavascript.includes("ACTIVE_BEHAVIOR_COMPOSITE"), "unsupported sourceBehaviorComposite adapter; use a maintained renderer");
  const ast = parse(safeJavascript, {ecmaVersion: 2022, sourceType: "script"});
  let metadataNode, registrationNode, registryObject, iife, renderFunction;
  const spriteFunctions = [];
  const registryLiterals = [];
  walk(ast, (node, parent) => {
    if (node.type === "Identifier" && ["eval", "Function", "fetch", "XMLHttpRequest", "WebSocket", "setInterval", "setTimeout", "requestAnimationFrame"].includes(node.name)) {
      throw new Error(`unsafe or clock-bearing source primitive: ${node.name}`);
    }
    if (node.type === "VariableDeclarator" && node.id.name === "METADATA") metadataNode = node.init.arguments?.[0];
    if (node.type === "FunctionDeclaration" && /^sprite\d+$/.test(node.id.name)) spriteFunctions.push(node);
    if (node.type === "FunctionDeclaration" && node.id.name === "render") renderFunction = node;
    if (node.type === "FunctionExpression" && node.params.length === 1 && node.params[0].name === "global") iife = node;
    if (node.type === "Literal" && node.value === "HELP_MATH_CANVAS_ASSETS") registryLiterals.push(node);
    if (node.type === "AssignmentExpression" && node.left.type === "MemberExpression" && node.left.object.name === "registry" && node.right.type === "CallExpression") {
      registrationNode = node;
      registryObject = node.right.arguments[0];
    }
  });
  assert(metadataNode && iife && registrationNode && registryObject?.type === "ObjectExpression", "unsupported safe adapter AST envelope");
  const metadata = constant(metadataNode);
  assert(metadata.sourceSwfSha256 === sourceAsset.sourceSha256 &&
    sourceAsset.assetId === `swf-${sourceAsset.sourceSha256}`, "safe metadata/source catalog identity mismatch");
  assert(binding.animationId === metadata.animationId, "maintained binding animation identity mismatch");
  assert(variantId !== metadata.animationId, "variant must have a separate identity");
  const entryTimelineId = metadata.deterministicContentTimeline?.timelineId;
  assert(typeof entryTimelineId === "string", "missing deterministic entry timeline");
  assert(renderFunction, "missing original render function");
  walk(renderFunction.body, node => {
    if (node.type === "CallExpression" && node.callee.type === "Identifier" &&
        /^draw/.test(node.callee.name)) throw new Error("unsupported drawing outside the source timeline");
  });
  const sourceTimelines = new Map(sourceAsset.timelines.map(timeline => [timeline.timelineId, timeline]));
  const plans = new Map();
  for (const fn of spriteFunctions) {
    assert(fn.params.map(param => param.name).join(",") === "ctx,ctrans,frame,ratio,time", "unexpected sprite function signature");
    const timelineId = `sprite-${fn.id.name.slice(6)}`;
    const timeline = sourceTimelines.get(timelineId);
    assert(timeline, `safe JS timeline absent from P1: ${timelineId}`);
    plans.set(fn, buildTimelinePlan(fn, timeline));
  }
  assert([...plans.keys()].some(fn => `sprite-${fn.id.name.slice(6)}` === entryTimelineId), "entry timeline not instrumented");
  const texts = Object.fromEntries(sourceAsset.textDefinitions.map(definition => {
    const staticText = definition.kind === "static-text";
    const runs = definition.runs ?? [];
    let reason = !staticText ? "dynamic-text-not-supported" : null;
    if (runs.some(run => run.text === null)) reason = reason ?? "unresolved-source-text";
    if (!runs.length || runs.some(run => !Array.isArray(run.colorRgba))) reason = reason ?? "source-text-color-unresolved";
    return [String(definition.characterId), {matrix: definition.matrix ?? EMPTY_MATRIX,
      sourceTextIds: staticText ? runs.map(run => run.sourceTextId) : [definition.sourceTextId],
      colors: runs.map(run => run.colorRgba).filter(Array.isArray), reason}];
  }));
  const configuration = {entryTimelineId, texts, bindings: bindingData(binding, sourceAsset),
    timelines: Object.fromEntries([...plans].map(([fn, plan]) => [`sprite-${fn.id.name.slice(6)}`, plan.data]))};
  const provenance = {schemaVersion: 1, builderVersion: TEXT_CANVAS_BUILDER_VERSION,
    variantId, originalAnimationId: metadata.animationId, originalRegistry: "HELP_MATH_CANVAS_ASSETS",
    variantRegistry: "HELP_MATH_TEXT_CANVAS_ASSETS", originalSafeJavascriptSha256: expectedSafeJavascriptSha256,
    sourceSwfSha256: sourceAsset.sourceSha256, sourceCatalogContentSha256, bindingSha256,
    bindingVersion: binding.version,
    runtimeSourceSha256: sha256(createLessonTextCanvasRuntime.toString()), defaultEnabled: false};
  const edits = [];
  const insert = (position, value) => edits.push({start: position, end: position, value});
  const replace = (node, value) => edits.push({start: node.start, end: node.end, value});
  const runtime = `\nvar ${PREFIX}Runtime = (${createLessonTextCanvasRuntime.toString()})(${JSON.stringify(configuration)});\n` +
    `function ${PREFIX}Place(siteId,obj,targetCanvas,ctx,matrix,ctrans,blendMode,frame,ratio,time){\n` +
    ` return ${PREFIX}Runtime.place(siteId,obj,targetCanvas,ctx,matrix,ctrans,blendMode,frame,ratio,time,function(){return place(obj,targetCanvas,ctx,matrix,ctrans,blendMode,frame,ratio,time);},typeof scalingGrids !== "undefined" && Object.prototype.hasOwnProperty.call(scalingGrids,obj));\n}\n` +
    `function ${PREFIX}Render(targetCanvas,request){\n ${PREFIX}Runtime.begin(request);\n try{return ${PREFIX}Runtime.finish(render(targetCanvas,request));}finally{${PREFIX}Runtime.reset();}\n}\n`;
  const strictDirective = iife.body.body[0];
  assert(strictDirective.directive === "use strict", "safe adapter strict directive missing");
  insert(strictDirective.end, runtime);
  for (const [fn, plan] of plans) {
    const timelineId = `sprite-${fn.id.name.slice(6)}`;
    insert(fn.body.start + 1, `\nvar ${PREFIX}Scope = ${PREFIX}Runtime.enter(${JSON.stringify(timelineId)},frame);\ntry {\n`);
    insert(fn.body.end - 1, `\n} finally {${PREFIX}Runtime.leave(${PREFIX}Scope);}\n`);
    for (const site of plan.sites) {
      replace(site.node.callee, `${PREFIX}Place`);
      insert(site.node.arguments[0].start, `${JSON.stringify(site.siteId)},`);
    }
  }
  registryLiterals.forEach(node => replace(node, JSON.stringify("HELP_MATH_TEXT_CANVAS_ASSETS")));
  walk(ast, (node, parent) => {
    if (node.type === "Literal" && node.value === metadata.animationId &&
        ((parent?.type === "MemberExpression" && parent.object.name === "registry") ||
         (parent?.type === "CallExpression" && parent.arguments[0]?.name === "registry"))) {
      replace(node, JSON.stringify(variantId));
    }
  });
  const metadataProperty = registryObject.properties.find(property => (property.key.name ?? property.key.value) === "metadata");
  replace(metadataProperty.value, `Object.freeze(Object.assign({},METADATA,{textVariant:Object.freeze(${JSON.stringify(provenance)})}))`);
  insert(registryObject.end - 1, `, renderWithText: ${PREFIX}Render`);
  let cursor = 0;
  let output = "";
  edits.sort((a, b) => a.start - b.start || a.end - b.end);
  for (const edit of edits) {
    assert(edit.start >= cursor, "overlapping AST transformation edits");
    output += safeJavascript.slice(cursor, edit.start) + edit.value;
    cursor = edit.end;
  }
  output += safeJavascript.slice(cursor);
  parse(output, {ecmaVersion: 2022, sourceType: "script"});
  const framePlans = Object.values(configuration.timelines).flatMap(timeline => Object.values(timeline.frames));
  const reasonCounts = {};
  for (const frame of framePlans) if (frame.reason) reasonCounts[frame.reason] = (reasonCounts[frame.reason] ?? 0) + 1;
  const manifest = {...provenance, kind: "lesson-text-canvas-adapter-v1", acornVersion,
    safeJavascriptPath, originalSafeJavascriptBytes: Buffer.byteLength(safeJavascript),
    outputSha256: sha256(output), outputBytes: Buffer.byteLength(output),
    support: {lane: "proven-static-unmasked-source-draw-order", timelineFunctions: plans.size,
      supportedFramePlans: framePlans.filter(frame => !frame.reason).length,
      unsupportedFramePlans: framePlans.filter(frame => frame.reason).length, reasonCounts,
      boundInstances: Object.keys(configuration.bindings).length},
    claimBoundary: {sourceFilesModified: false, originalRuntimeEvidence: false,
      pageEnabled: false, modernizationComplete: false}};
  return {code: output, manifest};
}

export async function buildLessonTextCanvasAdapterFromSpec(specPath, {root = ROOT, check = false} = {}) {
  const spec = JSON.parse(await readFile(path.resolve(root, specPath), "utf8"));
  assert(spec.schemaVersion === 1, "unsupported adapter build spec");
  const safePath = path.resolve(root, spec.safeJavascript.path);
  assert(safePath.startsWith(`${path.resolve(root)}${path.sep}`), "safe JavaScript path escapes root");
  const safeJavascript = await readFile(safePath, "utf8");
  const index = JSON.parse(await readFile(path.join(root, "catalog/typography-v1/source-catalog/index.json")));
  const entry = index.assets.find(asset => asset.assetId === spec.sourceAssetId);
  assert(entry, "source asset is absent from frozen P1 catalog");
  const sourceAsset = await readTextSourceAsset(root, entry);
  const bindingBytes = await readFile(path.resolve(root, spec.binding.path));
  assert(sha256(bindingBytes) === spec.binding.sha256, "maintained binding file SHA mismatch");
  const result = buildLessonTextCanvasAdapter({safeJavascript,
    safeJavascriptPath: spec.safeJavascript.path,
    expectedSafeJavascriptSha256: spec.safeJavascript.sha256,
    sourceAsset, sourceCatalogContentSha256: entry.contentSha256,
    binding: JSON.parse(bindingBytes), bindingSerialized: bindingBytes.toString("utf8"),
    bindingSha256: spec.binding.sha256, variantId: spec.variantId});
  const files = [[spec.output.javascript, result.code],
    [spec.output.manifest, `${JSON.stringify(result.manifest, null, 2)}\n`]];
  for (const [relative, content] of files) {
    assert(typeof relative === "string" && !path.isAbsolute(relative), "output path must be relative");
    const absolute = path.resolve(root, relative);
    assert(absolute.startsWith(`${path.resolve(root)}${path.sep}`) && absolute !== safePath &&
      /(?:^|\/)typography-v1\//.test(relative), "output must be a separate typography-v1 artifact");
    if (check) assert((await readFile(absolute, "utf8")) === content, `stale adapter output: ${relative}`);
    else {
      let exists = false;
      try {await lstat(absolute); exists = true;} catch (error) {if (error.code !== "ENOENT") throw error;}
      if (exists) assert((await readFile(absolute, "utf8")) === content, "refusing to overwrite an existing different variant");
      else {await mkdir(path.dirname(absolute), {recursive: true}); await writeFile(absolute, content, {flag: "wx"});}
    }
  }
  return result.manifest;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const args = process.argv.slice(2);
  const specIndex = args.indexOf("--spec");
  assert(specIndex >= 0 && args[specIndex + 1] && args.every((arg, index) =>
    index === specIndex || index === specIndex + 1 || arg === "--check"),
  "Usage: node scripts/build-lesson-text-canvas-adapter-v1.mjs --spec <file> [--check]");
  buildLessonTextCanvasAdapterFromSpec(args[specIndex + 1], {check: args.includes("--check")})
    .then(result => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch(error => {process.stderr.write(`${error.stack ?? error}\n`); process.exitCode = 1;});
}
