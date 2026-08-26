'use client';

import {useCallback, useEffect, useRef, useState} from 'react';

import {
  installLearningEventOnlineRetry,
  loadLearningEventOutbox,
  queueLearningEvent,
  readyLearningEvents,
  settleLearningEventOutbox,
  type LearningEventDeliveryOutcome,
} from '@/lib/learning-event-outbox';
import {
  G4_L3_LESSON,
} from '@/lib/g4-l3-lesson-navigation';
import {
  learningEventSchema,
  type HelpMathLearningEvent,
} from '@/lib/learning-event-schema';
import type {NovaTutorMode} from '@/lib/tutor-integration';
import type {WholeLessonHostPresentation} from '@/lib/whole-lesson-host-presentation';

const SESSION_STORAGE_KEY = 'helpmath:learning-event-session:g4-l3:v1';
const SEQUENCE_STORAGE_KEY = 'helpmath:learning-event-sequence:g4-l3:v1';
const FLUSH_INTERVAL_MS = 15_000;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export type LearningEventRecorderStatus =
  | 'disabled'
  | 'idle'
  | 'queued'
  | 'syncing'
  | 'synced'
  | 'offline'
  | 'error';

export type LearningEventRecordInput = Readonly<{
  type: HelpMathLearningEvent['type'];
  page?: HelpMathLearningEvent['page'];
  progress?: HelpMathLearningEvent['progress'];
  support?: HelpMathLearningEvent['support'];
  evaluation?: HelpMathLearningEvent['evaluation'];
}>;

export interface LearningEventRecorderContext {
  readonly locale: 'en' | 'es';
  readonly presentation: WholeLessonHostPresentation;
  readonly mode: NovaTutorMode;
}

interface LearningEventIdentity {
  readonly eventId: string;
  readonly sessionId: string;
  readonly sequence: number;
  readonly occurredAt: string;
}

function browserUuid(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  if (typeof globalThis.crypto?.getRandomValues !== 'function') {
    throw new Error('Secure browser UUID generation is unavailable.');
  }
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const value = [...bytes].map((byte) => byte.toString(16).padStart(2, '0'));
  return [
    value.slice(0, 4).join(''),
    value.slice(4, 6).join(''),
    value.slice(6, 8).join(''),
    value.slice(8, 10).join(''),
    value.slice(10, 16).join(''),
  ].join('-');
}

/**
 * Builds the privacy-closed event before it reaches localStorage or the
 * network. The caller cannot add a learner identity or free text; the server
 * derives the anonymous xAPI Actor from an HttpOnly cookie.
 */
export function createHelpMathLearningEvent(
  context: LearningEventRecorderContext,
  input: LearningEventRecordInput,
  identity: LearningEventIdentity,
): HelpMathLearningEvent {
  return learningEventSchema.parse({
    schemaVersion: 1,
    eventId: identity.eventId,
    sessionId: identity.sessionId,
    sequence: identity.sequence,
    occurredAt: identity.occurredAt,
    type: input.type,
    releaseId: G4_L3_LESSON.releaseId,
    locale: context.locale,
    presentation: context.presentation,
    mode: context.mode,
    ...(input.page ? {page: input.page} : {}),
    ...(input.progress ? {progress: input.progress} : {}),
    ...(input.support ? {support: input.support} : {}),
    ...(input.evaluation ? {evaluation: input.evaluation} : {}),
  });
}

function fallbackDeliveryStatus(status: number) {
  return status < 400 || status === 408 || status === 425 ||
      status === 429 || status >= 500
    ? 'retryable' as const
    : 'rejected' as const;
}

/** Convert a potentially partial API response into one explicit outcome per event. */
export function learningEventDeliveryOutcomes(
  eventIds: readonly string[],
  status: number,
  value: unknown,
): readonly LearningEventDeliveryOutcome[] {
  const fallback = fallbackDeliveryStatus(status);
  const byId = new Map<string, LearningEventDeliveryOutcome>();
  if (value !== null && typeof value === 'object') {
    const results = (value as {results?: unknown}).results;
    if (Array.isArray(results)) {
      for (const item of results) {
        if (item === null || typeof item !== 'object') continue;
        const candidate = item as Record<string, unknown>;
        if (
          typeof candidate.eventId !== 'string' ||
          !eventIds.includes(candidate.eventId) ||
          !['stored', 'already-stored', 'retryable', 'rejected']
            .includes(String(candidate.status))
        ) continue;
        const outcome: LearningEventDeliveryOutcome = {
          eventId: candidate.eventId,
          status: candidate.status as LearningEventDeliveryOutcome['status'],
          ...(typeof candidate.retryAfterMs === 'number' &&
              Number.isFinite(candidate.retryAfterMs) &&
              candidate.retryAfterMs >= 0
            ? {retryAfterMs: Math.round(candidate.retryAfterMs)}
            : {}),
        };
        byId.set(outcome.eventId, outcome);
      }
    }
  }
  return eventIds.map((eventId) => byId.get(eventId) ?? {eventId, status: fallback});
}

function safeSessionValue(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function setSafeSessionValue(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // A memory-only session still records functional events in this page.
  }
}

function browserIsOffline(): boolean {
  return navigator.onLine === false;
}

export function useLearningEventRecorder({
  enabled,
  locale,
  mode,
  presentation,
}: LearningEventRecorderContext & {readonly enabled: boolean}) {
  const [status, setStatus] = useState<LearningEventRecorderStatus>(
    enabled ? 'idle' : 'disabled',
  );
  const [pendingCount, setPendingCount] = useState(0);
  const sessionIdRef = useRef<string | null>(null);
  const sequenceRef = useRef<number | null>(null);
  const flushingRef = useRef(false);
  const mountedRef = useRef(true);
  const flushRef = useRef<(options?: {keepalive?: boolean}) => Promise<void>>(
    async () => {},
  );

  const refreshPendingCount = useCallback(() => {
    try {
      const next = loadLearningEventOutbox(window.localStorage);
      if (mountedRef.current) setPendingCount(next.length);
      return next;
    } catch {
      if (mountedRef.current) {
        setPendingCount(0);
        setStatus('error');
      }
      return [];
    }
  }, []);

  const flush = useCallback(async (options: {keepalive?: boolean} = {}) => {
    if (!enabled || flushingRef.current || typeof window === 'undefined') return;
    if (browserIsOffline()) {
      if (mountedRef.current) setStatus('offline');
      refreshPendingCount();
      return;
    }

    flushingRef.current = true;
    if (mountedRef.current) setStatus('syncing');
    try {
      for (;;) {
        let records;
        try {
          records = loadLearningEventOutbox(window.localStorage);
        } catch {
          if (mountedRef.current) setStatus('error');
          return;
        }
        const ready = readyLearningEvents(records, Date.now());
        if (ready.length === 0) {
          if (mountedRef.current) {
            setPendingCount(records.length);
            setStatus(records.length === 0 ? 'synced' : 'queued');
          }
          return;
        }

        const eventIds = ready.map((record) => record.event.eventId);
        let outcomes: readonly LearningEventDeliveryOutcome[];
        try {
          const response = await fetch('/api/learning-events', {
            method: 'POST',
            headers: {
              accept: 'application/json',
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              schemaVersion: 1,
              events: ready.map((record) => record.event),
            }),
            cache: 'no-store',
            credentials: 'same-origin',
            keepalive: options.keepalive === true,
          });
          let value: unknown = null;
          try {
            value = await response.json() as unknown;
          } catch {
            // A missing/malformed acknowledgement is retryable unless the
            // server returned an explicit permanent request failure.
          }
          outcomes = learningEventDeliveryOutcomes(eventIds, response.status, value);
        } catch {
          outcomes = eventIds.map((eventId) => ({eventId, status: 'retryable'}));
        }

        let remaining;
        try {
          remaining = settleLearningEventOutbox(
            window.localStorage,
            outcomes,
          );
        } catch {
          if (mountedRef.current) setStatus('error');
          return;
        }
        if (mountedRef.current) setPendingCount(remaining.length);

        const retryable = outcomes.some((outcome) => outcome.status === 'retryable');
        const rejected = outcomes.some((outcome) => outcome.status === 'rejected');
        if (rejected) {
          // Rejected records are removed to avoid an infinite retry loop, but
          // a permanent delivery failure must never be presented as synced.
          if (mountedRef.current) setStatus('error');
          return;
        }
        if (retryable || options.keepalive) {
          if (mountedRef.current) {
            setStatus(browserIsOffline() ? 'offline' : 'queued');
          }
          return;
        }
      }
    } finally {
      flushingRef.current = false;
    }
  }, [enabled, refreshPendingCount]);

  const record = useCallback((input: LearningEventRecordInput) => {
    if (!enabled || typeof window === 'undefined') return null;
    try {
      if (!sessionIdRef.current) {
        const stored = safeSessionValue(SESSION_STORAGE_KEY);
        sessionIdRef.current = stored && UUID_PATTERN.test(stored)
          ? stored
          : browserUuid();
        setSafeSessionValue(SESSION_STORAGE_KEY, sessionIdRef.current);
      }
      if (sequenceRef.current === null) {
        const stored = Number(safeSessionValue(SEQUENCE_STORAGE_KEY));
        sequenceRef.current = Number.isInteger(stored) && stored >= 0
          ? Math.min(stored, 999_999)
          : -1;
      }
      sequenceRef.current += 1;
      setSafeSessionValue(SEQUENCE_STORAGE_KEY, String(sequenceRef.current));

      const event = createHelpMathLearningEvent({locale, mode, presentation}, input, {
        eventId: browserUuid(),
        sessionId: sessionIdRef.current,
        sequence: sequenceRef.current,
        occurredAt: new Date().toISOString(),
      });
      const records = queueLearningEvent(window.localStorage, event);
      if (mountedRef.current) {
        setPendingCount(records.length);
        setStatus(browserIsOffline() ? 'offline' : 'queued');
      }
      queueMicrotask(() => void flushRef.current());
      return event.eventId;
    } catch {
      if (mountedRef.current) setStatus('error');
      return null;
    }
  }, [enabled, locale, mode, presentation]);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) {
      return () => {
        mountedRef.current = false;
      };
    }
    const removeOnlineRetry = installLearningEventOnlineRetry(window, flush);
    const interval = window.setInterval(() => void flush(), FLUSH_INTERVAL_MS);
    const initialFlush = window.setTimeout(() => void flush(), 0);
    return () => {
      mountedRef.current = false;
      removeOnlineRetry();
      window.clearTimeout(initialFlush);
      window.clearInterval(interval);
    };
  }, [enabled, flush, refreshPendingCount]);

  return {flush, pendingCount, record, status} as const;
}
