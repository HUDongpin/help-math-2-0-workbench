import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  animationModuleRegistration,
  loadAnimationModule,
} from '../src/animation-registry';
import {createMemoryOnlyLessonHost} from '../src/lesson-host-contract';
import {
  createG4L9P4InteractionState,
  expectedG4L9P4Option,
  reduceG4L9P4Interaction,
  type G4L9P4PageConfig,
} from '../src/g4-l9-p4-state-machines';

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));
const selectedIds = [
  'course-g04-l09-ir-001',
  'course-g04-l09-rw-002',
  'course-g04-l09-vb-009',
  'course-g04-l09-in-003',
  'course-g04-l09-in-009',
  'course-g04-l09-in-010',
  'course-g04-l09-in-011',
  'course-g04-l09-ti-002',
  'course-g04-l09-ti-003',
  'course-g04-l09-ti-005',
  'course-g04-l09-gs-002',
  'course-g04-l09-ts-008',
  'course-g04-l09-fq-001',
  'course-g04-l09-fq-002',
] as const;
const nonGsIds = selectedIds.filter((id) => id !== 'course-g04-l09-gs-002');

function digest(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

async function configFor(animationId: string): Promise<G4L9P4PageConfig> {
  const timeline = await import(`../src/timelines/${animationId}.ts`);
  const config = Object.values(timeline).find((value) =>
    value && typeof value === 'object' && 'animationId' in value
  );
  assert(config && typeof config === 'object');
  return config as G4L9P4PageConfig;
}

test('registers exactly the frozen 14 modules as private engineering Current-JS', async () => {
  for (const animationId of selectedIds) {
    assert.deepEqual(animationModuleRegistration(animationId), {
      maturity: 'private-current-js',
      scope: 'private-engineering',
      calibrationId: 'g4-l9-p4-representative-slice-14-v1',
    });
    const module = await loadAnimationModule(animationId);
    assert(module);
    assert.equal(module.key, animationId);
    assert.equal(module.maturity, 'private-current-js');
    assert.equal(module.lessonHost?.legacyOperations, 'blocked');
    assert.equal(module.lessonHost?.auditStorage, 'memory-only');
    assert.equal(module.lessonHost?.storesPersonalData, false);
  }
});

test('13 generated timelines preserve exact identities and the 5/8 factory/manual split', async () => {
  const freeze = JSON.parse(await readFile(
    `${repositoryRoot}catalog/g4-l9-p4-representative-slice-freeze-v1.json`,
    'utf8',
  ));
  assert.deepEqual(freeze.frozenOccurrences, [1,2,12,16,22,23,24,27,28,30,33,40,41,42]);
  assert.equal(freeze.placementHash, 'bfec777a4a43cafc72cf4be00bbe0b73e31a0549bb189c3b75a2c6a6aedaaecb');
  assert.equal(freeze.assetHash, '76f2d2b5143d49da55f96979de3f86a15ca9d0e28ad034d2302cde71f94891ee');
  assert.equal(freeze.canonicalIdentityProjectionHash, 'e15a6efc10f31897cf0a67e1d1776a43abf64feeb92a47c3917fc52bd837c3b5');
  const byId = new Map(freeze.selectedPages.map((page: {animationId: string}) => [page.animationId, page]));
  const configs = await Promise.all(nonGsIds.map(configFor));
  for (const config of configs) {
    const frozen = byId.get(config.animationId) as {
      sourceOccurrence: number;
      placementId: string;
      sourceSwfSha256: string;
      implementationLane: string;
    };
    assert(frozen);
    assert.equal(config.sourceOccurrence, frozen.sourceOccurrence);
    assert.equal(config.placementId, frozen.placementId);
    assert.equal(config.sourceSwfSha256, frozen.sourceSwfSha256);
    assert.equal(config.lane, frozen.implementationLane);
    assert.equal(config.legacyNetworkPolicy, 'deny-by-default');
  }
  assert.equal(configs.filter(({lane}) => lane === 'factory').length, 5);
  assert.equal(configs.filter(({lane}) => lane === 'advanced-manual').length, 8);
  assert.equal(configs.find(({sourceOccurrence}) => sourceOccurrence === 30)?.f08ScaleOut, false);
  assert.equal(freeze.scaleOut.familyF08, false);
  assert.equal(freeze.scaleOut.wholeLesson43Pages, false);
});

test('all 13 shared state machines answer, score, advance, and Replay with zero network calls', async () => {
  for (const animationId of nonGsIds) {
    const config = await configFor(animationId);
    let state = createG4L9P4InteractionState(config, 4092026);
    if (state.phase === 'intro') {
      state = reduceG4L9P4Interaction(config, state, {type: 'start'});
    }
    const expected = expectedG4L9P4Option(config, 0, state.seed);
    state = reduceG4L9P4Interaction(config, state, {type: 'answer', option: expected});
    assert.equal(state.feedback, 'correct', animationId);
    assert.equal(state.score, 1, animationId);
    state = reduceG4L9P4Interaction(config, state, {type: 'next'});
    assert.equal(state.networkCalls, 0, animationId);
    state = reduceG4L9P4Interaction(config, state, {type: 'legacy-intent'});
    assert.equal(state.blockedLegacyIntents, 1, animationId);
    assert.equal(state.networkCalls, 0, animationId);
    const replay = reduceG4L9P4Interaction(config, state, {type: 'replay', replay: 1});
    assert.equal(replay.score, 0, animationId);
    assert.equal(replay.questionIndex, 0, animationId);
    assert.equal(replay.feedback, 'idle', animationId);
    assert.equal(replay.networkCalls, 0, animationId);
  }
});

test('ten copied narration assets match exact source hashes without granting audio acceptance', async () => {
  const configs = await Promise.all(nonGsIds.map(configFor));
  const withAudio = configs.filter(({audio}) => audio);
  assert.equal(withAudio.length, 10);
  for (const config of withAudio) {
    const relative = config.audio!.candidatePath.replace(/^\/flash-assets/u, '');
    const bytes = await readFile(
      `${repositoryRoot}apps/web/candidate-assets/flash-assets/2026-08-22-page-only-candidates-v1${relative}`,
    );
    assert.equal(digest(bytes), config.audio!.sourceSha256, config.animationId);
    const module = await loadAnimationModule(config.animationId);
    assert(module);
    assert.equal(module.audioTracks?.length, 1);
    assert.equal(module.audioTracks?.[0]?.activation, 'user');
    assert.equal(module.audioTracks?.[0]?.spokenLanguage, 'undetermined');
  }
});

test('FQ legacy getURL/report paths are typed, memory-only, and deny-by-default', () => {
  const host = createMemoryOnlyLessonHost({
    releaseId: 'private-g4-l9-p4-representative-slice-v1',
    releaseMemberIds: [...selectedIds],
    currentAnimationId: 'course-g04-l09-fq-002',
    enabledCapabilities: ['glossary', 'fq-scoring', 'practice-feedback'],
    mode: 'audit',
    releasePublished: false,
  });
  for (const operation of ['getURL', 'report', 'final-quiz-post'] as const) {
    const decision = host.dispatch({type: 'legacy', operation});
    assert.equal(decision.status, 'blocked');
    if (decision.status === 'blocked') {
      assert.equal(decision.code, 'legacy-operation-blocked');
    }
  }
  assert.equal(host.snapshot().storage, 'memory-only');
  assert.equal(host.snapshot().storesPersonalData, false);
});
