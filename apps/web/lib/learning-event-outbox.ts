import {
  MAX_LEARNING_EVENT_BATCH_SIZE,
  learningEventSchema,
  type HelpMathLearningEvent,
} from './learning-event-schema';

export const LEARNING_EVENT_OUTBOX_STORAGE_KEY = 'helpmath:learning-event-outbox:v1';
export const MAX_LEARNING_EVENT_OUTBOX_RECORDS = 200;
export const LEARNING_EVENT_OUTBOX_RETENTION_MS = 7 * 24 * 60 * 60 * 1_000;
const MAX_BACKOFF_MS = 5 * 60 * 1_000;

export interface LearningEventOutboxRecord {
  readonly event: HelpMathLearningEvent;
  readonly createdAtMs: number;
  readonly attempts: number;
  readonly nextAttemptAtMs: number;
}

export interface LearningEventStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type LearningEventDeliveryOutcome = Readonly<{
  eventId: string;
  status: 'stored' | 'already-stored' | 'retryable' | 'rejected';
  retryAfterMs?: number;
}>;

interface StoredOutbox {
  version: 1;
  records: LearningEventOutboxRecord[];
}

function isFiniteInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value);
}

function validRecord(value: unknown, nowMs: number): LearningEventOutboxRecord | null {
  if (value === null || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  const parsedEvent = learningEventSchema.safeParse(candidate.event);
  if (!parsedEvent.success) return null;
  if (
    !isFiniteInteger(candidate.createdAtMs) ||
    !isFiniteInteger(candidate.attempts) ||
    !isFiniteInteger(candidate.nextAttemptAtMs) ||
    candidate.attempts < 0 ||
    candidate.attempts > 1_000 ||
    candidate.createdAtMs > nowMs + 5 * 60_000 ||
    nowMs - candidate.createdAtMs > LEARNING_EVENT_OUTBOX_RETENTION_MS
  ) {
    return null;
  }
  return {
    event: parsedEvent.data,
    createdAtMs: candidate.createdAtMs,
    attempts: candidate.attempts,
    nextAttemptAtMs: candidate.nextAttemptAtMs,
  };
}

export function parseLearningEventOutbox(
  raw: string | null,
  nowMs: number,
): readonly LearningEventOutboxRecord[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Partial<StoredOutbox>;
    if (parsed.version !== 1 || !Array.isArray(parsed.records)) return [];
    const records: LearningEventOutboxRecord[] = [];
    const seen = new Set<string>();
    for (const candidate of parsed.records) {
      const record = validRecord(candidate, nowMs);
      if (!record || seen.has(record.event.eventId)) continue;
      seen.add(record.event.eventId);
      records.push(record);
    }
    return records.slice(-MAX_LEARNING_EVENT_OUTBOX_RECORDS);
  } catch {
    return [];
  }
}

export function serializeLearningEventOutbox(
  records: readonly LearningEventOutboxRecord[],
): string {
  const stored: StoredOutbox = {version: 1, records: [...records]};
  return JSON.stringify(stored);
}

export function enqueueLearningEvent(
  records: readonly LearningEventOutboxRecord[],
  event: HelpMathLearningEvent,
  nowMs: number,
): readonly LearningEventOutboxRecord[] {
  const parsed = learningEventSchema.parse(event);
  if (records.some((record) => record.event.eventId === parsed.eventId)) return records;
  return [
    ...records,
    {event: parsed, createdAtMs: nowMs, attempts: 0, nextAttemptAtMs: nowMs},
  ].slice(-MAX_LEARNING_EVENT_OUTBOX_RECORDS);
}

export function acknowledgeLearningEvents(
  records: readonly LearningEventOutboxRecord[],
  eventIds: ReadonlySet<string>,
): readonly LearningEventOutboxRecord[] {
  return records.filter((record) => !eventIds.has(record.event.eventId));
}

export function readyLearningEvents(
  records: readonly LearningEventOutboxRecord[],
  nowMs: number,
): readonly LearningEventOutboxRecord[] {
  return records
    .filter((record) => record.nextAttemptAtMs <= nowMs)
    .slice(0, MAX_LEARNING_EVENT_BATCH_SIZE);
}

export function learningEventRetryDelayMs(
  attempts: number,
  random: () => number = Math.random,
): number {
  const base = Math.min(1_000 * (2 ** Math.min(attempts, 8)), MAX_BACKOFF_MS);
  const jitter = Math.max(0, Math.min(1, random())) * Math.min(base * 0.25, 5_000);
  return Math.round(Math.min(base + jitter, MAX_BACKOFF_MS));
}

export function applyLearningEventDeliveryOutcomes(
  records: readonly LearningEventOutboxRecord[],
  outcomes: readonly LearningEventDeliveryOutcome[],
  nowMs: number,
  random: () => number = Math.random,
): readonly LearningEventOutboxRecord[] {
  const outcomeById = new Map(outcomes.map((outcome) => [outcome.eventId, outcome]));
  const next: LearningEventOutboxRecord[] = [];
  for (const record of records) {
    const outcome = outcomeById.get(record.event.eventId);
    if (!outcome) {
      next.push(record);
      continue;
    }
    if (
      outcome.status === 'stored' ||
      outcome.status === 'already-stored' ||
      outcome.status === 'rejected'
    ) {
      continue;
    }
    const attempts = record.attempts + 1;
    const delay = Math.max(
      outcome.retryAfterMs ?? 0,
      learningEventRetryDelayMs(attempts, random),
    );
    next.push({...record, attempts, nextAttemptAtMs: nowMs + delay});
  }
  return next;
}

function saveOutbox(
  storage: LearningEventStorage,
  records: readonly LearningEventOutboxRecord[],
): void {
  if (records.length === 0) {
    storage.removeItem(LEARNING_EVENT_OUTBOX_STORAGE_KEY);
    return;
  }
  storage.setItem(
    LEARNING_EVENT_OUTBOX_STORAGE_KEY,
    serializeLearningEventOutbox(records),
  );
}

export function loadLearningEventOutbox(
  storage: LearningEventStorage,
  nowMs: number = Date.now(),
): readonly LearningEventOutboxRecord[] {
  const records = parseLearningEventOutbox(
    storage.getItem(LEARNING_EVENT_OUTBOX_STORAGE_KEY),
    nowMs,
  );
  saveOutbox(storage, records);
  return records;
}

export function queueLearningEvent(
  storage: LearningEventStorage,
  event: HelpMathLearningEvent,
  nowMs: number = Date.now(),
): readonly LearningEventOutboxRecord[] {
  const records = enqueueLearningEvent(loadLearningEventOutbox(storage, nowMs), event, nowMs);
  saveOutbox(storage, records);
  return records;
}

export function settleLearningEventOutbox(
  storage: LearningEventStorage,
  outcomes: readonly LearningEventDeliveryOutcome[],
  nowMs: number = Date.now(),
  random: () => number = Math.random,
): readonly LearningEventOutboxRecord[] {
  const records = applyLearningEventDeliveryOutcomes(
    loadLearningEventOutbox(storage, nowMs),
    outcomes,
    nowMs,
    random,
  );
  saveOutbox(storage, records);
  return records;
}

export interface LearningEventOnlineTarget {
  addEventListener(type: 'online', listener: () => void): void;
  removeEventListener(type: 'online', listener: () => void): void;
}

/** Installs a dependency-injected online hook without importing browser globals. */
export function installLearningEventOnlineRetry(
  target: LearningEventOnlineTarget,
  flush: () => void | Promise<void>,
): () => void {
  let active = true;
  const listener = () => {
    if (active) void flush();
  };
  target.addEventListener('online', listener);
  return () => {
    active = false;
    target.removeEventListener('online', listener);
  };
}
