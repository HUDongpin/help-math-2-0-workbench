#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), '..');

export const RW002_ANIMATION_ID = 'course-g05-l13-rw-002';
export const RW002_SOURCE_SWF =
  'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L13/RW/L13RW02.swf';
export const RW002_SOURCE_SWF_SHA256 =
  'bf9ab1d12832fbe54c5bef08d0dd51307169eefbae1f75188efd9db94ed9e4e6';
export const RW002_SOURCE_HOST =
  'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L13/index_local.swf';
export const RW002_SOURCE_HOST_SHA256 =
  '956d8e90ca07d59aeb9b3e97bc20f7e2e14221125913d8f774b8c98a61d4292d';
export const RW002_SPANISH_TRACK =
  'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L13/SA/L13RW02.mp3';
export const RW002_SPANISH_TRACK_SHA256 =
  '2e809c69df60cec11427a71d38b37b830a0a9ec805e3c8ff4f68734cb53bfcd2';
export const RW002_MIGRATION_ROOT = `migrations/${RW002_ANIMATION_ID}`;
export const RW002_OUTPUT =
  `${RW002_MIGRATION_ROOT}/audit/bilingual-visual-source-disposition.json`;
export const SOURCE_SHARED_VISUAL_LOCALIZATION =
  'single-source-drawing-timeline-with-embedded-english-title-and-no-language-branch; es preserves source pixels without claiming translation';

const inputPaths = Object.freeze({
  ffdecScripts: `${RW002_MIGRATION_ROOT}/audit/machine/ffdec-scripts.txt.gz`,
  scenarioInventory: `${RW002_MIGRATION_ROOT}/audit/scenario-inventory.json`,
  staticDisposition:
    `${RW002_MIGRATION_ROOT}/audit/static-frame-domain-disposition-evidence.json`,
  originalHostContract: `${RW002_MIGRATION_ROOT}/audit/original-host-entry-contract.json`,
  originalHostMinimalTree: `${RW002_MIGRATION_ROOT}/audit/original-host-minimal-tree.json`,
  originalHostPlacementProof:
    `${RW002_MIGRATION_ROOT}/audit/original-host-placement-proof.json`,
  canvasManifest: `public/flash-assets/courses/${RW002_ANIMATION_ID}/manifest.json`,
  rootFrameManifest:
    `public/flash-assets/courses/${RW002_ANIMATION_ID}/root-frames/manifest.json`
});

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function absolute(relativePath) {
  return path.join(projectRoot, relativePath);
}

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

export function extractRw002FfdecScriptBlocks(source) {
  const blocks = new Map();
  for (const chunk of source.split(/^===== /m).slice(1)) {
    const marker = chunk.indexOf(' =====\n');
    requireValue(marker > 0, 'FFDec script export contains a malformed block marker');
    const name = chunk.slice(0, marker);
    requireValue(!blocks.has(name), `FFDec script export repeats ${name}`);
    blocks.set(name, chunk.slice(marker + ' =====\n'.length).trim());
  }
  return blocks;
}

function exactMap(actual, expected, label) {
  requireValue(
    JSON.stringify([...actual.keys()].sort()) ===
      JSON.stringify([...expected.keys()].sort()),
    `${label} file set changed`
  );
  for (const [name, body] of expected) {
    requireValue(actual.get(name) === body, `${label} ${name} changed`);
  }
}

export function validateRw002SourceSharedVisualInputs({
  ffdecText,
  scenarioInventory,
  staticDisposition,
  originalHostContract,
  originalHostMinimalTree,
  originalHostPlacementProof,
  canvasManifest,
  rootFrameManifest
}) {
  const scripts = extractRw002FfdecScriptBlocks(ffdecText);
  const expectedScripts = new Map([
    ['DefineButton2_111/BUTTONCONDACTION on(press).as', 'on(press){\n   play();\n}'],
    ['DefineSprite_334/frame_1873/DoAction.as', 'stop();'],
    [
      'DefineSprite_334/frame_673/DoAction.as',
      'stop();\n_global.quizSection = true;'
    ],
    [
      'DefineSprite_334/frame_674/DoAction.as',
      '_global.quizSection = false;'
    ],
    [
      'frame_1/DoAction.as',
      '_level0.InternalPreloader.gotoAndPlay("jump_check");\nstop();'
    ],
    ['frame_6/DoAction.as', 'stop();']
  ]);
  exactMap(scripts, expectedScripts, 'complete RW002 child FFDec export');
  const languageSensitiveScriptMatches =
    ffdecText.match(/\b(?:english|spanish|language|lang)\b/gi) ?? [];
  requireValue(
    languageSensitiveScriptMatches.length === 0,
    'RW002 child ActionScript now contains a language-sensitive branch'
  );

  requireValue(
    scenarioInventory?.animationId === RW002_ANIMATION_ID &&
      scenarioInventory?.source?.swfSha256 === RW002_SOURCE_SWF_SHA256,
    'scenario inventory source binding is stale'
  );
  requireValue(
    scenarioInventory.source.rootFrameCount === 10 &&
      scenarioInventory.source.fps === 12 &&
      scenarioInventory.source.stage?.width === 800 &&
      scenarioInventory.source.stage?.height === 600,
    'scenario inventory root metadata changed'
  );
  const timelineIds = (scenarioInventory.timelineInventory ?? [])
    .map(({timelineId}) => timelineId)
    .sort();
  requireValue(
    JSON.stringify(timelineIds) ===
      JSON.stringify(
        ['root', 'sprite-22', 'sprite-93', 'sprite-251', 'sprite-264', 'sprite-334'].sort()
      ),
    'scenario inventory timeline set changed'
  );
  const rootTimeline = scenarioInventory.timelineInventory.find(
    ({timelineId}) => timelineId === 'root'
  );
  const mainTimeline = scenarioInventory.timelineInventory.find(
    ({timelineId}) => timelineId === 'sprite-334'
  );
  requireValue(rootTimeline?.frameCount === 10, 'root timeline must retain 10 frames');
  requireValue(
    rootTimeline.namedPlacements?.some(
      ({frame, name, objectId, hasClipActions}) =>
        frame === 6 &&
        name === 'animation' &&
        objectId === '334' &&
        hasClipActions === false
    ),
    'root frame 6 no longer proves the sprite-334 placement'
  );
  requireValue(
    mainTimeline?.frameCount === 1873 &&
      mainTimeline.controlStates?.some(
        ({frame, reasons}) => frame === 673 && reasons.includes('script-stop-state')
      ) &&
      mainTimeline.controlStates?.some(
        ({frame, reasons}) => frame === 1873 && reasons.includes('script-stop-state')
      ),
    'sprite-334 frame-domain or stop boundaries changed'
  );

  requireValue(
    staticDisposition?.animationId === RW002_ANIMATION_ID &&
      staticDisposition?.status === 'verified-static-composite-claims',
    'static frame-domain disposition is missing or unverified'
  );
  const expectedCompositeIds = ['sprite-22', 'sprite-93', 'sprite-251', 'sprite-264'];
  const compositeClaims = expectedCompositeIds.map((timelineId) => {
    const claim = staticDisposition.claims?.find(
      (candidate) => candidate.timelineId === timelineId
    );
    requireValue(claim, `${timelineId} static disposition claim is missing`);
    requireValue(
      claim.disposition === 'composite-child-with-parent' &&
        claim.role === 'multi-frame-scriptless-parent-clock-composite-child' &&
        claim.parentBinding?.parentTimelineId === 'sprite-334' &&
        claim.parentBinding?.parentFrameDomainId === 'sprite-334' &&
        claim.parentBinding?.parentFrameCount === 1873,
      `${timelineId} is no longer proven as a sprite-334 clock-derived composite`
    );
    return claim;
  });
  requireValue(
    Object.values(staticDisposition.acceptanceEffects ?? {}).every(
      (value) => value === false
    ),
    'static disposition must not satisfy an acceptance obligation'
  );

  requireValue(
    originalHostContract?.animationId === RW002_ANIMATION_ID &&
      originalHostContract?.sourceHost?.sha256 === RW002_SOURCE_HOST_SHA256 &&
      originalHostContract?.targetChild?.sha256 === RW002_SOURCE_SWF_SHA256,
    'original-host contract source binding is stale'
  );
  requireValue(
    originalHostContract.authority?.sourceDerivationComplete === true &&
      originalHostContract.authority?.originalRuntimeExecutedByThisArtifact === false &&
      originalHostContract.authority?.audioListeningPerformedByThisArtifact === false &&
      originalHostContract.authority?.baselineAuthorityClaimed === false &&
      originalHostContract.authority?.naturalTraceFramesCapturedByThisArtifact === 0,
    'original-host contract authority boundary changed'
  );
  const spanishAudioContract = originalHostContract.contracts?.spanishAudioStopResume;
  requireValue(
    spanishAudioContract?.status ===
      'source-proven-control-flow-runtime-listening-still-pending' &&
      spanishAudioContract?.expectedResolvedTrack?.path === RW002_SPANISH_TRACK &&
      spanishAudioContract?.expectedResolvedTrack?.sha256 ===
        RW002_SPANISH_TRACK_SHA256,
    'original-host Spanish audio contract changed or was promoted'
  );

  requireValue(
    originalHostMinimalTree?.animationId === RW002_ANIMATION_ID &&
      originalHostMinimalTree?.requiredFileCount === 5 &&
      originalHostMinimalTree?.requiredFiles?.length === 5,
    'original-host minimal tree is missing or no longer minimal'
  );
  const requiredFiles = new Map(
    originalHostMinimalTree.requiredFiles.map((entry) => [entry.path, entry])
  );
  requireValue(
    requiredFiles.get(RW002_SOURCE_HOST)?.sha256 === RW002_SOURCE_HOST_SHA256 &&
      requiredFiles.get(RW002_SOURCE_SWF)?.sha256 === RW002_SOURCE_SWF_SHA256 &&
      requiredFiles.get(RW002_SPANISH_TRACK)?.sha256 === RW002_SPANISH_TRACK_SHA256,
    'original-host minimal tree lost a pinned host, target, or Spanish track'
  );
  const spanishGlossaryExclusion =
    originalHostMinimalTree.explicitlyExcludedFromScopedRuntimeTree?.find(
      ({disposition}) => disposition === 'conditional-glossary-spanish-switch-only'
    );
  requireValue(
    spanishGlossaryExclusion?.path?.endsWith('/XML/ELKTSG4.xml') &&
      !requiredFiles.has(spanishGlossaryExclusion.path),
    'Spanish glossary XML must remain outside the narration-only scoped tree'
  );
  requireValue(
    originalHostMinimalTree.validation?.allRequiredFilesExist === true &&
      originalHostMinimalTree.validation?.allRequiredHashesMatch === true &&
      originalHostMinimalTree.validation?.wholeLessonTreeRequired === false &&
      originalHostMinimalTree.structuralPlacementProof?.sha256 ===
        '3349fc83ba03916b5d12e08530aed3d1edb3a10c740e24f5fbf276330af4d890',
    'original-host minimal-tree validation or placement binding changed'
  );

  requireValue(
    originalHostPlacementProof?.animationId === RW002_ANIMATION_ID &&
      originalHostPlacementProof?.sourceHost?.sha256 === RW002_SOURCE_HOST_SHA256,
    'original-host placement proof source binding is stale'
  );
  requireValue(
    originalHostPlacementProof.structuralChain?.placements?.some(
      ({timelineId, frame, objectId, instanceName}) =>
        timelineId === 'root' &&
        frame === 50 &&
        objectId === 697 &&
        instanceName === 'glossary'
    ) &&
      originalHostPlacementProof.structuralChain?.placements?.some(
        ({timelineId, frame, objectId, instanceName}) =>
          timelineId === 'sprite-697' &&
          frame === 1 &&
          objectId === 696 &&
          instanceName === 'keyterms'
      ),
    'original-host glossary/keyterms placement chain changed'
  );

  requireValue(
    canvasManifest?.animationId === RW002_ANIMATION_ID &&
      canvasManifest?.inputs?.sourceSwf?.sha256 === RW002_SOURCE_SWF_SHA256,
    'Canvas manifest source binding is stale'
  );
  requireValue(
    JSON.stringify(canvasManifest.timeline?.supportedLanguages) ===
      JSON.stringify(['en', 'es']) &&
      canvasManifest.timeline?.visualLocalization ===
        SOURCE_SHARED_VISUAL_LOCALIZATION,
    'Canvas manifest does not retain the source-shared en/es visual contract'
  );
  requireValue(
    canvasManifest.safety?.noLegacyActionScriptExecuted === true &&
      canvasManifest.safety?.noDynamicEvaluation === true &&
      canvasManifest.safety?.noNetworkPrimitives === true &&
      canvasManifest.safety?.noTimersOrAutoplay === true,
    'Canvas adapter safety contract is incomplete'
  );

  requireValue(
    rootFrameManifest?.animationId === RW002_ANIMATION_ID &&
      rootFrameManifest?.source?.swfSha256 === RW002_SOURCE_SWF_SHA256 &&
      rootFrameManifest?.runtime?.frameDomain === 'root' &&
      rootFrameManifest?.runtime?.frameCount === 10 &&
      rootFrameManifest?.runtime?.language === 'en' &&
      rootFrameManifest?.frames?.length === 10 &&
      rootFrameManifest?.strictAcceptanceEffect === 'none',
    'root-frame implementation manifest changed or overstates its authority'
  );

  return {
    scripts,
    expectedScripts,
    languageSensitiveScriptMatches,
    rootTimeline,
    mainTimeline,
    compositeClaims,
    spanishAudioContract,
    requiredFiles,
    spanishGlossaryExclusion
  };
}

async function readRequiredSourceFiles(requiredFiles) {
  const records = [];
  for (const entry of requiredFiles.values()) {
    const bytes = await readFile(absolute(entry.path));
    requireValue(sha256(bytes) === entry.sha256, `${entry.path} hash is stale`);
    requireValue(bytes.length === entry.bytes, `${entry.path} byte count is stale`);
    records.push({path: entry.path, sha256: entry.sha256, bytes: entry.bytes});
  }
  return records;
}

async function readRootFrameFiles(rootFrameManifest) {
  const rootDirectory = path.dirname(inputPaths.rootFrameManifest);
  const records = [];
  for (const frame of rootFrameManifest.frames) {
    const relativePath = `${rootDirectory}/${frame.file}`;
    const bytes = await readFile(absolute(relativePath));
    requireValue(sha256(bytes) === frame.sha256, `${relativePath} hash is stale`);
    requireValue(bytes.length === frame.bytes, `${relativePath} byte count is stale`);
    records.push({frame: frame.frame, path: relativePath, sha256: frame.sha256});
  }
  return records;
}

export async function buildRw002BilingualVisualDisposition() {
  const [
    sourceSwfBytes,
    ffdecBytes,
    scenarioInventoryBytes,
    staticDispositionBytes,
    originalHostContractBytes,
    originalHostMinimalTreeBytes,
    originalHostPlacementProofBytes,
    canvasManifestBytes,
    rootFrameManifestBytes
  ] = await Promise.all([
    readFile(absolute(RW002_SOURCE_SWF)),
    readFile(absolute(inputPaths.ffdecScripts)),
    readFile(absolute(inputPaths.scenarioInventory)),
    readFile(absolute(inputPaths.staticDisposition)),
    readFile(absolute(inputPaths.originalHostContract)),
    readFile(absolute(inputPaths.originalHostMinimalTree)),
    readFile(absolute(inputPaths.originalHostPlacementProof)),
    readFile(absolute(inputPaths.canvasManifest)),
    readFile(absolute(inputPaths.rootFrameManifest))
  ]);
  requireValue(
    sha256(sourceSwfBytes) === RW002_SOURCE_SWF_SHA256,
    'preserved RW002 SWF hash does not match the pinned source'
  );

  const ffdecText = gunzipSync(ffdecBytes).toString('utf8');
  const scenarioInventory = JSON.parse(scenarioInventoryBytes);
  const staticDisposition = JSON.parse(staticDispositionBytes);
  const originalHostContract = JSON.parse(originalHostContractBytes);
  const originalHostMinimalTree = JSON.parse(originalHostMinimalTreeBytes);
  const originalHostPlacementProof = JSON.parse(originalHostPlacementProofBytes);
  const canvasManifest = JSON.parse(canvasManifestBytes);
  const rootFrameManifest = JSON.parse(rootFrameManifestBytes);
  const validated = validateRw002SourceSharedVisualInputs({
    ffdecText,
    scenarioInventory,
    staticDisposition,
    originalHostContract,
    originalHostMinimalTree,
    originalHostPlacementProof,
    canvasManifest,
    rootFrameManifest
  });

  const canvasScriptPath = canvasManifest.output?.script;
  requireValue(
    typeof canvasScriptPath === 'string' &&
      /^[a-f0-9]{64}$/.test(canvasManifest.output?.sha256 ?? ''),
    'Canvas manifest output binding is incomplete'
  );
  const canvasScriptBytes = await readFile(absolute(canvasScriptPath));
  requireValue(
    sha256(canvasScriptBytes) === canvasManifest.output.sha256 &&
      canvasScriptBytes.length === canvasManifest.output.bytes,
    'Canvas adapter output hash or byte count is stale'
  );
  const requiredSourceFiles = await readRequiredSourceFiles(validated.requiredFiles);
  const rootFrameFiles = await readRootFrameFiles(rootFrameManifest);

  return {
    schemaVersion: 1,
    evidenceType: 'source-shared-bilingual-visual-disposition',
    animationId: RW002_ANIMATION_ID,
    status: 'verified-source-shared-untranslated-visual',
    migrationStatusChanged: false,
    authorityStatement: [
      'The complete hash-bound RW002 child ActionScript export contains one root placement, one 1,873-frame source drawing timeline, one press-to-play handler, two source stop boundaries, and no English, Spanish, language, or lang branch.',
      'The original lesson host separately derives a Spanish narration MP3 and stops/resumes the same loaded child timeline; it does not select a translated RW002 child visual. Runtime execution, listening, and synchronization remain pending.',
      'Rendering the same source pixels for en and es is a source-shared untranslated visual disposition. It is not a translated Spanish visual, bilingual parity, original-host parity, audio acceptance, human review, owner acceptance, or migration completion.'
    ],
    generatedFrom: {
      sourceSwf: {
        path: RW002_SOURCE_SWF,
        sha256: sha256(sourceSwfBytes)
      },
      ffdecScripts: {
        path: inputPaths.ffdecScripts,
        sha256: sha256(ffdecBytes),
        uncompressedSha256: sha256(ffdecText)
      },
      scenarioInventory: {
        path: inputPaths.scenarioInventory,
        sha256: sha256(scenarioInventoryBytes)
      },
      staticFrameDomainDispositionEvidence: {
        path: inputPaths.staticDisposition,
        sha256: sha256(staticDispositionBytes)
      },
      originalHostEntryContract: {
        path: inputPaths.originalHostContract,
        sha256: sha256(originalHostContractBytes)
      },
      originalHostMinimalTree: {
        path: inputPaths.originalHostMinimalTree,
        sha256: sha256(originalHostMinimalTreeBytes),
        requiredSourceFiles
      },
      originalHostPlacementProof: {
        path: inputPaths.originalHostPlacementProof,
        sha256: sha256(originalHostPlacementProofBytes)
      },
      canvasAdapter: {
        manifestPath: inputPaths.canvasManifest,
        manifestSha256: sha256(canvasManifestBytes),
        scriptPath: canvasScriptPath,
        scriptSha256: sha256(canvasScriptBytes),
        scriptBytes: canvasScriptBytes.length
      },
      rootFrameImplementationAssets: {
        manifestPath: inputPaths.rootFrameManifest,
        manifestSha256: sha256(rootFrameManifestBytes),
        frames: rootFrameFiles
      }
    },
    sourceFindings: {
      rootTimeline: {
        timelineId: validated.rootTimeline.timelineId,
        frameCount: validated.rootTimeline.frameCount,
        childPlacement: {
          frame: 6,
          instanceName: 'animation',
          sourceObjectId: 334
        }
      },
      mainTimeline: {
        timelineId: validated.mainTimeline.timelineId,
        frameCount: validated.mainTimeline.frameCount,
        stopFrames: [673, 1873]
      },
      completeChildScriptCount: validated.scripts.size,
      sourceScripts: [...validated.expectedScripts].map(([script, body]) => ({
        script,
        bodySha256: sha256(body)
      })),
      languageSensitiveActionScriptMatches:
        validated.languageSensitiveScriptMatches,
      staticCompositeTimelines: validated.compositeClaims.map(
        ({timelineId, frameCount, disposition, role}) => ({
          timelineId,
          frameCount,
          disposition,
          role
        })
      ),
      originalHostSpanishTrack: {
        path: RW002_SPANISH_TRACK,
        sha256: RW002_SPANISH_TRACK_SHA256,
        controlFlowStatus: validated.spanishAudioContract.status,
        authoritativeListeningComplete: false,
        synchronizationComplete: false
      },
      spanishGlossaryDependencyDisposition: {
        path: validated.spanishGlossaryExclusion.path,
        disposition: validated.spanishGlossaryExclusion.disposition,
        requiredForNarrationOnlyScope: false
      }
    },
    implementationDisposition: {
      languages: ['en', 'es'],
      frameDomains: [
        {id: 'root', frameCount: 10},
        {id: 'sprite-334', frameCount: 1873}
      ],
      visualClassification: 'source-shared-untranslated-visual',
      visualLocalization: SOURCE_SHARED_VISUAL_LOCALIZATION,
      renderSameSourceVisualForBothLanguages: true,
      translatedSpanishVisual: false,
      audioRendered: false,
      audioStatus:
        'exact-spanish-track-staged-but-authoritative-listening-and-synchronization-pending',
      hostIntegrationStatus: 'blocked-not-authoritatively-executed'
    },
    acceptanceEffects: {
      authoritativeOriginalRuntimeBaseline: false,
      naturalOriginalRuntimeTraversal: false,
      translatedSpanishVisual: false,
      bilingualVisualParity: false,
      audioAcceptance: false,
      behaviorParity: false,
      fullFrameCoverage: false,
      rmseAcceptance: false,
      humanVisualReview: false,
      engineeringAcceptance: false,
      ownerAcceptance: false,
      strictMigrationCompletion: false
    },
    strictAcceptanceEffect:
      'none; this evidence permits only the same untranslated source visual to render in en and es contexts. Original-host execution, Spanish listening and synchronization, interaction/Replay parity, full-frame/RMSE, human review, owner acceptance, and migration completion remain unresolved.'
  };
}

export function serializeRw002BilingualVisualDisposition(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function parseArguments(argv) {
  const options = {check: false};
  for (const value of argv) {
    if (value === '--check') options.check = true;
    else if (value === '--help' || value === '-h') options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(
      'Usage: node scripts/build-rw002-bilingual-visual-disposition.mjs [--check]'
    );
    return;
  }
  const serialized = serializeRw002BilingualVisualDisposition(
    await buildRw002BilingualVisualDisposition()
  );
  if (options.check) {
    const current = await readFile(absolute(RW002_OUTPUT), 'utf8');
    if (current !== serialized) throw new Error(`${RW002_OUTPUT} is stale`);
    console.log(`RW002 bilingual visual disposition is current: ${RW002_OUTPUT}`);
    return;
  }
  await writeFile(absolute(RW002_OUTPUT), serialized);
  console.log(`Wrote ${RW002_OUTPUT}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
