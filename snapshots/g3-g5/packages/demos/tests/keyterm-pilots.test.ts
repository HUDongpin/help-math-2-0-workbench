import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

import acuteAngle from '../src/modules/keyterm-elementary-acute-angle';
import computeghgh from '../src/modules/keyterm-elementary-computeghgh';
import {matchPrototype} from '../src/prototype-manifest';
import {
  ACUTE_ANGLE_AUDIO_EVIDENCE,
  ACUTE_ANGLE_MOVIE,
  ACUTE_ANGLE_SOURCE,
  getAcuteAngleFrameState,
  normalizeAcuteAngleFrame
} from '../src/timelines/keyterm-acute-angle';
import {
  COMPUTEGHGH_MOVIE,
  COMPUTEGHGH_SOURCE,
  getComputeghghFrameState,
  normalizeComputeghghFrame,
  replayButtonStateForScenario,
  transitionReplayButton
} from '../src/timelines/keyterm-computeghgh';

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

test('acute-angle timeline preserves source metadata and one-indexed frames', () => {
  assert.deepEqual(ACUTE_ANGLE_MOVIE.stage, {width: 225, height: 225});
  assert.equal(ACUTE_ANGLE_MOVIE.fps, 12);
  assert.equal(ACUTE_ANGLE_MOVIE.frameCount, 60);
  assert.equal(ACUTE_ANGLE_MOVIE.durationMs, 5_000);
  assert.equal(acuteAngle.playbackMode, 'loop');
  assert.equal(ACUTE_ANGLE_SOURCE.titleEnglish, 'Acute Angle');
  assert.equal(ACUTE_ANGLE_SOURCE.titleSpanish, 'Ángulo agudo');
  assert.equal(normalizeAcuteAngleFrame(Number.NaN), 1);
  assert.equal(normalizeAcuteAngleFrame(0), 1);
  assert.equal(normalizeAcuteAngleFrame(9.9), 9);
  assert.equal(normalizeAcuteAngleFrame(61), 60);

  const first = getAcuteAngleFrameState(1, {lang: 'en'});
  const last = getAcuteAngleFrameState(60, {lang: 'es'});
  assert.equal(first.frameAsset, '/flash-assets/keyterms/acute-angle/frames/1.png');
  assert.equal(first.isFirstFrame, true);
  assert.equal(last.frameAsset, '/flash-assets/keyterms/acute-angle/frames/60.png');
  assert.equal(last.isLastFrame, true);
  assert.match(last.accessibleTitle, /ángulo agudo/i);
});

test('acute-angle does not invent a catalog-audio start frame', () => {
  assert.equal(ACUTE_ANGLE_AUDIO_EVIDENCE.startFrame, null);
  assert.equal(ACUTE_ANGLE_AUDIO_EVIDENCE.status, 'unresolved-host-cue');
  assert.equal(acuteAngle.audioCues.length, 0);
});

test('all 60 acute-angle implementation frames match the structural source export hashes', async () => {
  const manifest = JSON.parse(
    await readFile(
      `${repositoryRoot}migrations/keyterm-elementary-acute-angle/baseline/ffdec-root-frames.json`,
      'utf8'
    )
  ) as {frames: Array<{file: string; sha256: string}>};
  const assetRoot = `${repositoryRoot}public/flash-assets/keyterms/acute-angle/frames`;
  const files = (await readdir(assetRoot)).filter((file) => file.endsWith('.png'));
  assert.equal(files.length, 60);
  assert.equal(manifest.frames.length, 60);
  for (const sourceFrame of manifest.frames) {
    assert.equal(sha256(await readFile(`${assetRoot}/${sourceFrame.file}`)), sourceFrame.sha256);
  }
});

test('acute-angle renderer reports the exact deterministic frame and source asset', () => {
  const frame = 33;
  const state = acuteAngle.getFrameState(frame, {
    frame,
    lang: 'es',
    scenario: 'default',
    seed: 0
  });
  const markup = renderToStaticMarkup(
    createElement(acuteAngle.Renderer, {
      frame,
      lang: 'es',
      scenario: 'default',
      seed: 0,
      state
    })
  );
  assert.match(markup, /data-flash-frame="33"/);
  assert.match(markup, /viewBox="0 0 225 225"/);
  assert.match(markup, /acute-angle\/frames\/33\.png/);
  assert.match(markup, /Demostración de ángulo agudo/);
});

test('computeghgh timeline preserves its static 35-frame movie and source actions', () => {
  assert.deepEqual(COMPUTEGHGH_MOVIE.stage, {width: 225, height: 225});
  assert.equal(COMPUTEGHGH_MOVIE.fps, 12);
  assert.equal(COMPUTEGHGH_MOVIE.frameCount, 35);
  assert.equal(COMPUTEGHGH_MOVIE.durationMs, (35 * 1_000) / 12);
  assert.equal(COMPUTEGHGH_SOURCE.visibleTitle, 'Common Sense / Computar');
  assert.equal(COMPUTEGHGH_SOURCE.replayAction, 'gotoAndPlay(1)');
  assert.equal(COMPUTEGHGH_SOURCE.terminalAction, 'stop()');
  assert.equal(normalizeComputeghghFrame(-10), 1);
  assert.equal(normalizeComputeghghFrame(36), 35);

  for (let frame = 1; frame <= COMPUTEGHGH_MOVIE.frameCount; frame += 1) {
    const state = getComputeghghFrameState(frame, {lang: 'en', scenario: 'default'});
    assert.equal(state.sceneAsset, '/flash-assets/keyterms/computeghgh/frame.png');
    assert.equal(state.buttonState, 'up');
    assert.equal(state.stopped, frame === 35);
  }
});

test('computeghgh diagnostic button states and pointer state machine cover all source button states', () => {
  assert.equal(replayButtonStateForScenario('default'), 'up');
  assert.equal(replayButtonStateForScenario('replay-hover'), 'over');
  assert.equal(replayButtonStateForScenario('replay-pressed'), 'down');
  assert.equal(replayButtonStateForScenario('unknown'), 'up');

  assert.deepEqual(transitionReplayButton('up', 'pointer-enter'), {
    buttonState: 'over',
    replayRequested: false
  });
  assert.deepEqual(transitionReplayButton('over', 'pointer-down'), {
    buttonState: 'down',
    replayRequested: false
  });
  assert.deepEqual(transitionReplayButton('down', 'pointer-up'), {
    buttonState: 'over',
    replayRequested: false
  });
  assert.deepEqual(transitionReplayButton('over', 'activate'), {
    buttonState: 'over',
    replayRequested: true
  });
  assert.deepEqual(transitionReplayButton('over', 'pointer-leave'), {
    buttonState: 'up',
    replayRequested: false
  });
});

test('computeghgh renderer exposes deterministic up, over, and down diagnostic assets', () => {
  for (const [scenario, expected] of [
    ['default', 'up'],
    ['replay-hover', 'over'],
    ['replay-pressed', 'down']
  ] as const) {
    const frame = 35;
    const state = computeghgh.getFrameState(frame, {frame, lang: 'en', scenario, seed: 0});
    const markup = renderToStaticMarkup(
      createElement(computeghgh.Renderer, {
        frame,
        lang: 'en',
        scenario,
        seed: 0,
        state
      })
    );
    assert.match(markup, /data-flash-frame="35"/);
    assert.match(markup, new RegExp(`data-replay-state="${expected}"`));
    assert.match(markup, new RegExp(`computeghgh/buttons/${expected}\\.svg`));
    assert.match(markup, /aria-label="Replay animation"/);
  }
});

test('computeghgh implementation scene and extracted button states are present and script-free', async () => {
  const structural = JSON.parse(
    await readFile(
      `${repositoryRoot}migrations/keyterm-elementary-computeghgh/baseline/ffdec-root-frames.json`,
      'utf8'
    )
  ) as {frames: Array<{sha256: string}>};
  const assetRoot = `${repositoryRoot}public/flash-assets/keyterms/computeghgh`;
  assert.equal(sha256(await readFile(`${assetRoot}/frame.png`)), structural.frames[0]?.sha256);

  for (const state of ['up', 'over', 'down']) {
    const svg = await readFile(`${assetRoot}/buttons/${state}.svg`, 'utf8');
    assert.match(svg, /<svg\b/);
    assert.doesNotMatch(svg, /<script\b/i);
    assert.match(svg, /Replay|font_Bauhaus_Md_BT_R0/);
  }
});

test('key-term placement IDs and source basenames resolve through the shared dynamic-route manifest', () => {
  const routes = [
    {
      animationId: 'keyterm-elementary-acute-angle',
      sourcePath: 'HELP_KEYTERMS/KT/ELEMENTARY/DIG/acute_angle.swf',
      frameCount: 60
    },
    {
      animationId: 'keyterm-elementary-computeghgh',
      sourcePath: 'HELP_KEYTERMS/KT/ELEMENTARY/DIG/computeghgh.swf',
      frameCount: 35
    }
  ] as const;

  for (const route of routes) {
    const byId = matchPrototype({animationId: route.animationId});
    const bySource = matchPrototype({sourcePath: route.sourcePath});
    assert.equal(byId?.key, route.animationId);
    assert.equal(bySource?.key, route.animationId);
    assert.equal(byId?.movie.frameCount, route.frameCount);
    assert.equal(byId?.movie.stage.width, 225);
    assert.equal(byId?.movie.stage.height, 225);
  }
});
