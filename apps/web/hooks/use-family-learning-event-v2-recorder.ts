'use client';

import {useCallback, useEffect, useMemo, useSyncExternalStore} from 'react';

import {
  createFamilyLearningEventV2Recorder,
  type FamilyLearningEventV2RecordInput,
} from '@/lib/family/learning-event-v2-recorder';
import type {
  LearningAssignmentLaunch,
  RecordAssignmentLearningEventsV2Action,
} from '@/lib/family/learning-events-v2-contract';

const disabledSend: RecordAssignmentLearningEventsV2Action = async () => ({
  error: 'FEATURE_DISABLED',
  ok: false,
});

function browserMonotonicNow() {
  return performance.now();
}

function browserNow() {
  return Date.now();
}

function browserRandomUUID() {
  return crypto.randomUUID();
}

export function useFamilyLearningEventV2Recorder({
  action,
  launch,
  locale,
}: {
  action?: RecordAssignmentLearningEventsV2Action;
  launch?: LearningAssignmentLaunch;
  locale: 'en' | 'es';
}) {
  const recorder = useMemo(() => createFamilyLearningEventV2Recorder(
    launch && action ? launch : null,
    locale,
    {
      monotonicNow: browserMonotonicNow,
      now: browserNow,
      randomUUID: browserRandomUUID,
      send: action ?? disabledSend,
    },
  ), [action, launch, locale]);
  const state = useSyncExternalStore(
    recorder.subscribe,
    recorder.snapshot,
    recorder.snapshot,
  );

  useEffect(() => {
    const resetActiveDurationClock = () => {
      recorder.resetActiveDurationClock();
    };
    resetActiveDurationClock();
    document.addEventListener('visibilitychange', resetActiveDurationClock);
    window.addEventListener('pagehide', resetActiveDurationClock);
    window.addEventListener('pageshow', resetActiveDurationClock);
    return () => {
      document.removeEventListener('visibilitychange', resetActiveDurationClock);
      window.removeEventListener('pagehide', resetActiveDurationClock);
      window.removeEventListener('pageshow', resetActiveDurationClock);
    };
  }, [recorder]);

  return {
    flush: useCallback(() => recorder.flush(), [recorder]),
    pendingCount: state.pendingCount,
    record: useCallback((input: FamilyLearningEventV2RecordInput) => (
      recorder.record(input)
    ), [recorder]),
    status: state.status,
  };
}
