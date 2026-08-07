#!/usr/bin/env node

import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {
  appendFile,
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  rmdir,
  unlink,
  writeFile,
} from 'node:fs/promises';
import {createServer as createNetServer} from 'node:net';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {
  ARCHIVE_PATH,
  ARCHIVE_SHA_PATH,
  buildCurrentPackageInputSnapshot,
  PACKAGE_BASENAME,
  PACKAGE_ID,
  RELEASE_ID,
  selectG5L4Release,
} from './build-g5-l4-whole-lesson-package-mvp-v7.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const WORKSPACE_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
export const WESTWORLD_TEMP_ROOT = '/Volumes/WestWorld';
export const REPORT_TYPE =
  'g5-l4-v7-fresh-unzip-deep-current-javascript-product-qa';
export const PLAYER_SELECTOR =
  '[data-lesson-player="descriptor-driven-whole-lesson-audit"]';
export const ACTIVE_PAGE_COUNT = 54;
export const RELEASE_MEMBER_COUNT = 55;

export const LOCALES = Object.freeze([
  Object.freeze({
    id: 'en',
    path: '/courses/5/4',
    pickerLabel: 'Go to a lesson page',
  }),
  Object.freeze({
    id: 'es',
    path: '/es/courses/5/4',
    pickerLabel: 'Ir a una p\u00e1gina de la lecci\u00f3n',
  }),
]);

export const VIEWPORTS = Object.freeze([
  Object.freeze({id: 'native-4x3', width: 800, height: 600}),
  Object.freeze({id: 'desktop-16x9', width: 1280, height: 720}),
  Object.freeze({id: 'desktop-review', width: 1440, height: 1000}),
  Object.freeze({id: 'tablet-portrait', width: 768, height: 1024}),
  Object.freeze({id: 'mobile-portrait', width: 390, height: 844}),
  Object.freeze({id: 'mobile-landscape', width: 844, height: 390}),
]);

export const REPLAY_ACTIVATIONS = Object.freeze([
  Object.freeze({id: 'mouse', kind: 'click'}),
  Object.freeze({id: 'Enter', kind: 'keyboard', key: 'Enter'}),
  Object.freeze({id: 'Space', kind: 'keyboard', key: 'Space'}),
]);

export const LAYOUT_OBSERVATION_COUNT =
  LOCALES.length * VIEWPORTS.length * ACTIVE_PAGE_COUNT;
export const REDUCED_MOTION_OBSERVATION_COUNT =
  LOCALES.length * ACTIVE_PAGE_COUNT;
export const REDUCED_MOTION_SAMPLE_COUNT =
  REDUCED_MOTION_OBSERVATION_COUNT * 3;
export const REPLAY_ACTIVATION_COUNT =
  LOCALES.length * ACTIVE_PAGE_COUNT * REPLAY_ACTIVATIONS.length;

export const VB004_ANIMATION_ID = 'course-g05-l04-vb-004';
export const VB004_FUNCTIONAL_SCOPE =
  'vb004-integers-source-script-bound-classification';
export const STANDARD_RENDERER_KIND = 'ready-800x600-canvas';
export const VB004_RENDERER_KIND = 'vb004-functional-dom';

export const ACCEPTANCE_EFFECTS = Object.freeze({
  authoritativeOriginalRuntimeAccepted: false,
  originalRuntimeFullFrameAccepted: false,
  originalRuntimeNaturalTraversalAccepted: false,
  audioAccepted: false,
  humanAudioAccepted: false,
  humanVisualAccepted: false,
  rmseAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  lessonStrictComplete: false,
  publicReleaseAuthorized: false,
  published: false,
});

export const SCOPE_RESULT_PASS = Object.freeze({
  currentJavascriptDeepProductQaMachineWorkExhausted: true,
  productQaComplete: false,
  migrationQaComplete: false,
  authoritativeOriginalRuntimeComplete: false,
  audioAcceptanceComplete: false,
  humanVisualReviewComplete: false,
  ownerAcceptanceComplete: false,
  strictCompletionComplete: false,
  publicationComplete: false,
});

export const KNOWN_LIMITATIONS = Object.freeze([
  Object.freeze({
    id: 'url-backed-per-page-deep-links',
    status: 'absent-in-v7-current-javascript-package',
  }),
  Object.freeze({
    id: 'original-runtime-and-full-frame-fidelity-evidence',
    status: 'not-established',
  }),
  Object.freeze({
    id: 'audio-cue-mapping-and-listening-acceptance',
    status: 'not-established',
  }),
  Object.freeze({
    id: 'human-visual-owner-strict-and-publication-acceptance',
    status: 'not-established',
  }),
]);

export const REMEDIATION_IDS = Object.freeze([
  'reduced-motion-note-does-not-intercept-pointer',
  'vb004-spanish-app-owned-ui-localized-source-runtime-english',
  'mobile-390-legacy-exit-inside-stage',
  'course-map-same-current-page-reselect-focuses-heading',
]);

export function rendererKindForAnimation(animationId) {
  return animationId === VB004_ANIMATION_ID
    ? VB004_RENDERER_KIND
    : STANDARD_RENDERER_KIND;
}

function isVisibleNonzeroRect(rect) {
  return Boolean(rect)
    && Number.isFinite(rect.left)
    && Number.isFinite(rect.right)
    && Number.isFinite(rect.top)
    && Number.isFinite(rect.bottom)
    && Number.isFinite(rect.width)
    && Number.isFinite(rect.height)
    && rect.width > 0
    && rect.height > 0;
}

export function rendererRuntimeObservationPassed(
  observation,
  animationId,
) {
  const expectedKind = rendererKindForAnimation(animationId);
  const commonIdentity = observation?.rendererKind === expectedKind
    && observation.runtimeStageCount === 1
    && observation.runtimeAnimationId === animationId
    && observation.runtimeModule === animationId
    && typeof observation.runtimeLanguage === 'string'
    && observation.runtimeLanguage.length > 0
    && typeof observation.frameDomain === 'string'
    && observation.frameDomain.length > 0
    && Number.isSafeInteger(observation.frame)
    && observation.frame >= 1
    && isVisibleNonzeroRect(observation.stageRect);
  if (!commonIdentity) return false;
  if (expectedKind === VB004_RENDERER_KIND) {
    return observation.functionalRootCount === 1
      && observation.functionalScope === VB004_FUNCTIONAL_SCOPE
      && observation.functionalCandidate === 'true'
      && observation.interactionEligible === 'true'
      && observation.controlsEnabled === 'true'
      && observation.sourceRuntimeLanguage === observation.runtimeLanguage
      && observation.visibleReadySurfaceCount >= 1
      && isVisibleNonzeroRect(observation.functionalRootRect)
      && isVisibleNonzeroRect(observation.readySurfaceRect);
  }
  return observation.canvasCount === 1
    && observation.canvasBacking?.width === 800
    && observation.canvasBacking?.height === 600
    && isVisibleNonzeroRect(observation.canvasRect);
}

const frozenRows = (rows) => Object.freeze(
  rows.map((row) => Object.freeze(row)),
);

export const VB004_APP_OWNED_LOCALIZATION_EXPECTATIONS = Object.freeze({
  es: Object.freeze({
    ui: Object.freeze({
      stageLabel: 'Clasifica cada número como entero o no entero',
      responsiveLabel:
        'Controles responsivos para clasificar números enteros',
      instruction: 'Elige un número y luego elige su categoría.',
      cardsGroupLabel: 'Números para clasificar',
      targetsGroupLabel: 'Categorías de números',
      loading:
        'Cargando la pregunta fuente antes de habilitar los controles de clasificación…',
      error:
        'No se pudo cargar la pregunta fuente. Los controles de clasificación no están disponibles.',
      blocked:
        'La pregunta fuente no está disponible en este contexto.',
      candidateBoundary:
        'Candidato funcional JavaScript actual. No se afirma equivalencia con el entorno original, comportamiento, audio de retroalimentación, Repetir, aceptación del propietario, finalización estricta ni autorización de publicación.',
    }),
    cards: frozenRows([
      {
        id: 'Src_1',
        label: 'menos cinco',
        correctTargetId: 'Mc_Tar_1',
        moveAria: 'Mover menos cinco',
        selectAria: 'Seleccionar menos cinco',
        placedAria: 'menos cinco colocado correctamente',
        selectedFeedback:
          'Seleccionaste menos cinco. Elige Enteros o No enteros.',
        correctFeedback: 'menos cinco es un entero. Correcto.',
        wrongFeedback:
          'menos cinco no pertenece a No enteros. Inténtalo de nuevo.',
        notDroppedFeedback:
          'menos cinco no se colocó en una categoría. Inténtalo de nuevo.',
      },
      {
        id: 'Src_2',
        label: 'cero',
        correctTargetId: 'Mc_Tar_1',
        moveAria: 'Mover cero',
        selectAria: 'Seleccionar cero',
        placedAria: 'cero colocado correctamente',
        selectedFeedback:
          'Seleccionaste cero. Elige Enteros o No enteros.',
        correctFeedback: 'cero es un entero. Correcto.',
        wrongFeedback:
          'cero no pertenece a No enteros. Inténtalo de nuevo.',
        notDroppedFeedback:
          'cero no se colocó en una categoría. Inténtalo de nuevo.',
      },
      {
        id: 'Src_3',
        label: 'un cuarto',
        correctTargetId: 'Mc_Tar_2',
        moveAria: 'Mover un cuarto',
        selectAria: 'Seleccionar un cuarto',
        placedAria: 'un cuarto colocado correctamente',
        selectedFeedback:
          'Seleccionaste un cuarto. Elige Enteros o No enteros.',
        correctFeedback:
          'un cuarto es un número no entero. Correcto.',
        wrongFeedback:
          'un cuarto no pertenece a Enteros. Inténtalo de nuevo.',
        notDroppedFeedback:
          'un cuarto no se colocó en una categoría. Inténtalo de nuevo.',
      },
      {
        id: 'Src_4',
        label: 'dieciocho',
        correctTargetId: 'Mc_Tar_1',
        moveAria: 'Mover dieciocho',
        selectAria: 'Seleccionar dieciocho',
        placedAria: 'dieciocho colocado correctamente',
        selectedFeedback:
          'Seleccionaste dieciocho. Elige Enteros o No enteros.',
        correctFeedback: 'dieciocho es un entero. Correcto.',
        wrongFeedback:
          'dieciocho no pertenece a No enteros. Inténtalo de nuevo.',
        notDroppedFeedback:
          'dieciocho no se colocó en una categoría. Inténtalo de nuevo.',
      },
      {
        id: 'Src_5',
        label: 'tres punto nueve',
        correctTargetId: 'Mc_Tar_2',
        moveAria: 'Mover tres punto nueve',
        selectAria: 'Seleccionar tres punto nueve',
        placedAria: 'tres punto nueve colocado correctamente',
        selectedFeedback:
          'Seleccionaste tres punto nueve. Elige Enteros o No enteros.',
        correctFeedback:
          'tres punto nueve es un número no entero. Correcto.',
        wrongFeedback:
          'tres punto nueve no pertenece a Enteros. Inténtalo de nuevo.',
        notDroppedFeedback:
          'tres punto nueve no se colocó en una categoría. Inténtalo de nuevo.',
      },
      {
        id: 'Src_6',
        label: 'menos diez punto cinco',
        correctTargetId: 'Mc_Tar_2',
        moveAria: 'Mover menos diez punto cinco',
        selectAria: 'Seleccionar menos diez punto cinco',
        placedAria: 'menos diez punto cinco colocado correctamente',
        selectedFeedback:
          'Seleccionaste menos diez punto cinco. Elige Enteros o No enteros.',
        correctFeedback:
          'menos diez punto cinco es un número no entero. Correcto.',
        wrongFeedback:
          'menos diez punto cinco no pertenece a Enteros. Inténtalo de nuevo.',
        notDroppedFeedback:
          'menos diez punto cinco no se colocó en una categoría. Inténtalo de nuevo.',
      },
      {
        id: 'Src_7',
        label: 'treinta y cinco centésimos',
        correctTargetId: 'Mc_Tar_2',
        moveAria: 'Mover treinta y cinco centésimos',
        selectAria: 'Seleccionar treinta y cinco centésimos',
        placedAria:
          'treinta y cinco centésimos colocado correctamente',
        selectedFeedback:
          'Seleccionaste treinta y cinco centésimos. Elige Enteros o No enteros.',
        correctFeedback:
          'treinta y cinco centésimos es un número no entero. Correcto.',
        wrongFeedback:
          'treinta y cinco centésimos no pertenece a Enteros. Inténtalo de nuevo.',
        notDroppedFeedback:
          'treinta y cinco centésimos no se colocó en una categoría. Inténtalo de nuevo.',
      },
      {
        id: 'Src_8',
        label: 'nueve',
        correctTargetId: 'Mc_Tar_1',
        moveAria: 'Mover nueve',
        selectAria: 'Seleccionar nueve',
        placedAria: 'nueve colocado correctamente',
        selectedFeedback:
          'Seleccionaste nueve. Elige Enteros o No enteros.',
        correctFeedback: 'nueve es un entero. Correcto.',
        wrongFeedback:
          'nueve no pertenece a No enteros. Inténtalo de nuevo.',
        notDroppedFeedback:
          'nueve no se colocó en una categoría. Inténtalo de nuevo.',
      },
    ]),
    targets: frozenRows([
      {
        id: 'Mc_Tar_1',
        label: 'Enteros',
        mobileAria: 'Colocar en Enteros',
        stageInitialAria:
          'Enteros, zona de destino; 0 de 4 colocados',
        stageFinalAria:
          'Enteros, zona de destino; 4 de 4 colocados',
      },
      {
        id: 'Mc_Tar_2',
        label: 'No enteros',
        mobileAria: 'Colocar en No enteros',
        stageInitialAria:
          'No enteros, zona de destino; 0 de 4 colocados',
        stageFinalAria:
          'No enteros, zona de destino; 4 de 4 colocados',
      },
    ]),
    feedback: Object.freeze({
      idle: 'Mueve cada número a Enteros o No enteros.',
      complete:
        '¡Buen trabajo! Los ocho números están clasificados correctamente.',
    }),
  }),
  en: Object.freeze({
    ui: Object.freeze({
      stageLabel: 'Classify each number as an integer or non-integer',
      responsiveLabel: 'Responsive integer classification controls',
      instruction: 'Choose a number, then choose its category.',
      cardsGroupLabel: 'Numbers to classify',
      targetsGroupLabel: 'Number categories',
      loading:
        'Loading the source question before classification controls are enabled…',
      error:
        'The source question could not load. Classification controls are unavailable.',
      blocked: 'The source question is unavailable in this context.',
      candidateBoundary:
        'Current JavaScript functional candidate. Original-runtime, behavior, feedback audio, Replay, owner, strict-completion, and publication acceptance are not claimed.',
    }),
    cards: frozenRows([
      {
        id: 'Src_1',
        label: 'negative five',
        correctTargetId: 'Mc_Tar_1',
        moveAria: 'Move negative five',
        selectAria: 'Select negative five',
        placedAria: 'negative five placed correctly',
        selectedFeedback:
          'Selected negative five. Choose Integers or Non-Integers.',
        correctFeedback: 'negative five is an integer. Correct.',
        wrongFeedback:
          'negative five does not belong in Non-Integers. Try again.',
        notDroppedFeedback:
          'negative five was not dropped in a category. Try again.',
      },
      {
        id: 'Src_2',
        label: 'zero',
        correctTargetId: 'Mc_Tar_1',
        moveAria: 'Move zero',
        selectAria: 'Select zero',
        placedAria: 'zero placed correctly',
        selectedFeedback:
          'Selected zero. Choose Integers or Non-Integers.',
        correctFeedback: 'zero is an integer. Correct.',
        wrongFeedback:
          'zero does not belong in Non-Integers. Try again.',
        notDroppedFeedback:
          'zero was not dropped in a category. Try again.',
      },
      {
        id: 'Src_3',
        label: 'one fourth',
        correctTargetId: 'Mc_Tar_2',
        moveAria: 'Move one fourth',
        selectAria: 'Select one fourth',
        placedAria: 'one fourth placed correctly',
        selectedFeedback:
          'Selected one fourth. Choose Integers or Non-Integers.',
        correctFeedback: 'one fourth is a non-integer. Correct.',
        wrongFeedback:
          'one fourth does not belong in Integers. Try again.',
        notDroppedFeedback:
          'one fourth was not dropped in a category. Try again.',
      },
      {
        id: 'Src_4',
        label: 'eighteen',
        correctTargetId: 'Mc_Tar_1',
        moveAria: 'Move eighteen',
        selectAria: 'Select eighteen',
        placedAria: 'eighteen placed correctly',
        selectedFeedback:
          'Selected eighteen. Choose Integers or Non-Integers.',
        correctFeedback: 'eighteen is an integer. Correct.',
        wrongFeedback:
          'eighteen does not belong in Non-Integers. Try again.',
        notDroppedFeedback:
          'eighteen was not dropped in a category. Try again.',
      },
      {
        id: 'Src_5',
        label: 'three point nine',
        correctTargetId: 'Mc_Tar_2',
        moveAria: 'Move three point nine',
        selectAria: 'Select three point nine',
        placedAria: 'three point nine placed correctly',
        selectedFeedback:
          'Selected three point nine. Choose Integers or Non-Integers.',
        correctFeedback: 'three point nine is a non-integer. Correct.',
        wrongFeedback:
          'three point nine does not belong in Integers. Try again.',
        notDroppedFeedback:
          'three point nine was not dropped in a category. Try again.',
      },
      {
        id: 'Src_6',
        label: 'negative ten point five',
        correctTargetId: 'Mc_Tar_2',
        moveAria: 'Move negative ten point five',
        selectAria: 'Select negative ten point five',
        placedAria: 'negative ten point five placed correctly',
        selectedFeedback:
          'Selected negative ten point five. Choose Integers or Non-Integers.',
        correctFeedback:
          'negative ten point five is a non-integer. Correct.',
        wrongFeedback:
          'negative ten point five does not belong in Integers. Try again.',
        notDroppedFeedback:
          'negative ten point five was not dropped in a category. Try again.',
      },
      {
        id: 'Src_7',
        label: 'thirty-five hundredths',
        correctTargetId: 'Mc_Tar_2',
        moveAria: 'Move thirty-five hundredths',
        selectAria: 'Select thirty-five hundredths',
        placedAria: 'thirty-five hundredths placed correctly',
        selectedFeedback:
          'Selected thirty-five hundredths. Choose Integers or Non-Integers.',
        correctFeedback:
          'thirty-five hundredths is a non-integer. Correct.',
        wrongFeedback:
          'thirty-five hundredths does not belong in Integers. Try again.',
        notDroppedFeedback:
          'thirty-five hundredths was not dropped in a category. Try again.',
      },
      {
        id: 'Src_8',
        label: 'nine',
        correctTargetId: 'Mc_Tar_1',
        moveAria: 'Move nine',
        selectAria: 'Select nine',
        placedAria: 'nine placed correctly',
        selectedFeedback:
          'Selected nine. Choose Integers or Non-Integers.',
        correctFeedback: 'nine is an integer. Correct.',
        wrongFeedback:
          'nine does not belong in Non-Integers. Try again.',
        notDroppedFeedback:
          'nine was not dropped in a category. Try again.',
      },
    ]),
    targets: frozenRows([
      {
        id: 'Mc_Tar_1',
        label: 'Integers',
        mobileAria: 'Place in Integers',
        stageInitialAria: 'Integers drop area; 0 of 4 placed',
        stageFinalAria: 'Integers drop area; 4 of 4 placed',
      },
      {
        id: 'Mc_Tar_2',
        label: 'Non-Integers',
        mobileAria: 'Place in Non-Integers',
        stageInitialAria: 'Non-Integers drop area; 0 of 4 placed',
        stageFinalAria: 'Non-Integers drop area; 4 of 4 placed',
      },
    ]),
    feedback: Object.freeze({
      idle: 'Move each number to Integers or Non-Integers.',
      complete: 'Great work! All eight numbers are classified correctly.',
    }),
  }),
});

export function vb004AppOwnedStrings(language) {
  const expectations = VB004_APP_OWNED_LOCALIZATION_EXPECTATIONS[language];
  invariant(expectations, `Unsupported VB004 app-owned language: ${language}`);
  return Object.freeze([...new Set([
    ...Object.values(expectations.ui),
    ...expectations.cards.flatMap((card) => [
      card.label,
      card.moveAria,
      card.selectAria,
      card.placedAria,
      card.selectedFeedback,
      card.correctFeedback,
      card.wrongFeedback,
      card.notDroppedFeedback,
    ]),
    ...expectations.targets.flatMap((target) => [
      target.label,
      target.mobileAria,
      target.stageInitialAria,
      target.stageFinalAria,
    ]),
    ...Object.values(expectations.feedback),
  ])]);
}

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const TEMP_PREFIX = '.g5-l4-v7-deep-qa-';
const EXPECTED_CONTROLLED_HEADER = 'g5-l4-ceo-preview';

export function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizeSeparators(value) {
  return value.split(path.sep).join('/');
}

function relativeToWorkspace(absolutePath, workspaceRoot = WORKSPACE_ROOT) {
  return normalizeSeparators(path.relative(workspaceRoot, absolutePath));
}

function resolveInside(root, value, label) {
  invariant(typeof value === 'string' && value.length > 0, `${label} requires a path`);
  const resolved = path.resolve(root, value);
  const relative = path.relative(root, resolved);
  invariant(
    relative !== '..'
      && !relative.startsWith(`..${path.sep}`)
      && !path.isAbsolute(relative),
    `${label} must stay inside ${root}`,
  );
  return resolved;
}

export function usage() {
  return [
    'Usage:',
    '  node scripts/qa-g5-l4-v7-deep-product.mjs \\',
    '    --output-json reports/<new-v7-raw-name>.json \\',
    '    --output-md reports/<new-v7-raw-name>.md \\',
    '    --artifact-dir output/playwright/<new-v7-artifact-directory>',
    '',
    'All three paths are mandatory, workspace-relative, and must not exist.',
  ].join('\n');
}

export function parseArguments(argv) {
  const result = {
    help: false,
    outputJson: null,
    outputMd: null,
    artifactDir: null,
  };
  const flags = new Map([
    ['--output-json', 'outputJson'],
    ['--output-md', 'outputMd'],
    ['--artifact-dir', 'artifactDir'],
  ]);
  const seen = new Set();
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--help' || argument === '-h') {
      invariant(argv.length === 1, '--help cannot be combined with other arguments');
      result.help = true;
      continue;
    }
    const property = flags.get(argument);
    invariant(property, `Unknown argument: ${argument}`);
    invariant(!seen.has(argument), `Duplicate argument: ${argument}`);
    const next = argv[index + 1];
    invariant(next && !next.startsWith('--'), `${argument} requires a value`);
    seen.add(argument);
    result[property] = next;
    index += 1;
  }
  if (!result.help) {
    invariant(
      result.outputJson && result.outputMd && result.artifactDir,
      '--output-json, --output-md, and --artifact-dir are all required; defaults are forbidden',
    );
  }
  return result;
}

async function lstatIfPresent(target) {
  try {
    return await lstat(target);
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

async function assertOrdinaryDirectory(target, label) {
  const metadata = await lstatIfPresent(target);
  invariant(
    metadata?.isDirectory() && !metadata.isSymbolicLink(),
    `${label} must be an existing ordinary directory`,
  );
}

export async function prepareOutputPlan(
  options,
  {workspaceRoot = WORKSPACE_ROOT} = {},
) {
  invariant(options && !options.help, 'Output planning is unavailable in help mode');
  const reportsRoot = path.join(workspaceRoot, 'reports');
  const artifactsRoot = path.join(workspaceRoot, 'output', 'playwright');
  const candidate = (value) => path.isAbsolute(value)
    ? value
    : path.resolve(workspaceRoot, value);
  const outputJson = resolveInside(
    reportsRoot,
    candidate(options.outputJson),
    '--output-json',
  );
  const outputMd = resolveInside(
    reportsRoot,
    candidate(options.outputMd),
    '--output-md',
  );
  const artifactDir = resolveInside(
    artifactsRoot,
    candidate(options.artifactDir),
    '--artifact-dir',
  );
  invariant(outputJson.endsWith('.json'), '--output-json must end in .json');
  invariant(outputMd.endsWith('.md'), '--output-md must end in .md');
  invariant(new Set([outputJson, outputMd, artifactDir]).size === 3, 'Output targets must be distinct');
  await assertOrdinaryDirectory(path.dirname(outputJson), '--output-json parent');
  await assertOrdinaryDirectory(path.dirname(outputMd), '--output-md parent');
  await assertOrdinaryDirectory(path.dirname(artifactDir), '--artifact-dir parent');
  for (const [label, target] of [
    ['--output-json', outputJson],
    ['--output-md', outputMd],
    ['--artifact-dir', artifactDir],
  ]) {
    invariant(!(await lstatIfPresent(target)), `${label} target already exists: ${target}`);
  }
  return Object.freeze({workspaceRoot, outputJson, outputMd, artifactDir});
}

export function parseArchiveSidecar(text, archiveBasename = path.basename(ARCHIVE_PATH)) {
  const match = text.trim().match(/^([a-f0-9]{64})  (.+)$/);
  invariant(match, 'Archive SHA-256 sidecar has an invalid format');
  invariant(match[2] === archiveBasename, 'Archive SHA-256 sidecar names a different ZIP');
  return {sha256: match[1], filename: match[2]};
}

function bytesBinding(absolutePath, bytes, root = WORKSPACE_ROOT) {
  return {
    path: relativeToWorkspace(absolutePath, root),
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
}

async function readOrdinaryFile(target, label) {
  const metadata = await lstat(target);
  invariant(
    metadata.isFile() && !metadata.isSymbolicLink(),
    `${label} must be an ordinary file`,
  );
  return readFile(target);
}

export async function pinArchiveInputs({
  archivePath = ARCHIVE_PATH,
  sidecarPath = ARCHIVE_SHA_PATH,
  runRoot,
  bindingRoot = WORKSPACE_ROOT,
}) {
  await assertOrdinaryDirectory(runRoot, 'Archive pinning run root');
  const archiveBasename = path.basename(archivePath);
  const sidecarBasename = path.basename(sidecarPath);
  invariant(
    archiveBasename !== sidecarBasename,
    'Archive and sidecar basenames must differ',
  );
  const sidecarBytesAtStart = await readOrdinaryFile(
    sidecarPath,
    'v7 archive sidecar',
  );
  const archiveBytesAtStart = await readOrdinaryFile(
    archivePath,
    'v7 archive',
  );
  const sidecarAtStart = parseArchiveSidecar(
    sidecarBytesAtStart.toString('utf8'),
    archiveBasename,
  );
  invariant(
    sha256(archiveBytesAtStart) === sidecarAtStart.sha256,
    'v7 archive SHA-256 differs from its sidecar',
  );

  const pinnedArchivePath = resolveInside(
    runRoot,
    archiveBasename,
    'Pinned v7 archive',
  );
  const pinnedSidecarPath = resolveInside(
    runRoot,
    sidecarBasename,
    'Pinned v7 archive sidecar',
  );
  await writeFile(pinnedArchivePath, archiveBytesAtStart, {
    flag: 'wx',
    mode: 0o400,
  });
  await writeFile(pinnedSidecarPath, sidecarBytesAtStart, {
    flag: 'wx',
    mode: 0o400,
  });

  const pinnedArchiveBytes = await readOrdinaryFile(
    pinnedArchivePath,
    'Pinned v7 archive',
  );
  const pinnedSidecarBytes = await readOrdinaryFile(
    pinnedSidecarPath,
    'Pinned v7 archive sidecar',
  );
  const pinnedSidecar = parseArchiveSidecar(
    pinnedSidecarBytes.toString('utf8'),
    path.basename(pinnedArchivePath),
  );
  invariant(
    sha256(pinnedArchiveBytes) === pinnedSidecar.sha256,
    'Pinned v7 archive SHA-256 differs from its pinned sidecar',
  );
  invariant(
    sha256(pinnedArchiveBytes) === sha256(archiveBytesAtStart)
      && sha256(pinnedSidecarBytes) === sha256(sidecarBytesAtStart),
    'Pinned v7 archive inputs differ from the source bytes read at start',
  );

  return Object.freeze({
    original: Object.freeze({
      archivePath,
      sidecarPath,
      archiveBinding: Object.freeze(bytesBinding(
        archivePath,
        archiveBytesAtStart,
        bindingRoot,
      )),
      sidecarBinding: Object.freeze(bytesBinding(
        sidecarPath,
        sidecarBytesAtStart,
        bindingRoot,
      )),
      sidecar: Object.freeze(sidecarAtStart),
    }),
    pinned: Object.freeze({
      archivePath: pinnedArchivePath,
      sidecarPath: pinnedSidecarPath,
      archiveBinding: Object.freeze(bytesBinding(
        pinnedArchivePath,
        pinnedArchiveBytes,
        runRoot,
      )),
      sidecarBinding: Object.freeze(bytesBinding(
        pinnedSidecarPath,
        pinnedSidecarBytes,
        runRoot,
      )),
      sidecar: Object.freeze(pinnedSidecar),
    }),
  });
}

export async function observeOriginalArchiveInputStability(pinnedInputs) {
  invariant(pinnedInputs?.original, 'Pinned archive inputs are required');
  const {
    archivePath,
    sidecarPath,
    archiveBinding: archiveAtStart,
    sidecarBinding: sidecarAtStart,
  } = pinnedInputs.original;
  const archiveBytesAtEnd = await readOrdinaryFile(
    archivePath,
    'v7 archive at QA end',
  );
  const sidecarBytesAtEnd = await readOrdinaryFile(
    sidecarPath,
    'v7 archive sidecar at QA end',
  );
  const archiveAtEnd = bytesBinding(
    archivePath,
    archiveBytesAtEnd,
    WORKSPACE_ROOT,
  );
  const sidecarAtEnd = bytesBinding(
    sidecarPath,
    sidecarBytesAtEnd,
    WORKSPACE_ROOT,
  );
  let endPairValid = false;
  let endSidecar = null;
  try {
    endSidecar = parseArchiveSidecar(
      sidecarBytesAtEnd.toString('utf8'),
      path.basename(archivePath),
    );
    endPairValid = endSidecar.sha256 === archiveAtEnd.sha256;
  } catch {
    endPairValid = false;
  }
  const archiveUnchanged = archiveAtEnd.bytes === archiveAtStart.bytes
    && archiveAtEnd.sha256 === archiveAtStart.sha256;
  const sidecarUnchanged = sidecarAtEnd.bytes === sidecarAtStart.bytes
    && sidecarAtEnd.sha256 === sidecarAtStart.sha256;
  return {
    archiveAtStart,
    archiveAtEnd,
    archiveUnchanged,
    sidecarAtStart,
    sidecarAtEnd,
    sidecarUnchanged,
    endPairValid,
    endSidecar,
    unchanged: archiveUnchanged && sidecarUnchanged && endPairValid,
  };
}

export function expectedPageIdsFromManifest(manifest) {
  invariant(manifest?.packageId === PACKAGE_ID, `Expected ${PACKAGE_ID}`);
  invariant(manifest?.release?.releaseId === RELEASE_ID, `Expected ${RELEASE_ID}`);
  invariant(manifest.release.activePages === ACTIVE_PAGE_COUNT, 'Expected 54 active pages');
  invariant(manifest.release.expectedMembers === RELEASE_MEMBER_COUNT, 'Expected 55 release members');
  invariant(manifest.release.strictCompleteCount === 0, 'Strict member count must remain 0');
  invariant(manifest.release.published === false, 'Package must remain unpublished');
  const authorityValues = Object.values(manifest.authority ?? {});
  invariant(
    authorityValues.length > 0
      && authorityValues.every((value) => value === false),
    'Manifest authority must be present and remain entirely false',
  );
  const active = (manifest.members ?? [])
    .filter(({releaseRole}) => releaseRole === 'active-xml-referenced-page')
    .sort((left, right) => left.ordinal - right.ordinal);
  invariant(active.length === ACTIVE_PAGE_COUNT, 'Manifest active member count differs from 54');
  invariant(active.every((member, index) => member.ordinal === index + 1), 'Manifest active order differs from exact release order');
  const ids = active.map(({animationId}) => animationId);
  invariant(new Set(ids).size === ACTIVE_PAGE_COUNT, 'Manifest active IDs are not unique');
  invariant(ids.every((id) => /^course-g05-l04-[a-z0-9-]+$/.test(id)), 'Manifest contains an unsafe animation ID');
  return ids;
}

export function sourceObservation(packageSnapshot, currentSnapshot) {
  const current = JSON.stringify(packageSnapshot) === JSON.stringify(currentSnapshot);
  return {
    sourceCurrentAtObservation: current,
    packageSnapshot,
    currentSnapshot,
    delta: {
      fileCount: currentSnapshot.fileCount - packageSnapshot.fileCount,
      totalBytes: currentSnapshot.totalBytes - packageSnapshot.totalBytes,
      sha256Changed: currentSnapshot.sha256 !== packageSnapshot.sha256,
    },
    requiredForPass: true,
    currentWorkspaceSourceUsedToServeQa: false,
    qaRuntimeSource: 'fresh-unzip-hash-bound-v7-archive',
    acceptanceEffect: 'none',
  };
}

export function isExpectedRscAbort(url, errorText) {
  try {
    return errorText === 'net::ERR_ABORTED'
      && new URL(url).searchParams.has('_rsc');
  } catch {
    return false;
  }
}

export function validateReportBoundary(report) {
  const errors = [];
  if (report?.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (report?.reportType !== REPORT_TYPE) errors.push(`reportType must be ${REPORT_TYPE}`);
  if (report?.packageId !== PACKAGE_ID) errors.push(`packageId must be ${PACKAGE_ID}`);
  if (
    JSON.stringify(report?.acceptanceEffects)
      !== JSON.stringify(ACCEPTANCE_EFFECTS)
    || Object.values(report?.acceptanceEffects ?? {})
      .some((value) => value !== false)
  ) {
    errors.push('acceptanceEffects must be the exact all-false boundary');
  }
  if (
    report?.authorityBoundary?.acceptanceNeutral !== true
    || report?.authorityBoundary?.strictAcceptanceEffect !== 'none'
    || [
      'authoritativeOriginalRuntimeAuthority',
      'audioAuthority',
      'humanReviewAuthority',
      'ownerAuthority',
      'strictCompletionAuthority',
      'publicationAuthority',
    ].some((key) => report?.authorityBoundary?.[key] !== false)
    || Object.entries(report?.authorityBoundary ?? {}).some(
      ([key, value]) => key.endsWith('Authority') && value !== false,
    )
  ) {
    errors.push('authorityBoundary must remain acceptance-neutral, authority-false, and strict effect none');
  }
  if (
    report?.releaseBoundary?.expectedMembers !== RELEASE_MEMBER_COUNT
    || report?.releaseBoundary?.strictCompleteCount !== 0
    || report?.releaseBoundary?.published !== false
  ) {
    errors.push('releaseBoundary must remain 0/55 and unpublished');
  }
  if (report?.status === 'pass-current-javascript-deep-product-qa') {
    if (!SHA256_PATTERN.test(report?.archiveBinding?.sha256 ?? '')) {
      errors.push('archiveBinding.sha256 must be a full SHA-256');
    }
    if (!SHA256_PATTERN.test(report?.packageManifestBinding?.sha256 ?? '')) {
      errors.push('packageManifestBinding.sha256 must be a full SHA-256');
    }
    if (
      report?.freshUnzip?.archiveSidecarSha256
        !== report?.archiveBinding?.sha256
      || report?.freshUnzip?.pinnedInput?.copyMode
        !== 'create-exclusive-byte-copy'
      || report?.freshUnzip?.pinnedInput?.archive?.sha256
        !== report?.archiveBinding?.sha256
      || report?.freshUnzip?.pinnedInput?.archive?.bytes
        !== report?.archiveBinding?.bytes
      || report?.freshUnzip?.pinnedInput?.sidecar?.sha256
        !== report?.archiveSidecarBinding?.sha256
      || report?.freshUnzip?.pinnedInput?.sidecar?.bytes
        !== report?.archiveSidecarBinding?.bytes
      || report?.freshUnzip?.originalInputsUnchangedAtEnd !== true
      || report?.archiveSourceStability?.unchanged !== true
      || report?.archiveSourceStability?.archiveUnchanged !== true
      || report?.archiveSourceStability?.sidecarUnchanged !== true
      || report?.archiveSourceStability?.endPairValid !== true
      || report?.archiveSourceStability?.archiveAtStart?.sha256
        !== report?.archiveBinding?.sha256
      || report?.archiveSourceStability?.archiveAtEnd?.sha256
        !== report?.archiveBinding?.sha256
      || report?.archiveSourceStability?.sidecarAtStart?.sha256
        !== report?.archiveSidecarBinding?.sha256
      || report?.archiveSourceStability?.sidecarAtEnd?.sha256
        !== report?.archiveSidecarBinding?.sha256
      || report?.freshUnzip?.archiveEntriesSafetyCheckedInFull !== true
      || report?.freshUnzip?.packageSource !== 'hash-bound-v7-zip-only'
      || report?.freshUnzip?.currentWorkspaceSourceServed !== false
      || report?.freshUnzip?.loopback?.dynamicPort !== true
      || report?.freshUnzip?.loopback?.listenerOwnedBySpawnedChild !== true
    ) {
      errors.push('passing report requires the sidecar-bound safe fresh-unzip dynamic-loopback runtime');
    }
    if (
      report?.packageVerifier?.before?.status !== 0
      || report?.packageVerifier?.after?.status !== 0
    ) {
      errors.push('passing report requires successful package verification before and after QA');
    }
    if (
      report?.sourceObservation?.sourceCurrentAtObservation !== true
      || report?.sourceObservation?.delta?.fileCount !== 0
      || report?.sourceObservation?.delta?.totalBytes !== 0
      || report?.sourceObservation?.delta?.sha256Changed !== false
      || JSON.stringify(report?.sourceObservation?.packageSnapshot)
        !== JSON.stringify(report?.sourceObservation?.currentSnapshot)
      || report?.sourceObservation?.manifestBuildSnapshotsEqual !== true
      || report?.sourceObservation?.unchangedThroughoutQa !== true
      || JSON.stringify(report?.sourceObservation?.packageSnapshot)
        !== JSON.stringify(report?.sourceObservation?.currentSnapshotAtStart)
      || JSON.stringify(report?.sourceObservation?.packageSnapshot)
        !== JSON.stringify(report?.sourceObservation?.currentSnapshotAtEnd)
      || report?.sourceObservation?.requiredForPass !== true
      || report?.sourceObservation?.currentWorkspaceSourceUsedToServeQa
        !== false
      || report?.sourceObservation?.qaRuntimeSource
        !== 'fresh-unzip-hash-bound-v7-archive'
      || report?.sourceObservation?.acceptanceEffect !== 'none'
    ) {
      errors.push('v7 passing evidence requires the exact fresh current package input snapshot');
    }
    const expectedCounts = [
      ['layout', LAYOUT_OBSERVATION_COUNT],
      ['identity', LAYOUT_OBSERVATION_COUNT],
      ['overflow', LAYOUT_OBSERVATION_COUNT],
      ['reducedMotionObservations', REDUCED_MOTION_OBSERVATION_COUNT],
      ['reducedMotionSamples', REDUCED_MOTION_SAMPLE_COUNT],
      ['replayActivations', REPLAY_ACTIVATION_COUNT],
      ['map', 4],
      ['keyTerms', 4],
      ['fq', 4],
      ['persistence', 2],
      ['remediations', 4],
    ];
    for (const [key, expected] of expectedCounts) {
      if (
        report.assertionCounts?.[key]?.passed !== expected
        || report.assertionCounts?.[key]?.failed !== 0
      ) {
        errors.push(`passing report requires assertionCounts.${key} ${expected}/0`);
      }
    }
    for (const key of [
      'freshUnzip',
      'packageVerifierBeforeAndAfter',
      'exactReleaseOrder',
      'layout',
      'reducedMotion',
      'replayMouseEnterSpace',
      'map',
      'keyTerms',
      'fq',
      'persistence',
      'directUrlBoundary',
      'networkBoundary',
      'allFourV7Remediations',
    ]) {
      if (report.freshClaims?.[key] !== true) {
        errors.push(`passing report requires freshClaims.${key} = true`);
      }
    }
    if (report.freshClaims?.perPageDirectUrl !== false) {
      errors.push('v7 package must preserve its explicit absent per-page direct URL boundary');
    }
    if (JSON.stringify(report.scopeResult) !== JSON.stringify(SCOPE_RESULT_PASS)) {
      errors.push('passing report scopeResult must exhaust only bounded current-JS deep product QA machine work');
    }
    for (const key of [
      'productQaComplete',
      'migrationQaComplete',
      'authoritativeOriginalRuntimeComplete',
      'audioAcceptanceComplete',
      'humanVisualReviewComplete',
      'ownerAcceptanceComplete',
      'strictCompletionComplete',
      'publicationComplete',
    ]) {
      if (report.freshClaims?.[key] === true) {
        errors.push(`passing report cannot promote freshClaims.${key}`);
      }
    }
    if (
      report.remediationChecks?.length !== 4
      || report.remediationChecks.some(({passed}) => passed !== true)
      || JSON.stringify(report.remediationChecks.map(({id}) => id))
        !== JSON.stringify(REMEDIATION_IDS)
    ) {
      errors.push('passing report must independently reverse all four v6 remediation findings');
    }
    if (report.failures?.length !== 0) {
      errors.push('passing report cannot contain failures');
    }
  }
  return errors;
}

export function reportMarkdown(report) {
  const count = (key) => {
    const value = report.assertionCounts?.[key] ?? {passed: 0, failed: 0};
    return `${value.passed} passed, ${value.failed} failed`;
  };
  const machineScopeExhausted =
    report.status === 'pass-current-javascript-deep-product-qa'
    && report.scopeResult
      ?.currentJavascriptDeepProductQaMachineWorkExhausted === true;
  const machineScopeStatement = machineScopeExhausted
    ? 'The bounded v7 deep-product machine matrix was exhausted within current-JavaScript scope.'
    : 'The bounded v7 deep-product machine matrix was not exhausted by this attempt; inspect the status, assertion counts, and failures.';
  return `# G5 L4 v7 fresh-unzip deep current-JavaScript product QA

- Status: \`${report.status}\`
- Package: \`${report.packageId}\`
- Archive SHA-256: \`${report.archiveBinding.sha256}\`
- Manifest SHA-256: \`${report.packageManifestBinding.sha256}\`
- Source current at observation: \`${report.sourceObservation.sourceCurrentAtObservation}\`
- Release boundary: \`0/55\` strict members; unpublished

## Machine assertions

- Layout: ${count('layout')}
- Identity: ${count('identity')}
- Horizontal overflow: ${count('overflow')}
- Reduced-motion observations: ${count('reducedMotionObservations')}
- Reduced-motion samples: ${count('reducedMotionSamples')}
- Replay mouse/Enter/Space activations: ${count('replayActivations')}
- Course Map: ${count('map')}
- Key Terms: ${count('keyTerms')}
- FQ: ${count('fq')}
- Persistence: ${count('persistence')}
- Reversed v6 UI findings: ${count('remediations')}

## Evidence boundary

This is current-JavaScript machine product QA only. ${machineScopeStatement} It does not establish original-runtime fidelity, audio acceptance, human review, Owner acceptance, strict completion, publication, or public release. Every acceptance effect remains false and the strict acceptance effect is \`none\`.
`;
}

const EVIDENCE_TRANSACTION_PREFIX = '.g5-l4-v7-evidence-transaction-';

async function removeEvidenceTransactionRoot(transactionRoot, workspaceRoot) {
  invariant(
    path.dirname(transactionRoot) === workspaceRoot
      && path.basename(transactionRoot).startsWith(
        EVIDENCE_TRANSACTION_PREFIX,
      ),
    'Refusing to remove an unrecognized evidence transaction root',
  );
  const metadata = await lstatIfPresent(transactionRoot);
  if (!metadata) return;
  invariant(
    metadata.isDirectory() && !metadata.isSymbolicLink(),
    'Evidence transaction root is not an ordinary directory',
  );
  await rm(transactionRoot, {recursive: true, force: false});
}

async function unlinkPublishedFileIfOwned({target, stagedPath}) {
  const [targetMetadata, stagedMetadata] = await Promise.all([
    lstatIfPresent(target),
    lstatIfPresent(stagedPath),
  ]);
  if (!targetMetadata) return;
  invariant(
    stagedMetadata
      && targetMetadata.isFile()
      && stagedMetadata.isFile()
      && targetMetadata.dev === stagedMetadata.dev
      && targetMetadata.ino === stagedMetadata.ino,
    `Rollback refused to unlink a target not owned by this transaction: ${target}`,
  );
  await unlink(target);
}

export async function commitImmutableEvidence(
  plan,
  report,
  stagedArtifacts,
  {beforeIo = null} = {},
) {
  const boundaryErrors = validateReportBoundary(report);
  invariant(
    boundaryErrors.length === 0,
    `Report boundary validation failed: ${boundaryErrors.join('; ')}`,
  );
  invariant(
    beforeIo === null || typeof beforeIo === 'function',
    'beforeIo must be a function when supplied',
  );
  await assertOrdinaryDirectory(plan.workspaceRoot, 'Evidence workspace root');
  await assertOrdinaryDirectory(
    path.dirname(plan.outputJson),
    'Evidence JSON parent',
  );
  await assertOrdinaryDirectory(
    path.dirname(plan.outputMd),
    'Evidence Markdown parent',
  );
  await assertOrdinaryDirectory(
    path.dirname(plan.artifactDir),
    'Evidence artifact parent',
  );
  for (const target of [plan.outputJson, plan.outputMd, plan.artifactDir]) {
    invariant(!(await lstatIfPresent(target)), `Immutable target appeared before commit: ${target}`);
  }

  const names = new Set();
  const artifactPayloads = [];
  for (const artifact of stagedArtifacts) {
    invariant(/^[a-z0-9][a-z0-9._-]*\.png$/.test(artifact.name), `Unsafe artifact name: ${artifact.name}`);
    invariant(!names.has(artifact.name), `Duplicate artifact name: ${artifact.name}`);
    names.add(artifact.name);
    artifactPayloads.push({
      name: artifact.name,
      bytes: await readFile(artifact.stagedPath),
    });
  }
  const bindings = [];
  for (const artifact of artifactPayloads) {
    const target = path.join(plan.artifactDir, artifact.name);
    bindings.push({
      path: relativeToWorkspace(target, plan.workspaceRoot),
      bytes: artifact.bytes.length,
      sha256: sha256(artifact.bytes),
    });
  }
  report.artifacts = bindings;
  report.outputBindings = {
    json: {
      path: relativeToWorkspace(plan.outputJson, plan.workspaceRoot),
      selfSha256: null,
      reason: 'The immutable successor receipt binds the committed raw JSON externally; a JSON document cannot contain its own final SHA-256.',
    },
    markdown: null,
    artifactDirectory: relativeToWorkspace(plan.artifactDir, plan.workspaceRoot),
    commitProtocol: {
      type: 'staged-exclusive-hard-links-with-rollback-journal',
      overwriteExistingTargets: false,
      rollbackOwnsTargetsByDeviceAndInode: true,
      journal: 'ephemeral-append-only-transaction-log',
    },
  };
  const markdown = Buffer.from(reportMarkdown(report));
  report.outputBindings.markdown = {
    path: relativeToWorkspace(plan.outputMd, plan.workspaceRoot),
    bytes: markdown.length,
    sha256: sha256(markdown),
  };
  const json = Buffer.from(stableJson(report));

  let transactionRoot = null;
  let artifactDirectoryCreated = false;
  const publishedFiles = [];
  const runIo = async (step, operation) => {
    if (beforeIo) await beforeIo(step);
    return operation();
  };
  try {
    transactionRoot = await mkdtemp(path.join(
      plan.workspaceRoot,
      EVIDENCE_TRANSACTION_PREFIX,
    ));
    const stagedArtifactDirectory = path.join(
      transactionRoot,
      'artifacts',
    );
    const stagedJson = path.join(transactionRoot, 'report.json');
    const stagedMarkdown = path.join(transactionRoot, 'report.md');
    const journalPath = path.join(transactionRoot, 'transaction.jsonl');
    const journalEntry = async (state, details = {}) => runIo(
      `journal-${state}`,
      () => appendFile(
        journalPath,
        `${JSON.stringify({state, ...details})}\n`,
        {encoding: 'utf8'},
      ),
    );

    await runIo('stage-artifact-directory', () => mkdir(
      stagedArtifactDirectory,
      {recursive: false, mode: 0o700},
    ));
    for (const artifact of artifactPayloads) {
      await runIo(`stage-artifact-${artifact.name}`, () => writeFile(
        path.join(stagedArtifactDirectory, artifact.name),
        artifact.bytes,
        {flag: 'wx', mode: 0o444},
      ));
    }
    await runIo('stage-json', () => writeFile(
      stagedJson,
      json,
      {flag: 'wx', mode: 0o444},
    ));
    await runIo('stage-markdown', () => writeFile(
      stagedMarkdown,
      markdown,
      {flag: 'wx', mode: 0o444},
    ));
    await runIo('create-journal', () => writeFile(
      journalPath,
      `${JSON.stringify({
        state: 'created',
        targets: {
          artifactDirectory: relativeToWorkspace(
            plan.artifactDir,
            plan.workspaceRoot,
          ),
          json: relativeToWorkspace(plan.outputJson, plan.workspaceRoot),
          markdown: relativeToWorkspace(plan.outputMd, plan.workspaceRoot),
        },
      })}\n`,
      {flag: 'wx', mode: 0o600},
    ));
    await journalEntry('staged', {
      artifactCount: artifactPayloads.length,
      jsonSha256: sha256(json),
      markdownSha256: sha256(markdown),
    });

    await runIo('publish-artifact-directory', () => mkdir(
      plan.artifactDir,
      {recursive: false, mode: 0o755},
    ));
    artifactDirectoryCreated = true;
    await journalEntry('artifact-directory-published');
    for (const artifact of artifactPayloads) {
      const stagedPath = path.join(
        stagedArtifactDirectory,
        artifact.name,
      );
      const target = path.join(plan.artifactDir, artifact.name);
      await runIo(`publish-artifact-${artifact.name}`, () => link(
        stagedPath,
        target,
      ));
      publishedFiles.push({target, stagedPath});
      await journalEntry(`artifact-published-${artifact.name}`);
    }

    await runIo('publish-json', () => link(stagedJson, plan.outputJson));
    publishedFiles.push({target: plan.outputJson, stagedPath: stagedJson});
    await journalEntry('json-published');
    await runIo(
      'publish-markdown',
      () => link(stagedMarkdown, plan.outputMd),
    );
    publishedFiles.push({
      target: plan.outputMd,
      stagedPath: stagedMarkdown,
    });
    await journalEntry('markdown-published');
    await journalEntry('committed', {
      artifactCount: artifactPayloads.length,
    });

    let transactionCleanupWarning = null;
    try {
      await removeEvidenceTransactionRoot(
        transactionRoot,
        plan.workspaceRoot,
      );
      transactionRoot = null;
    } catch (error) {
      transactionCleanupWarning = error instanceof Error
        ? error.message
        : String(error);
    }
    return {
      json: {path: plan.outputJson, bytes: json.length, sha256: sha256(json)},
      markdown: {
        path: plan.outputMd,
        bytes: markdown.length,
        sha256: sha256(markdown),
      },
      artifacts: bindings,
      commitProtocol: report.outputBindings.commitProtocol,
      transactionCleanupWarning,
    };
  } catch (error) {
    const rollbackErrors = [];
    for (const published of [...publishedFiles].reverse()) {
      try {
        await unlinkPublishedFileIfOwned(published);
      } catch (rollbackError) {
        rollbackErrors.push(
          rollbackError instanceof Error
            ? rollbackError.message
            : String(rollbackError),
        );
      }
    }
    if (artifactDirectoryCreated) {
      try {
        await rmdir(plan.artifactDir);
      } catch (rollbackError) {
        if (rollbackError?.code !== 'ENOENT') {
          rollbackErrors.push(
            rollbackError instanceof Error
              ? rollbackError.message
              : String(rollbackError),
          );
        }
      }
    }
    if (transactionRoot) {
      await appendFile(
        path.join(transactionRoot, 'transaction.jsonl'),
        `${JSON.stringify({
          state: 'rolled-back',
          rollbackErrors,
        })}\n`,
        {encoding: 'utf8'},
      ).catch(() => undefined);
      try {
        await removeEvidenceTransactionRoot(
          transactionRoot,
          plan.workspaceRoot,
        );
      } catch (rollbackError) {
        rollbackErrors.push(
          rollbackError instanceof Error
            ? rollbackError.message
            : String(rollbackError),
        );
      }
    }
    if (rollbackErrors.length > 0) {
      const originalMessage = error instanceof Error
        ? error.message
        : String(error);
      throw new Error(
        `${originalMessage}; evidence rollback errors: ${rollbackErrors.join('; ')}`,
        {cause: error},
      );
    }
    throw error;
  }
}

async function fileBinding(absolutePath, workspaceRoot = WORKSPACE_ROOT) {
  const bytes = await readFile(absolutePath);
  return {
    path: relativeToWorkspace(absolutePath, workspaceRoot),
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
}

function childHasExited(child) {
  return Boolean(child)
    && (child.exitCode !== null || child.signalCode !== null);
}

export async function runCommand(
  command,
  args,
  {
    cwd,
    env = process.env,
    timeoutMs = 120_000,
    outputLimit = 20_000,
    terminationGraceMs = 5_000,
    killWaitMs = 5_000,
  } = {},
) {
  invariant(
    Number.isSafeInteger(timeoutMs) && timeoutMs > 0,
    'runCommand timeoutMs must be a positive integer',
  );
  invariant(
    Number.isSafeInteger(terminationGraceMs) && terminationGraceMs > 0,
    'runCommand terminationGraceMs must be a positive integer',
  );
  invariant(
    Number.isSafeInteger(killWaitMs) && killWaitMs > 0,
    'runCommand killWaitMs must be a positive integer',
  );
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stdout = [];
    const stderr = [];
    let timedOut = false;
    let termSignalSent = false;
    let killEscalated = false;
    let hardDeadlineReached = false;
    let settled = false;
    let escalationTimer = null;
    let hardTimer = null;
    const timeoutTimer = setTimeout(() => {
      timedOut = true;
      if (!childHasExited(child)) {
        termSignalSent = child.kill('SIGTERM');
      }
      escalationTimer = setTimeout(() => {
        if (!childHasExited(child)) {
          killEscalated = true;
          child.kill('SIGKILL');
        }
      }, terminationGraceMs);
      hardTimer = setTimeout(() => {
        hardDeadlineReached = true;
        if (!childHasExited(child)) {
          killEscalated = true;
          child.kill('SIGKILL');
        }
        child.stdout?.destroy();
        child.stderr?.destroy();
        child.unref?.();
        finish(null, child.exitCode, child.signalCode);
      }, terminationGraceMs + killWaitMs);
    }, timeoutMs);
    child.stdout.on('data', (chunk) => stdout.push(chunk));
    child.stderr.on('data', (chunk) => stderr.push(chunk));
    const cleanup = () => {
      clearTimeout(timeoutTimer);
      if (escalationTimer) clearTimeout(escalationTimer);
      if (hardTimer) clearTimeout(hardTimer);
      child.removeListener('error', onError);
      child.removeListener('close', onClose);
    };
    const finish = (error, code, signal) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) {
        reject(error);
        return;
      }
      const bounded = (chunks) => {
        const value = Buffer.concat(chunks).toString('utf8');
        return outputLimit === null ? value : value.slice(-outputLimit);
      };
      resolve({
        command: [command, ...args].join(' '),
        status: code,
        signal,
        timedOut,
        termSignalSent,
        killEscalated,
        hardDeadlineReached,
        stdout: bounded(stdout),
        stderr: bounded(stderr),
      });
    };
    const onError = (error) => finish(error, null, null);
    const onClose = (code, signal) => finish(null, code, signal);
    child.once('error', onError);
    child.once('close', onClose);
  });
}

async function findAvailableLoopbackPort() {
  const server = createNetServer();
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen({host: '127.0.0.1', port: 0, exclusive: true}, () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Unable to allocate a dynamic loopback port'));
        return;
      }
      server.close((error) => error ? reject(error) : resolve(address.port));
    });
  });
}

async function waitForCourse(url, child, timeoutMs = 60_000) {
  const started = Date.now();
  let lastError = 'not attempted';
  while (Date.now() - started < timeoutMs) {
    invariant(
      !childHasExited(child),
      `Package server exited early with code ${child.exitCode} and signal ${child.signalCode}`,
    );
    try {
      const response = await fetch(url, {redirect: 'manual'});
      if (response.status === 200) {
        return {
          status: response.status,
          controlledPreview: response.headers.get(
            'x-helpmath-controlled-preview',
          ),
          cacheControl: response.headers.get('cache-control'),
          robots: response.headers.get('x-robots-tag'),
        };
      }
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${url}: ${lastError}`);
}

function waitForChildClose(child, timeoutMs) {
  if (childHasExited(child)) return Promise.resolve(true);
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.removeListener('close', onClose);
      resolve(value);
    };
    const onClose = () => finish(true);
    const timer = setTimeout(
      () => finish(childHasExited(child)),
      timeoutMs,
    );
    child.once('close', onClose);
    if (childHasExited(child)) finish(true);
  });
}

export async function stopChild(
  child,
  {terminationGraceMs = 5_000, killWaitMs = 5_000} = {},
) {
  invariant(
    Number.isSafeInteger(terminationGraceMs) && terminationGraceMs > 0,
    'stopChild terminationGraceMs must be a positive integer',
  );
  invariant(
    Number.isSafeInteger(killWaitMs) && killWaitMs > 0,
    'stopChild killWaitMs must be a positive integer',
  );
  if (!child) {
    return {alreadyExited: true, termSignalSent: false, killEscalated: false};
  }
  if (childHasExited(child)) {
    return {
      alreadyExited: true,
      termSignalSent: false,
      killEscalated: false,
      exitCode: child.exitCode,
      signalCode: child.signalCode,
    };
  }
  const termSignalSent = child.kill('SIGTERM');
  await waitForChildClose(child, terminationGraceMs);
  if (childHasExited(child)) {
    return {
      alreadyExited: false,
      termSignalSent,
      killEscalated: false,
      exitCode: child.exitCode,
      signalCode: child.signalCode,
    };
  }
  const killSignalSent = child.kill('SIGKILL');
  await waitForChildClose(child, killWaitMs);
  invariant(
    childHasExited(child),
    `Child process did not exit within ${terminationGraceMs}ms SIGTERM grace and ${killWaitMs}ms SIGKILL wait`,
  );
  return {
    alreadyExited: false,
    termSignalSent,
    killEscalated: true,
    killSignalSent,
    exitCode: child.exitCode,
    signalCode: child.signalCode,
  };
}

async function childOwnsLoopbackListener(child, port) {
  if (!child?.pid || childHasExited(child)) return false;
  const result = await runCommand(
    '/usr/sbin/lsof',
    ['-nP', '-a', '-p', String(child.pid), `-iTCP:${port}`, '-sTCP:LISTEN', '-Fn'],
    {timeoutMs: 10_000},
  );
  return result.status === 0 && result.stdout.includes(`p${child.pid}`);
}

export function assertSafeArchiveEntries(entries) {
  invariant(Array.isArray(entries) && entries.length > 0, 'ZIP entry list is empty');
  for (const entry of entries) {
    const normalized = entry.replace(/\/$/, '');
    invariant(!entry.includes('\\'), `ZIP entry uses a backslash: ${entry}`);
    invariant(!entry.startsWith('/'), `ZIP entry is absolute: ${entry}`);
    invariant(!entry.split('/').includes('..'), `ZIP entry traverses a parent: ${entry}`);
    invariant(
      normalized === PACKAGE_BASENAME
        || normalized.startsWith(`${PACKAGE_BASENAME}/`),
      `ZIP entry escapes ${PACKAGE_BASENAME}: ${entry}`,
    );
  }
  return true;
}

async function assertNoSymlinks(root) {
  let fileCount = 0;
  let totalBytes = 0;
  async function visit(directory) {
    const entries = await readdir(directory, {withFileTypes: true});
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const target = path.join(directory, entry.name);
      const metadata = await lstat(target);
      invariant(!metadata.isSymbolicLink(), `Fresh package contains a symbolic link: ${target}`);
      if (metadata.isDirectory()) await visit(target);
      else if (metadata.isFile()) {
        fileCount += 1;
        totalBytes += metadata.size;
      }
    }
  }
  await visit(root);
  return {fileCount, totalBytes, symbolicLinks: 0};
}

function emptyRuntimeEvents(scope) {
  return {
    scope,
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    ignoredAbortedRscRequests: [],
    badHttpResponses: [],
    externalRequests: [],
    dialogs: [],
    popups: [],
    downloads: [],
    webSockets: [],
  };
}

function attachRuntimeMonitor(page, baseOrigin, scope) {
  const events = emptyRuntimeEvents(scope);
  page.on('console', (message) => {
    if (message.type() === 'error') events.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => events.pageErrors.push(error.message));
  page.on('request', (request) => {
    try {
      const url = new URL(request.url());
      if (!['data:', 'blob:'].includes(url.protocol) && url.origin !== baseOrigin) {
        events.externalRequests.push({method: request.method(), url: request.url()});
      }
    } catch {
      events.externalRequests.push({method: request.method(), url: request.url()});
    }
  });
  page.on('requestfailed', (request) => {
    const errorText = request.failure()?.errorText ?? '';
    const value = {method: request.method(), url: request.url(), errorText};
    if (isExpectedRscAbort(request.url(), errorText)) {
      events.ignoredAbortedRscRequests.push(value);
    } else {
      events.failedRequests.push(value);
    }
  });
  page.on('response', (response) => {
    if (response.status() >= 400) {
      events.badHttpResponses.push({status: response.status(), url: response.url()});
    }
  });
  page.on('dialog', async (dialog) => {
    events.dialogs.push({type: dialog.type(), message: dialog.message()});
    await dialog.dismiss().catch(() => undefined);
  });
  page.on('popup', async (popup) => {
    events.popups.push({url: popup.url()});
    await popup.close().catch(() => undefined);
  });
  page.on('download', async (download) => {
    events.downloads.push({suggestedFilename: download.suggestedFilename()});
    await download.cancel().catch(() => undefined);
  });
  page.on('websocket', (socket) => events.webSockets.push({url: socket.url()}));
  return events;
}

function runtimeEventFailures(events) {
  return [
    ...events.consoleErrors.map((value) => `console error: ${value}`),
    ...events.pageErrors.map((value) => `page error: ${value}`),
    ...events.failedRequests.map((value) =>
      `failed request: ${value.url} ${value.errorText}`),
    ...events.badHttpResponses.map((value) =>
      `bad HTTP response: ${value.status} ${value.url}`),
    ...events.externalRequests.map((value) =>
      `external request: ${value.method} ${value.url}`),
    ...events.dialogs.map((value) =>
      `unexpected dialog: ${value.type} ${value.message}`),
    ...events.popups.map((value) => `unexpected popup: ${value.url}`),
    ...events.downloads.map((value) =>
      `unexpected download: ${value.suggestedFilename}`),
    ...events.webSockets.map((value) => `unexpected websocket: ${value.url}`),
  ];
}

async function navigateCourse(page, baseUrl, locale) {
  const response = await page.goto(`${baseUrl}${locale.path}`, {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });
  invariant(response?.status() === 200, `${locale.id} course returned ${response?.status()}`);
  invariant(
    response.headers()['x-helpmath-controlled-preview']
      === EXPECTED_CONTROLLED_HEADER,
    `${locale.id} controlled-preview response identity changed`,
  );
  await page.locator(`${PLAYER_SELECTOR}[data-hydrated="true"]`).waitFor({
    state: 'visible',
    timeout: 60_000,
  });
  return {
    status: response.status(),
    controlledPreview:
      response.headers()['x-helpmath-controlled-preview'] ?? null,
    cacheControl: response.headers()['cache-control'] ?? null,
    robots: response.headers()['x-robots-tag'] ?? null,
  };
}

async function newContext(
  browser,
  locale,
  viewport,
  reducedMotion = 'no-preference',
) {
  const context = await browser.newContext({
    viewport: {width: viewport.width, height: viewport.height},
    deviceScaleFactor: 1,
    locale: locale.id === 'es' ? 'es-ES' : 'en-US',
    reducedMotion,
    serviceWorkers: 'block',
  });
  await context.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  return context;
}

async function pickerValues(page, locale) {
  return page.locator(
    `select[aria-label="${locale.pickerLabel}"] option`,
  ).evaluateAll((elements) => elements.map((element) => element.value));
}

async function captureRendererObservation(page, expected) {
  const rendererKind = rendererKindForAnimation(expected.animationId);
  return page.locator(PLAYER_SELECTOR).evaluate((player, value) => {
    const shells = [...player.querySelectorAll('.runtime-shell')];
    const stages = [...player.querySelectorAll('.runtime-stage')];
    const canvases = [...player.querySelectorAll(
      `canvas[data-animation-id="${value.animationId}"]`
        + '[data-render-state="ready"]',
    )];
    const stage = stages[0] ?? null;
    const canvas = canvases[0] ?? null;
    const shell = shells[0] ?? null;
    const functionalRoots = stage
      ? [...stage.querySelectorAll(
          `[data-current-js-functional-scope="${value.functionalScope}"]`,
        )]
      : [];
    const functionalRoot = functionalRoots[0] ?? null;
    const readySurfaces = functionalRoot
      ? [...functionalRoot.querySelectorAll(
          '[data-current-js-controls-ready="true"]',
        )]
      : [];
    const rectangle = (element) => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      };
    };
    const visibleReadySurfaces = readySurfaces.filter((element) => {
      const rect = element.getBoundingClientRect();
      return element.getClientRects().length > 0
        && rect.width > 0
        && rect.height > 0;
    });
    const canvasRect = rectangle(canvas);
    const stageRect = rectangle(stage);
    const functionalRootRect = rectangle(functionalRoot);
    const readySurfaceRect = rectangle(visibleReadySurfaces[0] ?? null);
    const playerRect = rectangle(player);
    const shellRect = rectangle(shell);
    const documentElement = document.documentElement;
    return {
      rendererKind: value.rendererKind,
      currentAnimationId: player.getAttribute('data-current-animation-id'),
      currentPage: Number(player.getAttribute('data-current-page')),
      hydrated: player.getAttribute('data-hydrated'),
      rendererAvailability:
        player.getAttribute('data-renderer-availability'),
      runtimeShellCount: shells.length,
      runtimeStageCount: stages.length,
      canvasCount: canvases.length,
      runtimeAnimationId: stage?.getAttribute('data-animation-id') ?? null,
      runtimeModule: stage?.getAttribute('data-animation-module') ?? null,
      runtimeLanguage: stage?.getAttribute('data-flash-lang') ?? null,
      frameDomain: stage?.getAttribute('data-flash-frame-domain') ?? null,
      frame: Number(stage?.getAttribute('data-flash-frame') ?? NaN),
      functionalRootCount: functionalRoots.length,
      functionalScope:
        functionalRoot?.getAttribute('data-current-js-functional-scope')
          ?? null,
      functionalCandidate:
        functionalRoot?.getAttribute('data-current-js-functional-candidate')
          ?? null,
      interactionEligible:
        functionalRoot?.getAttribute('data-current-js-interaction-eligible')
          ?? null,
      controlsEnabled:
        functionalRoot?.getAttribute('data-current-js-controls-enabled')
          ?? null,
      sourceRuntimeLanguage:
        functionalRoot?.getAttribute('data-source-runtime-language') ?? null,
      readySurfaceCount: readySurfaces.length,
      visibleReadySurfaceCount: visibleReadySurfaces.length,
      canvasBacking: canvas
        ? {
            width: Number(canvas.getAttribute('width')),
            height: Number(canvas.getAttribute('height')),
          }
        : null,
      canvasRect,
      stageRect,
      functionalRootRect,
      readySurfaceRect,
      playerRect,
      shellRect,
      documentClientWidth: documentElement.clientWidth,
      documentScrollWidth: documentElement.scrollWidth,
      horizontalOverflowPx: Math.max(
        0,
        documentElement.scrollWidth - documentElement.clientWidth,
        document.body.scrollWidth - window.innerWidth,
      ),
      forbiddenLegacyEmbedCount:
        player.querySelectorAll('object, embed, iframe').length,
      viewport: {width: innerWidth, height: innerHeight},
    };
  }, {
    animationId: expected.animationId,
    functionalScope: VB004_FUNCTIONAL_SCOPE,
    rendererKind,
  });
}

async function waitForActiveRenderer(page, animationId) {
  const rendererKind = rendererKindForAnimation(animationId);
  await page.waitForFunction((value) => {
    const player = document.querySelector(value.playerSelector);
    if (
      !player
      || player.getAttribute('data-current-animation-id')
        !== value.animationId
      || player.getAttribute('data-hydrated') !== 'true'
      || player.getAttribute('data-renderer-availability') !== 'registered'
    ) return false;
    const stages = [...player.querySelectorAll('.runtime-stage')];
    const stage = stages[0] ?? null;
    if (
      stages.length !== 1
      || stage?.getAttribute('data-animation-id') !== value.animationId
      || stage?.getAttribute('data-animation-module') !== value.animationId
      || !stage.getAttribute('data-flash-frame-domain')
      || !stage.getAttribute('data-flash-lang')
      || !Number.isSafeInteger(Number(stage.getAttribute('data-flash-frame')))
      || Number(stage.getAttribute('data-flash-frame')) < 1
    ) return false;
    const stageRect = stage.getBoundingClientRect();
    if (stageRect.width <= 0 || stageRect.height <= 0) return false;
    if (value.rendererKind === value.vb004RendererKind) {
      const roots = [...stage.querySelectorAll(
        `[data-current-js-functional-scope="${value.functionalScope}"]`,
      )];
      const root = roots[0] ?? null;
      if (
        roots.length !== 1
        || root?.getAttribute('data-current-js-functional-candidate')
          !== 'true'
        || root.getAttribute('data-current-js-interaction-eligible')
          !== 'true'
        || root.getAttribute('data-current-js-controls-enabled') !== 'true'
        || root.getAttribute('data-source-runtime-language')
          !== stage.getAttribute('data-flash-lang')
      ) return false;
      const rootRect = root.getBoundingClientRect();
      if (
        root.getClientRects().length === 0
        || rootRect.width <= 0
        || rootRect.height <= 0
      ) return false;
      return [...root.querySelectorAll(
        '[data-current-js-controls-ready="true"]',
      )].some((surface) => {
        const rect = surface.getBoundingClientRect();
        return surface.getClientRects().length > 0
          && rect.width > 0
          && rect.height > 0;
      });
    }
    const canvases = [...stage.querySelectorAll(
      `canvas[data-animation-id="${value.animationId}"]`
        + '[data-render-state="ready"]',
    )];
    const canvas = canvases[0] ?? null;
    if (
      canvases.length !== 1
      || canvas?.getAttribute('width') !== '800'
      || canvas.getAttribute('height') !== '600'
    ) return false;
    const canvasRect = canvas.getBoundingClientRect();
    return canvas.getClientRects().length > 0
      && canvasRect.width > 0
      && canvasRect.height > 0;
  }, {
    animationId,
    functionalScope: VB004_FUNCTIONAL_SCOPE,
    playerSelector: PLAYER_SELECTOR,
    rendererKind,
    vb004RendererKind: VB004_RENDERER_KIND,
  }, {timeout: 60_000});
  const observation = await captureRendererObservation(page, {animationId});
  invariant(
    rendererRuntimeObservationPassed(observation, animationId),
    `${animationId}: ${rendererKind} did not settle to a visible, nonzero, runtime-identified renderer`,
  );
  return observation;
}

async function selectAndWaitForPage(page, locale, animationId, ordinal) {
  const picker = page.locator(`select[aria-label="${locale.pickerLabel}"]`);
  const pickerVisible = await picker.isVisible();
  await picker.selectOption(animationId, {force: true});
  await page.locator(
    `${PLAYER_SELECTOR}[data-current-animation-id="${animationId}"]`
      + `[data-current-page="${ordinal}"]`,
  ).waitFor({state: 'visible', timeout: 60_000});
  const renderer = await waitForActiveRenderer(page, animationId);
  return {
    pickerVisible,
    rendererKind: renderer.rendererKind,
  };
}

async function waitForStorageKey(page) {
  const matchesSession = (value, releaseId) => {
    try {
      const parsed = JSON.parse(value ?? 'null');
      return parsed?.releaseId === releaseId
        && typeof parsed?.currentAnimationId === 'string'
        && Array.isArray(parsed?.visitedAnimationIds)
        && parsed?.replayCounts !== null
        && typeof parsed?.replayCounts === 'object';
    } catch {
      return false;
    }
  };
  await page.waitForFunction((releaseId) =>
    Object.keys(localStorage).some((key) => {
      try {
        const parsed = JSON.parse(localStorage.getItem(key) ?? 'null');
        return parsed?.releaseId === releaseId
          && typeof parsed?.currentAnimationId === 'string'
          && Array.isArray(parsed?.visitedAnimationIds)
          && parsed?.replayCounts !== null
          && typeof parsed?.replayCounts === 'object';
      } catch {
        return false;
      }
    }), RELEASE_ID, {timeout: 30_000});
  const key = await page.evaluate((releaseId) =>
    Object.keys(localStorage).find((candidate) => {
      try {
        const parsed = JSON.parse(
          localStorage.getItem(candidate) ?? 'null',
        );
        return parsed?.releaseId === releaseId
          && typeof parsed?.currentAnimationId === 'string'
          && Array.isArray(parsed?.visitedAnimationIds)
          && parsed?.replayCounts !== null
          && typeof parsed?.replayCounts === 'object';
      } catch {
        return false;
      }
    }) ?? null, RELEASE_ID
  );
  invariant(key, 'Whole-lesson session storage key is absent after hydration');
  invariant(
    matchesSession(await page.evaluate(
      (candidate) => localStorage.getItem(candidate),
      key,
    ), RELEASE_ID),
    'Discovered storage key does not contain the G5 L4 lesson session',
  );
  return key;
}

async function waitForStoredCurrentPage(page, storageKey, animationId) {
  await page.waitForFunction(({key, id}) => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? 'null')
        ?.currentAnimationId === id;
    } catch {
      return false;
    }
  }, {key: storageKey, id: animationId}, {timeout: 30_000});
}

async function readStoredSession(page, storageKey) {
  return page.evaluate((key) => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? 'null');
    } catch {
      return null;
    }
  }, storageKey);
}

async function observeLayout(page, expected) {
  const observation = await captureRendererObservation(page, expected);
  const identityPassed = observation.currentAnimationId
      === expected.animationId
    && observation.currentPage === expected.ordinal
    && observation.hydrated === 'true'
    && observation.rendererAvailability === 'registered'
    && observation.runtimeShellCount === 1
    && observation.forbiddenLegacyEmbedCount === 0
    && rendererRuntimeObservationPassed(observation, expected.animationId);
  const rectWithinViewport = (rect) => isVisibleNonzeroRect(rect)
    && rect.left >= -1
    && rect.right <= observation.viewport.width + 1;
  const visualRect = observation.rendererKind === VB004_RENDERER_KIND
    ? observation.functionalRootRect
    : observation.canvasRect;
  const overflowPassed = observation.horizontalOverflowPx <= 1
    && rectWithinViewport(visualRect)
    && rectWithinViewport(observation.stageRect)
    && rectWithinViewport(observation.playerRect)
    && (
      observation.rendererKind !== VB004_RENDERER_KIND
      || rectWithinViewport(observation.readySurfaceRect)
    );
  return {
    locale: expected.locale,
    animationId: expected.animationId,
    ordinal: expected.ordinal,
    ...observation,
    identityPassed,
    overflowPassed,
    layoutPassed: identityPassed
      && overflowPassed
      && isVisibleNonzeroRect(observation.shellRect),
  };
}

async function stageScreenshot(page, stagingRoot, name) {
  invariant(/^[a-z0-9][a-z0-9._-]*\.png$/.test(name), `Unsafe screenshot name: ${name}`);
  const bytes = await page.screenshot({fullPage: true});
  const stagedPath = path.join(stagingRoot, name);
  await writeFile(stagedPath, bytes, {flag: 'wx', mode: 0o600});
  return {name, stagedPath, bytes: bytes.length, sha256: sha256(bytes)};
}

async function runLayoutMatrix({browser, baseUrl, pageIds, stagingRoot}) {
  const entries = [];
  const runtimeEvents = [];
  const artifacts = [];
  const failures = [];
  for (const locale of LOCALES) {
    for (const viewport of VIEWPORTS) {
      const context = await newContext(browser, locale, viewport);
      try {
        const page = await context.newPage();
        const events = attachRuntimeMonitor(
          page,
          new URL(baseUrl).origin,
          `layout:${locale.id}:${viewport.id}`,
        );
        runtimeEvents.push(events);
        const response = await navigateCourse(page, baseUrl, locale);
        const values = await pickerValues(page, locale);
        const exactReleaseOrder =
          JSON.stringify(values) === JSON.stringify(pageIds);
        if (!exactReleaseOrder) failures.push(
          `layout ${locale.id}/${viewport.id}: picker order differs from manifest`,
        );
        const observations = [];
        for (let index = 0; index < pageIds.length; index += 1) {
          const animationId = pageIds[index];
          const selection = await selectAndWaitForPage(
            page,
            locale,
            animationId,
            index + 1,
          );
          const core = await observeLayout(page, {
            locale: locale.id,
            animationId,
            ordinal: index + 1,
          });
          const expectedPickerVisible = viewport.id !== 'mobile-landscape';
          const observation = {
            ...core,
            pickerVisible: selection.pickerVisible,
            expectedPickerVisible,
            pickerPresentationPassed:
              selection.pickerVisible === expectedPickerVisible,
          };
          observations.push(observation);
          if (!observation.layoutPassed) failures.push(
            `layout ${locale.id}/${viewport.id}/${animationId}: layout failed`,
          );
          if (!observation.identityPassed) failures.push(
            `layout ${locale.id}/${viewport.id}/${animationId}: identity failed`,
          );
          if (!observation.overflowPassed) failures.push(
            `layout ${locale.id}/${viewport.id}/${animationId}: `
              + `${observation.horizontalOverflowPx}px horizontal overflow`,
          );
          if (!observation.pickerPresentationPassed) failures.push(
            `layout ${locale.id}/${viewport.id}/${animationId}: compact picker presentation drifted`,
          );
        }
        const captureProfile =
          (locale.id === 'en' && [
            'native-4x3',
            'desktop-16x9',
            'tablet-portrait',
          ].includes(viewport.id))
          || (locale.id === 'es' && [
            'desktop-review',
            'mobile-portrait',
            'mobile-landscape',
          ].includes(viewport.id));
        if (captureProfile) {
          artifacts.push(await stageScreenshot(
            page,
            stagingRoot,
            `matrix-${locale.id}-${viewport.width}x${viewport.height}.png`,
          ));
        }
        entries.push({
          locale: locale.id,
          viewport,
          response,
          pickerOptionCount: values.length,
          pickerUniqueCount: new Set(values).size,
          exactReleaseOrder,
          observations,
        });
        failures.push(...runtimeEventFailures(events).map((failure) =>
          `layout ${locale.id}/${viewport.id}: ${failure}`));
      } finally {
        await context.close();
      }
    }
  }
  return {entries, runtimeEvents, artifacts, failures};
}

async function sampleReducedMotion(page, animationId) {
  const samples = [];
  for (let index = 0; index < 3; index += 1) {
    if (index > 0) await page.waitForTimeout(125);
    samples.push(await captureRendererObservation(page, {animationId}));
  }
  return samples;
}

async function runReducedMotionMatrix({browser, baseUrl, pageIds}) {
  const entries = [];
  const runtimeEvents = [];
  const failures = [];
  const viewport = VIEWPORTS.find(({id}) => id === 'desktop-16x9');
  for (const locale of LOCALES) {
    const context = await newContext(browser, locale, viewport, 'reduce');
    try {
      const page = await context.newPage();
      const events = attachRuntimeMonitor(
        page,
        new URL(baseUrl).origin,
        `reduced:${locale.id}`,
      );
      runtimeEvents.push(events);
      await navigateCourse(page, baseUrl, locale);
      invariant(
        JSON.stringify(await pickerValues(page, locale))
          === JSON.stringify(pageIds),
        `Reduced-motion ${locale.id} picker order changed`,
      );
      for (let index = 0; index < pageIds.length; index += 1) {
        const animationId = pageIds[index];
        await selectAndWaitForPage(page, locale, animationId, index + 1);
        const note = page.locator('.reduced-motion-note[role="status"]');
        await note.waitFor({state: 'visible', timeout: 30_000});
        const samples = await sampleReducedMotion(page, animationId);
        const stable = samples.every(({frame}) =>
          Number.isSafeInteger(frame)
            && frame >= 1
            && frame === samples[0].frame
        );
        const identityPassed = samples.every((sample) =>
          rendererRuntimeObservationPassed(sample, animationId)
        );
        const passed = stable && identityPassed;
        if (!passed) failures.push(
          `Reduced motion ${locale.id}/${animationId} failed`,
        );
        entries.push({
          locale: locale.id,
          animationId,
          ordinal: index + 1,
          noteText: (await note.textContent())?.trim() ?? '',
          samples,
          stable,
          identityPassed,
          passed,
        });
      }
      failures.push(...runtimeEventFailures(events).map((failure) =>
        `reduced ${locale.id}: ${failure}`));
    } finally {
      await context.close();
    }
  }
  return {entries, runtimeEvents, failures};
}

async function waitForReplayCount(
  page,
  storageKey,
  animationId,
  expectedCount,
) {
  await page.waitForFunction(({key, id, count}) => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? 'null')
        ?.replayCounts?.[id] === count;
    } catch {
      return false;
    }
  }, {
    key: storageKey,
    id: animationId,
    count: expectedCount,
  }, {timeout: 30_000});
}

async function runReplayMatrix({browser, baseUrl, pageIds}) {
  const entries = [];
  const runtimeEvents = [];
  const failures = [];
  const viewport = VIEWPORTS.find(({id}) => id === 'desktop-16x9');
  for (const locale of LOCALES) {
    const context = await newContext(browser, locale, viewport);
    try {
      const page = await context.newPage();
      const events = attachRuntimeMonitor(
        page,
        new URL(baseUrl).origin,
        `replay:${locale.id}`,
      );
      runtimeEvents.push(events);
      await navigateCourse(page, baseUrl, locale);
      const storageKey = await waitForStorageKey(page);
      invariant(
        JSON.stringify(await pickerValues(page, locale))
          === JSON.stringify(pageIds),
        `Replay ${locale.id} picker order changed`,
      );
      for (let index = 0; index < pageIds.length; index += 1) {
        const animationId = pageIds[index];
        await selectAndWaitForPage(page, locale, animationId, index + 1);
        await waitForStoredCurrentPage(page, storageKey, animationId);
        const initial = await readStoredSession(page, storageKey);
        let expectedCount = initial?.replayCounts?.[animationId] ?? 0;
        const activations = [];
        for (const activation of REPLAY_ACTIVATIONS) {
          const replay = page.locator(
            'button[data-responsive-focus-key="replay"]:visible',
          ).first();
          await replay.waitFor({state: 'visible', timeout: 30_000});
          if (activation.kind === 'click') await replay.click();
          else {
            await replay.focus();
            await replay.press(activation.key);
          }
          expectedCount += 1;
          await waitForReplayCount(
            page,
            storageKey,
            animationId,
            expectedCount,
          );
          const renderer = await waitForActiveRenderer(page, animationId);
          const stored = await readStoredSession(page, storageKey);
          const observedCount = stored?.replayCounts?.[animationId] ?? null;
          const rendererIdentityPassed = rendererRuntimeObservationPassed(
            renderer,
            animationId,
          );
          const passed = observedCount === expectedCount
            && rendererIdentityPassed;
          if (!passed) failures.push(
            `Replay ${locale.id}/${animationId}/${activation.id}: `
              + `expected ${expectedCount}, observed ${observedCount}, `
              + `renderer ${renderer.rendererKind} identity `
              + `${rendererIdentityPassed ? 'passed' : 'failed'}`,
          );
          activations.push({
            activation: activation.id,
            expectedCount,
            observedCount,
            renderer,
            rendererIdentityPassed,
            passed,
          });
        }
        entries.push({
          locale: locale.id,
          animationId,
          ordinal: index + 1,
          storageKey,
          activations,
          passed: activations.every(({passed}) => passed),
        });
      }
      failures.push(...runtimeEventFailures(events).map((failure) =>
        `replay ${locale.id}: ${failure}`));
    } finally {
      await context.close();
    }
  }
  return {entries, runtimeEvents, failures};
}

async function focusedElement(page) {
  return page.evaluate(() => ({
    tagName: document.activeElement?.tagName ?? null,
    responsiveFocusKey:
      document.activeElement?.getAttribute('data-responsive-focus-key')
        ?? null,
    ariaLabel: document.activeElement?.getAttribute('aria-label') ?? null,
    insidePageHeading: Boolean(document.activeElement?.closest(
      '.lesson-shell2__page-heading',
    )),
    insideMap: Boolean(document.activeElement?.closest(
      '.lesson-shell2__side-panel--map',
    )),
    insideTool: Boolean(document.activeElement?.closest(
      '.lesson-shell2__side-panel--tool',
    )),
    text: document.activeElement?.textContent?.trim() ?? null,
  }));
}

async function waitForHeadingFocus(page) {
  await page.waitForFunction(() =>
    document.activeElement?.tagName === 'H1'
      && Boolean(document.activeElement.closest(
        '.lesson-shell2__page-heading',
      )),
  undefined, {timeout: 5_000}).catch(() => undefined);
  return focusedElement(page);
}

async function inspectMap(page, locale, pageIds) {
  const shell = page.locator('.lesson-shell2');
  const panel = page.locator('.lesson-shell2__side-panel--map');
  const trigger = page.locator(
    'button[data-responsive-focus-key="map"]:visible',
  ).first();
  const waitOpen = (expected) => page.waitForFunction((open) =>
    document.querySelector('.lesson-shell2')?.getAttribute('data-map-open')
      === String(open), expected);
  const ensureClosed = async () => {
    if (await shell.getAttribute('data-map-open') === 'true') {
      await page.keyboard.press('Escape');
      await waitOpen(false);
    }
  };
  const ensureOpen = async () => {
    if (await shell.getAttribute('data-map-open') !== 'true') {
      await trigger.click();
      await waitOpen(true);
    }
  };

  await ensureClosed();
  const keyboardOpen = [];
  for (const key of ['Enter', 'Space']) {
    await trigger.focus();
    await trigger.press(key);
    await waitOpen(true);
    const presentation = await shell.getAttribute('data-map-presentation');
    if (presentation === 'overlay') {
      await page.waitForFunction(() =>
        document.activeElement?.getAttribute(
          'data-course-map-close-control',
        ) === 'true'
      );
    }
    const openingFocus = await focusedElement(page);
    let focusTrapPassed = null;
    if (presentation === 'overlay') {
      await panel.locator('[data-course-map-close-control="true"]').focus();
      await page.keyboard.press('Shift+Tab');
      focusTrapPassed = (await focusedElement(page)).insideMap;
    }
    keyboardOpen.push({
      key,
      opened: true,
      presentation,
      openingFocus,
      closeButtonInitialFocus: presentation === 'overlay'
        ? openingFocus.ariaLabel === (
            locale.id === 'es' ? 'Cerrar el mapa' : 'Close course map'
          )
        : null,
      focusTrapApplicable: presentation === 'overlay',
      focusTrapPassed,
    });
    await page.keyboard.press('Escape');
    await waitOpen(false);
  }

  await ensureOpen();
  const rows = panel.locator('.lesson-shell2__map-content ol li button');
  const rowCount = await rows.count();
  const currentOrdinal = Number(
    await page.locator(PLAYER_SELECTOR).getAttribute('data-current-page'),
  );
  await rows.nth(currentOrdinal - 1).click();
  await waitOpen(false);
  const samePageFocus = await waitForHeadingFocus(page);
  const samePageFocusPassed = samePageFocus.tagName === 'H1'
    && samePageFocus.insidePageHeading;

  const candidateIndex = Math.floor(pageIds.length / 2);
  const differentIndex = candidateIndex === currentOrdinal - 1
    ? candidateIndex + 1
    : candidateIndex;
  await ensureOpen();
  await rows.nth(differentIndex).click();
  await page.locator(
    `${PLAYER_SELECTOR}[data-current-animation-id="${pageIds[differentIndex]}"]`
      + `[data-current-page="${differentIndex + 1}"]`,
  ).waitFor({state: 'visible', timeout: 30_000});
  const differentPageFocus = await waitForHeadingFocus(page);
  const differentPageFocusPassed = differentPageFocus.tagName === 'H1'
    && differentPageFocus.insidePageHeading;

  await ensureOpen();
  await page.keyboard.press('Escape');
  await waitOpen(false);
  await page.waitForFunction(() =>
    document.activeElement?.getAttribute('data-responsive-focus-key') === 'map'
  );
  const escapeFocus = await focusedElement(page);
  const escapeFocusPassed = escapeFocus.responsiveFocusKey === 'map';
  const keyboardPassed = keyboardOpen.every((entry) =>
    entry.opened
      && (!entry.focusTrapApplicable || (
        entry.closeButtonInitialFocus && entry.focusTrapPassed
      )));
  return {
    locale: locale.id,
    rowCount,
    keyboardOpen,
    keyboardPassed,
    samePageAnimationId: pageIds[currentOrdinal - 1],
    samePageFocus,
    samePageFocusPassed,
    differentPageAnimationId: pageIds[differentIndex],
    differentPageFocus,
    differentPageFocusPassed,
    escapeFocus,
    escapeFocusPassed,
    passed: rowCount === pageIds.length
      && keyboardPassed
      && samePageFocusPassed
      && differentPageFocusPassed
      && escapeFocusPassed,
  };
}

export function glossaryDataPathForLanguage(language) {
  invariant(
    language === 'en' || language === 'es',
    `Unsupported glossary language: ${language}`,
  );
  return `/generated/g5-l4-elementary-keyterms-reference-${language}.json`;
}

function glossaryEntryCountForLanguage(language) {
  return language === 'en' ? '761' : '753';
}

async function waitForGlossaryFetchAndRender(
  page,
  indexLanguage,
  action,
) {
  const expectedOrigin = new URL(page.url()).origin;
  const expectedPath = glossaryDataPathForLanguage(indexLanguage);
  const responsePromise = page.waitForResponse((response) => {
    try {
      const url = new URL(response.url());
      return response.request().method() === 'GET'
        && url.origin === expectedOrigin
        && url.pathname === expectedPath
        && url.search === '';
    } catch {
      return false;
    }
  }, {timeout: 30_000});
  await action();
  const response = await responsePromise;
  invariant(
    response.status() === 200,
    `${indexLanguage} glossary fetch returned ${response.status()}`,
  );
  const finishError = await response.finished();
  invariant(
    finishError === null,
    `${indexLanguage} glossary fetch did not finish: `
      + `${finishError?.message ?? String(finishError)}`,
  );
  const browser = page.locator('.lesson-shell2__key-terms-browser');
  await browser.waitFor({state: 'visible', timeout: 30_000});
  const expectedCount = glossaryEntryCountForLanguage(indexLanguage);
  await browser.locator('.lesson-shell2__key-terms-count')
    .filter({hasText: expectedCount}).waitFor({timeout: 30_000});
  return {
    indexLanguage,
    expectedPath,
    url: response.url(),
    status: response.status(),
    responseFinished: true,
    renderedCount: (await browser.locator(
      '.lesson-shell2__key-terms-count',
    ).textContent())?.trim() ?? '',
  };
}

async function inspectKeyTerms(page, locale) {
  const shell = page.locator('.lesson-shell2');
  const panel = page.locator('.lesson-shell2__side-panel--tool');
  const trigger = page.locator(
    'button[data-responsive-focus-key="key-terms"]:visible',
  ).first();
  const waitTool = (value) => page.waitForFunction((expected) =>
    document.querySelector('.lesson-shell2')?.getAttribute('data-active-tool')
      === expected, value);

  const keyboardOpen = [];
  const glossaryFetches = [];
  for (const key of ['Enter', 'Space']) {
    const glossaryFetch = await waitForGlossaryFetchAndRender(
      page,
      locale.id,
      async () => {
        await trigger.focus();
        await trigger.press(key);
        await waitTool('key-terms');
      },
    );
    glossaryFetches.push({phase: `keyboard-${key}`, ...glossaryFetch});
    await page.waitForFunction((labels) =>
      labels.includes(document.activeElement?.getAttribute('aria-label')),
    ['Close tool', 'Cerrar herramienta']);
    const presentation = await shell.getAttribute('data-tool-presentation');
    const openingFocus = await focusedElement(page);
    let focusTrapPassed = null;
    if (presentation === 'overlay') {
      await panel.getByRole('button', {
        name: locale.id === 'es' ? 'Cerrar herramienta' : 'Close tool',
      }).focus();
      await page.keyboard.press('Shift+Tab');
      focusTrapPassed = (await focusedElement(page)).insideTool;
    }
    keyboardOpen.push({
      key,
      opened: true,
      presentation,
      openingFocus,
      closeButtonInitialFocus: openingFocus.ariaLabel === (
        locale.id === 'es' ? 'Cerrar herramienta' : 'Close tool'
      ),
      focusTrapApplicable: presentation === 'overlay',
      focusTrapPassed,
    });
    await page.keyboard.press('Escape');
    await waitTool('none');
  }

  const initialGlossaryFetch = await waitForGlossaryFetchAndRender(
    page,
    locale.id,
    async () => {
      await trigger.click();
      await waitTool('key-terms');
    },
  );
  glossaryFetches.push({phase: 'detail-initial', ...initialGlossaryFetch});
  const browser = page.locator('.lesson-shell2__key-terms-browser');
  const expectedInitial = glossaryEntryCountForLanguage(locale.id);
  const alternateLanguage = locale.id === 'en' ? 'es' : 'en';
  const expectedAlternate = glossaryEntryCountForLanguage(
    alternateLanguage,
  );
  const firstCount = (await browser.locator(
    '.lesson-shell2__key-terms-count',
  ).textContent())?.trim() ?? '';
  const alternateGlossaryFetch = await waitForGlossaryFetchAndRender(
    page,
    alternateLanguage,
    async () => browser.getByRole('button', {
      name: locale.id === 'en' ? '\u00cdndice espa\u00f1ol' : 'English index',
    }).click(),
  );
  glossaryFetches.push({phase: 'detail-alternate', ...alternateGlossaryFetch});
  const alternateCount = (await browser.locator(
    '.lesson-shell2__key-terms-count',
  ).textContent())?.trim() ?? '';
  const boundary = await browser.evaluate((element) => ({
    authority: element.getAttribute('data-data-authority'),
    originalRuntimeAccepted:
      element.getAttribute('data-original-runtime-accepted'),
    referenceUseAuthorized:
      element.getAttribute('data-reference-use-authorized'),
    runtimeLoadVerified:
      element.getAttribute('data-runtime-load-verified'),
    runtimeByteVariantVerified:
      element.getAttribute('data-runtime-byte-variant-verified'),
    text: element.querySelector('.lesson-shell2__key-terms-boundary')
      ?.textContent ?? '',
  }));
  await browser.locator('.lesson-shell2__key-terms-list li button')
    .first().click();
  const detailHeading = browser.locator(
    '.lesson-shell2__key-term-definition h3',
  );
  await detailHeading.waitFor({state: 'visible', timeout: 30_000});
  await page.waitForFunction(() =>
    document.activeElement?.matches(
      '.lesson-shell2__key-term-definition h3',
    ) === true
  );
  const detail = {
    heading: (await detailHeading.textContent())?.trim() ?? '',
    headingFocused: await detailHeading.evaluate((element) =>
      document.activeElement === element
    ),
  };
  await page.keyboard.press('Escape');
  await waitTool('none');
  await page.waitForFunction(() =>
    document.activeElement?.getAttribute('data-responsive-focus-key')
      === 'key-terms'
  );
  const escapeFocus = await focusedElement(page);
  const keyboardPassed = keyboardOpen.every((entry) =>
    entry.opened
      && entry.closeButtonInitialFocus
      && (!entry.focusTrapApplicable || entry.focusTrapPassed));
  const countsPassed = firstCount.includes(expectedInitial)
    && alternateCount.includes(expectedAlternate);
  const boundaryPassed = boundary.originalRuntimeAccepted === 'false'
    && boundary.authority
      === 'content-manager-authorized-combined-elementary-reference-candidate'
    && boundary.referenceUseAuthorized === 'true'
    && boundary.runtimeLoadVerified === 'false'
    && boundary.runtimeByteVariantVerified === 'false'
    && boundary.text.includes('L4KTE01.xml')
    && boundary.text.includes('L4KTS01.xml');
  return {
    locale: locale.id,
    glossaryFetches,
    glossaryFetchesPassed: glossaryFetches.length === 4
      && glossaryFetches.every((entry) =>
        entry.status === 200
          && entry.responseFinished
          && entry.renderedCount.includes(
            glossaryEntryCountForLanguage(entry.indexLanguage),
          )),
    keyboardOpen,
    keyboardPassed,
    firstCount,
    alternateCount,
    countsPassed,
    boundary,
    boundaryPassed,
    detail,
    escapeFocus,
    escapeFocusPassed: escapeFocus.responsiveFocusKey === 'key-terms',
    passed: glossaryFetches.length === 4
      && glossaryFetches.every((entry) =>
        entry.status === 200 && entry.responseFinished)
      && keyboardPassed
      && countsPassed
      && boundaryPassed
      && detail.heading.length > 0
      && detail.headingFocused
      && escapeFocus.responsiveFocusKey === 'key-terms',
  };
}

async function inspectFqFlow(
  page,
  locale,
  animationId,
  expectedQuestionCount,
) {
  const controls = page.locator(
    '[data-current-javascript-question-controls="true"]',
  );
  await controls.waitFor({state: 'visible', timeout: 30_000});
  const legends = [];
  for (let position = 1; position <= expectedQuestionCount; position += 1) {
    const legend = (await controls.locator('legend').textContent())?.trim()
      ?? '';
    invariant(
      legend.includes(`Question ${position} of ${expectedQuestionCount}`),
      `${locale.id}/${animationId}: FQ legend drifted at ${position}`,
    );
    legends.push(legend);
    await controls.locator('input[type="radio"]').first().check();
    await controls.locator('button[type="submit"]').click();
    if (position < expectedQuestionCount) {
      await controls.locator('legend')
        .filter({
          hasText: `Question ${position + 1} of ${expectedQuestionCount}`,
        })
        .waitFor({timeout: 30_000});
    }
  }
  const results = page.locator('[data-current-javascript-results="true"]');
  await results.waitFor({state: 'visible', timeout: 30_000});
  const resultText = (await results.textContent())
    ?.replace(/\s+/g, ' ').trim() ?? '';
  const scoreMatch = resultText.match(/Score:\s*(\d+)\s*\/\s*(\d+)/);
  await results.getByRole('button', {name: 'Review answers'}).click();
  const review = page.locator('[data-current-javascript-text-review="true"]');
  await review.waitFor({state: 'visible', timeout: 30_000});
  const reviewTexts = [];
  for (let position = 1; position <= expectedQuestionCount; position += 1) {
    const text = (await review.locator('p[aria-live="polite"]').textContent())
      ?.replace(/\s+/g, ' ').trim() ?? '';
    invariant(
      text.includes(`Review ${position} of ${expectedQuestionCount}`),
      `${locale.id}/${animationId}: review order drifted at ${position}`,
    );
    reviewTexts.push(text);
    if (position < expectedQuestionCount) {
      await review.getByRole('button', {name: 'Next review'}).click();
    }
  }
  await review.getByRole('button', {name: 'Back to results'}).click();
  await results.waitFor({state: 'visible', timeout: 30_000});
  await results.getByRole('button', {name: 'Replay quiz'}).click();
  await controls.locator('legend')
    .filter({hasText: `Question 1 of ${expectedQuestionCount}`})
    .waitFor({timeout: 30_000});
  const resetLegend = (await controls.locator('legend').textContent())?.trim()
    ?? '';
  return {
    locale: locale.id,
    animationId,
    expectedQuestionCount,
    traversedQuestionCount: legends.length,
    resultText,
    observedScore: scoreMatch
      ? {correct: Number(scoreMatch[1]), total: Number(scoreMatch[2])}
      : null,
    reviewCount: reviewTexts.length,
    firstReview: reviewTexts[0] ?? null,
    lastReview: reviewTexts.at(-1) ?? null,
    replayResetLegend: resetLegend,
    sourceRandomOrderParityEstablished: false,
    sourceReviewVisualParityEstablished: false,
    spanishQuestionVisualParityEstablished: false,
    originalRuntimeScoringParityEstablished: false,
    passed: legends.length === expectedQuestionCount
      && reviewTexts.length === expectedQuestionCount
      && scoreMatch?.[2] === String(expectedQuestionCount)
      && resetLegend.includes(`Question 1 of ${expectedQuestionCount}`),
  };
}

async function runSupportChecks({browser, baseUrl, pageIds, stagingRoot}) {
  const map = [];
  const keyTerms = [];
  const fq = [];
  const runtimeEvents = [];
  const artifacts = [];
  const failures = [];
  const viewports = VIEWPORTS.filter(({id}) =>
    id === 'desktop-16x9' || id === 'mobile-portrait'
  );
  const fqPlans = [
    {animationId: 'course-g05-l04-fq-002', count: 10},
    {animationId: 'course-g05-l04-fq-003', count: 18},
  ];
  for (const locale of LOCALES) {
    for (const viewport of viewports) {
      const context = await newContext(browser, locale, viewport);
      try {
        const page = await context.newPage();
        const events = attachRuntimeMonitor(
          page,
          new URL(baseUrl).origin,
          `support:${locale.id}:${viewport.id}`,
        );
        runtimeEvents.push(events);
        await navigateCourse(page, baseUrl, locale);
        const mapResult = await inspectMap(page, locale, pageIds);
        map.push({...mapResult, viewport});
        if (!mapResult.passed) failures.push(
          `Course Map ${locale.id}/${viewport.id} failed`,
        );

        const keyTermsResult = await inspectKeyTerms(page, locale);
        keyTerms.push({...keyTermsResult, viewport});
        if (!keyTermsResult.passed) failures.push(
          `Key Terms ${locale.id}/${viewport.id} failed`,
        );

        if (viewport.id === 'mobile-portrait') {
          for (const plan of fqPlans) {
            const ordinal = pageIds.indexOf(plan.animationId) + 1;
            invariant(ordinal > 0, `${plan.animationId} is absent from v7 manifest`);
            await selectAndWaitForPage(
              page,
              locale,
              plan.animationId,
              ordinal,
            );
            const fqResult = await inspectFqFlow(
              page,
              locale,
              plan.animationId,
              plan.count,
            );
            fq.push({...fqResult, viewport});
            if (!fqResult.passed) failures.push(
              `FQ ${locale.id}/${plan.animationId} failed`,
            );
          }
          artifacts.push(await stageScreenshot(
            page,
            stagingRoot,
            `support-fq-reset-${locale.id}.png`,
          ));
        }
        failures.push(...runtimeEventFailures(events).map((failure) =>
          `support ${locale.id}/${viewport.id}: ${failure}`));
      } finally {
        await context.close();
      }
    }
  }
  return {map, keyTerms, fq, runtimeEvents, artifacts, failures};
}

async function runPersistenceChecks({browser, baseUrl, pageIds}) {
  const entries = [];
  const runtimeEvents = [];
  const failures = [];
  const viewport = VIEWPORTS.find(({id}) => id === 'desktop-16x9');
  for (const locale of LOCALES) {
    const context = await browser.newContext({
      viewport: {width: viewport.width, height: viewport.height},
      deviceScaleFactor: 1,
      locale: locale.id === 'es' ? 'es-ES' : 'en-US',
      reducedMotion: 'no-preference',
      serviceWorkers: 'block',
    });
    try {
      const page = await context.newPage();
      const events = attachRuntimeMonitor(
        page,
        new URL(baseUrl).origin,
        `persistence:${locale.id}`,
      );
      runtimeEvents.push(events);
      await navigateCourse(page, baseUrl, locale);
      const storageKey = await waitForStorageKey(page);
      const initialUrl = page.url();
      const initialHistoryLength = await page.evaluate(() => history.length);
      const targetIndex = 26;
      const targetId = pageIds[targetIndex];
      await selectAndWaitForPage(page, locale, targetId, targetIndex + 1);
      await waitForStoredCurrentPage(page, storageKey, targetId);
      const storedAfterSelection = await readStoredSession(page, storageKey);
      const afterSelectionUrl = page.url();
      const afterSelectionHistoryLength = await page.evaluate(() =>
        history.length
      );

      await page.reload({waitUntil: 'domcontentloaded', timeout: 60_000});
      await page.locator(
        `${PLAYER_SELECTOR}[data-hydrated="true"]`
          + `[data-current-animation-id="${targetId}"]`,
      ).waitFor({state: 'visible', timeout: 60_000});
      await page.locator(
        `canvas[data-animation-id="${targetId}"]`
          + '[data-render-state="ready"]',
      ).waitFor({state: 'visible', timeout: 60_000});
      const reloadRestored = await page.locator(PLAYER_SELECTOR)
        .getAttribute('data-current-animation-id') === targetId;

      await page.evaluate(({key}) => {
        localStorage.setItem(key, '{invalid-json');
      }, {key: storageKey});
      await page.reload({waitUntil: 'domcontentloaded', timeout: 60_000});
      await page.locator(
        `${PLAYER_SELECTOR}[data-hydrated="true"]`
          + `[data-current-animation-id="${pageIds[0]}"]`,
      ).waitFor({state: 'visible', timeout: 60_000});
      await page.locator(
        `canvas[data-animation-id="${pageIds[0]}"]`
          + '[data-render-state="ready"]',
      ).waitFor({state: 'visible', timeout: 60_000});
      const invalidJsonFailedClosed = await page.locator(PLAYER_SELECTOR)
        .getAttribute('data-current-animation-id') === pageIds[0];
      const selectionChangedUrlOrHistory = initialUrl !== afterSelectionUrl
        || initialHistoryLength !== afterSelectionHistoryLength;
      const passed = storedAfterSelection?.currentAnimationId === targetId
        && reloadRestored
        && invalidJsonFailedClosed
        && !selectionChangedUrlOrHistory;
      if (!passed) failures.push(`Persistence ${locale.id} failed`);
      entries.push({
        locale: locale.id,
        storageKey,
        selectedAnimationId: targetId,
        storedAfterSelection,
        reloadRestored,
        invalidJsonFailedClosed,
        initialUrl,
        afterSelectionUrl,
        initialHistoryLength,
        afterSelectionHistoryLength,
        selectionChangedUrlOrHistory,
        perPageUrlStateAvailable: false,
        passed,
      });
      failures.push(...runtimeEventFailures(events).map((failure) =>
        `persistence ${locale.id}: ${failure}`));
    } finally {
      await context.close();
    }
  }
  return {entries, runtimeEvents, failures};
}

async function runDirectUrlChecks({request, baseUrl, probeAnimationId}) {
  const plans = [
    {kind: 'course', path: '/courses/5/4', expected: 200},
    {kind: 'course', path: '/es/courses/5/4', expected: 200},
    {kind: 'animation', path: `/animations/${probeAnimationId}`, expected: 404},
    {kind: 'animation', path: `/en/animations/${probeAnimationId}`, expected: 404},
    {kind: 'animation', path: `/es/animations/${probeAnimationId}`, expected: 404},
    {kind: 'demo', path: `/demos/${probeAnimationId}`, expected: 404},
    {kind: 'demo', path: `/en/demos/${probeAnimationId}`, expected: 404},
    {kind: 'demo', path: `/es/demos/${probeAnimationId}`, expected: 404},
  ];
  const entries = [];
  const failures = [];
  for (const plan of plans) {
    const response = await request.get(`${baseUrl}${plan.path}`, {
      failOnStatusCode: false,
      maxRedirects: 0,
    });
    const observed = response.status();
    const passed = observed === plan.expected;
    if (!passed) failures.push(
      `Direct URL ${plan.path}: expected ${plan.expected}, observed ${observed}`,
    );
    entries.push({
      ...plan,
      observed,
      controlledPreview:
        response.headers()['x-helpmath-controlled-preview'] ?? null,
      passed,
    });
  }
  return {
    entries,
    courseRoutesAvailable: entries
      .filter(({kind}) => kind === 'course')
      .every(({observed}) => observed === 200),
    perPageDirectUrlAvailable: entries
      .filter(({kind}) => kind !== 'course')
      .some(({observed}) => observed === 200),
    expectedV7BoundaryPreserved: failures.length === 0,
    failures,
  };
}

function aggregateNetwork(runtimeEventGroups) {
  const flattened = runtimeEventGroups.flat();
  const combined = {
    scopeCount: flattened.length,
    consoleErrors: flattened.flatMap(({scope, consoleErrors}) =>
      consoleErrors.map((value) => ({scope, value}))),
    pageErrors: flattened.flatMap(({scope, pageErrors}) =>
      pageErrors.map((value) => ({scope, value}))),
    failedRequests: flattened.flatMap(({scope, failedRequests}) =>
      failedRequests.map((value) => ({scope, ...value}))),
    ignoredAbortedRscRequests: flattened.flatMap(({
      scope,
      ignoredAbortedRscRequests,
    }) => ignoredAbortedRscRequests.map((value) => ({scope, ...value}))),
    badHttpResponses: flattened.flatMap(({scope, badHttpResponses}) =>
      badHttpResponses.map((value) => ({scope, ...value}))),
    externalRequests: flattened.flatMap(({scope, externalRequests}) =>
      externalRequests.map((value) => ({scope, ...value}))),
    dialogs: flattened.flatMap(({scope, dialogs}) =>
      dialogs.map((value) => ({scope, ...value}))),
    popups: flattened.flatMap(({scope, popups}) =>
      popups.map((value) => ({scope, ...value}))),
    downloads: flattened.flatMap(({scope, downloads}) =>
      downloads.map((value) => ({scope, ...value}))),
    webSockets: flattened.flatMap(({scope, webSockets}) =>
      webSockets.map((value) => ({scope, ...value}))),
  };
  combined.passed = [
    combined.consoleErrors,
    combined.pageErrors,
    combined.failedRequests,
    combined.badHttpResponses,
    combined.externalRequests,
    combined.dialogs,
    combined.popups,
    combined.downloads,
    combined.webSockets,
  ].every((values) => values.length === 0);
  return combined;
}

function exactVb004Rows(actualRows, expectedRows, fields) {
  return actualRows.length === expectedRows.length
    && expectedRows.every((expected, index) => fields.every((field) =>
      actualRows[index]?.[field] === expected[field]));
}

async function collectVb004AppOwnedSnapshot(
  page,
  expected,
  englishOwnedStrings,
) {
  return page.evaluate(({expectedCopy, englishStrings}) => {
    const normalize = (value) => value?.replace(/\s+/g, ' ').trim() ?? '';
    const mobile = [...document.querySelectorAll(
      '.course-g05-l04-vb004-mobile-surface',
    )].find((element) => element.getClientRects().length > 0);
    if (!mobile) return {error: 'visible mobile surface absent'};
    const functionalRoot = mobile.closest(
      '[data-current-js-functional-scope='
        + '"vb004-integers-source-script-bound-classification"]',
    );
    if (!functionalRoot) return {error: 'functional root absent'};
    const stage = functionalRoot.querySelector(
      '.course-g05-l04-vb004-stage-surface',
    );
    if (!stage) return {error: 'stage surface absent'};
    const sorted = (values) => values.sort((left, right) =>
      String(left.id).localeCompare(String(right.id)));
    const rows = (selector, mapper, root = functionalRoot) => sorted(
      [...root.querySelectorAll(selector)].map(mapper),
    );
    const mobileCards = rows(
      '[data-mobile-source-card]',
      (element) => ({
        id: element.getAttribute('data-mobile-source-card'),
        ariaLabel: element.getAttribute('aria-label'),
        ariaPressed: element.getAttribute('aria-pressed'),
        disabled: element.disabled,
      }),
      mobile,
    );
    const mobileTargets = rows(
      '[data-mobile-source-target]',
      (element) => ({
        id: element.getAttribute('data-mobile-source-target'),
        ariaLabel: element.getAttribute('aria-label'),
        disabled: element.disabled,
        text: normalize(element.textContent),
      }),
      mobile,
    );
    const stageCards = rows(
      '[data-source-card]',
      (element) => ({
        id: element.getAttribute('data-source-card'),
        ariaLabel: element.getAttribute('aria-label'),
        ariaPressed: element.getAttribute('aria-pressed'),
        disabled: element.disabled,
      }),
      stage,
    );
    const stagePlacedCards = rows(
      '[data-card-placed]',
      (element) => ({
        id: element.getAttribute('data-card-placed'),
        ariaLabel: element.getAttribute('aria-label'),
      }),
      stage,
    );
    const stageTargets = rows(
      '[data-source-target]',
      (element) => ({
        id: element.getAttribute('data-source-target'),
        ariaLabel: element.getAttribute('aria-label'),
        disabled: element.disabled,
        text: normalize(element.textContent),
      }),
      stage,
    );
    const mobileCardsGroup = mobile.querySelector(
      '.course-g05-l04-vb004-mobile-card-grid',
    );
    const mobileTargetsGroup = mobile.querySelector(
      '.course-g05-l04-vb004-mobile-target-grid',
    );
    const mobileFeedback = mobile.querySelector('p[role="status"]');
    const stageFeedback = stage.querySelector('[role="status"]');
    const candidateBoundary = [...functionalRoot.querySelectorAll(
      'p span[lang]',
    )].map((element) => normalize(element.textContent)).find(
      (value) => value === expectedCopy.ui.candidateBoundary,
    ) ?? null;
    const appOwnedCorpus = [
      mobile.getAttribute('aria-label'),
      stage.getAttribute('aria-label'),
      mobile.querySelector('strong')?.textContent,
      mobileCardsGroup?.getAttribute('aria-label'),
      mobileTargetsGroup?.getAttribute('aria-label'),
      mobileFeedback?.textContent,
      stageFeedback?.textContent,
      candidateBoundary,
      ...mobileCards.map(({ariaLabel}) => ariaLabel),
      ...mobileTargets.flatMap(({ariaLabel, text}) => [ariaLabel, text]),
      ...stageCards.map(({ariaLabel}) => ariaLabel),
      ...stagePlacedCards.map(({ariaLabel}) => ariaLabel),
      ...stageTargets.flatMap(({ariaLabel, text}) => [ariaLabel, text]),
    ].map(normalize).filter(Boolean);
    return {
      documentLanguage: document.documentElement.lang,
      functionalRoot: {
        appOwnedUiLanguage:
          functionalRoot.getAttribute('data-app-owned-ui-language'),
        sourceRuntimeLanguage:
          functionalRoot.getAttribute('data-source-runtime-language'),
      },
      candidateBoundary,
      mobile: {
        language: mobile.getAttribute('lang'),
        appOwnedUiLanguage:
          mobile.getAttribute('data-app-owned-ui-language'),
        controlsReady:
          mobile.getAttribute('data-current-js-controls-ready'),
        ariaBusy: mobile.getAttribute('aria-busy'),
        ariaLabel: mobile.getAttribute('aria-label'),
        instruction: normalize(mobile.querySelector('strong')?.textContent),
        cardsGroupLabel: mobileCardsGroup?.getAttribute('aria-label') ?? null,
        targetsGroupLabel:
          mobileTargetsGroup?.getAttribute('aria-label') ?? null,
        feedback: normalize(mobileFeedback?.textContent),
        cards: mobileCards,
        targets: mobileTargets,
      },
      stage: {
        language: stage.getAttribute('lang'),
        appOwnedUiLanguage:
          stage.getAttribute('data-app-owned-ui-language'),
        controlsReady:
          stage.getAttribute('data-current-js-controls-ready'),
        ariaBusy: stage.getAttribute('aria-busy'),
        ariaLabel: stage.getAttribute('aria-label'),
        feedback: normalize(stageFeedback?.textContent),
        cards: stageCards,
        placedCards: stagePlacedCards,
        targets: stageTargets,
      },
      appOwnedCorpus,
      englishRemnants: englishStrings.filter((englishString) =>
        appOwnedCorpus.some((value) => value.includes(englishString))),
    };
  }, {expectedCopy: expected, englishStrings: englishOwnedStrings});
}

async function runRemediationChecks({browser, baseUrl, pageIds, support}) {
  const runtimeEvents = [];
  const failures = [];
  const checks = [];
  const animationId = 'course-g05-l04-vb-004';
  const ordinal = pageIds.indexOf(animationId) + 1;
  invariant(ordinal > 0, `${animationId} is absent from v7 manifest`);

  const reducedViewport = VIEWPORTS.find(({id}) => id === 'desktop-16x9');
  const reducedContext = await newContext(
    browser,
    LOCALES[0],
    reducedViewport,
    'reduce',
  );
  try {
    const page = await reducedContext.newPage();
    const events = attachRuntimeMonitor(
      page,
      new URL(baseUrl).origin,
      'remediation:reduced-motion-pointer',
    );
    runtimeEvents.push(events);
    await navigateCourse(page, baseUrl, LOCALES[0]);
    await selectAndWaitForPage(page, LOCALES[0], animationId, ordinal);
    const target = page.getByRole('button', {name: 'Move negative five'});
    const note = page.locator('.reduced-motion-note[role="status"]');
    await target.waitFor({state: 'visible', timeout: 30_000});
    await page.waitForFunction(() => {
      const candidate = [...document.querySelectorAll('button')].find(
        (button) => button.getAttribute('aria-label') === 'Move negative five'
          && button.getClientRects().length > 0,
      );
      return Boolean(candidate)
        && candidate.disabled === false
        && getComputedStyle(candidate).pointerEvents !== 'none';
    }, undefined, {timeout: 30_000});
    await note.waitFor({state: 'visible', timeout: 30_000});
    const evidence = await target.evaluate((button) => {
      const reducedNote = button.closest('.runtime-shell')
        ?.querySelector('.reduced-motion-note');
      const rect = button.getBoundingClientRect();
      const center = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      const hit = document.elementFromPoint(center.x, center.y);
      return {
        targetAriaLabel: button.getAttribute('aria-label'),
        notePointerEvents: reducedNote
          ? getComputedStyle(reducedNote).pointerEvents
          : null,
        center,
        hitTag: hit?.tagName ?? null,
        hitAriaLabel: hit?.getAttribute('aria-label') ?? null,
        targetContainsHit: hit === button || Boolean(hit && button.contains(hit)),
        noteIntercepted: Boolean(hit?.closest('.reduced-motion-note')),
      };
    });
    const passed = evidence.notePointerEvents === 'none'
      && evidence.targetContainsHit
      && !evidence.noteIntercepted;
    checks.push({
      id: REMEDIATION_IDS[0],
      passed,
      evidence,
      acceptanceEffect: 'none',
    });
    if (!passed) failures.push('Reduced-motion note still intercepts the VB004 pointer target');
    failures.push(...runtimeEventFailures(events).map((failure) =>
      `reduced remediation: ${failure}`));
  } finally {
    await reducedContext.close();
  }

  const mobileViewport = VIEWPORTS.find(({id}) => id === 'mobile-portrait');
  const spanishContext = await newContext(
    browser,
    LOCALES[1],
    mobileViewport,
  );
  try {
    const page = await spanishContext.newPage();
    const events = attachRuntimeMonitor(
      page,
      new URL(baseUrl).origin,
      'remediation:vb004-spanish-and-exit',
    );
    runtimeEvents.push(events);
    await navigateCourse(page, baseUrl, LOCALES[1]);
    await selectAndWaitForPage(page, LOCALES[1], animationId, ordinal);

    const mobileSurface = page.locator(
      '.course-g05-l04-vb004-mobile-surface:visible',
    );
    await mobileSurface.waitFor({state: 'visible', timeout: 30_000});
    await page.waitForFunction(() => [...document.querySelectorAll(
      '.course-g05-l04-vb004-mobile-surface',
    )].some((element) => element.getClientRects().length > 0
      && element.getAttribute('data-current-js-controls-ready') === 'true'),
    undefined, {timeout: 30_000});

    const expectedSpanish = VB004_APP_OWNED_LOCALIZATION_EXPECTATIONS.es;
    const expectedEnglish = VB004_APP_OWNED_LOCALIZATION_EXPECTATIONS.en;
    const englishOwnedStrings = vb004AppOwnedStrings('en');
    const englishFeedbackStrings = [...new Set([
      ...Object.values(expectedEnglish.feedback),
      ...expectedEnglish.cards.flatMap((card) => [
        card.selectedFeedback,
        card.correctFeedback,
        card.wrongFeedback,
        card.notDroppedFeedback,
      ]),
    ])];
    const initialSnapshot = await collectVb004AppOwnedSnapshot(
      page,
      expectedSpanish,
      englishOwnedStrings,
    );
    const expectedInitialMobileCards = expectedSpanish.cards.map((card) => ({
      id: card.id,
      ariaLabel: card.selectAria,
      ariaPressed: 'false',
      disabled: false,
    }));
    const expectedInitialStageCards = expectedSpanish.cards.map((card) => ({
      id: card.id,
      ariaLabel: card.moveAria,
      ariaPressed: 'false',
      disabled: false,
    }));
    const expectedInitialMobileTargets = expectedSpanish.targets.map(
      (target) => ({
        id: target.id,
        ariaLabel: target.mobileAria,
        disabled: true,
        text: target.label,
      }),
    );
    const expectedInitialStageTargets = expectedSpanish.targets.map(
      (target) => ({
        id: target.id,
        ariaLabel: target.stageInitialAria,
        disabled: true,
        text: target.label,
      }),
    );
    const initialFeedback = `${expectedSpanish.feedback.idle} (0/8)`;
    const initialContractPassed = !initialSnapshot.error
      && initialSnapshot.documentLanguage === 'es'
      && initialSnapshot.functionalRoot.appOwnedUiLanguage === 'es'
      && initialSnapshot.functionalRoot.sourceRuntimeLanguage === 'en'
      && initialSnapshot.candidateBoundary
        === expectedSpanish.ui.candidateBoundary
      && initialSnapshot.mobile.language === 'es'
      && initialSnapshot.mobile.appOwnedUiLanguage === 'es'
      && initialSnapshot.mobile.controlsReady === 'true'
      && initialSnapshot.mobile.ariaBusy === 'false'
      && initialSnapshot.mobile.ariaLabel
        === expectedSpanish.ui.responsiveLabel
      && initialSnapshot.mobile.instruction
        === expectedSpanish.ui.instruction
      && initialSnapshot.mobile.cardsGroupLabel
        === expectedSpanish.ui.cardsGroupLabel
      && initialSnapshot.mobile.targetsGroupLabel
        === expectedSpanish.ui.targetsGroupLabel
      && initialSnapshot.mobile.feedback === initialFeedback
      && exactVb004Rows(
        initialSnapshot.mobile.cards,
        expectedInitialMobileCards,
        ['id', 'ariaLabel', 'ariaPressed', 'disabled'],
      )
      && exactVb004Rows(
        initialSnapshot.mobile.targets,
        expectedInitialMobileTargets,
        ['id', 'ariaLabel', 'disabled', 'text'],
      )
      && initialSnapshot.stage.language === 'es'
      && initialSnapshot.stage.appOwnedUiLanguage === 'es'
      && initialSnapshot.stage.controlsReady === 'true'
      && initialSnapshot.stage.ariaBusy === 'false'
      && initialSnapshot.stage.ariaLabel === expectedSpanish.ui.stageLabel
      && initialSnapshot.stage.feedback === initialFeedback
      && exactVb004Rows(
        initialSnapshot.stage.cards,
        expectedInitialStageCards,
        ['id', 'ariaLabel', 'ariaPressed', 'disabled'],
      )
      && initialSnapshot.stage.placedCards.length === 0
      && exactVb004Rows(
        initialSnapshot.stage.targets,
        expectedInitialStageTargets,
        ['id', 'ariaLabel', 'disabled', 'text'],
      )
      && initialSnapshot.englishRemnants.length === 0;

    const feedbackObservations = [];
    const cardStateObservations = [];
    const observeFeedback = async (phase, expectedText) => {
      await page.waitForFunction(({text}) => {
        const normalize = (value) =>
          value?.replace(/\s+/g, ' ').trim() ?? '';
        const surface = [...document.querySelectorAll(
          '.course-g05-l04-vb004-mobile-surface',
        )].find((element) => element.getClientRects().length > 0);
        return normalize(surface?.querySelector('p[role="status"]')
          ?.textContent) === text;
      }, {text: expectedText}, {timeout: 30_000});
      const observedText = await mobileSurface.locator(
        'p[role="status"]',
      ).evaluate((element) => element.textContent
        ?.replace(/\s+/g, ' ').trim() ?? '');
      const observation = {
        phase,
        expectedText,
        observedText,
        exactMatch: observedText === expectedText,
        englishRemnants: englishFeedbackStrings.filter((englishString) =>
          observedText.includes(englishString)),
      };
      feedbackObservations.push(observation);
      return observation;
    };
    const waitForMobileCardState = async (
      phase,
      cardId,
      expectedState,
    ) => {
      await page.waitForFunction(({id, expected}) => {
        const surface = [...document.querySelectorAll(
          '.course-g05-l04-vb004-mobile-surface',
        )].find((element) => element.getClientRects().length > 0);
        const card = surface?.querySelector(
          `[data-mobile-source-card="${CSS.escape(id)}"]`,
        );
        return card?.getAttribute('aria-label') === expected.ariaLabel
          && card?.getAttribute('aria-pressed') === expected.ariaPressed
          && card?.disabled === expected.disabled;
      }, {id: cardId, expected: expectedState}, {timeout: 30_000});
      const observed = await mobileSurface.locator(
        `[data-mobile-source-card="${cardId}"]`,
      ).evaluate((element) => ({
        ariaLabel: element.getAttribute('aria-label'),
        ariaPressed: element.getAttribute('aria-pressed'),
        disabled: element.disabled,
      }));
      const observation = {
        phase,
        cardId,
        expected: expectedState,
        observed,
        exactMatch: Object.entries(expectedState).every(
          ([key, value]) => observed[key] === value,
        ),
      };
      cardStateObservations.push(observation);
      return observation;
    };

    const wrongCard = expectedSpanish.cards[0];
    const wrongTarget = expectedSpanish.targets.find(
      ({id}) => id !== wrongCard.correctTargetId,
    );
    invariant(wrongTarget, 'VB004 wrong-target remediation fixture is absent');
    const wrongCardLocator = mobileSurface.locator(
      `[data-mobile-source-card="${wrongCard.id}"]`,
    );
    const wrongCardBox = await wrongCardLocator.boundingBox();
    invariant(wrongCardBox, 'VB004 Spanish card bounding box is absent');
    const wrongCardCenter = {
      x: wrongCardBox.x + wrongCardBox.width / 2,
      y: wrongCardBox.y + wrongCardBox.height / 2,
    };
    await page.mouse.move(wrongCardCenter.x, wrongCardCenter.y);
    await page.mouse.down();
    await page.mouse.move(wrongCardCenter.x + 12, wrongCardCenter.y, {
      steps: 2,
    });
    await page.mouse.up();
    const notDroppedFeedback = await observeFeedback(
      'not-dropped-Src_1',
      `${wrongCard.notDroppedFeedback} (0/8)`,
    );
    const notDroppedResetState = await waitForMobileCardState(
      'not-dropped-reset-Src_1',
      wrongCard.id,
      {
        ariaLabel: wrongCard.selectAria,
        ariaPressed: 'false',
        disabled: false,
      },
    );
    await wrongCardLocator.click();
    const wrongSelectedState = await waitForMobileCardState(
      'wrong-attempt-selected-Src_1',
      wrongCard.id,
      {
        ariaLabel: wrongCard.selectAria,
        ariaPressed: 'true',
        disabled: false,
      },
    );
    const wrongSelectedFeedback = await observeFeedback(
      'wrong-attempt-selected-Src_1',
      `${wrongCard.selectedFeedback} (0/8)`,
    );
    await mobileSurface.locator(
      `[data-mobile-source-target="${wrongTarget.id}"]`,
    ).click();
    const wrongFeedback = await observeFeedback(
      'wrong-target-Src_1',
      `${wrongCard.wrongFeedback} (0/8)`,
    );
    const wrongResetState = await waitForMobileCardState(
      'wrong-target-reset-Src_1',
      wrongCard.id,
      {
        ariaLabel: wrongCard.selectAria,
        ariaPressed: 'false',
        disabled: false,
      },
    );

    const placementObservations = [];
    for (const [index, card] of expectedSpanish.cards.entries()) {
      const placedBefore = index;
      const cardLocator = mobileSurface.locator(
        `[data-mobile-source-card="${card.id}"]`,
      );
      await cardLocator.click();
      const selectedState = await waitForMobileCardState(
        `correct-attempt-selected-${card.id}`,
        card.id,
        {
          ariaLabel: card.selectAria,
          ariaPressed: 'true',
          disabled: false,
        },
      );
      const selectedFeedback = await observeFeedback(
        `correct-attempt-selected-${card.id}`,
        `${card.selectedFeedback} (${placedBefore}/8)`,
      );
      await mobileSurface.locator(
        `[data-mobile-source-target="${card.correctTargetId}"]`,
      ).click();
      const placedState = await waitForMobileCardState(
        `correct-placement-${card.id}`,
        card.id,
        {
          ariaLabel: card.placedAria,
          ariaPressed: 'false',
          disabled: true,
        },
      );
      const placedCount = index + 1;
      const resultText = placedCount === expectedSpanish.cards.length
        ? expectedSpanish.feedback.complete
        : card.correctFeedback;
      const resultFeedback = await observeFeedback(
        `correct-placement-${card.id}`,
        `${resultText} (${placedCount}/8)`,
      );
      placementObservations.push({
        cardId: card.id,
        correctTargetId: card.correctTargetId,
        selectedState,
        selectedFeedback,
        placedState,
        resultFeedback,
        passed: selectedState.exactMatch
          && selectedFeedback.exactMatch
          && selectedFeedback.englishRemnants.length === 0
          && placedState.exactMatch
          && resultFeedback.exactMatch
          && resultFeedback.englishRemnants.length === 0,
      });
    }

    const finalSnapshot = await collectVb004AppOwnedSnapshot(
      page,
      expectedSpanish,
      englishOwnedStrings,
    );
    const expectedFinalMobileCards = expectedSpanish.cards.map((card) => ({
      id: card.id,
      ariaLabel: card.placedAria,
      ariaPressed: 'false',
      disabled: true,
    }));
    const expectedFinalPlacedCards = expectedSpanish.cards.map((card) => ({
      id: card.id,
      ariaLabel: card.placedAria,
    }));
    const expectedFinalMobileTargets = expectedSpanish.targets.map(
      (target) => ({
        id: target.id,
        ariaLabel: target.mobileAria,
        disabled: true,
        text: target.label,
      }),
    );
    const expectedFinalStageTargets = expectedSpanish.targets.map(
      (target) => ({
        id: target.id,
        ariaLabel: target.stageFinalAria,
        disabled: true,
        text: target.label,
      }),
    );
    const finalFeedback = `${expectedSpanish.feedback.complete} (8/8)`;
    const finalContractPassed = !finalSnapshot.error
      && finalSnapshot.documentLanguage === 'es'
      && finalSnapshot.functionalRoot.appOwnedUiLanguage === 'es'
      && finalSnapshot.functionalRoot.sourceRuntimeLanguage === 'en'
      && finalSnapshot.candidateBoundary
        === expectedSpanish.ui.candidateBoundary
      && finalSnapshot.mobile.language === 'es'
      && finalSnapshot.mobile.appOwnedUiLanguage === 'es'
      && finalSnapshot.mobile.controlsReady === 'true'
      && finalSnapshot.mobile.ariaBusy === 'false'
      && finalSnapshot.mobile.ariaLabel
        === expectedSpanish.ui.responsiveLabel
      && finalSnapshot.mobile.instruction
        === expectedSpanish.ui.instruction
      && finalSnapshot.mobile.cardsGroupLabel
        === expectedSpanish.ui.cardsGroupLabel
      && finalSnapshot.mobile.targetsGroupLabel
        === expectedSpanish.ui.targetsGroupLabel
      && finalSnapshot.mobile.feedback === finalFeedback
      && exactVb004Rows(
        finalSnapshot.mobile.cards,
        expectedFinalMobileCards,
        ['id', 'ariaLabel', 'ariaPressed', 'disabled'],
      )
      && exactVb004Rows(
        finalSnapshot.mobile.targets,
        expectedFinalMobileTargets,
        ['id', 'ariaLabel', 'disabled', 'text'],
      )
      && finalSnapshot.stage.language === 'es'
      && finalSnapshot.stage.appOwnedUiLanguage === 'es'
      && finalSnapshot.stage.controlsReady === 'true'
      && finalSnapshot.stage.ariaBusy === 'false'
      && finalSnapshot.stage.ariaLabel === expectedSpanish.ui.stageLabel
      && finalSnapshot.stage.feedback === finalFeedback
      && finalSnapshot.stage.cards.length === 0
      && exactVb004Rows(
        finalSnapshot.stage.placedCards,
        expectedFinalPlacedCards,
        ['id', 'ariaLabel'],
      )
      && exactVb004Rows(
        finalSnapshot.stage.targets,
        expectedFinalStageTargets,
        ['id', 'ariaLabel', 'disabled', 'text'],
      )
      && finalSnapshot.englishRemnants.length === 0;
    const runtimeFlashLanguage = await page.locator(
      `.runtime-stage[data-animation-id="${animationId}"]`,
    ).getAttribute('data-flash-lang');
    const interactionContractPassed = notDroppedFeedback.exactMatch
      && notDroppedFeedback.englishRemnants.length === 0
      && notDroppedResetState.exactMatch
      && wrongSelectedState.exactMatch
      && wrongSelectedFeedback.exactMatch
      && wrongSelectedFeedback.englishRemnants.length === 0
      && wrongFeedback.exactMatch
      && wrongFeedback.englishRemnants.length === 0
      && wrongResetState.exactMatch
      && placementObservations.length === expectedSpanish.cards.length
      && placementObservations.every(({passed}) => passed)
      && feedbackObservations.length === 19
      && feedbackObservations.every((observation) =>
        observation.exactMatch
        && observation.englishRemnants.length === 0)
      && cardStateObservations.every(({exactMatch}) => exactMatch);
    const spanishPassed = initialContractPassed
      && interactionContractPassed
      && finalContractPassed
      && runtimeFlashLanguage === 'en';
    checks.push({
      id: REMEDIATION_IDS[1],
      passed: spanishPassed,
      evidence: {
        expectedContract: {
          appOwnedUiLanguage: 'es',
          sourceRuntimeLanguage: 'en',
          checkedAppOwnedEnglishStringCount: englishOwnedStrings.length,
          checkedEnglishFeedbackStringCount: englishFeedbackStrings.length,
          expectedCardCount: expectedSpanish.cards.length,
          expectedTargetCount: expectedSpanish.targets.length,
        },
        initialContractPassed,
        initialSnapshot,
        interactionContractPassed,
        interaction: {
          feedbackObservations,
          cardStateObservations,
          placementObservations,
        },
        finalContractPassed,
        finalSnapshot,
        runtimeFlashLanguage,
      },
      acceptanceEffect: 'none',
    });
    if (!spanishPassed) failures.push('VB004 Spanish app-owned UI/source-runtime language split failed');

    const exitEvidence = await page.locator(
      '.lesson-shell2__legacy-stage',
    ).evaluate((stage) => {
      const stageRect = stage.getBoundingClientRect();
      const exits = [...stage.querySelectorAll(
        '[data-responsive-focus-surface="legacy"] '
          + '[data-responsive-focus-key="exit"]',
      )];
      const tolerance = 1;
      const controls = exits.map((exit) => {
        const rect = exit.getBoundingClientRect();
        const inside = rect.width > 0
          && rect.height > 0
          && rect.left >= stageRect.left - tolerance
          && rect.right <= stageRect.right + tolerance
          && rect.top >= stageRect.top - tolerance
          && rect.bottom <= stageRect.bottom + tolerance;
        return {
          ariaLabel: exit.getAttribute('aria-label'),
          rect: {
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
          },
          inside,
        };
      });
      const style = getComputedStyle(stage);
      return {
        viewport: {width: innerWidth, height: innerHeight},
        stageRect: {
          left: stageRect.left,
          right: stageRect.right,
          top: stageRect.top,
          bottom: stageRect.bottom,
          width: stageRect.width,
          height: stageRect.height,
        },
        stageOverflowX: style.overflowX,
        stageOverflowY: style.overflowY,
        legacyExitCount: controls.length,
        controls,
        allInside: controls.length > 0
          && controls.every(({inside}) => inside),
      };
    });
    const exitPassed = exitEvidence.viewport.width === 390
      && exitEvidence.allInside;
    checks.push({
      id: REMEDIATION_IDS[2],
      passed: exitPassed,
      evidence: exitEvidence,
      acceptanceEffect: 'none',
    });
    if (!exitPassed) failures.push('The 390px legacy Exit target is not fully inside the stage');
    failures.push(...runtimeEventFailures(events).map((failure) =>
      `Spanish/Exit remediation: ${failure}`));
  } finally {
    await spanishContext.close();
  }

  const mapEvidence = support.map.map((entry) => ({
    locale: entry.locale,
    viewport: entry.viewport,
    samePageAnimationId: entry.samePageAnimationId,
    samePageFocus: entry.samePageFocus,
    samePageFocusPassed: entry.samePageFocusPassed,
  }));
  const mapPassed = support.map.length === 4
    && support.map.every(({samePageFocusPassed}) => samePageFocusPassed);
  checks.push({
    id: REMEDIATION_IDS[3],
    passed: mapPassed,
    evidence: mapEvidence,
    acceptanceEffect: 'none',
  });
  if (!mapPassed) failures.push('Course Map same-current-page reselect did not focus the H1 in every support context');
  invariant(
    JSON.stringify(checks.map(({id}) => id)) === JSON.stringify(REMEDIATION_IDS),
    'Remediation checks are not in the required order',
  );
  return {checks, runtimeEvents, failures};
}

function assertionCounts({
  matrix,
  reducedMotion,
  replay,
  support,
  persistence,
  remediationChecks,
}) {
  const layoutObservations = matrix.entries.flatMap(
    ({observations}) => observations,
  );
  const replayActivations = replay.entries.flatMap(
    ({activations}) => activations,
  );
  const count = (values, predicate) => ({
    passed: values.filter(predicate).length,
    failed: values.filter((value) => !predicate(value)).length,
  });
  return {
    layout: count(layoutObservations, ({layoutPassed}) => layoutPassed),
    identity: count(layoutObservations, ({identityPassed}) => identityPassed),
    overflow: count(layoutObservations, ({overflowPassed}) => overflowPassed),
    reducedMotionObservations: count(
      reducedMotion.entries,
      ({passed}) => passed,
    ),
    reducedMotionSamples: count(
      reducedMotion.entries.flatMap(({samples, identityPassed}) =>
        samples.map((sample, index, values) => ({
          sample,
          identityPassed,
          stable: Number.isSafeInteger(sample.frame)
            && sample.frame >= 1
            && sample.frame === values[0].frame,
        }))),
      ({identityPassed, stable}) => identityPassed && stable,
    ),
    replayActivations: count(replayActivations, ({passed}) => passed),
    map: count(support.map, ({passed}) => passed),
    keyTerms: count(support.keyTerms, ({passed}) => passed),
    fq: count(support.fq, ({passed}) => passed),
    persistence: count(persistence.entries, ({passed}) => passed),
    remediations: count(remediationChecks, ({passed}) => passed),
  };
}

function freshClaims({
  matrix,
  reducedMotion,
  replay,
  support,
  persistence,
  directUrl,
  network,
  remediationChecks,
  sourceCurrentAtObservation,
}) {
  const layoutObservations = matrix.entries.flatMap(
    ({observations}) => observations,
  );
  const exactReleaseOrder = matrix.entries.length
      === LOCALES.length * VIEWPORTS.length
    && matrix.entries.every(({exactReleaseOrder: exact}) => exact);
  const layout = layoutObservations.length === LAYOUT_OBSERVATION_COUNT
    && layoutObservations.every((entry) =>
      entry.layoutPassed && entry.identityPassed && entry.overflowPassed
    );
  return {
    deepQaFreshlyPerformed: true,
    freshUnzip: true,
    packageVerifierBeforeAndAfter: false,
    dynamicLoopbackServer: true,
    sourceCurrentAtObservation,
    exactReleaseOrder,
    layout,
    reducedMotion: reducedMotion.entries.length
        === REDUCED_MOTION_OBSERVATION_COUNT
      && reducedMotion.entries.every(({passed}) => passed),
    replayMouseEnterSpace: replay.entries.length
        === LOCALES.length * ACTIVE_PAGE_COUNT
      && replay.entries.every(({activations, passed}) =>
        passed && activations.length === REPLAY_ACTIVATIONS.length
      ),
    map: support.map.length === 4
      && support.map.every(({passed}) => passed),
    keyTerms: support.keyTerms.length === 4
      && support.keyTerms.every(({passed}) => passed),
    fq: support.fq.length === 4
      && support.fq.every(({passed}) => passed),
    persistence: persistence.entries.length === 2
      && persistence.entries.every(({passed}) => passed),
    directUrlBoundary: directUrl.expectedV7BoundaryPreserved,
    perPageDirectUrl: directUrl.perPageDirectUrlAvailable,
    networkBoundary: network.passed,
    allFourV7Remediations: remediationChecks.length === 4
      && remediationChecks.every(({passed}) => passed),
  };
}

function falseScopeResult() {
  return {
    ...SCOPE_RESULT_PASS,
    currentJavascriptDeepProductQaMachineWorkExhausted: false,
  };
}

function initialReport() {
  return {
    schemaVersion: 1,
    reportType: REPORT_TYPE,
    packageId: PACKAGE_ID,
    status: 'running',
    generatedAt: new Date().toISOString(),
    generatorBinding: null,
    testBinding: null,
    archiveBinding: {
      path: relativeToWorkspace(ARCHIVE_PATH),
      bytes: null,
      sha256: null,
    },
    archiveSidecarBinding: {
      path: relativeToWorkspace(ARCHIVE_SHA_PATH),
      bytes: null,
      sha256: null,
    },
    archiveSourceStability: null,
    packageManifestBinding: {
      path: `${PACKAGE_BASENAME}/package-manifest.json`,
      bytes: null,
      sha256: null,
    },
    sourceObservation: {
      sourceCurrentAtObservation: false,
      packageSnapshot: null,
      currentSnapshot: null,
      delta: null,
      requiredForPass: true,
      currentWorkspaceSourceUsedToServeQa: false,
      qaRuntimeSource: 'fresh-unzip-hash-bound-v7-archive',
      acceptanceEffect: 'none',
    },
    authorityBoundary: {
      evidenceLayer: 'current-javascript-machine-product-qa-only',
      acceptanceNeutral: true,
      strictAcceptanceEffect: 'none',
      authoritativeOriginalRuntimeAuthority: false,
      audioAuthority: false,
      humanReviewAuthority: false,
      ownerAuthority: false,
      strictCompletionAuthority: false,
      publicationAuthority: false,
    },
    acceptanceEffects: {...ACCEPTANCE_EFFECTS},
    releaseBoundary: {
      releaseId: RELEASE_ID,
      activePages: ACTIVE_PAGE_COUNT,
      courseShells: 1,
      expectedMembers: RELEASE_MEMBER_COUNT,
      strictCompleteCount: 0,
      missingCount: RELEASE_MEMBER_COUNT,
      published: false,
    },
    scopeResult: falseScopeResult(),
    expectations: {
      locales: LOCALES,
      viewports: VIEWPORTS,
      activePages: ACTIVE_PAGE_COUNT,
      layoutObservations: LAYOUT_OBSERVATION_COUNT,
      reducedMotionObservations: REDUCED_MOTION_OBSERVATION_COUNT,
      reducedMotionSamples: REDUCED_MOTION_SAMPLE_COUNT,
      replayActivations: REPLAY_ACTIVATION_COUNT,
      mapChecks: 4,
      keyTermsChecks: 4,
      fqChecks: 4,
      persistenceChecks: 2,
      remediationChecks: 4,
      deviceScaleFactor: 1,
    },
    freshUnzip: null,
    packageVerifier: {before: null, after: null},
    matrix: {entries: []},
    reducedMotion: {entries: []},
    replay: {entries: []},
    support: {
      map: [],
      keyTerms: [],
      fq: [],
      persistence: {entries: []},
      directUrl: null,
    },
    network: null,
    assertionCounts: {},
    freshClaims: {
      deepQaFreshlyPerformed: false,
      freshUnzip: false,
      packageVerifierBeforeAndAfter: false,
      perPageDirectUrl: false,
    },
    knownLimitations: KNOWN_LIMITATIONS,
    remediationChecks: [],
    artifacts: [],
    outputBindings: null,
    failures: [],
  };
}

async function safelyRemoveRunRoot(runRoot) {
  if (!runRoot) return;
  invariant(
    path.dirname(runRoot) === WESTWORLD_TEMP_ROOT,
    'Refusing to remove a run root outside /Volumes/WestWorld',
  );
  invariant(
    path.basename(runRoot).startsWith(TEMP_PREFIX),
    'Refusing to remove an unrecognized run root',
  );
  const metadata = await lstatIfPresent(runRoot);
  if (!metadata) return;
  invariant(
    metadata.isDirectory() && !metadata.isSymbolicLink(),
    'Run root is not an ordinary directory',
  );
  await rm(runRoot, {recursive: true, force: false});
}

export async function runDeepProductQa(options) {
  const outputPlan = await prepareOutputPlan(options);
  await assertOrdinaryDirectory(
    WESTWORLD_TEMP_ROOT,
    'WestWorld temporary root',
  );
  const runRoot = await mkdtemp(path.join(WESTWORLD_TEMP_ROOT, TEMP_PREFIX));
  const report = initialReport();
  const stagedArtifacts = [];
  let server = null;
  let browser = null;
  let pinnedInputs = null;
  const serverLog = [];
  try {
    pinnedInputs = await pinArchiveInputs({runRoot});
    const sidecar = pinnedInputs.pinned.sidecar;
    const pinnedArchivePath = pinnedInputs.pinned.archivePath;
    report.archiveBinding = pinnedInputs.original.archiveBinding;
    report.archiveSidecarBinding = pinnedInputs.original.sidecarBinding;

    const archiveList = await runCommand(
      '/usr/bin/unzip',
      ['-Z1', pinnedArchivePath],
      {cwd: runRoot, timeoutMs: 120_000, outputLimit: null},
    );
    invariant(
      archiveList.status === 0,
      `Unable to list v7 archive: ${archiveList.stderr}`,
    );
    const archiveEntries = archiveList.stdout
      .split(/\r?\n/)
      .filter(Boolean);
    assertSafeArchiveEntries(archiveEntries);
    const archiveTest = await runCommand(
      '/usr/bin/unzip',
      ['-tq', pinnedArchivePath],
      {cwd: runRoot, timeoutMs: 180_000},
    );
    invariant(
      archiveTest.status === 0,
      `v7 archive integrity test failed: ${archiveTest.stderr}`,
    );

    const extractionRoot = path.join(runRoot, 'extracted');
    const stagingRoot = path.join(runRoot, 'staged-artifacts');
    await mkdir(extractionRoot, {recursive: false, mode: 0o700});
    await mkdir(stagingRoot, {recursive: false, mode: 0o700});
    const extraction = await runCommand(
      '/usr/bin/unzip',
      ['-q', pinnedArchivePath, '-d', extractionRoot],
      {cwd: runRoot, timeoutMs: 240_000},
    );
    invariant(
      extraction.status === 0,
      `Fresh v7 extraction failed: ${extraction.stderr}`,
    );
    const packageRoot = path.join(extractionRoot, PACKAGE_BASENAME);
    const packageMetadata = await lstat(packageRoot);
    invariant(
      packageMetadata.isDirectory() && !packageMetadata.isSymbolicLink(),
      'Fresh v7 package root is invalid',
    );
    const extractionInventory = await assertNoSymlinks(packageRoot);
    const manifestPath = path.join(packageRoot, 'package-manifest.json');
    report.packageManifestBinding = await fileBinding(
      manifestPath,
      extractionRoot,
    );
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    const pageIds = expectedPageIdsFromManifest(manifest);
    const packageSnapshotBefore = manifest.build?.inputSnapshotBefore;
    const packageSnapshotAfter = manifest.build?.inputSnapshotAfter;
    invariant(
      JSON.stringify(packageSnapshotBefore)
        === JSON.stringify(packageSnapshotAfter),
      'v7 manifest build input snapshots differ',
    );

    const releaseDocument = JSON.parse(await readFile(
      path.join(WORKSPACE_ROOT, 'catalog/lesson-releases.json'),
      'utf8',
    ));
    const release = selectG5L4Release(releaseDocument);
    const currentSnapshotAtStart = await buildCurrentPackageInputSnapshot(
      release,
    );
    report.sourceObservation = {
      ...sourceObservation(packageSnapshotAfter, currentSnapshotAtStart),
      manifestBuildSnapshotsEqual: true,
      currentSnapshotAtStart,
      currentSnapshotAtEnd: null,
      observedAtStart: new Date().toISOString(),
      observedAtEnd: null,
    };
    invariant(
      report.sourceObservation.sourceCurrentAtObservation,
      'Fresh current v7 package input snapshot differs from the manifest',
    );
    report.generatorBinding = await fileBinding(SCRIPT_PATH);
    report.testBinding = await fileBinding(path.join(
      WORKSPACE_ROOT,
      'scripts/qa-g5-l4-v7-deep-product.test.mjs',
    ));

    report.packageVerifier.before = await runCommand(
      process.execPath,
      ['verify.mjs'],
      {cwd: packageRoot, timeoutMs: 120_000},
    );
    invariant(
      report.packageVerifier.before.status === 0,
      'Fresh v7 package pre-QA verifier failed',
    );

    const port = await findAvailableLoopbackPort();
    const baseUrl = `http://127.0.0.1:${port}`;
    const runtimeRoot = path.join(packageRoot, 'runtime');
    invariant(
      typeof manifest.entry?.serverEntry === 'string'
        && manifest.entry.serverEntry.startsWith('runtime/'),
      'v7 server entry is invalid',
    );
    const serverEntry = manifest.entry.serverEntry.replace(/^runtime\//, '');
    resolveInside(runtimeRoot, serverEntry, 'v7 server entry');
    const environment = {
      ...process.env,
      NODE_ENV: 'production',
      G5_L4_CEO_PREVIEW_ENABLED: '1',
      G5_L4_WHOLE_LESSON_PACKAGE: '1',
      NEXT_TELEMETRY_DISABLED: '1',
      HOSTNAME: '127.0.0.1',
      PORT: String(port),
    };
    delete environment.VERCEL_ENV;
    server = spawn(process.execPath, [serverEntry], {
      cwd: runtimeRoot,
      env: environment,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    server.stdout.on('data', (chunk) => serverLog.push(chunk.toString()));
    server.stderr.on('data', (chunk) => serverLog.push(chunk.toString()));
    const initialResponse = await waitForCourse(
      `${baseUrl}/courses/5/4`,
      server,
    );
    const listenerOwnedBySpawnedChild = await childOwnsLoopbackListener(
      server,
      port,
    );
    invariant(
      listenerOwnedBySpawnedChild,
      'Dynamic loopback listener is not owned by the spawned v7 package child',
    );
    report.freshUnzip = {
      rootPolicy: 'unique-mkdtemp-directly-under-/Volumes/WestWorld',
      runRootBasename: path.basename(runRoot),
      packageRootBasename: path.basename(packageRoot),
      archiveSidecarSha256: sidecar.sha256,
      pinnedInput: {
        copyMode: 'create-exclusive-byte-copy',
        archive: pinnedInputs.pinned.archiveBinding,
        sidecar: pinnedInputs.pinned.sidecarBinding,
        sidecarFilename: pinnedInputs.pinned.sidecar.filename,
      },
      originalInputsUnchangedAtEnd: null,
      archiveIntegrityTest: archiveTest.status === 0,
      archiveEntryCount: archiveEntries.length,
      archiveEntriesSafetyCheckedInFull: true,
      extractionInventory,
      packageSource: 'hash-bound-v7-zip-only',
      currentWorkspaceSourceServed: false,
      loopback: {
        host: '127.0.0.1',
        dynamicPort: true,
        port,
        baseUrl,
        listenerOwnedBySpawnedChild,
        initialResponse,
      },
      serverEntry: manifest.entry.serverEntry,
    };

    const playwright = await import('playwright');
    browser = await playwright.chromium.launch({headless: true});
    const matrix = await runLayoutMatrix({
      browser,
      baseUrl,
      pageIds,
      stagingRoot,
    });
    stagedArtifacts.push(...matrix.artifacts);
    const reducedMotion = await runReducedMotionMatrix({
      browser,
      baseUrl,
      pageIds,
    });
    const replay = await runReplayMatrix({browser, baseUrl, pageIds});
    const support = await runSupportChecks({
      browser,
      baseUrl,
      pageIds,
      stagingRoot,
    });
    stagedArtifacts.push(...support.artifacts);
    const persistence = await runPersistenceChecks({
      browser,
      baseUrl,
      pageIds,
    });
    const request = await playwright.request.newContext();
    let directUrl;
    try {
      directUrl = await runDirectUrlChecks({
        request,
        baseUrl,
        probeAnimationId: 'course-g05-l04-vb-004',
      });
    } finally {
      await request.dispose();
    }
    const remediation = await runRemediationChecks({
      browser,
      baseUrl,
      pageIds,
      support,
    });
    await browser.close();
    browser = null;

    report.matrix = {entries: matrix.entries};
    report.reducedMotion = {entries: reducedMotion.entries};
    report.replay = {entries: replay.entries};
    report.support = {
      map: support.map,
      keyTerms: support.keyTerms,
      fq: support.fq,
      persistence,
      directUrl,
    };
    report.remediationChecks = remediation.checks;
    report.network = aggregateNetwork([
      matrix.runtimeEvents,
      reducedMotion.runtimeEvents,
      replay.runtimeEvents,
      support.runtimeEvents,
      persistence.runtimeEvents,
      remediation.runtimeEvents,
    ]);
    report.assertionCounts = assertionCounts({
      matrix,
      reducedMotion,
      replay,
      support,
      persistence,
      remediationChecks: remediation.checks,
    });
    report.failures = [
      ...matrix.failures,
      ...reducedMotion.failures,
      ...replay.failures,
      ...support.failures,
      ...persistence.failures,
      ...directUrl.failures,
      ...remediation.failures,
    ];

    await stopChild(server);
    server = null;
    report.packageVerifier.after = await runCommand(
      process.execPath,
      ['verify.mjs'],
      {cwd: packageRoot, timeoutMs: 120_000},
    );
    invariant(
      report.packageVerifier.after.status === 0,
      'Fresh v7 package post-QA verifier failed',
    );
    report.freshUnzip.serverLogTail = serverLog.join('').slice(-20_000);

    const currentSnapshotAtEnd = await buildCurrentPackageInputSnapshot(
      release,
    );
    report.sourceObservation = {
      ...sourceObservation(packageSnapshotAfter, currentSnapshotAtEnd),
      manifestBuildSnapshotsEqual: true,
      currentSnapshotAtStart,
      currentSnapshotAtEnd,
      observedAtStart: report.sourceObservation.observedAtStart,
      observedAtEnd: new Date().toISOString(),
      unchangedThroughoutQa:
        JSON.stringify(currentSnapshotAtStart)
        === JSON.stringify(currentSnapshotAtEnd),
    };
    if (!report.sourceObservation.sourceCurrentAtObservation) {
      report.failures.push(
        'Current v7 package input snapshot drifted before QA evidence completion',
      );
    }
    report.archiveSourceStability =
      await observeOriginalArchiveInputStability(pinnedInputs);
    report.freshUnzip.originalInputsUnchangedAtEnd =
      report.archiveSourceStability.unchanged;
    invariant(
      report.archiveSourceStability.unchanged,
      'Original v7 archive or sidecar changed after the pinned QA copy was created',
    );
    report.freshClaims = freshClaims({
      matrix,
      reducedMotion,
      replay,
      support,
      persistence,
      directUrl,
      network: report.network,
      remediationChecks: remediation.checks,
      sourceCurrentAtObservation:
        report.sourceObservation.sourceCurrentAtObservation,
    });
    report.freshClaims.packageVerifierBeforeAndAfter = true;

    if (report.failures.length === 0) {
      report.status = 'pass-current-javascript-deep-product-qa';
      report.scopeResult = {...SCOPE_RESULT_PASS};
      const boundaryErrors = validateReportBoundary(report);
      if (boundaryErrors.length > 0) {
        report.failures.push(...boundaryErrors.map((value) =>
          `Pass boundary: ${value}`));
        report.status = 'fail-current-javascript-deep-product-qa';
        report.scopeResult = falseScopeResult();
      }
    } else {
      report.status = 'fail-current-javascript-deep-product-qa';
      report.scopeResult = falseScopeResult();
    }
  } catch (error) {
    report.failures.push(error instanceof Error ? error.message : String(error));
    report.status = 'fail-current-javascript-deep-product-qa-execution';
    report.scopeResult = falseScopeResult();
    if (browser) await browser.close().catch(() => undefined);
    browser = null;
    await stopChild(server).catch(() => undefined);
    server = null;
    if (report.freshUnzip) {
      report.freshUnzip.serverLogTail = serverLog.join('').slice(-20_000);
    }
    if (pinnedInputs && !report.archiveSourceStability) {
      try {
        report.archiveSourceStability =
          await observeOriginalArchiveInputStability(pinnedInputs);
        if (report.freshUnzip) {
          report.freshUnzip.originalInputsUnchangedAtEnd =
            report.archiveSourceStability.unchanged;
        }
        if (!report.archiveSourceStability.unchanged) {
          report.failures.push(
            'Original v7 archive or sidecar changed after the pinned QA copy was created',
          );
        }
      } catch (stabilityError) {
        report.failures.push(
          `Unable to rehash original v7 archive inputs at QA end: ${
            stabilityError instanceof Error
              ? stabilityError.message
              : String(stabilityError)
          }`,
        );
      }
    }
  }

  try {
    const result = await commitImmutableEvidence(
      outputPlan,
      report,
      stagedArtifacts,
    );
    return {report, result};
  } finally {
    await safelyRemoveRunRoot(runRoot);
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const {report, result} = await runDeepProductQa(options);
  process.stdout.write(stableJson({
    status: report.status,
    outputJson: relativeToWorkspace(result.json.path),
    outputMd: relativeToWorkspace(result.markdown.path),
    artifactCount: result.artifacts.length,
    failureCount: report.failures.length,
  }));
  if (report.status !== 'pass-current-javascript-deep-product-qa') {
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  await main();
}
