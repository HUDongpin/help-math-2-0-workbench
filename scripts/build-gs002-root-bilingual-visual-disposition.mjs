#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gunzipSync} from 'node:zlib';

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), '..');

export const GS002_ANIMATION_ID = 'course-g04-l09-gs-002';
export const GS002_MIGRATION_ROOT = `migrations/${GS002_ANIMATION_ID}`;
export const GS002_OUTPUT =
  `${GS002_MIGRATION_ROOT}/audit/bilingual-visual-source-disposition.json`;
export const GS002_SOURCE_SWF =
  'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L9/GS/L9GS02.swf';
export const GS002_SOURCE_SWF_SHA256 =
  '41cdb7e5cc5735eef2af3e4831908c47781840f0addcc3ac1a2142cbb0d48f15';
export const GS002_SOURCE_HOST =
  'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L9/index_local.swf';
export const GS002_SOURCE_HOST_SHA256 =
  'e725af1cfac54d111c948df412a81d2ef02110d242361147cca5ef13b78e2ed5';
export const GS002_COURSE_XML =
  'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L9/index.xml';
export const GS002_COURSE_XML_SHA256 =
  'd1d3bdba357f66e252d6201b00cffeed409ea4505233595cedf1f5bfd10722b4';
export const GS002_SPANISH_AUDIO =
  'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L9/SA/L9GS02.mp3';
export const GS002_SPANISH_AUDIO_SHA256 =
  'fc1d611959deedae1d0ac4005b09c416fbd1711536c3190d190795798a4ad9d3';
export const GS002_FFDEC_SCRIPTS_SHA256 =
  'eb6a87a913b2d9d88f8aef8dbffb3623d3f3dcaac2c38569144fef532a595b72';
export const GS002_VISUAL_LOCALIZATION = 'source-shared-untranslated-visual';

const inputPaths = Object.freeze({
  ffdecScripts: `${GS002_MIGRATION_ROOT}/audit/machine/ffdec-scripts.txt.gz`,
  scenarioInventory: `${GS002_MIGRATION_ROOT}/audit/scenario-inventory.json`,
  rootStructuralReport: `${GS002_MIGRATION_ROOT}/baseline/ffdec-root-frames.json`,
  spriteCanvasAdapterSpec: `${GS002_MIGRATION_ROOT}/audit/canvas-adapter-spec.json`
});

export const GS002_SOURCE_SHARED_REQUIREMENT = Object.freeze({
  requirementId: 'req:root:root-standalone:es',
  frameDomainId: 'root',
  scenario: 'root-standalone',
  language: 'es',
  firstFrame: 1,
  lastFrame: 10,
  frameCount: 10
});

const blockedSpriteScenarios = Object.freeze([
  'source-drawing-lead-in',
  'questions-q1-q10-unavailable',
  'answer-correct-unavailable',
  'answer-wrong-unavailable',
  'random-scoring-unavailable',
  'final-replay-glossary-routing-unavailable'
]);

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function absolute(relativePath) {
  const resolved = path.resolve(projectRoot, relativePath);
  if (resolved !== projectRoot && !resolved.startsWith(`${projectRoot}${path.sep}`)) {
    throw new Error(`Path escapes project root: ${relativePath}`);
  }
  return resolved;
}

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

function pngDimensions(bytes, label) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  requireValue(
    bytes.length >= 24 && bytes.subarray(0, 8).equals(signature),
    `${label} has an invalid PNG signature`
  );
  requireValue(bytes.toString('ascii', 12, 16) === 'IHDR', `${label} has no PNG IHDR`);
  return {width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20)};
}

export function extractGs002FfdecScriptBlocks(source) {
  const blocks = new Map();
  for (const chunk of source.split(/^===== /m).slice(1)) {
    const marker = chunk.indexOf(' =====\n');
    requireValue(marker > 0, 'GS002 FFDec script export contains a malformed block marker');
    const name = chunk.slice(0, marker);
    requireValue(!blocks.has(name), `GS002 FFDec script export repeats ${name}`);
    blocks.set(name, chunk.slice(marker + ' =====\n'.length).trim());
  }
  return blocks;
}

export function validateGs002RootBilingualInputs({
  ffdecText,
  scenarioInventory,
  rootStructuralReport,
  spriteCanvasAdapterSpec
}) {
  requireValue(
    scenarioInventory?.animationId === GS002_ANIMATION_ID &&
      scenarioInventory?.source?.swf === GS002_SOURCE_SWF &&
      scenarioInventory?.source?.swfSha256 === GS002_SOURCE_SWF_SHA256,
    'GS002 scenario inventory source binding is stale'
  );
  requireValue(
    scenarioInventory.source.pairedFlaStatus === 'missing' &&
      scenarioInventory.source.stage?.width === 800 &&
      scenarioInventory.source.stage?.height === 600 &&
      scenarioInventory.source.fps === 12 &&
      scenarioInventory.source.rootFrameCount === 10,
    'GS002 source metadata or missing-FLA boundary changed'
  );

  const rootTimeline = scenarioInventory.timelineInventory?.find(
    ({timelineId}) => timelineId === 'root'
  );
  const spriteTimeline = scenarioInventory.timelineInventory?.find(
    ({timelineId}) => timelineId === 'sprite-787'
  );
  requireValue(rootTimeline?.frameCount === 10, 'GS002 root timeline must retain ten frames');
  requireValue(
    rootTimeline.namedPlacements?.some(
      ({frame, name, objectId}) =>
        frame === 6 && name === 'animation' && String(objectId) === '787'
    ),
    'GS002 root frame 6 no longer proves the animation/sprite-787 placement'
  );
  requireValue(
    spriteTimeline?.frameCount === 653 &&
      spriteTimeline.controlStates?.some(
        ({frame, reasons}) => frame === 642 && reasons.includes('script-stop-state')
      ) &&
      spriteTimeline.controlStates?.some(
        ({frame, reasons}) => frame === 653 && reasons.includes('terminal-structural-frame')
      ),
    'GS002 sprite-787 frame or AVM1 stop boundary changed'
  );

  requireValue(
    scenarioInventory.courseXml?.artifact?.path === GS002_COURSE_XML &&
      scenarioInventory.courseXml?.artifact?.sha256 === GS002_COURSE_XML_SHA256,
    'GS002 course XML binding is stale'
  );
  const gsSection = scenarioInventory.courseXml.sections?.find(({name}) => name === 'GS');
  requireValue(
    gsSection?.pages?.length === 1 &&
      gsSection.pages[0]?.path === 'GS/L9GS02.swf' &&
      gsSection.pages[0]?.attributes?.Title === 'Game 1' &&
      gsSection.titles?.english === 'Play It' &&
      gsSection.titles?.spanish === 'Juégalo',
    'GS002 course XML placement or bilingual shell labels changed'
  );

  const scriptBlocks = extractGs002FfdecScriptBlocks(ffdecText);
  requireValue(scriptBlocks.size === 66, 'GS002 complete FFDec script-block count changed');
  const languageSensitiveActionScriptMatches =
    ffdecText.match(/\b(?:english|spanish|language|lang)\b/gi) ?? [];
  requireValue(
    languageSensitiveActionScriptMatches.length === 0,
    'GS002 child ActionScript now contains a language-sensitive branch'
  );
  requireValue(
    scriptBlocks.get('DefineSprite_787/frame_642/DoAction.as')?.includes(
      'Mc_Popup._visible = false;'
    ) &&
      scriptBlocks.get('DefineSprite_787/frame_642/DoAction.as')?.includes(
        '_global.correctSelect = 0;'
      ),
    'GS002 frame 642 AVM1 state boundary changed'
  );

  requireValue(
    rootStructuralReport?.schemaVersion === 1 &&
      rootStructuralReport?.animationId === GS002_ANIMATION_ID &&
      rootStructuralReport?.status === 'structural-baseline-only' &&
      rootStructuralReport?.source?.swf === GS002_SOURCE_SWF &&
      rootStructuralReport?.source?.swfSha256 === GS002_SOURCE_SWF_SHA256,
    'GS002 structural root report source or authority changed'
  );
  requireValue(
    rootStructuralReport.authority?.kind === 'swf-static-root-timeline-render' &&
      rootStructuralReport.runtime?.stage?.width === 800 &&
      rootStructuralReport.runtime?.stage?.height === 600 &&
      rootStructuralReport.runtime?.fps === 12 &&
      rootStructuralReport.runtime?.frameCount === 10 &&
      rootStructuralReport.frames?.length === 10,
    'GS002 structural root report no longer enumerates ten native-stage frames'
  );

  requireValue(
    spriteCanvasAdapterSpec?.animationId === GS002_ANIMATION_ID &&
      spriteCanvasAdapterSpec?.source?.swfSha256 === GS002_SOURCE_SWF_SHA256 &&
      spriteCanvasAdapterSpec?.timeline?.local?.timelineId === 'sprite-787',
    'GS002 sprite Canvas adapter source or frame domain changed'
  );
  requireValue(
    JSON.stringify(spriteCanvasAdapterSpec.runtimeContract?.supportedLanguages) ===
      JSON.stringify(['en']) &&
      spriteCanvasAdapterSpec.runtimeContract?.visualLocalization == null,
    'GS002 sprite Canvas adapter must remain English-only to avoid an ES lead-in scope leak'
  );

  return {
    gsSection,
    languageSensitiveActionScriptMatches,
    rootTimeline,
    scriptBlockCount: scriptBlocks.size,
    spriteTimeline
  };
}

async function readBound(relativePath, expectedSha256, label) {
  const bytes = await readFile(absolute(relativePath));
  requireValue(
    sha256(bytes) === expectedSha256,
    `${label} SHA-256 changed (expected ${expectedSha256}, observed ${sha256(bytes)})`
  );
  return bytes;
}

export async function buildGs002RootBilingualVisualDisposition() {
  const [
    generatorBytes,
    sourceSwfBytes,
    sourceHostBytes,
    courseXmlBytes,
    spanishAudioBytes,
    ffdecBytes,
    scenarioInventoryBytes,
    rootStructuralReportBytes,
    spriteCanvasAdapterSpecBytes
  ] = await Promise.all([
    readFile(scriptPath),
    readBound(GS002_SOURCE_SWF, GS002_SOURCE_SWF_SHA256, 'GS002 preserved SWF'),
    readBound(GS002_SOURCE_HOST, GS002_SOURCE_HOST_SHA256, 'GS002 same-lesson host'),
    readBound(GS002_COURSE_XML, GS002_COURSE_XML_SHA256, 'GS002 course XML'),
    readBound(GS002_SPANISH_AUDIO, GS002_SPANISH_AUDIO_SHA256, 'GS002 Spanish audio'),
    readBound(
      inputPaths.ffdecScripts,
      GS002_FFDEC_SCRIPTS_SHA256,
      'GS002 complete FFDec scripts'
    ),
    readFile(absolute(inputPaths.scenarioInventory)),
    readFile(absolute(inputPaths.rootStructuralReport)),
    readFile(absolute(inputPaths.spriteCanvasAdapterSpec))
  ]);
  const ffdecText = gunzipSync(ffdecBytes).toString('utf8');
  const scenarioInventory = JSON.parse(scenarioInventoryBytes);
  const rootStructuralReport = JSON.parse(rootStructuralReportBytes);
  const spriteCanvasAdapterSpec = JSON.parse(spriteCanvasAdapterSpecBytes);
  const validated = validateGs002RootBilingualInputs({
    ffdecText,
    scenarioInventory,
    rootStructuralReport,
    spriteCanvasAdapterSpec
  });

  const rootFrames = [];
  for (const [index, frame] of rootStructuralReport.frames.entries()) {
    const frameNumber = index + 1;
    requireValue(
      frame?.frame === frameNumber && frame?.file === `${frameNumber}.png`,
      `GS002 structural root frame ${frameNumber} identity changed`
    );
    const relativePath = `${rootStructuralReport.archive.root}/${frame.file}`;
    const bytes = await readFile(absolute(relativePath));
    const dimensions = pngDimensions(bytes, `GS002 structural root frame ${frameNumber}`);
    requireValue(
      sha256(bytes) === frame.sha256 && bytes.length === frame.bytes,
      `GS002 structural root frame ${frameNumber} bytes changed`
    );
    requireValue(
      dimensions.width === 800 &&
        dimensions.height === 600 &&
        frame.width === 800 &&
        frame.height === 600,
      `GS002 structural root frame ${frameNumber} is not 800x600`
    );
    rootFrames.push({
      frame: frameNumber,
      path: relativePath,
      sha256: frame.sha256,
      bytes: frame.bytes,
      width: frame.width,
      height: frame.height
    });
  }

  return {
    schemaVersion: 1,
    evidenceType: 'source-shared-bilingual-visual-disposition',
    animationId: GS002_ANIMATION_ID,
    status: 'verified-root-source-shared-untranslated-visual',
    migrationStatusChanged: false,
    authorityStatement: [
      'The active Grade 4 Lesson 9 XML has one Game 1 placement and routes the same L9GS02.swf child binary inside the bilingual course shell.',
      'The complete hash-bound child ActionScript export has no English, Spanish, language, or lang branch. The ten root implementation PNGs are fixed static drawings copied byte-for-byte from the same preserved SWF-derived structural export.',
      'The same root pixels may therefore be rendered for en and es request contexts only as source-shared-untranslated-visual. This does not supply Spanish translation, original-host execution, audio acceptance, baseline authority, RMSE, interaction behavior, review, or completion.',
      'The sprite-787 Canvas adapter deliberately remains English-only. Its 1-641 lead-in, frame 642 AVM1 state, frames 643-653, and every interaction scenario remain outside this disposition and fail closed for Spanish.'
    ],
    generatedFrom: {
      generator: {
        path: 'scripts/build-gs002-root-bilingual-visual-disposition.mjs',
        sha256: sha256(generatorBytes)
      },
      sourceSwf: {
        path: GS002_SOURCE_SWF,
        sha256: sha256(sourceSwfBytes),
        bytes: sourceSwfBytes.length
      },
      sameLessonHost: {
        path: GS002_SOURCE_HOST,
        sha256: sha256(sourceHostBytes),
        bytes: sourceHostBytes.length,
        executionClaimed: false
      },
      courseXml: {
        path: GS002_COURSE_XML,
        sha256: sha256(courseXmlBytes),
        bytes: courseXmlBytes.length
      },
      spanishAudio: {
        path: GS002_SPANISH_AUDIO,
        sha256: sha256(spanishAudioBytes),
        bytes: spanishAudioBytes.length,
        rendered: false,
        accepted: false
      },
      ffdecScripts: {
        path: inputPaths.ffdecScripts,
        sha256: sha256(ffdecBytes),
        uncompressedSha256: sha256(ffdecText),
        exportedScriptBlockCount: validated.scriptBlockCount
      },
      scenarioInventory: {
        path: inputPaths.scenarioInventory,
        sha256: sha256(scenarioInventoryBytes)
      },
      rootStructuralReport: {
        path: inputPaths.rootStructuralReport,
        sha256: sha256(rootStructuralReportBytes),
        authority: rootStructuralReport.authority.kind,
        status: rootStructuralReport.status
      },
      spriteCanvasAdapterSpec: {
        path: inputPaths.spriteCanvasAdapterSpec,
        sha256: sha256(spriteCanvasAdapterSpecBytes),
        supportedLanguages: ['en'],
        spanishScopeRemainsBlocked: true
      },
      rootFrames
    },
    sourceFindings: {
      rootTimeline: {
        timelineId: validated.rootTimeline.timelineId,
        frameCount: validated.rootTimeline.frameCount
      },
      nestedTimeline: {
        timelineId: validated.spriteTimeline.timelineId,
        frameCount: validated.spriteTimeline.frameCount,
        lastStaticDrawingCandidateFrame: 641,
        avm1InitializationFrame: 642,
        firstQuestionFrame: 643,
        finalFrame: 653
      },
      coursePlacement: {
        swfPath: validated.gsSection.pages[0].path,
        pageTitle: validated.gsSection.pages[0].attributes.Title,
        englishSectionTitle: validated.gsSection.titles.english,
        spanishSectionTitle: validated.gsSection.titles.spanish
      },
      languageSensitiveActionScriptMatches:
        validated.languageSensitiveActionScriptMatches
    },
    implementationDisposition: {
      rootFrameAdapter: {
        frameDomain: 'root',
        scenario: 'root-standalone',
        supportedLanguages: ['en', 'es'],
        firstFrame: 1,
        lastFrame: 10,
        frameCount: 10,
        status: 'ready',
        visualClassification: GS002_VISUAL_LOCALIZATION,
        renderSameSourcePixelsForBothLanguages: true,
        spanishTranslationSupplied: false
      },
      sourceSharedRequirements: [GS002_SOURCE_SHARED_REQUIREMENT],
      newlyRenderableFrameCount: GS002_SOURCE_SHARED_REQUIREMENT.frameCount,
      spriteCanvasAdapter: {
        frameDomain: 'sprite-787',
        supportedLanguages: ['en'],
        spanishStatus: 'blocked',
        spanishLeadInFrames1Through641Ready: false,
        frame642Ready: false,
        frames643Through653Ready: false,
        blockedScenarios: blockedSpriteScenarios
      },
      audioRendered: false,
      audioStatus:
        'pending-authoritative-listening-language-mapping-cue-synchronization-and-replay',
      hostIntegrationStatus: 'blocked-not-authoritatively-executed'
    },
    acceptanceEffects: {
      authoritativeOriginalRuntimeBaseline: false,
      bilingualVisualParity: false,
      spanishTranslationAccepted: false,
      audioAcceptance: false,
      naturalOriginalRuntimeTraversal: false,
      interactionBehaviorParity: false,
      scoringParity: false,
      replayParity: false,
      fullFrameCoverage: false,
      rmseAcceptance: false,
      humanVisualReview: false,
      engineeringAcceptance: false,
      ownerAcceptance: false,
      strictMigrationCompletion: false
    },
    strictAcceptanceEffect:
      'none; this evidence permits only root/root-standalone frames 1-10 to render identical source pixels for en/es. The sprite-787 lead-in and all AVM1/interaction states remain outside the Spanish disposition and blocked; translation, audio, original-runtime baseline, RMSE, reviews, owner acceptance, and completion remain unresolved.'
  };
}

export function serializeGs002RootBilingualVisualDisposition(report) {
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
      'Usage: node scripts/build-gs002-root-bilingual-visual-disposition.mjs [--check]'
    );
    return;
  }
  const serialized = serializeGs002RootBilingualVisualDisposition(
    await buildGs002RootBilingualVisualDisposition()
  );
  if (options.check) {
    const current = await readFile(absolute(GS002_OUTPUT), 'utf8');
    if (current !== serialized) throw new Error(`${GS002_OUTPUT} is stale`);
    console.log(`GS002 root bilingual visual disposition is current: ${GS002_OUTPUT}`);
    return;
  }
  await writeFile(absolute(GS002_OUTPUT), serialized);
  console.log(`Wrote ${GS002_OUTPUT}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
