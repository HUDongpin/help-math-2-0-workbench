import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  buildG4L3ShellControlAssetsRebind,
  parseArguments,
  run,
} from './rebind-g4-l3-shell-control-assets.mjs';

test('rebind closes the G4 shell provenance path without authority promotion', async () => {
  const {assets, manifest} = await buildG4L3ShellControlAssetsRebind();
  assert.equal(manifest.animationId, 'shell-course-g04-l03-index-local');
  assert.equal(
    manifest.source.sha256,
    '817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e',
  );
  assert.equal(manifest.upstream.lessonShellSourceBindingVerified, true);
  assert.equal(manifest.authority.freshFfdecExtractionPerformed, true);
  assert.equal(manifest.authority.actionScriptExecuted, false);
  assert.equal(manifest.authority.originalRuntimeAccepted, false);
  assert.equal(manifest.authority.strictCompletion, false);
  assert.equal(manifest.authority.publicRelease, false);
  assert.deepEqual(manifest.ffdec, {
    executable: 'ffdec',
    version: '26.2.1',
    exportFormat: 'button:svg',
    selectedCharacterIds: [340, 342],
  });
  assert.deepEqual(
    manifest.navigationControlStates.sourceButtonCharacterIds,
    [340, 342],
  );
  assert.deepEqual(
    manifest.navigationControlStates.sourceSpritePlacements,
    {
      next: {
        sourceSpriteCharacterId: 341,
        sourceButtonCharacterId: 340,
        scaleX: 0.8,
        scaleY: 0.8,
      },
      previous: {
        sourceSpriteCharacterId: 343,
        sourceButtonCharacterId: 342,
        scaleX: -0.8,
        scaleY: 0.8,
      },
    },
  );
  assert.equal(assets.length, 30);
  assert.ok(assets.every(({disabledAsset}) => disabledAsset === null));
  assert.ok(assets.every(({statesPersisted}) => statesPersisted.length === 1));
  assert.deepEqual(
    [
      'lesson-shell-navigation-up.svg',
      'lesson-shell-navigation-over.svg',
      'lesson-shell-navigation-down.svg',
    ].map((file) => {
      const {sha256, sourceCharacterIds, sourceState} =
        assets.find((asset) => asset.file === file);
      return {file, sha256, sourceCharacterIds, sourceState};
    }),
    [
      {
        file: 'lesson-shell-navigation-up.svg',
        sha256:
          '5beb704f49f7fac739a40923b7dc1f071901465e53ae8d7222bad672683c2460',
        sourceCharacterIds: [340, 342],
        sourceState: 'up',
      },
      {
        file: 'lesson-shell-navigation-over.svg',
        sha256:
          '048f66e87606c503fcd9654fdae2fb9e6574a5da503b599341b467871945bed5',
        sourceCharacterIds: [340, 342],
        sourceState: 'over',
      },
      {
        file: 'lesson-shell-navigation-down.svg',
        sha256:
          'c5d8b9bc887fab46337efd60e62dfd12f55e39ca09db327769aa91b48693151c',
        sourceCharacterIds: [340, 342],
        sourceState: 'down',
      },
    ],
  );
  assert.deepEqual(
    manifest.navigationControlStates.hoverAnimation.localHandTranslationX,
    [0, 2.95, 5.9, 8.85, 6.35, 3.8, 1.3, -1.25, -3.75, -2.8, -1.85, -0.95, 0],
  );
  assert.equal(
    manifest.navigationControlStates.hoverAnimation.files.length,
    13,
  );
  assert.deepEqual(
    manifest.navigationControlStates.navigationFreeChrome,
    {
      file: 'lesson-shell-chrome-frame-0049-without-navigation.svg',
      bytes: 286_796,
      sha256:
        '57e7e0f61b05cbf6362c833a1bd929ee1d55d58c1d88bba820f537a94fc8d969',
      sourceRootFrame: 49,
      removedSourceSpriteCharacterIds: [341, 343],
    },
  );
});

test('checked-in shell-owned assets reproduce and descriptor no longer names TS006', async () => {
  const summary = await run({mode: 'check'});
  assert.equal(summary.assetCount, 30);
  assert.equal(summary.freshFfdecExtractionPerformed, true);
  const descriptor = await readFile(new URL(
    '../apps/web/lib/g4-l3-whole-lesson-player-descriptor.ts',
    import.meta.url,
  ), 'utf8');
  assert.match(
    descriptor,
    /shell-course-g04-l03-index-local\/control-assets/,
  );
  assert.doesNotMatch(
    descriptor,
    /course-g04-l03-ts-006\/diagnostic-composite-assets/,
  );
});

test('CLI exposes dry-run, write, and check only', () => {
  assert.deepEqual(parseArguments([]), {mode: 'dry-run'});
  assert.deepEqual(parseArguments(['--write']), {mode: 'write'});
  assert.deepEqual(parseArguments(['--check']), {mode: 'check'});
  assert.throws(() => parseArguments(['--extract']), /unknown argument/);
  assert.throws(
    () => parseArguments(['--write', '--check']),
    /choose exactly one mode/,
  );
});
