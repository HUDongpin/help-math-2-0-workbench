import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {createFamilyLearningEventV2Recorder} from
  '../lib/family/learning-event-v2-recorder';
import {
  FAMILY_LEARNING_EVENTS_V2_PRODUCTION_RELEASE_BINDINGS,
  type LearningAssignmentLaunch,
  learningAssignmentLaunchDtoSchema,
  learningAssignmentLaunchMatchesCourse,
  parseLearningAssignmentLaunchEnvelope,
  parseLearningEventV2ReceiptEnvelope,
  publishedReleasesMissingFamilyLearningEventsV2Binding,
} from '../lib/family/learning-events-v2-contract';

const tenantId = '10000000-0000-4000-8000-000000000001';

function launch(): LearningAssignmentLaunch {
  return {
    assignmentId: '10000000-0000-4000-8000-000000000503',
    lessonHref: '/courses/4/3',
    lessonReleaseId: 'lesson-g04-l03-negative-numbers',
    objects: [
      {
        animationId: 'course-g04-l03-ir-001-341242cc',
        contentReleaseId: 'synthetic-g04-l03-browser-v2',
        learningObjectVersionId: 'g04-l03-placement-001-v1',
        pageOrdinal: 1,
        placementId: 'course-g04-l03-ir-001-341242cc',
        skillId: null,
      },
      {
        animationId: 'course-g04-l03-rw-002',
        contentReleaseId: 'synthetic-g04-l03-browser-v2',
        learningObjectVersionId: 'g04-l03-placement-002-v1',
        pageOrdinal: 2,
        placementId: 'course-g04-l03-rw-002',
        skillId: null,
      },
    ],
    totalPages: 2,
  };
}

function uuidSequence() {
  let value = 1;
  return () => `90000000-0000-4000-8000-${String(value++).padStart(12, '0')}`;
}

test('assignment launch envelope strips and cross-checks its server-only tenant', () => {
  const envelope = parseLearningAssignmentLaunchEnvelope({
    tenantId,
    ...launch(),
  }, tenantId);
  assert.equal(envelope.ok, true);
  if (envelope.ok) {
    assert.deepEqual(envelope.data, launch());
    assert.equal(Object.hasOwn(envelope.data, 'tenantId'), false);
  }
  assert.deepEqual(parseLearningAssignmentLaunchEnvelope({
    tenantId,
    ...launch(),
  }, '20000000-0000-4000-8000-000000000001'), {
    ok: false,
    reason: 'tenant-mismatch',
  });
  assert.deepEqual(parseLearningAssignmentLaunchEnvelope({
    tenantId,
    ...launch(),
    studentId: '10000000-0000-4000-8000-000000000020',
  }, tenantId), {ok: false, reason: 'invalid'});
});

test('assignment launch DTO is strict, contiguous, and placement unique', () => {
  assert.equal(learningAssignmentLaunchDtoSchema.safeParse(launch()).success, true);
  assert.equal(learningAssignmentLaunchDtoSchema.safeParse({
    ...launch(),
    tenantId,
  }).success, false);
  assert.equal(learningAssignmentLaunchDtoSchema.safeParse({
    ...launch(),
    objects: launch().objects.map((object, index) => ({
      ...object,
      pageOrdinal: index + 2,
    })),
  }).success, false);
  assert.equal(learningAssignmentLaunchDtoSchema.safeParse({
    ...launch(),
    objects: [launch().objects[0], {
      ...launch().objects[1],
      placementId: launch().objects[0]!.placementId,
    }],
  }).success, false);
});

test('event receipt strips and cross-checks its server-only tenant', () => {
  assert.deepEqual(parseLearningEventV2ReceiptEnvelope({
    ignored: 0,
    inserted: 2,
    tenantId,
  }, tenantId), {data: {ignored: 0, inserted: 2}, ok: true});
  assert.deepEqual(parseLearningEventV2ReceiptEnvelope({
    ignored: 0,
    inserted: 2,
    tenantId,
  }, '20000000-0000-4000-8000-000000000001'), {
    ok: false,
    reason: 'tenant-mismatch',
  });
  assert.deepEqual(parseLearningEventV2ReceiptEnvelope({
    ignored: 0,
    inserted: 2,
    studentId: '10000000-0000-4000-8000-000000000020',
    tenantId,
  }, tenantId), {ok: false, reason: 'invalid'});
});

test('assignment launch cross-binds to the existing course placement order', () => {
  const course = {
    href: '/courses/4/3',
    pages: launch().objects.map((object) => ({
      animationId: object.animationId,
      globalPageOrdinal: object.pageOrdinal,
    })),
    releaseId: 'lesson-g04-l03-negative-numbers',
  } as const;
  assert.equal(learningAssignmentLaunchMatchesCourse(launch(), course), true);
  assert.equal(learningAssignmentLaunchMatchesCourse({
    ...launch(),
    lessonReleaseId: 'forged-release',
  }, course), false);
  assert.equal(learningAssignmentLaunchMatchesCourse({
    ...launch(),
    objects: [...launch().objects].reverse(),
  }, course), false);
});

test('every published Lesson release requires an explicit production V2 binding', async () => {
  const ledger = JSON.parse(await readFile(
    new URL('../../../catalog/lesson-release-ledger.json', import.meta.url),
    'utf8',
  )) as unknown;
  assert.equal(typeof ledger, 'object');
  assert.notEqual(ledger, null);
  const releases = (ledger as {releases?: unknown}).releases;
  assert.ok(Array.isArray(releases));
  const publishedReleaseIds = releases.flatMap((release) => {
    if (
      !release
      || typeof release !== 'object'
      || (release as {published?: unknown}).published !== true
    ) return [];
    const releaseId = (release as {releaseId?: unknown}).releaseId;
    if (typeof releaseId !== 'string' || releaseId.length === 0) {
      assert.fail('A published Lesson release must have a non-empty releaseId.');
    }
    return [releaseId];
  });
  assert.deepEqual(
    publishedReleasesMissingFamilyLearningEventsV2Binding(
      publishedReleaseIds,
    ),
    [],
  );
  assert.deepEqual(
    FAMILY_LEARNING_EVENTS_V2_PRODUCTION_RELEASE_BINDINGS,
    [],
  );
});

test('in-memory recorder increments per-placement attempts and never emits practice', async () => {
  const batches: unknown[][] = [];
  const randomUUID = uuidSequence();
  let monotonic = 0;
  const recorder = createFamilyLearningEventV2Recorder(launch(), 'en', {
    monotonicNow: () => (monotonic += 250),
    now: () => Date.parse('2026-08-23T12:00:00.000Z'),
    randomUUID,
    send: async (input) => {
      const events = (input as {events: unknown[]}).events;
      batches.push(events.map((event) => ({...(event as object)})));
      return {data: {ignored: 0, inserted: events.length}, ok: true};
    },
  });

  assert.equal(recorder.record({
    eventType: 'page_visited',
    placementId: 'course-g04-l03-ir-001-341242cc',
  }), true);
  assert.equal(await recorder.flush(), true);
  assert.equal(recorder.record({
    eventType: 'page_visited',
    placementId: 'course-g04-l03-ir-001-341242cc',
  }), true);
  assert.equal(await recorder.flush(), true);
  assert.equal(recorder.record({
    eventType: 'page_reviewed',
    placementId: 'course-g04-l03-ir-001-341242cc',
  }), true);
  assert.equal(await recorder.flush(), true);

  const events = batches.flat() as Array<{
    attemptNumber: number;
    eventType: string;
    outcome: string;
  }>;
  assert.deepEqual(events.map(({attemptNumber}) => attemptNumber), [1, 2, 2]);
  assert.deepEqual(events.map(({eventType}) => eventType), [
    'page_visited', 'page_visited', 'page_reviewed',
  ]);
  assert.equal(events.some(({eventType}) => eventType === 'practice_evaluated'), false);
  assert.equal(events[2]?.outcome, 'completed');
  assert.deepEqual(recorder.snapshot(), {pendingCount: 0, status: 'idle'});
});

test('repeated animation IDs require an explicit placement', async () => {
  const repeated = launch();
  repeated.objects[1] = {
    ...repeated.objects[1],
    animationId: repeated.objects[0]!.animationId,
  };
  const recorder = createFamilyLearningEventV2Recorder(repeated, 'en', {
    monotonicNow: () => 0,
    now: () => Date.parse('2026-08-23T12:00:00.000Z'),
    randomUUID: uuidSequence(),
    send: async () => ({data: {ignored: 0, inserted: 1}, ok: true}),
  });
  assert.equal(recorder.record({
    animationId: repeated.objects[0]!.animationId,
    eventType: 'page_visited',
  }), false);
  assert.equal(recorder.record({
    eventType: 'page_visited',
    placementId: repeated.objects[0]!.placementId,
  }), true);
  assert.equal(await recorder.flush(), true);
});

test('activity clock reset excludes a hidden-tab interval', async () => {
  const batches: unknown[][] = [];
  let monotonic = 100;
  const recorder = createFamilyLearningEventV2Recorder(launch(), 'en', {
    monotonicNow: () => monotonic,
    now: () => Date.parse('2026-08-23T12:00:00.000Z'),
    randomUUID: uuidSequence(),
    send: async (input) => {
      const events = (input as {events: unknown[]}).events;
      batches.push(events.map((event) => ({...(event as object)})));
      return {data: {ignored: 0, inserted: events.length}, ok: true};
    },
  });

  recorder.resetActiveDurationClock();
  monotonic = 250;
  assert.equal(recorder.record({
    eventType: 'page_visited',
    placementId: 'course-g04-l03-ir-001-341242cc',
  }), true);
  assert.equal(await recorder.flush(), true);
  monotonic = 100_000;
  recorder.resetActiveDurationClock();
  monotonic = 100_200;
  assert.equal(recorder.record({
    eventType: 'page_reviewed',
    placementId: 'course-g04-l03-ir-001-341242cc',
  }), true);
  assert.equal(await recorder.flush(), true);

  const durations = batches.flat().map((event) => (
    event as {activeDurationMs: number}
  ).activeDurationMs);
  assert.deepEqual(durations, [150, 200]);
});

test('Phase-1 app gate is exact, default-off, and production-disabled', () => {
  const result = spawnSync(process.execPath, [
    '--conditions=react-server',
    '--import', 'tsx',
    '--input-type=module',
    '--eval', String.raw`
      import assert from 'node:assert/strict';
      import {isFamilyLearningEventsV2Enabled} from
        './lib/family/learning-events-v2-feature.server.ts';
      assert.equal(isFamilyLearningEventsV2Enabled({}), false);
      assert.equal(isFamilyLearningEventsV2Enabled({
        FAMILY_LEARNING_EVENTS_V2_ENABLED: 'TRUE',
        FAMILY_PORTAL_ENABLED: 'true', NODE_ENV: 'development',
      }), false);
      assert.equal(isFamilyLearningEventsV2Enabled({
        FAMILY_LEARNING_EVENTS_V2_ENABLED: 'true',
        FAMILY_PORTAL_ENABLED: 'false', NODE_ENV: 'development',
      }), false);
      assert.equal(isFamilyLearningEventsV2Enabled({
        FAMILY_LEARNING_EVENTS_V2_ENABLED: 'true',
        FAMILY_PORTAL_ENABLED: 'true', NODE_ENV: 'production',
      }), false);
      assert.equal(isFamilyLearningEventsV2Enabled({
        FAMILY_LEARNING_EVENTS_V2_ENABLED: 'true',
        FAMILY_PORTAL_ENABLED: 'true', NODE_ENV: 'development',
      }), true);
    `,
  ], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8',
    env: {...process.env, NODE_ENV: 'test'},
    timeout: 20_000,
  });
  assert.equal(result.status, 0, [result.stdout, result.stderr].join('\n'));
});

test('the V2 recorder has no durable or legacy-recorder dependency', async () => {
  const sources = await Promise.all([
    readFile(new URL('../lib/family/learning-event-v2-recorder.ts', import.meta.url), 'utf8'),
    readFile(new URL('../hooks/use-family-learning-event-v2-recorder.ts', import.meta.url), 'utf8'),
  ]);
  for (const source of sources) {
    assert.doesNotMatch(source, /localStorage|sessionStorage/u);
    assert.doesNotMatch(source, /use-learning-event-recorder/u);
    assert.doesNotMatch(source, /eventType:\s*['"]practice_evaluated/u);
  }
  assert.match(sources[1]!, /visibilitychange/u);
  assert.match(sources[1]!, /pagehide/u);
  assert.match(sources[1]!, /pageshow/u);
  assert.match(sources[1]!, /resetActiveDurationClock/u);
});

test('G4 L3 keeps local progress separate from authorized assignment events', async () => {
  const source = await readFile(new URL(
    '../components/g4-l3-whole-lesson-player.tsx',
    import.meta.url,
  ), 'utf8');
  assert.match(
    source,
    /The visual progress bar is stored only on this device\.[\s\S]*saved local progress is not uploaded\./u,
  );
  assert.match(
    source,
    /The progress bar is stored in this browser, while pseudonymous events sync to the LRS when available\./u,
  );
  assert.match(
    source,
    /When available, pseudonymous events may also sync separately to the LRS\./u,
  );
  assert.match(
    source,
    /data-progress-storage=\{familyLearningEventsEnabled[\s\S]*'local-ui-plus-authorized-events'[\s\S]*'local-device-only'/u,
  );
});
