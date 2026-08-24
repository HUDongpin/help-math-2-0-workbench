import type {LearningEventV2Client} from './schemas';
import type {
  LearningAssignmentLaunch,
  LearningAssignmentObject,
  RecordAssignmentLearningEventsV2Action,
} from './learning-events-v2-contract';

export type FamilyLearningEventV2Type = Exclude<
  LearningEventV2Client['eventType'],
  'practice_evaluated'
>;

export type FamilyLearningEventV2RecorderStatus =
  | 'disabled'
  | 'idle'
  | 'syncing'
  | 'unsynced';

export interface FamilyLearningEventV2RecorderState {
  pendingCount: number;
  status: FamilyLearningEventV2RecorderStatus;
}

export interface FamilyLearningEventV2RecordInput {
  animationId?: string;
  eventType: FamilyLearningEventV2Type;
  placementId?: string;
}

export interface FamilyLearningEventV2Recorder {
  flush(): Promise<boolean>;
  record(input: FamilyLearningEventV2RecordInput): boolean;
  resetActiveDurationClock(): void;
  snapshot(): FamilyLearningEventV2RecorderState;
  subscribe(listener: () => void): () => void;
}

interface RecorderDependencies {
  monotonicNow(): number;
  now(): number;
  onStateChange?(state: FamilyLearningEventV2RecorderState): void;
  randomUUID(): string;
  send: RecordAssignmentLearningEventsV2Action;
}

const MAX_PENDING_EVENTS = 50;
const CLIENT_VERSION = 'help-math-family-browser-v2';

function findObject(
  launch: LearningAssignmentLaunch,
  input: FamilyLearningEventV2RecordInput,
): LearningAssignmentObject | null {
  if (input.placementId) {
    return launch.objects.find(({placementId}) => (
      placementId === input.placementId
    )) ?? null;
  }
  if (!input.animationId) return null;
  const matches = launch.objects.filter(({animationId}) => (
    animationId === input.animationId
  ));
  // Repeated animation binaries require an explicit placement identity.
  return matches.length === 1 ? matches[0]! : null;
}

export function createFamilyLearningEventV2Recorder(
  launch: LearningAssignmentLaunch | null,
  locale: 'en' | 'es',
  dependencies: RecorderDependencies,
): FamilyLearningEventV2Recorder {
  const queue: LearningEventV2Client[] = [];
  const listeners = new Set<() => void>();
  const placementVisitAttempts = new Map<string, number>();
  let state: FamilyLearningEventV2RecorderState = launch
    ? {pendingCount: 0, status: 'idle'}
    : {pendingCount: 0, status: 'disabled'};
  let flushPromise: Promise<boolean> | null = null;
  let lastMonotonicAt: number | null = null;
  let sessionId: string | null = null;

  const publish = (status: FamilyLearningEventV2RecorderStatus) => {
    state = {pendingCount: queue.length, status};
    dependencies.onStateChange?.(state);
    for (const listener of listeners) listener();
  };

  const flush = async (): Promise<boolean> => {
    if (!launch) return false;
    if (flushPromise) return flushPromise;
    flushPromise = (async () => {
      while (queue.length > 0) {
        const batch = queue.slice(0, MAX_PENDING_EVENTS);
        publish('syncing');
        let result;
        try {
          result = await dependencies.send({events: batch});
        } catch {
          publish('unsynced');
          return false;
        }
        if (!result.ok) {
          publish('unsynced');
          return false;
        }
        queue.splice(0, batch.length);
      }
      publish('idle');
      return true;
    })().finally(() => {
      flushPromise = null;
    });
    return flushPromise;
  };

  const record = (input: FamilyLearningEventV2RecordInput): boolean => {
    if (!launch || queue.length >= MAX_PENDING_EVENTS) {
      if (launch) publish('unsynced');
      return false;
    }
    const object = findObject(launch, input);
    if (!object) {
      publish('unsynced');
      return false;
    }

    const monotonicAt = dependencies.monotonicNow();
    const activeDurationMs = lastMonotonicAt === null
      ? 0
      : Math.min(
        14_400_000,
        Math.max(0, Math.round(monotonicAt - lastMonotonicAt)),
      );
    lastMonotonicAt = monotonicAt;
    sessionId ??= dependencies.randomUUID();
    const eventId = dependencies.randomUUID();
    const clientMutationId = `family.learning.v2.${dependencies.randomUUID()}`;
    const idempotencyKey = `family.learning.v2.${dependencies.randomUUID()}`;
    const previousAttempt = placementVisitAttempts.get(object.placementId) ?? 0;
    const attemptNumber = input.eventType === 'page_visited'
      ? Math.min(10_000, previousAttempt + 1)
      : Math.max(1, previousAttempt);
    if (input.eventType === 'page_visited') {
      placementVisitAttempts.set(object.placementId, attemptNumber);
    }
    queue.push({
      activeDurationMs,
      assignmentId: launch.assignmentId,
      attemptNumber,
      clientMutationId,
      clientVersion: CLIENT_VERSION,
      contentReleaseId: object.contentReleaseId,
      eventId,
      eventType: input.eventType,
      idempotencyKey,
      learningObjectVersionId: object.learningObjectVersionId,
      lessonReleaseId: launch.lessonReleaseId,
      locale,
      occurredAt: new Date(dependencies.now()).toISOString(),
      outcome: input.eventType === 'page_reviewed' ? 'completed' : 'none',
      sessionId,
      skillId: object.skillId,
    });
    publish(state.status === 'syncing' ? 'syncing' : 'idle');
    void flush();
    return true;
  };

  return {
    flush,
    record,
    resetActiveDurationClock: () => {
      lastMonotonicAt = dependencies.monotonicNow();
    },
    snapshot: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
