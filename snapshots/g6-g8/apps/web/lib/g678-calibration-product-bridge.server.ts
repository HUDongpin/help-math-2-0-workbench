import {activeHostPins} from './g678-active-host-pins.server';
import {resolveTypographyHostClosurePins,typographyHostFingerprintPaths,currentTypographyHostBinding} from './g678-typography-host-successor.server';
import * as frozenContinuousAudioAuthority from './g678-frozen16-thirteen-source-audio-v2-authority.server';
import * as frozenGlossaryOriginalAuthority from './g678-frozen16-glossary-authority.server';
import * as frozenGlossaryPreparedAuthority from './g678-frozen16-prepared-glossary-authority.server';
import {currentFrozen16LocalAuthorityScope} from './g678-frozen16-default-scope.server';
import 'server-only';

import {createHash} from 'node:crypto';
import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  realpathSync,
  statSync,
} from 'node:fs';
import path from 'node:path';

import {
  hasLocalOnlyAnimationModule as hasAnimationModule,
  localOnlyAnimationModuleRegistration as animationModuleRegistration,
  registeredLocalOnlyAnimationKeys,
} from '@helpmath/demos/local-only-animation-registry-metadata';

import {getWorkspaceRoot} from './catalog';
import {isG678CompiledLocalQaEnabled} from './g678-preview-policy';
import {sharedCatalogProjectionIsValid} from
  './g678-shared-course-catalog.server';
import {
  G678_BEHAVIOR_DELTA_AUTHORITY_TYPE,
  G678_INSTRUCTIONAL_BEHAVIOR_DELTA_FRAGMENT,
  G678_INSTRUCTIONAL_PREDECESSOR_FRAGMENT,
  validateG678InstructionalBehaviorDelta,
} from './g678-instructional-behavior-delta-authority.server';
import {
  G678_MATH_COMPANION_AUTHORITY_TYPE,
  validateG678MathCompanionAuthority,
} from './g678-math-companion-authority.server';
import {
  G678_P042_AUTHORITY, G678_P042_AUTHORITY_TYPE, G678_P042_BASE, G678_P042_FAMILY,
  G678_P042_ID, G678_P042_PREDECESSOR, G678_P042_READABLE, G678_P042_RUN_PATH,
  g678P042PhysicalClosurePins, readG678P042FileBinding, resolveG678P042PhysicalPath,
  validateG678P042CompanionAuthority, validateG678P042PhysicalClosure, readG678P042PhysicalPin,
} from './g678-nms-l01-p042-companion-authority.server';
import {
  G678_P044_ACTIVE_REGISTRY, G678_P044_AUTHORITY, G678_P044_AUTHORITY_TYPE, G678_P044_CANDIDATE,
  G678_P044_FAMILY, G678_P044_FREEZE, G678_P044_GLOSSARY, G678_P044_ID, G678_P044_PREDECESSOR, G678_P044_WITNESS, G678_P044_DESCRIPTOR_BOUNDARY,
  readG678P044FileBinding, readG678P044PhysicalPin, resolveG678P044PhysicalPath,
  validateG678P044Authority, validateG678P044PhysicalClosure,
} from './g678-nms-l01-p044-authority.server';
import {G678_P044_REPAIR_TYPE,G678_P044_REPAIR_AUTHORITY,G678_P044_REPAIR_CANDIDATE,G678_P044_REPAIR_FREEZE,G678_P044_REPAIR_REGISTRY,
  validateG678P044RepairAuthority,validateG678P044RepairPhysicalClosure,readG678P044RepairPackage,type P044RepairLineage} from './g678-nms-l01-p044-live-clock-authority.server';
import type {
  PageOnlyLessonGlossaryEntry,
  PageOnlyLessonPlayerDescriptor,
  SourceBoundLabel,
  WholeLessonPlayerPage,
} from './whole-lesson-player-descriptor';

export const G678_CALIBRATION_ID =
  'g678-16-page-product-calibration-v1';
export const G678_CALIBRATION_ANIMATION_ID_PATTERN =
  /^shared-(nms002|geo001|alg001|dat001)-l\d{2}-p\d{3}$/u;

const calibrationPhase = process.env.HELP_MATH_G678_CALIBRATION_PHASE;
const {FROZEN_GLOSSARY_FREEZE,FROZEN_GLOSSARY_REGISTRY_WITNESS,readFrozenGlossaryPackage,validateFrozenGlossaryReplacement} =
  currentFrozen16LocalAuthorityScope()
    ? frozenContinuousAudioAuthority :
  calibrationPhase === 'frozen16-prepared-glossary-provisional-browser-qa'
    ? frozenGlossaryPreparedAuthority : frozenGlossaryOriginalAuthority;
export const G678_PROVISIONAL_CALIBRATION_FREEZE_PATH =
  'catalog/product-bridge-calibrations/g678-current-js-276-page-registration-v1.json';
export const G678_IN02_PROVISIONAL_CALIBRATION_FREEZE_PATH =
  'catalog/product-bridge-calibrations/g678-current-js-290-page-registration-v1.json';
export const G678_VB02_PROVISIONAL_CALIBRATION_FREEZE_PATH =
  'catalog/product-bridge-calibrations/g678-current-js-301-page-registration-v1.json';
export const G678_VB03_PROVISIONAL_CALIBRATION_FREEZE_PATH =
  'catalog/product-bridge-calibrations/g678-current-js-310-page-registration-v1.json';
export const G678_ALG_L09_GLOSSARY_PROVISIONAL_CALIBRATION_FREEZE_PATH =
  'catalog/product-bridge-calibrations/g678-current-js-319-page-registration-v1.json';
export const G678_ALG_L09_TERMINAL_STOP_PROVISIONAL_CALIBRATION_FREEZE_PATH =
  'catalog/product-bridge-calibrations/g678-current-js-322-page-registration-v1.json';
export const G678_ALG_L09_VB03_TERMINAL_STOP_PROVISIONAL_CALIBRATION_FREEZE_PATH =
  'catalog/product-bridge-calibrations/g678-current-js-323-page-registration-v1.json';
export const G678_ALG_L09_INTRO_SHELL_LINKAGE_PROVISIONAL_CALIBRATION_FREEZE_PATH =
  'catalog/product-bridge-calibrations/g678-current-js-324-page-registration-v1.json';
export const G678_ALG_L09_VB06_DRAG_PROVISIONAL_CALIBRATION_FREEZE_PATH =
  'catalog/product-bridge-calibrations/g678-current-js-325-page-registration-v1.json';
export const G678_ALG_L09_VB02_GLOSSARY_PROVISIONAL_CALIBRATION_FREEZE_PATH =
  'catalog/product-bridge-calibrations/g678-current-js-326-page-registration-v1.json';
export const G678_ALG_L09_IN04_NUMERIC_PROVISIONAL_CALIBRATION_FREEZE_PATH =
  'catalog/product-bridge-calibrations/g678-current-js-327-page-registration-v1.json';
export const G678_ALG_L09_IN06_CHOICE_PROVISIONAL_CALIBRATION_FREEZE_PATH =
  'catalog/product-bridge-calibrations/g678-current-js-328-page-registration-v1.json';
export const G678_ALG_L09_IN08_CHOICE_PROVISIONAL_CALIBRATION_FREEZE_PATH =
  'catalog/product-bridge-calibrations/g678-current-js-329-page-registration-v1.json';
export const G678_ALG_L09_IN10_CHOICE_PROVISIONAL_CALIBRATION_FREEZE_PATH =
  'catalog/product-bridge-calibrations/g678-current-js-330-page-registration-v1.json';
export const G678_ALG_L09_TI_CHOICE_PROVISIONAL_CALIBRATION_FREEZE_PATH =
  'catalog/product-bridge-calibrations/g678-current-js-336-page-registration-v1.json';
export const G678_ALG_L09_GUIDED_TUTORIAL_PROVISIONAL_CALIBRATION_FREEZE_PATH =
  'catalog/product-bridge-calibrations/g678-current-js-339-page-registration-v1.json';
export const G678_ALG_L09_GAME_ASSESSMENT_PROVISIONAL_CALIBRATION_FREEZE_PATH =
  'catalog/product-bridge-calibrations/g678-current-js-342-page-registration-v1.json';
export const G678_ALG_L11_TRANCHE1_PROVISIONAL_CALIBRATION_FREEZE_PATH =
  'catalog/product-bridge-calibrations/g678-current-js-354-page-registration-v1.json';
// PROVISIONAL377_BRIDGE_BEGIN: freeze-phase
export const G678_ALG_L11_REMAINING23_PROVISIONAL_CALIBRATION_FREEZE_PATH =
  'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v1.json';
// PROVISIONAL377_BRIDGE_END: freeze-phase
export const G678_ALG_L11_INSTRUCTIONAL_SUCCESSOR_FREEZE_PATH =
  'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v2.json';
export const G678_ALG_L11_FEEDBACK_HOST_SCORE_SUCCESSOR_FREEZE_PATH =
  'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v3.json';
export const G678_ALG_L11_MATH_COMPANION_SUCCESSOR_FREEZE_PATH =
  'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v4.json';
export const G678_NMS_L01_P042_COMPANION_FREEZE_PATH =
  'catalog/product-bridge-calibrations/g678-current-js-378-page-registration-v1.json';
export const G678_NMS_L01_P044_PREPARED_FREEZE_PATH = G678_P044_FREEZE.path;
export const G678_NMS_L01_P044_REPAIR_FREEZE_PATH = G678_P044_REPAIR_FREEZE.path;
export const G678_PREDECESSOR_RECALIBRATION_FREEZE_PATH =
  'catalog/product-bridge-calibrations/g678-current-js-261-page-registration-v1.json';
export const G678_PRODUCT_CALIBRATED_FREEZE_PATH =
  'catalog/product-bridge-calibrations/g678-current-js-261-page-product-calibrated-registration-v1.json';
const G678_CANONICAL_FREEZE_NAME =
  /^g678-current-js-\d+-page(?:-product-calibrated)?-registration-v\d+\.json$/u;
function registryBoundG678FreezePath() {
  const registrations = registeredLocalOnlyAnimationKeys
    .filter((animationId) => G678_CALIBRATION_ANIMATION_ID_PATTERN.test(
      animationId))
    .map((animationId) => animationModuleRegistration(animationId))
    .filter((registration) => registration?.calibrationId ===
      G678_CALIBRATION_ID);
  if (registrations.length === 0) {
    return G678_PRODUCT_CALIBRATED_FREEZE_PATH;
  }
  const freezeSha256s = new Set(registrations.map((registration) =>
    registration?.freezeManifestSha256));
  if (freezeSha256s.size !== 1) {
    throw new Error('G678_CALIBRATION_REGISTRY_FREEZE_SHA_INVALID');
  }
  const [freezeSha256] = freezeSha256s;
  const workspaceRoot = getWorkspaceRoot();
  const relativeDirectory = 'catalog/product-bridge-calibrations';
  const directory = path.join(workspaceRoot, relativeDirectory);
  const candidates = readdirSync(directory).filter((name) =>
    (G678_CANONICAL_FREEZE_NAME.test(name) ||
      [G678_ALG_L11_INSTRUCTIONAL_SUCCESSOR_FREEZE_PATH,
        G678_ALG_L11_FEEDBACK_HOST_SCORE_SUCCESSOR_FREEZE_PATH,
        G678_ALG_L11_MATH_COMPANION_SUCCESSOR_FREEZE_PATH,
        G678_NMS_L01_P044_REPAIR_FREEZE_PATH, FROZEN_GLOSSARY_FREEZE.path].includes(
          path.posix.join(relativeDirectory, name)))).flatMap((name) => {
    const absolute = path.join(directory, name);
    const metadata = lstatSync(absolute);
    if (!metadata.isFile() || metadata.isSymbolicLink() ||
      metadata.nlink !== 1 || realpathSync(absolute) !== absolute) return [];
    const bytes = readFileSync(absolute);
    if (createHash('sha256').update(bytes).digest('hex') !== freezeSha256) {
      return [];
    }
    const value = record(JSON.parse(bytes.toString('utf8')));
    return value.calibrationId === G678_CALIBRATION_ID &&
      value.deploymentScope === 'local-only' &&
      array(value.selectedPages).length === registrations.length
      ? [path.posix.join(relativeDirectory, name)]
      : [];
  });
  if (candidates.length !== 1) {
    throw new Error('G678_CALIBRATION_REGISTRY_FREEZE_BINDING_INVALID');
  }
  return candidates[0];
}

export const G678_CALIBRATION_FREEZE_PATH =
  ['frozen16-glossary-provisional-browser-qa','frozen16-prepared-glossary-provisional-browser-qa','frozen16-continuous-audio-provisional-browser-qa'].includes(process.env.HELP_MATH_G678_CALIBRATION_PHASE ?? '')
    ? FROZEN_GLOSSARY_FREEZE.path :
  process.env.HELP_MATH_G678_CALIBRATION_PHASE ===
    'predecessor-browser-recalibration'
    ? G678_PREDECESSOR_RECALIBRATION_FREEZE_PATH
    : process.env.HELP_MATH_G678_CALIBRATION_PHASE ===
      'in02-provisional-browser-qa'
      ? G678_IN02_PROVISIONAL_CALIBRATION_FREEZE_PATH
    : process.env.HELP_MATH_G678_CALIBRATION_PHASE ===
      'vb02-provisional-browser-qa'
      ? G678_VB02_PROVISIONAL_CALIBRATION_FREEZE_PATH
    : process.env.HELP_MATH_G678_CALIBRATION_PHASE ===
      'vb03-provisional-browser-qa'
      ? G678_VB03_PROVISIONAL_CALIBRATION_FREEZE_PATH
    : process.env.HELP_MATH_G678_CALIBRATION_PHASE ===
      'alg-l09-simple-glossary-provisional-browser-qa'
      ? G678_ALG_L09_GLOSSARY_PROVISIONAL_CALIBRATION_FREEZE_PATH
    : process.env.HELP_MATH_G678_CALIBRATION_PHASE ===
      'alg-l09-terminal-stop-provisional-browser-qa'
      ? G678_ALG_L09_TERMINAL_STOP_PROVISIONAL_CALIBRATION_FREEZE_PATH
    : process.env.HELP_MATH_G678_CALIBRATION_PHASE ===
      'alg-l09-vb03-terminal-stop-provisional-browser-qa'
      ? G678_ALG_L09_VB03_TERMINAL_STOP_PROVISIONAL_CALIBRATION_FREEZE_PATH
    : process.env.HELP_MATH_G678_CALIBRATION_PHASE ===
      'alg-l09-intro-shell-linkage-provisional-browser-qa'
      ? G678_ALG_L09_INTRO_SHELL_LINKAGE_PROVISIONAL_CALIBRATION_FREEZE_PATH
    : process.env.HELP_MATH_G678_CALIBRATION_PHASE ===
      'alg-l09-vb06-drag-provisional-browser-qa'
      ? G678_ALG_L09_VB06_DRAG_PROVISIONAL_CALIBRATION_FREEZE_PATH
    : process.env.HELP_MATH_G678_CALIBRATION_PHASE ===
      'alg-l09-vb02-glossary-provisional-browser-qa'
      ? G678_ALG_L09_VB02_GLOSSARY_PROVISIONAL_CALIBRATION_FREEZE_PATH
    : process.env.HELP_MATH_G678_CALIBRATION_PHASE ===
      'alg-l09-in04-numeric-provisional-browser-qa'
      ? G678_ALG_L09_IN04_NUMERIC_PROVISIONAL_CALIBRATION_FREEZE_PATH
    : process.env.HELP_MATH_G678_CALIBRATION_PHASE ===
      'alg-l09-in06-choice-provisional-browser-qa'
      ? G678_ALG_L09_IN06_CHOICE_PROVISIONAL_CALIBRATION_FREEZE_PATH
    : process.env.HELP_MATH_G678_CALIBRATION_PHASE ===
      'alg-l09-in08-choice-provisional-browser-qa'
      ? G678_ALG_L09_IN08_CHOICE_PROVISIONAL_CALIBRATION_FREEZE_PATH
    : process.env.HELP_MATH_G678_CALIBRATION_PHASE ===
      'alg-l09-in10-choice-provisional-browser-qa'
      ? G678_ALG_L09_IN10_CHOICE_PROVISIONAL_CALIBRATION_FREEZE_PATH
    : process.env.HELP_MATH_G678_CALIBRATION_PHASE ===
      'alg-l09-ti-choice-provisional-browser-qa'
      ? G678_ALG_L09_TI_CHOICE_PROVISIONAL_CALIBRATION_FREEZE_PATH
    : process.env.HELP_MATH_G678_CALIBRATION_PHASE ===
      'alg-l09-guided-tutorial-provisional-browser-qa'
      ? G678_ALG_L09_GUIDED_TUTORIAL_PROVISIONAL_CALIBRATION_FREEZE_PATH
    : process.env.HELP_MATH_G678_CALIBRATION_PHASE ===
      'alg-l09-game-assessment-provisional-browser-qa'
      ? G678_ALG_L09_GAME_ASSESSMENT_PROVISIONAL_CALIBRATION_FREEZE_PATH
    : process.env.HELP_MATH_G678_CALIBRATION_PHASE ===
      'alg-l11-tranche1-provisional-browser-qa'
      ? G678_ALG_L11_TRANCHE1_PROVISIONAL_CALIBRATION_FREEZE_PATH
    // PROVISIONAL377_BRIDGE_BEGIN: phase
    : process.env.HELP_MATH_G678_CALIBRATION_PHASE ===
      'alg-l11-remaining23-provisional-browser-qa'
      ? G678_ALG_L11_REMAINING23_PROVISIONAL_CALIBRATION_FREEZE_PATH
    // PROVISIONAL377_BRIDGE_END: phase
    : process.env.HELP_MATH_G678_CALIBRATION_PHASE ===
      'alg-l11-instructional-successor-provisional-browser-qa'
      ? G678_ALG_L11_INSTRUCTIONAL_SUCCESSOR_FREEZE_PATH
    : process.env.HELP_MATH_G678_CALIBRATION_PHASE ===
      'alg-l11-feedback-host-score-successor-provisional-browser-qa'
      ? G678_ALG_L11_FEEDBACK_HOST_SCORE_SUCCESSOR_FREEZE_PATH
    : process.env.HELP_MATH_G678_CALIBRATION_PHASE ===
      'alg-l11-math-companion-provisional-browser-qa'
      ? G678_ALG_L11_MATH_COMPANION_SUCCESSOR_FREEZE_PATH
    : process.env.HELP_MATH_G678_CALIBRATION_PHASE ===
      'nms-l01-p044-live-clock-provisional-browser-qa'
      ? G678_NMS_L01_P044_REPAIR_FREEZE_PATH
    : process.env.HELP_MATH_G678_CALIBRATION_PHASE ===
      'nms-l01-p044-prepared-provisional-browser-qa'
      ? G678_NMS_L01_P044_PREPARED_FREEZE_PATH
    : process.env.HELP_MATH_G678_CALIBRATION_PHASE ===
      'nms-l01-p042-companion-provisional-browser-qa'
      ? G678_NMS_L01_P042_COMPANION_FREEZE_PATH
    : process.env.HELP_MATH_G678_CALIBRATION_PHASE ===
      'provisional-browser-qa'
      ? G678_PROVISIONAL_CALIBRATION_FREEZE_PATH
      : registryBoundG678FreezePath();
export const G678_SHARED_CATALOG_PATH =
  'catalog/g678-shared-catalog.v1.json';
export const G678_SHARED_PROFILE_PATH =
  'catalog/g678-shared-source-profile.v1.json';
export const G678_LOCAL_RUNTIME_ROOT =
  'work/g678-shared-page-factory';

const SHA256 = /^[a-f0-9]{64}$/u;
const UNDECODED_MATH_ENTITY =
  /&(?:#\d+|#x[a-f0-9]+|lt|gt|le|ge|ne);/iu;
const MODULE_CODES = new Set(['NMS002', 'GEO001', 'ALG001', 'DAT001']);
const COMPLEXITY_LANES = new Set([
  'low',
  'interactive-understood',
  'behavior-heavy',
]);
const RUNTIME_KINDS = new Set([
  'source-static-current-js-candidate',
  'source-script-bound-product-behavior-current-js-candidate',
  'source-script-bound-grouped-drag-current-js-candidate',
  'source-script-bound-numeric-response-current-js-candidate',
  'source-script-bound-choice-quiz-current-js-candidate',
  'source-script-bound-ti-choice-current-js-candidate',
  'source-script-bound-guided-tutorial-current-js-candidate',
  'source-script-bound-game-controller-current-js-candidate',
  'source-script-bound-matching-game-current-js-candidate',
  'source-script-bound-final-assessment-current-js-candidate',
]);
const REPLAY_SEMANTICS = new Set([
  'renderer-restart-only-source-behavior-not-established',
  'product-complete-state-reset-original-runtime-parity-not-established',
  'product-complete-interaction-reset-original-runtime-parity-not-established',
  'maintained-assessment-and-renderer-reset-source-adobe-random-state-not-established',
]);

type JsonRecord = Record<string, unknown>;

export interface G678LocalRuntimeAssetBinding {
  readonly animationId: string;
  readonly bytes: number;
  readonly path: string;
  readonly sha256: string;
  readonly url: string;
}

// PROVISIONAL377_BRIDGE_BEGIN: maintained-dom-type
export interface G678MaintainedDomRendererBinding {
  readonly animationId: string;
  readonly memberManifest: Readonly<{bytes: number; path: string; sha256: string}>;
  readonly module: Readonly<{bytes: number; path: string; sha256: string}>;
  readonly sourceRun: Readonly<{bytes: number; path: string; sha256: string}>;
  readonly timeline: Readonly<{bytes: number; path: string; sha256: string}>;
}
// PROVISIONAL377_BRIDGE_END: maintained-dom-type

export interface G678PartialCalibrationSnapshot {
  readonly calibrationId: typeof G678_CALIBRATION_ID;
  readonly descriptors: readonly PageOnlyLessonPlayerDescriptor[];
  readonly error: string | null;
  readonly frozenCalibrationPlacementCount: number;
  readonly registeredPlacementCount: number;
  readonly registrationStatus:
    | 'private-current-js-calibration-partial'
    | 'private-current-js-calibration-registered-frozen-set'
    | null;
  readonly runtimeAssets: readonly G678LocalRuntimeAssetBinding[];
  // PROVISIONAL377_BRIDGE_BEGIN: maintained-dom-snapshot
  readonly maintainedDomRenderers: readonly G678MaintainedDomRendererBinding[];
  // PROVISIONAL377_BRIDGE_END: maintained-dom-snapshot
  readonly scaleOutAuthorized: false;
  readonly status: 'ready' | 'missing' | 'invalid' | 'production-closed';
  readonly sharedHostSuccessor?: Readonly<{path:string;bytes:number;sha256:string}> | null;
}

interface FileBinding {
  readonly bytes: number;
  readonly path: string;
  readonly sha256: string;
  readonly value: unknown;
}

interface RegistryAccess {
  readonly hasModule: (animationId: string) => boolean;
  readonly registrationFor: (
    animationId: string,
  ) => ReturnType<typeof animationModuleRegistration>;
}

export interface G678PartialCalibrationBuildInput {
  readonly browserEvidence?: FileBinding;
  readonly catalog: FileBinding;
  readonly freeze: FileBinding;
  readonly profile: FileBinding;
  readonly registry?: RegistryAccess;
  readonly selectionAuthorities?: readonly FileBinding[];
  readonly predecessorFileBinding?: FileBinding;
  readonly dualPredecessorFileBinding?: FileBinding;
  readonly p042PredecessorFreezeFileBinding?: FileBinding;
  readonly p042BaseCandidateFileBinding?: FileBinding;
  readonly p042ReadableCandidateFileBinding?: FileBinding;
  readonly p044PredecessorFreezeFileBinding?: FileBinding;
  readonly p044CandidateFileBinding?: FileBinding;
  readonly p044GlossaryFileBinding?: FileBinding;
  readonly p044RepairLineage?: P044RepairLineage;
  readonly frozenGlossaryPredecessor?: FileBinding;
  readonly frozenGlossaryCandidate?: FileBinding;
}

function record(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : {};
}

function array(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null;
}

export function decodeG678GlossaryXmlText(value: unknown): string | null {
  const source = text(value);
  if (!source) return null;
  const observedEntities: Readonly<Record<string, string>> = Object.freeze({
    '&#x003C;': '<',
    '&#x00B0;': '°',
    '&#x00B3;': '³',
    '&#x2260;': '≠',
    '&#x2264;': '≤',
    '&#x2265;': '≥',
    '&gt;': '>',
    '&quot;': '"',
  });
  const decoded = source.replace(/&(?:#\d+|#x[a-f0-9]+|[a-z]+);/giu,
    (entity) => {
      const replacement = observedEntities[entity];
      invariant(replacement !== undefined,
        'G678_CALIBRATION_GLOSSARY_XML_ENTITY_INVALID');
      return replacement;
    });
  invariant(!/&(?:#\d+|#x[a-f0-9]+|[a-z]+);/iu.test(decoded),
    'G678_CALIBRATION_GLOSSARY_XML_ENTITY_INVALID');
  return decoded;
}

function positiveInteger(value: unknown): number | null {
  return Number.isSafeInteger(value) && Number(value) > 0
    ? Number(value)
    : null;
}

function digest(bytes: Buffer | string) {
  return createHash('sha256').update(bytes).digest('hex');
}

function invariant(
  condition: unknown,
  code: string,
): asserts condition {
  if (!condition) throw new Error(code);
}

function exactBinding(
  candidate: unknown,
  observed: FileBinding,
  expectedPath: string,
) {
  const binding = record(candidate);
  return binding.path === expectedPath &&
    binding.bytes === observed.bytes &&
    binding.sha256 === observed.sha256;
}

// PROVISIONAL377_BRIDGE_BEGIN: exact-artifact-binding
function exactArtifactBinding(candidate: unknown, expected: unknown) {
  const left = record(candidate);
  const right = record(expected);
  return JSON.stringify(Object.keys(left).sort()) ===
      JSON.stringify(['bytes', 'path', 'sha256']) &&
    JSON.stringify(Object.keys(right).sort()) ===
      JSON.stringify(['bytes', 'path', 'sha256']) &&
    left.path === right.path && left.bytes === right.bytes &&
    left.sha256 === right.sha256;
}
// PROVISIONAL377_BRIDGE_END: exact-artifact-binding

function sourceLabel(
  sourceText: unknown,
  locale: 'en' | 'es',
  kind: 'course' | 'page' | 'section',
  englishFallback: string,
): SourceBoundLabel {
  const source = text(sourceText);
  if (source) {
    return Object.freeze({
      text: source,
      sourceLanguage: locale,
      sourceStatus: kind === 'course' || kind === 'section'
        ? 'exact-course-xml'
        : 'exact-page-title',
      usesEnglishFallback: false,
    });
  }
  return Object.freeze({
    text: englishFallback,
    sourceLanguage: 'en',
    sourceStatus: kind === 'course'
      ? 'missing-lesson-level-spanish-title'
      : 'missing-page-level-spanish-title',
    usesEnglishFallback: true,
  });
}

function runtimeEvidenceBoundary(value: unknown) {
  const boundary = record(value);
  invariant(
    RUNTIME_KINDS.has(String(boundary.runtimeKind)) &&
      boundary.actionScriptExecution === 'not-executed' &&
      boundary.naturalTraceValidation === 'not-established' &&
      boundary.audioAcceptance === 'not-established' &&
      REPLAY_SEMANTICS.has(String(boundary.replaySemantics)),
    'G678_CALIBRATION_RUNTIME_BOUNDARY_INVALID',
  );
  return Object.freeze({...boundary}) as
    NonNullable<WholeLessonPlayerPage['runtimeEvidenceBoundary']>;
}

function runtimeQuery(value: unknown) {
  const runtime = record(value);
  const frameDomain = text(runtime.frameDomain);
  const language = runtime.language;
  const scenario = text(runtime.scenario);
  const seed = text(runtime.seed);
  const replaySeedCycle = runtime.replaySeedCycle;
  invariant(
    frameDomain &&
      (language === 'fixed-en' || language === 'route-locale') &&
      scenario && seed && /^-?\d+$/u.test(seed) &&
      (replaySeedCycle === undefined ||
        (Number.isSafeInteger(replaySeedCycle) && Number(replaySeedCycle) >= 2)),
    'G678_CALIBRATION_RUNTIME_QUERY_INVALID',
  );
  return Object.freeze({
    frameDomain,
    language,
    scenario,
    seed,
    ...(replaySeedCycle === undefined
      ? {}
      : {replaySeedCycle: Number(replaySeedCycle)}),
  });
}

function runtimeAsset(
  animationId: string,
  value: unknown,
): G678LocalRuntimeAssetBinding {
  const runtime = record(value);
  const canvas = record(runtime.canvasRenderer);
  const relativePath = text(canvas.path)?.replaceAll('\\', '/');
  const expectedUrl =
    `/flash-assets/g678-local/${animationId}/canvas-renderer.js`;
  invariant(
    relativePath?.startsWith(`${G678_LOCAL_RUNTIME_ROOT}/`) &&
      !relativePath.split('/').some((segment) =>
        segment === '' || segment === '.' || segment === '..'
      ) &&
      relativePath.endsWith(`/${animationId}/canvas-renderer.js`) &&
      positiveInteger(canvas.bytes) !== null &&
      typeof canvas.sha256 === 'string' && SHA256.test(canvas.sha256) &&
      canvas.url === expectedUrl,
    'G678_CALIBRATION_RUNTIME_ASSET_INVALID',
  );
  const safeRelativePath = relativePath as string;
  return Object.freeze({
    animationId,
    bytes: Number(canvas.bytes),
    path: safeRelativePath,
    sha256: canvas.sha256,
    url: expectedUrl,
  });
}

function sectionPageOrdinals(pages: readonly JsonRecord[]) {
  const counts = new Map<string, number>();
  return pages.map((page) => {
    const code = text(page.sectionCode) ?? '';
    const ordinal = (counts.get(code) ?? 0) + 1;
    counts.set(code, ordinal);
    return ordinal;
  });
}

function glossaryForSelections(
  selections: readonly JsonRecord[],
): readonly PageOnlyLessonGlossaryEntry[] {
  const byId = new Map<string, PageOnlyLessonGlossaryEntry>();
  for (const selected of selections) {
    for (const candidate of array(selected.glossaryEntries).map(record)) {
      const id = text(candidate.id);
      const sourceKeyAttribute = text(candidate.sourceKeyAttribute);
      const labels = record(candidate.labels);
      const definitions = record(candidate.definitions);
      const sources = record(candidate.source);
      const english = record(sources.en);
      const spanish = record(sources.es);
      const expectedId = sourceKeyAttribute?.toLowerCase()
        .replace(/[^a-z0-9]+/gu, '-')
        .replace(/(^-|-$)/gu, '');
      invariant(
        expectedId && id === expectedId &&
          decodeG678GlossaryXmlText(labels.en) &&
          decodeG678GlossaryXmlText(labels.es) &&
          decodeG678GlossaryXmlText(definitions.en) &&
          decodeG678GlossaryXmlText(definitions.es) &&
          english.assetId === 'G678L1KTE01.xml' &&
          english.path === 'HELP_KEYTERMS/KT/XML/L1KTE01.xml' &&
          english.sha256 ===
            '14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b' &&
          spanish.assetId === 'G678L1KTS01.xml' &&
          spanish.path === 'HELP_KEYTERMS/KT/XML/L1KTS01.xml' &&
          spanish.sha256 ===
            '3b437b42e75536fa8b4f110325e366c27fbe10a871439d4797650cda4238b407',
        'G678_CALIBRATION_GLOSSARY_ENTRY_INVALID',
      );
      const validatedId = String(id);
      const entry = Object.freeze({
        id: validatedId,
        sourceKeyAttribute: String(sourceKeyAttribute),
        labels: Object.freeze({
          en: String(decodeG678GlossaryXmlText(labels.en)),
          es: String(decodeG678GlossaryXmlText(labels.es)),
        }),
        definitions: Object.freeze({
          en: String(decodeG678GlossaryXmlText(definitions.en)),
          es: String(decodeG678GlossaryXmlText(definitions.es)),
        }),
        source: Object.freeze({
          en: Object.freeze({
            assetId: 'G678L1KTE01.xml' as const,
            path: String(english.path),
            sha256: String(english.sha256),
          }),
          es: Object.freeze({
            assetId: 'G678L1KTS01.xml' as const,
            path: String(spanish.path),
            sha256: String(spanish.sha256),
          }),
        }),
      });
      const prior = byId.get(validatedId);
      const comparable = (value: PageOnlyLessonGlossaryEntry) => ({
        ...value,
        sourceKeyAttribute: value.sourceKeyAttribute.trim()
          .toLocaleLowerCase('en-US'),
      });
      invariant(!prior || JSON.stringify(comparable(prior)) ===
        JSON.stringify(comparable(entry)),
        'G678_CALIBRATION_GLOSSARY_ENTRY_CONFLICT');
      byId.set(validatedId, prior ?? entry);
    }
  }
  const glossaryOrder = ['restate', 'question', 'problem', 'solve',
    'strategies', 'data-tables', 'equation', 'pattern', 'table',
    'simple-simpler-simplest', 'organize', 'information', 'show',
    'difference'];
  const entries = [...byId.values()].sort((left, right) => {
    const leftIndex = glossaryOrder.indexOf(left.id);
    const rightIndex = glossaryOrder.indexOf(right.id);
    if (leftIndex >= 0 || rightIndex >= 0) {
      if (leftIndex < 0) return 1;
      if (rightIndex < 0) return -1;
      return leftIndex - rightIndex;
    }
    return left.id.localeCompare(right.id);
  });
  invariant(entries.length <= 128 &&
    new Set(entries.map((entry) => entry.id)).size === entries.length,
  'G678_CALIBRATION_GLOSSARY_SET_INVALID');
  return Object.freeze(entries);
}

/** Pure source-order projection. Callers must separately verify current
 * registry/source bindings; this function does not validate admission. */
export function descriptorForSelections({
  catalogLesson,
  freezeBinding,
  selections,
  mathCompanionPresentations,
  sourceGlossaryByAnimationId,
}: {
  readonly catalogLesson: JsonRecord;
  readonly freezeBinding: FileBinding;
  readonly selections: readonly JsonRecord[];
  readonly mathCompanionPresentations: ReadonlyMap<string,
    Readonly<{pageInteractionCompanionTargetIdSuffix: string}>>;
  readonly sourceGlossaryByAnimationId: ReadonlyMap<string, readonly unknown[]>;
}): PageOnlyLessonPlayerDescriptor {
  const moduleCode = text(catalogLesson.moduleCode)?.toUpperCase();
  const lessonNumber = positiveInteger(catalogLesson.lessonNumber);
  const stableLessonKey = text(catalogLesson.stableLessonKey);
  const selectedAnimationIds = selections.map((selected) =>
    text(selected.animationId));
  const sourceXml = record(catalogLesson.sourceXml);
  const pagesFromCatalog = array(catalogLesson.pages).map(record);
  invariant(
    moduleCode && MODULE_CODES.has(moduleCode) && lessonNumber &&
      stableLessonKey && selectedAnimationIds.length > 0 &&
      selectedAnimationIds.every((animationId) => animationId &&
        G678_CALIBRATION_ANIMATION_ID_PATTERN.test(animationId)) &&
      new Set(selectedAnimationIds).size === selectedAnimationIds.length &&
      pagesFromCatalog.length === positiveInteger(catalogLesson.activePageCount) &&
      typeof sourceXml.sha256 === 'string' && SHA256.test(sourceXml.sha256),
    'G678_CALIBRATION_LESSON_INVALID',
  );
  const selectionByAnimationId = new Map<string, JsonRecord>();
  for (const selected of selections) {
    const selectedAnimationId = text(selected.animationId);
    const selectedOrdinal = positiveInteger(selected.globalPageOrdinal);
    const selectedCatalogPage = selectedOrdinal
      ? pagesFromCatalog[selectedOrdinal - 1]
      : undefined;
    const selectedSectionPageOrdinal = selectedCatalogPage && selectedOrdinal
      ? pagesFromCatalog.slice(0, selectedOrdinal).filter((page) =>
          page.sectionCode === selectedCatalogPage.sectionCode
        ).length
      : 0;
    invariant(
      selectedCatalogPage && selectedAnimationId &&
        selectedAnimationId === selectedCatalogPage.animationId &&
        selectedAnimationId === selectedCatalogPage.placementId &&
        selected.placementId === selectedAnimationId &&
        selected.stableLessonKey === stableLessonKey &&
        selected.moduleCode === moduleCode &&
        selected.lessonNumber === lessonNumber &&
        selected.sectionCode === selectedCatalogPage.sectionCode &&
        selected.sectionPageOrdinal === selectedSectionPageOrdinal &&
        selected.sourceSha256 === selectedCatalogPage.sourceSha256 &&
        selected.assetId === selectedCatalogPage.assetId &&
        !selectionByAnimationId.has(selectedAnimationId),
      'G678_CALIBRATION_SELECTION_SOURCE_DRIFT',
    );
    selectionByAnimationId.set(selectedAnimationId, selected);
  }
  const sectionOrdinals = sectionPageOrdinals(pagesFromCatalog);
  const pages = pagesFromCatalog.map((page, index): WholeLessonPlayerPage => {
    const animationId = text(page.animationId);
    const placementId = text(page.placementId);
    const sectionCode = text(page.sectionCode);
    const titleEnglish = text(page.titleEnglish) ?? `Page ${index + 1}`;
    invariant(
      animationId && placementId && animationId === placementId &&
        sectionCode && page.globalOrdinal === index + 1 &&
        page.xmlOccurrence === index + 1 &&
        typeof page.assetId === 'string' &&
        /^swf-[a-f0-9]{64}$/u.test(page.assetId),
      'G678_CALIBRATION_PAGE_ORDER_INVALID',
    );
    const selected = animationId
      ? selectionByAnimationId.get(animationId)
      : undefined;
    const companionTargetIdSuffix = text(record(selected?.presentation)
      .pageInteractionCompanionTargetIdSuffix);
    const mathCompanionPresentation = mathCompanionPresentations.get(animationId);
    const algL11TrancheGlossary = selected && [
      'alg-l11-intro-terminal-tranche1-source-static',
      'alg-l11-simple-glossary-tranche1-source-static',
    ].includes(String(selected.adapterFamily)) &&
      animationId !== 'shared-alg001-l11-p001';
    invariant(mathCompanionPresentation
      ? JSON.stringify(selected?.presentation) === JSON.stringify(mathCompanionPresentation)
      : ((!algL11TrancheGlossary && !companionTargetIdSuffix) ||
        (algL11TrancheGlossary && companionTargetIdSuffix ===
          `alg-l11-${animationId.slice(-4)}-glossary-controls`)),
    'G678_CALIBRATION_COMPANION_PRESENTATION_INVALID');
    return Object.freeze({
      placementId,
      previousPlacementId: text(pagesFromCatalog[index - 1]?.placementId),
      nextPlacementId: text(pagesFromCatalog[index + 1]?.placementId),
      globalPageOrdinal: index + 1,
      sectionPageOrdinal: sectionOrdinals[index]!,
      sectionCode,
      animationId,
      previousAnimationId: text(pagesFromCatalog[index - 1]?.animationId),
      nextAnimationId: text(pagesFromCatalog[index + 1]?.animationId),
      labels: Object.freeze({
        en: sourceLabel(page.titleEnglish, 'en', 'page', titleEnglish),
        es: sourceLabel(page.titleSpanish, 'es', 'page', titleEnglish),
      }),
      rendererAvailability: selected
        ? Object.freeze({
            kind: 'registered' as const,
            moduleKey: animationId,
            runtimeQuery: runtimeQuery(selected.runtime),
          })
        : Object.freeze({
            kind: 'unavailable' as const,
            reason: 'outside-g678-frozen-current-js-calibration-set',
          }),
      ...(companionTargetIdSuffix ? {
        presentation: Object.freeze({
          pageInteractionCompanionTargetIdSuffix: companionTargetIdSuffix,
        }),
      } : {}),
      runtimeEvidenceBoundary: selected
        ? runtimeEvidenceBoundary(animationId === G678_P044_ID ? G678_P044_DESCRIPTOR_BOUNDARY : selected.runtimeEvidenceBoundary)
        : undefined,
      source: Object.freeze({
        assetId: page.assetId,
        sourceOccurrence: index + 1,
        xmlBackgroundText: page.bgText === 'Yes',
        xmlNavigation: text(page.navigation),
      }),
    });
  });
  const sections = array(catalogLesson.sections).map((value, index) => {
    const section = record(value);
    const code = text(section.sectionCode);
    const sectionPages = pages.filter((page) => page.sectionCode === code);
    const titleEnglish = text(section.titleEnglish) ?? code ?? `Section ${index + 1}`;
    invariant(
      code && sectionPages.length === positiveInteger(section.pageCount),
      'G678_CALIBRATION_SECTION_INVALID',
    );
    return Object.freeze({
      order: index + 1,
      code,
      activePageCount: sectionPages.length,
      firstActiveAnimationId: sectionPages[0]!.animationId,
      labels: Object.freeze({
        en: sourceLabel(section.titleEnglish, 'en', 'section', titleEnglish),
        es: sourceLabel(section.titleSpanish, 'es', 'section', titleEnglish),
      }),
    });
  });
  invariant(
    sections.reduce((sum, section) => sum + section.activePageCount, 0) ===
      pages.length,
    'G678_CALIBRATION_SECTION_DENOMINATOR_DRIFT',
  );
  const firstSelection = selections[0]!;
  const selectedStage = record(record(firstSelection.runtime).stage);
  const stageWidth = positiveInteger(selectedStage.width);
  const stageHeight = positiveInteger(selectedStage.height);
  invariant(stageWidth && stageHeight, 'G678_CALIBRATION_STAGE_INVALID');
  const courseTitle = text(catalogLesson.titleEnglish) ??
    text(catalogLesson.lessonName) ?? stableLessonKey;
  for (const selected of selections.slice(1)) {
    const stage = record(record(selected.runtime).stage);
    invariant(stage.width === selectedStage.width &&
      stage.height === selectedStage.height,
    'G678_CALIBRATION_STAGE_SET_DRIFT');
  }
  const localHref =
    `/migration-status/g678-calibration/${selectedAnimationIds[0]}`;
  const glossary = glossaryForSelections(selections.map(selection => {
    const entries = sourceGlossaryByAnimationId.get(String(selection.animationId));
    return entries ? {...selection, glossaryEntries: entries} : selection;
  }));
  const assessmentSelections = selections.filter((selection) =>
    positiveInteger(record(selection.assessment).quizStopFrame) !== null);
  invariant(assessmentSelections.length <= 1 &&
    assessmentSelections.every((selection) => {
      const assessment = record(selection.assessment);
      return selection.adapterFamily ===
          'ts07-nms-l1-assessment-source-static' &&
        assessment.quizStopFrame === 757 &&
        assessment.resumeFrame === 758 &&
        array(assessment.answers).length === 4 &&
        array(assessment.feedbackDomains).length === 7 &&
        assessment.spanishTextParityAccepted === false;
    }),
  'G678_CALIBRATION_ASSESSMENT_STATE_INVALID');
  const numericResponseSelections = selections.filter((selection) =>
    selection.adapterFamily === 'alg-l09-in04-numeric-source-static');
  invariant(numericResponseSelections.length <= 1 &&
    numericResponseSelections.every((selection) => {
      const stops = array(record(selection.runtime).interactiveStops).map(record);
      return selection.animationId === 'shared-alg001-l09-p016' &&
        stops.length === 1 && stops[0]?.stopFrame === 270 &&
        stops[0]?.resumeFrame === 271 &&
        stops[0]?.resolution === 'explicit-source-feedback-finished';
    }),
  'G678_CALIBRATION_NUMERIC_RESPONSE_STATE_INVALID');
  const choiceQuizSelections = selections.filter((selection) =>
    selection.adapterFamily === 'alg-l09-in06-choice-source-static' ||
    selection.adapterFamily === 'alg-l09-in08-choice-source-static' ||
    selection.adapterFamily === 'alg-l09-in10-choice-source-static' ||
    selection.adapterFamily === 'alg-l09-ti-choice-source-static');
  const choiceQuizContracts = new Map<string,
    readonly [number, number]>([
    ['alg-l09-in06-choice-source-static|shared-alg001-l09-p018',
      [188, 189]],
    ['alg-l09-in08-choice-source-static|shared-alg001-l09-p020',
      [607, 608]],
    ['alg-l09-in10-choice-source-static|shared-alg001-l09-p022',
      [93, 94]],
    ['alg-l09-ti-choice-source-static|shared-alg001-l09-p024', [132, 133]],
    ['alg-l09-ti-choice-source-static|shared-alg001-l09-p025', [68, 69]],
    ['alg-l09-ti-choice-source-static|shared-alg001-l09-p026', [84, 85]],
    ['alg-l09-ti-choice-source-static|shared-alg001-l09-p027', [134, 135]],
    ['alg-l09-ti-choice-source-static|shared-alg001-l09-p028', [177, 178]],
    ['alg-l09-ti-choice-source-static|shared-alg001-l09-p029', [231, 232]],
  ] as const);
  invariant(choiceQuizSelections.length <= choiceQuizContracts.size &&
    new Set(choiceQuizSelections.map((selection) =>
      selection.animationId)).size === choiceQuizSelections.length &&
    choiceQuizSelections.every((selection) => {
      const stops = array(record(selection.runtime).interactiveStops).map(record);
      const expected = choiceQuizContracts.get(
        `${text(selection.adapterFamily)}|${selection.animationId}`);
      return expected &&
        stops.length === 1 && stops[0]?.stopFrame === expected[0] &&
        stops[0]?.resumeFrame === expected[1] &&
        stops[0]?.resolution === 'explicit-source-feedback-finished';
    }),
  'G678_CALIBRATION_CHOICE_QUIZ_STATE_INVALID');
  const guidedTutorialSelections = selections.filter((selection) =>
    selection.adapterFamily ===
      'advanced-manual-alg-l09-guided-tutorial-source-static');
  const guidedTutorialContracts = new Map<string, readonly number[]>([
    ['shared-alg001-l09-p037', [396, 564, 712, 869, 925, 942]],
    ['shared-alg001-l09-p038', [391, 560, 708, 865, 917, 934]],
    ['shared-alg001-l09-p039', [534, 704, 852, 1008, 1094, 1111]],
  ] as const);
  invariant(guidedTutorialSelections.length <= 3 &&
    new Set(guidedTutorialSelections.map((selection) =>
      selection.animationId)).size === guidedTutorialSelections.length &&
    guidedTutorialSelections.every((selection) => {
      const expected = guidedTutorialContracts.get(
        text(selection.animationId) ?? '');
      const stops = array(record(selection.runtime).interactiveStops).map(record);
      const source = record(selection.sourceGuidedTutorial);
      const sourceStops = array(source.stops).map(record);
      const options = array(source.options).map(record);
      return expected && stops.length === 5 && sourceStops.length === 6 &&
        stops.every((stop, index) =>
          stop.stopFrame === expected[index] &&
          stop.resumeFrame === expected[index] + 1 &&
          stop.resolution === (index === 4
            ? 'explicit-source-feedback-finished'
            : 'explicit-source-control-finished')) &&
        sourceStops.every((stop, index) => stop.frame === expected[index]) &&
        sourceStops[5]?.kind === 'terminal' &&
        sourceStops[5]?.resumeFrame === null &&
        options.length >= 2 && options.length <= 4 &&
        options.filter((option) => option.correct === true).length === 1;
    }),
  'G678_CALIBRATION_GUIDED_TUTORIAL_STATE_INVALID');
  const gameControllerSelections = selections.filter((selection) =>
    selection.adapterFamily ===
      'advanced-manual-alg-l09-game-controller-source-static');
  const matchingGameSelections = selections.filter((selection) =>
    selection.adapterFamily ===
      'advanced-manual-alg-l09-matching-game-source-static');
  const finalAssessmentSelections = selections.filter((selection) =>
    selection.adapterFamily ===
      'advanced-manual-alg-l09-final-assessment-source-static');
  invariant(gameControllerSelections.length <= 1 &&
    gameControllerSelections.every((selection) => {
      const source = record(selection.sourceGameAssessment);
      const stops = array(record(selection.runtime).interactiveStops).map(record);
      return selection.animationId === 'shared-alg001-l09-p030' &&
        source.targetAnimationId === 'shared-alg001-l09-p031' &&
        source.sourceStopFrame === 748 && source.sourceResumeFrame === 749 &&
        stops.length === 1 && stops[0]?.stopFrame === 748 &&
        stops[0]?.resumeFrame === 749 &&
        stops[0]?.resolution === 'explicit-source-control-finished';
    }) && matchingGameSelections.length <= 1 &&
    matchingGameSelections.every((selection) => {
      const source = record(selection.sourceGameAssessment);
      const stops = array(record(selection.runtime).interactiveStops).map(record);
      return selection.animationId === 'shared-alg001-l09-p031' &&
        source.levelCount === 2 && source.pairCountPerLevel === 6 &&
        source.answerReleaseCount === 24 && source.correctScoreDelta === 10 &&
        source.wrongScoreDelta === -2 &&
        array(source.level1Cards).length === 12 &&
        array(source.level2Cards).length === 12 &&
        stops.length === 1 && stops[0]?.stopFrame === 1 &&
        stops[0]?.resumeFrame === 2;
    }) && finalAssessmentSelections.length <= 1 &&
    finalAssessmentSelections.every((selection) => {
      const source = record(selection.sourceGameAssessment);
      const stops = array(record(selection.runtime).interactiveStops).map(record);
      return selection.animationId === 'shared-alg001-l09-p041' &&
        source.questionPoolSize === 24 && source.presentedQuestionCount === 10 &&
        source.randomizedWithoutReplacement === true &&
        array(source.answerKey).length === 24 &&
        stops.length === 1 && stops[0]?.stopFrame === 1 &&
        stops[0]?.resumeFrame === 2;
    }),
  'G678_CALIBRATION_GAME_ASSESSMENT_STATE_INVALID');
  // PROVISIONAL377_BRIDGE_BEGIN: maintained-dom-host-capabilities
  const algL11MaintainedDomSelections = selections.filter((selection) => [
    'alg-l11-interactive10-tranche-c-maintained-dom',
    'alg-l11-behavior10-tranche-b-maintained-dom',
    'advanced-manual-alg-l11-tranche-d-maintained-dom',
  ].includes(String(selection.adapterFamily)));
  const maintainedDomCounts = new Map<string, number>();
  for (const selection of algL11MaintainedDomSelections) {
    const family = String(selection.adapterFamily);
    maintainedDomCounts.set(family, (maintainedDomCounts.get(family) ?? 0) + 1);
  }
  invariant(algL11MaintainedDomSelections.length === 0 ||
    (stableLessonKey === 'shared-alg001-l11' &&
      algL11MaintainedDomSelections.length === 23 &&
      maintainedDomCounts.get(
        'alg-l11-interactive10-tranche-c-maintained-dom') === 10 &&
      maintainedDomCounts.get(
        'alg-l11-behavior10-tranche-b-maintained-dom') === 10 &&
      maintainedDomCounts.get(
        'advanced-manual-alg-l11-tranche-d-maintained-dom') === 3),
  'G678_CALIBRATION_ALG_L11_MAINTAINED_DOM_HOST_INVALID');
  // PROVISIONAL377_BRIDGE_END: maintained-dom-host-capabilities
  const lessonHostCapabilities = [
    ...(gameControllerSelections.length ? ['navigation' as const] : []),
    ...(glossary.length ? ['glossary' as const] : []),
    ...(assessmentSelections.length || numericResponseSelections.length ||
      choiceQuizSelections.length || guidedTutorialSelections.length ||
      matchingGameSelections.length || selections.some(selection =>
        selection.animationId === G678_P044_ID && selection.adapterFamily === G678_P044_FAMILY)
      ? ['practice-feedback' as const]
      : []),
    ...(finalAssessmentSelections.length ? ['fq-scoring' as const] : []),
    // PROVISIONAL377_BRIDGE_BEGIN: maintained-dom-host-capability-projection
    ...(algL11MaintainedDomSelections.length
      ? ['navigation' as const, 'practice-feedback' as const,
          'fq-scoring' as const]
      : []),
    // PROVISIONAL377_BRIDGE_END: maintained-dom-host-capability-projection
  ];
  return Object.freeze({
    schemaVersion: 2,
    descriptorKind: 'private-page-only-product-bridge',
    descriptorId: `${stableLessonKey}-calibration-product-bridge-v1`,
    calibrationId: G678_CALIBRATION_ID,
    releaseId: `private-${stableLessonKey}-calibration-v1`,
    course: Object.freeze({
      grade: 0,
      gradeScope: 'G6-G8-shared',
      lesson: lessonNumber,
      moduleCode,
      href: localHref,
      domIdPrefix: `${stableLessonKey}-calibration`,
      activePageCount: pages.length,
      courseShellCount: 0,
      expectedReleaseMemberCount: pages.length,
      labels: Object.freeze({
        en: sourceLabel(catalogLesson.titleEnglish, 'en', 'course', courseTitle),
        es: sourceLabel(catalogLesson.titleSpanish, 'es', 'course', courseTitle),
      }),
    }),
    source: Object.freeze({
      navigationContractPath: G678_SHARED_CATALOG_PATH,
      sourceXmlPath: String(sourceXml.path),
      sourceXmlSha256: String(sourceXml.sha256),
      sequenceAuthority: 'course-xml-occurrence',
      candidateFreezeManifestPath: G678_CALIBRATION_FREEZE_PATH,
      candidateFreezeManifestSha256: freezeBinding.sha256,
    }),
    persistence: Object.freeze({
      schemaVersion: 1,
      storageKey: `helpmath:${stableLessonKey}:g678-calibration:v1`,
      scope: 'local-device-only',
      legacyCompatible: false,
    }),
    stage: Object.freeze({width: stageWidth, height: stageHeight}),
    support: Object.freeze({
      locales: Object.freeze(['en', 'es'] as const),
      rendererRegistrySnapshot: 'current-javascript-module-registry',
      lessonHostCapabilities: Object.freeze(lessonHostCapabilities),
    }),
    visualSkin: Object.freeze({
      kind: 'modern-my-lesson-page-only',
      layoutId: 'help-math-modern-my-lesson-page-only-v1',
      presentations: Object.freeze(['modern-wide'] as const),
      chromeAsset: '' as const,
      header: Object.freeze({height: 0 as const}),
      footer: Object.freeze({height: 0 as const}),
      controls: Object.freeze({
        kind: 'unresolved-modern-functional-equivalent',
        reason: 'The retained modern My Lesson host owns calibration navigation and playback; the legacy Flash course shell is excluded.',
      }),
      evidence: Object.freeze({
        kind: 'product-owned-modern-my-lesson',
        calibrationId: G678_CALIBRATION_ID,
      }),
    }),
    glossary,
    productBridge: Object.freeze({
      selectedAnimationIds: Object.freeze(selectedAnimationIds as string[]),
      registeredAnimationCount: selectedAnimationIds.length,
      pageOnlyDescriptorMemberCount: pages.length,
      acceptanceEffects: Object.freeze({
        authoritativeOriginalRuntime: false,
        fidelityAccepted: false,
        audioAccepted: false,
        humanVisualAccepted: false,
        ownerAccepted: false,
        strictComplete: false,
        published: false,
      }),
    }),
    sections: Object.freeze(sections),
    pages: Object.freeze(pages),
  });
}

export function buildG678PartialCalibrationSnapshot({
  browserEvidence,
  catalog,
  freeze,
  profile,
  selectionAuthorities = [],
  predecessorFileBinding,
  dualPredecessorFileBinding,
  p042PredecessorFreezeFileBinding,
  p042BaseCandidateFileBinding,
  p042ReadableCandidateFileBinding,
  p044PredecessorFreezeFileBinding,
  p044CandidateFileBinding,
  p044GlossaryFileBinding,
  p044RepairLineage,
  frozenGlossaryPredecessor,
  frozenGlossaryCandidate,
  registry = {
    hasModule: hasAnimationModule,
    registrationFor: animationModuleRegistration,
  },
}: G678PartialCalibrationBuildInput): G678PartialCalibrationSnapshot {
  const frozenGlossaryPhase = freeze.path === FROZEN_GLOSSARY_FREEZE.path;
  invariant(frozenGlossaryPhase ? frozenGlossaryPredecessor && frozenGlossaryCandidate
    : frozenGlossaryPredecessor === undefined && frozenGlossaryCandidate === undefined,
  'G678_FROZEN_GLOSSARY_EXACT_SUCCESSOR_REQUIRED');
  const frozenGlossary = frozenGlossaryPhase ? validateFrozenGlossaryReplacement({freeze,
    predecessor: frozenGlossaryPredecessor!, candidate: frozenGlossaryCandidate!}) : undefined;
  const catalogRoot = record(catalog.value);
  const profileRoot = record(profile.value);
  const freezeRoot = record(freeze.value);
  const authorityDeclarations = array(
    record(freezeRoot.inputs).selectionAuthorities,
  ).map(record);
  invariant(
    catalog.path === G678_SHARED_CATALOG_PATH &&
      profile.path === G678_SHARED_PROFILE_PATH &&
      freeze.path === G678_CALIBRATION_FREEZE_PATH &&
      sharedCatalogProjectionIsValid(catalog.value),
    'G678_CALIBRATION_SOURCE_BINDING_INVALID',
  );
  invariant(
    profileRoot.schemaVersion === 1 &&
      profileRoot.profileId === 'g678-shared-source-profile-v1' &&
      array(profileRoot.calibrationSet).length === 16,
    'G678_CALIBRATION_PROFILE_INVALID',
  );
  invariant(authorityDeclarations.length === selectionAuthorities.length,
    'G678_CALIBRATION_SELECTION_AUTHORITY_COUNT_INVALID');
  const behaviorDeltaAuthorities = selectionAuthorities.filter(authority =>
    record(authority.value).artifactType === G678_BEHAVIOR_DELTA_AUTHORITY_TYPE);
  const mathCompanionAuthorities = selectionAuthorities.filter(authority =>
    record(authority.value).artifactType === G678_MATH_COMPANION_AUTHORITY_TYPE);
  const p042Authorities = selectionAuthorities.filter(authority =>
    record(authority.value).artifactType === G678_P042_AUTHORITY_TYPE);
  const p044RepairPhase = new Set<string>([G678_NMS_L01_P044_REPAIR_FREEZE_PATH, FROZEN_GLOSSARY_FREEZE.path]).has(freeze.path);
  const p044Phase = freeze.path === G678_NMS_L01_P044_PREPARED_FREEZE_PATH || p044RepairPhase;
  const p044Authorities = selectionAuthorities.filter(authority => [G678_P044_AUTHORITY_TYPE,G678_P044_REPAIR_TYPE].includes(String(record(authority.value).artifactType)));
  invariant(p044RepairPhase ? p044RepairLineage && p044Authorities.length === 1 && record(p044Authorities[0].value).artifactType === G678_P044_REPAIR_TYPE
    : p044RepairLineage === undefined && p044Authorities.every(a => record(a.value).artifactType === G678_P044_AUTHORITY_TYPE),
  'G678_CALIBRATION_P044_REPAIR_EXACT_LINEAGE_REQUIRED');
  invariant(p044Phase ? p044Authorities.length === 1 && p044PredecessorFreezeFileBinding && p044CandidateFileBinding && p044GlossaryFileBinding
    : p044Authorities.length === 0 && p044PredecessorFreezeFileBinding === undefined && p044CandidateFileBinding === undefined && p044GlossaryFileBinding === undefined,
  'G678_CALIBRATION_P044_EXACT_AUTHORITY_REQUIRED');
  const p042Phase = freeze.path === G678_NMS_L01_P042_COMPANION_FREEZE_PATH || p044Phase;
  invariant(p042Phase
    ? p042Authorities.length === 1 && p042PredecessorFreezeFileBinding &&
      p042BaseCandidateFileBinding && p042ReadableCandidateFileBinding &&
      !authorityDeclarations.some(declaration => new Set<string>([G678_P042_PREDECESSOR.path,
        G678_P042_BASE.path, G678_P042_READABLE.path]).has(String(declaration.path)))
    : p042Authorities.length === 0 && p042PredecessorFreezeFileBinding === undefined &&
      p042BaseCandidateFileBinding === undefined && p042ReadableCandidateFileBinding === undefined,
  'G678_CALIBRATION_P042_EXACT_AUTHORITY_REQUIRED');
  if ([G678_ALG_L11_MATH_COMPANION_SUCCESSOR_FREEZE_PATH,
    G678_NMS_L01_P042_COMPANION_FREEZE_PATH, G678_NMS_L01_P044_PREPARED_FREEZE_PATH, G678_NMS_L01_P044_REPAIR_FREEZE_PATH, FROZEN_GLOSSARY_FREEZE.path].includes(freeze.path)) {
    invariant(mathCompanionAuthorities.length === 1 && behaviorDeltaAuthorities.length === 0 &&
      predecessorFileBinding && dualPredecessorFileBinding &&
      !authorityDeclarations.some(declaration => declaration.path === G678_INSTRUCTIONAL_PREDECESSOR_FRAGMENT.path ||
        declaration.path === G678_INSTRUCTIONAL_BEHAVIOR_DELTA_FRAGMENT.path),
    'G678_CALIBRATION_V4_EXACT_COMPANION_AUTHORITY_REQUIRED');
  } else if (freeze.path === G678_ALG_L11_FEEDBACK_HOST_SCORE_SUCCESSOR_FREEZE_PATH) {
    invariant(behaviorDeltaAuthorities.length === 1 && predecessorFileBinding &&
      mathCompanionAuthorities.length === 0 && dualPredecessorFileBinding === undefined &&
      !authorityDeclarations.some(declaration => declaration.path ===
        G678_INSTRUCTIONAL_PREDECESSOR_FRAGMENT.path),
    'G678_CALIBRATION_V3_EXACT_DUAL_AUTHORITY_REQUIRED');
  } else {
    invariant(behaviorDeltaAuthorities.length === 0 && mathCompanionAuthorities.length === 0 &&
      predecessorFileBinding === undefined && dualPredecessorFileBinding === undefined,
      'G678_CALIBRATION_V3_AUTHORITY_OUTSIDE_EXACT_FREEZE');
  }
  const authorityByPath = new Map(selectionAuthorities.map((authority) =>
    [authority.path, authority]));
  const authoritySelectedIds = new Set<string>();
  const glossaryFamilyAuthorityByAdapter = new Map<string, FileBinding>();
  const nonGlossaryFamilyAuthorityByAdapter = new Map<string, FileBinding>();
  const mathCompanionPresentations = new Map<string,
    Readonly<{pageInteractionCompanionTargetIdSuffix: string}>>();
  const sourceGlossaryByAnimationId = new Map<string, readonly unknown[]>();
  // PROVISIONAL377_BRIDGE_BEGIN: maintained-dom-authority-map
  const maintainedDomAuthorityById = new Map<string, Readonly<{
    adapterFamily: string;
    compilerRun: JsonRecord;
    entry: JsonRecord;
    instructionalSuccessor?: boolean;
  }>>();
  // PROVISIONAL377_BRIDGE_END: maintained-dom-authority-map
  for (const entry of frozenGlossary?.entries ?? []) {
    mathCompanionPresentations.set(String(entry.key), Object.freeze({
      pageInteractionCompanionTargetIdSuffix: String(record(entry.presentation).pageInteractionCompanionTargetIdSuffix),
    }));
  }

  for (const declaration of authorityDeclarations) {
    const authorityPath = text(declaration.path);
    const authority = authorityPath
      ? authorityByPath.get(authorityPath)
      : undefined;
    invariant(authority && exactBinding(declaration, authority, authority.path),
      'G678_CALIBRATION_SELECTION_AUTHORITY_BINDING_INVALID');
    const root = record(authority.value);
    if (root.artifactType === 'g678-pure-linear-reviewed-inventory-v1') {
      invariant(root.status === 'exact-compiled-root-action-review-complete' &&
        record(root.scaleOutAuthorization).authorized === true,
      'G678_CALIBRATION_PURE_LINEAR_AUTHORITY_INVALID');
      for (const animationId of array(root.authorizedPlacementIds)) {
        invariant(typeof animationId === 'string' &&
          G678_CALIBRATION_ANIMATION_ID_PATTERN.test(animationId),
        'G678_CALIBRATION_AUTHORIZED_PLACEMENT_INVALID');
        authoritySelectedIds.add(animationId);
      }
    } else if (root.artifactType ===
      'g678-final-quiz-intro-family-audit-v1') {
      const auditedIds = array(root.records).flatMap((candidate) =>
        array(record(candidate).placementIds));
      invariant(
        root.status ===
          'complete-source-and-exact-script-audit-calibration-pending' &&
          auditedIds.length === 44 &&
          new Set(auditedIds).size === 44 &&
          auditedIds.includes('shared-alg001-l01-p055'),
        'G678_CALIBRATION_FQ01_AUDIT_AUTHORITY_INVALID',
      );
      // The audit alone authorizes exactly one local representative for
      // browser family calibration. The remaining 43 require the subsequent
      // family-calibration authority handled below.
      authoritySelectedIds.add('shared-alg001-l01-p055');
    } else if (root.artifactType ===
      'g678-fq01-family-calibration-v1') {
      const authorizedIds = array(root.authorizedPlacementIds);
      const auditDeclaration = record(record(root.inputs).audit);
      const auditPath = text(auditDeclaration.path);
      const auditAuthority = auditPath
        ? authorityByPath.get(auditPath)
        : undefined;
      invariant(
        root.calibrationId === 'g678-fq01-family-calibration-v1' &&
          record(root.scaleOutAuthorization).authorized === true &&
          authorizedIds.length === 44 &&
          new Set(authorizedIds).size === 44 &&
          auditAuthority && exactBinding(auditDeclaration, auditAuthority,
            auditAuthority.path),
        'G678_CALIBRATION_FQ01_FAMILY_AUTHORITY_INVALID',
      );
      for (const animationId of authorizedIds) {
        invariant(typeof animationId === 'string' &&
          G678_CALIBRATION_ANIMATION_ID_PATTERN.test(animationId),
        'G678_CALIBRATION_FQ01_PLACEMENT_INVALID');
        authoritySelectedIds.add(animationId);
      }
    } else if (root.artifactType === 'g678-ts03-family-audit-v1') {
      invariant(
        root.status ===
          'complete-source-script-audio-and-host-contract-audit-product-calibration-blocked' &&
          root.registrationCandidatePlacementCount === 0 &&
          record(root.scope).ts03Placements === 44 &&
          array(root.records).length === 43,
        'G678_CALIBRATION_TS03_AUDIT_AUTHORITY_INVALID',
      );
      // This source audit authorizes no registration on its own. The exact
      // 15-member L1 recovery authority below supplies the bounded set.
    } else if (root.artifactType ===
      'g678-ts03-l1-keyterm-recovery-v1') {
      const eligibility = record(root.eligibility);
      const eligible = array(eligibility.eligible).map(record);
      const auditDeclaration = record(record(root.inputs).ts03Audit);
      const auditPath = text(auditDeclaration.path);
      const auditAuthority = auditPath
        ? authorityByPath.get(auditPath)
        : undefined;
      invariant(
        root.status ===
          'private-custody-recovery-verified-local-only-product-calibration-pending' &&
          record(root.custodyBoundary).canonicalSourcePromotionAuthorized ===
            false &&
          eligibility.eligiblePlacementCount === 15 &&
          eligibility.blockedPlacementCount === 29 &&
          eligible.length === 15 &&
          array(root.terms).length === 2 &&
          auditAuthority && exactBinding(auditDeclaration, auditAuthority,
            auditAuthority.path),
        'G678_CALIBRATION_TS03_RECOVERY_AUTHORITY_INVALID',
      );
      for (const candidate of eligible) {
        const animationId = text(candidate.animationId);
        invariant(animationId &&
          G678_CALIBRATION_ANIMATION_ID_PATTERN.test(animationId),
        'G678_CALIBRATION_TS03_PLACEMENT_INVALID');
        authoritySelectedIds.add(animationId);
      }
    } else if (root.artifactType === 'g678-ts02-family-audit-v1') {
      invariant(
        root.status ===
          'complete-source-script-audio-and-host-contract-audit-product-calibration-blocked' &&
          root.registrationCandidatePlacementCount === 0 &&
          record(root.scope).ts02Placements === 44 &&
          array(root.records).length === 43,
        'G678_CALIBRATION_TS02_AUDIT_AUTHORITY_INVALID',
      );
      // The audit proves the exact family but grants no registration without
      // the bounded L1 recovery authority below.
    } else if (root.artifactType ===
      'g678-ts02-l1-keyterm-recovery-v1') {
      const eligibility = record(root.eligibility);
      const eligible = array(eligibility.eligible).map(record);
      const auditDeclaration = record(record(root.inputs).ts02Audit);
      const auditPath = text(auditDeclaration.path);
      const auditAuthority = auditPath
        ? authorityByPath.get(auditPath)
        : undefined;
      invariant(
        root.status ===
          'private-custody-recovery-verified-local-only-product-calibration-pending' &&
          record(root.custodyBoundary).canonicalSourcePromotionAuthorized ===
            false &&
          eligibility.eligiblePlacementCount === 15 &&
          eligibility.blockedPlacementCount === 29 &&
          eligible.length === 15 &&
          array(root.terms).length === 3 &&
          auditAuthority && exactBinding(auditDeclaration, auditAuthority,
            auditAuthority.path),
        'G678_CALIBRATION_TS02_RECOVERY_AUTHORITY_INVALID',
      );
      for (const candidate of eligible) {
        const animationId = text(candidate.animationId);
        invariant(animationId &&
          G678_CALIBRATION_ANIMATION_ID_PATTERN.test(animationId),
        'G678_CALIBRATION_TS02_PLACEMENT_INVALID');
        authoritySelectedIds.add(animationId);
      }
    } else if (root.artifactType === 'g678-ts04-family-audit-v1') {
      invariant(
        root.status ===
          'complete-source-script-audio-and-host-contract-audit-product-calibration-blocked' &&
          root.registrationCandidatePlacementCount === 0 &&
          record(root.scope).ts04Placements === 44 &&
          array(root.records).length === 43,
        'G678_CALIBRATION_TS04_AUDIT_AUTHORITY_INVALID',
      );
      // The source audit grants no registration without the exact L1
      // recovery authority below.
    } else if (root.artifactType ===
      'g678-ts04-l1-keyterm-recovery-v1') {
      const eligibility = record(root.eligibility);
      const eligible = array(eligibility.eligible).map(record);
      const auditDeclaration = record(record(root.inputs).ts04Audit);
      const auditPath = text(auditDeclaration.path);
      const auditAuthority = auditPath
        ? authorityByPath.get(auditPath)
        : undefined;
      invariant(
        root.status ===
          'private-custody-recovery-verified-local-only-product-calibration-pending' &&
          record(root.custodyBoundary).canonicalSourcePromotionAuthorized ===
            false &&
          eligibility.eligiblePlacementCount === 15 &&
          eligibility.blockedPlacementCount === 29 &&
          eligible.length === 15 &&
          array(root.terms).length === 8 &&
          auditAuthority && exactBinding(auditDeclaration, auditAuthority,
            auditAuthority.path),
        'G678_CALIBRATION_TS04_RECOVERY_AUTHORITY_INVALID',
      );
      for (const candidate of eligible) {
        const animationId = text(candidate.animationId);
        invariant(animationId &&
          G678_CALIBRATION_ANIMATION_ID_PATTERN.test(animationId),
        'G678_CALIBRATION_TS04_PLACEMENT_INVALID');
        authoritySelectedIds.add(animationId);
      }
    } else if (root.artifactType === 'g678-ts05-family-audit-v1') {
      invariant(
        root.status ===
          'complete-source-script-audio-and-host-contract-audit-product-calibration-blocked' &&
          root.registrationCandidatePlacementCount === 0 &&
          record(root.scope).ts05Placements === 44 &&
          array(root.records).length === 44,
        'G678_CALIBRATION_TS05_AUDIT_AUTHORITY_INVALID',
      );
      // The source audit grants no registration without the exact L1
      // recovery authority below.
    } else if (root.artifactType ===
      'g678-ts05-l1-keyterm-recovery-v1') {
      const eligibility = record(root.eligibility);
      const eligible = array(eligibility.eligible).map(record);
      const auditDeclaration = record(record(root.inputs).ts05Audit);
      const auditPath = text(auditDeclaration.path);
      const auditAuthority = auditPath
        ? authorityByPath.get(auditPath)
        : undefined;
      invariant(
        root.status ===
          'private-custody-recovery-verified-local-only-product-calibration-pending' &&
          record(root.custodyBoundary).canonicalSourcePromotionAuthorized ===
            false &&
          eligibility.eligiblePlacementCount === 15 &&
          eligibility.blockedPlacementCount === 29 &&
          eligible.length === 15 &&
          array(root.terms).length === 6 &&
          auditAuthority && exactBinding(auditDeclaration, auditAuthority,
            auditAuthority.path),
        'G678_CALIBRATION_TS05_RECOVERY_AUTHORITY_INVALID',
      );
      for (const candidate of eligible) {
        const animationId = text(candidate.animationId);
        invariant(animationId &&
          G678_CALIBRATION_ANIMATION_ID_PATTERN.test(animationId),
        'G678_CALIBRATION_TS05_PLACEMENT_INVALID');
        authoritySelectedIds.add(animationId);
      }
    } else if (root.artifactType === 'g678-in02-l1-family-audit-v1') {
      const records = array(root.records).map(record);
      const terms = array(root.terms).map(record);
      const localeResolution = record(
        root.localeSpecificDefinitionResolution,
      );
      invariant(
        root.status ===
          'exact-13-source-script-keyterm-audio-audit-registration-candidate' &&
          record(root.scope).selectedIn02L1Placements === 13 &&
          record(root.scope).exactButtonScripts === 75 &&
          root.registrationCandidatePlacementCount === 13 &&
          records.length === 13 && terms.length === 61 &&
          array(root.definitionConflictNormalizedKeys).length === 5 &&
          localeResolution.crossFileDifferencesPreserved === true &&
          localeResolution.mergedOrInventedDefinitions === false &&
          Object.values(record(root.acceptanceEffects)).length > 0 &&
          Object.values(record(root.acceptanceEffects)).every((value) =>
            value === false),
        'G678_CALIBRATION_IN02_AUDIT_AUTHORITY_INVALID',
      );
      for (const candidate of records) {
        const animationId = text(candidate.animationId);
        invariant(animationId &&
          G678_CALIBRATION_ANIMATION_ID_PATTERN.test(animationId),
        'G678_CALIBRATION_IN02_PLACEMENT_INVALID');
        authoritySelectedIds.add(animationId);
      }
    } else if (root.artifactType === 'g678-vb02-l1-family-audit-v1') {
      const records = array(root.records).map(record);
      const terms = array(root.terms).map(record);
      const localeResolution = record(
        root.localeSpecificDefinitionResolution,
      );
      invariant(
        root.status ===
          'exact-11-source-script-keyterm-audio-audit-registration-candidate' &&
          record(root.scope).selectedVb02L1Placements === 11 &&
          record(root.scope).exactButtonScripts === 80 &&
          root.registrationCandidatePlacementCount === 11 &&
          records.length === 11 && terms.length === 65 &&
          array(root.definitionConflictNormalizedKeys).length === 4 &&
          localeResolution.crossFileDifferencesPreserved === true &&
          localeResolution.mergedOrInventedDefinitions === false &&
          Object.values(record(root.acceptanceEffects)).length > 0 &&
          Object.values(record(root.acceptanceEffects)).every((value) =>
            value === false),
        'G678_CALIBRATION_VB02_AUDIT_AUTHORITY_INVALID',
      );
      for (const candidate of records) {
        const animationId = text(candidate.animationId);
        invariant(animationId &&
          G678_CALIBRATION_ANIMATION_ID_PATTERN.test(animationId),
        'G678_CALIBRATION_VB02_PLACEMENT_INVALID');
        authoritySelectedIds.add(animationId);
      }
    } else if (root.artifactType === 'g678-vb03-l1-family-audit-v1') {
      const records = array(root.records).map(record);
      const terms = array(root.terms).map(record);
      const localeResolution = record(
        root.localeSpecificDefinitionResolution,
      );
      invariant(
        root.status ===
          'exact-9-source-script-keyterm-audio-audit-registration-candidate' &&
          record(root.scope).selectedVb03L1Placements === 9 &&
          record(root.scope).exactButtonScripts === 47 &&
          root.registrationCandidatePlacementCount === 9 &&
          records.length === 9 && terms.length === 37 &&
          array(root.definitionConflictNormalizedKeys).length === 4 &&
          localeResolution.crossFileDifferencesPreserved === true &&
          localeResolution.mergedOrInventedDefinitions === false &&
          Object.values(record(root.acceptanceEffects)).length > 0 &&
          Object.values(record(root.acceptanceEffects)).every((value) =>
            value === false),
        'G678_CALIBRATION_VB03_AUDIT_AUTHORITY_INVALID',
      );
      for (const candidate of records) {
        const animationId = text(candidate.animationId);
        invariant(animationId &&
          G678_CALIBRATION_ANIMATION_ID_PATTERN.test(animationId),
        'G678_CALIBRATION_VB03_PLACEMENT_INVALID');
        authoritySelectedIds.add(animationId);
      }
    } else if (root.artifactType ===
      'g678-alg-l09-simple-glossary-family-audit-v1') {
      const records = array(root.records).map(record);
      const terms = array(root.terms).map(record);
      const localeResolution = record(
        root.localeSpecificDefinitionResolution,
      );
      invariant(
        root.status ===
          'exact-9-source-script-keyterm-audio-audit-registration-candidate' &&
          record(root.scope).selectedAlgL09SimpleGlossaryPlacements === 9 &&
          record(root.scope).exactButtonScripts === 34 &&
          record(root.scope).affectedLessons === 1 &&
          root.registrationCandidatePlacementCount === 9 &&
          records.length === 9 && terms.length === 18 &&
          array(root.definitionConflictNormalizedKeys).length === 1 &&
          localeResolution.crossFileDifferencesPreserved === true &&
          localeResolution.mergedOrInventedDefinitions === false &&
          Object.values(record(root.acceptanceEffects)).length > 0 &&
          Object.values(record(root.acceptanceEffects)).every((value) =>
            value === false),
        'G678_CALIBRATION_ALG_L09_GLOSSARY_AUDIT_AUTHORITY_INVALID',
      );
      for (const candidate of records) {
        const animationId = text(candidate.animationId);
        invariant(animationId &&
          G678_CALIBRATION_ANIMATION_ID_PATTERN.test(animationId),
        'G678_CALIBRATION_ALG_L09_GLOSSARY_PLACEMENT_INVALID');
        authoritySelectedIds.add(animationId);
      }
    } else if (root.artifactType ===
      'g678-alg-l09-terminal-stop-family-audit-v1') {
      const records = array(root.records).map(record);
      const terms = array(root.terms).map(record);
      const localeResolution = record(
        root.localeSpecificDefinitionResolution,
      );
      invariant(
        root.status ===
          'exact-3-terminal-stop-script-keyterm-audio-audit-registration-candidate' &&
          record(root.scope).selectedAlgL09TerminalStopPlacements === 3 &&
          record(root.scope).exactButtonScripts === 2 &&
          record(root.scope).affectedLessons === 1 &&
          root.registrationCandidatePlacementCount === 3 &&
          records.length === 3 && terms.length === 2 &&
          array(root.definitionConflictNormalizedKeys).length === 0 &&
          records.every((candidate) =>
            record(candidate.behavior).mainTerminalStopPresent === true &&
            record(candidate.behavior).childTimelineScriptCount === 1) &&
          localeResolution.crossFileDifferencesPreserved === true &&
          localeResolution.mergedOrInventedDefinitions === false &&
          Object.values(record(root.acceptanceEffects)).length > 0 &&
          Object.values(record(root.acceptanceEffects)).every((value) =>
            value === false),
        'G678_CALIBRATION_ALG_L09_TERMINAL_STOP_AUDIT_AUTHORITY_INVALID',
      );
      for (const candidate of records) {
        const animationId = text(candidate.animationId);
        invariant(animationId &&
          G678_CALIBRATION_ANIMATION_ID_PATTERN.test(animationId),
        'G678_CALIBRATION_ALG_L09_TERMINAL_STOP_PLACEMENT_INVALID');
        authoritySelectedIds.add(animationId);
      }
    } else if (root.artifactType ===
      'g678-alg-l09-vb03-terminal-stop-family-audit-v1') {
      const records = array(root.records).map(record);
      const terms = array(root.terms).map(record);
      const localeResolution = record(
        root.localeSpecificDefinitionResolution,
      );
      invariant(
        root.status ===
          'exact-1-vb03-terminal-stop-script-keyterm-audio-audit-registration-candidate' &&
          record(root.scope).selectedAlgL09Vb03TerminalStopPlacements === 1 &&
          record(root.scope).exactButtonScripts === 4 &&
          record(root.scope).affectedLessons === 1 &&
          root.registrationCandidatePlacementCount === 1 &&
          records.length === 1 && terms.length === 4 &&
          array(root.definitionConflictNormalizedKeys).length === 0 &&
          records.every((candidate) =>
            record(candidate.behavior).mainTerminalStopPresent === true &&
            record(candidate.behavior).childTimelineScriptCount === 1) &&
          localeResolution.crossFileDifferencesPreserved === true &&
          localeResolution.mergedOrInventedDefinitions === false &&
          Object.values(record(root.acceptanceEffects)).length > 0 &&
          Object.values(record(root.acceptanceEffects)).every((value) =>
            value === false),
        'G678_CALIBRATION_ALG_L09_VB03_TERMINAL_STOP_AUDIT_AUTHORITY_INVALID',
      );
      invariant(records[0]?.animationId === 'shared-alg001-l09-p009',
        'G678_CALIBRATION_ALG_L09_VB03_TERMINAL_STOP_PLACEMENT_INVALID');
      authoritySelectedIds.add('shared-alg001-l09-p009');
    } else if (root.artifactType ===
      'g678-alg-l09-intro-shell-linkage-family-audit-v1') {
      const records = array(root.records).map(record);
      const scope = record(root.scope);
      invariant(root.status ===
          'exact-1-intro-shell-linkage-script-audit-registration-candidate' &&
        scope.selectedAlgL09IntroShellLinkagePlacements === 1 &&
        scope.exactProgressControlScripts === 7 &&
        scope.affectedLessons === 1 &&
        root.registrationCandidatePlacementCount === 1 &&
        records.length === 1 && records[0]?.animationId ===
          'shared-alg001-l09-p001' &&
        record(records[0]?.behavior).shellLinkageReachability ===
          'exported-not-root-reachable' &&
        record(records[0]?.behavior).mainTimelineScriptCount === 0 &&
        array(root.terms).length === 0 &&
        Object.values(record(root.acceptanceEffects)).length > 0 &&
        Object.values(record(root.acceptanceEffects)).every((value) =>
          value === false),
      'G678_CALIBRATION_ALG_L09_INTRO_SHELL_LINKAGE_AUDIT_AUTHORITY_INVALID');
      authoritySelectedIds.add('shared-alg001-l09-p001');
    } else if (root.artifactType ===
      'g678-alg-l09-vb06-drag-family-audit-v1') {
      const records = array(root.records).map(record);
      const terms = array(root.terms).map(record);
      const scope = record(root.scope);
      const behavior = record(records[0]?.behavior);
      const interaction = record(behavior.interaction);
      invariant(root.status ===
          'exact-1-vb06-grouped-drag-script-keyterm-audio-audit-registration-candidate' &&
        scope.selectedAlgL09Vb06DragPlacements === 1 &&
        scope.exactButtonScripts === 4 && scope.affectedLessons === 1 &&
        root.registrationCandidatePlacementCount === 1 &&
        records.length === 1 && records[0]?.animationId ===
          'shared-alg001-l09-p012' && terms.length === 3 &&
        behavior.childTimelineScriptCount === 13 &&
        interaction.stopFrame === 129 && interaction.resumeFrame === 130 &&
        interaction.completionThreshold === 4 &&
        array(interaction.drags).length === 4 &&
        Object.values(record(root.acceptanceEffects)).length > 0 &&
        Object.values(record(root.acceptanceEffects)).every((value) =>
          value === false),
      'G678_CALIBRATION_ALG_L09_VB06_DRAG_AUDIT_AUTHORITY_INVALID');
      authoritySelectedIds.add('shared-alg001-l09-p012');
    } else if (root.artifactType ===
      'g678-alg-l09-vb02-glossary-family-audit-v1') {
      const records = array(root.records).map(record);
      const terms = array(root.terms).map(record);
      const scope = record(root.scope);
      const behavior = record(records[0]?.behavior);
      invariant(root.status ===
          'exact-1-vb02-glossary-dormant-audio-script-keyterm-audit-registration-candidate' &&
        scope.selectedAlgL09Vb02GlossaryPlacements === 1 &&
        scope.exactButtonScripts === 3 && scope.affectedLessons === 1 &&
        root.registrationCandidatePlacementCount === 1 &&
        records.length === 1 && records[0]?.animationId ===
          'shared-alg001-l09-p008' && terms.length === 3 &&
        behavior.mainTimelineScriptCount === 0 &&
        behavior.childTimelineScriptCount === 8 &&
        behavior.childAudioControlReachability ===
          'root-reachable-placed-at-frame-1-self-stopped-no-main-trigger' &&
        Object.values(record(root.acceptanceEffects)).length > 0 &&
        Object.values(record(root.acceptanceEffects)).every((value) =>
          value === false),
      'G678_CALIBRATION_ALG_L09_VB02_GLOSSARY_AUDIT_AUTHORITY_INVALID');
      authoritySelectedIds.add('shared-alg001-l09-p008');
    } else if (root.artifactType ===
      'g678-alg-l09-in04-numeric-family-audit-v1') {
      const records = array(root.records).map(record);
      const terms = array(root.terms).map(record);
      const scope = record(root.scope);
      const behavior = record(records[0]?.behavior);
      const interaction = record(behavior.interaction);
      invariant(root.status ===
          'exact-1-in04-numeric-response-script-keyterm-audio-audit-registration-candidate' &&
        scope.selectedAlgL09In04NumericPlacements === 1 &&
        scope.exactButtonScripts === 8 && scope.affectedLessons === 1 &&
        root.registrationCandidatePlacementCount === 1 &&
        records.length === 1 && records[0]?.animationId ===
          'shared-alg001-l09-p016' && terms.length === 3 &&
        behavior.childTimelineScriptCount === 9 &&
        interaction.stopFrame === 270 && interaction.resumeFrame === 271 &&
        interaction.numeratorAnswer === '7' &&
        interaction.denominatorAnswer === '20' &&
        interaction.maximumWrongAttempts === 2 &&
        Object.values(record(root.acceptanceEffects)).length > 0 &&
        Object.values(record(root.acceptanceEffects)).every((value) =>
          value === false),
      'G678_CALIBRATION_ALG_L09_IN04_NUMERIC_AUDIT_AUTHORITY_INVALID');
      authoritySelectedIds.add('shared-alg001-l09-p016');
    } else if (root.artifactType ===
      'g678-alg-l09-in06-choice-family-audit-v1') {
      const records = array(root.records).map(record);
      const terms = array(root.terms).map(record);
      const scope = record(root.scope);
      const behavior = record(records[0]?.behavior);
      const interaction = record(behavior.interaction);
      const options = array(interaction.options).map(record);
      invariant(root.status ===
          'exact-1-in06-choice-quiz-script-keyterm-audio-audit-registration-candidate' &&
        scope.selectedAlgL09In06ChoicePlacements === 1 &&
        scope.exactButtonScripts === 8 && scope.affectedLessons === 1 &&
        root.registrationCandidatePlacementCount === 1 &&
        records.length === 1 && records[0]?.animationId ===
          'shared-alg001-l09-p018' && terms.length === 3 &&
        behavior.childTimelineScriptCount === 28 &&
        interaction.stopFrame === 188 && interaction.resumeFrame === 189 &&
        interaction.correctAnswerButtonCharacterId === 31 &&
        options.length === 4 &&
        options.filter((option) => option.correct === true).length === 1 &&
        interaction.maximumWrongAttempts === 2 &&
        Object.values(record(root.acceptanceEffects)).length > 0 &&
        Object.values(record(root.acceptanceEffects)).every((value) =>
          value === false),
      'G678_CALIBRATION_ALG_L09_IN06_CHOICE_AUDIT_AUTHORITY_INVALID');
      authoritySelectedIds.add('shared-alg001-l09-p018');
    } else if (root.artifactType ===
      'g678-alg-l09-in08-choice-family-audit-v1') {
      const records = array(root.records).map(record);
      const terms = array(root.terms).map(record);
      const scope = record(root.scope);
      const behavior = record(records[0]?.behavior);
      const interaction = record(behavior.interaction);
      const options = array(interaction.options).map(record);
      invariant(root.status ===
          'exact-1-in08-choice-quiz-script-keyterm-audio-audit-registration-candidate' &&
        scope.selectedAlgL09In08ChoicePlacements === 1 &&
        scope.exactButtonScripts === 9 && scope.affectedLessons === 1 &&
        root.registrationCandidatePlacementCount === 1 &&
        records.length === 1 && records[0]?.animationId ===
          'shared-alg001-l09-p020' && terms.length === 5 &&
        behavior.childTimelineScriptCount === 29 &&
        interaction.stopFrame === 607 && interaction.resumeFrame === 608 &&
        interaction.correctAnswerButtonCharacterId === 171 &&
        options.length === 4 &&
        options.filter((option) => option.correct === true).length === 1 &&
        interaction.maximumWrongAttempts === 2 &&
        Object.values(record(root.acceptanceEffects)).length > 0 &&
        Object.values(record(root.acceptanceEffects)).every((value) =>
          value === false),
      'G678_CALIBRATION_ALG_L09_IN08_CHOICE_AUDIT_AUTHORITY_INVALID');
      authoritySelectedIds.add('shared-alg001-l09-p020');
    } else if (root.artifactType ===
      'g678-alg-l09-in10-choice-family-audit-v1') {
      const records = array(root.records).map(record);
      const terms = array(root.terms).map(record);
      const scope = record(root.scope);
      const behavior = record(records[0]?.behavior);
      const interaction = record(behavior.interaction);
      const options = array(interaction.options).map(record);
      invariant(root.status ===
          'exact-1-in10-choice-quiz-script-keyterm-audio-audit-registration-candidate' &&
        scope.selectedAlgL09In10ChoicePlacements === 1 &&
        scope.exactButtonScripts === 7 && scope.affectedLessons === 1 &&
        root.registrationCandidatePlacementCount === 1 &&
        records.length === 1 && records[0]?.animationId ===
          'shared-alg001-l09-p022' && terms.length === 3 &&
        behavior.childTimelineScriptCount === 29 &&
        interaction.stopFrame === 93 && interaction.resumeFrame === 94 &&
        interaction.correctAnswerButtonCharacterId === 166 &&
        options.length === 2 &&
        options.filter((option) => option.correct === true).length === 1 &&
        interaction.maximumWrongAttempts === 2 &&
        Object.values(record(root.acceptanceEffects)).length > 0 &&
        Object.values(record(root.acceptanceEffects)).every((value) =>
          value === false),
      'G678_CALIBRATION_ALG_L09_IN10_CHOICE_AUDIT_AUTHORITY_INVALID');
      authoritySelectedIds.add('shared-alg001-l09-p022');
    } else if (root.artifactType ===
      'g678-alg-l09-ti-choice-family-audit-v1') {
      const records = array(root.records).map(record);
      const terms = array(root.terms).map(record);
      const scope = record(root.scope);
      const expected = new Map([
        ['shared-alg001-l09-p024', [132, 133, 4, 'choice-b']],
        ['shared-alg001-l09-p025', [68, 69, 4, 'choice-c']],
        ['shared-alg001-l09-p026', [84, 85, 4, 'choice-a']],
        ['shared-alg001-l09-p027', [134, 135, 2, 'choice-a']],
        ['shared-alg001-l09-p028', [177, 178, 2, 'choice-b']],
        ['shared-alg001-l09-p029', [231, 232, 4, 'choice-c']],
      ]);
      invariant(root.status ===
          'exact-6-ti-choice-quiz-script-keyterm-audio-audit-registration-candidate' &&
        scope.selectedAlgL09TiChoicePlacements === 6 &&
        scope.exactButtonScripts === 94 && scope.affectedLessons === 1 &&
        root.registrationCandidatePlacementCount === 6 &&
        records.length === 6 && terms.length === 22 &&
        records.every((item) => {
          const contract = expected.get(text(item.animationId) ?? '');
          const behavior = record(item.behavior);
          const interaction = record(behavior.interaction);
          const options = array(interaction.options).map(record);
          return contract &&
            interaction.stopFrame === contract[0] &&
            interaction.resumeFrame === contract[1] &&
            options.length === contract[2] &&
            interaction.correctChoiceId === contract[3] &&
            interaction.sourceFeedbackDomainCount === 8 &&
            interaction.maximumWrongAttempts === 2 &&
            options.filter((option) => option.correct === true).length === 1;
        }) &&
        records.filter((item) => record(record(item.behavior).interaction)
          .maintainedAttemptCounterNormalizesKnownSourceVariantDefect === true)
          .length === 3 &&
        Object.values(record(root.acceptanceEffects)).length > 0 &&
        Object.values(record(root.acceptanceEffects)).every((value) =>
          value === false),
      'G678_CALIBRATION_ALG_L09_TI_CHOICE_AUDIT_AUTHORITY_INVALID');
      for (const animationId of expected.keys()) {
        authoritySelectedIds.add(animationId);
      }
    } else if (root.artifactType ===
      'g678-alg-l09-residual-routing-audit-v1') {
      const members = array(root.members).map(record);
      const guided = members.filter((member) => member.lane ===
        'advanced-manual-guided-tutorial-quiz-state-machine');
      const expected = new Map<string, readonly number[]>([
        ['shared-alg001-l09-p037', [396, 564, 712, 869, 925, 942]],
        ['shared-alg001-l09-p038', [391, 560, 708, 865, 917, 934]],
        ['shared-alg001-l09-p039', [534, 704, 852, 1008, 1094, 1111]],
      ]);
      invariant(root.status === 'exact-6-source-script-routed-no-registration' &&
        root.auditedPlacementCount === 6 &&
        root.registrationCandidatePlacementCount === 0 &&
        root.productCalibrationPassed === false && members.length === 6 &&
        guided.length === 3 && guided.every((member) => {
          const animationId = text(member.animationId) ?? '';
          const frames = array(member.interactiveStopFrames);
          const semantic = record(member.semanticEvidence);
          const options = array(semantic.options).map(record);
          return JSON.stringify(frames) ===
              JSON.stringify(expected.get(animationId)) &&
            semantic.needMoreHelpBranchCount === 2 &&
            semantic.guidedStopCount === 4 &&
            semantic.resumeFrame === (positiveInteger(frames[4]) ?? 0) + 1 &&
            options.length >= 2 && options.length <= 4 &&
            options.filter((option) => option.correct === true).length === 1;
        }) &&
        Object.values(record(root.acceptanceEffects)).length > 0 &&
        Object.values(record(root.acceptanceEffects)).every((value) =>
          value === false),
      'G678_CALIBRATION_ALG_L09_RESIDUAL_ROUTING_AUTHORITY_INVALID');
      for (const animationId of expected.keys()) {
        authoritySelectedIds.add(animationId);
      }
    } else if (root.artifactType ===
      'g678-alg-l09-game-assessment-family-audit-v1') {
      const records = array(root.records).map(record);
      const expectedIds = [
        'shared-alg001-l09-p030', 'shared-alg001-l09-p031',
        'shared-alg001-l09-p041',
      ];
      const byId = new Map(records.map((item) =>
        [text(item.animationId), item]));
      const controller = record(record(byId.get(expectedIds[0]))
        .exactBehavior);
      const game = record(record(byId.get(expectedIds[1])).exactBehavior);
      const assessment = record(record(byId.get(expectedIds[2]))
        .exactBehavior);
      invariant(root.status ===
          'exact-3-game-assessment-behavior-routed-no-registration' &&
        root.auditedPlacementCount === 3 && records.length === 3 &&
        root.registrationCandidatePlacementCount === 0 &&
        root.productCalibrationPassed === false &&
        controller.targetAnimationId === 'shared-alg001-l09-p031' &&
        controller.sourceStopFrame === 748 &&
        controller.sourceResumeFrame === 749 &&
        game.levelCount === 2 && game.pairCountPerLevel === 6 &&
        game.answerReleaseCount === 24 && game.correctScoreDelta === 10 &&
        game.wrongScoreDelta === -2 &&
        array(game.level1Cards).length === 12 &&
        array(game.level2Cards).length === 12 &&
        assessment.questionPoolSize === 24 &&
        assessment.presentedQuestionCount === 10 &&
        array(assessment.answerKey).length === 24 &&
        assessment.randomizedWithoutReplacement === true &&
        Object.values(record(root.acceptanceEffects)).length > 0 &&
        Object.values(record(root.acceptanceEffects)).every((value) =>
          value === false),
      'G678_CALIBRATION_ALG_L09_GAME_ASSESSMENT_AUDIT_AUTHORITY_INVALID');
      for (const animationId of expectedIds) {
        authoritySelectedIds.add(animationId);
      }
    } else if (root.artifactType === 'g678-ts07-family-audit-v1') {
      invariant(
        root.status ===
          'complete-source-script-audio-and-host-contract-audit-product-calibration-blocked' &&
          root.registrationCandidatePlacementCount === 0 &&
          record(root.scope).ts07Placements === 44 &&
          array(root.records).length === 44,
        'G678_CALIBRATION_TS07_AUDIT_AUTHORITY_INVALID',
      );
      // TS07 registration remains zero until the reviewed lane-routing
      // authority below selects the single source-complete product slice.
    } else if (root.artifactType ===
      'g678-ts07-l1-keyterm-recovery-v1') {
      const eligibility = record(root.eligibility);
      const auditDeclaration = record(record(root.inputs).ts07Audit);
      const auditPath = text(auditDeclaration.path);
      const auditAuthority = auditPath
        ? authorityByPath.get(auditPath)
        : undefined;
      invariant(
        root.status ===
          'private-custody-recovery-verified-13-of-15-source-complete-product-calibration-pending' &&
          record(root.custodyBoundary).canonicalSourcePromotionAuthorized ===
            false &&
          eligibility.recoveredL1ReferencePlacementCount === 15 &&
          eligibility.exactEntryPresentPlacementCount === 13 &&
          eligibility.productEligiblePlacementCount === 0 &&
          array(root.terms).length > 0 &&
          auditAuthority && exactBinding(auditDeclaration, auditAuthority,
            auditAuthority.path),
        'G678_CALIBRATION_TS07_RECOVERY_AUTHORITY_INVALID',
      );
    } else if (root.artifactType ===
      'g678-ts07-assessment-lane-routing-v1') {
      const productSlice = array(root.representativeProductSlice).map(record);
      const inputs = record(root.inputs);
      const auditDeclaration = record(inputs.audit);
      const recoveryDeclaration = record(inputs.recovery);
      const auditPath = text(auditDeclaration.path);
      const recoveryPath = text(recoveryDeclaration.path);
      const auditAuthority = auditPath
        ? authorityByPath.get(auditPath)
        : undefined;
      const recoveryAuthority = recoveryPath
        ? authorityByPath.get(recoveryPath)
        : undefined;
      invariant(
        root.status ===
          'one-page-representative-implementation-authorized-registration-blocked' &&
          root.implementationAuthorizedPlacementCount === 1 &&
          root.generatedCandidatePlacementCount === 0 &&
          root.registrationAuthorizedPlacementCount === 0 &&
          root.productCalibrationPassed === false &&
          root.scaleOutAuthorized === false &&
          productSlice.length === 1 &&
          productSlice[0].animationId === 'shared-nms002-l01-p043' &&
          auditAuthority && exactBinding(auditDeclaration, auditAuthority,
            auditAuthority.path) &&
          recoveryAuthority && exactBinding(recoveryDeclaration,
            recoveryAuthority, recoveryAuthority.path),
        'G678_CALIBRATION_TS07_LANE_AUTHORITY_INVALID',
      );
      authoritySelectedIds.add('shared-nms002-l01-p043');
    } else if (root.artifactType ===
      'g678-ts07-nms-l1-family-calibration-v1') {
      const adapterFamily = text(root.adapterFamily);
      const authorizedIds = array(root.authorizedPlacementIds);
      const provisionalDeclaration = record(
        record(root.inputs).registrationFreeze,
      );
      const provisionalPath = text(provisionalDeclaration.path);
      const provisionalAuthority = provisionalPath
        ? authorityByPath.get(provisionalPath)
        : undefined;
      invariant(adapterFamily ===
          'ts07-nms-l1-assessment-source-static' &&
        root.status ===
          'exact-one-current-js-assessment-product-host-calibrated' &&
        authorizedIds.length === 1 &&
        authorizedIds[0] === 'shared-nms002-l01-p043' &&
        record(root.productHostCalibration)
          .familyCurrentJsVisualAssessmentCalibrationPassed === true &&
        record(root.productHostCalibration)
          .overallG678ProductCalibrationPassed === false &&
        provisionalAuthority && exactBinding(provisionalDeclaration,
          provisionalAuthority, provisionalAuthority.path) &&
        !glossaryFamilyAuthorityByAdapter.has(adapterFamily) &&
        Object.values(record(root.acceptanceEffects)).length > 0 &&
        Object.values(record(root.acceptanceEffects)).every((value) =>
          value === false),
      'G678_CALIBRATION_TS07_FAMILY_AUTHORITY_INVALID');
      glossaryFamilyAuthorityByAdapter.set(adapterFamily, authority);
      authoritySelectedIds.add('shared-nms002-l01-p043');
    } else if (root.artifactType ===
      'g678-in02-l1-family-calibration-v1') {
      const adapterFamily = text(root.adapterFamily);
      const authorizedIds = array(root.authorizedPlacementIds);
      const provisionalDeclaration = record(
        record(root.inputs).registrationFreeze,
      );
      const provisionalPath = text(provisionalDeclaration.path);
      const provisionalAuthority = provisionalPath
        ? authorityByPath.get(provisionalPath)
        : undefined;
      const productHostCalibration = record(root.productHostCalibration);
      invariant(adapterFamily === 'in02-l1-glossary-source-static' &&
        root.status ===
          'exact-13-current-js-visual-glossary-product-host-calibrated' &&
        authorizedIds.length === 13 && new Set(authorizedIds).size === 13 &&
        root.sourceButtonCount === 75 && root.uniqueGlossaryTermCount === 61 &&
        productHostCalibration
          .familyCurrentJsVisualGlossaryCalibrationPassed === true &&
        productHostCalibration.sourceFrameBoundGlossaryControls === true &&
        productHostCalibration.sourceCharacterIdentityBound === true &&
        productHostCalibration.overallG678ProductCalibrationPassed === false &&
        provisionalAuthority && exactBinding(provisionalDeclaration,
          provisionalAuthority, provisionalAuthority.path) &&
        !glossaryFamilyAuthorityByAdapter.has(adapterFamily) &&
        Object.values(record(root.acceptanceEffects)).length > 0 &&
        Object.values(record(root.acceptanceEffects)).every((value) =>
          value === false),
      'G678_CALIBRATION_IN02_FAMILY_AUTHORITY_INVALID');
      glossaryFamilyAuthorityByAdapter.set(adapterFamily, authority);
      for (const animationId of authorizedIds) {
        invariant(typeof animationId === 'string' &&
          G678_CALIBRATION_ANIMATION_ID_PATTERN.test(animationId),
        'G678_CALIBRATION_IN02_FAMILY_PLACEMENT_INVALID');
        authoritySelectedIds.add(animationId);
      }
    } else if (root.artifactType ===
      'g678-vb02-l1-family-calibration-v1') {
      const adapterFamily = text(root.adapterFamily);
      const authorizedIds = array(root.authorizedPlacementIds);
      const provisionalDeclaration = record(
        record(root.inputs).registrationFreeze,
      );
      const provisionalPath = text(provisionalDeclaration.path);
      const provisionalAuthority = provisionalPath
        ? authorityByPath.get(provisionalPath)
        : undefined;
      const productHostCalibration = record(root.productHostCalibration);
      invariant(adapterFamily === 'vb02-l1-glossary-source-static' &&
        root.status ===
          'exact-11-current-js-visual-glossary-product-host-calibrated' &&
        authorizedIds.length === 11 && new Set(authorizedIds).size === 11 &&
        root.sourceButtonCount === 80 && root.uniqueGlossaryTermCount === 65 &&
        productHostCalibration
          .familyCurrentJsVisualGlossaryCalibrationPassed === true &&
        productHostCalibration.sourceFrameBoundGlossaryControls === true &&
        productHostCalibration.sourceCharacterIdentityBound === true &&
        productHostCalibration.overallG678ProductCalibrationPassed === false &&
        provisionalAuthority && exactBinding(provisionalDeclaration,
          provisionalAuthority, provisionalAuthority.path) &&
        !glossaryFamilyAuthorityByAdapter.has(adapterFamily) &&
        Object.values(record(root.acceptanceEffects)).length > 0 &&
        Object.values(record(root.acceptanceEffects)).every((value) =>
          value === false),
      'G678_CALIBRATION_VB02_FAMILY_AUTHORITY_INVALID');
      glossaryFamilyAuthorityByAdapter.set(adapterFamily, authority);
      for (const animationId of authorizedIds) {
        invariant(typeof animationId === 'string' &&
          G678_CALIBRATION_ANIMATION_ID_PATTERN.test(animationId),
        'G678_CALIBRATION_VB02_FAMILY_PLACEMENT_INVALID');
        authoritySelectedIds.add(animationId);
      }
    } else if (root.artifactType ===
      'g678-vb03-l1-family-calibration-v1') {
      const adapterFamily = text(root.adapterFamily);
      const authorizedIds = array(root.authorizedPlacementIds);
      const provisionalDeclaration = record(
        record(root.inputs).registrationFreeze,
      );
      const provisionalPath = text(provisionalDeclaration.path);
      const provisionalAuthority = provisionalPath
        ? authorityByPath.get(provisionalPath)
        : undefined;
      const productHostCalibration = record(root.productHostCalibration);
      invariant(adapterFamily === 'vb03-l1-glossary-source-static' &&
        root.status ===
          'exact-9-current-js-visual-glossary-product-host-calibrated' &&
        authorizedIds.length === 9 && new Set(authorizedIds).size === 9 &&
        root.sourceButtonCount === 47 && root.uniqueGlossaryTermCount === 37 &&
        productHostCalibration
          .familyCurrentJsVisualGlossaryCalibrationPassed === true &&
        productHostCalibration.sourceFrameBoundGlossaryControls === true &&
        productHostCalibration.sourceCharacterIdentityBound === true &&
        productHostCalibration.overallG678ProductCalibrationPassed === false &&
        provisionalAuthority && exactBinding(provisionalDeclaration,
          provisionalAuthority, provisionalAuthority.path) &&
        !glossaryFamilyAuthorityByAdapter.has(adapterFamily) &&
        Object.values(record(root.acceptanceEffects)).length > 0 &&
        Object.values(record(root.acceptanceEffects)).every((value) =>
          value === false),
      'G678_CALIBRATION_VB03_FAMILY_AUTHORITY_INVALID');
      glossaryFamilyAuthorityByAdapter.set(adapterFamily, authority);
      for (const animationId of authorizedIds) {
        invariant(typeof animationId === 'string' &&
          G678_CALIBRATION_ANIMATION_ID_PATTERN.test(animationId),
        'G678_CALIBRATION_VB03_FAMILY_PLACEMENT_INVALID');
        authoritySelectedIds.add(animationId);
      }
    } else if (root.artifactType ===
      'g678-alg-l09-simple-glossary-family-calibration-v1') {
      const adapterFamily = text(root.adapterFamily);
      const authorizedIds = array(root.authorizedPlacementIds);
      const provisionalDeclaration = record(
        record(root.inputs).registrationFreeze,
      );
      const provisionalPath = text(provisionalDeclaration.path);
      const provisionalAuthority = provisionalPath
        ? authorityByPath.get(provisionalPath)
        : undefined;
      const productHostCalibration = record(root.productHostCalibration);
      invariant(adapterFamily ===
          'alg-l09-simple-glossary-source-static' &&
        root.status ===
          'exact-9-current-js-visual-glossary-product-host-calibrated' &&
        authorizedIds.length === 9 && new Set(authorizedIds).size === 9 &&
        root.sourceButtonCount === 34 && root.uniqueGlossaryTermCount === 18 &&
        productHostCalibration
          .familyCurrentJsVisualGlossaryCalibrationPassed === true &&
        productHostCalibration.sourceFrameBoundGlossaryControls === true &&
        productHostCalibration.sourceCharacterIdentityBound === true &&
        productHostCalibration.overallG678ProductCalibrationPassed === false &&
        provisionalAuthority && exactBinding(provisionalDeclaration,
          provisionalAuthority, provisionalAuthority.path) &&
        !glossaryFamilyAuthorityByAdapter.has(adapterFamily) &&
        Object.values(record(root.acceptanceEffects)).length > 0 &&
        Object.values(record(root.acceptanceEffects)).every((value) =>
          value === false),
      'G678_CALIBRATION_ALG_L09_GLOSSARY_FAMILY_AUTHORITY_INVALID');
      glossaryFamilyAuthorityByAdapter.set(adapterFamily, authority);
      for (const animationId of authorizedIds) {
        invariant(typeof animationId === 'string' &&
          G678_CALIBRATION_ANIMATION_ID_PATTERN.test(animationId),
        'G678_CALIBRATION_ALG_L09_GLOSSARY_FAMILY_PLACEMENT_INVALID');
        authoritySelectedIds.add(animationId);
      }
    } else if (root.artifactType ===
      'g678-alg-l09-terminal-stop-family-calibration-v1') {
      const adapterFamily = text(root.adapterFamily);
      const authorizedIds = array(root.authorizedPlacementIds);
      const provisionalDeclaration = record(
        record(root.inputs).registrationFreeze,
      );
      const provisionalPath = text(provisionalDeclaration.path);
      const provisionalAuthority = provisionalPath
        ? authorityByPath.get(provisionalPath)
        : undefined;
      const productHostCalibration = record(root.productHostCalibration);
      invariant(adapterFamily === 'alg-l09-terminal-stop-source-static' &&
        root.status ===
          'exact-3-current-js-terminal-stop-product-host-calibrated' &&
        authorizedIds.length === 3 && new Set(authorizedIds).size === 3 &&
        root.sourceButtonCount === 2 && root.uniqueGlossaryTermCount === 2 &&
        productHostCalibration
          .familyCurrentJsTerminalStopCalibrationPassed === true &&
        productHostCalibration.sourceFrameBoundGlossaryControls === true &&
        productHostCalibration.sourceCharacterIdentityBound === true &&
        productHostCalibration.overallG678ProductCalibrationPassed === false &&
        provisionalAuthority && exactBinding(provisionalDeclaration,
          provisionalAuthority, provisionalAuthority.path) &&
        !glossaryFamilyAuthorityByAdapter.has(adapterFamily) &&
        Object.values(record(root.acceptanceEffects)).length > 0 &&
        Object.values(record(root.acceptanceEffects)).every((value) =>
          value === false),
      'G678_CALIBRATION_ALG_L09_TERMINAL_STOP_FAMILY_AUTHORITY_INVALID');
      glossaryFamilyAuthorityByAdapter.set(adapterFamily, authority);
      for (const animationId of authorizedIds) {
        invariant(typeof animationId === 'string' &&
          G678_CALIBRATION_ANIMATION_ID_PATTERN.test(animationId),
        'G678_CALIBRATION_ALG_L09_TERMINAL_STOP_FAMILY_PLACEMENT_INVALID');
        authoritySelectedIds.add(animationId);
      }
    } else if (root.artifactType ===
      'g678-alg-l09-vb03-terminal-stop-family-calibration-v1') {
      const adapterFamily = text(root.adapterFamily);
      const authorizedIds = array(root.authorizedPlacementIds);
      const provisionalDeclaration = record(
        record(root.inputs).registrationFreeze,
      );
      const provisionalPath = text(provisionalDeclaration.path);
      const provisionalAuthority = provisionalPath
        ? authorityByPath.get(provisionalPath)
        : undefined;
      const productHostCalibration = record(root.productHostCalibration);
      invariant(adapterFamily ===
          'alg-l09-vb03-terminal-stop-source-static' &&
        root.status ===
          'exact-1-vb03-current-js-terminal-stop-product-host-calibrated' &&
        authorizedIds.length === 1 &&
        authorizedIds[0] === 'shared-alg001-l09-p009' &&
        root.sourceButtonCount === 4 && root.uniqueGlossaryTermCount === 4 &&
        productHostCalibration
          .familyCurrentJsTerminalStopCalibrationPassed === true &&
        productHostCalibration.sourceFrameBoundGlossaryControls === true &&
        productHostCalibration.sourceCharacterIdentityBound === true &&
        productHostCalibration.overallG678ProductCalibrationPassed === false &&
        provisionalAuthority && exactBinding(provisionalDeclaration,
          provisionalAuthority, provisionalAuthority.path) &&
        !glossaryFamilyAuthorityByAdapter.has(adapterFamily) &&
        Object.values(record(root.acceptanceEffects)).length > 0 &&
        Object.values(record(root.acceptanceEffects)).every((value) =>
          value === false),
      'G678_CALIBRATION_ALG_L09_VB03_TERMINAL_STOP_FAMILY_AUTHORITY_INVALID');
      glossaryFamilyAuthorityByAdapter.set(adapterFamily, authority);
      authoritySelectedIds.add('shared-alg001-l09-p009');
    } else if (root.artifactType ===
      'g678-alg-l09-intro-shell-linkage-family-calibration-v1') {
      const adapterFamily = text(root.adapterFamily);
      const authorizedIds = array(root.authorizedPlacementIds);
      const provisionalDeclaration = record(
        record(root.inputs).registrationFreeze,
      );
      const provisionalPath = text(provisionalDeclaration.path);
      const provisionalAuthority = provisionalPath
        ? authorityByPath.get(provisionalPath)
        : undefined;
      const productHostCalibration = record(root.productHostCalibration);
      invariant(adapterFamily ===
          'alg-l09-intro-shell-linkage-source-static' &&
        root.status ===
          'exact-1-intro-shell-linkage-product-host-calibrated' &&
        authorizedIds.length === 1 &&
        authorizedIds[0] === 'shared-alg001-l09-p001' &&
        root.rootReachableMainTimelineScriptCount === 0 &&
        root.exportedShellLinkageCount === 7 &&
        productHostCalibration
          .familyCurrentJsIntroShellLinkageCalibrationPassed === true &&
        productHostCalibration.overallG678ProductCalibrationPassed === false &&
        provisionalAuthority && exactBinding(provisionalDeclaration,
          provisionalAuthority, provisionalAuthority.path) &&
        !nonGlossaryFamilyAuthorityByAdapter.has(adapterFamily) &&
        Object.values(record(root.acceptanceEffects)).length > 0 &&
        Object.values(record(root.acceptanceEffects)).every((value) =>
          value === false),
      'G678_CALIBRATION_ALG_L09_INTRO_SHELL_LINKAGE_FAMILY_AUTHORITY_INVALID');
      nonGlossaryFamilyAuthorityByAdapter.set(adapterFamily, authority);
      authoritySelectedIds.add('shared-alg001-l09-p001');
    } else if (root.artifactType ===
      'g678-alg-l09-vb06-drag-family-calibration-v1') {
      const adapterFamily = text(root.adapterFamily);
      const authorizedIds = array(root.authorizedPlacementIds);
      const provisionalDeclaration = record(
        record(root.inputs).registrationFreeze,
      );
      const provisionalPath = text(provisionalDeclaration.path);
      const provisionalAuthority = provisionalPath
        ? authorityByPath.get(provisionalPath)
        : undefined;
      const productHostCalibration = record(root.productHostCalibration);
      invariant(adapterFamily === 'alg-l09-vb06-drag-source-static' &&
        root.status ===
          'exact-1-vb06-grouped-drag-product-host-calibrated' &&
        authorizedIds.length === 1 &&
        authorizedIds[0] === 'shared-alg001-l09-p012' &&
        root.sourceButtonCount === 4 && root.uniqueGlossaryTermCount === 3 &&
        productHostCalibration.familyCurrentJsVb06DragCalibrationPassed ===
          true &&
        productHostCalibration.frame129InteractiveStopBound === true &&
        productHostCalibration.fourSourceGroupingBound === true &&
        productHostCalibration.pointerKeyboardCompletionAndResumePassed ===
          true &&
        productHostCalibration.sourceFrameBoundGlossaryControls === true &&
        productHostCalibration.sourceCharacterIdentityBound === true &&
        productHostCalibration.overallG678ProductCalibrationPassed === false &&
        provisionalAuthority && exactBinding(provisionalDeclaration,
          provisionalAuthority, provisionalAuthority.path) &&
        !glossaryFamilyAuthorityByAdapter.has(adapterFamily) &&
        Object.values(record(root.acceptanceEffects)).length > 0 &&
        Object.values(record(root.acceptanceEffects)).every((value) =>
          value === false),
      'G678_CALIBRATION_ALG_L09_VB06_DRAG_FAMILY_AUTHORITY_INVALID');
      glossaryFamilyAuthorityByAdapter.set(adapterFamily, authority);
      authoritySelectedIds.add('shared-alg001-l09-p012');
    } else if (root.artifactType ===
      'g678-alg-l09-in04-numeric-family-calibration-v1') {
      const adapterFamily = text(root.adapterFamily);
      const authorizedIds = array(root.authorizedPlacementIds);
      const provisionalDeclaration = record(
        record(root.inputs).registrationFreeze,
      );
      const provisionalPath = text(provisionalDeclaration.path);
      const provisionalAuthority = provisionalPath
        ? authorityByPath.get(provisionalPath)
        : undefined;
      const productHostCalibration = record(root.productHostCalibration);
      invariant(adapterFamily === 'alg-l09-in04-numeric-source-static' &&
        root.status ===
          'exact-1-in04-numeric-response-product-host-calibrated' &&
        authorizedIds.length === 1 &&
        authorizedIds[0] === 'shared-alg001-l09-p016' &&
        root.sourceButtonCount === 3 && root.uniqueGlossaryTermCount === 3 &&
        root.numericInputFieldCount === 2 &&
        productHostCalibration.familyCurrentJsIn04NumericCalibrationPassed ===
          true &&
        productHostCalibration.frame270InteractiveStopBound === true &&
        productHostCalibration.digitOnlySevenToTwentyResponseBound === true &&
        productHostCalibration
          .twoWrongAttemptsAndRightFeedbackResumePassed === true &&
        productHostCalibration.sourceFrameBoundGlossaryControls === true &&
        productHostCalibration.sourceCharacterIdentityBound === true &&
        productHostCalibration.overallG678ProductCalibrationPassed === false &&
        provisionalAuthority && exactBinding(provisionalDeclaration,
          provisionalAuthority, provisionalAuthority.path) &&
        !glossaryFamilyAuthorityByAdapter.has(adapterFamily) &&
        Object.values(record(root.acceptanceEffects)).length > 0 &&
        Object.values(record(root.acceptanceEffects)).every((value) =>
          value === false),
      'G678_CALIBRATION_ALG_L09_IN04_NUMERIC_FAMILY_AUTHORITY_INVALID');
      glossaryFamilyAuthorityByAdapter.set(adapterFamily, authority);
      authoritySelectedIds.add('shared-alg001-l09-p016');
    } else if (root.artifactType ===
      'g678-alg-l09-in06-choice-family-calibration-v1') {
      const adapterFamily = text(root.adapterFamily);
      const authorizedIds = array(root.authorizedPlacementIds);
      const provisionalDeclaration = record(
        record(root.inputs).registrationFreeze,
      );
      const provisionalPath = text(provisionalDeclaration.path);
      const provisionalAuthority = provisionalPath
        ? authorityByPath.get(provisionalPath)
        : undefined;
      const productHostCalibration = record(root.productHostCalibration);
      invariant(adapterFamily === 'alg-l09-in06-choice-source-static' &&
        root.status ===
          'exact-1-in06-choice-quiz-product-host-calibrated' &&
        authorizedIds.length === 1 &&
        authorizedIds[0] === 'shared-alg001-l09-p018' &&
        root.sourceButtonCount === 3 && root.uniqueGlossaryTermCount === 3 &&
        root.choiceCount === 4 &&
        productHostCalibration.familyCurrentJsIn06ChoiceCalibrationPassed ===
          true &&
        productHostCalibration.frame188InteractiveStopBound === true &&
        productHostCalibration.fourSourceRatioChoicesBound === true &&
        productHostCalibration
          .twoWrongAttemptsAndChoiceFeedbackResumePassed === true &&
        productHostCalibration.sourceFrameBoundGlossaryControls === true &&
        productHostCalibration.sourceCharacterIdentityBound === true &&
        productHostCalibration.overallG678ProductCalibrationPassed === false &&
        provisionalAuthority && exactBinding(provisionalDeclaration,
          provisionalAuthority, provisionalAuthority.path) &&
        !glossaryFamilyAuthorityByAdapter.has(adapterFamily) &&
        Object.values(record(root.acceptanceEffects)).length > 0 &&
        Object.values(record(root.acceptanceEffects)).every((value) =>
          value === false),
      'G678_CALIBRATION_ALG_L09_IN06_CHOICE_FAMILY_AUTHORITY_INVALID');
      glossaryFamilyAuthorityByAdapter.set(adapterFamily, authority);
      authoritySelectedIds.add('shared-alg001-l09-p018');
    } else if (root.artifactType ===
      'g678-alg-l09-in08-choice-family-calibration-v1') {
      const adapterFamily = text(root.adapterFamily);
      const authorizedIds = array(root.authorizedPlacementIds);
      const provisionalDeclaration = record(
        record(root.inputs).registrationFreeze,
      );
      const provisionalPath = text(provisionalDeclaration.path);
      const provisionalAuthority = provisionalPath
        ? authorityByPath.get(provisionalPath)
        : undefined;
      const productHostCalibration = record(root.productHostCalibration);
      invariant(adapterFamily === 'alg-l09-in08-choice-source-static' &&
        root.status ===
          'exact-1-in08-choice-quiz-product-host-calibrated' &&
        authorizedIds.length === 1 &&
        authorizedIds[0] === 'shared-alg001-l09-p020' &&
        root.sourceButtonCount === 5 && root.uniqueGlossaryTermCount === 5 &&
        root.choiceCount === 4 &&
        productHostCalibration.familyCurrentJsIn08ChoiceCalibrationPassed ===
          true &&
        productHostCalibration.frame607InteractiveStopBound === true &&
        productHostCalibration.fourSourceNumericChoicesBound === true &&
        productHostCalibration
          .twoWrongAttemptsAndChoiceFeedbackResumePassed === true &&
        productHostCalibration.sourceFrameBoundGlossaryControls === true &&
        productHostCalibration.sourceCharacterIdentityBound === true &&
        productHostCalibration.overallG678ProductCalibrationPassed === false &&
        provisionalAuthority && exactBinding(provisionalDeclaration,
          provisionalAuthority, provisionalAuthority.path) &&
        !glossaryFamilyAuthorityByAdapter.has(adapterFamily) &&
        Object.values(record(root.acceptanceEffects)).length > 0 &&
        Object.values(record(root.acceptanceEffects)).every((value) =>
          value === false),
      'G678_CALIBRATION_ALG_L09_IN08_CHOICE_FAMILY_AUTHORITY_INVALID');
      glossaryFamilyAuthorityByAdapter.set(adapterFamily, authority);
      authoritySelectedIds.add('shared-alg001-l09-p020');
    } else if (root.artifactType ===
      'g678-alg-l09-in10-choice-family-calibration-v1') {
      const adapterFamily = text(root.adapterFamily);
      const authorizedIds = array(root.authorizedPlacementIds);
      const provisionalDeclaration = record(
        record(root.inputs).registrationFreeze,
      );
      const provisionalPath = text(provisionalDeclaration.path);
      const provisionalAuthority = provisionalPath
        ? authorityByPath.get(provisionalPath)
        : undefined;
      const productHostCalibration = record(root.productHostCalibration);
      invariant(adapterFamily === 'alg-l09-in10-choice-source-static' &&
        root.status ===
          'exact-1-in10-choice-quiz-product-host-calibrated' &&
        authorizedIds.length === 1 &&
        authorizedIds[0] === 'shared-alg001-l09-p022' &&
        root.sourceButtonCount === 3 && root.uniqueGlossaryTermCount === 3 &&
        root.choiceCount === 2 &&
        productHostCalibration.familyCurrentJsIn10ChoiceCalibrationPassed ===
          true &&
        productHostCalibration.frame93InteractiveStopBound === true &&
        productHostCalibration.twoSourceRelationshipChoicesBound === true &&
        productHostCalibration
          .twoWrongAttemptsAndChoiceFeedbackResumePassed === true &&
        productHostCalibration.sourceFrameBoundGlossaryControls === true &&
        productHostCalibration.sourceCharacterIdentityBound === true &&
        productHostCalibration.overallG678ProductCalibrationPassed === false &&
        provisionalAuthority && exactBinding(provisionalDeclaration,
          provisionalAuthority, provisionalAuthority.path) &&
        !glossaryFamilyAuthorityByAdapter.has(adapterFamily) &&
        Object.values(record(root.acceptanceEffects)).length > 0 &&
        Object.values(record(root.acceptanceEffects)).every((value) =>
          value === false),
      'G678_CALIBRATION_ALG_L09_IN10_CHOICE_FAMILY_AUTHORITY_INVALID');
      glossaryFamilyAuthorityByAdapter.set(adapterFamily, authority);
      authoritySelectedIds.add('shared-alg001-l09-p022');
    } else if (root.artifactType ===
      'g678-alg-l09-ti-choice-family-calibration-v1') {
      const adapterFamily = text(root.adapterFamily);
      const authorizedIds = array(root.authorizedPlacementIds);
      const provisionalDeclaration = record(
        record(root.inputs).registrationFreeze,
      );
      const provisionalPath = text(provisionalDeclaration.path);
      const provisionalAuthority = provisionalPath
        ? authorityByPath.get(provisionalPath)
        : undefined;
      const productHostCalibration = record(root.productHostCalibration);
      const expectedIds = [
        'shared-alg001-l09-p024', 'shared-alg001-l09-p025',
        'shared-alg001-l09-p026', 'shared-alg001-l09-p027',
        'shared-alg001-l09-p028', 'shared-alg001-l09-p029',
      ];
      invariant(adapterFamily === 'alg-l09-ti-choice-source-static' &&
        root.status === 'exact-6-ti-choice-quiz-product-host-calibrated' &&
        authorizedIds.length === 6 &&
        JSON.stringify([...authorizedIds].sort()) ===
          JSON.stringify(expectedIds) &&
        root.sourceButtonCount === 48 &&
        root.uniqueGlossaryTermCount === 22 &&
        root.choiceCount === 20 &&
        array(root.browserSamples).length === 6 &&
        productHostCalibration.familyCurrentJsTiChoiceCalibrationPassed ===
          true &&
        productHostCalibration.sourceSpecificStopsAndResumesBound === true &&
        productHostCalibration.sourceSpecificChoiceSetsBound === true &&
        productHostCalibration
          .twoWrongAttemptsAndChoiceFeedbackResumePassed === true &&
        productHostCalibration
          .threeSourceAttemptIncrementDefectsRecordedAndNormalized === true &&
        productHostCalibration.sourceFrameBoundGlossaryControls === true &&
        productHostCalibration.sourceCharacterIdentityBound === true &&
        productHostCalibration.overallG678ProductCalibrationPassed === false &&
        provisionalAuthority && exactBinding(provisionalDeclaration,
          provisionalAuthority, provisionalAuthority.path) &&
        !glossaryFamilyAuthorityByAdapter.has(adapterFamily) &&
        Object.values(record(root.acceptanceEffects)).length > 0 &&
        Object.values(record(root.acceptanceEffects)).every((value) =>
          value === false),
      'G678_CALIBRATION_ALG_L09_TI_CHOICE_FAMILY_AUTHORITY_INVALID');
      glossaryFamilyAuthorityByAdapter.set(adapterFamily, authority);
      for (const animationId of expectedIds) {
        authoritySelectedIds.add(animationId);
      }
    } else if (root.artifactType ===
      'g678-alg-l09-guided-tutorial-family-calibration-v1') {
      const adapterFamily = text(root.adapterFamily);
      const authorizedIds = array(root.authorizedPlacementIds);
      const provisionalDeclaration = record(
        record(root.inputs).registrationFreeze,
      );
      const provisionalPath = text(provisionalDeclaration.path);
      const provisionalAuthority = provisionalPath
        ? authorityByPath.get(provisionalPath)
        : undefined;
      const productHostCalibration = record(root.productHostCalibration);
      const expectedIds = [
        'shared-alg001-l09-p037', 'shared-alg001-l09-p038',
        'shared-alg001-l09-p039',
      ];
      invariant(adapterFamily ===
          'advanced-manual-alg-l09-guided-tutorial-source-static' &&
        root.status === 'exact-3-guided-tutorial-product-host-calibrated' &&
        authorizedIds.length === 3 &&
        JSON.stringify([...authorizedIds].sort()) ===
          JSON.stringify(expectedIds) &&
        root.sourceStopCount === 18 && root.interactiveHostStopCount === 15 &&
        root.choiceCount === 10 && array(root.browserSamples).length === 3 &&
        productHostCalibration
          .familyCurrentJsGuidedTutorialCalibrationPassed === true &&
        productHostCalibration.sourceSpecificStopSequencesBound === true &&
        productHostCalibration.needMoreHelpBranchesBound === true &&
        productHostCalibration.finalChoiceSetsBound === true &&
        productHostCalibration
          .twoWrongAttemptsAndFeedbackResumePassed === true &&
        productHostCalibration.sourceFrameBoundGlossaryControls === true &&
        productHostCalibration.sourceCharacterIdentityBound === true &&
        productHostCalibration.overallG678ProductCalibrationPassed === false &&
        provisionalAuthority && exactBinding(provisionalDeclaration,
          provisionalAuthority, provisionalAuthority.path) &&
        !glossaryFamilyAuthorityByAdapter.has(adapterFamily) &&
        Object.values(record(root.acceptanceEffects)).length > 0 &&
        Object.values(record(root.acceptanceEffects)).every((value) =>
          value === false),
      'G678_CALIBRATION_ALG_L09_GUIDED_TUTORIAL_FAMILY_AUTHORITY_INVALID');
      glossaryFamilyAuthorityByAdapter.set(adapterFamily, authority);
      for (const animationId of expectedIds) {
        authoritySelectedIds.add(animationId);
      }
    } else if (root.artifactType ===
      'g678-alg-l09-game-assessment-family-calibration-v1') {
      const adapterFamilies = array(root.adapterFamilies);
      const authorizedIds = array(root.authorizedPlacementIds);
      const provisionalDeclaration = record(
        record(root.inputs).registrationFreeze,
      );
      const provisionalPath = text(provisionalDeclaration.path);
      const provisionalAuthority = provisionalPath
        ? authorityByPath.get(provisionalPath)
        : undefined;
      const productHostCalibration = record(root.productHostCalibration);
      const expectedFamilies = [
        'advanced-manual-alg-l09-game-controller-source-static',
        'advanced-manual-alg-l09-matching-game-source-static',
        'advanced-manual-alg-l09-final-assessment-source-static',
      ];
      const expectedIds = [
        'shared-alg001-l09-p030', 'shared-alg001-l09-p031',
        'shared-alg001-l09-p041',
      ];
      invariant(root.status ===
          'exact-3-game-assessment-product-host-calibrated' &&
        JSON.stringify(adapterFamilies) === JSON.stringify(expectedFamilies) &&
        JSON.stringify(authorizedIds) === JSON.stringify(expectedIds) &&
        root.matchingPairCountPerLevel === 6 &&
        root.answerReleaseCount === 24 && root.correctScoreDelta === 10 &&
        root.wrongScoreDelta === -2 &&
        root.finalAssessmentQuestionPoolSize === 24 &&
        root.finalAssessmentPresentedQuestionCount === 10 &&
        root.finalAssessmentCorrectResponseCount === 9 &&
        root.finalAssessmentWrongResponseCount === 1 &&
        JSON.stringify(root.finalAssessmentHostScore) === JSON.stringify(
          {attempted: 10, correct: 9, pointsAwarded: 9,
            pointsPossible: 10}) &&
        root.focusedBrowserScreenshotCount === 6 &&
        root.level1VisibleCardCount === 12 &&
        root.level2VisibleCardCount === 12 &&
        Number(root.observedRequestCount) > 0 &&
        productHostCalibration.typedCrossPageNavigationPassed === true &&
        productHostCalibration.levelHandoffInherited === true &&
        productHostCalibration.controllerReplayResetPassed === true &&
        productHostCalibration.matchingGameTwoLevelsAndScoringPassed === true &&
        productHostCalibration.matchingReplayResetPassed === true &&
        productHostCalibration.level1ScoringAndResetPassed === true &&
        productHostCalibration.levelSwitchHeldDuringFeedback === true &&
        productHostCalibration.sourceLevel1AndLevel2LabelsVisible === true &&
        productHostCalibration
          .finalAssessmentRandomTenScoringAndReviewPassed === true &&
        productHostCalibration.exactlyOneTwoChoiceWrongReviewPassed === true &&
        productHostCalibration.sourceQuestionContentVisible === true &&
        productHostCalibration.typedFinalAssessmentHostScorePassed === true &&
        productHostCalibration.finalAssessmentReplayResetPassed === true &&
        productHostCalibration.finalAssessmentHostScoreReplayResetPassed ===
          true &&
        productHostCalibration.allObservedRequestsLoopback === true &&
        productHostCalibration.allObservedRequestsExplicitlyAllowed === true &&
        productHostCalibration.allLegacyNetworkOperationsBlocked === true &&
        productHostCalibration
          .familyCurrentJsGameAssessmentCalibrationPassed === true &&
        productHostCalibration.overallG678ProductCalibrationPassed === false &&
        provisionalAuthority && exactBinding(provisionalDeclaration,
          provisionalAuthority, provisionalAuthority.path) &&
        expectedFamilies.every((adapterFamily) =>
          !nonGlossaryFamilyAuthorityByAdapter.has(adapterFamily)) &&
        Object.values(record(root.acceptanceEffects)).length > 0 &&
        Object.values(record(root.acceptanceEffects)).every((value) =>
          value === false),
      'G678_CALIBRATION_ALG_L09_GAME_ASSESSMENT_FAMILY_AUTHORITY_INVALID');
      expectedFamilies.forEach((adapterFamily) =>
        nonGlossaryFamilyAuthorityByAdapter.set(adapterFamily, authority));
      expectedIds.forEach((animationId) => authoritySelectedIds.add(animationId));
    } else if (root.artifactType ===
      'g678-alg-l09-vb02-glossary-family-calibration-v1') {
      const adapterFamily = text(root.adapterFamily);
      const authorizedIds = array(root.authorizedPlacementIds);
      const provisionalDeclaration = record(
        record(root.inputs).registrationFreeze,
      );
      const provisionalPath = text(provisionalDeclaration.path);
      const provisionalAuthority = provisionalPath
        ? authorityByPath.get(provisionalPath)
        : undefined;
      const productHostCalibration = record(root.productHostCalibration);
      invariant(adapterFamily === 'alg-l09-vb02-glossary-source-static' &&
        root.status === 'exact-1-vb02-glossary-product-host-calibrated' &&
        authorizedIds.length === 1 &&
        authorizedIds[0] === 'shared-alg001-l09-p008' &&
        root.sourceButtonCount === 3 && root.uniqueGlossaryTermCount === 3 &&
        root.mainTimelineScriptCount === 0 &&
        root.dormantChildAudioScriptCount === 8 &&
        productHostCalibration
          .familyCurrentJsVb02GlossaryCalibrationPassed === true &&
        productHostCalibration.sourceFrameBoundGlossaryControls === true &&
        productHostCalibration.sourceCharacterIdentityBound === true &&
        productHostCalibration.dormantChildAudioExcludedFromRuntime === true &&
        productHostCalibration.overallG678ProductCalibrationPassed === false &&
        provisionalAuthority && exactBinding(provisionalDeclaration,
          provisionalAuthority, provisionalAuthority.path) &&
        !glossaryFamilyAuthorityByAdapter.has(adapterFamily) &&
        Object.values(record(root.acceptanceEffects)).length > 0 &&
        Object.values(record(root.acceptanceEffects)).every((value) =>
          value === false),
      'G678_CALIBRATION_ALG_L09_VB02_GLOSSARY_FAMILY_AUTHORITY_INVALID');
      glossaryFamilyAuthorityByAdapter.set(adapterFamily, authority);
      authoritySelectedIds.add('shared-alg001-l09-p008');
    } else if (['g678-ts02-l1-family-calibration-v1',
      'g678-ts03-l1-family-calibration-v1',
      'g678-ts04-l1-family-calibration-v1',
      'g678-ts05-l1-family-calibration-v1'].includes(
      String(root.artifactType))) {
      const adapterFamily = text(root.adapterFamily);
      const authorizedIds = array(root.authorizedPlacementIds);
      const provisionalDeclaration = record(
        record(root.inputs).registrationFreeze,
      );
      const provisionalPath = text(provisionalDeclaration.path);
      const provisionalAuthority = provisionalPath
        ? authorityByPath.get(provisionalPath)
        : undefined;
      invariant(adapterFamily &&
        ['ts02-l1-glossary-source-static',
          'ts03-l1-glossary-source-static',
          'ts04-l1-glossary-source-static',
          'ts05-l1-glossary-source-static'].includes(adapterFamily) &&
        root.status ===
          'exact-15-current-js-visual-glossary-product-host-calibrated' &&
        authorizedIds.length === 15 &&
        new Set(authorizedIds).size === 15 &&
        record(root.productHostCalibration)
          .familyCurrentJsVisualGlossaryCalibrationPassed === true &&
        record(root.productHostCalibration)
          .overallG678ProductCalibrationPassed === false &&
        provisionalAuthority && exactBinding(provisionalDeclaration,
          provisionalAuthority, provisionalAuthority.path) &&
        !glossaryFamilyAuthorityByAdapter.has(adapterFamily) &&
        Object.values(record(root.acceptanceEffects)).length > 0 &&
        Object.values(record(root.acceptanceEffects)).every((value) =>
          value === false),
      'G678_CALIBRATION_GLOSSARY_FAMILY_AUTHORITY_INVALID');
      glossaryFamilyAuthorityByAdapter.set(adapterFamily, authority);
      for (const animationId of authorizedIds) {
        invariant(typeof animationId === 'string' &&
          G678_CALIBRATION_ANIMATION_ID_PATTERN.test(animationId),
        'G678_CALIBRATION_GLOSSARY_FAMILY_PLACEMENT_INVALID');
        authoritySelectedIds.add(animationId);
      }
    } else if (root.artifactType ===
      'g678-alg-l11-residual-routing-audit-v1') {
      const residualIds = array(root.residualPlacementIds);
      const predecessorDeclaration = record(
        record(root.inputs).predecessorFinal342,
      );
      const predecessorPath = text(predecessorDeclaration.path);
      const predecessorAuthority = predecessorPath
        ? authorityByPath.get(predecessorPath)
        : undefined;
      invariant(root.status ===
          'exact-35-source-script-text-routed-no-registration' &&
        root.stableLessonKey === 'shared-alg001-l11' &&
        root.moduleCode === 'ALG001' && root.lessonNumber === 11 &&
        root.lessonActivePageCount === 44 &&
        root.predecessorRegisteredPageCount === 9 &&
        root.auditedResidualPlacementCount === 35 &&
        residualIds.length === 35 && new Set(residualIds).size === 35 &&
        array(root.members).length === 35 &&
        root.registrationCandidatePlacementCount === 0 &&
        root.currentJavaScriptRegisteredPlacementCount === 0 &&
        root.productCalibrationPassed === false &&
        root.wholeLessonEngineeringPreviewReady === false &&
        root.scaleOutAuthorized === false &&
        predecessorAuthority && exactBinding(predecessorDeclaration,
          predecessorAuthority, predecessorAuthority.path) &&
        Object.values(record(root.acceptanceEffects)).length > 0 &&
        Object.values(record(root.acceptanceEffects)).every((value) =>
          value === false),
      'G678_CALIBRATION_ALG_L11_RESIDUAL_AUTHORITY_INVALID');
      // This exact 35-member artifact is routing evidence only. It grants no
      // registration by itself; the bounded tranche audits below do that.
    } else if (root.artifactType ===
      'g678-alg-l11-intro-terminal-tranche1-v1') {
      const expectedIds = [
        'shared-alg001-l11-p001', 'shared-alg001-l11-p002',
        'shared-alg001-l11-p003', 'shared-alg001-l11-p004',
      ];
      const records = array(root.records).map(record);
      const terms = array(root.terms).map(record);
      const termText = terms.flatMap((term) => [
        ...Object.values(record(term.labels)),
        ...Object.values(record(term.definitions)),
      ]);
      invariant(root.status ===
          'exact-4-intro-rw-script-text-keyterm-audio-audit-unregistered-engineering-candidate' &&
        record(root.scope).selectedAlgL11IntroTerminalTranche1Placements === 4 &&
        root.engineeringCandidatePlacementCount === 4 &&
        root.registrationCandidatePlacementCount === 0 &&
        root.familyCalibrationPassed === false &&
        root.scaleOutAuthorized === false &&
        records.length === 4 && terms.length === 6 &&
        JSON.stringify(records.map((candidate) =>
          text(candidate.animationId)).sort()) ===
          JSON.stringify(expectedIds) &&
        termText.every((value) => typeof value === 'string' &&
          !UNDECODED_MATH_ENTITY.test(value)) &&
        Object.values(record(root.acceptanceEffects)).length > 0 &&
        Object.values(record(root.acceptanceEffects)).every((value) =>
          value === false),
      'G678_CALIBRATION_ALG_L11_INTRO_TERMINAL_AUTHORITY_INVALID');
      expectedIds.forEach((animationId) =>
        authoritySelectedIds.add(animationId));
    } else if (root.artifactType ===
      'g678-alg-l11-simple-glossary-tranche1-audit-v1') {
      const expectedIds = [
        'shared-alg001-l11-p007', 'shared-alg001-l11-p013',
        'shared-alg001-l11-p016', 'shared-alg001-l11-p017',
        'shared-alg001-l11-p018', 'shared-alg001-l11-p022',
        'shared-alg001-l11-p023', 'shared-alg001-l11-p024',
      ];
      const records = array(root.records).map(record);
      const termText = array(root.terms).map(record).flatMap((term) => [
        ...Object.values(record(term.labels)),
        ...Object.values(record(term.definitions)),
      ]);
      invariant(root.status ===
          'exact-8-source-script-text-keyterm-audit-unregistered-candidate' &&
        record(root.scope).selectedAlgL11SimpleGlossaryPlacements === 8 &&
        root.registrationCandidatePlacementCount === 8 &&
        root.currentJavaScriptRegisteredCount === 0 &&
        root.productCalibrationPassed === false &&
        root.familyCalibrationPassed === false &&
        root.scaleOutAuthorized === false &&
        records.length === 8 && array(root.terms).length === 17 &&
        termText.every((value) => typeof value === 'string' &&
          !UNDECODED_MATH_ENTITY.test(value)) &&
        JSON.stringify(records.map((candidate) =>
          text(candidate.animationId)).sort()) ===
          JSON.stringify(expectedIds) &&
        Object.values(record(root.acceptanceEffects)).length > 0 &&
        Object.values(record(root.acceptanceEffects)).every((value) =>
          value === false),
      'G678_CALIBRATION_ALG_L11_SIMPLE_GLOSSARY_AUTHORITY_INVALID');
      expectedIds.forEach((animationId) =>
        authoritySelectedIds.add(animationId));
    } else if (root.artifactType === G678_P042_AUTHORITY_TYPE) {
      const validated = validateG678P042CompanionAuthority({authority,
        baseCandidate: p042BaseCandidateFileBinding, readableCandidate: p042ReadableCandidateFileBinding,
        predecessorFreeze: p042PredecessorFreezeFileBinding, freeze: p044Phase ? p044PredecessorFreezeFileBinding!.value : freeze.value});
      invariant(!maintainedDomAuthorityById.has(G678_P042_ID), 'G678_CALIBRATION_P042_DUPLICATE');
      authoritySelectedIds.add(G678_P042_ID);
      mathCompanionPresentations.set(G678_P042_ID, validated.proposedPresentation);
      maintainedDomAuthorityById.set(G678_P042_ID, Object.freeze({adapterFamily: G678_P042_FAMILY,
        compilerRun: {...validated.compilerRun}, entry: validated.entry, instructionalSuccessor: true}));
    } else if ([G678_P044_AUTHORITY_TYPE,G678_P044_REPAIR_TYPE].includes(String(root.artifactType))) {
      const validated = p044RepairPhase
        ? validateG678P044RepairAuthority({authority,candidate:p044CandidateFileBinding,predecessor:p044PredecessorFreezeFileBinding,freeze:frozenGlossary?.predecessor ?? freeze,glossary:p044GlossaryFileBinding,lineage:p044RepairLineage})
        : validateG678P044Authority({authority, candidate: p044CandidateFileBinding,
          predecessor: p044PredecessorFreezeFileBinding, freeze, glossary: p044GlossaryFileBinding});
      invariant(!maintainedDomAuthorityById.has(G678_P044_ID), 'G678_CALIBRATION_P044_DUPLICATE');
      authoritySelectedIds.add(G678_P044_ID);
      mathCompanionPresentations.set(G678_P044_ID, validated.proposedPresentation);
      sourceGlossaryByAnimationId.set(G678_P044_ID, validated.glossaryEntries);
      maintainedDomAuthorityById.set(G678_P044_ID, Object.freeze({adapterFamily: G678_P044_FAMILY,
        compilerRun: {...validated.compilerRun}, entry: validated.entry, instructionalSuccessor: true}));
    // PROVISIONAL377_BRIDGE_BEGIN: maintained-dom-authorities
    } else if ([
      'g678-alg-l11-interactive10-tranche-c-unregistered-current-js-fragment-v1',
      'g678-alg-l11-behavior10-tranche-b-unregistered-current-js-fragment-v1',
      'g678-alg-l11-advanced3-tranche-d-unregistered-current-js-fragment-v1',
      'g678-alg-l11-instructional-successor-current-js-fragment-v1',
      G678_BEHAVIOR_DELTA_AUTHORITY_TYPE,
      G678_MATH_COMPANION_AUTHORITY_TYPE,
    ].includes(String(root.artifactType))) {
      const behaviorDelta = root.artifactType === G678_BEHAVIOR_DELTA_AUTHORITY_TYPE;
      const mathCompanion = root.artifactType === G678_MATH_COMPANION_AUTHORITY_TYPE;
      const instructionalSuccessor = mathCompanion || behaviorDelta || root.artifactType ===
        'g678-alg-l11-instructional-successor-current-js-fragment-v1';
      if (behaviorDelta) invariant(authority.path === G678_INSTRUCTIONAL_BEHAVIOR_DELTA_FRAGMENT.path &&
        exactBinding(G678_INSTRUCTIONAL_BEHAVIOR_DELTA_FRAGMENT,
          authority, G678_INSTRUCTIONAL_BEHAVIOR_DELTA_FRAGMENT.path),
      'G678_CALIBRATION_V3_EXACT_DUAL_BINDING_REQUIRED');
      const companionAuthority = mathCompanion
        ? validateG678MathCompanionAuthority(authority, dualPredecessorFileBinding, predecessorFileBinding)
        : undefined;
      for (const [animationId, presentation] of companionAuthority?.proposedPresentations ?? []) {
        mathCompanionPresentations.set(animationId, presentation);
      }
      const sourceRunOverrides = companionAuthority?.sourceRuns ?? (behaviorDelta
        ? validateG678InstructionalBehaviorDelta(root, predecessorFileBinding)
        : undefined);
      const config = instructionalSuccessor
        ? {adapterFamily: '', count: 23,
            ids: [6, 8, 9, 10, 11, 14, 19, 20, 21, 25, 26, 27, 28,
              29, 30, 31, 32, 33, 34, 40, 41, 42, 44]}
        : root.artifactType ===
        'g678-alg-l11-interactive10-tranche-c-unregistered-current-js-fragment-v1'
        ? {adapterFamily: 'alg-l11-interactive10-tranche-c-maintained-dom',
            count: 10, ids: [6, 8, 9, 10, 11, 14, 19, 20, 21, 25]}
        : root.artifactType ===
          'g678-alg-l11-behavior10-tranche-b-unregistered-current-js-fragment-v1'
          ? {adapterFamily: 'alg-l11-behavior10-tranche-b-maintained-dom',
              count: 10, ids: [26, 27, 28, 29, 30, 31, 32, 40, 41, 42]}
          : {adapterFamily: 'advanced-manual-alg-l11-tranche-d-maintained-dom',
              count: 3, ids: [33, 34, 44]};
      const expectedIds = config.ids.map((ordinal) =>
        `shared-alg001-l11-p${String(ordinal).padStart(3, '0')}`);
      const entries = array(root.entries).map(record);
      const compilerRun = record(root.compilerRun);
      const effects = record(root.acceptanceEffects);
      invariant(root.schemaVersion === 1 &&
        root.deploymentScope === 'local-only' &&
        root.exactPlacementCount === config.count &&
        root.generatedPlacementCount === config.count &&
        root.registrationCandidatePlacementCount === 0 &&
        root.currentJavaScriptRegisteredCount === 0 &&
        root.productCalibrationPassed === false &&
        root.browserProductCalibrationPassed === false &&
        root.wholeLessonEngineeringPreviewCount === 0 &&
        root.scaleOutAuthorized === false &&
        root.acceptancePassed === false &&
        root.releaseAuthorized === false && root.published === false &&
        text(compilerRun.path)?.startsWith(
          'work/g678-shared-page-factory/g678-alg-l11-') === true &&
        positiveInteger(compilerRun.bytes) !== null &&
        typeof compilerRun.sha256 === 'string' &&
        SHA256.test(compilerRun.sha256) &&
        entries.length === config.count &&
        JSON.stringify(entries.map((entry) => text(entry.key))) ===
          JSON.stringify(expectedIds) &&
        Object.values(effects).length > 0 &&
        Object.values(effects).every((value) => value === false),
      'G678_CALIBRATION_ALG_L11_MAINTAINED_DOM_AUTHORITY_INVALID');
      for (const [index, entry] of entries.entries()) {
        const animationId = expectedIds[index];
        const ordinal = config.ids[index];
        const adapterFamily = instructionalSuccessor
          ? [6, 8, 9, 10, 11, 14, 19, 20, 21, 25].includes(ordinal)
            ? 'alg-l11-interactive10-tranche-c-maintained-dom'
            : [33, 34, 44].includes(ordinal)
              ? 'advanced-manual-alg-l11-tranche-d-maintained-dom'
              : 'alg-l11-behavior10-tranche-b-maintained-dom'
          : config.adapterFamily;
        const moduleBinding = record(entry.moduleFile);
        const timelineBinding = record(entry.timeline);
        const memberBinding = record(entry.memberManifest);
        const token = text(entry.module)?.replace('./modules/', '');
        invariant(entry.key === animationId && token &&
          (!instructionalSuccessor || entry.adapterFamily === adapterFamily) &&
          entry.maturity === 'private-current-js' &&
          entry.deploymentScope === 'local-only' &&
          entry.registrationCandidate === false &&
          entry.currentJavaScriptRegistered === false &&
          entry.productCalibrationPassed === false &&
          entry.browserProductCalibrationPassed === false &&
          entry.wholeLessonEngineeringPreviewReady === false &&
          moduleBinding.path === `packages/demos/src/modules/${token}.tsx` &&
          timelineBinding.path === `packages/demos/src/timelines/${token}.ts` &&
          text(memberBinding.path)?.endsWith(
            `/members/${animationId}/member-manifest.json`) === true &&
          [moduleBinding, timelineBinding, memberBinding].every((binding) =>
            positiveInteger(binding.bytes) !== null &&
            typeof binding.sha256 === 'string' &&
            SHA256.test(binding.sha256)) &&
          Object.values(record(entry.acceptanceEffects)).length > 0 &&
          Object.values(record(entry.acceptanceEffects)).every((value) =>
            value === false) &&
          !maintainedDomAuthorityById.has(animationId),
        'G678_CALIBRATION_ALG_L11_MAINTAINED_DOM_ENTRY_INVALID');
        authoritySelectedIds.add(animationId);
        maintainedDomAuthorityById.set(animationId,
          Object.freeze({adapterFamily,
            compilerRun: sourceRunOverrides?.get(animationId) ?? compilerRun,
            entry, instructionalSuccessor}));
      }
    // PROVISIONAL377_BRIDGE_END: maintained-dom-authorities
    } else if (root.calibrationId === G678_CALIBRATION_ID &&
      Array.isArray(root.selectedPages)) {
      for (const selected of root.selectedPages.map(record)) {
        const animationId = text(selected.animationId);
        invariant(animationId &&
          G678_CALIBRATION_ANIMATION_ID_PATTERN.test(animationId),
        'G678_CALIBRATION_PREDECESSOR_PLACEMENT_INVALID');
        authoritySelectedIds.add(animationId);
      }
    } else {
      invariant(false, 'G678_CALIBRATION_SELECTION_AUTHORITY_KIND_INVALID');
    }
  }
  invariant(
      freezeRoot.schemaVersion === 1 &&
      freezeRoot.calibrationId === G678_CALIBRATION_ID &&
      freezeRoot.deploymentScope === 'local-only' &&
      positiveInteger(freezeRoot.frozenCalibrationPlacementCount) !== null &&
      Number(freezeRoot.frozenCalibrationPlacementCount) <= 2282 &&
      Number.isSafeInteger(freezeRoot.registrationCandidatePlacementCount) &&
      Number(freezeRoot.registrationCandidatePlacementCount) >= 1 &&
      Number(freezeRoot.registrationCandidatePlacementCount) <=
        Number(freezeRoot.frozenCalibrationPlacementCount) &&
      (freezeRoot.status ===
        'private-current-js-calibration-candidates-generated' ||
        freezeRoot.status ===
          'private-current-js-product-host-calibrated-candidates-registered') &&
      freezeRoot.scaleOutAuthorized === false &&
      exactBinding(
        record(freezeRoot.inputs).sharedCatalog,
        catalog,
        G678_SHARED_CATALOG_PATH,
      ) &&
      exactBinding(
        record(freezeRoot.inputs).sourceProfile,
        profile,
        G678_SHARED_PROFILE_PATH,
      ),
    'G678_CALIBRATION_FREEZE_INVALID',
  );
  const acceptanceEffects = record(freezeRoot.acceptanceEffects);
  invariant(
    [
      'authoritativeOriginalRuntime',
      'behaviorParityAccepted',
      'visualFidelityAccepted',
      'audioAccepted',
      'humanVisualAccepted',
      'ownerAccepted',
      'strictComplete',
      'releaseEligible',
      'published',
    ].every((key) => acceptanceEffects[key] === false),
    'G678_CALIBRATION_ACCEPTANCE_BOUNDARY_INVALID',
  );
  const selectedPages = array(freezeRoot.selectedPages).map(record);
  invariant(
    selectedPages.length === freezeRoot.registrationCandidatePlacementCount,
    'G678_CALIBRATION_SELECTION_COUNT_INVALID',
  );
  const catalogLessons = array(catalogRoot.lessons).map(record);
  const lessonByKey = new Map(catalogLessons.map((lesson) => [
    text(lesson.stableLessonKey),
    lesson,
  ]));
  const catalogPageById = new Map(catalogLessons.flatMap((lesson) =>
    array(lesson.pages).map((page) => {
      const item = record(page);
      return [text(item.animationId), item] as const;
    })
  ));
  const selectedByProfile = new Set(array(profileRoot.calibrationSet).map((value) => {
    const selection = record(value);
    return `${text(selection.moduleCode)?.toUpperCase()}:${positiveInteger(selection.lessonNumber)}:${positiveInteger(selection.ordinal)}`;
  }));
  const useExternalSelectionAuthorities = authorityDeclarations.length > 0;
  const selectedIdentities = new Set<string>();
  const runtimeAssets: G678LocalRuntimeAssetBinding[] = [];
  // PROVISIONAL377_BRIDGE_BEGIN: maintained-dom-collection
  const maintainedDomRenderers: G678MaintainedDomRendererBinding[] = [];
  // PROVISIONAL377_BRIDGE_END: maintained-dom-collection
  const finalProductHostCalibrated = freezeRoot.status ===
    'private-current-js-product-host-calibrated-candidates-registered';
  const selectedGlossaryAdapterFamilies = new Set(selectedPages.map(record)
    .map((selected) => text(selected.adapterFamily))
    .filter((adapterFamily): adapterFamily is string =>
      adapterFamily?.startsWith('ts0') === true ||
      adapterFamily === 'in02-l1-glossary-source-static' ||
      adapterFamily === 'vb02-l1-glossary-source-static' ||
      adapterFamily === 'vb03-l1-glossary-source-static' ||
      adapterFamily === 'alg-l09-simple-glossary-source-static' ||
      adapterFamily === 'alg-l09-terminal-stop-source-static' ||
      adapterFamily === 'alg-l09-vb03-terminal-stop-source-static' ||
      adapterFamily === 'alg-l09-vb06-drag-source-static' ||
      adapterFamily === 'alg-l09-in04-numeric-source-static' ||
      adapterFamily === 'alg-l09-in06-choice-source-static' ||
      adapterFamily === 'alg-l09-in08-choice-source-static' ||
      adapterFamily === 'alg-l09-in10-choice-source-static' ||
      adapterFamily === 'alg-l09-ti-choice-source-static' ||
      adapterFamily ===
        'advanced-manual-alg-l09-guided-tutorial-source-static' ||
      adapterFamily === 'alg-l09-vb02-glossary-source-static'));
  const selectedNonGlossaryAdapterFamilies = new Set(selectedPages.map(record)
    .map((selected) => text(selected.adapterFamily))
    .filter((adapterFamily): adapterFamily is string =>
      adapterFamily === 'alg-l09-intro-shell-linkage-source-static' ||
      adapterFamily ===
        'advanced-manual-alg-l09-game-controller-source-static' ||
      adapterFamily ===
        'advanced-manual-alg-l09-matching-game-source-static' ||
      adapterFamily ===
        'advanced-manual-alg-l09-final-assessment-source-static'));
  if (finalProductHostCalibrated) {
    const browserDeclaration = record(
      record(freezeRoot.inputs).browserProductEvidence,
    );
    const browserRoot = record(browserEvidence?.value);
    const productHostSummary = record(freezeRoot.productHostCalibration);
    const expectedBrowserArtifactType =
      `g678-current-js-${selectedPages.length}-browser-qa-v1`;
    const exactLessonVector = array(record(browserRoot.allLessons)
      .exactLessonVector).map(record);
    const completeLessonKeys = exactLessonVector.filter((lesson) =>
      lesson.registeredPageCount === lesson.activePageCount)
      .map((lesson) => text(lesson.stableLessonKey));
    const partialLessonCount = exactLessonVector.filter((lesson) =>
      Number(lesson.registeredPageCount) < Number(lesson.activePageCount))
      .length;
    const final342LessonBoundary = selectedPages.length !== 342 ||
      (JSON.stringify(completeLessonKeys) ===
        JSON.stringify(['shared-alg001-l09']) &&
      partialLessonCount === 43 &&
      productHostSummary.oneCompleteAnd43PartialRegistrationTruthful ===
        true &&
      productHostSummary.wholeLessonEngineeringPreviewCount === 1);
    invariant(browserEvidence && exactBinding(browserDeclaration,
      browserEvidence, browserEvidence.path) &&
      browserRoot.artifactType === expectedBrowserArtifactType &&
      browserRoot.registeredCurrentJsPages === selectedPages.length &&
      record(browserRoot.allLessons).sharedCardCount === 44 &&
      record(browserRoot.allLessons).linkedCardCount === 0 &&
      record(browserRoot.allLessons).registeredPageSum ===
        selectedPages.length &&
      array(browserRoot.samples).length ===
        productHostSummary.browserSampleCount &&
      array(browserRoot.screenshots).length ===
        productHostSummary.screenshotCount &&
      final342LessonBoundary &&
      glossaryFamilyAuthorityByAdapter.size ===
        selectedGlossaryAdapterFamilies.size &&
      nonGlossaryFamilyAuthorityByAdapter.size ===
        selectedNonGlossaryAdapterFamilies.size,
    'G678_CALIBRATION_BROWSER_PRODUCT_AUTHORITY_INVALID');
  }
  for (const selected of selectedPages) {
    const animationId = text(selected.animationId);
    const moduleCode = text(selected.moduleCode)?.toUpperCase();
    const lessonNumber = positiveInteger(selected.lessonNumber);
    const ordinal = positiveInteger(selected.globalPageOrdinal);
    const stableLessonKey = text(selected.stableLessonKey);
    const complexityLane = text(selected.complexityLane);
    const catalogPage = animationId ? catalogPageById.get(animationId) : undefined;
    const registration = animationId
      ? registry.registrationFor(animationId)
      : undefined;
    const registrationRecord = record(registration);
    const selectedRuntime = record(selected.runtime);
    const registeredRuntime = record(selectedRuntime.canvasRenderer);
    // PROVISIONAL377_BRIDGE_BEGIN: maintained-dom-registration
    const rendererBinding = record(selectedRuntime.rendererBinding);
    const maintainedDom = rendererBinding.kind ===
      'maintained-dom-module-v1';
    const maintainedAuthority = animationId
      ? maintainedDomAuthorityById.get(animationId)
      : undefined;
    const maintainedEntry = record(maintainedAuthority?.entry);
    const successorRuntimeContract = record(maintainedEntry.runtimeContract);
    const successorRuntimeMatches = !maintainedAuthority?.instructionalSuccessor || (
      record(maintainedEntry.source).sha256 === selected.sourceSha256 &&
      Object.keys(successorRuntimeContract).length > 0 &&
      JSON.stringify(Object.keys(selectedRuntime).filter(key => key !== 'rendererBinding').sort()) ===
        JSON.stringify(Object.keys(successorRuntimeContract).sort()) &&
      Object.entries(successorRuntimeContract).every(([key, value]) =>
        JSON.stringify(selectedRuntime[key]) === JSON.stringify(value)));
    const maintainedDomRegistrationValid = maintainedDom &&
      maintainedAuthority && successorRuntimeMatches &&
      text(selected.adapterFamily) === maintainedAuthority.adapterFamily &&
      JSON.stringify(Object.keys(rendererBinding).sort()) === JSON.stringify([
        'kind', 'memberManifest', 'module', 'sourceRun', 'timeline',
      ]) &&
      exactArtifactBinding(rendererBinding.module, maintainedEntry.moduleFile) &&
      exactArtifactBinding(rendererBinding.timeline, maintainedEntry.timeline) &&
      exactArtifactBinding(rendererBinding.memberManifest,
        maintainedEntry.memberManifest) &&
      exactArtifactBinding(rendererBinding.sourceRun,
        maintainedAuthority.compilerRun) &&
      registrationRecord.rendererBindingKind ===
        'maintained-dom-module-v1' &&
      registrationRecord.moduleSha256 === record(rendererBinding.module).sha256 &&
      registrationRecord.timelineSha256 ===
        record(rendererBinding.timeline).sha256 &&
      registrationRecord.memberManifestSha256 ===
        record(rendererBinding.memberManifest).sha256 &&
      registrationRecord.sourceRunSha256 ===
        record(rendererBinding.sourceRun).sha256 &&
      registrationRecord.runtimeSha256 === undefined;
    const canvasRegistrationValid = !maintainedDom && !maintainedAuthority &&
      registrationRecord.rendererBindingKind === undefined &&
      registrationRecord.memberManifestSha256 === undefined &&
      registrationRecord.sourceRunSha256 === undefined &&
      registrationRecord.runtimeSha256 === registeredRuntime.sha256;
    // PROVISIONAL377_BRIDGE_END: maintained-dom-registration
    const identity = `${moduleCode}:${lessonNumber}:${ordinal}`;
    const adapterFamily = text(selected.adapterFamily);
    const glossaryFamilyAuthority = adapterFamily
      ? glossaryFamilyAuthorityByAdapter.get(adapterFamily)
      : undefined;
    const nonGlossaryFamilyAuthority = adapterFamily
      ? nonGlossaryFamilyAuthorityByAdapter.get(adapterFamily)
      : undefined;
    const productHostCalibration = record(selected.productHostCalibration);
    const implementation = record(selected.implementation);
    const productBlockers = array(selected.productBlockers);
    const glossaryProductPage = adapterFamily?.startsWith('ts0') === true ||
      adapterFamily === 'in02-l1-glossary-source-static' ||
      adapterFamily === 'vb02-l1-glossary-source-static' ||
      adapterFamily === 'vb03-l1-glossary-source-static' ||
      adapterFamily === 'alg-l09-simple-glossary-source-static' ||
      adapterFamily === 'alg-l09-terminal-stop-source-static' ||
      adapterFamily === 'alg-l09-vb03-terminal-stop-source-static' ||
      adapterFamily === 'alg-l09-vb06-drag-source-static' ||
      adapterFamily === 'alg-l09-in04-numeric-source-static' ||
      adapterFamily === 'alg-l09-in06-choice-source-static' ||
      adapterFamily === 'alg-l09-in08-choice-source-static' ||
      adapterFamily === 'alg-l09-in10-choice-source-static' ||
      adapterFamily === 'alg-l09-ti-choice-source-static' ||
      adapterFamily ===
        'advanced-manual-alg-l09-guided-tutorial-source-static' ||
      adapterFamily === 'alg-l09-vb02-glossary-source-static';
    invariant(
      animationId && moduleCode && lessonNumber && ordinal && stableLessonKey &&
        complexityLane && COMPLEXITY_LANES.has(complexityLane) &&
        (useExternalSelectionAuthorities
          ? authoritySelectedIds.has(animationId)
          : selectedByProfile.has(identity)) &&
        !selectedIdentities.has(identity) &&
        catalogPage?.animationId === animationId &&
        catalogPage.placementId === animationId &&
        registration?.scope === 'private-engineering' &&
        registration.maturity === 'private-current-js' &&
        registration.deploymentScope === 'local-only' &&
        registration.calibrationId === G678_CALIBRATION_ID &&
        registration.freezeManifestSha256 === freeze.sha256 &&
        (maintainedDomRegistrationValid || canvasRegistrationValid) &&
        typeof registrationRecord.moduleSha256 === 'string' &&
        SHA256.test(registrationRecord.moduleSha256) &&
        typeof registrationRecord.timelineSha256 === 'string' &&
        SHA256.test(registrationRecord.timelineSha256) &&
        registry.hasModule(animationId),
      'G678_CALIBRATION_REGISTRATION_INVALID',
    );
    const audioEntries=(frozenGlossary&&'audioEntries' in frozenGlossary?frozenGlossary.audioEntries:[]) as Record<string,any>[];
    const audioEntry=audioEntries.find(e=>e.key===animationId);
    if(audioEntry?.key===animationId){const artifacts=record(audioEntry.artifacts);invariant(registrationRecord.moduleSha256===record(artifacts.module).sha256&&registrationRecord.timelineSha256===record(artifacts.timeline).sha256&&registrationRecord.runtimeSha256===record(artifacts.runtime).sha256,'G678_CONTINUOUS_AUDIO_REGISTRY_MISMATCH');}
    const introEntries=(frozenGlossary&&'introEntries' in frozenGlossary?frozenGlossary.introEntries:[]) as Record<string,any>[];
    const introEntry=introEntries.find((entry:Record<string,any>)=>entry.key===animationId);
    if(introEntry){const artifacts=record(introEntry.artifacts);invariant(registrationRecord.moduleSha256===record(artifacts.module).sha256&&registrationRecord.timelineSha256===record(artifacts.timeline).sha256&&registrationRecord.runtimeSha256===record(artifacts.runtime).sha256,'G678_PREPARED_INTRO_REGISTRY_MISMATCH');}
    const frozenGlossaryEntry = frozenGlossary?.entries.find(entry => entry.key === animationId);
    if (frozenGlossaryEntry) {
      const artifacts = record(frozenGlossaryEntry.artifacts);
      invariant(registrationRecord.moduleSha256 === record(artifacts.module).sha256 &&
        registrationRecord.timelineSha256 === record(artifacts.timeline).sha256 &&
        registrationRecord.runtimeSha256 === record(artifacts.runtime).sha256,
      'G678_FROZEN_GLOSSARY_REGISTRY_ARTIFACT_MISMATCH');
    }
    if (finalProductHostCalibrated && glossaryProductPage) {
      const terminalStopFamily = adapterFamily ===
        'alg-l09-terminal-stop-source-static' || adapterFamily ===
        'alg-l09-vb03-terminal-stop-source-static';
      const hasGlossaryEntries = array(selected.glossaryEntries).length > 0;
      const requiresSourceBoundGlossary = [
        'in02-l1-glossary-source-static',
        'vb02-l1-glossary-source-static',
        'vb03-l1-glossary-source-static',
        'alg-l09-simple-glossary-source-static',
        'alg-l09-vb03-terminal-stop-source-static',
        'alg-l09-vb06-drag-source-static',
        'alg-l09-in04-numeric-source-static',
        'alg-l09-in06-choice-source-static',
        'alg-l09-in08-choice-source-static',
        'alg-l09-in10-choice-source-static',
        'alg-l09-ti-choice-source-static',
        'advanced-manual-alg-l09-guided-tutorial-source-static',
        'alg-l09-vb02-glossary-source-static',
      ].includes(adapterFamily ?? '') ||
        (terminalStopFamily && hasGlossaryEntries);
      const groupedDragFamily = adapterFamily ===
        'alg-l09-vb06-drag-source-static';
      const numericResponseFamily = adapterFamily ===
        'alg-l09-in04-numeric-source-static';
      const choiceQuizFamily = adapterFamily ===
        'alg-l09-in06-choice-source-static' || adapterFamily ===
        'alg-l09-in08-choice-source-static' || adapterFamily ===
        'alg-l09-in10-choice-source-static' || adapterFamily ===
        'alg-l09-ti-choice-source-static';
      const choiceQuizIn08 = adapterFamily ===
        'alg-l09-in08-choice-source-static';
      const choiceQuizIn10 = adapterFamily ===
        'alg-l09-in10-choice-source-static';
      const choiceQuizTi = adapterFamily ===
        'alg-l09-ti-choice-source-static';
      const guidedTutorialFamily = adapterFamily ===
        'advanced-manual-alg-l09-guided-tutorial-source-static';
      const interactiveStops = array(selectedRuntime.interactiveStops)
        .map(record);
      invariant(glossaryFamilyAuthority && browserEvidence &&
        exactBinding(productHostCalibration.familyAuthority,
          glossaryFamilyAuthority, glossaryFamilyAuthority.path) &&
        exactBinding(productHostCalibration.browserEvidence,
          browserEvidence, browserEvidence.path) &&
        implementation.familyVisualPlaybackCalibrationPassed === true &&
        (!terminalStopFamily ||
          implementation.sourceTerminalStopProductHostCalibrationPassed ===
            true) &&
        (!terminalStopFamily || !hasGlossaryEntries ||
          implementation.typedBilingualGlossaryProductHostCalibrationPassed ===
            true) &&
        (terminalStopFamily ||
          implementation.typedBilingualGlossaryProductHostCalibrationPassed ===
            true) &&
        (!requiresSourceBoundGlossary ||
          (implementation
            .sourceFrameBoundGlossaryProductHostCalibrationPassed === true &&
          implementation
            .sourceCharacterBoundGlossaryProductHostCalibrationPassed === true &&
          productHostCalibration.sourceFrameBoundGlossaryControls === true &&
          productHostCalibration.sourceCharacterIdentityBound === true)) &&
        (!groupedDragFamily ||
          (implementation.sourceGroupedDragBehaviorBound === true &&
          implementation
            .accessiblePointerAndKeyboardInteractionImplemented === true &&
          implementation.randomFeedbackAudioAccepted === false &&
          productHostCalibration.frame129InteractiveStopBound === true &&
          productHostCalibration.fourSourceGroupingBound === true &&
          productHostCalibration
            .pointerKeyboardCompletionAndResumePassed === true &&
          interactiveStops.length === 1 &&
          interactiveStops[0]?.stopFrame === 129 &&
          interactiveStops[0]?.resumeFrame === 130 &&
          interactiveStops[0]?.completionDisposition ===
            'blocked-while-unresolved')) &&
        (!numericResponseFamily ||
          (implementation.sourceNumericResponseStopBound === true &&
          implementation.sourceNumericResponseBehaviorBound === true &&
          implementation
            .accessiblePointerAndKeyboardInteractionImplemented === true &&
          implementation.rightFeedbackAudioAccepted === false &&
          productHostCalibration.frame270InteractiveStopBound === true &&
          productHostCalibration.digitOnlySevenToTwentyResponseBound === true &&
          productHostCalibration
            .twoWrongAttemptsAndRightFeedbackResumePassed === true &&
          interactiveStops.length === 1 &&
          interactiveStops[0]?.stopFrame === 270 &&
          interactiveStops[0]?.resumeFrame === 271 &&
          interactiveStops[0]?.completionDisposition ===
            'blocked-while-unresolved')) &&
        (!choiceQuizFamily ||
          (implementation.sourceChoiceQuizStopBound === true &&
          implementation.sourceChoiceQuizBehaviorBound === true &&
          implementation
            .accessiblePointerAndKeyboardInteractionImplemented === true &&
          implementation.choiceFeedbackAudioAccepted === false &&
          (choiceQuizTi
            ? productHostCalibration.tiChoiceStopAndResumeBound === true &&
              productHostCalibration.sourceSpecificChoiceSetBound === true &&
              productHostCalibration.sourceStopFrame ===
                interactiveStops[0]?.stopFrame &&
              productHostCalibration.sourceResumeFrame ===
                interactiveStops[0]?.resumeFrame
            : choiceQuizIn08
            ? productHostCalibration.frame607InteractiveStopBound === true &&
              productHostCalibration.fourSourceNumericChoicesBound === true
            : choiceQuizIn10
            ? productHostCalibration.frame93InteractiveStopBound === true &&
              productHostCalibration.twoSourceRelationshipChoicesBound === true
            : productHostCalibration.frame188InteractiveStopBound === true &&
              productHostCalibration.fourSourceRatioChoicesBound === true) &&
          productHostCalibration
            .twoWrongAttemptsAndChoiceFeedbackResumePassed === true &&
          interactiveStops.length === 1 &&
          interactiveStops[0]?.stopFrame ===
            (choiceQuizTi
              ? productHostCalibration.sourceStopFrame
              : choiceQuizIn08 ? 607 : choiceQuizIn10 ? 93 : 188) &&
          interactiveStops[0]?.resumeFrame ===
            (choiceQuizTi
              ? productHostCalibration.sourceResumeFrame
              : choiceQuizIn08 ? 608 : choiceQuizIn10 ? 94 : 189) &&
          interactiveStops[0]?.completionDisposition ===
            'blocked-while-unresolved')) &&
        (!guidedTutorialFamily ||
          (implementation.sourceGuidedStopsBound === true &&
          implementation.sourceNeedMoreHelpBranchesBound === true &&
          implementation.sourceFinalChoiceQuizBound === true &&
          implementation
            .accessiblePointerAndKeyboardInteractionImplemented === true &&
          implementation.choiceFeedbackAudioAccepted === false &&
          productHostCalibration.sourceSpecificStopSequencesBound === true &&
          productHostCalibration.needMoreHelpBranchesBound === true &&
          productHostCalibration.finalChoiceSetsBound === true &&
          productHostCalibration
            .twoWrongAttemptsAndFeedbackResumePassed === true &&
          interactiveStops.length === 5 &&
          interactiveStops.every((stop) =>
            stop.completionDisposition === 'blocked-while-unresolved') &&
          interactiveStops.slice(0, 4).every((stop) =>
            stop.resolution === 'explicit-source-control-finished') &&
          interactiveStops[4]?.resolution ===
            'explicit-source-feedback-finished')) &&
        implementation.productCalibrationPassed === false &&
        productBlockers.every((blocker) =>
          typeof blocker === 'string' &&
          !blocker.includes('browser-product-calibration-pending')),
      'G678_CALIBRATION_GLOSSARY_PRODUCT_STATE_INVALID');
    } else if (finalProductHostCalibrated && adapterFamily ===
      'alg-l09-intro-shell-linkage-source-static') {
      invariant(nonGlossaryFamilyAuthority && browserEvidence &&
        exactBinding(productHostCalibration.familyAuthority,
          nonGlossaryFamilyAuthority, nonGlossaryFamilyAuthority.path) &&
        exactBinding(productHostCalibration.browserEvidence,
          browserEvidence, browserEvidence.path) &&
        implementation.familyVisualPlaybackCalibrationPassed === true &&
        implementation.exportedShellLinkagesExcludedFromPageScope === true &&
        implementation.productCalibrationPassed === false &&
        productHostCalibration.canvasReadyAndProgressing === true &&
        productHostCalibration.mainTimelineAdvancedToEnd === true &&
        productHostCalibration.noInventedPageControls === true &&
        productBlockers.every((blocker) => typeof blocker === 'string' &&
          !blocker.includes('browser-product-calibration-pending')),
      'G678_CALIBRATION_NON_GLOSSARY_PRODUCT_STATE_INVALID');
    } else if (finalProductHostCalibrated && [
      'advanced-manual-alg-l09-game-controller-source-static',
      'advanced-manual-alg-l09-matching-game-source-static',
      'advanced-manual-alg-l09-final-assessment-source-static',
    ].includes(adapterFamily ?? '')) {
      const controller = adapterFamily ===
        'advanced-manual-alg-l09-game-controller-source-static';
      const game = adapterFamily ===
        'advanced-manual-alg-l09-matching-game-source-static';
      const assessment = adapterFamily ===
        'advanced-manual-alg-l09-final-assessment-source-static';
      const interactiveStops = array(selectedRuntime.interactiveStops)
        .map(record);
      invariant(nonGlossaryFamilyAuthority && browserEvidence &&
        exactBinding(productHostCalibration.familyAuthority,
          nonGlossaryFamilyAuthority, nonGlossaryFamilyAuthority.path) &&
        exactBinding(productHostCalibration.browserEvidence,
          browserEvidence, browserEvidence.path) &&
        implementation.familyVisualPlaybackCalibrationPassed === true &&
        implementation.sourceGameOrAssessmentBehaviorBound === true &&
        implementation
          .accessiblePointerAndKeyboardInteractionImplemented === true &&
        implementation.feedbackAndAssessmentAudioAccepted === false &&
        implementation.typedCrossPageNavigationProductHostCalibrationPassed ===
          controller &&
        implementation.matchingGameProductHostCalibrationPassed === game &&
        implementation.finalAssessmentProductHostCalibrationPassed ===
          assessment &&
        productHostCalibration.typedCrossPageNavigationPassed === controller &&
        productHostCalibration.matchingGameTwoLevelsAndScoringPassed === game &&
        productHostCalibration
          .finalAssessmentRandomTenScoringAndReviewPassed === assessment &&
        productHostCalibration.levelHandoffInherited === controller &&
        productHostCalibration.controllerReplayResetPassed === controller &&
        productHostCalibration.matchingReplayResetPassed === game &&
        productHostCalibration.level1ScoringAndResetPassed === game &&
        productHostCalibration.levelSwitchHeldDuringFeedback === game &&
        productHostCalibration.sourceLevel1AndLevel2LabelsVisible === game &&
        productHostCalibration.exactlyOneTwoChoiceWrongReviewPassed ===
          assessment &&
        productHostCalibration.sourceQuestionContentVisible === assessment &&
        productHostCalibration.typedFinalAssessmentHostScorePassed ===
          assessment &&
        productHostCalibration.finalAssessmentReplayResetPassed ===
          assessment &&
        productHostCalibration.finalAssessmentHostScoreReplayResetPassed ===
          assessment &&
        productHostCalibration.allObservedRequestsLoopback === true &&
        productHostCalibration.allObservedRequestsExplicitlyAllowed === true &&
        productHostCalibration.allLegacyNetworkOperationsBlocked === true &&
        (!controller || productHostCalibration.navigationTarget ===
          'shared-alg001-l09-p031') &&
        (!game || (productHostCalibration.matchingPairCountPerLevel === 6 &&
          productHostCalibration.matchingGameFinalScoreAfterOneWrong === 58)) &&
        (!assessment ||
          (productHostCalibration.finalAssessmentQuestionPoolSize === 24 &&
          productHostCalibration.finalAssessmentPresentedQuestionCount ===
            10 &&
          productHostCalibration.finalAssessmentCorrectResponseCount === 9 &&
          productHostCalibration.finalAssessmentWrongResponseCount === 1)) &&
        interactiveStops.length === 1 &&
        interactiveStops[0]?.completionDisposition ===
          'blocked-while-unresolved' &&
        implementation.productCalibrationPassed === false &&
        productBlockers.every((blocker) => typeof blocker === 'string' &&
          !blocker.includes('browser-product-calibration-pending')),
      'G678_CALIBRATION_GAME_ASSESSMENT_PRODUCT_STATE_INVALID');
    }
    selectedIdentities.add(identity);
    // PROVISIONAL377_BRIDGE_BEGIN: maintained-dom-projection
    if (maintainedDom) {
      maintainedDomRenderers.push(Object.freeze({
        animationId,
        memberManifest: Object.freeze({...record(rendererBinding.memberManifest)}) as
          G678MaintainedDomRendererBinding['memberManifest'],
        module: Object.freeze({...record(rendererBinding.module)}) as
          G678MaintainedDomRendererBinding['module'],
        sourceRun: Object.freeze({...record(rendererBinding.sourceRun)}) as
          G678MaintainedDomRendererBinding['sourceRun'],
        timeline: Object.freeze({...record(rendererBinding.timeline)}) as
          G678MaintainedDomRendererBinding['timeline'],
      }));
    } else {
      runtimeAssets.push(runtimeAsset(animationId, selected.runtime));
    }
    // PROVISIONAL377_BRIDGE_END: maintained-dom-projection
  }
  invariant(
    selectedIdentities.size === selectedPages.length &&
      (useExternalSelectionAuthorities ||
        [...selectedIdentities].every((identity) => selectedByProfile.has(identity))),
    'G678_CALIBRATION_PROFILE_SELECTION_DRIFT',
  );
  const selectionsByLesson = new Map<string, JsonRecord[]>();
  for (const selected of selectedPages) {
    const stableLessonKey = text(selected.stableLessonKey);
    invariant(stableLessonKey, 'G678_CALIBRATION_LESSON_KEY_INVALID');
    const selections = selectionsByLesson.get(stableLessonKey) ?? [];
    selections.push(selected);
    selectionsByLesson.set(stableLessonKey, selections);
  }
  const descriptors = [...selectionsByLesson.entries()].map(
    ([stableLessonKey, selections]) => {
    const lesson = lessonByKey.get(stableLessonKey);
    invariant(lesson, 'G678_CALIBRATION_LESSON_NOT_FOUND');
    return descriptorForSelections({
      catalogLesson: lesson,
      freezeBinding: freeze,
      mathCompanionPresentations,
      sourceGlossaryByAnimationId,
      selections: selections.sort((left, right) =>
        Number(left.globalPageOrdinal) - Number(right.globalPageOrdinal)),
    });
  });
  const registeredPlacementCount = selectedPages.length;
  const frozenCalibrationPlacementCount = Number(
    freezeRoot.frozenCalibrationPlacementCount,
  );
  const registrationStatus = registeredPlacementCount ===
    frozenCalibrationPlacementCount
    ? 'private-current-js-calibration-registered-frozen-set'
    : 'private-current-js-calibration-partial';
  return Object.freeze({
    calibrationId: G678_CALIBRATION_ID,
    descriptors: Object.freeze(descriptors),
    error: null,
    frozenCalibrationPlacementCount,
    registeredPlacementCount,
    registrationStatus,
    runtimeAssets: Object.freeze(runtimeAssets),
    // PROVISIONAL377_BRIDGE_BEGIN: maintained-dom-ready-output
    maintainedDomRenderers: Object.freeze(maintainedDomRenderers),
    // PROVISIONAL377_BRIDGE_END: maintained-dom-ready-output
    scaleOutAuthorized: false,
    status: 'ready',
  });
}

function fileBinding(root: string, relativePath: string): FileBinding | null {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) return null;
  const metadata = statSync(absolutePath);
  if (!metadata.isFile()) return null;
  const bytes = readFileSync(absolutePath);
  return Object.freeze({
    bytes: bytes.length,
    path: relativePath,
    sha256: digest(bytes),
    value: JSON.parse(bytes.toString('utf8')) as unknown,
  });
}

function emptySnapshot(
  status: Exclude<G678PartialCalibrationSnapshot['status'], 'ready'>,
  error: string | null,
): G678PartialCalibrationSnapshot {
  return Object.freeze({
    calibrationId: G678_CALIBRATION_ID,
    descriptors: Object.freeze([]),
    error,
    frozenCalibrationPlacementCount: 2282,
    registeredPlacementCount: 0,
    registrationStatus: null,
    runtimeAssets: Object.freeze([]),
    // PROVISIONAL377_BRIDGE_BEGIN: maintained-dom-empty-output
    maintainedDomRenderers: Object.freeze([]),
    // PROVISIONAL377_BRIDGE_END: maintained-dom-empty-output
    scaleOutAuthorized: false,
    status,
  });
}

let cachedSnapshot: G678PartialCalibrationSnapshot | undefined;
let cachedFingerprint: string | undefined;

export function g678CalibrationFingerprintDependencies(freezeValue?: unknown) {
  const paths = [
    G678_SHARED_CATALOG_PATH,
    G678_SHARED_PROFILE_PATH,
    G678_CALIBRATION_FREEZE_PATH,
  ];
  if ([G678_ALG_L11_FEEDBACK_HOST_SCORE_SUCCESSOR_FREEZE_PATH,
    G678_ALG_L11_MATH_COMPANION_SUCCESSOR_FREEZE_PATH,
    G678_NMS_L01_P042_COMPANION_FREEZE_PATH, G678_NMS_L01_P044_PREPARED_FREEZE_PATH, G678_NMS_L01_P044_REPAIR_FREEZE_PATH, FROZEN_GLOSSARY_FREEZE.path].includes(G678_CALIBRATION_FREEZE_PATH)) {
    paths.push(G678_INSTRUCTIONAL_PREDECESSOR_FRAGMENT.path);
  }
  if ([G678_ALG_L11_MATH_COMPANION_SUCCESSOR_FREEZE_PATH,
    G678_NMS_L01_P042_COMPANION_FREEZE_PATH, G678_NMS_L01_P044_PREPARED_FREEZE_PATH, G678_NMS_L01_P044_REPAIR_FREEZE_PATH, FROZEN_GLOSSARY_FREEZE.path].includes(G678_CALIBRATION_FREEZE_PATH)) {
    paths.push(G678_INSTRUCTIONAL_BEHAVIOR_DELTA_FRAGMENT.path);
  }
  if ([G678_NMS_L01_P042_COMPANION_FREEZE_PATH, G678_NMS_L01_P044_PREPARED_FREEZE_PATH, G678_NMS_L01_P044_REPAIR_FREEZE_PATH, FROZEN_GLOSSARY_FREEZE.path].includes(G678_CALIBRATION_FREEZE_PATH)) {
    paths.push(G678_P042_AUTHORITY.path, G678_P042_BASE.path, G678_P042_READABLE.path,
      G678_P042_PREDECESSOR.path, G678_P042_RUN_PATH);
  }
  const freeze = record(freezeValue);
  if (new Set<string>([G678_NMS_L01_P044_REPAIR_FREEZE_PATH, FROZEN_GLOSSARY_FREEZE.path]).has(G678_CALIBRATION_FREEZE_PATH)) {
    paths.push(G678_P044_REPAIR_FREEZE.path,G678_P044_REPAIR_AUTHORITY.path,G678_P044_REPAIR_CANDIDATE.path,G678_P044_REPAIR_REGISTRY.path,
      G678_P044_FREEZE.path,G678_P044_AUTHORITY.path,G678_P044_CANDIDATE.path,G678_P044_PREDECESSOR.path,G678_P044_GLOSSARY.path,
      'packages/demos/src/registry.local-only.generated.ts','packages/demos/src/registry.local-only.metadata.generated.ts');
  }
  if (G678_CALIBRATION_FREEZE_PATH === G678_NMS_L01_P044_PREPARED_FREEZE_PATH) {
    paths.push(G678_P044_AUTHORITY.path, G678_P044_CANDIDATE.path, G678_P044_GLOSSARY.path,
      G678_P044_PREDECESSOR.path, G678_P044_WITNESS.path, G678_P044_ACTIVE_REGISTRY.path,
      'packages/demos/src/registry.local-only.generated.ts', 'packages/demos/src/registry.local-only.metadata.generated.ts');
  }
  for (const declaration of array(record(freeze.inputs).selectionAuthorities).map(record)) {
    const authorityPath = text(declaration.path);
    if (authorityPath) paths.push(authorityPath);
  }
  const browserPath = text(record(record(freeze.inputs).browserProductEvidence).path);
  if (browserPath) paths.push(browserPath);
  return Object.freeze([...new Set(paths)]);
}

function validateCurrentP044HostClosure(root:string,validated:ReturnType<typeof validateG678P044RepairAuthority>){
  const pins=activeHostPins(root).expand(resolveTypographyHostClosurePins(root,validated.physicalPins));
  if(pins===validated.physicalPins)return validateG678P044RepairPhysicalClosure(root,validated);
  for(const p of pins)readG678P044PhysicalPin(root,p);
  for(const p of validated.historicalWitnesses)invariant((lstatSync(resolveG678P044PhysicalPath(root,p.path)).mode&0o222)===0,'G678_READ_ONLY_PREDECESSOR_WITNESS');
  return pins.map(p=>resolveG678P044PhysicalPath(root,p.path));
}
function validateCurrentP042HostClosure(root:string,validated:ReturnType<typeof validateG678P042CompanionAuthority>){
  const original=g678P042PhysicalClosurePins(root,validated),pins=activeHostPins(root).expand(resolveTypographyHostClosurePins(root,original));
  if(pins===original)return validateG678P042PhysicalClosure(root,validated);
  for(const p of pins)readG678P042PhysicalPin(root,p);
  return pins.map(p=>resolveG678P042PhysicalPath(root,p.path));
}

function fingerprint(root: string) {
  let freezeValue: unknown;
  try {
    freezeValue = JSON.parse(readFileSync(path.join(root, G678_CALIBRATION_FREEZE_PATH), 'utf8'));
  } catch {
    // The normal missing/invalid snapshot path below reports the precise state.
  }
  const physicalPaths: string[] = [];
  try {physicalPaths.push(...typographyHostFingerprintPaths(root));} catch {physicalPaths.push('typography-host-successor-invalid');}
  if (G678_CALIBRATION_FREEZE_PATH === FROZEN_GLOSSARY_FREEZE.path) {
    try {physicalPaths.push(...readFrozenGlossaryPackage(root).physicalPaths);}
    catch {physicalPaths.push('frozen-glossary-physical-closure-invalid');}
  }

  if (new Set<string>([G678_NMS_L01_P044_REPAIR_FREEZE_PATH, FROZEN_GLOSSARY_FREEZE.path]).has(G678_CALIBRATION_FREEZE_PATH)) {
    try {const validated=validateG678P044RepairAuthority(readG678P044RepairPackage(root));
      physicalPaths.push(...validated.physicalPins.map(pin=>resolveG678P044PhysicalPath(root,pin.path)));
    } catch {physicalPaths.push('p044-repair-physical-closure-invalid');}
  }
  if ([G678_NMS_L01_P042_COMPANION_FREEZE_PATH, G678_NMS_L01_P044_PREPARED_FREEZE_PATH, G678_NMS_L01_P044_REPAIR_FREEZE_PATH, FROZEN_GLOSSARY_FREEZE.path].includes(G678_CALIBRATION_FREEZE_PATH)) {
    try {
      const validated = validateG678P042CompanionAuthority({
        authority: readG678P042FileBinding(root, G678_P042_AUTHORITY),
        baseCandidate: readG678P042FileBinding(root, G678_P042_BASE),
        readableCandidate: readG678P042FileBinding(root, G678_P042_READABLE),
        predecessorFreeze: readG678P042FileBinding(root, G678_P042_PREDECESSOR),
        freeze: new Set<string>([G678_NMS_L01_P044_PREPARED_FREEZE_PATH,G678_NMS_L01_P044_REPAIR_FREEZE_PATH, FROZEN_GLOSSARY_FREEZE.path]).has(G678_CALIBRATION_FREEZE_PATH)
          ? readG678P044FileBinding(root, G678_P044_PREDECESSOR).value : freezeValue,
      });
      physicalPaths.push(...g678P042PhysicalClosurePins(root, validated)
        .map(binding => resolveG678P042PhysicalPath(root, binding.path)));
    } catch {
      // Fail-closed snapshot loading below reports the precise missing/drifted
      // authority. Fixed manifest/run paths remain in the fingerprint.
      physicalPaths.push('p042-physical-closure-invalid');
    }
  }
  if (G678_CALIBRATION_FREEZE_PATH === G678_NMS_L01_P044_PREPARED_FREEZE_PATH) {
    try {
      const validated = validateG678P044Authority({authority: readG678P044FileBinding(root, G678_P044_AUTHORITY),
        candidate: readG678P044FileBinding(root, G678_P044_CANDIDATE), predecessor: readG678P044FileBinding(root, G678_P044_PREDECESSOR),
        freeze: readG678P044FileBinding(root, G678_P044_FREEZE), glossary: readG678P044FileBinding(root, G678_P044_GLOSSARY)});
      physicalPaths.push(...validated.physicalPins.map(pin => resolveG678P044PhysicalPath(root, pin.path)));
    } catch { physicalPaths.push('p044-physical-closure-invalid'); }
  }
  return [...new Set([...g678CalibrationFingerprintDependencies(freezeValue), ...physicalPaths])].map((relativePath) => {
    try {
      if ([G678_NMS_L01_P042_COMPANION_FREEZE_PATH, G678_NMS_L01_P044_PREPARED_FREEZE_PATH, G678_NMS_L01_P044_REPAIR_FREEZE_PATH, FROZEN_GLOSSARY_FREEZE.path].includes(G678_CALIBRATION_FREEZE_PATH)) {
        const metadata = lstatSync(path.resolve(root, relativePath));
        return `${relativePath}:${metadata.dev}:${metadata.ino}:${metadata.size}:${metadata.mtimeMs}:${metadata.ctimeMs}:${metadata.nlink}:${metadata.mode}`;
      }
      const metadata = statSync(path.join(root, relativePath));
      return `${relativePath}:${metadata.size}:${metadata.mtimeMs}`;
    } catch {
      return `${relativePath}:missing`;
    }
  }).join('|');
}

export function g678PartialCalibrationSnapshot(): G678PartialCalibrationSnapshot {
  if (process.env.NODE_ENV === 'production' && !isG678CompiledLocalQaEnabled()) {
    return emptySnapshot('production-closed', null);
  }
  const root = getWorkspaceRoot();
  const currentFingerprint = fingerprint(root);
  if (cachedSnapshot && cachedFingerprint === currentFingerprint) {
    return cachedSnapshot;
  }
  cachedFingerprint = currentFingerprint;
  let catalog: FileBinding | null;
  let profile: FileBinding | null;
  let freeze: FileBinding | null;
  try {
    catalog = fileBinding(root, G678_SHARED_CATALOG_PATH);
    profile = fileBinding(root, G678_SHARED_PROFILE_PATH);
    freeze = fileBinding(root, G678_CALIBRATION_FREEZE_PATH);
  } catch {
    cachedSnapshot = emptySnapshot(
      'invalid',
      'G678_CALIBRATION_JSON_INVALID',
    );
    return cachedSnapshot;
  }
  if (!catalog || !profile || !freeze) {
    cachedSnapshot = emptySnapshot(
      'missing',
      'G678_CALIBRATION_FREEZE_OR_SOURCE_MISSING',
    );
    return cachedSnapshot;
  }
  try {
    const selectionAuthorityDeclarations = array(
      record(record(freeze.value).inputs).selectionAuthorities,
    ).map(record);
    const selectionAuthorities = selectionAuthorityDeclarations.map(
      (declaration) => {
        const relativePath = text(declaration.path);
        invariant(relativePath &&
          relativePath.startsWith('catalog/') &&
          !relativePath.split('/').some((segment) =>
            segment === '' || segment === '.' || segment === '..'
          ), 'G678_CALIBRATION_SELECTION_AUTHORITY_PATH_INVALID');
        const authority = relativePath === G678_P042_AUTHORITY.path &&
          [G678_NMS_L01_P042_COMPANION_FREEZE_PATH, G678_NMS_L01_P044_PREPARED_FREEZE_PATH, G678_NMS_L01_P044_REPAIR_FREEZE_PATH, FROZEN_GLOSSARY_FREEZE.path].includes(G678_CALIBRATION_FREEZE_PATH)
          ? readG678P042FileBinding(root, G678_P042_AUTHORITY)
          : relativePath === G678_P044_AUTHORITY.path && G678_CALIBRATION_FREEZE_PATH === G678_NMS_L01_P044_PREPARED_FREEZE_PATH
          ? readG678P044FileBinding(root, G678_P044_AUTHORITY) : fileBinding(root, relativePath);
        invariant(authority,
          'G678_CALIBRATION_SELECTION_AUTHORITY_MISSING');
        return authority;
      },
    );
    let predecessorFileBinding: FileBinding | undefined;
    if ([G678_ALG_L11_FEEDBACK_HOST_SCORE_SUCCESSOR_FREEZE_PATH,
      G678_ALG_L11_MATH_COMPANION_SUCCESSOR_FREEZE_PATH,
      G678_NMS_L01_P042_COMPANION_FREEZE_PATH, G678_NMS_L01_P044_PREPARED_FREEZE_PATH, G678_NMS_L01_P044_REPAIR_FREEZE_PATH, FROZEN_GLOSSARY_FREEZE.path].includes(G678_CALIBRATION_FREEZE_PATH)) {
      const predecessorPath = G678_INSTRUCTIONAL_PREDECESSOR_FRAGMENT.path;
      const absolute = path.join(root, predecessorPath);
      invariant(existsSync(absolute), 'G678_CALIBRATION_V3_PREDECESSOR_MISSING');
      const metadata = lstatSync(absolute);
      invariant(metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1 &&
        realpathSync(absolute) === absolute, 'G678_CALIBRATION_V3_PREDECESSOR_NOT_CANONICAL');
      predecessorFileBinding = fileBinding(root, predecessorPath) ?? undefined;
      invariant(predecessorFileBinding,
        'G678_CALIBRATION_V3_PREDECESSOR_MISSING');
    }
    let dualPredecessorFileBinding: FileBinding | undefined;
    if ([G678_ALG_L11_MATH_COMPANION_SUCCESSOR_FREEZE_PATH,
      G678_NMS_L01_P042_COMPANION_FREEZE_PATH, G678_NMS_L01_P044_PREPARED_FREEZE_PATH, G678_NMS_L01_P044_REPAIR_FREEZE_PATH, FROZEN_GLOSSARY_FREEZE.path].includes(G678_CALIBRATION_FREEZE_PATH)) {
      const predecessorPath = G678_INSTRUCTIONAL_BEHAVIOR_DELTA_FRAGMENT.path;
      const absolute = path.join(root, predecessorPath);
      invariant(existsSync(absolute), 'G678_CALIBRATION_V4_DUAL_PREDECESSOR_MISSING');
      const metadata = lstatSync(absolute);
      invariant(metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1 &&
        realpathSync(absolute) === absolute, 'G678_CALIBRATION_V4_DUAL_PREDECESSOR_NOT_CANONICAL');
      dualPredecessorFileBinding = fileBinding(root, predecessorPath) ?? undefined;
      invariant(dualPredecessorFileBinding, 'G678_CALIBRATION_V4_DUAL_PREDECESSOR_MISSING');
    }
    let p042PredecessorFreezeFileBinding: FileBinding | undefined;
    let p042BaseCandidateFileBinding: FileBinding | undefined;
    let p042ReadableCandidateFileBinding: FileBinding | undefined;
    let p044PredecessorFreezeFileBinding: FileBinding | undefined;
    let p044CandidateFileBinding: FileBinding | undefined;
    let p044GlossaryFileBinding: FileBinding | undefined;
    let p044RepairLineage: P044RepairLineage | undefined;
    const frozenGlossary = G678_CALIBRATION_FREEZE_PATH === FROZEN_GLOSSARY_FREEZE.path
      ? readFrozenGlossaryPackage(root, freeze) : undefined;

    if (new Set<string>([G678_NMS_L01_P044_REPAIR_FREEZE_PATH, FROZEN_GLOSSARY_FREEZE.path]).has(G678_CALIBRATION_FREEZE_PATH)) {
      const repair=readG678P044RepairPackage(root);
      p044PredecessorFreezeFileBinding=repair.predecessor;p044CandidateFileBinding=repair.candidate;p044GlossaryFileBinding=repair.glossary;p044RepairLineage=repair.lineage;
      const declared=selectionAuthorities.filter(a=>a.path===G678_P044_REPAIR_AUTHORITY.path);
      invariant(declared.length===1,'G678_CALIBRATION_P044_REPAIR_AUTHORITY_MISSING');
      validateCurrentP044HostClosure(root,validateG678P044RepairAuthority({...repair,authority:declared[0],freeze:frozenGlossary?.predecessor ?? freeze}));
      readG678P044PhysicalPin(root,frozenGlossary ? FROZEN_GLOSSARY_REGISTRY_WITNESS : G678_P044_REPAIR_REGISTRY);
    }
    if (G678_CALIBRATION_FREEZE_PATH === G678_NMS_L01_P044_PREPARED_FREEZE_PATH) {
      p044PredecessorFreezeFileBinding = readG678P044FileBinding(root, G678_P044_PREDECESSOR);
      p044CandidateFileBinding = readG678P044FileBinding(root, G678_P044_CANDIDATE);
      p044GlossaryFileBinding = readG678P044FileBinding(root, G678_P044_GLOSSARY);
      const authority = selectionAuthorities.find(binding => binding.path === G678_P044_AUTHORITY.path);
      invariant(authority, 'G678_CALIBRATION_P044_AUTHORITY_MISSING');
      validateG678P044PhysicalClosure(root, validateG678P044Authority({authority,
        candidate: p044CandidateFileBinding, predecessor: p044PredecessorFreezeFileBinding, freeze, glossary: p044GlossaryFileBinding}));
      readG678P044PhysicalPin(root, G678_P044_ACTIVE_REGISTRY);
    }
    if ([G678_NMS_L01_P042_COMPANION_FREEZE_PATH, G678_NMS_L01_P044_PREPARED_FREEZE_PATH, G678_NMS_L01_P044_REPAIR_FREEZE_PATH, FROZEN_GLOSSARY_FREEZE.path].includes(G678_CALIBRATION_FREEZE_PATH)) {
      p042PredecessorFreezeFileBinding = readG678P042FileBinding(root, G678_P042_PREDECESSOR);
      p042BaseCandidateFileBinding = readG678P042FileBinding(root, G678_P042_BASE);
      p042ReadableCandidateFileBinding = readG678P042FileBinding(root, G678_P042_READABLE);
      const authority = selectionAuthorities.find(binding => binding.path === G678_P042_AUTHORITY.path);
      invariant(authority, 'G678_CALIBRATION_P042_AUTHORITY_MISSING');
      validateCurrentP042HostClosure(root, validateG678P042CompanionAuthority({authority,
        baseCandidate: p042BaseCandidateFileBinding, readableCandidate: p042ReadableCandidateFileBinding,
        predecessorFreeze: p042PredecessorFreezeFileBinding, freeze: p044PredecessorFreezeFileBinding?.value ?? freeze.value}));
    }
    const browserDeclaration = record(
      record(record(freeze.value).inputs).browserProductEvidence,
    );
    const browserPath = text(browserDeclaration.path);
    const browserEvidence = browserPath
      ? fileBinding(root, browserPath) ?? undefined
      : undefined;
    if (browserPath) {
      invariant(browserPath.startsWith('output/playwright/') &&
        !browserPath.split('/').some((segment) =>
          segment === '' || segment === '.' || segment === '..') &&
        browserEvidence,
      'G678_CALIBRATION_BROWSER_PRODUCT_AUTHORITY_MISSING');
    }
    const builtSnapshot = buildG678PartialCalibrationSnapshot({
      browserEvidence,
      catalog,
      freeze,
      profile,
      selectionAuthorities,
      predecessorFileBinding,
      dualPredecessorFileBinding,
      p042PredecessorFreezeFileBinding,
      p042BaseCandidateFileBinding,
      p042ReadableCandidateFileBinding,
      p044PredecessorFreezeFileBinding,
      p044CandidateFileBinding,
      p044GlossaryFileBinding,
      p044RepairLineage,
      frozenGlossaryPredecessor: frozenGlossary?.predecessor,
      frozenGlossaryCandidate: frozenGlossary?.candidate,
    });
    cachedSnapshot = Object.freeze({...builtSnapshot,sharedHostSuccessor:currentTypographyHostBinding(root)});
  } catch (error) {
    cachedSnapshot = emptySnapshot(
      'invalid',
      error instanceof Error ? error.message : 'G678_CALIBRATION_INVALID',
    );
  }
  return cachedSnapshot;
}

export function g678PartialCalibrationDescriptors() {
  return g678PartialCalibrationSnapshot().descriptors;
}

export function findG678PartialCalibrationDescriptor(
  placementId: string,
) {
  if (!G678_CALIBRATION_ANIMATION_ID_PATTERN.test(placementId)) return undefined;
  const matches = g678PartialCalibrationDescriptors().filter((descriptor) =>
    descriptor.productBridge.selectedAnimationIds.includes(placementId)
  );
  return matches.length === 1 ? matches[0] : undefined;
}

export function g678PartialRegistrationCount(
  descriptors: readonly PageOnlyLessonPlayerDescriptor[],
  moduleCode: string,
  lesson: number,
) {
  const matches = descriptors.filter((descriptor) =>
    descriptor.course.moduleCode === moduleCode &&
    descriptor.course.lesson === lesson
  );
  if (matches.length !== 1) return 0;
  return matches[0]!.pages.filter(
    (page) => page.rendererAvailability.kind === 'registered',
  ).length;
}
