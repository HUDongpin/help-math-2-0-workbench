#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), '..');

export const TS008_ANIMATION_ID = 'course-g03-l01-ts-008';
export const TS008_SOURCE_SWF =
  'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L1/TS/L1TS08.swf';
export const TS008_SOURCE_SWF_SHA256 =
  '9749ae5f4d533379aa58531e541ffd5da1624bc8fcea38660d54d0f5d3ddc29b';
export const TS008_MIGRATION_ROOT = `migrations/${TS008_ANIMATION_ID}`;
export const TS008_OUTPUT =
  `${TS008_MIGRATION_ROOT}/audit/bilingual-visual-source-disposition.json`;
export const SOURCE_SHARED_VISUAL_LOCALIZATION =
  'single-source-drawing-timeline-with-embedded-english-title-and-no-language-branch; es preserves source pixels without claiming translation';

const inputPaths = Object.freeze({
  ffdecScripts: `${TS008_MIGRATION_ROOT}/audit/machine/ffdec-scripts.txt.gz`,
  scenarioInventory: `${TS008_MIGRATION_ROOT}/audit/scenario-inventory.json`
});

const sourceSharedRequirements = Object.freeze([
  Object.freeze({
    requirementId: 'req:root:root-standalone:es',
    frameDomainId: 'root',
    scenario: 'root-standalone',
    language: 'es',
    firstFrame: 1,
    lastFrame: 10,
    frameCount: 10
  }),
  Object.freeze({
    requirementId: 'req:sprite-348:source-drawing-default:es',
    frameDomainId: 'sprite-348',
    scenario: 'source-drawing-default',
    language: 'es',
    firstFrame: 1,
    lastFrame: 747,
    frameCount: 747
  })
]);

const blockedInteractionScenarios = Object.freeze([
  'answer-correct-unavailable',
  'answer-first-wrong-unavailable',
  'answer-second-wrong-unavailable',
  'glossary-popup-unavailable',
  'completion-scoring-replay-unavailable'
]);

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function absolute(relativePath) {
  return path.join(projectRoot, relativePath);
}

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

function languageSensitiveMatches(value) {
  return value.match(/\b(?:english|spanish|language|lang)\b/gi) ?? [];
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

export function validateTs008SourceSharedVisualInputs({
  ffdecText,
  scenarioInventory
}) {
  requireValue(
    scenarioInventory?.animationId === TS008_ANIMATION_ID,
    'scenario inventory animationId is not TS008'
  );
  requireValue(
    scenarioInventory?.source?.swfSha256 === TS008_SOURCE_SWF_SHA256,
    'scenario inventory source SWF hash is stale'
  );
  requireValue(
    scenarioInventory?.source?.pairedFlaStatus === 'missing',
    'TS008 paired-FLA status changed and requires a new evidence review'
  );

  const root = scenarioInventory.timelineInventory?.find(
    ({timelineId}) => timelineId === 'root'
  );
  const main = scenarioInventory.timelineInventory?.find(
    ({timelineId}) => timelineId === 'sprite-348'
  );
  requireValue(root?.frameCount === 10, 'TS008 root timeline must retain 10 frames');
  requireValue(main?.frameCount === 747, 'TS008 sprite-348 must retain 747 frames');

  const scriptBlocks = extractFfdecScriptBlocks(ffdecText);
  requireValue(
    scriptBlocks.size === scenarioInventory.staticExtraction?.ffdecExportedScriptCount,
    'complete FFDec script-block count no longer matches the scenario inventory'
  );
  const languageSensitiveActionScriptMatches = languageSensitiveMatches(ffdecText);
  requireValue(
    languageSensitiveActionScriptMatches.length === 0,
    'TS008 SWF ActionScript now contains a language-sensitive branch'
  );

  const editTexts = scenarioInventory.interactions?.editTexts ?? [];
  requireValue(
    editTexts.length === 0,
    'TS008 now exposes dynamic EditText content that requires language-specific review'
  );

  const dependencyBindings = (scenarioInventory.dependencies?.bindings ?? [])
    .map(({binding}) => binding)
    .filter((binding) => languageSensitiveMatches(binding ?? '').length > 0);
  requireValue(
    dependencyBindings.length === 0,
    'TS008 host dependencies now include a language-sensitive binding'
  );
  const languageFlashVars = (scenarioInventory.dependencies?.flashVarsCandidates ?? [])
    .map(({binding}) => binding)
    .filter((binding) => languageSensitiveMatches(binding ?? '').length > 0);
  requireValue(
    languageFlashVars.length === 0,
    'TS008 FlashVars candidates now include a language-sensitive binding'
  );

  const testSection = scenarioInventory.courseXml?.sections?.find(
    ({name}) => name === 'TS'
  );
  const page = testSection?.pages?.find(({path: pagePath}) => pagePath === 'TS/L1TS08.swf');
  const subpage = testSection?.subpages?.find(
    ({path: pagePath}) => pagePath === 'TS/L1TS08.swf'
  );
  requireValue(
    page?.attributes?.Title === 'Question 2',
    'TS008 English course page mapping changed'
  );
  requireValue(
    subpage?.attributes?.EngSubTitleName === 'Question 2' &&
      subpage?.attributes?.SpanSubTitleName === 'Pregunta 2' &&
      subpage?.attributes?.SubTitleButtonName === 'L1TS08',
    'TS008 bilingual shell-title mapping changed'
  );

  return {
    dependencyBindings,
    editTexts,
    languageFlashVars,
    languageSensitiveActionScriptMatches,
    main,
    page,
    root,
    scriptBlockCount: scriptBlocks.size,
    subpage
  };
}

export async function buildTs008BilingualVisualDisposition() {
  const [
    generatorBytes,
    sourceSwfBytes,
    ffdecBytes,
    scenarioInventoryBytes
  ] = await Promise.all([
    readFile(scriptPath),
    readFile(absolute(TS008_SOURCE_SWF)),
    readFile(absolute(inputPaths.ffdecScripts)),
    readFile(absolute(inputPaths.scenarioInventory))
  ]);
  requireValue(
    sha256(sourceSwfBytes) === TS008_SOURCE_SWF_SHA256,
    'preserved TS008 SWF hash does not match the pinned source'
  );

  const ffdecText = gunzipSync(ffdecBytes).toString('utf8');
  const scenarioInventory = JSON.parse(scenarioInventoryBytes);
  const validated = validateTs008SourceSharedVisualInputs({
    ffdecText,
    scenarioInventory
  });

  const courseXmlPath = scenarioInventory.courseXml?.artifact?.path;
  const courseXmlExpectedSha256 = scenarioInventory.courseXml?.artifact?.sha256;
  requireValue(
    typeof courseXmlPath === 'string' && /^[a-f0-9]{64}$/.test(courseXmlExpectedSha256 ?? ''),
    'scenario inventory course XML binding is incomplete'
  );
  const courseXmlBytes = await readFile(absolute(courseXmlPath));
  requireValue(
    sha256(courseXmlBytes) === courseXmlExpectedSha256,
    'source course XML hash no longer matches the scenario inventory'
  );

  return {
    schemaVersion: 1,
    evidenceType: 'source-shared-bilingual-visual-disposition',
    animationId: TS008_ANIMATION_ID,
    status: 'verified-source-shared-untranslated-visual',
    migrationStatusChanged: false,
    authorityStatement: [
      'The preserved Grade 3 Lesson 1 course XML routes both the English and Spanish shell labels for Question 2 to the same L1TS08.swf binary.',
      'The complete hash-bound FFDec ActionScript export contains no English, Spanish, language, or lang branch; the scenario inventory records no dynamic EditText and no language-sensitive host or FlashVars binding.',
      'Rendering the same fixed source drawing in en and es preserves source pixels only. It is not a Spanish translation, audio acceptance, original-host parity, natural interaction trace, or migration-completion claim.'
    ],
    generatedFrom: {
      generator: {
        path: 'scripts/build-ts008-bilingual-visual-disposition.mjs',
        sha256: sha256(generatorBytes)
      },
      sourceSwf: {
        path: TS008_SOURCE_SWF,
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
      courseXml: {
        path: courseXmlPath,
        sha256: sha256(courseXmlBytes)
      }
    },
    sourceFindings: {
      rootTimeline: {
        timelineId: validated.root.timelineId,
        frameCount: validated.root.frameCount
      },
      mainTimeline: {
        timelineId: validated.main.timelineId,
        frameCount: validated.main.frameCount
      },
      ffdecExportedScriptBlockCount: validated.scriptBlockCount,
      languageSensitiveActionScriptMatches:
        validated.languageSensitiveActionScriptMatches,
      dynamicEditTextCount: validated.editTexts.length,
      languageSensitiveHostBindings: validated.dependencyBindings,
      languageSensitiveFlashVarsCandidates: validated.languageFlashVars,
      coursePlacement: {
        swfPath: validated.page.path,
        pageTitle: validated.page.attributes.Title,
        englishShellTitle: validated.subpage.attributes.EngSubTitleName,
        spanishShellTitle: validated.subpage.attributes.SpanSubTitleName,
        shellButtonName: validated.subpage.attributes.SubTitleButtonName
      }
    },
    implementationDisposition: {
      languages: ['en', 'es'],
      visualClassification: 'source-shared-untranslated-visual',
      visualLocalization: SOURCE_SHARED_VISUAL_LOCALIZATION,
      renderSameSourceVisualForBothLanguages: true,
      sourceSharedRequirements,
      newlyRenderableFrameCount: sourceSharedRequirements.reduce(
        (total, requirement) => total + requirement.frameCount,
        0
      ),
      interactionScenariosRemainBlockedForBothLanguages:
        blockedInteractionScenarios,
      audioRendered: false,
      audioStatus:
        'pending-authoritative-listening-language-mapping-cue-synchronization-and-replay',
      hostIntegrationStatus: 'blocked-not-reconstructed'
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
      'none; this evidence permits only root-standalone and source-drawing-default to render identical source pixels for en/es. All interaction scenarios, Spanish translation, audio, original-host behavior, authoritative baseline, RMSE, reviews, and completion remain unresolved.'
  };
}

export function serializeTs008BilingualVisualDisposition(report) {
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
      'Usage: node scripts/build-ts008-bilingual-visual-disposition.mjs [--check]'
    );
    return;
  }
  const serialized = serializeTs008BilingualVisualDisposition(
    await buildTs008BilingualVisualDisposition()
  );
  if (options.check) {
    const current = await readFile(absolute(TS008_OUTPUT), 'utf8');
    if (current !== serialized) throw new Error(`${TS008_OUTPUT} is stale`);
    console.log(`TS008 bilingual visual disposition is current: ${TS008_OUTPUT}`);
    return;
  }
  await writeFile(absolute(TS008_OUTPUT), serialized);
  console.log(`Wrote ${TS008_OUTPUT}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
