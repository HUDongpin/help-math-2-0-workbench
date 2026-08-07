export const LESSON_HOST_CAPABILITIES = Object.freeze([
  'navigation',
  'language',
  'glossary',
  'keyterm',
  'calculator',
  'audio',
  'fq-scoring',
] as const);

export type LessonHostCapability = (typeof LESSON_HOST_CAPABILITIES)[number];
export type LessonHostLanguage = 'en' | 'es';
export type LessonHostMode = 'audit' | 'published';

export const KEYTERM_PLAYBACK_DISPOSITIONS = Object.freeze([
  'reversible-support-pause',
  'source-stop-timeline-and-audio-until-explicit-resume',
] as const);

export type KeytermPlaybackDisposition = (typeof KEYTERM_PLAYBACK_DISPOSITIONS)[number];

export const BLOCKED_LEGACY_HOST_OPERATIONS = Object.freeze([
  'getURL',
  'fscommand',
  'bookmark',
  'report',
  'download',
  'final-quiz-post',
  'loadVariables',
  'xml-send',
  'external-interface',
  'shared-object-persist',
] as const);

export type BlockedLegacyHostOperation = (typeof BLOCKED_LEGACY_HOST_OPERATIONS)[number];

export interface LessonHostCapabilityDescriptor {
  readonly capabilities: readonly LessonHostCapability[];
  readonly legacyOperations: 'blocked';
  readonly auditStorage: 'memory-only';
  readonly storesPersonalData: false;
}

export const FAIL_CLOSED_LESSON_HOST_DEFAULTS: LessonHostCapabilityDescriptor = Object.freeze({
  capabilities: Object.freeze([]),
  legacyOperations: 'blocked',
  auditStorage: 'memory-only',
  storesPersonalData: false,
});

export type LessonHostRequest =
  | Readonly<{type: 'navigate'; targetAnimationId: string}>
  | Readonly<{type: 'set-language'; language: LessonHostLanguage}>
  | Readonly<{type: 'open-glossary'; entryId: string}>
  | Readonly<{type: 'close-glossary'}>
  | Readonly<{
      type: 'open-keyterm';
      entryId: string;
      playbackDisposition?: KeytermPlaybackDisposition;
      sourceAnimationId?: string;
    }>
  | Readonly<{type: 'close-keyterm'}>
  | Readonly<{type: 'open-calculator'}>
  | Readonly<{type: 'close-calculator'}>
  | Readonly<{type: 'play-audio'; cueId: string}>
  | Readonly<{type: 'stop-audio'; cueId?: string}>
  | Readonly<{
      type: 'record-fq-score';
      questionId: string;
      correct: boolean;
      pointsAwarded: number;
      pointsPossible: number;
    }>
  | Readonly<{type: 'reset-fq-score'}>
  | Readonly<{
      type: 'legacy';
      operation: BlockedLegacyHostOperation;
      target?: string;
    }>;

export interface LessonHostState {
  readonly releaseId: string;
  readonly storage: 'memory-only';
  readonly storesPersonalData: false;
  readonly currentAnimationId: string;
  readonly language: LessonHostLanguage;
  readonly glossaryEntryId: string | null;
  readonly keytermEntryId: string | null;
  readonly calculatorOpen: boolean;
  readonly activeAudioCueId: string | null;
  readonly fqScore: Readonly<{
    attempted: number;
    correct: number;
    pointsAwarded: number;
    pointsPossible: number;
    scoredQuestionIds: readonly string[];
  }>;
}

export interface LessonHostAllowedDecision {
  readonly status: 'allowed';
  readonly capability: LessonHostCapability;
  readonly auditOnly: boolean;
  readonly state: LessonHostState;
}

export interface LessonHostBlockedDecision {
  readonly status: 'blocked';
  readonly code:
    | 'invalid-request'
    | 'capability-not-enabled'
    | 'release-not-published'
    | 'navigation-target-not-admitted'
    | 'legacy-operation-blocked'
    | 'duplicate-question-score';
  readonly reason: string;
  readonly state: LessonHostState;
}

export type LessonHostDecision = LessonHostAllowedDecision | LessonHostBlockedDecision;

export interface MemoryOnlyLessonHostConfig {
  readonly releaseId: string;
  readonly releaseMemberIds: readonly string[];
  readonly currentAnimationId: string;
  readonly enabledCapabilities?: readonly LessonHostCapability[];
  readonly initialLanguage?: LessonHostLanguage;
  readonly mode?: LessonHostMode;
  readonly releasePublished?: boolean;
}

export interface MemoryOnlyLessonHost {
  readonly contract: LessonHostCapabilityDescriptor;
  readonly mode: LessonHostMode;
  readonly releasePublished: boolean;
  dispatch(request: unknown): LessonHostDecision;
  snapshot(): LessonHostState;
  reset(): LessonHostState;
}

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/;
const capabilitySet = new Set<string>(LESSON_HOST_CAPABILITIES);
const legacyOperationSet = new Set<string>(BLOCKED_LEGACY_HOST_OPERATIONS);
const keytermPlaybackDispositionSet = new Set<string>(KEYTERM_PLAYBACK_DISPOSITIONS);

function validId(value: unknown): value is string {
  return typeof value === 'string' && SAFE_ID.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function capabilityForRequest(type: string): LessonHostCapability | null {
  if (type === 'navigate') return 'navigation';
  if (type === 'set-language') return 'language';
  if (type === 'open-glossary' || type === 'close-glossary') return 'glossary';
  if (type === 'open-keyterm' || type === 'close-keyterm') return 'keyterm';
  if (type === 'open-calculator' || type === 'close-calculator') return 'calculator';
  if (type === 'play-audio' || type === 'stop-audio') return 'audio';
  if (type === 'record-fq-score' || type === 'reset-fq-score') return 'fq-scoring';
  return null;
}

function freezeState(state: LessonHostState): LessonHostState {
  return Object.freeze({
    ...state,
    fqScore: Object.freeze({
      ...state.fqScore,
      scoredQuestionIds: Object.freeze([...state.fqScore.scoredQuestionIds]),
    }),
  });
}

function initialState(config: MemoryOnlyLessonHostConfig): LessonHostState {
  return freezeState({
    releaseId: config.releaseId,
    storage: 'memory-only',
    storesPersonalData: false,
    currentAnimationId: config.currentAnimationId,
    language: config.initialLanguage ?? 'en',
    glossaryEntryId: null,
    keytermEntryId: null,
    calculatorOpen: false,
    activeAudioCueId: null,
    fqScore: {
      attempted: 0,
      correct: 0,
      pointsAwarded: 0,
      pointsPossible: 0,
      scoredQuestionIds: [],
    },
  });
}

function validateConfig(config: MemoryOnlyLessonHostConfig): void {
  if (!validId(config.releaseId) ||
    !Array.isArray(config.releaseMemberIds) ||
    config.releaseMemberIds.length < 1 ||
    config.releaseMemberIds.some((id) => !validId(id)) ||
    new Set(config.releaseMemberIds).size !== config.releaseMemberIds.length ||
    !config.releaseMemberIds.includes(config.currentAnimationId) ||
    (config.initialLanguage !== undefined && config.initialLanguage !== 'en' && config.initialLanguage !== 'es') ||
    (config.mode !== undefined && config.mode !== 'audit' && config.mode !== 'published') ||
    (config.enabledCapabilities ?? []).some((capability) => !capabilitySet.has(capability))) {
    throw new TypeError('Invalid memory-only lesson host configuration');
  }
}

/**
 * Creates an intentionally ephemeral lesson host. It has no browser storage,
 * SharedObject, fetch, navigation, reporting, or filesystem effects. Dispatch
 * returns typed intents/state only; product adapters must separately execute
 * reviewed modern behavior.
 */
export function createMemoryOnlyLessonHost(config: MemoryOnlyLessonHostConfig): MemoryOnlyLessonHost {
  validateConfig(config);
  const members = new Set(config.releaseMemberIds);
  const enabled = new Set(config.enabledCapabilities ?? []);
  const mode = config.mode ?? 'audit';
  const releasePublished = config.releasePublished === true;
  const contract: LessonHostCapabilityDescriptor = Object.freeze({
    capabilities: Object.freeze([...enabled]),
    legacyOperations: 'blocked',
    auditStorage: 'memory-only',
    storesPersonalData: false,
  });
  const initial = initialState(config);
  let state = initial;

  const blocked = (
    code: LessonHostBlockedDecision['code'],
    reason: string,
  ): LessonHostBlockedDecision => Object.freeze({
    status: 'blocked',
    code,
    reason,
    state,
  });
  const allowed = (capability: LessonHostCapability): LessonHostAllowedDecision => Object.freeze({
    status: 'allowed',
    capability,
    auditOnly: mode === 'audit',
    state,
  });

  return Object.freeze({
    contract,
    mode,
    releasePublished,
    dispatch(request: unknown): LessonHostDecision {
      if (!isRecord(request) || typeof request.type !== 'string') {
        return blocked('invalid-request', 'Lesson host requests must use a known typed action.');
      }
      if (request.type === 'legacy') {
        const operation = request.operation;
        return typeof operation === 'string' && legacyOperationSet.has(operation)
          ? blocked('legacy-operation-blocked', `${operation} is blocked; legacy endpoints are never executed.`)
          : blocked('invalid-request', 'Unknown legacy host operation.');
      }
      const capability = capabilityForRequest(request.type);
      if (!capability) return blocked('invalid-request', 'Unknown lesson host action.');
      if (!enabled.has(capability)) {
        return blocked('capability-not-enabled', `${capability} was not explicitly enabled for this module.`);
      }
      if (mode === 'published' && !releasePublished) {
        return blocked('release-not-published', 'The atomic lesson release is not published.');
      }

      if (request.type === 'navigate') {
        if (!validId(request.targetAnimationId) || !members.has(request.targetAnimationId)) {
          return blocked('navigation-target-not-admitted', 'Navigation targets must be exact members of this lesson release.');
        }
        state = freezeState({...state, currentAnimationId: request.targetAnimationId});
      } else if (request.type === 'set-language') {
        if (request.language !== 'en' && request.language !== 'es') {
          return blocked('invalid-request', 'Only source-supported en/es language identities are accepted.');
        }
        state = freezeState({...state, language: request.language});
      } else if (request.type === 'open-glossary') {
        if (!validId(request.entryId)) return blocked('invalid-request', 'Glossary entryId is invalid.');
        state = freezeState({...state, glossaryEntryId: request.entryId});
      } else if (request.type === 'close-glossary') {
        state = freezeState({...state, glossaryEntryId: null});
      } else if (request.type === 'open-keyterm') {
        if (!validId(request.entryId)) return blocked('invalid-request', 'Keyterm entryId is invalid.');
        if (request.playbackDisposition !== undefined &&
          (typeof request.playbackDisposition !== 'string' ||
            !keytermPlaybackDispositionSet.has(request.playbackDisposition))) {
          return blocked('invalid-request', 'Keyterm playbackDisposition is invalid.');
        }
        if (request.sourceAnimationId !== undefined &&
          (!validId(request.sourceAnimationId) || request.sourceAnimationId !== state.currentAnimationId)) {
          return blocked('invalid-request', 'Keyterm sourceAnimationId must match the active animation.');
        }
        state = freezeState({...state, keytermEntryId: request.entryId});
      } else if (request.type === 'close-keyterm') {
        state = freezeState({...state, keytermEntryId: null});
      } else if (request.type === 'open-calculator') {
        state = freezeState({...state, calculatorOpen: true});
      } else if (request.type === 'close-calculator') {
        state = freezeState({...state, calculatorOpen: false});
      } else if (request.type === 'play-audio') {
        if (!validId(request.cueId)) return blocked('invalid-request', 'Audio cueId is invalid.');
        state = freezeState({...state, activeAudioCueId: request.cueId});
      } else if (request.type === 'stop-audio') {
        if (request.cueId !== undefined &&
          (!validId(request.cueId) || request.cueId !== state.activeAudioCueId)) {
          return blocked('invalid-request', 'Audio stop must address the active cue.');
        }
        state = freezeState({...state, activeAudioCueId: null});
      } else if (request.type === 'record-fq-score') {
        const pointsAwarded = request.pointsAwarded;
        const pointsPossible = request.pointsPossible;
        if (!validId(request.questionId) ||
          typeof request.correct !== 'boolean' ||
          typeof pointsAwarded !== 'number' ||
          typeof pointsPossible !== 'number' ||
          !Number.isSafeInteger(pointsAwarded) ||
          !Number.isSafeInteger(pointsPossible) ||
          pointsAwarded < 0 ||
          pointsPossible < 1 ||
          pointsAwarded > pointsPossible) {
          return blocked('invalid-request', 'FQ score input must be aggregate, bounded, and contain no raw answer.');
        }
        if (state.fqScore.scoredQuestionIds.includes(request.questionId)) {
          return blocked('duplicate-question-score', 'A question may be scored only once before an explicit reset.');
        }
        state = freezeState({
          ...state,
          fqScore: {
            attempted: state.fqScore.attempted + 1,
            correct: state.fqScore.correct + (request.correct ? 1 : 0),
            pointsAwarded: state.fqScore.pointsAwarded + pointsAwarded,
            pointsPossible: state.fqScore.pointsPossible + pointsPossible,
            scoredQuestionIds: [...state.fqScore.scoredQuestionIds, request.questionId],
          },
        });
      } else if (request.type === 'reset-fq-score') {
        state = freezeState({
          ...state,
          fqScore: {
            attempted: 0,
            correct: 0,
            pointsAwarded: 0,
            pointsPossible: 0,
            scoredQuestionIds: [],
          },
        });
      }
      return allowed(capability);
    },
    snapshot(): LessonHostState {
      return state;
    },
    reset(): LessonHostState {
      state = initial;
      return state;
    },
  });
}
