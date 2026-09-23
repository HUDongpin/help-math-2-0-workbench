#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {execFile as execFileCallback} from 'node:child_process';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {promisify} from 'node:util';
import {Script} from 'node:vm';
import {fileURLToPath} from 'node:url';

import {
  adoptCourseImplementationCaptures
} from './adopt-course-implementation-captures.mjs';

const execFile = promisify(execFileCallback);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_SPEC = 'migrations/course-g04-l03-in-009/audit/canvas-candidate-spec.json';
const GENERATOR_PATH = 'scripts/build-in-009-ffdec-canvas-candidate.mjs';
const OUTPUT_REPORT_JSON = 'reports/g4-l3-in009-current-javascript-candidate.json';
const OUTPUT_REPORT_MARKDOWN = 'reports/g4-l3-in009-current-javascript-candidate.md';
const INTEGRATION_PATHS = Object.freeze([
  'packages/demos/prototype-registry.json',
  'packages/demos/src/modules/course-g04-l03-in-009.tsx',
  'packages/demos/src/timelines/course-g04-l03-in-009.ts',
  'packages/demos/tests/course-g04-l03-in-009.test.ts'
]);
const CURRENT_JAVASCRIPT_EVIDENCE_PATHS = Object.freeze({
  rendererFrameDomainSupport:
    'migrations/course-g04-l03-in-009/audit/renderer-frame-domain-support.json',
  implementationCapture:
    'migrations/course-g04-l03-in-009/evidence/current-javascript-implementation-capture-adoption.json'
});
const PROTECTED_PATHS = Object.freeze([
  'catalog/completion-ledger.json',
  'catalog/lesson-release-ledger.json',
  'migrations/course-g04-l03-in-009/migration.json',
  'reports/current-javascript-output-human-approval.json'
]);
const ACCEPTANCE_KEYS = Object.freeze([
  'implementationAuthorized',
  'authoritativeOriginalRuntimeComplete',
  'naturalRuntimeReachabilityComplete',
  'frameDomainDispositionComplete',
  'bilingualVisualParityComplete',
  'audioAccepted',
  'replayParityComplete',
  'fullFrameRmseComplete',
  'behaviorComplete',
  'productQaComplete',
  'accessibilityQaComplete',
  'humanVisualReviewAccepted',
  'ownerAccepted',
  'strictMigrationComplete'
]);
const AUTHORIZATION_KEYS = Object.freeze([
  'strictImplementationAuthorized',
  'completionLedgerWriteAuthorized',
  'approvalOrPinWriteAuthorized',
  'productRouteWriteAuthorized',
  'publicStrictLibraryAdmissionAuthorized',
  'sourceAssetWriteAuthorized',
  'audioEnablementAuthorized',
  'hostActionScriptEnablementAuthorized',
  'visualParityClaimAuthorized',
  'migrationCompletionClaimAuthorized'
]);

const BLOCKED_RUNTIME_PATTERNS = Object.freeze([
  ['dynamic evaluation', /\beval\s*\(/],
  ['dynamic function construction', /\bFunction\s*\(/],
  ['timer or ambient ticker', /\b(?:setInterval|setTimeout|requestAnimationFrame)\s*\(/],
  ['network primitive', /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\b/],
  ['worker primitive', /\b(?:Worker|SharedWorker)\s*\(/],
  ['persistent storage', /\b(?:localStorage|sessionStorage|indexedDB)\b/],
  ['navigation or messaging', /\b(?:location|postMessage|open)\s*(?:\.|\()/],
  ['dynamic import', /\bimport\s*\(/],
  ['document body access', /document\.body/],
  ['ambient DOM listener', /\b(?:addEventListener|removeEventListener)\s*\(/]
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function fingerprint(value) {
  return sha256(stableJson(value));
}

function portable(value) {
  return value.split(path.sep).join('/');
}

function falseBoundary(keys) {
  return Object.fromEntries(keys.map((key) => [key, false]));
}

function binding(record) {
  return {
    path: record.path,
    bytes: record.contents.length,
    sha256: record.sha256
  };
}

function exactBinding(value, expected, label) {
  assert(
    value?.path === expected.path &&
      value?.bytes === expected.bytes &&
      value?.sha256 === expected.sha256,
    `${label}: file binding changed`
  );
}

export function currentJavascriptCandidateReportFingerprint(report) {
  const projected = {...report};
  delete projected.reportFingerprintSha256;
  return fingerprint(projected);
}

function resolveProjectPath(root, relativePath, label) {
  assert(typeof relativePath === 'string' && relativePath.length > 0, `${label}: path is required`);
  assert(!path.isAbsolute(relativePath), `${label}: path must be project-relative`);
  const resolved = path.resolve(root, relativePath);
  assert(resolved.startsWith(`${root}${path.sep}`), `${label}: path escapes project root`);
  return resolved;
}

function replaceExactlyOnce(source, search, replacement, label) {
  const first = source.indexOf(search);
  const last = source.lastIndexOf(search);
  assert(first >= 0, `${label}: marker not found`);
  assert(first === last, `${label}: marker occurred more than once`);
  return `${source.slice(0, first)}${replacement}${source.slice(first + search.length)}`;
}

function replaceSection(source, startMarker, endMarker, replacement, label) {
  const start = source.indexOf(startMarker);
  assert(start >= 0, `${label}: start marker not found`);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert(end >= 0, `${label}: end marker not found`);
  assert(source.indexOf(startMarker, start + startMarker.length) < 0, `${label}: duplicate start marker`);
  return `${source.slice(0, start)}${replacement}${source.slice(end)}`;
}

function validateSpec(spec) {
  assert(spec?.schemaVersion === 1, 'spec: schemaVersion must be 1');
  assert(spec.animationId === 'course-g04-l03-in-009', 'spec: unexpected animationId');
  assert(/^[a-f0-9]{64}$/.test(spec.source?.swfSha256 || ''), 'spec: invalid source hash');
  for (const key of [
    'scenarioInventorySha256',
    'audioAuditSha256',
    'swfmillXmlSha256',
    'placementParserSha256',
    'controlledFrame637ProbeSha256',
    'controlledFrame637StageSha256',
    'rootRuntimeBaselineSha256',
    'ownerHostLocalizationContractSha256'
  ]) {
    assert(/^[a-f0-9]{64}$/.test(spec.evidence?.[key] || ''), `spec: invalid ${key}`);
  }
  for (const key of ['helperSha256', 'framesHtmlSha256', 'expectedPlacedFunctionsSha256', 'embeddedImageVariablesSha256']) {
    assert(/^[a-f0-9]{64}$/.test(spec.ffdecExport?.[key] || ''), `spec: invalid ${key}`);
  }
  assert(spec.ffdecExport.targetSpriteObjectId === 200, 'spec: target sprite must be object 200');
  assert(spec.ffdecExport.targetSpriteFunction === 'sprite200', 'spec: unexpected target function');
  assert(
    spec.ffdecExport.maskRenderBlockCount === 1624,
    'spec: FFDec mask-render block count changed'
  );
  assert(spec.timeline.fps === 12, 'spec: FPS must be 12');
  assert(spec.timeline.stage.width === 800 && spec.timeline.stage.height === 600, 'spec: stage must be 800x600');
  assert(spec.timeline.root.frameCount === 10 && spec.timeline.root.beginFrame === 6, 'spec: root timeline changed');
  assert(spec.timeline.local.timelineId === 'sprite-200' && spec.timeline.local.frameCount === 637, 'spec: local timeline changed');
  assert(spec.timeline.local.terminalFrameHasStopAction === false, 'spec: unsupported terminal stop claim');
  assert(spec.timeline.local.playbackMode === 'loop', 'spec: expected loop playback');
  assert(JSON.stringify(spec.runtimeContract.scenarios) === JSON.stringify([
    'default',
    'root-standalone',
    'glossary-temperature-unavailable',
    'glossary-measure-unavailable'
  ]), 'spec: scenario allowlist changed');
  assert(
    JSON.stringify(spec.runtimeContract.sourceProvenVisualLanguages) === JSON.stringify(['en']),
    'spec: source visual language identity changed'
  );
  assert(
    JSON.stringify(spec.runtimeContract.renderableRouteLanguages) === JSON.stringify(['en', 'es']),
    'spec: renderable route-language boundary changed'
  );
  assert(
    JSON.stringify(spec.runtimeContract.blockedLanguages) === JSON.stringify([]),
    'spec: route-language blocker allowlist changed'
  );
  assert(
    spec.runtimeContract.visualLocalizationStatus === 'source-shared-untranslated-visual',
    'spec: visual localization boundary changed'
  );
  assert(spec.timeline.root.placementPixels.x === spec.timeline.root.placementTwips.x / 20, 'spec: root X twips mismatch');
  assert(spec.timeline.root.placementPixels.y === spec.timeline.root.placementTwips.y / 20, 'spec: root Y twips mismatch');
  assert(Math.abs(spec.timeline.stageRenderOffset.x - (spec.timeline.root.placementPixels.x - spec.ffdecExport.exportInternalTranslation.x)) < 1e-9, 'spec: X render offset mismatch');
  assert(Math.abs(spec.timeline.stageRenderOffset.y - (spec.timeline.root.placementPixels.y - spec.ffdecExport.exportInternalTranslation.y)) < 1e-9, 'spec: Y render offset mismatch');
  assert(
    spec.evidence.rootRuntimeFrameArchive ===
      'artifacts/full-frame/pilot-baselines/course-g04-l03-in-009/adobe-flash-player-32-standalone-default',
    'spec: unexpected root runtime frame archive'
  );
  return spec;
}

function pngDimensions(bytes) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  assert(bytes.length >= 24 && bytes.subarray(0, 8).equals(signature), 'root baseline frame: invalid PNG signature');
  assert(bytes.toString('ascii', 12, 16) === 'IHDR', 'root baseline frame: IHDR is not first');
  return {width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20)};
}

export function validateRootRuntimeBaseline(spec, baseline, rootFrameAssets) {
  validateSpec(spec);
  assert(
    baseline?.status === 'authoritative-standalone-runtime-baseline',
    'root runtime baseline: authority status changed'
  );
  assert(
    baseline?.authority?.kind === 'original-swf-adobe-flash-player-runtime' &&
      baseline?.authority?.tool === 'Adobe Flash Player 32.0.0.414',
    'root runtime baseline: runtime authority changed'
  );
  assert(
    baseline?.source?.swfSha256 === spec.source.swfSha256,
    'root runtime baseline: source hash mismatch'
  );
  assert(
    baseline?.runtime?.stage?.width === 800 && baseline?.runtime?.stage?.height === 600 &&
      baseline?.runtime?.fps === 12 && baseline?.runtime?.frameCount === 10 &&
      baseline?.runtime?.scenario === 'standalone-default' && baseline?.runtime?.lang === 'en',
    'root runtime baseline: runtime identity changed'
  );
  assert(
    baseline?.capture?.archiveDirectory === spec.evidence.rootRuntimeFrameArchive,
    'root runtime baseline: archive path mismatch'
  );
  assert(
    Array.isArray(baseline.frames) && baseline.frames.length === 10 &&
      Array.isArray(rootFrameAssets) && rootFrameAssets.length === 10,
    'root runtime baseline: expected ten frames and ten frame assets'
  );
  baseline.frames.forEach((entry, index) => {
    const expectedFrame = index + 1;
    const asset = rootFrameAssets[index];
    assert(entry.frame === expectedFrame && asset.frame === expectedFrame, `root runtime baseline: frame ${expectedFrame} ordering changed`);
    assert(/^frame-\d{4}\.png$/.test(entry.file), `root runtime baseline: unsafe frame filename ${entry.file}`);
    assert(entry.sha256 === asset.sha256 && sha256(asset.bytes) === entry.sha256, `root runtime baseline: frame ${expectedFrame} hash mismatch`);
    assert(entry.bytes === asset.bytes.length, `root runtime baseline: frame ${expectedFrame} byte count mismatch`);
    const dimensions = pngDimensions(asset.bytes);
    assert(
      entry.width === 800 && entry.height === 600 && dimensions.width === 800 && dimensions.height === 600,
      `root runtime baseline: frame ${expectedFrame} dimensions changed`
    );
  });
  return rootFrameAssets;
}

function timeline(inventory, id) {
  const matches = inventory.timelineInventory.filter((entry) => entry.timelineId === id);
  assert(matches.length === 1, `scenario inventory: expected exactly one ${id}`);
  return matches[0];
}

export function validateCandidateEvidence(spec, scenarioInventory, audioAudit, placement) {
  validateSpec(spec);
  assert(scenarioInventory.animationId === spec.animationId, 'scenario inventory: animationId mismatch');
  assert(scenarioInventory.source.swfSha256 === spec.source.swfSha256, 'scenario inventory: source hash mismatch');
  assert(scenarioInventory.source.stage.width === 800 && scenarioInventory.source.stage.height === 600, 'scenario inventory: stage mismatch');
  assert(scenarioInventory.source.fps === 12 && scenarioInventory.source.rootFrameCount === 10, 'scenario inventory: root metadata mismatch');
  const root = timeline(scenarioInventory, 'root');
  const local = timeline(scenarioInventory, 'sprite-200');
  assert(root.controlStates.some((state) => state.frame === 1 && state.reasons.includes('script-stop-state')), 'scenario inventory: root preloader stop missing');
  assert(root.controlStates.some((state) => state.frame === 6 && state.reasons.includes('script-stop-state')), 'scenario inventory: root begin stop missing');
  assert(root.frameLabels.some((label) => label.frame === 6 && label.label === 'begin'), 'scenario inventory: begin label missing');
  assert(root.namedPlacements.some((entry) => entry.frame === 6 && entry.name === 'animation' && Number(entry.objectId) === 200), 'scenario inventory: animation placement missing');
  assert(local.frameCount === 637, 'scenario inventory: local frame count mismatch');
  const terminal = local.controlStates.find((state) => state.frame === 637);
  assert(terminal && !terminal.reasons.includes('script-stop-state'), 'scenario inventory: terminal frame unexpectedly stops');
  const glossary = scenarioInventory.coverage.glossaryAndHyperlinkObligations;
  assert(JSON.stringify(glossary.map((item) => item.term).sort()) === JSON.stringify(['Measure', 'Temperature']), 'scenario inventory: glossary obligations changed');
  const bindings = scenarioInventory.dependencies.bindings.map((item) => item.binding).sort();
  assert(bindings.includes('_global.KeyAttribute') && bindings.includes('_root.DoHyperLinks') && bindings.includes('_root.animation_mc'), 'scenario inventory: unresolved glossary bindings missing');
  assert(scenarioInventory.dependencies.safeSideEffectPolicy.length === 0, 'scenario inventory: unexpected safe side-effect policy');

  assert(audioAudit.animationId === spec.animationId, 'audio audit: animationId mismatch');
  assert(audioAudit.source.observedSha256 === spec.source.swfSha256 && audioAudit.source.hashMatches === true, 'audio audit: source hash mismatch');
  const streams = audioAudit.embeddedAudio.soundStreams;
  assert(streams.length === 1, 'audio audit: expected one embedded stream');
  const stream = streams[0];
  assert(stream.context.kind === 'sprite' && Number(stream.context.characterId) === 200, 'audio audit: embedded stream context changed');
  assert(stream.firstBlockFrame === 7 && stream.lastBlockFrame === 637 && stream.blockCount === 588 && stream.format === 'mp3', 'audio audit: embedded stream coverage changed');
  const external = audioAudit.externalAudio.exactAssociations;
  assert(external.length === 1 && external[0].observedSha256 === spec.audioInventory.externalSpanish.sha256, 'audio audit: Spanish track changed');
  assert(external[0].startFrame === null, 'audio audit: unproven Spanish cue frame was introduced');

  assert(placement.stage.width === 800 && placement.stage.height === 600 && placement.fps === 12, 'swfmill parser: stage/FPS mismatch');
  assert(placement.rootFrameCount === 10, 'swfmill parser: root frame count mismatch');
  assert(placement.targetSprite.objectId === 200 && placement.targetSprite.frameCount === 637, 'swfmill parser: sprite metadata mismatch');
  assert(placement.rootPlacement.name === 'animation' && placement.rootPlacement.depth === 4, 'swfmill parser: root placement identity mismatch');
  assert(placement.rootPlacement.translationTwips.x === 8268 && placement.rootPlacement.translationTwips.y === 5666, 'swfmill parser: root placement transform mismatch');
  return {root, local, stream, external: external[0]};
}

export function validateOwnerHostLocalizationContract(spec, contract) {
  validateSpec(spec);
  assert(contract?.schemaVersion === 1, 'owner host/localization contract: schemaVersion changed');
  assert(
    contract?.animationId === spec.animationId &&
      contract?.artifactType === 'owner-host-localization-interaction-source-contract',
    'owner host/localization contract: identity changed'
  );
  assert(
    contract?.sources?.childSwf?.path === spec.source.swf &&
      contract?.sources?.childSwf?.sha256 === spec.source.swfSha256,
    'owner host/localization contract: child source binding changed'
  );
  assert(
    contract?.sourceConclusions?.childVisualLocalization?.status ===
      spec.runtimeContract.visualLocalizationStatus &&
      contract?.sourceConclusions?.childVisualLocalization?.exhaustiveChildScriptCount === 5,
    'owner host/localization contract: shared untranslated visual finding changed'
  );
  assert(
    contract?.extractionBindings?.childActionScript?.evidenceFile ===
      'audit/machine/ffdec-scripts.txt.gz' &&
      /^[a-f0-9]{64}$/.test(
        contract?.extractionBindings?.childActionScript?.evidenceFileSha256 || ''
      ),
    'owner host/localization contract: child ActionScript binding changed'
  );
  assert(
    contract?.sources?.sameLessonHost?.path ===
      'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/index_local.swf' &&
      /^[a-f0-9]{64}$/.test(contract?.sources?.sameLessonHost?.sha256 || ''),
    'owner host/localization contract: same-lesson host binding changed'
  );
  assert(
    contract?.sourceConclusions?.externalSpanishAudio?.status ===
      'exact-owner-file-and-host-routing-proven-runtime-unvalidated' &&
      contract?.sources?.spanishAudio?.sha256 === spec.audioInventory.externalSpanish.sha256,
    'owner host/localization contract: Spanish audio boundary changed'
  );
  assert(
    contract?.authority?.authorizedOriginalRuntimeExecuted === false &&
      contract?.authority?.audioListened === false &&
      contract?.authority?.audioSynchronizationValidated === false &&
      contract?.authority?.humanAccepted === false &&
      contract?.authority?.ownerAccepted === false &&
      contract?.authority?.fidelityClaimed === false,
    'owner host/localization contract: fail-closed authority boundary changed'
  );
  assert(
    contract?.strictDisposition?.strictAcceptanceEffect === 'none' &&
      Array.isArray(contract?.strictDisposition?.remainingBlockers) &&
      contract.strictDisposition.remainingBlockers.length > 0,
    'owner host/localization contract: strict disposition changed'
  );
  return contract;
}

function validateControlledFrame637Probe(spec, probe) {
  assert(probe?.animationId === spec.animationId, 'controlled frame 637 probe: animationId mismatch');
  assert(
    probe?.fixture?.sourceSwfSha256 === spec.source.swfSha256,
    'controlled frame 637 probe: source hash mismatch'
  );
  assert(
    probe?.fixture?.target?.localTimelineId === 'sprite-200' &&
      probe?.fixture?.target?.localFrame === 637,
    'controlled frame 637 probe: local target changed'
  );
  assert(
    probe?.claims?.directControlledLocalFrameReached === true &&
      probe?.claims?.threeConsecutiveActualFrameChecksPassed === true,
    'controlled frame 637 probe: source-addressed runtime check did not pass'
  );
  assert(
    probe?.claims?.authoritativeBaseline === false && probe?.claims?.rmseEligible === false,
    'controlled frame 637 probe: engineering-only evidence was promoted unexpectedly'
  );
  const stage = probe?.captures?.find(
    (capture) => capture.path === spec.evidence.controlledFrame637Stage
  );
  assert(
    stage?.sha256 === spec.evidence.controlledFrame637StageSha256 &&
      stage?.width === 800 &&
      stage?.height === 600 &&
      stage?.format === 'JPEG',
    'controlled frame 637 probe: stage capture identity changed'
  );
}

export function parseArguments(argv, {root = ROOT} = {}) {
  let check = false;
  let specPath = DEFAULT_SPEC;
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--check') check = true;
    else if (argv[index] === '--spec') {
      assert(argv[index + 1] && !argv[index + 1].startsWith('--'), '--spec requires a path');
      specPath = argv[index + 1];
      index += 1;
    } else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  return {check, specPath: resolveProjectPath(root, specPath, 'spec')};
}

export function resolveCandidateFrameState(request, spec) {
  validateSpec(spec);
  const frameDomain = request?.frameDomain ?? 'sprite-200';
  assert(frameDomain === 'root' || frameDomain === 'sprite-200', `unsupported frame domain: ${frameDomain}`);
  const frame = request?.frame;
  const frameCount = frameDomain === 'root' ? 10 : 637;
  assert(
    Number.isSafeInteger(frame) && frame >= 1 && frame <= frameCount,
    `frame must be a safe integer within 1..${frameCount} for ${frameDomain}`
  );
  const scenario = request?.scenario ?? 'default';
  assert(spec.runtimeContract.scenarios.includes(scenario), `unsupported scenario: ${scenario}`);
  const lang = request?.lang ?? 'en';
  assert(lang === 'en' || lang === 'es', `unsupported language: ${lang}`);
  const rawSeed = request?.seed ?? 0;
  assert(Number.isSafeInteger(rawSeed), 'seed must be a safe integer');
  const seed = rawSeed >>> 0;
  const scenarioMatchesDomain =
    (frameDomain === 'root' && scenario === 'root-standalone') ||
    (frameDomain === 'sprite-200' && scenario !== 'root-standalone');
  const blocker = !scenarioMatchesDomain
    ? 'frame-domain-scenario-mismatch'
    : scenario === 'glossary-temperature-unavailable'
      ? 'temperature-glossary-host-contract-unresolved'
      : scenario === 'glossary-measure-unavailable'
        ? 'measure-glossary-host-contract-unresolved'
        : null;
  return Object.freeze({
    frameDomain,
    localFrame: frame,
    exportFrame: frameDomain === 'sprite-200' ? frame - 1 : null,
    rootFrame: frameDomain === 'root' ? frame : 6,
    rootState:
      frameDomain === 'root' ? 'direct-frame-accurate-only' : 'stopped-at-begin-while-child-plays',
    scenario,
    lang,
    seed,
    renderable: blocker === null,
    blocker,
    visualBranchIndependent: true,
    visualLocalizationStatus: spec.runtimeContract.visualLocalizationStatus,
    audioLocalizationStatus: 'unresolved',
    audioRendered: false
  });
}

function extractDefinitions(framesHtml, spec) {
  const normalized = framesHtml.replace(/\r\n?/g, '\n');
  assert(new RegExp(`<canvas\\s+id="myCanvas"\\s+width="${spec.ffdecExport.exportCanvas.width}"\\s+height="${spec.ffdecExport.exportCanvas.height}"`).test(normalized), 'frames export: canvas dimensions changed');
  const inlineMarker = '<script>var canvas=document.getElementById("myCanvas");';
  const inlineStart = normalized.indexOf(inlineMarker);
  assert(inlineStart >= 0 && normalized.indexOf(inlineMarker, inlineStart + 1) < 0, 'frames export: inline bootstrap changed');
  const inlineEnd = normalized.indexOf('</script>', inlineStart);
  assert(inlineEnd > inlineStart, 'frames export: inline script end missing');
  const inline = normalized.slice(inlineStart + '<script>'.length, inlineEnd);
  const definitionsStart = inline.indexOf('var scalingGrids = {};');
  const viewerStart = inline.indexOf('\nvar frame = -1;');
  assert(definitionsStart >= 0 && viewerStart > definitionsStart, 'frames export: definition boundaries changed');
  let definitions = inline.slice(definitionsStart, viewerStart).trimEnd();
  definitions = replaceExactlyOnce(definitions, 'function font1(ctx,ch,textColor){\n\tdefaultFill = textColor;', 'function font1(ctx,ch,textColor){\n\tvar defaultFill = textColor;', 'font fill scope');
  const maskContextMarker = '\t\t\tctx = cctx;\n';
  const maskCommitMarker = '\t\t\tclips[clips.length-1].clipCanvas = canvas;\n';
  const maskContextCount = definitions.split(maskContextMarker).length - 1;
  const maskCommitCount = definitions.split(maskCommitMarker).length - 1;
  assert(
    maskContextCount === spec.ffdecExport.maskRenderBlockCount &&
      maskCommitCount === spec.ffdecExport.maskRenderBlockCount,
    `frames export: expected ${spec.ffdecExport.maskRenderBlockCount} paired mask-render blocks, observed ${maskContextCount}/${maskCommitCount}`
  );
  definitions = definitions
    .replaceAll(
      maskContextMarker,
      `${maskContextMarker}\t\t\tMASK_RENDER_DEPTH += 1;\n\t\t\ttry {\n`
    )
    .replaceAll(
      maskCommitMarker,
      `\t\t\t} finally {\n\t\t\t\tMASK_RENDER_DEPTH -= 1;\n\t\t\t}\n${maskCommitMarker}`
    );
  const viewer = inline.slice(viewerStart);
  const header = definitions.match(/function\s+sprite200\(ctx,ctrans,frame,ratio,time\)\{\s*ctx\.save\(\);\s*ctx\.transform\(1,0,0,1,([-0-9.]+),([-0-9.]+)\);\s*var clips = \[\];\s*var frame_cnt = (\d+);/);
  assert(header, 'frames export: sprite200 header changed');
  assert(Number(header[1]) === spec.ffdecExport.exportInternalTranslation.x && Number(header[2]) === spec.ffdecExport.exportInternalTranslation.y, 'frames export: sprite translation changed');
  assert(Number(header[3]) === 637, 'frames export: sprite frame count changed');
  const pushed = [...viewer.matchAll(/frames\.push\((\d+)\);/g)].map((match) => Number(match[1]));
  assert(pushed.length === 637 && pushed.every((value, index) => value === index), 'frames export: frame sequence changed');
  assert(viewer.includes('window.setInterval(function(){nextFrame(ctx,ctrans);},83);'), 'frames export: expected FFDec viewer ticker changed');
  const placedFunctions = [...new Set([...definitions.matchAll(/place\("([A-Za-z_$][A-Za-z0-9_$]*)"/g)].map((match) => match[1]))].sort();
  assert(placedFunctions.length === spec.ffdecExport.expectedPlacedFunctionCount, 'frames export: placed-function count changed');
  assert(sha256(JSON.stringify(placedFunctions)) === spec.ffdecExport.expectedPlacedFunctionsSha256, 'frames export: placed-function allowlist changed');
  const defined = new Set([...definitions.matchAll(/function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g)].map((match) => match[1]));
  placedFunctions.forEach((name) => assert(defined.has(name), `frames export: ${name} is undefined`));
  const images = [...definitions.matchAll(/var\s+(imageObj\d+)\s*=\s*document\.createElement\("img"\);\s*\1\.src="(data:image\/(?:PNG|JPEG);base64,[A-Za-z0-9+/=]+)";/g)].map((match) => match[1]);
  assert(JSON.stringify(images) === JSON.stringify(spec.ffdecExport.embeddedImageVariables), 'frames export: embedded image list changed');
  assert(sha256(JSON.stringify(images)) === spec.ffdecExport.embeddedImageVariablesSha256, 'frames export: embedded image hash changed');
  assert(!definitions.includes('http://') && !definitions.includes('https://'), 'frames export: external URL found');
  return {definitions, placedFunctions, images};
}

function sanitizeHelper(source) {
  let helper = source.replace(/\r\n?/g, '\n');
  helper = replaceExactlyOnce(helper, 'Filters = {};', 'var Filters = {};', 'helper Filters global');
  helper = replaceExactlyOnce(
    helper,
    '        d[3] = this._cut(d[3] * this.a_mult / 255 + this.a_add / 255, 0, 1);',
    '        var transformedAlpha = d[3] * this.a_mult / 255 + this.a_add / 255;\n        d[3] = MASK_RENDER_DEPTH > 0 && transformedAlpha > 0 ? 1 : this._cut(transformedAlpha, 0, 1);',
    'vector-mask alpha semantics'
  );
  helper = replaceExactlyOnce(
    helper,
    '        if (this.isEmpty()) {',
    '        if (this.isEmpty() && MASK_RENDER_DEPTH === 0) {',
    'bitmap-mask alpha semantics'
  );
  helper = replaceExactlyOnce(helper,
    '    //temporary add to document to get this work (getImageData, etc.)\n    document.body.appendChild(c);\n    document.body.removeChild(c);\n',
    '    // Detached canvases provide the required image-data surface.\n',
    'helper body workaround');
  const dispatcher = `var placeRaw = function (obj, canvas, ctx, matrix, ctrans, blendMode, frame, ratio, time) {
    var renderer = SAFE_OBJECTS[obj];
    if (typeof renderer !== "function") throw new Error("Blocked unknown FFDec drawing object: " + obj);
    ctx.save();
    ctx.transform(matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5]);
    if (blendMode > 1) {
        var oldctx = ctx;
        var ncanvas = createCanvas(canvas.width, canvas.height);
        ctx = ncanvas.getContext("2d");
        enhanceContext(ctx);
        ctx.applyTransforms(oldctx._matrix);
    }
    var activeTransform = blendMode > 1 ? new cxform(0,0,0,0,255,255,255,255) : ctrans;
    renderer(ctx,activeTransform,frame,ratio,time);
    if (blendMode > 1) {
        BlendModes.blendCanvas(ctrans.applyToImage(ncanvas), canvas, canvas, blendMode);
        ctx = oldctx;
    }
    ctx.restore();
}
`;
  helper = replaceSection(helper,
    'var placeRaw = function (obj, canvas, ctx, matrix, ctrans, blendMode, frame, ratio, time) {',
    '\nvar transformPoint = function (matrix, p) {',
    dispatcher,
    'helper dispatcher');
  helper = replaceSection(helper,
    "window.addEventListener('load', function () {",
    '\nfunction drawMorphPath(ctx, p, ratio, doStroke, scaleMode) {',
    '',
    'helper resizer');
  return helper.trim();
}

function runtimeStateSource(spec) {
  return `function resolveFrameState(request) {
    request = request || {};
    var frameDomain = request.frameDomain === undefined ? "sprite-200" : request.frameDomain;
    if (frameDomain !== "root" && frameDomain !== "sprite-200") throw new Error("unsupported frame domain: " + frameDomain);
    var frame = request.frame;
    var frameCount = frameDomain === "root" ? 10 : 637;
    if (!Number.isSafeInteger(frame) || frame < 1 || frame > frameCount) throw new Error("frame must be a safe integer within 1.." + frameCount + " for " + frameDomain);
    var scenarios = ${JSON.stringify(spec.runtimeContract.scenarios)};
    var scenario = request.scenario === undefined ? "default" : request.scenario;
    if (scenarios.indexOf(scenario) < 0) throw new Error("unsupported scenario: " + scenario);
    var lang = request.lang === undefined ? "en" : request.lang;
    if (lang !== "en" && lang !== "es") throw new Error("unsupported language: " + lang);
    var rawSeed = request.seed === undefined ? 0 : request.seed;
    if (!Number.isSafeInteger(rawSeed)) throw new Error("seed must be a safe integer");
    var seed = rawSeed >>> 0;
    var scenarioMatchesDomain = frameDomain === "root" ? scenario === "root-standalone" : scenario !== "root-standalone";
    var blocker = !scenarioMatchesDomain ? "frame-domain-scenario-mismatch"
        : scenario === "glossary-temperature-unavailable" ? "temperature-glossary-host-contract-unresolved"
        : scenario === "glossary-measure-unavailable" ? "measure-glossary-host-contract-unresolved" : null;
    return Object.freeze({frameDomain:frameDomain,localFrame:frame,exportFrame:frameDomain === "sprite-200" ? frame-1 : null,
        rootFrame:frameDomain === "root" ? frame : 6,
        rootState:frameDomain === "root" ? "direct-frame-accurate-only" : "stopped-at-begin-while-child-plays",
        scenario:scenario,lang:lang,seed:seed,renderable:blocker === null,blocker:blocker,
        visualBranchIndependent:true,
        visualLocalizationStatus:${JSON.stringify(spec.runtimeContract.visualLocalizationStatus)},
        audioLocalizationStatus:"unresolved",audioRendered:false});
}`;
}

export function buildSafeRuntime({helperSource, framesHtml, spec, rootBaseline, rootFrameAssets}) {
  validateSpec(spec);
  validateRootRuntimeBaseline(spec, rootBaseline, rootFrameAssets);
  const helper = sanitizeHelper(helperSource);
  const {definitions, placedFunctions, images} = extractDefinitions(framesHtml, spec);
  const registryEntries = placedFunctions.map((name) => `${JSON.stringify(name)}:${name}`).join(',\n        ');
  const rootUniqueImages = [];
  const rootImagesByHash = new Map();
  const rootFrameImageNames = [null];
  for (const asset of rootFrameAssets) {
    let image = rootImagesByHash.get(asset.sha256);
    if (!image) {
      image = {
        name: `rootFrameImage${rootUniqueImages.length}`,
        sha256: asset.sha256,
        dataUrl: `data:image/PNG;base64,${asset.bytes.toString('base64')}`,
        frames: []
      };
      rootImagesByHash.set(asset.sha256, image);
      rootUniqueImages.push(image);
    }
    image.frames.push(asset.frame);
    rootFrameImageNames[asset.frame] = image.name;
  }
  const rootImageDefinitions = rootUniqueImages
    .map(
      ({name, dataUrl}) =>
        `var ${name}=document.createElement("img");\n${name}.src=${JSON.stringify(dataUrl)};`
    )
    .join('\n');
  const metadata = {
    schemaVersion: 1,
    animationId: spec.animationId,
    classification: spec.classification,
    sourceSwfSha256: spec.source.swfSha256,
    stage: spec.timeline.stage,
    fps: spec.timeline.fps,
    rootTimeline: {
      timelineId: 'root',
      frameCount: 10,
      durationMs: 10 * 1000 / 12,
      scenario: 'root-standalone',
      language: 'en',
      addressing: 'direct-frame-accurate-only',
      naturalPlaybackClaimed: false,
      baselineSha256: spec.evidence.rootRuntimeBaselineSha256
    },
    deterministicContentTimeline: {timelineId: 'sprite-200', frameCount: 637, durationMs: 637 * 1000 / 12, playbackMode: 'loop'},
    defaultFrameDomain: 'sprite-200',
    scenarios: spec.runtimeContract.scenarios,
    sourceProvenVisualLanguages: ['en'],
    renderableRouteLanguages: ['en', 'es'],
    blockedLanguages: [],
    visualLocalizationStatus: spec.runtimeContract.visualLocalizationStatus,
    visualLanguageBehavior: 'same-source-pixels-untranslated',
    spanishVisualTranslationClaimed: false,
    bilingualVisualParityClaimed: false,
    audioRendering: 'not-included',
    audioLocalizationStatus: 'unresolved'
  };
  const runtime = `/* Generated by scripts/build-in-009-ffdec-canvas-candidate.mjs. */
/* Engineering candidate only; strict, human, and owner acceptance remain unchanged. */
(function (global) {
"use strict";
var canvas = null;
var SAFE_OBJECTS = null;
var MASK_RENDER_DEPTH = 0;
${helper}
${definitions}
${rootImageDefinitions}
SAFE_OBJECTS = Object.freeze({
        ${registryEntries}
});
var ROOT_FRAME_IMAGES = Object.freeze([null,${rootFrameImageNames.slice(1).join(',')}]);
var EMBEDDED_IMAGES = Object.freeze([${[...images, ...rootUniqueImages.map(({name}) => name)].join(',')}]);
var METADATA = deepFreeze(${JSON.stringify(metadata)});
var readyPromise = null;
function deepFreeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
        Object.freeze(value);
        Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    }
    return value;
}
function ready() {
    if (readyPromise !== null) return readyPromise;
    readyPromise = Promise.all(EMBEDDED_IMAGES.map(function (image, index) {
        if (typeof image.src !== "string" || image.src.indexOf("data:image/") !== 0) return Promise.reject(new Error("blocked non-embedded image " + index));
        if (image.complete && image.naturalWidth > 0) return Promise.resolve();
        return new Promise(function (resolve, reject) {
            image.onload = function () { image.onload = null; image.onerror = null; image.naturalWidth > 0 ? resolve() : reject(new Error("embedded image decoded with zero width: " + index)); };
            image.onerror = function () { image.onload = null; image.onerror = null; reject(new Error("embedded image failed to decode: " + index)); };
        });
    })).then(function () { return undefined; });
    return readyPromise;
}
${runtimeStateSource(spec)}
function render(targetCanvas, request) {
    if (!targetCanvas || typeof targetCanvas.getContext !== "function") throw new Error("targetCanvas must provide a 2D context");
    if (targetCanvas.width !== 800 || targetCanvas.height !== 600) throw new Error("targetCanvas must be exactly 800x600");
    for (var index = 0; index < EMBEDDED_IMAGES.length; index += 1) {
        if (!EMBEDDED_IMAGES[index].complete || EMBEDDED_IMAGES[index].naturalWidth < 1) throw new Error("call and await ready() before render()");
    }
    var state = resolveFrameState(request);
    if (!state.renderable) throw new Error("blocked unproven rendering state: " + state.blocker);
    var ctx = targetCanvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context is unavailable");
    var marker = "__helpMathFfdecAssetId";
    if (ctx[marker] === undefined) {
        enhanceContext(ctx);
        Object.defineProperty(ctx, marker, {value:"course-g04-l03-in-009",configurable:false,enumerable:false});
    } else if (ctx[marker] !== "course-g04-l03-in-009") throw new Error("canvas context belongs to another FFDec adapter");
    var previousCanvas = canvas;
    canvas = targetCanvas;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#b8d8f7";
    ctx.fillRect(0,0,800,600);
    if (state.frameDomain === "root") {
        var rootImage = ROOT_FRAME_IMAGES[state.localFrame];
        if (!rootImage) throw new Error("missing source-bound root frame " + state.localFrame);
        ctx.drawImage(rootImage,0,0,800,600);
        canvas = previousCanvas;
    } else {
        ctx.save();
        try {
            ctx.transform(1,0,0,1,-3932.7,-3694.65);
            sprite200(ctx,new cxform(0,0,0,0,255,255,255,255),state.exportFrame,0,0);
        } finally {
            ctx.restore();
            canvas = previousCanvas;
        }
    }
    if (typeof targetCanvas.setAttribute === "function") {
        targetCanvas.setAttribute("data-flash-frame",String(state.localFrame));
        targetCanvas.setAttribute("data-flash-frame-domain",state.frameDomain);
        targetCanvas.setAttribute("data-flash-root-frame",String(state.rootFrame));
        targetCanvas.setAttribute("data-runtime-scenario",state.scenario);
        targetCanvas.setAttribute("data-runtime-language",state.lang);
        targetCanvas.setAttribute("data-runtime-seed",String(state.seed));
        targetCanvas.setAttribute("data-visual-localization-status",state.visualLocalizationStatus);
        targetCanvas.setAttribute("data-audio-localization-status",state.audioLocalizationStatus);
        targetCanvas.setAttribute("data-audio-rendered","false");
    }
    return state;
}
var registry = global.HELP_MATH_CANVAS_ASSETS;
if (registry === undefined) {
    registry = Object.create(null);
    Object.defineProperty(global,"HELP_MATH_CANVAS_ASSETS",{value:registry,configurable:false,enumerable:false,writable:false});
} else if (!registry || typeof registry !== "object") throw new Error("blocked invalid canvas registry");
if (Object.prototype.hasOwnProperty.call(registry,"course-g04-l03-in-009")) throw new Error("canvas asset already registered");
registry["course-g04-l03-in-009"] = Object.freeze({metadata:METADATA,ready:ready,resolveFrameState:resolveFrameState,render:render});
})(globalThis);
`;
  const documentMembers = [...new Set([...runtime.matchAll(/document\.([A-Za-z_$][A-Za-z0-9_$]*)/g)].map((match) => match[1]))];
  assert(JSON.stringify(documentMembers) === JSON.stringify(['createElement']), `runtime: blocked document members: ${documentMembers.join(', ')}`);
  const elements = [...runtime.matchAll(/document\.createElement\("([a-z]+)"\)/g)].map((match) => match[1]);
  assert(elements.length === images.length + rootUniqueImages.length + 1 && elements[0] === 'canvas' && elements.slice(1).every((name) => name === 'img'), 'runtime: element allowlist changed');
  for (const [label, pattern] of BLOCKED_RUNTIME_PATTERNS) assert(!pattern.test(runtime), `runtime contains blocked ${label}`);
  new Script(runtime, {filename: path.basename(spec.output.script)});
  return {
    runtime,
    metadata,
    placedFunctions,
    images,
    rootImages: rootUniqueImages.map(({name, sha256: imageSha256, frames}) => ({
      name,
      sha256: imageSha256,
      frames: Object.freeze([...frames])
    }))
  };
}

async function verifiedRead(root, relativePath, expectedHash, label) {
  const absolutePath = resolveProjectPath(root, relativePath, label);
  const bytes = await readFile(absolutePath);
  const observed = sha256(bytes);
  assert(observed === expectedHash, `${label}: SHA-256 mismatch; expected ${expectedHash}, observed ${observed}`);
  return {absolutePath, bytes, text: bytes.toString('utf8'), sha256: observed};
}

async function loadRootFrameAssets(root, spec, baseline) {
  const archiveRoot = resolveProjectPath(
    root,
    spec.evidence.rootRuntimeFrameArchive,
    'root runtime frame archive'
  );
  return Promise.all(
    baseline.frames.map(async (entry) => {
      assert(/^frame-\d{4}\.png$/.test(entry.file), `root runtime baseline: unsafe frame filename ${entry.file}`);
      const absolutePath = path.resolve(archiveRoot, entry.file);
      assert(
        absolutePath.startsWith(`${archiveRoot}${path.sep}`),
        `root runtime baseline: frame ${entry.frame} escapes archive`
      );
      const bytes = await readFile(absolutePath);
      return {
        frame: entry.frame,
        file: entry.file,
        path: portable(path.relative(root, absolutePath)),
        sha256: entry.sha256,
        bytes
      };
    })
  );
}

async function parsePlacement(parserPath, swfmillPath) {
  const result = await execFile('python3', [parserPath, '--swfmill', swfmillPath, '--object-id', '200', '--placement-name', 'animation'], {maxBuffer: 1024 * 1024});
  return JSON.parse(result.stdout);
}

async function readObserved(root, relativePath, label) {
  const absolutePath = resolveProjectPath(root, relativePath, label);
  const contents = await readFile(absolutePath);
  return {
    path: portable(relativePath),
    absolutePath,
    contents,
    text: contents.toString('utf8'),
    sha256: sha256(contents)
  };
}

async function snapshotBindings(root, paths) {
  return Promise.all(paths.map(async (relativePath) =>
    binding(await readObserved(root, relativePath, `protected ${relativePath}`))
  ));
}

export function captureRootFromImplementationCaptureAdoption(root, adoption) {
  assert(
    adoption?.animationId === 'course-g04-l03-in-009' &&
      Array.isArray(adoption.requirements) &&
      adoption.requirements.length === 4,
    'implementation capture: adoption identity or requirement count changed'
  );
  const manifestPaths = adoption.requirements.map((requirement, index) => {
    const relativePath = requirement?.captureManifest?.path;
    const absolutePath = resolveProjectPath(
      root,
      relativePath,
      `implementation capture requirement ${index + 1}`
    );
    assert(
      path.basename(absolutePath) === 'capture-manifest.json',
      `implementation capture requirement ${index + 1}: capture manifest filename changed`
    );
    return absolutePath;
  });
  assert(
    new Set(manifestPaths).size === manifestPaths.length,
    'implementation capture: duplicate capture manifest path'
  );
  const captureRoots = manifestPaths.map((manifestPath) =>
    path.dirname(path.dirname(manifestPath))
  );
  assert(
    captureRoots.every((candidate) => candidate === captureRoots[0]),
    'implementation capture: capture manifests do not share one capture root'
  );
  return captureRoots[0];
}

export async function validateCurrentImplementationCaptureAdoption({
  root,
  adoption,
  runAdoptionValidator = adoptCourseImplementationCaptures
}) {
  const captureRoot = captureRootFromImplementationCaptureAdoption(
    root,
    adoption
  );
  const result = await runAdoptionValidator({
    projectRoot: root,
    id: 'course-g04-l03-in-009',
    captureRoot,
    allowPartial: false,
    invalidateCurrentJsApproval: false,
    invalidationReason: '',
    invalidatedAt: '',
    check: true,
    json: true
  });
  assert(
    result?.animationId === 'course-g04-l03-in-009' &&
      result?.mode === 'check' &&
      result?.requirementCount === 4 &&
      result?.declaredRequirementCount === 4 &&
      result?.missingRequirementCount === 0 &&
      result?.capturedFrameCount === 1294 &&
      result?.strictAcceptanceChanged === false,
    'implementation capture: shared adoption validator returned an unexpected result'
  );
  return {captureRoot, result};
}

function validateCurrentJavascriptEvidence(rendererSupportRecord, implementationCaptureRecord) {
  const rendererSupport = JSON.parse(rendererSupportRecord.text);
  assert(
    rendererSupport?.schemaVersion === 1 &&
      rendererSupport?.animationId === 'course-g04-l03-in-009' &&
      rendererSupport?.summary?.declaredFrameDomainCount === 2 &&
      rendererSupport?.summary?.fullyRenderableFrameDomainCount === 2 &&
      rendererSupport?.summary?.probeCount === 8 &&
      rendererSupport?.summary?.exactIdentityCount === 8 &&
      rendererSupport?.summary?.blockedCount === 0 &&
      rendererSupport?.summary?.renderableCount === 8 &&
      String(rendererSupport?.strictAcceptanceEffect || '').startsWith('none;'),
    'renderer frame-domain support: current-JavaScript boundary changed'
  );
  const implementationCapture = JSON.parse(implementationCaptureRecord.text);
  assert(
    implementationCapture?.schemaVersion === 1 &&
      implementationCapture?.evidenceType ===
        'current-javascript-implementation-capture-adoption' &&
      implementationCapture?.animationId === 'course-g04-l03-in-009' &&
      implementationCapture?.status ===
        'complete-non-authoritative-implementation-capture' &&
      implementationCapture?.summary?.declaredRequirementCount === 4 &&
      implementationCapture?.summary?.requirementCount === 4 &&
      implementationCapture?.summary?.capturedFrameCount === 1294 &&
      implementationCapture?.summary?.missingRequirementCount === 0 &&
      implementationCapture?.summary?.missingFrameCount === 0 &&
      implementationCapture?.summary?.validationErrors === 0 &&
      implementationCapture?.strictAcceptanceEffect === 'none' &&
      implementationCapture.requirements?.every(
        (requirement) =>
          requirement.result === 'validated-current-javascript-output-only' &&
          Number.isSafeInteger(requirement.capturedFrameCount) &&
          requirement.capturedFrameCount > 0 &&
          /^[a-f0-9]{64}$/.test(requirement.captureManifest?.sha256 || '')
      ),
    'implementation capture: current-JavaScript boundary changed'
  );
  return {rendererSupport, implementationCapture};
}

function renderCandidateMarkdown(report) {
  return `# ${report.animationId} current-JavaScript engineering candidate\n\n`
    + `This canonical report binds the existing IN009 Canvas runtime, manifest, React module, pure timeline, renderer-domain audit, and complete current-JavaScript implementation capture. It remains acceptance-neutral.\n\n`
    + `- Source SWF: \`${report.source.swf.path}\` (\`${report.source.swf.sha256}\`).\n`
    + `- Current-JavaScript domains: \`root\` frames 1–10 and \`sprite-200\` frames 1–637.\n`
    + `- Current-JavaScript implementation capture: ${report.candidateRenderability.implementationCapture.capturedFrameCount} EN/ES frames across ${report.candidateRenderability.implementationCapture.requirementCount} requirements.\n`
    + `- Canvas runtime: \`${report.outputs.canvasRuntime.path}\` (\`${report.outputs.canvasRuntime.sha256}\`).\n`
    + `- Canvas manifest: \`${report.outputs.canvasManifest.path}\` (\`${report.outputs.canvasManifest.sha256}\`).\n`
    + `- Strict acceptance effect: \`none\`.\n\n`
    + `## Unresolved obligations\n\n`
    + `${report.unresolved.map((item) => `- ${item}`).join('\n')}\n`;
}

export function validateIn009CurrentJavascriptCandidateReport(report, expected) {
  assert(
    report?.schemaVersion === 1 &&
      report?.reportType === 'current-javascript-engineering-candidate' &&
      report?.animationId === 'course-g04-l03-in-009',
    'IN009 candidate report: identity changed'
  );
  assert(
    report.disposition?.currentJavaScriptCandidate === true &&
      report.disposition?.candidateRenderabilityOnly === true &&
      report.disposition?.prototypeRegistryOnly === true &&
      Object.entries(report.disposition)
        .filter(([key]) => ![
          'currentJavaScriptCandidate',
          'candidateRenderabilityOnly',
          'prototypeRegistryOnly'
        ].includes(key))
        .every(([, value]) => value === false),
    'IN009 candidate report: disposition was promoted'
  );
  assert(
    Object.keys(report.authorization || {}).sort().join(',') ===
      [...AUTHORIZATION_KEYS].sort().join(',') &&
      AUTHORIZATION_KEYS.every((key) => report.authorization[key] === false),
    'IN009 candidate report: authorization was promoted or reshaped'
  );
  assert(
    Object.keys(report.acceptance || {}).sort().join(',') ===
      [...ACCEPTANCE_KEYS].sort().join(',') &&
      ACCEPTANCE_KEYS.every((key) => report.acceptance[key] === false) &&
      report.strictAcceptanceEffect === 'none',
    'IN009 candidate report: acceptance was promoted or reshaped'
  );
  assert(
    report.timeline?.stage?.width === 800 &&
      report.timeline?.stage?.height === 600 &&
      report.timeline?.fps === 12 &&
      report.timeline?.root?.frameDomain === 'root' &&
      report.timeline?.root?.frameCount === 10 &&
      report.timeline?.main?.frameDomain === 'sprite-200' &&
      report.timeline?.main?.frameCount === 637 &&
      report.timeline?.root?.authority === 'current-javascript-only' &&
      report.timeline?.main?.authority === 'current-javascript-only',
    'IN009 candidate report: timeline boundary changed'
  );
  assert(
    report.candidateRenderability?.classification ===
      'complete-current-javascript-implementation-capture-not-fidelity' &&
      report.candidateRenderability?.rendererSupport?.declaredFrameDomainCount === 2 &&
      report.candidateRenderability?.rendererSupport?.fullyRenderableFrameDomainCount === 2 &&
      report.candidateRenderability?.rendererSupport?.probeCount === 8 &&
      report.candidateRenderability?.rendererSupport?.blockedCount === 0 &&
      report.candidateRenderability?.implementationCapture?.requirementCount === 4 &&
      report.candidateRenderability?.implementationCapture?.capturedFrameCount === 1294 &&
      report.candidateRenderability?.implementationCapture?.missingFrameCount === 0 &&
      report.candidateRenderability?.originalRuntimeAuthorityEffect === false &&
      report.candidateRenderability?.rmseAcceptanceEffect === false &&
      report.candidateRenderability?.audioAcceptanceEffect === false,
    'IN009 candidate report: renderability exceeded or lost its boundary'
  );
  assert(
    report.writeScope?.allowedOutputs?.length === 4 &&
      report.writeScope?.protectedFilesUnchanged === true &&
      report.writeScope?.sourceAssetsWritten === false &&
      report.writeScope?.migrationFilesWritten === false &&
      report.writeScope?.completionLedgerWritten === false &&
      report.writeScope?.lessonReleaseLedgerWritten === false &&
      report.writeScope?.reviewOrOwnerFilesWritten === false,
    'IN009 candidate report: write boundary changed'
  );
  if (expected) {
    exactBinding(report.generatedBy, expected.generator, 'IN009 candidate report generator');
    exactBinding(report.source.swf, expected.sourceSwf, 'IN009 candidate report source SWF');
    exactBinding(
      report.source.associatedAudio,
      expected.associatedAudio,
      'IN009 candidate report associated audio'
    );
    exactBinding(
      report.evidence.canvasCandidateSpec,
      expected.canvasCandidateSpec,
      'IN009 candidate report spec'
    );
    exactBinding(
      report.evidence.rendererFrameDomainSupport,
      expected.rendererFrameDomainSupport,
      'IN009 candidate report renderer support'
    );
    exactBinding(
      report.evidence.currentJavascriptImplementationCapture,
      expected.currentJavascriptImplementationCapture,
      'IN009 candidate report implementation capture'
    );
    assert(
      JSON.stringify(report.integrationBindings) ===
        JSON.stringify(expected.integrationBindings),
      'IN009 candidate report: integration binding changed'
    );
    exactBinding(
      report.outputs.canvasRuntime,
      expected.canvasRuntime,
      'IN009 candidate report Canvas runtime'
    );
    exactBinding(
      report.outputs.canvasManifest,
      expected.canvasManifest,
      'IN009 candidate report Canvas manifest'
    );
  }
  assert(
    report.reportFingerprintSha256 ===
      currentJavascriptCandidateReportFingerprint(report),
    'IN009 candidate report: fingerprint is stale'
  );
  return report;
}

export async function generateIn009CanvasCandidate({root = ROOT, specPath = path.resolve(root, DEFAULT_SPEC), check = false} = {}) {
  const specBytes = await readFile(specPath);
  const spec = validateSpec(JSON.parse(specBytes));
  const protectedBefore = await snapshotBindings(root, PROTECTED_PATHS);
  const [source, inventory, audio, swfmill, parser, controlledProbe, controlledStage, rootBaselineFile, ownerContractFile, helper, frames] = await Promise.all([
    verifiedRead(root, spec.source.swf, spec.source.swfSha256, 'source SWF'),
    verifiedRead(root, spec.evidence.scenarioInventory, spec.evidence.scenarioInventorySha256, 'scenario inventory'),
    verifiedRead(root, spec.evidence.audioAudit, spec.evidence.audioAuditSha256, 'audio audit'),
    verifiedRead(root, spec.evidence.swfmillXml, spec.evidence.swfmillXmlSha256, 'swfmill XML'),
    verifiedRead(root, spec.evidence.placementParser, spec.evidence.placementParserSha256, 'placement parser'),
    verifiedRead(root, spec.evidence.controlledFrame637Probe, spec.evidence.controlledFrame637ProbeSha256, 'controlled frame 637 probe'),
    verifiedRead(root, spec.evidence.controlledFrame637Stage, spec.evidence.controlledFrame637StageSha256, 'controlled frame 637 stage'),
    verifiedRead(root, spec.evidence.rootRuntimeBaseline, spec.evidence.rootRuntimeBaselineSha256, 'root runtime baseline'),
    verifiedRead(
      root,
      spec.evidence.ownerHostLocalizationContract,
      spec.evidence.ownerHostLocalizationContractSha256,
      'owner host/localization contract'
    ),
    verifiedRead(root, spec.ffdecExport.helper, spec.ffdecExport.helperSha256, 'FFDec helper'),
    verifiedRead(root, spec.ffdecExport.framesHtml, spec.ffdecExport.framesHtmlSha256, 'FFDec frames export')
  ]);
  const [
    associatedAudio,
    generatorRecord,
    integrationRecords,
    rendererSupportRecord,
    implementationCaptureRecord
  ] = await Promise.all([
    verifiedRead(
      root,
      spec.audioInventory.externalSpanish.path,
      spec.audioInventory.externalSpanish.sha256,
      'associated Spanish audio'
    ),
    readObserved(root, GENERATOR_PATH, 'candidate generator'),
    Promise.all(
      INTEGRATION_PATHS.map((relativePath) =>
        readObserved(root, relativePath, `integration ${relativePath}`)
      )
    ),
    readObserved(
      root,
      CURRENT_JAVASCRIPT_EVIDENCE_PATHS.rendererFrameDomainSupport,
      'renderer frame-domain support'
    ),
    readObserved(
      root,
      CURRENT_JAVASCRIPT_EVIDENCE_PATHS.implementationCapture,
      'current-JavaScript implementation capture'
    )
  ]);
  const {rendererSupport, implementationCapture} =
    validateCurrentJavascriptEvidence(
      rendererSupportRecord,
      implementationCaptureRecord
    );
  await validateCurrentImplementationCaptureAdoption({
    root,
    adoption: implementationCapture
  });
  const registry = JSON.parse(integrationRecords[0].text);
  const registryEntry = registry.entries?.find(
    (entry) => entry.key === spec.animationId
  );
  assert(
    registryEntry?.module === './modules/course-g04-l03-in-009' &&
      registryEntry?.maturity === 'legacy-prototype',
    'prototype registry: IN009 entry changed'
  );
  const rootBaseline = JSON.parse(rootBaselineFile.text);
  const ownerContract = validateOwnerHostLocalizationContract(
    spec,
    JSON.parse(ownerContractFile.text)
  );
  const migrationRoot = `migrations/${spec.animationId}`;
  const [sameLessonHost, childActionScript] = await Promise.all([
    verifiedRead(
      root,
      ownerContract.sources.sameLessonHost.path,
      ownerContract.sources.sameLessonHost.sha256,
      'same-lesson host SWF'
    ),
    verifiedRead(
      root,
      path.posix.join(
        migrationRoot,
        ownerContract.extractionBindings.childActionScript.evidenceFile
      ),
      ownerContract.extractionBindings.childActionScript.evidenceFileSha256,
      'child ActionScript export'
    )
  ]);
  const rootFrameAssets = await loadRootFrameAssets(root, spec, rootBaseline);
  const placement = await parsePlacement(parser.absolutePath, swfmill.absolutePath);
  validateCandidateEvidence(spec, JSON.parse(inventory.text), JSON.parse(audio.text), placement);
  validateControlledFrame637Probe(spec, JSON.parse(controlledProbe.text));
  const built = buildSafeRuntime({
    helperSource: helper.text,
    framesHtml: frames.text,
    spec,
    rootBaseline,
    rootFrameAssets
  });
  const runtimeBytes = Buffer.from(built.runtime);
  const outputScript = resolveProjectPath(root, spec.output.script, 'output script');
  const outputManifest = resolveProjectPath(root, spec.output.manifest, 'output manifest');
  const sourceRoot = path.resolve(root, 'source-assets');
  assert(!outputScript.startsWith(`${sourceRoot}${path.sep}`) && !outputManifest.startsWith(`${sourceRoot}${path.sep}`), 'outputs may not be under source-assets');
  const manifest = {
    schemaVersion: 1,
    animationId: spec.animationId,
    classification: spec.classification,
    authority: 'Hash-bound deterministic Canvas adapter generated from static FFDec/swfmill evidence for sprite-200, source-hash-bound Adobe standalone runtime frames for the root domain, and the static owner host/localization contract that proves one shared untranslated child visual. This is not natural-runtime, translated-Spanish visual, audio, bilingual parity, strict, human, or owner acceptance.',
    generator: 'scripts/build-in-009-ffdec-canvas-candidate.mjs',
    inputs: {
      spec: {path: portable(path.relative(root, specPath)), sha256: sha256(specBytes)},
      sourceSwf: {path: spec.source.swf, sha256: source.sha256},
      scenarioInventory: {path: spec.evidence.scenarioInventory, sha256: inventory.sha256},
      audioAudit: {path: spec.evidence.audioAudit, sha256: audio.sha256},
      swfmillXml: {path: spec.evidence.swfmillXml, sha256: swfmill.sha256},
      placementParser: {path: spec.evidence.placementParser, sha256: parser.sha256},
      controlledFrame637Probe: {path: spec.evidence.controlledFrame637Probe, sha256: controlledProbe.sha256},
      controlledFrame637Stage: {path: spec.evidence.controlledFrame637Stage, sha256: controlledStage.sha256},
      rootRuntimeBaseline: {
        path: spec.evidence.rootRuntimeBaseline,
        sha256: rootBaselineFile.sha256,
        status: rootBaseline.status
      },
      ownerHostLocalizationContract: {
        path: spec.evidence.ownerHostLocalizationContract,
        sha256: ownerContractFile.sha256,
        visualLocalizationStatus:
          ownerContract.sourceConclusions.childVisualLocalization.status,
        strictAcceptanceEffect:
          ownerContract.strictDisposition.strictAcceptanceEffect
      },
      sameLessonHost: {
        path: ownerContract.sources.sameLessonHost.path,
        sha256: sameLessonHost.sha256
      },
      childActionScriptExport: {
        path: portable(path.relative(root, childActionScript.absolutePath)),
        sha256: childActionScript.sha256,
        exhaustiveExportFileCount:
          ownerContract.extractionBindings.childActionScript.exhaustiveExportFileCount
      },
      rootRuntimeFrames: rootFrameAssets.map((asset) => ({
        frame: asset.frame,
        path: asset.path,
        sha256: asset.sha256,
        bytes: asset.bytes.length
      })),
      ffdecHelper: {path: spec.ffdecExport.helper, sha256: helper.sha256},
      ffdecFramesHtml: {path: spec.ffdecExport.framesHtml, sha256: frames.sha256}
    },
    output: {script: spec.output.script, sha256: sha256(runtimeBytes), bytes: runtimeBytes.length, globalRegistry: spec.output.globalRegistry},
    safety: {
      noLegacyActionScriptExecuted: true,
      noDynamicEvaluation: true,
      noNetworkPrimitives: true,
      noTimersOrAmbientTicker: true,
      noPersistentStorage: true,
      noAmbientDomListeners: true,
      sourceCorrectVectorMaskAlphaSemantics: true,
      maskRenderBlockCount: spec.ffdecExport.maskRenderBlockCount,
      embeddedImages: built.images,
      embeddedRootRuntimeImages: built.rootImages,
      drawingObjectAllowlist: built.placedFunctions
    },
    placement,
    timeline: built.metadata,
    failClosed: {
      spanishAudio: 'omitted: exact owner MP3 and host routing are known, but listening, cue timing, pause/resume, Replay, and synchronization remain unaccepted',
      glossaryTemperature: 'blocked: DoHyperLinks, animation_mc, host state, and exact hit geometry unresolved',
      glossaryMeasure: 'blocked: DoHyperLinks, animation_mc, host state, and exact hit geometry unresolved',
      rootNaturalPlayback: 'blocked: direct frame-accurate root rendering does not claim the unresolved InternalPreloader schedule',
      audio: 'omitted: one embedded stream and one external Spanish track remain listed but unaccepted'
    },
    unresolved: [
      'The 10-frame English root-standalone domain is directly addressable from the source-hash-bound Adobe standalone baseline; the InternalPreloader natural schedule remains unresolved and is not claimed.',
      'English and Spanish route requests render the same source child pixels under the source-shared-untranslated-visual contract; this is not a translated Spanish visual or a bilingual parity claim. Temperature/Measure glossary behavior still fails closed.',
      'The embedded SoundStream and host-triggered Spanish MP3 are not rendered; cue timing, spoken content, and host behavior remain unaccepted.',
      'No authoritative nested natural trace, implementation-vs-baseline RMSE acceptance, interaction traversal, human review, or owner acceptance is represented.'
    ],
    strictAcceptanceEffect: 'none'
  };
  const manifestText = stableJson(manifest);
  const manifestBytes = Buffer.from(manifestText);
  const integrationBindings = integrationRecords.map(binding);
  const expectedReportBindings = {
    generator: binding(generatorRecord),
    sourceSwf: {
      path: spec.source.swf,
      bytes: source.bytes.length,
      sha256: source.sha256
    },
    associatedAudio: {
      path: spec.audioInventory.externalSpanish.path,
      bytes: associatedAudio.bytes.length,
      sha256: associatedAudio.sha256
    },
    canvasCandidateSpec: {
      path: portable(path.relative(root, specPath)),
      bytes: specBytes.length,
      sha256: sha256(specBytes)
    },
    rendererFrameDomainSupport: binding(rendererSupportRecord),
    currentJavascriptImplementationCapture: binding(
      implementationCaptureRecord
    ),
    integrationBindings,
    canvasRuntime: {
      path: spec.output.script,
      bytes: runtimeBytes.length,
      sha256: sha256(runtimeBytes)
    },
    canvasManifest: {
      path: spec.output.manifest,
      bytes: manifestBytes.length,
      sha256: sha256(manifestBytes)
    }
  };
  const report = {
    schemaVersion: 1,
    reportType: 'current-javascript-engineering-candidate',
    animationId: spec.animationId,
    generatedBy: {
      ...expectedReportBindings.generator,
      command: 'node scripts/build-in-009-ffdec-canvas-candidate.mjs'
    },
    batch: {
      lesson: 'G4 L3',
      batchId: 'batch-001',
      batchOrdinal: 20
    },
    classification: {
      section: 'IN',
      page: 9,
      globalPageOrdinal: 20,
      titleRaw: 'Situations with Negative Numbers: Temperature',
      titleDisplay: 'Situations with Negative Numbers: Temperature',
      domain: 'negative-numbers-temperature'
    },
    disposition: {
      currentJavaScriptCandidate: true,
      candidateRenderabilityOnly: true,
      prototypeRegistryOnly: true,
      strictLedgerChanged: false,
      approvalOrPinChanged: false,
      productRouteAddedByGenerator: false,
      publicLibraryAdmitted: false,
      productionAdmission: false,
      strictMigrationComplete: false
    },
    source: {
      swf: expectedReportBindings.sourceSwf,
      fla: null,
      associatedAudio: {
        ...expectedReportBindings.associatedAudio,
        normalizedLanguageCandidate: 'es',
        spokenLanguageEstablished: false,
        cueMappingEstablished: false,
        synchronizationVerified: false,
        listeningAccepted: false,
        rendered: false
      }
    },
    evidence: {
      canvasCandidateSpec: expectedReportBindings.canvasCandidateSpec,
      rendererFrameDomainSupport: {
        ...expectedReportBindings.rendererFrameDomainSupport,
        summary: rendererSupport.summary,
        authority: 'current-javascript-addressability-only'
      },
      currentJavascriptImplementationCapture: {
        ...expectedReportBindings.currentJavascriptImplementationCapture,
        status: implementationCapture.status,
        summary: implementationCapture.summary,
        authority: 'current-javascript-output-only'
      }
    },
    integrationBindings,
    timeline: {
      stage: spec.timeline.stage,
      fps: spec.timeline.fps,
      root: {
        frameDomain: 'root',
        frameCount: spec.timeline.root.frameCount,
        scenario: 'root-standalone',
        renderableInCurrentJavascript: true,
        authority: 'current-javascript-only'
      },
      main: {
        frameDomain: spec.timeline.local.timelineId,
        frameCount: spec.timeline.local.frameCount,
        scenario: 'default',
        publicFrameIndexing: 'one-indexed',
        playbackMode: spec.timeline.local.playbackMode,
        renderableInCurrentJavascript: true,
        authority: 'current-javascript-only'
      }
    },
    candidateRenderability: {
      classification:
        'complete-current-javascript-implementation-capture-not-fidelity',
      rendererSupport: rendererSupport.summary,
      implementationCapture: implementationCapture.summary,
      originalRuntimeAuthorityEffect: false,
      naturalRuntimeReachabilityEffect: false,
      rmseAcceptanceEffect: false,
      audioAcceptanceEffect: false,
      humanReviewEffect: false,
      ownerAcceptanceEffect: false
    },
    outputs: {
      canvasRuntime: expectedReportBindings.canvasRuntime,
      canvasManifest: expectedReportBindings.canvasManifest,
      prototypeModule:
        'packages/demos/src/modules/course-g04-l03-in-009.tsx',
      pureTimeline:
        'packages/demos/src/timelines/course-g04-l03-in-009.ts',
      test:
        'packages/demos/tests/course-g04-l03-in-009.test.ts'
    },
    writeScope: {
      allowedOutputs: [
        spec.output.script,
        spec.output.manifest,
        OUTPUT_REPORT_JSON,
        OUTPUT_REPORT_MARKDOWN
      ],
      protectedFilesUnchanged: true,
      sourceAssetsWritten: false,
      migrationFilesWritten: false,
      completionLedgerWritten: false,
      lessonReleaseLedgerWritten: false,
      reviewOrOwnerFilesWritten: false
    },
    authorization: falseBoundary(AUTHORIZATION_KEYS),
    acceptance: falseBoundary(ACCEPTANCE_KEYS),
    strictAcceptanceEffect: 'none',
    unresolved: manifest.unresolved
  };
  report.reportFingerprintSha256 =
    currentJavascriptCandidateReportFingerprint(report);
  validateIn009CurrentJavascriptCandidateReport(
    report,
    expectedReportBindings
  );
  const reportJsonBytes = Buffer.from(stableJson(report));
  const reportMarkdownBytes = Buffer.from(renderCandidateMarkdown(report));
  const outputReportJson = resolveProjectPath(
    root,
    OUTPUT_REPORT_JSON,
    'candidate report JSON'
  );
  const outputReportMarkdown = resolveProjectPath(
    root,
    OUTPUT_REPORT_MARKDOWN,
    'candidate report Markdown'
  );
  for (const output of [
    outputScript,
    outputManifest,
    outputReportJson,
    outputReportMarkdown
  ]) {
    assert(
      !output.startsWith(`${sourceRoot}${path.sep}`),
      'outputs may not be under source-assets'
    );
  }
  if (check) {
    const [actualScript, actualManifest, actualReportJson, actualReportMarkdown] =
      await Promise.all([
        readFile(outputScript),
        readFile(outputManifest),
        readFile(outputReportJson),
        readFile(outputReportMarkdown)
      ]);
    assert(actualScript.equals(runtimeBytes), 'generated Canvas runtime is stale');
    assert(actualManifest.equals(manifestBytes), 'generated Canvas manifest is stale');
    assert(
      actualReportJson.equals(reportJsonBytes),
      'generated current-JavaScript candidate report is stale'
    );
    assert(
      actualReportMarkdown.equals(reportMarkdownBytes),
      'generated current-JavaScript candidate Markdown is stale'
    );
  } else {
    await Promise.all([
      mkdir(path.dirname(outputScript), {recursive: true}),
      mkdir(path.dirname(outputReportJson), {recursive: true})
    ]);
    await Promise.all([
      writeFile(outputScript, runtimeBytes),
      writeFile(outputManifest, manifestBytes),
      writeFile(outputReportJson, reportJsonBytes),
      writeFile(outputReportMarkdown, reportMarkdownBytes)
    ]);
  }
  const [protectedAfter, emittedReport] = await Promise.all([
    snapshotBindings(root, PROTECTED_PATHS),
    readObserved(root, OUTPUT_REPORT_JSON, 'emitted candidate report')
  ]);
  assert(
    JSON.stringify(protectedAfter) === JSON.stringify(protectedBefore),
    'candidate generation changed a protected strict, release, migration, or review file'
  );
  assert(
    emittedReport.contents.equals(reportJsonBytes),
    'emitted candidate report differs from the generated bytes'
  );
  return {
    animationId: spec.animationId,
    check,
    outputScript: portable(path.relative(root, outputScript)),
    outputManifest: portable(path.relative(root, outputManifest)),
    outputSha256: manifest.output.sha256,
    bytes: runtimeBytes.length,
    rootFrames: 10,
    localFrames: 637,
    candidateReport: {
      path: OUTPUT_REPORT_JSON,
      bytes: reportJsonBytes.length,
      sha256: sha256(reportJsonBytes),
      fingerprintSha256: report.reportFingerprintSha256
    },
    report,
    validationContext: expectedReportBindings,
    strictAcceptanceEffect: 'none'
  };
}

async function main() {
  console.log(JSON.stringify(await generateIn009CanvasCandidate(parseArguments(process.argv.slice(2))), null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
