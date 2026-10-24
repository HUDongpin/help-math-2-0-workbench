/** Source-family semantics for the first ALG L12 glossary-pause admission.
 * The common reader checks bytes and the independent host/registry transaction.
 * This validator checks what the frozen P013 packet means. P015 needs its own
 * source-behavior decision before it can use this family contract. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export const PAIR_ADMISSION_ID = 'shared-alg001-l12-p013';
export const PAIR_ADMISSION_CALIBRATION = 'g678-alg-l12-p013-current-js-v2';
export const PAIR_SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const PAIR_KEYTERM_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI';
export const PAIR_OUTPUT = 'output/alg-l12-next-glossary-20260927';
const SHA = /^[a-f0-9]{64}$/;
const pin = (path, bytes, sha256) => ({path, bytes, sha256});
export const PAIR_SOURCE = Object.freeze(pin('G6-G8-shared/ALG001/L12/VB/L12VB08.swf', 145346,
  '056fb04850a10cd8888112e4c4fe5730bf475e559f0904b7841545c099536424'));
export const PAIR_XML = Object.freeze(pin('G6-G8-shared/ALG001/L12/index.xml', 11927,
  '0755afb5645d3179fb1105641b0d1f1b06d8c803c02484bfbdc703ba5bb6f325'));
export const PAIR_KEYTERMS = Object.freeze([
  Object.freeze(pin('L1KTE01.xml', 345838, '14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b')),
  Object.freeze(pin('L1KTS01.xml', 344456, '3b437b42e75536fa8b4f110325e366c27fbe10a871439d4797650cda4238b407')),
]);
export const PAIR_NATIVE_RUNTIME = Object.freeze(pin(`${PAIR_OUTPUT}/native-candidates/p013/canvas-renderer.js`, 2463783,
  'ba2d1cd3b9913bb15e0be97a7ee69f1e79fb0258d9fcac105f45c605fcf3f441'));
export const PAIR_RUNTIME = Object.freeze(pin(`work/g678-shared-page-factory/alg-l12-glossary-pair-20260927-v2/members/${PAIR_ADMISSION_ID}/canvas-renderer.js`, 2463783,
  'ba2d1cd3b9913bb15e0be97a7ee69f1e79fb0258d9fcac105f45c605fcf3f441'));
export const PAIR_MAIN_AUDIO = Object.freeze(pin(`${PAIR_OUTPUT}/audio/p013-main-sprite-63.mp3`, 150410,
  'de89db3cb7d52ffad3ee3284746e923aa2a86e0f58178f7822105d02a77fe525'));
export const PAIR_SPANISH_AUDIO = Object.freeze(pin('G6-G8-shared/ALG001/L12/SA/L12VB08.mp3', 248640,
  '6a9c37d04b72b96753afba7e1f4f2583dafe9a35727faf9f350f034e1e093f76'));
export const PAIR_ACCEPTANCE_KEYS = Object.freeze([
  'authoritativeOriginalRuntime', 'fidelityAccepted', 'audioAccepted',
  'humanVisualAccepted', 'ownerAccepted', 'strictComplete', 'published',
]);
const CONTROL_IDENTITY = Object.freeze([
  ['sprite-63/depth-4/generation-1', 'x-axis', 6, 2, 'X-axis', '6c0c234caa2264495fff71baf1e562fa8ab139e5a5e83ff355f68a57eb6b59df'],
  ['sprite-63/depth-6/generation-1', 'coordinate-plane', 7, 2, 'Coordinate plane', 'a7d4b186490ac9fbd59ea52c2553df4fcd775da6ca8e3829fd0ce56cb650f1f2'],
  ['sprite-63/depth-8/generation-1', 'y-axis', 8, 2, 'Y-axis', '805135056af5e555d646976baa324714f81dad37d028ad0ebb085eb54b702a77'],
  ['sprite-63/depth-14/generation-1', 'quadrant', 31, 72, 'Quadrant', '7a89db85ae8d0a253d6745e48a28728fdf752472a6e16bd0fe16e741d1afec71'],
]);
const RESOURCE_NAMES = Object.freeze(['typography.js', 'main.mp3', 'spanish-audio.mp3']);
const fail = message => `G678_PAIR_ADMISSION: ${message}`;
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
function same(actual, expected, message) { assert.deepStrictEqual(actual, expected, fail(message)); }
function demand(value, message) { assert(value, fail(message)); }
function validPin(value, expectedPath) {
  demand(value && Object.keys(value).sort().join(',') === 'bytes,path,sha256' &&
    value.path === expectedPath && Number.isSafeInteger(value.bytes) && value.bytes > 0 &&
    value.bytes <= 64 * 1024 * 1024 && SHA.test(value.sha256), `bounded pin ${expectedPath}`);
}
const stripResource = value => ({path: value.path, bytes: value.bytes, sha256: value.sha256});

/** Project the P013 row only. The pair inventory also contains P015, whose
 * unresolved global-S read must not become a dependency of P013's page proof. */
export function projectPairSource(sourceInputs, hostResources) {
  demand(sourceInputs?.schemaVersion === 1 && sourceInputs.kind === 'g678-glossary-pair-source-inputs-v1' &&
    sourceInputs.registered === false && sourceInputs.scaleOutAuthorized === false, 'source inventory scope');
  demand(hostResources?.schemaVersion === 1 && hostResources.kind === 'alg-l12-glossary-pair-host-resources-v1' &&
    hostResources.registered === false, 'host resource inventory scope');
  const page = sourceInputs.pages?.find(item => item.animationId === PAIR_ADMISSION_ID);
  const resourcePage = hostResources.pages?.find(item => item.animationId === PAIR_ADMISSION_ID);
  demand(page && sourceInputs.pages.filter(item => item.animationId === PAIR_ADMISSION_ID).length === 1 &&
    resourcePage && hostResources.pages.filter(item => item.animationId === PAIR_ADMISSION_ID).length === 1,
  'one P013 source and resource row');
  validateSourceFacts(page);
  same(sourceInputs.sharedInputs, [
    {...PAIR_XML, path: `${PAIR_SOURCE_ROOT}/${PAIR_XML.path}`},
    {...PAIR_KEYTERMS[0], path: `${PAIR_KEYTERM_ROOT}/${PAIR_KEYTERMS[0].path}`},
    {...PAIR_KEYTERMS[1], path: `${PAIR_KEYTERM_ROOT}/${PAIR_KEYTERMS[1].path}`},
  ], 'source XML and bilingual key-term custody');
  same(resourcePage.source, page.source, 'resource source binding');
  same([resourcePage.frameDomain, resourcePage.frameCount], ['sprite-63', 372], 'resource frame domain');
  same(Object.keys(resourcePage.resources).sort(), [...RESOURCE_NAMES].sort(), 'three exact resources');
  same(stripResource(resourcePage.resources['typography.js']), PAIR_NATIVE_RUNTIME, 'native runtime identity');
  same(stripResource(resourcePage.resources['main.mp3']), PAIR_MAIN_AUDIO, 'embedded stream identity');
  same(stripResource(resourcePage.resources['spanish-audio.mp3']),
    {...PAIR_SPANISH_AUDIO, path: `${PAIR_SOURCE_ROOT}/${PAIR_SPANISH_AUDIO.path}`}, 'Spanish sidecar identity');
  for (const name of RESOURCE_NAMES) same(resourcePage.resources[name].contentType,
    name === 'typography.js' ? 'text/javascript; charset=utf-8' : 'audio/mpeg', `${name} content type`);
  return {page, resources: resourcePage.resources};
}

function validateSourceFacts(page) {
  same(page.source, {...PAIR_SOURCE, path: `${PAIR_SOURCE_ROOT}/${PAIR_SOURCE.path}`}, 'source SWF');
  same([page.animationId, page.rootFrame, page.rootFrameCount, page.frameDomain, page.frameCount, page.fps],
    [PAIR_ADMISSION_ID, 6, 10, 'sprite-63', 372, 12], 'P013 root and nested domain');
  same(page.sourceCatalogSha256, '237d81fa0e73c72ab6fb23f3c298f48b11d2d2b45d8bec695308dc33a8af037e',
    'source text catalog');
  same(page.additionalGlobalReadParity, 'not-applicable', 'P013 has no P015 global-S claim');
  same(page.registrationEffect, 'none', 'source inventory has no registration effect');
  demand(Array.isArray(page.controls) && page.controls.length === 4, 'four P013 source buttons');
  page.controls.forEach((control, i) => {
    const [id, entryId, characterId, firstFrame, sourceKey, tagHash] = CONTROL_IDENTITY[i];
    same([control.id, control.entryId, control.characterId, control.firstFrame,
      control.lastFrameExclusive, control.action, control.sourceTagSha256],
    [id, entryId, characterId, firstFrame, 373,
      {operation: 'open-glossary', sourceKeyAttribute: sourceKey,
        sourceStop: 'animation_mc.animation', additionalSourceReads: [], additionalReadPosition: null}, tagHash],
    `source button ${entryId}`);
  });
  same(page.glossary?.map(term => [term.id, term.sourceKeyAttribute]),
    [['coordinate-plane','Coordinate plane'],['quadrant','Quadrant'],['x-axis','X-axis'],['y-axis','Y-axis']],
  'four bilingual glossary entries');
  same(digest(page.glossary), 'd46c7eb5aa40d78d87a721f25d618c9031e01ff80a0606e37972950b3307039a',
    'exact bilingual source dictionary projection');
  for (const term of page.glossary) {
    demand(['en','es'].every(locale => typeof term.labels?.[locale] === 'string' &&
      term.labels[locale].length > 0 && typeof term.definitions?.[locale] === 'string' &&
      term.definitions[locale].length > 0 && SHA.test(term.sourceEntrySha256?.[locale]) &&
      term.sourceEntrySha256[locale] === term.extractionLfNormalizedEntrySha256?.[locale]),
    `bilingual source entry ${term.id}`);
    same([term.source.en.sha256, term.source.es.sha256],
      [PAIR_KEYTERMS[0].sha256, PAIR_KEYTERMS[1].sha256], `key-term custody ${term.id}`);
  }
  demand(Array.isArray(page.sourcePins) && page.sourcePins.length === 9, 'source extraction closure');
  same(page.sourcePins[0], page.source, 'canonical SWF is in extraction closure');
  same(digest(page.sourcePins), '84f3ea4764218dd4891a746f7fafa56540fa042f2089b0f1ab175730da1501b7',
    'exact extracted source hashes');
  same(page.sourcePins.slice(1).map(item => item.path), [
    `${PAIR_OUTPUT}/p013/L12VB08.swf`,
    `${PAIR_OUTPUT}/p013/movie.xml`,
    `${PAIR_OUTPUT}/p013/scripts/scripts/frame_1/DoAction.as`,
    `${PAIR_OUTPUT}/p013/scripts/scripts/frame_6/DoAction.as`,
    ...[6,7,8,31].map(id => `${PAIR_OUTPUT}/p013/scripts/scripts/DefineButton2_${id}/BUTTONCONDACTION on(release).as`),
  ], 'exact P013 extracted source paths');
  for (const item of page.sourcePins.slice(1)) {
    demand(item.path.startsWith(`${PAIR_OUTPUT}/p013/`) && Number.isSafeInteger(item.bytes) &&
      item.bytes > 0 && SHA.test(item.sha256), 'P013-only extracted source pin');
  }
  demand(Array.isArray(page.unresolvedSourceRisks) && page.unresolvedSourceRisks.length >= 3,
    'source risks retained');
  same(digest(page.unresolvedSourceRisks), '2c9cd03d4e317e66783463c267a64e98d51e6f090c3d7df84f06c4fe94663bbf',
    'exact unresolved source risks');
}

/** Used unchanged by the producer and the server admission extender. */
export function validateGlossaryPairAdmissionSemantics(packet, registration) {
  demand(packet?.schemaVersion === 1 && packet.calibrationId === PAIR_ADMISSION_CALIBRATION &&
    packet.sourceRoot === PAIR_SOURCE_ROOT && packet.scope === 'private-engineering' &&
    packet.deploymentScope === 'local-only', 'frozen page identity and local scope');
  same(packet.source, PAIR_SOURCE, 'frozen source');
  same(packet.sourceXml, PAIR_XML, 'frozen lesson XML');
  same(packet.optionalSpanishAudio, {source: PAIR_SPANISH_AUDIO,
    automaticLocalePlayback: false, spokenLanguageVerified: false, listeningAccepted: false},
  'sidecar custody is not language or listening acceptance');
  validateSourceFacts(packet.sourceFacts);
  demand(packet.selectedPages?.length === 1, 'one selected page');
  const page = packet.selectedPages[0];
  same([page.animationId, page.placementId, page.assetId, page.stableLessonKey,
    page.sourceSha256, page.moduleCode, page.lessonNumber, page.globalPageOrdinal,
    page.sectionCode, page.sectionPageOrdinal, page.complexityLane],
  [PAIR_ADMISSION_ID, PAIR_ADMISSION_ID, `swf-${PAIR_SOURCE.sha256}`, 'shared-alg001-l12',
    PAIR_SOURCE.sha256, 'ALG001', 12, 13, 'VB', 7, 'interactive-understood'],
  'thirteenth active VB7 placement');
  same(page.runtime, {stage: {width: 800, height: 600}, rootFrameCount: 10,
    rootBeginFrame: 6, frameDomain: 'sprite-63', frameCount: 372,
    livePlaybackEndFrame: 372, fps: 12, language: 'fixed-en',
    scenario: 'source-static-frame', seed: '0', renderScale: 2,
    canvas: {width: 1600, height: 1200},
    canvasRenderer: {...PAIR_RUNTIME,
      url: `/flash-assets/g678-local/${PAIR_ADMISSION_ID}/typography.js?sha256=${PAIR_NATIVE_RUNTIME.sha256}`}},
  'native text, source frame and modern terminal policy');
  same(page.runtimeEvidenceBoundary, {runtimeKind: 'source-structure-bound-modern-current-js-candidate',
    actionScriptExecution: 'not-executed', naturalTraceValidation: 'not-established',
    audioAcceptance: 'not-established', replaySemantics: 'modern-full-frame-terminal-hold-original-runtime-parity-not-established',
    productBehavior: 'maintained-glossary-pause-adapter-implemented', productVisualBehaviorComposite: 'not-established'},
  'qualified runtime evidence boundary');
  const entry = packet.entry, artifacts = entry?.artifacts;
  demand(entry?.key === PAIR_ADMISSION_ID && entry.module === `./modules/${PAIR_ADMISSION_ID}` &&
    entry.maturity === 'private-current-js' && entry.complexityLane === 'interactive-understood' &&
    artifacts && Object.keys(artifacts).sort().join(',') === 'module,runtime,timeline', 'canonical module artifacts');
  validPin(artifacts.module, `packages/demos/src/modules/${PAIR_ADMISSION_ID}.tsx`);
  validPin(artifacts.timeline, `packages/demos/src/timelines/${PAIR_ADMISSION_ID}.ts`);
  same(artifacts.runtime, PAIR_RUNTIME, 'registered native Canvas runtime');
  same(packet.visual.runtime, PAIR_RUNTIME, 'registered runtime');
  same(packet.visual.nativeRuntime, PAIR_NATIVE_RUNTIME, 'served native runtime');
  validPin(packet.visual.metadata, `${PAIR_OUTPUT}/native-candidates/p013/runtime-meta.json`);
  same(packet.visual.sourceCanvasSha256, '560b7fc82bacc85dfc5f853bd15deebb9bb028611fcd6dd989e896f89e630221',
    'native source Canvas lineage');
  same(packet.audio.main, PAIR_MAIN_AUDIO, 'main stream');
  validPin(packet.audio.structure, `${PAIR_OUTPUT}/candidates/p013/source-audio-structure.json`);
  same(packet.audio.structureFacts, {firstFrame: 2, lastFrame: 365, blockCount: 364,
    emptyFrames: [3,365], negativeSeekBlocks: [[365,-2071]],
    sourceAlignmentAccepted: false, listeningAccepted: false}, 'signed seek and acceptance boundary');
  same(packet.glossary, {sourceButtonCount: 4, stopPath: 'animation_mc.animation',
    closePolicy: 'remain-paused', additionalGlobalReadParity: 'not-applicable'},
  'P013 glossary pause semantics');
  const files = packet.integrity?.files;
  demand(Array.isArray(files) && files.length > 0 &&
    new Set(files.map(item => item.path)).size === files.length, 'unique P013 input closure');
  for (const expected of [artifacts.module, artifacts.timeline, artifacts.runtime,
    packet.visual.nativeRuntime, packet.visual.metadata, packet.audio.main, packet.audio.structure])
    demand(files.some(item => item.path === expected.path && item.bytes === expected.bytes &&
      item.sha256 === expected.sha256), `own input ${expected.path}`);
  demand(files.some(item => item.path === 'apps/web/lib/g678-glossary-pair-admission.server.ts'),
    'P013 descriptor extender in page closure');
  for (const expected of packet.sourceFacts.sourcePins.slice(1))
    demand(files.some(item => item.path === expected.path && item.bytes === expected.bytes &&
      item.sha256 === expected.sha256), `source input ${expected.path}`);
  demand(!files.some(item => item.path.includes('/p015/') ||
    item.path === 'packages/demos/private-current-js-registry.json' ||
    item.path.startsWith('packages/demos/src/registry.local-only.') ||
    item.path === `${PAIR_OUTPUT}/source-inputs.json` ||
    item.path === `${PAIR_OUTPUT}/host-resources-v1.json`),
  'page closure excludes P015 and mutable pair/registry transaction');
  same(Object.keys(packet.acceptanceEffects ?? {}).sort(), [...PAIR_ACCEPTANCE_KEYS].sort(),
    'independent acceptance keys');
  demand(Object.values(packet.acceptanceEffects).every(value => value === false) &&
    packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false,
  'no acceptance or family expansion');
  if (packet.freezeManifest !== undefined)
    validPin(packet.freezeManifest, `catalog/product-bridge-calibrations/${PAIR_ADMISSION_CALIBRATION}.json`);
  demand(registration?.calibrationId === PAIR_ADMISSION_CALIBRATION &&
    registration.deploymentScope === 'local-only' && registration.freezeManifestSha256 === packet.freezeManifest?.sha256,
  'registration freeze binding');
  if (Array.isArray(registration.entries)) {
    same(registration.entries, [entry], 'fragment entry');
    same(registration.freezeManifest,
      `catalog/product-bridge-calibrations/${PAIR_ADMISSION_CALIBRATION}.json`, 'fragment freeze path');
    same(registration.freezeManifestBytes, packet.freezeManifest?.bytes, 'fragment freeze bytes');
  } else {
    demand(registration.maturity === 'private-current-js' && registration.scope === 'private-engineering' &&
      registration.moduleSha256 === artifacts.module.sha256 &&
      registration.timelineSha256 === artifacts.timeline.sha256 &&
      registration.runtimeSha256 === artifacts.runtime.sha256, 'live registration identity');
  }
  return true;
}
