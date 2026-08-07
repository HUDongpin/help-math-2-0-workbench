#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), '..');

export const IR001_ANIMATION_ID = 'course-g04-l01-ir-001';
export const IR001_SOURCE_SWF =
  'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L1/IR/L1RW01.swf';
export const IR001_SOURCE_SWF_SHA256 =
  'b21b16d1e5756820b5703136708f625dcc3a324d629b2337b1dc42af64559e46';
export const IR001_MIGRATION_ROOT = `migrations/${IR001_ANIMATION_ID}`;
export const IR001_OUTPUT =
  `${IR001_MIGRATION_ROOT}/audit/bilingual-visual-source-disposition.json`;

const inputPaths = Object.freeze({
  ffdecScripts: `${IR001_MIGRATION_ROOT}/audit/machine/ffdec-scripts.txt.gz`,
  scenarioInventory: `${IR001_MIGRATION_ROOT}/audit/scenario-inventory.json`,
  staticDisposition:
    `${IR001_MIGRATION_ROOT}/audit/static-frame-domain-disposition-evidence.json`,
  canvasManifest: `public/flash-assets/courses/${IR001_ANIMATION_ID}/manifest.json`
});

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function absolute(relativePath) {
  return path.join(projectRoot, relativePath);
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(absolute(relativePath), 'utf8'));
}

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

export function extractFfdecScriptBlocks(source) {
  const blocks = new Map();
  for (const chunk of source.split(/^===== /m).slice(1)) {
    const marker = chunk.indexOf(' =====\n');
    requireValue(marker > 0, 'FFDec script export contains a malformed block marker');
    blocks.set(chunk.slice(0, marker), chunk.slice(marker + ' =====\n'.length).trim());
  }
  return blocks;
}

export function validateIr001SourceSharedVisualInputs({
  ffdecText,
  scenarioInventory,
  staticDisposition,
  canvasManifest
}) {
  requireValue(
    scenarioInventory?.animationId === IR001_ANIMATION_ID,
    'scenario inventory animationId is not IR001'
  );
  requireValue(
    scenarioInventory?.source?.swfSha256 === IR001_SOURCE_SWF_SHA256,
    'scenario inventory source SWF hash is stale'
  );

  const mainTimeline = scenarioInventory.timelineInventory?.find(
    ({timelineId}) => timelineId === 'sprite-58'
  );
  requireValue(mainTimeline?.frameCount === 142, 'sprite-58 must retain 142 frames');
  const soundPlacements = (mainTimeline.namedPlacements ?? [])
    .filter(({name}) => name === 'Mc_Sound_0' || name === 'Mc_Sound_1')
    .map(({frame, hasClipActions, name, objectId}) => ({
      frame,
      hasClipActions,
      name,
      objectId
    }));
  requireValue(
    JSON.stringify(soundPlacements) === JSON.stringify([
      {frame: 1, hasClipActions: false, name: 'Mc_Sound_0', objectId: '7'},
      {frame: 1, hasClipActions: false, name: 'Mc_Sound_1', objectId: '8'}
    ]),
    'sprite-58 sound placements no longer match the source-only random branch'
  );

  const scriptBlocks = extractFfdecScriptBlocks(ffdecText);
  const expectedScripts = new Map([
    [
      'DefineSprite_58/frame_1/DoAction.as',
      'tempNum = random(2);\n_global.tempRandomSoundMc = "Mc_Sound_" + tempNum;'
    ],
    [
      'DefineSprite_58/frame_5/DoAction.as',
      'eval(_global.tempRandomSoundMc).gotoAndPlay(2);'
    ],
    ['DefineSprite_58/frame_142/DoAction.as', 'stop();']
  ]);
  for (const [script, expected] of expectedScripts) {
    requireValue(
      scriptBlocks.get(script) === expected,
      `${script} no longer matches the audited source branch`
    );
  }

  const languageSensitiveScriptMatches =
    ffdecText.match(/\b(?:english|spanish|language|lang)\b/gi) ?? [];
  requireValue(
    languageSensitiveScriptMatches.length === 0,
    'IR001 SWF ActionScript now contains a language-sensitive branch'
  );

  requireValue(
    staticDisposition?.animationId === IR001_ANIMATION_ID &&
      staticDisposition?.status === 'verified-static-composite-claims',
    'static frame-domain disposition is missing or unverified'
  );
  const soundClaims = ['sprite-7', 'sprite-8'].map((timelineId) => {
    const claim = staticDisposition.claims?.find(
      (candidate) => candidate.timelineId === timelineId
    );
    requireValue(claim, `${timelineId} static disposition claim is missing`);
    requireValue(
      claim.disposition === 'composite-child-with-parent' &&
        claim.role === 'audio-only-offstage-visual-marker' &&
        claim.visualBounds?.nativeStageIntersection === false,
      `${timelineId} is no longer proven to be an off-stage audio-only visual branch`
    );
    requireValue(
      claim.preservedObligations?.audio?.required === true &&
        claim.preservedObligations?.audio?.satisfiedByDisposition === false &&
        claim.preservedObligations?.behavior?.required === true &&
        claim.preservedObligations?.behavior?.satisfiedByDisposition === false,
      `${timelineId} must preserve unresolved audio and behavior obligations`
    );
    return claim;
  });

  requireValue(
    canvasManifest?.inputs?.sourceSwf?.sha256 === IR001_SOURCE_SWF_SHA256,
    'Canvas manifest source SWF hash is stale'
  );
  requireValue(
    canvasManifest?.safety?.noLegacyActionScriptExecuted === true &&
      canvasManifest?.safety?.noDynamicEvaluation === true &&
      canvasManifest?.safety?.noNetworkPrimitives === true &&
      canvasManifest?.safety?.noTimersOrAutoplay === true,
    'Canvas adapter safety contract is incomplete'
  );

  return {
    languageSensitiveScriptMatches,
    mainTimeline,
    soundClaims,
    soundPlacements,
    sourceScripts: [...expectedScripts].map(([script, body]) => ({
      script,
      bodySha256: sha256(body)
    }))
  };
}

export async function buildIr001BilingualVisualDisposition() {
  const [
    sourceSwfBytes,
    ffdecBytes,
    scenarioInventoryBytes,
    staticDispositionBytes,
    canvasManifestBytes
  ] = await Promise.all([
    readFile(absolute(IR001_SOURCE_SWF)),
    readFile(absolute(inputPaths.ffdecScripts)),
    readFile(absolute(inputPaths.scenarioInventory)),
    readFile(absolute(inputPaths.staticDisposition)),
    readFile(absolute(inputPaths.canvasManifest))
  ]);
  requireValue(
    sha256(sourceSwfBytes) === IR001_SOURCE_SWF_SHA256,
    'preserved IR001 SWF hash does not match the pinned source'
  );

  const ffdecText = gunzipSync(ffdecBytes).toString('utf8');
  const scenarioInventory = JSON.parse(scenarioInventoryBytes);
  const staticDisposition = JSON.parse(staticDispositionBytes);
  const canvasManifest = JSON.parse(canvasManifestBytes);
  const validated = validateIr001SourceSharedVisualInputs({
    ffdecText,
    scenarioInventory,
    staticDisposition,
    canvasManifest
  });

  const canvasScriptPath = canvasManifest.output?.script;
  requireValue(
    typeof canvasScriptPath === 'string' &&
      /^[a-f0-9]{64}$/.test(canvasManifest.output?.sha256 ?? ''),
    'Canvas manifest output binding is incomplete'
  );
  const canvasScriptBytes = await readFile(absolute(canvasScriptPath));
  requireValue(
    sha256(canvasScriptBytes) === canvasManifest.output.sha256,
    'Canvas adapter output hash is stale'
  );

  return {
    schemaVersion: 1,
    evidenceType: 'source-shared-bilingual-visual-disposition',
    animationId: IR001_ANIMATION_ID,
    status: 'verified-source-shared-untranslated-visual',
    migrationStatusChanged: false,
    authorityStatement: [
      'The preserved IR001 SWF contains one fixed visual timeline. Its only source random branch selects between Mc_Sound_0 and Mc_Sound_1.',
      'Hash-bound static source evidence proves both selected sound timelines have only off-stage visual markers and retain unresolved audio and natural-runtime behavior obligations.',
      'The complete extracted SWF ActionScript contains no English, Spanish, language, or lang branch. Rendering the same source drawing in en and es is source preservation, not a Spanish translation or original-host parity claim.'
    ],
    generatedFrom: {
      sourceSwf: {
        path: IR001_SOURCE_SWF,
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
      canvasAdapter: {
        manifestPath: inputPaths.canvasManifest,
        manifestSha256: sha256(canvasManifestBytes),
        scriptPath: canvasScriptPath,
        scriptSha256: sha256(canvasScriptBytes)
      }
    },
    sourceFindings: {
      mainTimeline: {
        timelineId: validated.mainTimeline.timelineId,
        frameCount: validated.mainTimeline.frameCount
      },
      randomSelectionChangesOnlySoundTimeline: true,
      soundPlacements: validated.soundPlacements,
      soundTimelineClaims: validated.soundClaims.map((claim) => ({
        timelineId: claim.timelineId,
        role: claim.role,
        disposition: claim.disposition,
        nativeStageIntersection: claim.visualBounds.nativeStageIntersection
      })),
      sourceScripts: validated.sourceScripts,
      languageSensitiveActionScriptMatches: validated.languageSensitiveScriptMatches
    },
    implementationDisposition: {
      languages: ['en', 'es'],
      visualClassification: 'source-shared-untranslated-visual',
      renderSameSourceVisualForBothLanguages: true,
      audioRendered: false,
      audioStatus: 'pending-authoritative-listening-language-mapping-and-synchronization',
      hostIntegrationStatus: 'blocked-not-reconstructed'
    },
    acceptanceEffects: {
      authoritativeOriginalRuntimeBaseline: false,
      bilingualVisualParity: false,
      audioAcceptance: false,
      naturalOriginalRuntimeTraversal: false,
      behaviorParity: false,
      fullFrameCoverage: false,
      rmseAcceptance: false,
      humanVisualReview: false,
      engineeringAcceptance: false,
      ownerAcceptance: false,
      strictMigrationCompletion: false
    },
    strictAcceptanceEffect:
      'none; this evidence permits only the same source visual to render in both requested language contexts. Spanish translation, audio, original-host behavior, full-frame/RMSE, human review, owner acceptance, and migration completion remain unresolved.'
  };
}

export function serializeIr001BilingualVisualDisposition(report) {
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
      'Usage: node scripts/build-ir001-bilingual-visual-disposition.mjs [--check]'
    );
    return;
  }
  const serialized = serializeIr001BilingualVisualDisposition(
    await buildIr001BilingualVisualDisposition()
  );
  if (options.check) {
    const current = await readFile(absolute(IR001_OUTPUT), 'utf8');
    if (current !== serialized) {
      throw new Error(`${IR001_OUTPUT} is stale`);
    }
    console.log(`IR001 bilingual visual disposition is current: ${IR001_OUTPUT}`);
    return;
  }
  await writeFile(absolute(IR001_OUTPUT), serialized);
  console.log(`Wrote ${IR001_OUTPUT}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
