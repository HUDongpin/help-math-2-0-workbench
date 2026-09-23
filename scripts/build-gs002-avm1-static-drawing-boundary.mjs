#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gunzipSync} from 'node:zlib';

import {
  collectImplementationArtifactClosure,
  implementationArtifactClosureErrors
} from './implementation-artifact-closure.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), '..');

export const ANIMATION_ID = 'course-g04-l09-gs-002';
export const MIGRATION_ROOT = `migrations/${ANIMATION_ID}`;
export const OUTPUT_PATH = `${MIGRATION_ROOT}/audit/avm1-static-drawing-boundary.json`;
export const SOURCE_SWF =
  'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L9/GS/L9GS02.swf';
export const SOURCE_SWF_SHA256 =
  '41cdb7e5cc5735eef2af3e4831908c47781840f0addcc3ac1a2142cbb0d48f15';
export const FFDEC_SCRIPTS = `${MIGRATION_ROOT}/audit/machine/ffdec-scripts.txt.gz`;
export const FFDEC_SCRIPTS_SHA256 =
  'eb6a87a913b2d9d88f8aef8dbffb3623d3f3dcaac2c38569144fef532a595b72';

const inputPaths = Object.freeze({
  scenarioInventory: `${MIGRATION_ROOT}/audit/scenario-inventory.json`,
  canvasAdapterSpec: `${MIGRATION_ROOT}/audit/canvas-adapter-spec.json`,
  canvasManifest: `public/flash-assets/courses/${ANIMATION_ID}/manifest.json`,
  rendererAudit: `${MIGRATION_ROOT}/audit/renderer-frame-domain-support.json`,
  migrationManifest: `${MIGRATION_ROOT}/migration.json`,
  adoption: `${MIGRATION_ROOT}/evidence/current-javascript-implementation-capture-adoption.json`,
  module: `packages/demos/src/modules/${ANIMATION_ID}.tsx`,
  timeline: `packages/demos/src/timelines/${ANIMATION_ID}.ts`
});

const expectedCaptureRequirements = Object.freeze(new Map([
  ['req:root:root-standalone:en', 10],
  ['req:root:root-standalone:es', 10],
  ['req:sprite-787:source-drawing-lead-in:en:partial-frames-1-641', 641]
]));

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function absolute(relativePath) {
  const resolved = path.resolve(projectRoot, relativePath);
  invariant(
    resolved === projectRoot || resolved.startsWith(`${projectRoot}${path.sep}`),
    `Path escapes project root: ${relativePath}`
  );
  return resolved;
}

function jsonText(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function extractFfdecScriptBlocks(source) {
  const blocks = new Map();
  for (const chunk of source.split(/^===== /m).slice(1)) {
    const marker = chunk.indexOf(' =====\n');
    invariant(marker > 0, 'GS002 FFDec scripts contain a malformed block marker');
    const name = chunk.slice(0, marker);
    invariant(!blocks.has(name), `GS002 FFDec scripts repeat ${name}`);
    blocks.set(name, chunk.slice(marker + ' =====\n'.length).trim());
  }
  return blocks;
}

function requireAll(source, fragments, label) {
  for (const fragment of fragments) {
    invariant(source.includes(fragment), `${label} no longer contains ${JSON.stringify(fragment)}`);
  }
}

export function validateStaticDrawingBoundary({
  ffdecText,
  scenarioInventory,
  canvasAdapterSpec,
  canvasManifest,
  rendererAudit
}) {
  const blocks = extractFfdecScriptBlocks(ffdecText);
  invariant(blocks.size === 66, 'GS002 complete FFDec script-block count changed');

  const frame642Name = 'DefineSprite_787/frame_642/DoAction.as';
  const frame642 = blocks.get(frame642Name);
  invariant(frame642, `${frame642Name} is missing`);
  requireAll(frame642, [
    'stop();',
    'Mc_Popup._visible = false;',
    '_global.quizSection = true;',
    '_global.correctSelect = 0;',
    '_global.totQuizCount = 0;',
    '_global.quizLabelArray = ["Q1","Q2","Q3","Q4","Q5","Q6","Q7","Q8","Q9","Q10"];',
    'while(i <= 8)',
    'eval("Robos_" + i)._visible = false;',
    'eval("Robos_" + i).gotoAndStop(1);',
    '_loc1_.tempQNo = random(_loc1_.quizLabelArray.length);',
    'gotoAndStop(_loc1_.qLabelName);',
    'if(_global.startGame)'
  ], frame642Name);

  const questionScripts = [];
  for (let frame = 643; frame <= 652; frame += 1) {
    const name = `DefineSprite_787/frame_${frame}/DoAction.as`;
    const source = blocks.get(name);
    invariant(source, `${name} is missing`);
    requireAll(source, [
      'stop();',
      '_global.counting++;',
      'Mc_Quest_Main.txtQNo.text = _global.counting + ".";'
    ], name);
    questionScripts.push({frame, name, sha256: sha256(source)});
  }
  const frame653Name = 'DefineSprite_787/frame_653/DoAction.as';
  const frame653 = blocks.get(frame653Name);
  invariant(frame653 === 'stop();', `${frame653Name} must remain an exact stop action`);

  invariant(
    scenarioInventory?.animationId === ANIMATION_ID &&
      scenarioInventory?.source?.swf === SOURCE_SWF &&
      scenarioInventory?.source?.swfSha256 === SOURCE_SWF_SHA256,
    'GS002 scenario inventory source binding changed'
  );
  const sprite = scenarioInventory.timelineInventory?.find(
    ({timelineId}) => timelineId === 'sprite-787'
  );
  invariant(sprite?.frameCount === 653, 'GS002 sprite-787 frame count changed');
  invariant(
    sprite.controlStates?.some(
      ({frame, reasons}) => frame === 642 && reasons.includes('script-stop-state')
    ),
    'GS002 frame 642 script-stop boundary disappeared'
  );
  invariant(
    sprite.controlStates?.some(
      ({frame, reasons}) => frame === 653 && reasons.includes('terminal-structural-frame')
    ),
    'GS002 frame 653 terminal structural boundary disappeared'
  );

  invariant(
    canvasAdapterSpec?.animationId === ANIMATION_ID &&
      canvasAdapterSpec?.source?.swfSha256 === SOURCE_SWF_SHA256 &&
      canvasAdapterSpec?.timeline?.local?.timelineId === 'sprite-787' &&
      canvasAdapterSpec?.timeline?.local?.frameCount === 653,
    'GS002 Canvas adapter specification source or physical timeline changed'
  );
  invariant(
    JSON.stringify(canvasAdapterSpec.runtimeContract?.supportedLanguages) === JSON.stringify(['en']),
    'GS002 Canvas adapter must remain English-only'
  );
  requireAll(
    canvasAdapterSpec.runtimeContract?.unresolved?.join('\n') || '',
    [
      'Frames 1 through 641 are source drawings',
      'stopped states 642 through 653 require AVM1 game/question state',
      'Fourteen button targets, random selection, correct/wrong feedback, scoring, ten questions'
    ],
    'GS002 Canvas adapter unresolved boundary'
  );

  invariant(
    canvasManifest?.animationId === ANIMATION_ID &&
      canvasManifest?.inputs?.sourceSwf?.sha256 === SOURCE_SWF_SHA256 &&
      canvasManifest?.timeline?.deterministicContentTimeline?.frameCount === 653,
    'GS002 Canvas manifest source or physical timeline changed'
  );
  invariant(
    canvasManifest.safety?.noLegacyActionScriptExecuted === true &&
      canvasManifest.timeline?.deterministicContentTimeline?.stateCoverage ===
        'static-source-drawing-only',
    'GS002 Canvas adapter no longer has a static/no-AVM1 authority boundary'
  );

  invariant(rendererAudit?.animationId === ANIMATION_ID, 'GS002 renderer audit identity changed');
  invariant(
    rendererAudit.summary?.probeCount === 28 &&
      rendererAudit.summary?.renderableCount === 5 &&
      rendererAudit.summary?.blockedCount === 23 &&
      rendererAudit.summary?.exactIdentityCount === 28,
    'GS002 renderer audit must remain exactly 5 renderable / 23 blocked / 28 exact probes'
  );
  const leadInTerminal = rendererAudit.probes?.find(
    ({request}) =>
      request?.frameDomain === 'sprite-787' &&
      request?.scenario === 'source-drawing-lead-in' &&
      request?.language === 'en' &&
      request?.frame === 653
  );
  invariant(
    leadInTerminal?.outcome === 'blocked-not-renderable' &&
      leadInTerminal?.actual?.blocker === 'question-final-avm1-state-unresolved',
    'GS002 physical frame 653 must remain blocked by the pure renderer state'
  );

  return {
    frame642: {name: frame642Name, sha256: sha256(frame642)},
    questionScripts,
    frame653: {name: frame653Name, sha256: sha256(frame653)},
    scriptBlockCount: blocks.size
  };
}

async function readDescriptor(relativePath) {
  const bytes = await readFile(absolute(relativePath));
  return {path: relativePath, bytes: bytes.length, sha256: sha256(bytes), bytesValue: bytes};
}

async function validateCaptureClosure({adoption, currentClosure}) {
  invariant(adoption?.animationId === ANIMATION_ID, 'GS002 adoption identity changed');
  invariant(
    adoption?.summary?.requirementCount === 3 &&
      adoption?.summary?.capturedFrameCount === 661 &&
      adoption?.summary?.currentJavascriptPhysicalCoveredFrameCount === 661 &&
      adoption?.summary?.validationErrors === 0,
    'GS002 adoption must retain exactly 3 requirements / 661 current-JS frames / 0 errors'
  );
  invariant(adoption.requirements?.length === 3, 'GS002 adoption requirement count changed');

  const captures = [];
  let totalFrames = 0;
  for (const requirement of adoption.requirements) {
    const expectedFrames = expectedCaptureRequirements.get(requirement.requirementId);
    invariant(expectedFrames, `GS002 adoption contains an unexpected requirement ${requirement.requirementId}`);
    const descriptor = await readDescriptor(requirement.captureManifest.path);
    invariant(
      descriptor.sha256 === requirement.captureManifest.sha256,
      `${requirement.requirementId} capture-manifest SHA-256 changed`
    );
    const capture = JSON.parse(descriptor.bytesValue);
    invariant(
      capture.schemaVersion === 4 &&
        capture.status === 'complete' &&
        capture.animationId === ANIMATION_ID &&
        capture.requirementId === requirement.requirementId &&
        capture.captured?.length === expectedFrames,
      `${requirement.requirementId} is not the expected complete schema-v4 capture`
    );
    const closureErrors = implementationArtifactClosureErrors(
      capture.implementationArtifactClosure,
      currentClosure
    );
    invariant(
      closureErrors.length === 0,
      `${requirement.requirementId} implementation closure is stale: ${closureErrors.join('; ')}`
    );
    totalFrames += expectedFrames;
    captures.push({
      requirementId: requirement.requirementId,
      captureManifest: {
        path: descriptor.path,
        bytes: descriptor.bytes,
        sha256: descriptor.sha256
      },
      capturedFrameCount: expectedFrames,
      implementationArtifactClosureSha256: currentClosure.aggregateSha256
    });
  }
  invariant(totalFrames === 661, 'GS002 current-JS capture total must remain 661 frames');
  invariant(captures.length === expectedCaptureRequirements.size, 'GS002 capture set is incomplete');
  return captures.sort((left, right) => left.requirementId.localeCompare(right.requirementId));
}

export async function buildGs002Avm1StaticDrawingBoundary() {
  const descriptors = Object.fromEntries(
    await Promise.all(
      Object.entries(inputPaths).map(async ([key, relativePath]) => [key, await readDescriptor(relativePath)])
    )
  );
  const [generator, sourceSwf, ffdecScripts] = await Promise.all([
    readDescriptor('scripts/build-gs002-avm1-static-drawing-boundary.mjs'),
    readDescriptor(SOURCE_SWF),
    readDescriptor(FFDEC_SCRIPTS)
  ]);
  invariant(sourceSwf.sha256 === SOURCE_SWF_SHA256, 'GS002 preserved SWF SHA-256 changed');
  invariant(ffdecScripts.sha256 === FFDEC_SCRIPTS_SHA256, 'GS002 FFDec script archive SHA-256 changed');

  const ffdecText = gunzipSync(ffdecScripts.bytesValue).toString('utf8');
  const parsed = Object.fromEntries(
    ['scenarioInventory', 'canvasAdapterSpec', 'canvasManifest', 'rendererAudit', 'migrationManifest', 'adoption']
      .map((key) => [key, JSON.parse(descriptors[key].bytesValue)])
  );
  const sourceFacts = validateStaticDrawingBoundary({
    ffdecText,
    scenarioInventory: parsed.scenarioInventory,
    canvasAdapterSpec: parsed.canvasAdapterSpec,
    canvasManifest: parsed.canvasManifest,
    rendererAudit: parsed.rendererAudit
  });

  const canvasScript = await readDescriptor(parsed.canvasManifest.output.script);
  invariant(
    canvasScript.sha256 === parsed.canvasManifest.output.sha256 &&
      canvasScript.bytes === parsed.canvasManifest.output.bytes,
    'GS002 Canvas output differs from its hash-bound manifest'
  );
  const currentClosure = await collectImplementationArtifactClosure({
    projectRoot,
    workspace: absolute(MIGRATION_ROOT),
    manifest: parsed.migrationManifest
  });
  const captures = await validateCaptureClosure({
    adoption: parsed.adoption,
    currentClosure
  });

  const compactDescriptor = ({path: filePath, bytes, sha256: digest}) => ({
    path: filePath,
    bytes,
    sha256: digest
  });
  return {
    schemaVersion: 1,
    evidenceType: 'gs002-avm1-static-drawing-natural-state-boundary',
    status: 'verified-static-drawing-is-not-natural-game-state',
    animationId: ANIMATION_ID,
    generatedBy: compactDescriptor(generator),
    source: compactDescriptor(sourceSwf),
    evidence: {
      ffdecScripts: {
        ...compactDescriptor(ffdecScripts),
        uncompressedSha256: sha256(ffdecText),
        exportedScriptBlockCount: sourceFacts.scriptBlockCount
      },
      scenarioInventory: compactDescriptor(descriptors.scenarioInventory),
      canvasAdapterSpec: compactDescriptor(descriptors.canvasAdapterSpec),
      canvasManifest: compactDescriptor(descriptors.canvasManifest),
      canvasScript: compactDescriptor(canvasScript),
      rendererAudit: compactDescriptor(descriptors.rendererAudit),
      module: compactDescriptor(descriptors.module),
      timeline: compactDescriptor(descriptors.timeline),
      adoption: compactDescriptor(descriptors.adoption)
    },
    sourceScriptFacts: {
      frame642: {
        ...sourceFacts.frame642,
        stop: true,
        initializesQuizGlobals: true,
        initializesTenQuestionLabels: true,
        hidesPopup: true,
        hidesAndRewindsEightRobots: true,
        installsStartGameEnterFrameRandomDispatch: true
      },
      frames643Through652: {
        frameCount: sourceFacts.questionScripts.length,
        scripts: sourceFacts.questionScripts,
        eachStopsAndMutatesGlobalQuestionCounter: true,
        eachWritesDynamicQuestionNumberText: true
      },
      frame653: {...sourceFacts.frame653, stop: true}
    },
    authorityBoundary: {
      staticCanvasPhysicalFrameRange: {firstFrame: 1, lastFrame: 653},
      currentJavascriptAdmittedLeadInRange: {firstFrame: 1, lastFrame: 641},
      avm1DependentUnresolvedRange: {firstFrame: 642, lastFrame: 653},
      actionScriptExecutedByStaticCanvas: false,
      conclusion:
        'The FFDec Canvas can draw raw physical display-list frames 642-653, but it does not execute the frame scripts that hide objects, initialize/randomize game state, increment question counters, or compose feedback. Those drawings cannot represent natural question, answer, scoring, Final, Replay, glossary, routing, audio, or Spanish states.'
    },
    rendererProbeSnapshot: {
      probeCount: 28,
      exactIdentityCount: 28,
      renderableCount: 5,
      blockedCount: 23,
      implementationChangedByThisAudit: false
    },
    captureClosureSnapshot: {
      requirementCount: 3,
      capturedFrameCount: 661,
      implementationArtifactClosureSha256: currentClosure.aggregateSha256,
      captures,
      adoptionChangedByThisAudit: false
    },
    retainedBlockers: [
      'Question order and random outcomes require an authorized original-runtime natural trace.',
      'Correct/wrong feedback, enabled targets, retry/continuation, progress, score, and Final require authoritative runtime state.',
      'Replay, glossary, course routing, source audio, Spanish visual/audio behavior, and owner/human acceptance remain unresolved.'
    ],
    acceptanceEffects: {
      originalRuntimeBaseline: false,
      rmseAcceptance: false,
      visualOrBehavioralParity: false,
      audioAcceptance: false,
      humanVisualReview: false,
      ownerAcceptance: false,
      migrationCompletion: false
    },
    strictAcceptanceEffect:
      'none; this audit preserves the current 5/28 renderer probe result and 3-requirement/661-frame current-JavaScript capture set while proving why physical drawings 642-653 remain fail-closed'
  };
}

export function serializeGs002Avm1StaticDrawingBoundary(report) {
  return jsonText(report);
}

function parseArguments(argumentsList) {
  const options = {check: false, json: false};
  for (const argument of argumentsList) {
    if (argument === '--check') options.check = true;
    else if (argument === '--json') options.json = true;
    else if (argument === '--help' || argument === '-h') options.help = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log('Usage: node scripts/build-gs002-avm1-static-drawing-boundary.mjs [--check] [--json]');
    return;
  }
  const report = await buildGs002Avm1StaticDrawingBoundary();
  const serialized = serializeGs002Avm1StaticDrawingBoundary(report);
  if (options.check) {
    const existing = await readFile(absolute(OUTPUT_PATH), 'utf8');
    invariant(existing === serialized, `${OUTPUT_PATH} is stale`);
  } else {
    await writeFile(absolute(OUTPUT_PATH), serialized);
  }
  if (options.json) process.stdout.write(serialized);
  else console.log(`${options.check ? 'Verified' : 'Wrote'} ${OUTPUT_PATH}`);
}

if (path.resolve(process.argv[1] || '') === scriptPath) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

